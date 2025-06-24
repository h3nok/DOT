from datetime import datetime, timedelta, date
from sqlalchemy import func, and_, or_
from src.models.user import db, User, BlogPost, ForumPost, Comment
from src.models.metrics import (
    Integration, ResearchArticle, Discussion, MembershipMetrics,
    IntegrationUsageLog, Citation
)
import json

class MetricsService:
    """Service for calculating and managing platform metrics"""
    
    @staticmethod
    def get_current_metrics():
        """Get real-time platform metrics"""
        return {
            'members': MetricsService._get_member_metrics(),
            'articles': MetricsService._get_article_metrics(),
            'discussions': MetricsService._get_discussion_metrics(),
            'integrations': MetricsService._get_integration_metrics()
        }
    
    @staticmethod
    def _get_member_metrics():
        """Calculate member-related metrics"""
        total_members = User.query.filter_by(is_active=True).count()
        
        # Active members in last 7 days
        week_ago = datetime.utcnow() - timedelta(days=7)
        active_7d = User.query.filter(
            and_(
                User.is_active == True,
                User.last_login >= week_ago
            )
        ).count()
        
        # Active members in last 30 days
        month_ago = datetime.utcnow() - timedelta(days=30)
        active_30d = User.query.filter(
            and_(
                User.is_active == True,
                User.last_login >= month_ago
            )
        ).count()
        
        # New members today
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        new_today = User.query.filter(
            and_(
                User.is_active == True,
                User.created_at >= today_start
            )
        ).count()
        
        # Growth rate (7-day)
        week_ago_start = week_ago.replace(hour=0, minute=0, second=0, microsecond=0)
        two_weeks_ago = week_ago_start - timedelta(days=7)
        
        members_this_week = User.query.filter(
            and_(
                User.is_active == True,
                User.created_at >= week_ago_start
            )
        ).count()
        
        members_last_week = User.query.filter(
            and_(
                User.is_active == True,
                User.created_at >= two_weeks_ago,
                User.created_at < week_ago_start
            )
        ).count()
        
        growth_rate = 0
        if members_last_week > 0:
            growth_rate = ((members_this_week - members_last_week) / members_last_week) * 100
        
        return {
            'total': total_members,
            'active_7d': active_7d,
            'active_30d': active_30d,
            'new_today': new_today,
            'growth_rate_7d': round(growth_rate, 2),
            'engagement_rate': round((active_7d / total_members * 100) if total_members > 0 else 0, 2)
        }
    
    @staticmethod
    def _get_article_metrics():
        """Calculate article-related metrics"""
        # Total articles (including drafts)
        total_articles = BlogPost.query.count()
        
        # Published articles only
        published_articles = BlogPost.query.filter_by(status='published').count()
        
        # Research articles specifically
        research_articles = db.session.query(ResearchArticle).join(BlogPost).filter(
            BlogPost.status == 'published'
        ).count()
        
        # Articles published this month
        month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        articles_this_month = BlogPost.query.filter(
            and_(
                BlogPost.status == 'published',
                BlogPost.published_at >= month_start
            )
        ).count()
        
        # Most viewed articles (top 5)
        top_articles = BlogPost.query.filter_by(status='published').order_by(
            BlogPost.views.desc()
        ).limit(5).all()
        
        # Average views per article
        avg_views = db.session.query(func.avg(BlogPost.views)).filter_by(status='published').scalar() or 0
        
        # Total citations
        total_citations = Citation.query.count()
        
        return {
            'total': total_articles,
            'published': published_articles,
            'research_articles': research_articles,
            'published_this_month': articles_this_month,
            'average_views': round(avg_views, 2),
            'total_citations': total_citations,
            'top_articles': [
                {
                    'id': article.id,
                    'title': article.title,
                    'views': article.views,
                    'author': article.author.username if article.author else 'Unknown'
                }
                for article in top_articles
            ]
        }
    
    @staticmethod
    def _get_discussion_metrics():
        """Calculate discussion-related metrics"""
        # Total discussions
        total_discussions = ForumPost.query.count()
        
        # Active discussions (with recent activity)
        week_ago = datetime.utcnow() - timedelta(days=7)
        active_discussions = ForumPost.query.filter(
            or_(
                ForumPost.updated_at >= week_ago,
                ForumPost.created_at >= week_ago
            )
        ).count()
        
        # Discussions by type
        discussion_types = db.session.query(
            Discussion.discussion_type,
            func.count(Discussion.id).label('count')
        ).group_by(Discussion.discussion_type).all()
        
        # Total comments across all discussions
        total_comments = Comment.query.filter(
            Comment.forum_post_id.isnot(None)
        ).count()
        
        # Average comments per discussion
        avg_comments = total_comments / total_discussions if total_discussions > 0 else 0
        
        # Most active discussions (top 5)
        top_discussions = db.session.query(
            ForumPost.id,
            ForumPost.title,
            ForumPost.views,
            func.count(Comment.id).label('comment_count')
        ).outerjoin(Comment).group_by(ForumPost.id).order_by(
            func.count(Comment.id).desc()
        ).limit(5).all()
        
        # Resolution rate for discussions that have resolution tracking
        resolved_discussions = Discussion.query.filter_by(resolution_status='resolved').count()
        total_trackable_discussions = Discussion.query.count()
        resolution_rate = (resolved_discussions / total_trackable_discussions * 100) if total_trackable_discussions > 0 else 0
        
        return {
            'total': total_discussions,
            'active_7d': active_discussions,
            'total_comments': total_comments,
            'average_comments': round(avg_comments, 2),
            'resolution_rate': round(resolution_rate, 2),
            'by_type': {dt.discussion_type: dt.count for dt in discussion_types},
            'top_discussions': [
                {
                    'id': disc.id,
                    'title': disc.title,
                    'views': disc.views,
                    'comments': disc.comment_count
                }
                for disc in top_discussions
            ]
        }
    
    @staticmethod
    def _get_integration_metrics():
        """Calculate integration-related metrics"""
        # Total integrations
        total_integrations = Integration.query.count()
        
        # Active integrations
        active_integrations = Integration.query.filter_by(status='active').count()
        
        # Integrations by type
        integration_types = db.session.query(
            Integration.integration_type,
            func.count(Integration.id).label('count')
        ).group_by(Integration.integration_type).all()
        
        # Health status distribution
        health_status = db.session.query(
            Integration.health_status,
            func.count(Integration.id).label('count')
        ).group_by(Integration.health_status).all()
        
        # Total API requests (last 30 days)
        month_ago = datetime.utcnow() - timedelta(days=30)
        api_requests_30d = IntegrationUsageLog.query.filter(
            IntegrationUsageLog.timestamp >= month_ago
        ).count()
        
        # Most used integrations
        top_integrations = db.session.query(
            Integration.name,
            Integration.total_requests,
            Integration.last_used
        ).order_by(Integration.total_requests.desc()).limit(5).all()
        
        # Average response time
        avg_response_time = db.session.query(
            func.avg(IntegrationUsageLog.response_time_ms)
        ).filter(
            IntegrationUsageLog.timestamp >= month_ago
        ).scalar() or 0
        
        return {
            'total': total_integrations,
            'active': active_integrations,
            'api_requests_30d': api_requests_30d,
            'average_response_time_ms': round(avg_response_time, 2),
            'by_type': {it.integration_type: it.count for it in integration_types},
            'health_status': {hs.health_status: hs.count for hs in health_status},
            'top_integrations': [
                {
                    'name': integ.name,
                    'total_requests': integ.total_requests,
                    'last_used': integ.last_used.isoformat() if integ.last_used else None
                }
                for integ in top_integrations
            ]
        }
    
    @staticmethod
    def record_daily_metrics():
        """Record daily snapshot of metrics for historical tracking"""
        today = date.today()
        
        # Check if today's metrics already exist
        existing = MembershipMetrics.query.filter_by(date=today).first()
        if existing:
            return existing
        
        current_metrics = MetricsService.get_current_metrics()
        
        daily_metrics = MembershipMetrics(
            date=today,
            total_members=current_metrics['members']['total'],
            active_members_7d=current_metrics['members']['active_7d'],
            active_members_30d=current_metrics['members']['active_30d'],
            new_members_today=current_metrics['members']['new_today'],
            total_articles=current_metrics['articles']['total'],
            published_articles=current_metrics['articles']['published'],
            total_discussions=current_metrics['discussions']['total'],
            active_discussions=current_metrics['discussions']['active_7d'],
            total_integrations=current_metrics['integrations']['total'],
            active_integrations=current_metrics['integrations']['active']
        )
        
        db.session.add(daily_metrics)
        db.session.commit()
        
        return daily_metrics
    
    @staticmethod
    def get_historical_metrics(days=30):
        """Get historical metrics for the specified number of days"""
        start_date = date.today() - timedelta(days=days)
        
        historical_data = MembershipMetrics.query.filter(
            MembershipMetrics.date >= start_date
        ).order_by(MembershipMetrics.date.asc()).all()
        
        return [metrics.to_dict() for metrics in historical_data]
    
    @staticmethod
    def get_growth_trends(days=30):
        """Calculate growth trends over specified period"""
        historical = MetricsService.get_historical_metrics(days)
        
        if len(historical) < 2:
            return {
                'members_growth': 0,
                'articles_growth': 0,
                'discussions_growth': 0,
                'integrations_growth': 0
            }
        
        first_day = historical[0]
        last_day = historical[-1]
        
        def calculate_growth(start_val, end_val):
            if start_val == 0:
                return 100 if end_val > 0 else 0
            return ((end_val - start_val) / start_val) * 100
        
        return {
            'members_growth': round(calculate_growth(
                first_day['total_members'], 
                last_day['total_members']
            ), 2),
            'articles_growth': round(calculate_growth(
                first_day['published_articles'], 
                last_day['published_articles']
            ), 2),
            'discussions_growth': round(calculate_growth(
                first_day['total_discussions'], 
                last_day['total_discussions']
            ), 2),
            'integrations_growth': round(calculate_growth(
                first_day['total_integrations'], 
                last_day['total_integrations']
            ), 2)
        }
    
    @staticmethod
    def log_integration_usage(integration_id, user_id=None, endpoint=None, 
                            method=None, response_code=None, response_time_ms=None):
        """Log integration usage for analytics"""
        usage_log = IntegrationUsageLog(
            integration_id=integration_id,
            user_id=user_id,
            endpoint=endpoint,
            method=method,
            response_code=response_code,
            response_time_ms=response_time_ms
        )
        
        db.session.add(usage_log)
        
        # Update integration's total requests and last used
        integration = Integration.query.get(integration_id)
        if integration:
            integration.total_requests += 1
            integration.last_used = datetime.utcnow()
        
        db.session.commit()
        
    @staticmethod
    def update_integration_health(integration_id, health_status):
        """Update integration health status"""
        integration = Integration.query.get(integration_id)
        if integration:
            integration.health_status = health_status
            integration.last_health_check = datetime.utcnow()
            db.session.commit()
    
    @staticmethod
    def get_research_impact_metrics():
        """Get research-specific impact metrics"""
        # Total research articles
        research_articles = ResearchArticle.query.count()
        
        # Peer-reviewed articles
        peer_reviewed = ResearchArticle.query.filter_by(peer_reviewed=True).count()
        
        # Total citations
        total_citations = Citation.query.count()
        
        # Average citations per article
        avg_citations = total_citations / research_articles if research_articles > 0 else 0
        
        # Research by type
        research_by_type = db.session.query(
            ResearchArticle.research_type,
            func.count(ResearchArticle.id).label('count')
        ).group_by(ResearchArticle.research_type).all()
        
        # Total downloads
        total_downloads = db.session.query(
            func.sum(ResearchArticle.download_count)
        ).scalar() or 0
        
        return {
            'total_research_articles': research_articles,
            'peer_reviewed_articles': peer_reviewed,
            'total_citations': total_citations,
            'average_citations': round(avg_citations, 2),
            'total_downloads': total_downloads,
            'peer_review_rate': round((peer_reviewed / research_articles * 100) if research_articles > 0 else 0, 2),
            'by_type': {rt.research_type: rt.count for rt in research_by_type}
        }
