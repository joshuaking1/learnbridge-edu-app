"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CurriculumDocument {
  id: string;
  file_name: string;
  subject?: string;
  grade_level?: string;
  status: string;
  created_at: string;
  error_message?: string;
  error_details?: any; // For storing detailed error information
  uploader?: {
    full_name: string;
  };
}

const DocumentErrorRow = ({ document }: { document: CurriculumDocument }) => {
  const [showError, setShowError] = useState(false);
  
  if (!document.error_message && document.status !== 'error' && document.status !== 'failed') {
    return null;
  }

  const errorInfo = document.error_details || {
    message: document.error_message || "Unknown error occurred",
    code: "DOCUMENT_PROCESSING_ERROR",
    context: {
      documentId: document.id,
      fileName: document.file_name,
      status: document.status
    },
    timestamp: document.created_at
  };

  return (
    <TableRow className="border-slate-700">
      <TableCell colSpan={7} className="p-0">
        <div className="border-t border-red-800/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowError(!showError)}
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20 py-2"
          >
            {showError ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
            {showError ? 'Hide' : 'Show'} Error Details
          </Button>
          
          {showError && (
            <div className="p-4 bg-slate-900/50">
              <ErrorDisplay 
                error={errorInfo}
                title={`Processing Error - ${document.file_name}`}
                className="text-xs"
                showDetails={true}
              />
            </div>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

export const CurriculumTable = ({
  documents,
}: {
  documents: CurriculumDocument[];
}) => {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "embedding_complete":
      case "completed":
        return "default" as const;
      case "processing":
        return "secondary" as const;
      case "pending":
        return "outline" as const;
      case "failed":
      case "error":
        return "destructive" as const;
      case "parsing":
        return "outline" as const;
      default:
        return "secondary" as const;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending Processing";
      case "parsing":
        return "Parsing PDF";
      case "processing":
        return "AI Processing";
      case "embedding_complete":
        return "Ready";
      case "completed":
        return "Completed";
      case "failed":
      case "error":
        return "Failed";
      default:
        return status || "Unknown";
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-slate-800 border-slate-700">
          <TableHead className="text-white">File Name</TableHead>
          <TableHead className="text-white">Subject</TableHead>
          <TableHead className="text-white">Grade</TableHead>
          <TableHead className="text-white">Status</TableHead>
          <TableHead className="text-white">Uploader</TableHead>
          <TableHead className="text-white">Date</TableHead>
          <TableHead className="text-right text-white">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.length === 0 ? (
          <TableRow className="border-slate-700">
            <TableCell colSpan={7} className="text-center text-slate-400 py-8">
              No documents uploaded yet. Upload your first SBC document to get
              started.
            </TableCell>
          </TableRow>
        ) : (
          documents.map((doc) => (
            <>
              <TableRow key={doc.id} className="border-slate-700">
                <TableCell className="font-medium text-white">
                  {doc.file_name}
                </TableCell>
                <TableCell className="text-white">
                  {doc.subject || "N/A"}
                </TableCell>
                <TableCell className="text-white">
                  {doc.grade_level || "N/A"}
                </TableCell>
                <TableCell className="text-white">
                  <div className="flex flex-col gap-1">
                    <Badge
                      variant={getStatusVariant(doc.status || "pending_autopsy")}
                    >
                      {getStatusLabel(doc.status || "pending_autopsy")}
                    </Badge>
                    {(doc.status === "failed" || doc.status === "error") && doc.error_message && (
                      <p className="text-xs text-red-400 max-w-xs truncate">
                        {doc.error_message}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-white">
                  {doc.uploader?.full_name || "N/A"}
                </TableCell>
                <TableCell className="text-white">
                  {new Date(doc.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right text-white">
                  {(doc.status === "failed" || doc.status === "error") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => {
                        // TODO: Implement retry functionality
                        console.log("Retry processing for document:", doc.id);
                      }}
                    >
                      Retry
                    </Button>
                  )}
                </TableCell>
              </TableRow>
              <DocumentErrorRow key={`${doc.id}-error`} document={doc} />
            </>
          ))
        )}
      </TableBody>
    </Table>
  );
};
