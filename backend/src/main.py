import os
import sys
import typing
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import flask
import flask_cors
import src.models.user
import src.routes.user
import src.routes.donations
import src.routes.metrics
import src.routes.twin
import src.routes.profile
import src.routes.auth
import src.routes.publications

app = flask.Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'consciousness-community-secret-key-2024'

# Enable CORS for all routes
flask_cors.CORS(app, supports_credentials=True)

app.register_blueprint(src.routes.user.user_bp, url_prefix='/api')
app.register_blueprint(src.routes.donations.donations_bp, url_prefix='/api')
app.register_blueprint(src.routes.metrics.metrics_bp, url_prefix='/api')
app.register_blueprint(src.routes.twin.twin_bp, url_prefix='/api')
app.register_blueprint(src.routes.profile.profile_bp, url_prefix='/api')
app.register_blueprint(src.routes.auth.auth_bp, url_prefix='/api')
app.register_blueprint(src.routes.publications.publications_bp, url_prefix='/api')

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
src.models.user.db.init_app(app)

with app.app_context():
    # Import all models to ensure they are registered with SQLAlchemy
    from src.models.user import ForumCategory, User
    from src.models.metrics import (
        Integration, ResearchArticle, Discussion, Citation, 
        MembershipMetrics, IntegrationUsageLog
    )
    
    src.models.user.db.create_all()
    
    # Create default forum categories if they don't exist
    if not ForumCategory.query.first():
        categories: list[dict[str, str]] = [
            {'name': 'General Discussion', 'description': 'General conversations about consciousness and digital theory', 'slug': 'general-discussion', 'color': '#3B4F8C'},
            {'name': 'Q&A', 'description': 'Questions and answers about the community and topics', 'slug': 'qa', 'color': '#2DD4BF'},
            {'name': 'Study Groups', 'description': 'Collaborative learning and study sessions', 'slug': 'study-groups', 'color': '#F59E0B'},
            {'name': 'Project Collaboration', 'description': 'Working together on projects and research', 'slug': 'project-collaboration', 'color': '#10B981'},
            {'name': 'Announcements', 'description': 'Important community announcements and updates', 'slug': 'announcements', 'color': '#EF4444'}
        ]
        
        for cat_data: dict[str, str] in categories:
            category = ForumCategory(**cat_data)
            src.models.user.db.session.add(category)
        
        src.models.user.db.session.commit()
    
    # Create admin user if it doesn't exist
    if not User.query.filter_by(username='admin').first():
        admin_user = User(
            username='admin',
            email='admin@consciousness-community.com',
            first_name='Admin',
            last_name='User',
            role='admin',
            bio='Community administrator and founder'
        )
        admin_user.set_password('admin123')  # Change this in production!
        src.models.user.db.session.add(admin_user)
        src.models.user.db.session.commit()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path) -> tuple[typing.Literal['Static folder not configured'], typing.Literal[404]] | flask.Response | tuple[typing.Literal['index.html not found'], typing.Literal[404]]:
    static_folder_path: str | None = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return flask.send_from_directory(static_folder_path, path)
    else:
        index_path: str = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return flask.send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

