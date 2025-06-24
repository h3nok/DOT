from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from src.models.user import db

class Integration(db.Model):
    """Model for tracking third-party integrations and tools"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    integration_type = db.Column(db.String(50), nullable=False)  # 'research_tool', 'api', 'service', 'platform'
    status = db.Column(db.String(20), default='active')  # 'active', 'inactive', 'testing', 'deprecated'
    version = db.Column(db.String(20), nullable=True)
    api_endpoint = db.Column(db.String(255), nullable=True)
    documentation_url = db.Column(db.String(255), nullable=True)
    created_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_health_check = db.Column(db.DateTime, nullable=True)
    health_status = db.Column(db.String(20), default='unknown')  # 'healthy', 'warning', 'error', 'unknown'
    
    # Usage tracking
    total_requests = db.Column(db.Integer, default=0)
    last_used = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    created_by = db.relationship('User', backref='created_integrations')
    usage_logs = db.relationship('IntegrationUsageLog', backref='integration', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Integration {self.name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'integration_type': self.integration_type,
            'status': self.status,
            'version': self.version,
            'api_endpoint': self.api_endpoint,
            'documentation_url': self.documentation_url,
            'created_by_id': self.created_by_id,
            'created_by': self.created_by.username if self.created_by else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'last_health_check': self.last_health_check.isoformat() if self.last_health_check else None,
            'health_status': self.health_status,
            'total_requests': self.total_requests,
            'last_used': self.last_used.isoformat() if self.last_used else None,
            'usage_count_30d': len([log for log in self.usage_logs if (datetime.utcnow() - log.timestamp).days <= 30])
        }

class IntegrationUsageLog(db.Model):
    """Log integration usage for analytics"""
    id = db.Column(db.Integer, primary_key=True)
    integration_id = db.Column(db.Integer, db.ForeignKey('integration.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    endpoint = db.Column(db.String(255), nullable=True)
    method = db.Column(db.String(10), nullable=True)  # GET, POST, etc.
    response_code = db.Column(db.Integer, nullable=True)
    response_time_ms = db.Column(db.Integer, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='integration_usage_logs')

class ResearchArticle(db.Model):
    """Model for tracking research articles - extends BlogPost for research-specific features"""
    id = db.Column(db.Integer, primary_key=True)
    blog_post_id = db.Column(db.Integer, db.ForeignKey('blog_post.id'), nullable=False, unique=True)
    research_type = db.Column(db.String(50), nullable=False)  # 'theory', 'experiment', 'analysis', 'review'
    peer_reviewed = db.Column(db.Boolean, default=False)
    doi = db.Column(db.String(100), nullable=True, unique=True)  # Digital Object Identifier
    citation_count = db.Column(db.Integer, default=0)
    research_phase = db.Column(db.String(30), default='draft')  # 'draft', 'under_review', 'published', 'archived'
    keywords = db.Column(db.Text, nullable=True)  # JSON string of research keywords
    methodology = db.Column(db.Text, nullable=True)
    conclusions = db.Column(db.Text, nullable=True)
    data_availability = db.Column(db.String(50), default='on_request')  # 'public', 'on_request', 'restricted'
    funding_source = db.Column(db.String(100), nullable=True)
    collaboration_partners = db.Column(db.Text, nullable=True)  # JSON string of partner organizations
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Impact tracking
    download_count = db.Column(db.Integer, default=0)
    share_count = db.Column(db.Integer, default=0)
    bookmark_count = db.Column(db.Integer, default=0)
    
    # Relationships
    blog_post = db.relationship('BlogPost', backref=db.backref('research_article', uselist=False))
    citations = db.relationship('Citation', backref='article', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<ResearchArticle {self.blog_post.title if self.blog_post else self.id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'blog_post_id': self.blog_post_id,
            'blog_post': self.blog_post.to_dict() if self.blog_post else None,
            'research_type': self.research_type,
            'peer_reviewed': self.peer_reviewed,
            'doi': self.doi,
            'citation_count': self.citation_count,
            'research_phase': self.research_phase,
            'keywords': self.keywords,
            'methodology': self.methodology,
            'conclusions': self.conclusions,
            'data_availability': self.data_availability,
            'funding_source': self.funding_source,
            'collaboration_partners': self.collaboration_partners,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'download_count': self.download_count,
            'share_count': self.share_count,
            'bookmark_count': self.bookmark_count,
            'citation_list': [citation.to_dict() for citation in self.citations]
        }

class Citation(db.Model):
    """Track citations of research articles"""
    id = db.Column(db.Integer, primary_key=True)
    article_id = db.Column(db.Integer, db.ForeignKey('research_article.id'), nullable=False)
    citing_work_title = db.Column(db.String(200), nullable=False)
    citing_work_authors = db.Column(db.String(500), nullable=True)
    citing_work_url = db.Column(db.String(255), nullable=True)
    citing_work_doi = db.Column(db.String(100), nullable=True)
    citation_context = db.Column(db.Text, nullable=True)  # How the work was cited
    citation_date = db.Column(db.DateTime, default=datetime.utcnow)
    verified = db.Column(db.Boolean, default=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'article_id': self.article_id,
            'citing_work_title': self.citing_work_title,
            'citing_work_authors': self.citing_work_authors,
            'citing_work_url': self.citing_work_url,
            'citing_work_doi': self.citing_work_doi,
            'citation_context': self.citation_context,
            'citation_date': self.citation_date.isoformat() if self.citation_date else None,
            'verified': self.verified
        }

class Discussion(db.Model):
    """Model for community discussions - extends ForumPost for enhanced discussion features"""
    id = db.Column(db.Integer, primary_key=True)
    forum_post_id = db.Column(db.Integer, db.ForeignKey('forum_post.id'), nullable=False, unique=True)
    discussion_type = db.Column(db.String(50), nullable=False)  # 'general', 'research', 'collaboration', 'support', 'announcement'
    complexity_level = db.Column(db.String(20), default='beginner')  # 'beginner', 'intermediate', 'advanced', 'expert'
    research_area = db.Column(db.String(100), nullable=True)  # Related research area
    tags = db.Column(db.Text, nullable=True)  # JSON string of discussion tags
    is_featured = db.Column(db.Boolean, default=False)
    participation_score = db.Column(db.Float, default=0.0)  # Calculated engagement score
    resolution_status = db.Column(db.String(20), default='open')  # 'open', 'resolved', 'ongoing', 'closed'
    quality_score = db.Column(db.Float, default=0.0)  # Community-rated quality
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Engagement metrics
    unique_participants = db.Column(db.Integer, default=0)
    total_interactions = db.Column(db.Integer, default=0)
    average_response_time_hours = db.Column(db.Float, nullable=True)
    
    # Relationships
    forum_post = db.relationship('ForumPost', backref=db.backref('discussion', uselist=False))
    
    def __repr__(self):
        return f'<Discussion {self.forum_post.title if self.forum_post else self.id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'forum_post_id': self.forum_post_id,
            'forum_post': self.forum_post.to_dict() if self.forum_post else None,
            'discussion_type': self.discussion_type,
            'complexity_level': self.complexity_level,
            'research_area': self.research_area,
            'tags': self.tags,
            'is_featured': self.is_featured,
            'participation_score': self.participation_score,
            'resolution_status': self.resolution_status,
            'quality_score': self.quality_score,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'unique_participants': self.unique_participants,
            'total_interactions': self.total_interactions,
            'average_response_time_hours': self.average_response_time_hours
        }

class MembershipMetrics(db.Model):
    """Track daily membership metrics for historical data"""
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False, unique=True)
    total_members = db.Column(db.Integer, nullable=False)
    active_members_7d = db.Column(db.Integer, default=0)  # Active in last 7 days
    active_members_30d = db.Column(db.Integer, default=0)  # Active in last 30 days
    new_members_today = db.Column(db.Integer, default=0)
    churned_members_today = db.Column(db.Integer, default=0)
    total_articles = db.Column(db.Integer, default=0)
    published_articles = db.Column(db.Integer, default=0)
    total_discussions = db.Column(db.Integer, default=0)
    active_discussions = db.Column(db.Integer, default=0)
    total_integrations = db.Column(db.Integer, default=0)
    active_integrations = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.isoformat() if self.date else None,
            'total_members': self.total_members,
            'active_members_7d': self.active_members_7d,
            'active_members_30d': self.active_members_30d,
            'new_members_today': self.new_members_today,
            'churned_members_today': self.churned_members_today,
            'total_articles': self.total_articles,
            'published_articles': self.published_articles,
            'total_discussions': self.total_discussions,
            'active_discussions': self.active_discussions,
            'total_integrations': self.total_integrations,
            'active_integrations': self.active_integrations,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
