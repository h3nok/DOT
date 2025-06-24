#!/usr/bin/env python3
"""
Database initialization script for Digital Organisms Theory platform.
This script creates sample data structures for production-ready metrics.
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from datetime import datetime, timedelta
from src.models.user import db, User, BlogPost, ForumPost, Comment, ForumCategory
from src.models.metrics import (
    Integration, ResearchArticle, Discussion, Citation, 
    MembershipMetrics, IntegrationUsageLog
)
from src.services.metrics_service import MetricsService

def create_sample_integrations():
    """Create sample integrations for the platform"""
    integrations_data = [
        {
            'name': 'OpenAI API',
            'description': 'Integration with OpenAI for AI-powered research analysis',
            'integration_type': 'api',
            'status': 'active',
            'version': 'v1.0',
            'api_endpoint': 'https://api.openai.com',
            'documentation_url': 'https://platform.openai.com/docs',
            'health_status': 'healthy'
        },
        {
            'name': 'Jupyter Notebooks',
            'description': 'Interactive research notebook environment',
            'integration_type': 'research_tool',
            'status': 'active',
            'version': '6.5.4',
            'documentation_url': 'https://jupyter.org/documentation',
            'health_status': 'healthy'
        },
        {
            'name': 'ArXiv API',
            'description': 'Access to academic papers and preprints',
            'integration_type': 'api',
            'status': 'active',
            'version': 'v1.0',
            'api_endpoint': 'http://export.arxiv.org/api',
            'documentation_url': 'https://arxiv.org/help/api',
            'health_status': 'healthy'
        },
        {
            'name': 'GitHub Integration',
            'description': 'Source code repository integration',
            'integration_type': 'platform',
            'status': 'active',
            'version': 'v4',
            'api_endpoint': 'https://api.github.com',
            'documentation_url': 'https://docs.github.com/en/rest',
            'health_status': 'healthy'
        },
        {
            'name': 'Slack Notifications',
            'description': 'Community notifications and alerts',
            'integration_type': 'service',
            'status': 'active',
            'version': '2.0',
            'api_endpoint': 'https://slack.com/api',
            'documentation_url': 'https://api.slack.com',
            'health_status': 'healthy'
        }
    ]
    
    admin_user = User.query.filter_by(username='admin').first()
    if not admin_user:
        print("Admin user not found. Please create an admin user first.")
        return
    
    for integration_data in integrations_data:
        existing = Integration.query.filter_by(name=integration_data['name']).first()
        if not existing:
            integration = Integration(
                created_by_id=admin_user.id,
                **integration_data
            )
            db.session.add(integration)
            print(f"Created integration: {integration_data['name']}")
    
    db.session.commit()

def create_sample_research_articles():
    """Create sample research articles"""
    # First create some blog posts
    admin_user = User.query.filter_by(username='admin').first()
    if not admin_user:
        print("Admin user not found. Please create an admin user first.")
        return
    
    articles_data = [
        {
            'title': 'Introduction to Digital Organisms Theory',
            'content': '''This foundational paper introduces the core concepts of Digital Organisms Theory, 
            exploring how consciousness and emergent behavior can arise in digital systems.''',
            'research_type': 'theory',
            'peer_reviewed': True,
            'keywords': 'digital consciousness, emergence, artificial life, complexity theory'
        },
        {
            'title': 'Experimental Framework for Digital Consciousness',
            'content': '''We present a comprehensive experimental framework for studying digital consciousness 
            patterns in simulated environments.''',
            'research_type': 'experiment',
            'peer_reviewed': False,
            'keywords': 'experimental design, digital consciousness, simulation, methodology'
        },
        {
            'title': 'Emergence Patterns in Digital Ecosystems',
            'content': '''Analysis of emergence patterns observed in complex digital ecosystems 
            and their implications for understanding digital consciousness.''',
            'research_type': 'analysis',
            'peer_reviewed': True,
            'keywords': 'emergence, digital ecosystems, pattern analysis, complex systems'
        }
    ]
    
    for article_data in articles_data:
        # Create blog post first
        blog_post = BlogPost(
            title=article_data['title'],
            slug=article_data['title'].lower().replace(' ', '-'),
            content=article_data['content'],
            excerpt=article_data['content'][:200] + '...',
            category='research',
            status='published',
            author_id=admin_user.id,
            published_at=datetime.utcnow()
        )
        db.session.add(blog_post)
        db.session.flush()  # Get the ID
        
        # Create research article
        research_article = ResearchArticle(
            blog_post_id=blog_post.id,
            research_type=article_data['research_type'],
            peer_reviewed=article_data['peer_reviewed'],
            keywords=article_data['keywords'],
            research_phase='published',
            data_availability='on_request'
        )
        db.session.add(research_article)
        
        print(f"Created research article: {article_data['title']}")
    
    db.session.commit()

def create_sample_discussions():
    """Create sample discussions"""
    admin_user = User.query.filter_by(username='admin').first()
    general_category = ForumCategory.query.filter_by(slug='general-discussion').first()
    
    if not admin_user or not general_category:
        print("Required data not found. Please ensure admin user and categories exist.")
        return
    
    discussions_data = [
        {
            'title': 'Welcome to Digital Organisms Theory Community',
            'content': '''Welcome to our research community! This is a place for discussing digital consciousness, 
            emergence patterns, and artificial life research.''',
            'discussion_type': 'announcement',
            'complexity_level': 'beginner'
        },
        {
            'title': 'Question about Emergence Metrics',
            'content': '''I'm working on measuring emergence in digital systems. What metrics do you recommend 
            for quantifying emergent behavior?''',
            'discussion_type': 'research',
            'complexity_level': 'intermediate'
        },
        {
            'title': 'Collaboration: Digital Consciousness Simulation',
            'content': '''Looking for collaborators on a digital consciousness simulation project. 
            We need expertise in complex systems and AI.''',
            'discussion_type': 'collaboration',
            'complexity_level': 'advanced'
        }
    ]
    
    for discussion_data in discussions_data:
        # Create forum post first
        forum_post = ForumPost(
            title=discussion_data['title'],
            content=discussion_data['content'],
            author_id=admin_user.id,
            category_id=general_category.id
        )
        db.session.add(forum_post)
        db.session.flush()  # Get the ID
        
        # Create discussion
        discussion = Discussion(
            forum_post_id=forum_post.id,
            discussion_type=discussion_data['discussion_type'],
            complexity_level=discussion_data['complexity_level'],
            research_area='digital_consciousness'
        )
        db.session.add(discussion)
        
        print(f"Created discussion: {discussion_data['title']}")
    
    db.session.commit()

def create_historical_metrics():
    """Create historical metrics data for the past 30 days"""
    print("Creating historical metrics data...")
    
    # Start from 30 days ago
    start_date = datetime.utcnow().date() - timedelta(days=30)
    
    for i in range(30):
        current_date = start_date + timedelta(days=i)
        
        # Simulate growing metrics over time
        base_members = 1000 + (i * 8)  # Growing membership
        base_articles = 50 + (i * 2)   # Growing content
        base_discussions = 100 + (i * 3) # Growing engagement
        base_integrations = 5          # Stable integrations
        
        daily_metrics = MembershipMetrics(
            date=current_date,
            total_members=base_members,
            active_members_7d=int(base_members * 0.3),
            active_members_30d=int(base_members * 0.6),
            new_members_today=8 if i > 0 else 1000,  # Initial vs daily growth
            total_articles=base_articles,
            published_articles=int(base_articles * 0.8),
            total_discussions=base_discussions,
            active_discussions=int(base_discussions * 0.2),
            total_integrations=base_integrations,
            active_integrations=base_integrations
        )
        
        db.session.add(daily_metrics)
    
    db.session.commit()
    print("Historical metrics created successfully")

def initialize_production_database():
    """Initialize the database with production-ready structure"""
    print("Initializing production database...")
    
    try:
        # Create all tables
        db.create_all()
        print("Database tables created")
        
        # Create sample data
        create_sample_integrations()
        create_sample_research_articles()
        create_sample_discussions()
        create_historical_metrics()
        
        # Record current day's metrics
        current_metrics = MetricsService.record_daily_metrics()
        print(f"Current metrics recorded: {current_metrics.to_dict()}")
        
        print("\n✅ Database initialization complete!")
        print("\nYour platform now has:")
        
        # Display current metrics
        metrics = MetricsService.get_current_metrics()
        print(f"- {metrics['members']['total']} members")
        print(f"- {metrics['articles']['published']} published articles")
        print(f"- {metrics['discussions']['total']} discussions")
        print(f"- {metrics['integrations']['active']} active integrations")
        
        print("\nNext steps:")
        print("1. Start the Flask server: python src/main.py")
        print("2. Access metrics at: /api/metrics/dashboard")
        print("3. Set up the scheduler: python src/scheduler/metrics_scheduler.py")
        
    except Exception as e:
        print(f"❌ Error initializing database: {str(e)}")
        db.session.rollback()

if __name__ == "__main__":
    from src.main import app
    
    with app.app_context():
        initialize_production_database()
