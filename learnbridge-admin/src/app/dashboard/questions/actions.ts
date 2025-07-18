// learnbridge-admin/src/app/dashboard/questions/actions.ts
"use server";
import { createClient } from "@/lib/supabase/server";

export async function bulkUploadQuestions(questions: any[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated." };

    // Here you would add Zod validation to ensure the `questions` array is structured correctly.
    // For brevity, we will trust the client-side validation for this blueprint.

    const { error } = await supabase.rpc('bulk_insert_questions', {
        questions_data: questions
    });

    if (error) {
        console.error("Bulk Insert RPC Error:", error);
        return { error: `Database error: ${error.message}` };
    }

    return { success: true, count: questions.length };
}
