// learnbridge-admin/src/app/dashboard/curriculum/page.tsx
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CurriculumUploadDialog } from "@/components/admin/CurriculumUploadDialog";
import { CurriculumTable } from "@/components/admin/CurriculumTable";

async function CurriculumManagementPage() {
  const supabase = await createClient();

  // Fetch all documents with uploader information. As an admin, we need to see everything.
  // We will create an RLS policy to allow this.
  const { data: documents, error } = await supabase
    .from("sbc_curriculum_documents")
    .select(`
      *,
      uploader:profiles(full_name)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching documents:", error);
  }

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
        <CardHeader>
          <CardTitle className="text-white">Uploaded Documents</CardTitle>
          <CardDescription className="text-slate-400">
            View and manage all uploaded curriculum documents and their processing status.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <CurriculumTable documents={documents || []} />
        </CardContent>
      </Card>
    </div>
  );
}

export default CurriculumManagementPage;
