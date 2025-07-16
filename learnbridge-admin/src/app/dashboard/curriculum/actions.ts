// src/app/admin/curriculum/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

type ActionState = {
  success: boolean;
  error: null | { message: string };
};

const ingestionSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  grade: z.string().min(1, "Grade is required"),
  file: z.instanceof(File).refine(f => f.type === 'application/pdf', "File must be a PDF.").refine(f => f.size > 0, "File is required."),
});

export async function ingestSBCDocument(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { message: "Not authenticated." } };

  const validation = ingestionSchema.safeParse({
    subject: formData.get('subject'),
    grade: formData.get('grade'),
    file: formData.get('file'),
  });

  if (!validation.success) {
    const errorMessage = Object.values(validation.error.flatten().fieldErrors).flat().join(', ');
    return { success: false, error: { message: errorMessage } };
  }

  const { subject, grade, file } = validation.data;
  const filePath = `public/${user.id}/${Date.now()}-${file.name}`;
  
  // 1. Upload the raw PDF to storage
  const { error: uploadError } = await supabase.storage
    .from('sbc_documents')
    .upload(filePath, file);

  if (uploadError) {
    console.error("Storage Error:", uploadError);
    return { success: false, error: { message: "Failed to upload PDF." } };
  }

  // 2. Invoke the Edge Function to parse the PDF
  let parsedText: string;
  try {
    const { data: functionResponse, error: functionError } = await supabase.functions.invoke('parse-sbc-pdf', {
      body: { filePath },
    });

    if (functionError) throw functionError;
    if (functionResponse.error) throw new Error(functionResponse.error);

    parsedText = functionResponse.text;

  } catch (parseError) {
    console.error("Edge Function Invocation Error:", parseError);
    await supabase.storage.from('sbc_documents').remove([filePath]);
    return { success: false, error: { message: `Failed to parse PDF via Edge Function: ${parseError.message}` } };
  }

  // 3. Insert metadata and extracted text into the database
  const { data: newDocument, error: dbError } = await supabase
    .from('sbc_curriculum_documents')
    .insert({
      uploader_id: user.id, subject, grade_level: grade,
      file_name: file.name, file_path: filePath,
      raw_text: parsedText, status: 'pending'
    })
    .select('id')
    .single();

  if (dbError || !newDocument) {
    console.error("DB Insert Error:", dbError);
    await supabase.storage.from('sbc_documents').remove([filePath]);
    return { success: false, error: { message: "Failed to save document metadata." } };
  }

  // 4. Asynchronously invoke the embedding function (don't await it)
  // This allows the UI to respond immediately while the embedding happens in the background.
  supabase.functions.invoke('embed-sbc-document', {
      body: { documentId: newDocument.id },
  }).catch(console.error);
  
  revalidatePath('/curriculum');
  return { success: true, error: null };
}