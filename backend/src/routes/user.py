from flask import Blueprint, jsonify, request, session
from flask_cors import cross_origin
from src.models.user import User, BlogPost, ForumPost, ForumCategory, Comment, Course, Lesson, db
from datetime import datetime
import re

user_bp = Blueprint('user', __name__)

# Helper function to create slug from title
def create_slug(title):
    slug = re.sub(r'[^\w\s-]', '', title.lower())
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')

# Authentication routes
@user_bp.route('/auth/register', methods=['POST'])
@cross_origin()
def register():
    data = request.json
    
    # Check if user already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    user = User(
        username=data['username'], 
        email=data['email'],
        first_name=data.get('first_name', ''),
        last_name=data.get('last_name', '')
    )
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    
    session['user_id'] = user.id
    return jsonify(user.to_dict()), 201

@user_bp.route('/auth/login', methods=['POST'])
@cross_origin()
def login():
    data = request.json
    user = User.query.filter_by(username=data['username']).first()
    
    if user and user.check_password(data['password']):
        user.last_login = datetime.utcnow()
        db.session.commit()
        session['user_id'] = user.id
        return jsonify(user.to_dict())
    
    return jsonify({'error': 'Invalid credentials'}), 401

@user_bp.route('/auth/logout', methods=['POST'])
@cross_origin()
def logout():
    session.pop('user_id', None)
    return jsonify({'message': 'Logged out successfully'})

@user_bp.route('/auth/me', methods=['GET'])
@cross_origin()
def get_current_user():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user.to_dict())

# User management routes
@user_bp.route('/users', methods=['GET'])
@cross_origin()
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@user_bp.route('/users/<int:user_id>', methods=['GET'])
@cross_origin()
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())

@user_bp.route('/users/<int:user_id>', methods=['PUT'])
@cross_origin()
def update_user(user_id):
    if 'user_id' not in session or session['user_id'] != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    user = User.query.get_or_404(user_id)
    data = request.json
    
    user.first_name = data.get('first_name', user.first_name)
    user.last_name = data.get('last_name', user.last_name)
    user.bio = data.get('bio', user.bio)
    user.avatar_url = data.get('avatar_url', user.avatar_url)
    
    db.session.commit()
    return jsonify(user.to_dict())

# Blog routes
@user_bp.route('/blog/posts', methods=['GET'])
@cross_origin()
def get_blog_posts():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    category = request.args.get('category')
    
    query = BlogPost.query.filter_by(status='published')
    
    if category:
        query = query.filter_by(category=category)
    
    posts = query.order_by(BlogPost.published_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'posts': [post.to_dict() for post in posts.items],
        'total': posts.total,
        'pages': posts.pages,
        'current_page': page
    })

@user_bp.route('/blog/posts/<slug>', methods=['GET'])
@cross_origin()
def get_blog_post(slug):
    post = BlogPost.query.filter_by(slug=slug, status='published').first_or_404()
    post.views += 1
    db.session.commit()
    return jsonify(post.to_dict())

@user_bp.route('/blog/posts', methods=['POST'])
@cross_origin()
def create_blog_post():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    slug = create_slug(data['title'])
    
    # Ensure unique slug
    counter = 1
    original_slug = slug
    while BlogPost.query.filter_by(slug=slug).first():
        slug = f"{original_slug}-{counter}"
        counter += 1
    
    post = BlogPost(
        title=data['title'],
        slug=slug,
        content=data['content'],
        excerpt=data.get('excerpt', ''),
        category=data.get('category', ''),
        tags=','.join(data.get('tags', [])),
        status=data.get('status', 'draft'),
        author_id=session['user_id']
    )
    
    if post.status == 'published':
        post.published_at = datetime.utcnow()
    
    db.session.add(post)
    db.session.commit()
    return jsonify(post.to_dict()), 201

# Forum routes
@user_bp.route('/forum/categories', methods=['GET'])
@cross_origin()
def get_forum_categories():
    categories = ForumCategory.query.all()
    return jsonify([category.to_dict() for category in categories])

