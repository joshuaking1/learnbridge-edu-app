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
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ErrorDisplay } from "@/components/ui/error-display";

async function CurriculumManagementPage() {
  let documents: any[] = [];
  let fetchError: any = null;

  try {
    console.log("🚀 Initializing curriculum management page");
    
    const supabase = await createClient();
    console.log("✅ Supabase client created");

    // Fetch all documents with uploader information. As an admin, we need to see everything.
    // We will create an RLS policy to allow this.
    console.log("📡 Fetching curriculum documents...");
    
    const { data, error } = await supabase
      .from("sbc_curriculum_documents")
      .select(`
        *,
        uploader:profiles(full_name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Database error fetching documents:", error);
      fetchError = error;
    } else {
      console.log("✅ Successfully fetched documents:", { count: data?.length || 0 });
      documents = data || [];
    }
  } catch (e: any) {
    console.error("❌ Unexpected error in curriculum page:", e);
    fetchError = e;
  }

  // If there's a database error, show it in the UI
  if (fetchError) {
    return (
      <ErrorBoundary>
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

          <div className="mb-6">
            <ErrorDisplay 
              error={{
                message: "Failed to fetch curriculum documents",
                code: "DATABASE_FETCH_ERROR",
                details: {
                  supabaseError: fetchError,
                  table: "sbc_curriculum_documents",
                  operation: "SELECT with JOIN"
                },
                stack: fetchError?.stack,
                context: {
                  page: "curriculum",
                  timestamp: new Date().toISOString()
                },
                timestamp: new Date().toISOString()
              }}
              title="Database Error"
            />
          </div>

          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Uploaded Documents</CardTitle>
              <CardDescription className="text-slate-400">
                Unable to load documents due to database error.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 text-center text-slate-400">
              <p>Please check the error details above and try refreshing the page.</p>
            </CardContent>
          </Card>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
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
          <ErrorBoundary>
            <CurriculumUploadDialog />
          </ErrorBoundary>
        </div>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Uploaded Documents</CardTitle>
            <CardDescription className="text-slate-400">
              View and manage all uploaded curriculum documents and their processing status.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ErrorBoundary>
              <CurriculumTable documents={documents || []} />
            </ErrorBoundary>
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
}

export default CurriculumManagementPage;
