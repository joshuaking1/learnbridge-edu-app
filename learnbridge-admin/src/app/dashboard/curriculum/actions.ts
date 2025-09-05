// learnbridge-admin/src/app/dashboard/curriculum/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ingestionSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  grade: z.string().min(1, "Grade is required"),
  file: z.instanceof(File).refine(f => f.type === 'application/pdf', "File must be a PDF.").refine(f => f.size > 0, "File is required."),
});

// Define a consistent state type for our form
type IngestionState = {
    success: boolean;
    error?: { message: string; };
}

export async function ingestSBCDocument(prevState: IngestionState, formData: FormData): Promise<IngestionState> {
  // FIX: The createClient function is async and must be awaited.
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { success: false, error: { message: "Not authenticated or session expired." } };

  const validatedFields = ingestionSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    const errorMessage = validatedFields.error.flatten().fieldErrors.file?.[0] || "Invalid input.";
    return { success: false, error: { message: errorMessage } };
  }

  const { subject, grade, file } = validatedFields.data;
  const filePath = `public/${user.id}/${Date.now()}-${file.name}`;

  try {
    const { error: uploadError } = await supabase.storage.from('sbc_documents').upload(filePath, file);
    if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`);

    const { data: functionResponse, error: functionError } = await supabase.functions.invoke('parse-sbc-pdf', { body: { filePath } });
    if (functionError) throw new Error(`PDF Parsing Error: ${functionError.message}`);
    
    const sanitizedText = functionResponse.text.replace(/\u0000/g, '');

    const { data: newDocument, error: dbError } = await supabase.from('sbc_curriculum_documents').insert({
        uploader_id: user.id, 
        title: `${subject} - ${grade}`, // Generate title from subject and grade
        subject, 
        grade_level: grade, 
        file_name: file.name,
        file_path: filePath, 
        raw_text: sanitizedText, 
        content: sanitizedText, // Use sanitized text as content
        status: 'pending'
    }).select('id').single();

    if (dbError || !newDocument) throw new Error(`Database Error: ${dbError?.message || "Failed to retrieve new document ID."}`);
    
    // Asynchronously invoke the embedding function (fire-and-forget)
    supabase.functions.invoke('embed-sbc-document', { body: { documentId: newDocument.id } }).catch(console.error);
    
    revalidatePath('/dashboard/curriculum');
    return { success: true };

  } catch (e: any) {
    console.error("Ingestion Pipeline Error:", e);
    // Clean up the uploaded file if any subsequent step fails
    if (filePath) {
        await supabase.storage.from('sbc_documents').remove([filePath]);
    }
    return { success: false, error: { message: e.message } };
  }
}
