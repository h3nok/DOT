import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.models.user import db
from src.routes.user import user_bp
from src.routes.donations import donations_bp
from src.routes.metrics import metrics_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'consciousness-community-secret-key-2024'

# Enable CORS for all routes
CORS(app, supports_credentials=True)

app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(donations_bp, url_prefix='/api')
app.register_blueprint(metrics_bp, url_prefix='/api')

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    # Import all models to ensure they are registered with SQLAlchemy
    from src.models.user import ForumCategory, User
    from src.models.metrics import (
        Integration, ResearchArticle, Discussion, Citation, 
        MembershipMetrics, IntegrationUsageLog
    )
    
    db.create_all()
    
    # Create default forum categories if they don't exist
    if not ForumCategory.query.first():
        categories = [
            {'name': 'General Discussion', 'description': 'General conversations about consciousness and digital theory', 'slug': 'general-discussion', 'color': '#3B4F8C'},
            {'name': 'Q&A', 'description': 'Questions and answers about the community and topics', 'slug': 'qa', 'color': '#2DD4BF'},
            {'name': 'Study Groups', 'description': 'Collaborative learning and study sessions', 'slug': 'study-groups', 'color': '#F59E0B'},
            {'name': 'Project Collaboration', 'description': 'Working together on projects and research', 'slug': 'project-collaboration', 'color': '#10B981'},
            {'name': 'Announcements', 'description': 'Important community announcements and updates', 'slug': 'announcements', 'color': '#EF4444'}
        ]
        
        for cat_data in categories:
            category = ForumCategory(**cat_data)
            db.session.add(category)
        
        db.session.commit()
    
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
        db.session.add(admin_user)
        db.session.commit()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

