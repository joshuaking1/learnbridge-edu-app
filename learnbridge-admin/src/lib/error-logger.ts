// Enhanced error logging utility for debugging
export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  userAgent?: string;
  url?: string;
  timestamp?: string;
  buildId?: string;
  [key: string]: any;
}

export interface DetailedError {
  message: string;
  code?: string;
  details?: any;
  stack?: string;
  context?: ErrorContext;
  timestamp?: string;
}

class ErrorLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isClient = typeof window !== 'undefined';

  private getBaseContext(): ErrorContext {
    const context: ErrorContext = {
      timestamp: new Date().toISOString(),
    };

    if (this.isClient) {
      context.userAgent = navigator.userAgent;
      context.url = window.location.href;
    }

    return context;
  }

  /**
   * Log a detailed error with comprehensive debugging information
   */
  logError(
    error: Error | string,
    code?: string,
    additionalContext?: Record<string, any>
  ): DetailedError {
    const baseContext = this.getBaseContext();
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    const detailedError: DetailedError = {
      message: errorObj.message,
      code: code || 'UNKNOWN_ERROR',
      details: {
        name: errorObj.name,
        stack: errorObj.stack,
        ...additionalContext
      },
      stack: errorObj.stack,
      context: {
        ...baseContext,
        ...additionalContext
      },
      timestamp: new Date().toISOString()
    };

    // Console logging with emoji indicators for easy scanning
    console.group(`❌ Error: ${detailedError.code}`);
    console.error('Message:', detailedError.message);
    console.error('Details:', detailedError.details);
    console.error('Context:', detailedError.context);
    if (detailedError.stack) {
      console.error('Stack:', detailedError.stack);
    }
    console.groupEnd();

    // In development, also log as table for better readability
    if (this.isDevelopment) {
      console.table({
        Code: detailedError.code,
        Message: detailedError.message,
        Timestamp: detailedError.timestamp,
        Component: detailedError.context?.component || 'Unknown',
        Action: detailedError.context?.action || 'Unknown'
      });
    }

    return detailedError;
  }

  /**
   * Log server action errors with specific formatting
   */
  logServerActionError(
    error: Error | string,
    actionName: string,
    formData?: FormData,
    additionalContext?: Record<string, any>
  ): DetailedError {
    const context: Record<string, any> = {
      component: 'ServerAction',
      action: actionName,
      ...additionalContext
    };

    if (formData) {
      context.formData = Object.fromEntries(formData.entries());
    }

    return this.logError(error, `SERVER_ACTION_${actionName.toUpperCase()}`, context);
  }

  /**
   * Log database errors with query information
   */
  logDatabaseError(
    error: Error | string,
    operation: string,
    table?: string,
    additionalContext?: Record<string, any>
  ): DetailedError {
    return this.logError(error, 'DATABASE_ERROR', {
      component: 'Database',
      action: operation,
      table,
      ...additionalContext
    });
  }

  /**
   * Log client-side React errors
   */
  logReactError(
    error: Error | string,
    componentName?: string,
    additionalContext?: Record<string, any>
  ): DetailedError {
    return this.logError(error, 'REACT_ERROR', {
      component: componentName || 'Unknown',
      action: 'render',
      ...additionalContext
    });
  }

  /**
   * Log API/Network errors
   */
  logNetworkError(
    error: Error | string,
    endpoint?: string,
    method?: string,
    statusCode?: number,
    additionalContext?: Record<string, any>
  ): DetailedError {
    return this.logError(error, 'NETWORK_ERROR', {
      component: 'API',
      action: 'request',
      endpoint,
      method,
      statusCode,
      ...additionalContext
    });
  }

  /**
   * Log performance issues
   */
  logPerformanceIssue(
    message: string,
    duration: number,
    threshold: number,
    operation: string,
    additionalContext?: Record<string, any>
  ): DetailedError {
    return this.logError(
      `Performance issue: ${message} (${duration}ms > ${threshold}ms)`,
      'PERFORMANCE_ISSUE',
      {
        component: 'Performance',
        action: operation,
        duration,
        threshold,
        ...additionalContext
      }
    );
  }

  /**
   * Log success events with timing information
   */
  logSuccess(
    message: string,
    operation: string,
    duration?: number,
    additionalContext?: Record<string, any>
  ): void {
    const context = {
      ...this.getBaseContext(),
      action: operation,
      duration,
      ...additionalContext
    };

    console.group(`✅ Success: ${operation}`);
    console.log('Message:', message);
    console.log('Duration:', duration ? `${duration}ms` : 'N/A');
    console.log('Context:', context);
    console.groupEnd();

    if (this.isDevelopment && duration) {
      console.table({
        Operation: operation,
        Message: message,
        Duration: `${duration}ms`,
        Timestamp: context.timestamp
      });
    }
  }

  /**
   * Start a performance timer
   */
  startTimer(operation: string): () => number {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      console.log(`⏱️ ${operation}: ${duration}ms`);
      return duration;
    };
  }

  /**
   * Create a detailed error object without logging (for UI display)
   */
  createError(
    error: Error | string,
    code?: string,
    additionalContext?: Record<string, any>
  ): DetailedError {
    const baseContext = this.getBaseContext();
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    return {
      message: errorObj.message,
      code: code || 'UNKNOWN_ERROR',
      details: {
        name: errorObj.name,
        stack: errorObj.stack,
        ...additionalContext
      },
      stack: errorObj.stack,
      context: {
        ...baseContext,
        ...additionalContext
      },
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger();

// Convenience functions
export const logError = errorLogger.logError.bind(errorLogger);
export const logServerActionError = errorLogger.logServerActionError.bind(errorLogger);
export const logDatabaseError = errorLogger.logDatabaseError.bind(errorLogger);
export const logReactError = errorLogger.logReactError.bind(errorLogger);
export const logNetworkError = errorLogger.logNetworkError.bind(errorLogger);
export const logPerformanceIssue = errorLogger.logPerformanceIssue.bind(errorLogger);
export const logSuccess = errorLogger.logSuccess.bind(errorLogger);
export const startTimer = errorLogger.startTimer.bind(errorLogger);
export const createError = errorLogger.createError.bind(errorLogger);