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

interface CurriculumDocument {
  id: string;
  file_name: string;
  subject?: string;
  grade_level?: string;
  status: string;
  created_at: string;
  error_message?: string;
  uploader?: {
    full_name: string;
  };
}

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
                  {doc.status === "failed" && doc.error_message && (
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
          ))
        )}
      </TableBody>
    </Table>
  );
};