@user_bp.route('/forum/categories', methods=['POST'])
@cross_origin()
def create_forum_category():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Check if user is admin or moderator
    user = User.query.get(session['user_id'])
    if user.role not in ['admin', 'moderator']:
        return jsonify({'error': 'Insufficient permissions'}), 403
    
    data = request.json
    slug = create_slug(data['name'])
    
    category = ForumCategory(
        name=data['name'],
        description=data.get('description', ''),
        slug=slug,
        color=data.get('color', '#3B4F8C')
    )
    
    db.session.add(category)
    db.session.commit()
    return jsonify(category.to_dict()), 201

@user_bp.route('/forum/posts', methods=['GET'])
@cross_origin()
def get_forum_posts():
    category_id = request.args.get('category_id', type=int)
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    query = ForumPost.query
    
    if category_id:
        query = query.filter_by(category_id=category_id)
    
    posts = query.order_by(ForumPost.is_pinned.desc(), ForumPost.updated_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'posts': [post.to_dict() for post in posts.items],
        'total': posts.total,
        'pages': posts.pages,
        'current_page': page
    })

@user_bp.route('/forum/posts', methods=['POST'])
@cross_origin()
def create_forum_post():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    
    post = ForumPost(
        title=data['title'],
        content=data['content'],
        author_id=session['user_id'],
        category_id=data['category_id']
    )
    
    db.session.add(post)
    db.session.commit()
    return jsonify(post.to_dict()), 201

@user_bp.route('/forum/posts/<int:post_id>', methods=['GET'])
@cross_origin()
def get_forum_post(post_id):
    post = ForumPost.query.get_or_404(post_id)
    post.views += 1
    db.session.commit()
    return jsonify(post.to_dict())

# Comments routes
@user_bp.route('/comments', methods=['POST'])
@cross_origin()
def create_comment():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    
    comment = Comment(
        content=data['content'],
        author_id=session['user_id'],
        blog_post_id=data.get('blog_post_id'),
        forum_post_id=data.get('forum_post_id'),
        parent_id=data.get('parent_id')
    )
    
    db.session.add(comment)
    db.session.commit()
    return jsonify(comment.to_dict()), 201

@user_bp.route('/comments/<int:comment_id>', methods=['GET'])
@cross_origin()
def get_comment_replies(comment_id):
    comment = Comment.query.get_or_404(comment_id)
    replies = Comment.query.filter_by(parent_id=comment_id).all()
    return jsonify([reply.to_dict() for reply in replies])

# Course routes
@user_bp.route('/courses', methods=['GET'])
@cross_origin()
def get_courses():
    courses = Course.query.filter_by(is_published=True).all()
    return jsonify([course.to_dict() for course in courses])

@user_bp.route('/courses/<slug>', methods=['GET'])
@cross_origin()
def get_course(slug):
    course = Course.query.filter_by(slug=slug, is_published=True).first_or_404()
    lessons = Lesson.query.filter_by(course_id=course.id).order_by(Lesson.order_index).all()
    
    course_data = course.to_dict()
    course_data['lessons'] = [lesson.to_dict() for lesson in lessons]
    
    return jsonify(course_data)

@user_bp.route('/courses', methods=['POST'])
@cross_origin()
def create_course():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Check if user is teacher, admin, or moderator
    user = User.query.get(session['user_id'])
    if user.role not in ['teacher', 'admin', 'moderator']:
        return jsonify({'error': 'Insufficient permissions'}), 403
    
    data = request.json
    slug = create_slug(data['title'])
    
    course = Course(
        title=data['title'],
        description=data.get('description', ''),
        slug=slug,
        difficulty=data.get('difficulty', 'beginner'),
        estimated_duration=data.get('estimated_duration'),
        instructor_id=session['user_id']
    )
    
    db.session.add(course)
    db.session.commit()
    return jsonify(course.to_dict()), 201

