"use client";

import { useState } from "react";
import { AlertCircle, ChevronDown, ChevronRight, Copy, Clock, Bug, Database, FileX, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorInfo {
  message: string;
  code?: string;
  details?: any;
  stack?: string;
  context?: Record<string, any>;
  timestamp?: string;
}

interface ErrorDisplayProps {
  error: ErrorInfo;
  title?: string;
  className?: string;
  showDetails?: boolean;
}

export function ErrorDisplay({ 
  error, 
  title = "Error Details", 
  className = "",
  showDetails = true 
}: ErrorDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const formatJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const getErrorIcon = (code?: string) => {
    switch (code) {
      case "PROCESSING_ERROR":
        return <Bug className="h-5 w-5 text-red-400" />;
      case "AUTH_ERROR":
      case "NO_USER":
        return <FileX className="h-5 w-5 text-red-400" />;
      case "VALIDATION_ERROR":
        return <AlertCircle className="h-5 w-5 text-yellow-400" />;
      case "INIT_ERROR":
        return <Upload className="h-5 w-5 text-red-400" />;
      default:
        return <AlertCircle className="h-5 w-5 text-red-400" />;
    }
  };

  const getFailurePointIcon = (failurePoint?: string) => {
    switch (failurePoint) {
      case "file_upload":
        return <Upload className="h-4 w-4" />;
      case "pdf_parsing":
        return <FileX className="h-4 w-4" />;
      case "database_save":
        return <Database className="h-4 w-4" />;
      default:
        return <Bug className="h-4 w-4" />;
    }
  };

  return (
    <div className={`bg-red-900/20 border border-red-800/50 rounded-lg p-4 ${className}`}>
      {/* Main Error Header */}
      <div className="flex items-start gap-3">
        {getErrorIcon(error.code)}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-red-200 text-sm">{title}</h4>
            {error.timestamp && (
              <div className="flex items-center gap-1 text-xs text-red-300">
                <Clock className="h-3 w-3" />
                {new Date(error.timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>
          
          <p className="text-red-100 text-sm mt-1 break-words">
            {error.message}
          </p>
          
          {error.code && (
            <div className="mt-2">
              <span className="inline-block bg-red-800/50 text-red-200 text-xs px-2 py-1 rounded">
                {error.code}
              </span>
            </div>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyToClipboard(error.message, "message")}
          className="text-red-300 hover:text-red-200 hover:bg-red-800/30"
        >
          {copiedSection === "message" ? "✓" : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      {showDetails && (error.details || error.context || error.stack) && (
        <>
          {/* Toggle Details Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 text-red-300 hover:text-red-200 hover:bg-red-800/30 w-full justify-start"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
            {isExpanded ? "Hide" : "Show"} Technical Details
          </Button>

          {isExpanded && (
            <div className="mt-3 space-y-3">
              {/* Context Information */}
              {error.context && (
                <div className="bg-slate-900/50 rounded p-3 border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-red-200 text-sm flex items-center gap-2">
                      <Bug className="h-4 w-4" />
                      Context & Debugging Info
                    </h5>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(formatJson(error.context), "context")}
                      className="text-xs text-red-300 hover:text-red-200"
                    >
                      {copiedSection === "context" ? "✓" : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                  
                  {/* Failure Point */}
                  {error.context.failurePoint && (
                    <div className="mb-3 p-2 bg-red-900/30 rounded border border-red-800/30">
                      <div className="flex items-center gap-2 text-red-200 text-sm font-medium mb-1">
                        {getFailurePointIcon(error.context.failurePoint)}
                        Failed at: {error.context.failurePoint.replace(/_/g, ' ').toUpperCase()}
                      </div>
                      {error.context.totalDuration && (
                        <div className="text-xs text-red-300">
                          Total duration: {error.context.totalDuration}ms
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Key Context Data */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {error.context.userId && (
                      <div>
                        <span className="text-red-300">User ID:</span>
                        <div className="text-red-100 font-mono bg-slate-800 p-1 rounded mt-1">
                          {error.context.userId}
                        </div>
                      </div>
                    )}
                    
                    {error.context.filePath && (
                      <div>
                        <span className="text-red-300">File Path:</span>
                        <div className="text-red-100 font-mono bg-slate-800 p-1 rounded mt-1 break-all">
                          {error.context.filePath}
                        </div>
                      </div>
                    )}
                    
                    {error.context.formData && (
                      <div className="md:col-span-2">
                        <span className="text-red-300">Form Data:</span>
                        <pre className="text-red-100 font-mono bg-slate-800 p-2 rounded mt-1 text-xs overflow-x-auto">
                          {formatJson(error.context.formData)}
                        </pre>
                      </div>
                    )}
                  </div>
                  
                  {/* Performance Metrics */}
                  {(error.context.uploadDuration || error.context.parseDuration || error.context.dbDuration) && (
                    <div className="mt-3 p-2 bg-slate-800/50 rounded">
                      <h6 className="text-red-300 text-xs font-medium mb-2">Performance Metrics:</h6>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {error.context.uploadDuration && (
                          <div>
                            <span className="text-red-400">Upload:</span>
                            <div className="text-red-200">{error.context.uploadDuration}ms</div>
                          </div>
                        )}
                        {error.context.parseDuration && (
                          <div>
                            <span className="text-red-400">Parse:</span>
                            <div className="text-red-200">{error.context.parseDuration}ms</div>
                          </div>
                        )}
                        {error.context.dbDuration && (
                          <div>
                            <span className="text-red-400">Database:</span>
                            <div className="text-red-200">{error.context.dbDuration}ms</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Error Details */}
              {error.details && (
                <div className="bg-slate-900/50 rounded p-3 border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-red-200 text-sm">Error Details</h5>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(formatJson(error.details), "details")}
                      className="text-xs text-red-300 hover:text-red-200"
                    >
                      {copiedSection === "details" ? "✓" : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                  <pre className="text-red-100 font-mono bg-slate-800 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                    {formatJson(error.details)}
                  </pre>
                </div>
              )}

              {/* Stack Trace */}
              {error.stack && (
                <div className="bg-slate-900/50 rounded p-3 border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-red-200 text-sm">Stack Trace</h5>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(error.stack!, "stack")}
                      className="text-xs text-red-300 hover:text-red-200"
                    >
                      {copiedSection === "stack" ? "✓" : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                  <pre className="text-red-100 font-mono bg-slate-800 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}