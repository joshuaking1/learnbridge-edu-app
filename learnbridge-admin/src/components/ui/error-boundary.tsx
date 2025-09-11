"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorDisplay } from './error-display';
import { Button } from './button';
import { RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ React Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Log detailed error information
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.error('🔍 Detailed error information:', errorDetails);

    // You could also send this to your error tracking service
    // reportError(errorDetails);
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  public render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorDisplayInfo = {
        message: this.state.error.message,
        code: "REACT_ERROR",
        details: {
          errorName: this.state.error.name,
          stack: this.state.error.stack,
          componentStack: this.state.errorInfo?.componentStack,
        },
        stack: this.state.error.stack,
        context: {
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          reactVersion: React.version
        },
        timestamp: new Date().toISOString()
      };

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-red-400 mb-2">
                Something went wrong
              </h2>
              <p className="text-red-200 mb-4">
                A React component error occurred. This detailed information can help debug the issue.
              </p>
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
            
            <ErrorDisplay 
              error={errorDisplayInfo}
              title="React Component Error"
              showDetails={true}
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Simple wrapper component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}