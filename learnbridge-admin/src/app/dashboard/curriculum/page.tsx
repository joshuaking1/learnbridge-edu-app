// learnbridge-admin/src/app/dashboard/curriculum/page.tsx
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge"; // We'll add this next
import { CurriculumUploadDialog } from "@/components/admin/CurriculumUploadDialog"; // We'll build this next

async function CurriculumManagementPage() {
  const supabase = await createClient();

  // Fetch all documents. As an admin, we need to see everything.
  // We will create an RLS policy to allow this.
  const { data: documents, error } = await supabase
    .from("sbc_curriculum_documents")
    .select(`*,uploader:profiles (full_name)`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching documents:", error);
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "embedding_complete":
        return "success";
      case "processing":
        return "default";
      case "error":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Curriculum Management
          </h1>
          <p className="text-slate-400">
            Manage the source-of-truth SBC documents for the RAG AI pipeline.
          </p>
        </div>
        <CurriculumUploadDialog />
      </div>

      <Card className="bg-slate-900 border-slate-700">
        <CardContent className="p-0">
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
              {documents?.map((doc) => (
                <TableRow key={doc.id} className="border-slate-700">
                  <TableCell className="font-medium text-white">
                    {doc.file_name}
                  </TableCell>
                  <TableCell className="text-white">{doc.subject}</TableCell>
                  <TableCell className="text-white">
                    {doc.grade_level}
                  </TableCell>
                  <TableCell className="text-white">
                    <Badge variant={getStatusVariant(doc.status)}>
                      {doc.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white">
                    {doc.uploader?.full_name || "N/A"}
                  </TableCell>
                  <TableCell className="text-white">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right text-white">
                    {/* Action buttons will go here */}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default CurriculumManagementPage;
