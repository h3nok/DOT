from datetime import datetime, time
import schedule
import time as time_module
from src.services.metrics_service import MetricsService
from src.models.user import db
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MetricsScheduler:
    """Scheduler for automated metrics collection and maintenance tasks"""
    
    @staticmethod
    def record_daily_metrics_job():
        """Job function to record daily metrics"""
        try:
            with db.app_context():
                logger.info("Recording daily metrics...")
                daily_metrics = MetricsService.record_daily_metrics()
                logger.info(f"Daily metrics recorded: {daily_metrics.to_dict()}")
        except Exception as e:
            logger.error(f"Error recording daily metrics: {str(e)}")
    
    @staticmethod
    def cleanup_old_logs_job():
        """Job function to clean up old integration logs"""
        try:
            with db.app_context():
                from src.models.metrics import IntegrationUsageLog
                from datetime import timedelta
                
                # Delete logs older than 90 days
                cutoff_date = datetime.utcnow() - timedelta(days=90)
                old_logs = IntegrationUsageLog.query.filter(
                    IntegrationUsageLog.timestamp < cutoff_date
                ).delete()
                
                db.session.commit()
                logger.info(f"Cleaned up {old_logs} old integration logs")
        except Exception as e:
            logger.error(f"Error cleaning up old logs: {str(e)}")
    
    @staticmethod
    def health_check_integrations_job():
        """Job function to check integration health"""
        try:
            with db.app_context():
                from src.models.metrics import Integration
                import requests
                
                integrations = Integration.query.filter_by(status='active').all()
                
                for integration in integrations:
                    if integration.api_endpoint:
                        try:
                            # Simple health check - ping the endpoint
                            response = requests.get(
                                integration.api_endpoint + '/health', 
                                timeout=10
                            )
                            
                            if response.status_code == 200:
                                health_status = 'healthy'
                            else:
                                health_status = 'warning'
                                
                        except requests.exceptions.RequestException:
                            health_status = 'error'
                        
                        MetricsService.update_integration_health(
                            integration.id, 
                            health_status
                        )
                        
                        logger.info(f"Integration {integration.name} health: {health_status}")
                
        except Exception as e:
            logger.error(f"Error checking integration health: {str(e)}")
    
    @staticmethod
    def setup_scheduler():
        """Set up all scheduled jobs"""
        # Record daily metrics at 1 AM every day
        schedule.every().day.at("01:00").do(MetricsScheduler.record_daily_metrics_job)
        
        # Clean up old logs every Sunday at 2 AM
        schedule.every().sunday.at("02:00").do(MetricsScheduler.cleanup_old_logs_job)
        
        # Check integration health every 6 hours
        schedule.every(6).hours.do(MetricsScheduler.health_check_integrations_job)
        
        logger.info("Metrics scheduler setup complete")
    
    @staticmethod
    def run_scheduler():
        """Run the scheduler (blocking operation)"""
        MetricsScheduler.setup_scheduler()
        
        logger.info("Metrics scheduler started")
        while True:
            schedule.run_pending()
            time_module.sleep(60)  # Check every minute

# CLI functions for manual execution
def record_metrics_now():
    """Manually trigger metrics recording"""
    MetricsScheduler.record_daily_metrics_job()

def cleanup_logs_now():
    """Manually trigger log cleanup"""
    MetricsScheduler.cleanup_old_logs_job()

def health_check_now():
    """Manually trigger integration health check"""
    MetricsScheduler.health_check_integrations_job()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == "record":
            record_metrics_now()
        elif command == "cleanup":
            cleanup_logs_now()
        elif command == "health":
            health_check_now()
        else:
            print("Available commands: record, cleanup, health")
    else:
        # Run the scheduler
        MetricsScheduler.run_scheduler()
