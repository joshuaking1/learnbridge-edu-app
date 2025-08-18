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
import { BrainCircuit, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTransition } from "react";
// import { performCurriculumAutopsy } from "@/app/dashboard/curriculum/actions";

const AutopsyButton = ({ documentId }: { documentId: string }) => {
  const [isPending, startTransition] = useTransition();

  const handleAutopsy = () => {
    // TODO: Implement autopsy functionality
    startTransition(() => {
      // performCurriculumAutopsy(documentId);
      console.log("Autopsy requested for document:", documentId);
    });
  };

  return (
    <Button
      onClick={handleAutopsy}
      disabled={isPending}
      size="sm"
      variant="outline"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <BrainCircuit className="h-4 w-4" />
      )}
    </Button>
  );
};

interface CurriculumDocument {
  id: string;
  file_name: string;
  status: string;
  created_at: string;
  error_message?: string;
}

export const CurriculumTable = ({
  documents,
}: {
  documents: CurriculumDocument[];
}) => {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default" as const;
      case "processing":
        return "secondary" as const;
      case "pending_autopsy":
        return "outline" as const;
      case "failed":
        return "destructive" as const;
      case "parsing":
        return "outline" as const;
      default:
        return "secondary" as const;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending_autopsy":
        return "Ready for Autopsy";
      case "parsing":
        return "Parsing PDF";
      case "processing":
        return "AI Processing";
      case "completed":
        return "Completed";
      case "failed":
        return "Failed";
      default:
        return status;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-slate-800 border-slate-700">
          <TableHead className="text-white">File Name</TableHead>
          <TableHead className="text-white">Status</TableHead>
          <TableHead className="text-white">Date</TableHead>
          <TableHead className="text-right text-white">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.length === 0 ? (
          <TableRow className="border-slate-700">
            <TableCell colSpan={4} className="text-center text-slate-400 py-8">
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
                {new Date(doc.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right text-white">
                {doc.status === "pending_autopsy" && (
                  <AutopsyButton documentId={doc.id} />
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};
