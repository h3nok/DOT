from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(50), nullable=True)
    last_name = db.Column(db.String(50), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    avatar_url = db.Column(db.String(255), nullable=True)
    role = db.Column(db.String(20), default='user')  # user, teacher, moderator, admin
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    blog_posts = db.relationship('BlogPost', backref='author', lazy=True)
    forum_posts = db.relationship('ForumPost', backref='author', lazy=True)
    comments = db.relationship('Comment', backref='author', lazy=True)

    def __repr__(self):
        return f'<User {self.username}>'

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'bio': self.bio,
            'avatar_url': self.avatar_url,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }

class BlogPost(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(200), unique=True, nullable=False)
    content = db.Column(db.Text, nullable=False)
    excerpt = db.Column(db.Text, nullable=True)
    featured_image = db.Column(db.String(255), nullable=True)
    category = db.Column(db.String(50), nullable=True)
    tags = db.Column(db.String(255), nullable=True)  # Comma-separated tags
    status = db.Column(db.String(20), default='draft')  # draft, published, archived
    author_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    published_at = db.Column(db.DateTime, nullable=True)
    views = db.Column(db.Integer, default=0)
    
    # Relationships
    comments = db.relationship('Comment', backref='blog_post', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<BlogPost {self.title}>'

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'slug': self.slug,
            'content': self.content,
            'excerpt': self.excerpt,
            'featured_image': self.featured_image,
            'category': self.category,
            'tags': self.tags.split(',') if self.tags else [],
            'status': self.status,
            'author_id': self.author_id,
            'author': self.author.to_dict() if self.author else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'published_at': self.published_at.isoformat() if self.published_at else None,
            'views': self.views,
            'comment_count': len(self.comments)
        }

class ForumCategory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    slug = db.Column(db.String(100), unique=True, nullable=False)
    color = db.Column(db.String(7), default='#3B4F8C')  # Hex color
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    forum_posts = db.relationship('ForumPost', backref='category', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'slug': self.slug,
            'color': self.color,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'post_count': len(self.forum_posts)
        }

class ForumPost(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    is_pinned = db.Column(db.Boolean, default=False)
    is_locked = db.Column(db.Boolean, default=False)
    author_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('forum_category.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    views = db.Column(db.Integer, default=0)
    
    # Relationships
    comments = db.relationship('Comment', backref='forum_post', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'is_pinned': self.is_pinned,
            'is_locked': self.is_locked,
            'author_id': self.author_id,
            'author': self.author.to_dict() if self.author else None,
            'category_id': self.category_id,
            'category': self.category.to_dict() if self.category else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'views': self.views,
            'comment_count': len(self.comments)
        }

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    blog_post_id = db.Column(db.Integer, db.ForeignKey('blog_post.id'), nullable=True)
    forum_post_id = db.Column(db.Integer, db.ForeignKey('forum_post.id'), nullable=True)
    parent_id = db.Column(db.Integer, db.ForeignKey('comment.id'), nullable=True)  # For nested comments
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_deleted = db.Column(db.Boolean, default=False)
    
    # Self-referential relationship for nested comments
    replies = db.relationship('Comment', backref=db.backref('parent', remote_side=[id]), lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'content': self.content,
            'author_id': self.author_id,
            'author': self.author.to_dict() if self.author else None,
            'blog_post_id': self.blog_post_id,
            'forum_post_id': self.forum_post_id,
            'parent_id': self.parent_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_deleted': self.is_deleted,
            'reply_count': len(self.replies)
        }

class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    slug = db.Column(db.String(200), unique=True, nullable=False)
    featured_image = db.Column(db.String(255), nullable=True)
    difficulty = db.Column(db.String(20), default='beginner')  # beginner, intermediate, advanced
    estimated_duration = db.Column(db.Integer, nullable=True)  # in minutes
    instructor_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    is_published = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    instructor = db.relationship('User', backref='courses')
    lessons = db.relationship('Lesson', backref='course', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'slug': self.slug,
            'featured_image': self.featured_image,
            'difficulty': self.difficulty,
            'estimated_duration': self.estimated_duration,
            'instructor_id': self.instructor_id,
            'instructor': self.instructor.to_dict() if self.instructor else None,
            'is_published': self.is_published,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'lesson_count': len(self.lessons)
        }

class Lesson(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    video_url = db.Column(db.String(255), nullable=True)
    order_index = db.Column(db.Integer, nullable=False)
    duration = db.Column(db.Integer, nullable=True)  # in minutes
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'video_url': self.video_url,
            'order_index': self.order_index,
            'duration': self.duration,
            'course_id': self.course_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Badge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    icon = db.Column(db.String(255), nullable=True)  # URL or icon name
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'icon': self.icon,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class UserBadge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    badge_id = db.Column(db.Integer, db.ForeignKey('badge.id'), nullable=False)
    awarded_at = db.Column(db.DateTime, default=datetime.utcnow)
    badge = db.relationship('Badge', backref='user_badges')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'badge_id': self.badge_id,
            'badge': self.badge.to_dict() if self.badge else None,
            'awarded_at': self.awarded_at.isoformat() if self.awarded_at else None
        }

class Progress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lesson.id'), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    score = db.Column(db.Float, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'lesson_id': self.lesson_id,
            'completed': self.completed,
            'score': self.score,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

class Vote(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    post_type = db.Column(db.String(20), nullable=False)  # 'blog', 'forum', 'comment'
    post_id = db.Column(db.Integer, nullable=False)
    value = db.Column(db.Integer, nullable=False)  # 1 for upvote, -1 for downvote
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'post_type': self.post_type,
            'post_id': self.post_id,
            'value': self.value,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Subscription(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    subscription_id = db.Column(db.String(255), unique=True, nullable=False)  # Stripe subscription ID
    customer_id = db.Column(db.String(255), nullable=False)  # Stripe customer ID
    amount = db.Column(db.Integer, nullable=False)  # Amount in cents
    currency = db.Column(db.String(3), default='usd')
    email = db.Column(db.String(255), nullable=False)
    tier = db.Column(db.String(50), nullable=False)  # supporter, patron
    status = db.Column(db.String(20), default='active')  # active, cancelled, past_due
    current_period_start = db.Column(db.DateTime, nullable=False)
    current_period_end = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<Subscription {self.subscription_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'subscription_id': self.subscription_id,
            'customer_id': self.customer_id,
            'amount': self.amount,
            'currency': self.currency,
            'email': self.email,
            'tier': self.tier,
            'status': self.status,
            'current_period_start': self.current_period_start.isoformat() if self.current_period_start else None,
            'current_period_end': self.current_period_end.isoformat() if self.current_period_end else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Donation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Integer, nullable=False)  # Amount in cents
    currency = db.Column(db.String(3), default='usd')
    payment_intent_id = db.Column(db.String(255), unique=True, nullable=False)  # Stripe payment intent ID
    email = db.Column(db.String(255), nullable=False)
    tier = db.Column(db.String(50), nullable=True)  # custom, supporter, patron
    status = db.Column(db.String(20), default='pending')  # pending, completed, failed
    donation_type = db.Column(db.String(20), default='one_time')  # one_time, recurring
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<Donation {self.payment_intent_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'amount': self.amount,
            'currency': self.currency,
            'payment_intent_id': self.payment_intent_id,
            'email': self.email,
            'tier': self.tier,
            'status': self.status,
            'donation_type': self.donation_type,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

