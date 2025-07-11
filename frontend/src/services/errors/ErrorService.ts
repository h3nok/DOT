export interface ErrorLog {
  id: string;
  timestamp: Date;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  stack?: string;
  component?: string;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

class ErrorService {
  private static instance: ErrorService;
  private errorLogs: ErrorLog[] = [];
  private maxLogs = 1000;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
  }

  public static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private setupGlobalErrorHandlers(): void {
    // Handle uncaught JavaScript errors
    window.addEventListener('error', (event) => {
      this.logError(new Error(event.message), {
        component: 'Global',
        action: 'uncaught-error',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          component: 'Global',
          action: 'unhandled-rejection',
        }
      );
    });
  }

  logError(error: Error, context?: ErrorContext): void {
    const errorLog: ErrorLog = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      level: 'error',
      message: error.message,
      stack: error.stack,
      component: context?.component,
      userId: context?.userId || this.getCurrentUserId(),
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      metadata: context?.metadata,
    };

    this.addLog(errorLog);
    this.reportError(errorLog);
  }

  logWarning(message: string, context?: ErrorContext): void {
    const warningLog: ErrorLog = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      level: 'warn',
      message,
      component: context?.component,
      userId: context?.userId || this.getCurrentUserId(),
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      metadata: context?.metadata,
    };

    this.addLog(warningLog);
  }

  logInfo(message: string, context?: ErrorContext): void {
    const infoLog: ErrorLog = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      level: 'info',
      message,
      component: context?.component,
      userId: context?.userId || this.getCurrentUserId(),
      sessionId: this.sessionId,
      url: window.location.href,
      metadata: context?.metadata,
    };

    this.addLog(infoLog);
  }

  logDebug(message: string, context?: ErrorContext): void {
    if (import.meta.env.DEV) {
      const debugLog: ErrorLog = {
        id: this.generateErrorId(),
        timestamp: new Date(),
        level: 'debug',
        message,
        component: context?.component,
        userId: context?.userId || this.getCurrentUserId(),
        sessionId: this.sessionId,
        url: window.location.href,
        metadata: context?.metadata,
      };

      this.addLog(debugLog);
      console.debug(`[${debugLog.component || 'Debug'}] ${message}`, debugLog.metadata);
    }
  }

  private addLog(log: ErrorLog): void {
    this.errorLogs.unshift(log);
    
    // Keep only the most recent logs
    if (this.errorLogs.length > this.maxLogs) {
      this.errorLogs = this.errorLogs.slice(0, this.maxLogs);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      const logMethod = log.level === 'error' ? console.error : 
                       log.level === 'warn' ? console.warn : 
                       log.level === 'info' ? console.info : console.log;
      
      logMethod(`[${log.component || 'App'}] ${log.message}`, {
        timestamp: log.timestamp,
        metadata: log.metadata,
        stack: log.stack,
      });
    }
  }

  private async reportError(errorLog: ErrorLog): Promise<void> {
    // Only report errors to external service in production
    if (import.meta.env.DEV) {
      return;
    }

    try {
      // Send to error reporting service (e.g., Sentry, LogRocket, etc.)
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorLog),
      });
    } catch (reportingError) {
      console.error('Failed to report error to external service:', reportingError);
    }
  }

  private generateErrorId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private getCurrentUserId(): string | undefined {
    // Get user ID from auth context, localStorage, etc.
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id || user.userId;
      }
    } catch (error) {
      // Ignore errors when getting user ID
    }
    return undefined;
  }

  // Get recent error logs for debugging
  getRecentLogs(count: number = 50): ErrorLog[] {
    return this.errorLogs.slice(0, count);
  }

  // Get logs by level
  getLogsByLevel(level: ErrorLog['level'], count: number = 50): ErrorLog[] {
    return this.errorLogs
      .filter(log => log.level === level)
      .slice(0, count);
  }

  // Get logs by component
  getLogsByComponent(component: string, count: number = 50): ErrorLog[] {
    return this.errorLogs
      .filter(log => log.component === component)
      .slice(0, count);
  }

  // Clear logs (useful for testing)
  clearLogs(): void {
    this.errorLogs = [];
  }

  // Get error statistics
  getErrorStats(timeRangeHours: number = 24): {
    totalErrors: number;
    totalWarnings: number;
    errorsByComponent: Record<string, number>;
    errorsByHour: Record<string, number>;
  } {
    const cutoffTime = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);
    const recentLogs = this.errorLogs.filter(log => log.timestamp >= cutoffTime);

    const errorsByComponent: Record<string, number> = {};
    const errorsByHour: Record<string, number> = {};
    let totalErrors = 0;
    let totalWarnings = 0;

    recentLogs.forEach(log => {
      if (log.level === 'error') totalErrors++;
      if (log.level === 'warn') totalWarnings++;

      const component = log.component || 'Unknown';
      errorsByComponent[component] = (errorsByComponent[component] || 0) + 1;

      const hour = log.timestamp.getHours().toString().padStart(2, '0');
      errorsByHour[hour] = (errorsByHour[hour] || 0) + 1;
    });

    return {
      totalErrors,
      totalWarnings,
      errorsByComponent,
      errorsByHour,
    };
  }

  // Create error boundary helper
  createErrorBoundary(componentName: string) {
    return (error: Error, errorInfo: any) => {
      this.logError(error, {
        component: componentName,
        action: 'component-error',
        metadata: {
          componentStack: errorInfo.componentStack,
        },
      });
    };
  }
}

export default ErrorService.getInstance();
