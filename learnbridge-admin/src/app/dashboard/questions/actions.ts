// learnbridge-admin/src/app/dashboard/questions/actions.ts
"use server";
import { createClient } from "@/lib/supabase/server";

export async function bulkUploadQuestions(questions: any[]) {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
        return { error: "Not authenticated or session expired." };
    }

    if (!Array.isArray(questions) || questions.length === 0) {
        return { error: "No questions provided or invalid format." };
    }

    if (questions.length > 1000) {
        return { error: "Too many questions. Maximum 1000 questions per upload." };
    }

    try {
        const { error } = await supabase.rpc('bulk_insert_questions', {
            questions_data: questions
        });

        if (error) {
            console.error("Bulk Insert RPC Error:", error);
            return { error: `Database error: ${error.message}` };
        }

        return { success: true, count: questions.length };
    } catch (e: any) {
        console.error("Bulk upload error:", e);
        return { error: "An unexpected error occurred during bulk upload." };
    }
}
