from flask import Blueprint, jsonify, request
from datetime import datetime, date
from src.services.metrics_service import MetricsService
from src.models.user import db
from src.models.metrics import Integration, ResearchArticle, Discussion, Citation
import logging

metrics_bp = Blueprint('metrics', __name__)

@metrics_bp.route('/metrics/platform', methods=['GET'])
def get_platform_metrics():
    """Get current platform metrics"""
    try:
        metrics = MetricsService.get_current_metrics()
        return jsonify({
            'success': True,
            'data': metrics,
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        logging.error(f"Error fetching platform metrics: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch platform metrics'
        }), 500

@metrics_bp.route('/metrics/dashboard', methods=['GET'])
def get_dashboard_metrics():
    """Get simplified metrics for the main dashboard"""
    try:
        current_metrics = MetricsService.get_current_metrics()
        
        # Simplified format for frontend dashboard
        dashboard_data = {
            'members': current_metrics['members']['total'],
            'articles': current_metrics['articles']['published'],
            'discussions': current_metrics['discussions']['total'],
            'integrations': current_metrics['integrations']['active']
        }
        
        return jsonify({
            'success': True,
            'data': dashboard_data,
            'detailed_metrics': current_metrics,
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        logging.error(f"Error fetching dashboard metrics: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch dashboard metrics'
        }), 500

@metrics_bp.route('/metrics/historical', methods=['GET'])
def get_historical_metrics():
    """Get historical metrics for charts and trends"""
    try:
        days = request.args.get('days', 30, type=int)
        if days > 365:  # Limit to 1 year
            days = 365
            
        historical_data = MetricsService.get_historical_metrics(days)
        growth_trends = MetricsService.get_growth_trends(days)
        
        return jsonify({
            'success': True,
            'data': {
                'historical': historical_data,
                'growth_trends': growth_trends
            },
            'period_days': days,
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        logging.error(f"Error fetching historical metrics: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch historical metrics'
        }), 500

@metrics_bp.route('/metrics/research', methods=['GET'])
def get_research_metrics():
    """Get research-specific metrics"""
    try:
        research_metrics = MetricsService.get_research_impact_metrics()
        return jsonify({
            'success': True,
            'data': research_metrics,
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        logging.error(f"Error fetching research metrics: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch research metrics'
        }), 500

@metrics_bp.route('/metrics/record-daily', methods=['POST'])
def record_daily_metrics():
    """Manually trigger daily metrics recording (for admin use)"""
    try:
        daily_metrics = MetricsService.record_daily_metrics()
        return jsonify({
            'success': True,
            'data': daily_metrics.to_dict(),
            'message': 'Daily metrics recorded successfully'
        })
    except Exception as e:
        logging.error(f"Error recording daily metrics: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to record daily metrics'
        }), 500

# Integration management endpoints
@metrics_bp.route('/integrations', methods=['GET'])
def get_integrations():
    """Get list of all integrations"""
    try:
        integrations = Integration.query.all()
        return jsonify({
            'success': True,
            'data': [integration.to_dict() for integration in integrations],
            'count': len(integrations)
        })
    except Exception as e:
        logging.error(f"Error fetching integrations: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch integrations'
        }), 500

@metrics_bp.route('/integrations', methods=['POST'])
def create_integration():
    """Create a new integration"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'integration_type', 'created_by_id']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        integration = Integration(
            name=data['name'],
            description=data.get('description'),
            integration_type=data['integration_type'],
            status=data.get('status', 'active'),
            version=data.get('version'),
            api_endpoint=data.get('api_endpoint'),
            documentation_url=data.get('documentation_url'),
            created_by_id=data['created_by_id']
        )
        
        db.session.add(integration)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': integration.to_dict(),
            'message': 'Integration created successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error creating integration: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to create integration'
        }), 500

@metrics_bp.route('/integrations/<int:integration_id>/usage', methods=['POST'])
def log_integration_usage():
    """Log usage of an integration"""
    try:
        data = request.get_json()
        integration_id = request.view_args['integration_id']
        
        MetricsService.log_integration_usage(
            integration_id=integration_id,
            user_id=data.get('user_id'),
            endpoint=data.get('endpoint'),
            method=data.get('method'),
            response_code=data.get('response_code'),
            response_time_ms=data.get('response_time_ms')
        )
        
        return jsonify({
            'success': True,
            'message': 'Usage logged successfully'
        })
        
    except Exception as e:
        logging.error(f"Error logging integration usage: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to log integration usage'
        }), 500

@metrics_bp.route('/integrations/<int:integration_id>/health', methods=['PUT'])
def update_integration_health():
    """Update integration health status"""
    try:
        data = request.get_json()
        integration_id = request.view_args['integration_id']
        
        if 'health_status' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing health_status field'
            }), 400
        
        valid_statuses = ['healthy', 'warning', 'error', 'unknown']
        if data['health_status'] not in valid_statuses:
            return jsonify({
                'success': False,
                'error': f'Invalid health_status. Must be one of: {valid_statuses}'
            }), 400
        
        MetricsService.update_integration_health(integration_id, data['health_status'])
        
        return jsonify({
            'success': True,
            'message': 'Integration health updated successfully'
        })
        
    except Exception as e:
        logging.error(f"Error updating integration health: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to update integration health'
        }), 500

# Research article endpoints
@metrics_bp.route('/research/articles', methods=['GET'])
def get_research_articles():
    """Get list of research articles with metrics"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        research_type = request.args.get('type')
        
        query = ResearchArticle.query
        
        if research_type:
            query = query.filter_by(research_type=research_type)
        
        articles = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        return jsonify({
            'success': True,
            'data': [article.to_dict() for article in articles.items],
            'pagination': {
                'page': page,
                'pages': articles.pages,
                'per_page': per_page,
                'total': articles.total
            }
        })
        
    except Exception as e:
        logging.error(f"Error fetching research articles: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch research articles'
        }), 500

@metrics_bp.route('/research/articles/<int:article_id>/citation', methods=['POST'])
def add_citation():
    """Add a citation to a research article"""
    try:
        data = request.get_json()
        article_id = request.view_args['article_id']
        
        # Validate required fields
        required_fields = ['citing_work_title']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Check if article exists
        article = ResearchArticle.query.get(article_id)
        if not article:
            return jsonify({
                'success': False,
                'error': 'Research article not found'
            }), 404
        
        citation = Citation(
            article_id=article_id,
            citing_work_title=data['citing_work_title'],
            citing_work_authors=data.get('citing_work_authors'),
            citing_work_url=data.get('citing_work_url'),
            citing_work_doi=data.get('citing_work_doi'),
            citation_context=data.get('citation_context'),
            verified=data.get('verified', False)
        )
        
        db.session.add(citation)
        
        # Update article citation count
        article.citation_count += 1
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': citation.to_dict(),
            'message': 'Citation added successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error adding citation: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to add citation'
        }), 500

# Discussion endpoints
@metrics_bp.route('/discussions', methods=['GET'])
def get_discussions():
    """Get list of discussions with metrics"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        discussion_type = request.args.get('type')
        
        query = Discussion.query
        
        if discussion_type:
            query = query.filter_by(discussion_type=discussion_type)
        
        discussions = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        return jsonify({
            'success': True,
            'data': [discussion.to_dict() for discussion in discussions.items],
            'pagination': {
                'page': page,
                'pages': discussions.pages,
                'per_page': per_page,
                'total': discussions.total
            }
        })
        
    except Exception as e:
        logging.error(f"Error fetching discussions: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch discussions'
        }), 500

# Health check endpoint
@metrics_bp.route('/metrics/health', methods=['GET'])
def health_check():
    """Health check for metrics service"""
    try:
        # Basic database connectivity check
        db.session.execute('SELECT 1')
        
        return jsonify({
            'success': True,
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'service': 'metrics'
        })
    except Exception as e:
        logging.error(f"Health check failed: {str(e)}")
        return jsonify({
            'success': False,
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat(),
            'service': 'metrics'
        }), 500
