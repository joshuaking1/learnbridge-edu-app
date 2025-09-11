// learnbridge-admin/src/app/dashboard/curriculum/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ingestionSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(100, "Subject must be less than 100 characters"),
  grade: z.string().min(1, "Grade is required").max(20, "Grade must be less than 20 characters"),
  file: z.instanceof(File)
    .refine(f => f.size > 0, "File is required.")
    .refine(f => f.type === 'application/pdf', "File must be a PDF.")
    .refine(f => f.size < 50 * 1024 * 1024, "File must be smaller than 50MB."),
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

  const formObject = Object.fromEntries(formData.entries());
  const validatedFields = ingestionSchema.safeParse(formObject);

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors;
    const firstError = errors.subject?.[0] || errors.grade?.[0] || errors.file?.[0] || "Invalid input.";
    return { success: false, error: { message: firstError } };
  }

  const { subject, grade, file } = validatedFields.data;
  
  // Sanitize file name to prevent path traversal attacks
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const timestamp = Date.now();
  const filePath = `public/${user.id}/${timestamp}-${sanitizedFileName}`;

  try {
    // Upload file to storage
    const { error: uploadError } = await supabase.storage.from('sbc_documents').upload(filePath, file);
    if (uploadError) throw new Error(`File upload failed: ${uploadError.message}`);

    // Parse PDF using edge function
    const { data: functionResponse, error: functionError } = await supabase.functions.invoke('parse-sbc-pdf', { body: { filePath } });
    if (functionError) throw new Error(`PDF parsing failed: ${functionError.message}`);
    
    if (!functionResponse?.text) {
      throw new Error("PDF parsing returned no text content");
    }
    
    const sanitizedText = functionResponse.text.replace(/\u0000/g, '');

    // Insert document record
    const { data: newDocument, error: dbError } = await supabase.from('sbc_curriculum_documents').insert({
        uploader_id: user.id, 
        title: `${subject} - Grade ${grade}`,
        subject, 
        grade_level: grade, 
        file_name: file.name,
        file_path: filePath, 
        raw_text: sanitizedText, 
        content: sanitizedText,
        status: 'processing'
    }).select('id').single();

    if (dbError || !newDocument) {
      throw new Error(`Failed to save document: ${dbError?.message || "Database error"}`);
    }
    
    // Start embedding process asynchronously
    supabase.functions.invoke('embed-sbc-document', { 
      body: { documentId: newDocument.id } 
    }).catch((err) => {
      console.error("Embedding function failed:", err);
    });
    
    revalidatePath('/dashboard/curriculum');
    return { success: true };

  } catch (e: any) {
    console.error("Ingestion Pipeline Error:", e);
    
    // Clean up uploaded file on error
    if (filePath) {
        try {
          await supabase.storage.from('sbc_documents').remove([filePath]);
        } catch (cleanupError) {
          console.error("Failed to cleanup uploaded file:", cleanupError);
        }
    }
    
    return { 
      success: false, 
      error: { 
        message: e.message || "An unexpected error occurred during document ingestion"
      } 
    };
  }
}
