// learnbridge-admin/src/app/dashboard/curriculum/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logServerActionError, logSuccess, startTimer } from "@/lib/error-logger";

const ingestionSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(100, "Subject must be less than 100 characters"),
  grade: z.string().min(1, "Grade is required").max(20, "Grade must be less than 20 characters"),
  file: z.instanceof(File)
    .refine(f => f.size > 0, "File is required.")
    .refine(f => f.type === 'application/pdf', "File must be a PDF.")
    .refine(f => f.size < 50 * 1024 * 1024, "File must be smaller than 50MB."),
});

// Define a comprehensive state type for our form with detailed error info
type IngestionState = {
    success: boolean;
    error?: { 
        message: string;
        code?: string;
        details?: any;
        stack?: string;
        context?: Record<string, any>;
        timestamp?: string;
    };
}

export async function ingestSBCDocument(prevState: IngestionState, formData: FormData): Promise<IngestionState> {
  const endTimer = startTimer("ingestSBCDocument");
  let context: Record<string, any> = {
    formDataKeys: Array.from(formData.keys()),
  };

  try {
    console.log("🚀 Starting curriculum document ingestion", { context });
    
    // FIX: The createClient function is async and must be awaited.
    const supabase = await createClient();
    context.supabaseInitialized = true;
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("❌ Authentication error:", userError);
      return { 
        success: false, 
        error: { 
          message: "Authentication failed", 
          code: "AUTH_ERROR",
          details: userError,
          stack: userError?.stack || new Error().stack,
          context,
          timestamp: new Date().toISOString()
        } 
      };
    }
    
    if (!user) {
      console.error("❌ No user found in session");
      return { 
        success: false, 
        error: { 
          message: "No authenticated user found", 
          code: "NO_USER",
          context,
          timestamp: new Date().toISOString()
        } 
      };
    }
    
    context.userId = user.id;
    context.userEmail = user.email;
    console.log("✅ User authenticated:", { userId: user.id, email: user.email });

    const formObject = Object.fromEntries(formData.entries());
    context.formData = {
      subject: formObject.subject,
      grade: formObject.grade,
      fileName: formObject.file?.name,
      fileSize: formObject.file?.size,
      fileType: formObject.file?.type,
    };
    
    console.log("📝 Form data parsed:", context.formData);
    
    const validatedFields = ingestionSchema.safeParse(formObject);

    if (!validatedFields.success) {
      const errors = validatedFields.error.flatten();
      console.error("❌ Validation failed:", errors);
      
      return { 
        success: false, 
        error: { 
          message: "Form validation failed", 
          code: "VALIDATION_ERROR",
          details: {
            fieldErrors: errors.fieldErrors,
            formErrors: errors.formErrors,
            issues: validatedFields.error.issues
          },
          context,
          timestamp: new Date().toISOString()
        } 
      };
    }
    
    console.log("✅ Validation passed");
  } catch (initError: any) {
    console.error("❌ Initialization error:", initError);
    return {
      success: false,
      error: {
        message: "Failed to initialize document ingestion",
        code: "INIT_ERROR", 
        details: initError,
        stack: initError?.stack,
        context,
        timestamp: new Date().toISOString()
      }
    };
  }

  const { subject, grade, file } = validatedFields.data;
  
  // Sanitize file name to prevent path traversal attacks
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const timestamp = Date.now();
  const filePath = `public/${user.id}/${timestamp}-${sanitizedFileName}`;
  
  context.filePath = filePath;
  context.sanitizedFileName = sanitizedFileName;
  context.originalFileName = file.name;
  
  console.log("📂 File processing started:", { filePath, sanitizedFileName });

  try {
    // Step 1: Upload file to storage
    console.log("📤 Uploading file to storage...");
    const uploadStartTime = Date.now();
    
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('sbc_documents')
      .upload(filePath, file);
      
    const uploadDuration = Date.now() - uploadStartTime;
    context.uploadDuration = uploadDuration;
    
    if (uploadError) {
      console.error("❌ File upload failed:", uploadError);
      throw new Error(`File upload failed: ${uploadError.message}`);
    }
    
    console.log("✅ File uploaded successfully:", { 
      path: uploadData?.path, 
      duration: uploadDuration 
    });
    context.uploadSuccess = true;
    context.uploadedPath = uploadData?.path;

    // Step 2: Parse PDF using edge function
    console.log("🔍 Starting PDF parsing...");
    const parseStartTime = Date.now();
    
    const { data: functionResponse, error: functionError } = await supabase.functions
      .invoke('parse-sbc-pdf', { 
        body: { filePath },
        headers: { 'Content-Type': 'application/json' }
      });
      
    const parseDuration = Date.now() - parseStartTime;
    context.parseDuration = parseDuration;
    
    if (functionError) {
      console.error("❌ PDF parsing function error:", functionError);
      throw new Error(`PDF parsing failed: ${functionError.message}`);
    }
    
    console.log("📄 PDF function response received:", { 
      hasText: !!functionResponse?.text,
      textLength: functionResponse?.text?.length,
      duration: parseDuration
    });
    
    if (!functionResponse?.text) {
      console.error("❌ PDF parsing returned empty response:", functionResponse);
      throw new Error("PDF parsing returned no text content");
    }
    
    const sanitizedText = functionResponse.text.replace(/\u0000/g, '');
    context.textLength = sanitizedText.length;
    context.parseSuccess = true;
    
    console.log("✅ PDF parsed successfully:", { textLength: sanitizedText.length });

    // Step 3: Insert document record
    console.log("💾 Saving document to database...");
    const dbStartTime = Date.now();
    
    const documentData = {
        uploader_id: user.id, 
        title: `${subject} - Grade ${grade}`,
        subject, 
        grade_level: grade, 
        file_name: file.name,
        file_path: filePath, 
        raw_text: sanitizedText, 
        content: sanitizedText,
        status: 'processing'
    };
    
    console.log("📊 Document data prepared:", { 
      title: documentData.title,
      subject: documentData.subject,
      grade: documentData.grade_level,
      textLength: documentData.raw_text.length
    });
    
    const { data: newDocument, error: dbError } = await supabase
      .from('sbc_curriculum_documents')
      .insert(documentData)
      .select('id')
      .single();
      
    const dbDuration = Date.now() - dbStartTime;
    context.dbDuration = dbDuration;

    if (dbError) {
      console.error("❌ Database insert failed:", dbError);
      throw new Error(`Failed to save document: ${dbError.message}`);
    }
    
    if (!newDocument) {
      console.error("❌ No document returned from insert");
      throw new Error("Database insert succeeded but no document was returned");
    }
    
    console.log("✅ Document saved to database:", { 
      documentId: newDocument.id,
      duration: dbDuration
    });
    
    context.documentId = newDocument.id;
    context.dbSuccess = true;
    
    // Step 4: Start embedding process asynchronously
    console.log("🧠 Starting embedding process...");
    supabase.functions.invoke('embed-sbc-document', { 
      body: { documentId: newDocument.id },
      headers: { 'Content-Type': 'application/json' }
    }).then((result) => {
      console.log("✅ Embedding function started:", result);
    }).catch((err) => {
      console.error("❌ Embedding function failed:", err);
      // Update document status to indicate embedding failed
      supabase.from('sbc_curriculum_documents')
        .update({ 
          status: 'error',
          error_message: `Embedding failed: ${err.message}`
        })
        .eq('id', newDocument.id)
        .then(() => console.log("Updated document status to error"))
        .catch(console.error);
    });
    
    context.success = true;
    
    const totalDuration = endTimer();
    context.totalDuration = totalDuration;
    
    console.log("🎉 Document ingestion completed successfully:", {
      documentId: newDocument.id,
      totalDuration,
      uploadDuration,
      parseDuration, 
      dbDuration
    });
    
    logSuccess(
      `Document "${file.name}" ingested successfully`,
      "ingestSBCDocument",
      totalDuration,
      {
        documentId: newDocument.id,
        subject,
        grade,
        textLength: sanitizedText.length,
        filePath
      }
    );

    revalidatePath('/dashboard/curriculum');
    return { success: true };

  } catch (e: any) {
    const totalDuration = endTimer();
    
    // Determine failure point for better debugging
    let failurePoint = "unknown";
    if (e.message.includes("upload")) {
      failurePoint = "file_upload";
    } else if (e.message.includes("parsing") || e.message.includes("PDF")) {
      failurePoint = "pdf_parsing";
    } else if (e.message.includes("Database") || e.message.includes("save")) {
      failurePoint = "database_save";
    }
    
    const detailedError = logServerActionError(
      e,
      "ingestSBCDocument",
      formData,
      {
        ...context,
        failurePoint,
        totalDuration,
        subject: validatedFields?.data?.subject,
        grade: validatedFields?.data?.grade,
        fileName: validatedFields?.data?.file?.name
      }
    );
    
    // Clean up uploaded file on error
    if (filePath && context.uploadSuccess) {
        console.log("🧹 Cleaning up uploaded file...");
        try {
          const { error: removeError } = await supabase.storage
            .from('sbc_documents')
            .remove([filePath]);
          if (removeError) {
            console.error("❌ Failed to cleanup uploaded file:", removeError);
            detailedError.context!.cleanupFailed = removeError;
          } else {
            console.log("✅ File cleanup successful");
            detailedError.context!.cleanupSuccess = true;
          }
        } catch (cleanupError) {
          console.error("❌ Cleanup error:", cleanupError);
          detailedError.context!.cleanupError = cleanupError;
        }
    }
    
    return { 
      success: false, 
      error: detailedError
    };
  }
}
