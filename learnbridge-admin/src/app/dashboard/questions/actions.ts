// learnbridge-admin/src/app/dashboard/questions/actions.ts
"use server";
import { createClient } from "@/lib/supabase/server";

type BulkUploadResult = {
    success?: boolean;
    count?: number;
    error?: string;
    errorDetails?: {
        message: string;
        code: string;
        details: any;
        stack?: string;
        context: Record<string, any>;
        timestamp: string;
    };
};

export async function bulkUploadQuestions(questions: any[]): Promise<BulkUploadResult> {
    const startTime = Date.now();
    const context: Record<string, any> = {
        startTime: new Date(startTime).toISOString(),
        questionsCount: questions?.length || 0,
    };

    try {
        console.log("🚀 Starting bulk question upload", { 
            questionsCount: questions?.length,
            startTime: context.startTime 
        });

        const supabase = await createClient();
        context.supabaseInitialized = true;

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
            console.error("❌ Authentication error:", userError);
            return {
                error: "Authentication failed",
                errorDetails: {
                    message: "Failed to authenticate user",
                    code: "AUTH_ERROR",
                    details: userError,
                    stack: userError?.stack,
                    context,
                    timestamp: new Date().toISOString()
                }
            };
        }

        if (!user) {
            console.error("❌ No user in session");
            return {
                error: "Not authenticated or session expired.",
                errorDetails: {
                    message: "No authenticated user found in session",
                    code: "NO_USER",
                    details: null,
                    context,
                    timestamp: new Date().toISOString()
                }
            };
        }

        context.userId = user.id;
        context.userEmail = user.email;
        console.log("✅ User authenticated:", { userId: user.id, email: user.email });

        // Validation checks
        if (!Array.isArray(questions)) {
            console.error("❌ Questions data is not an array:", typeof questions);
            return {
                error: "Invalid data format - expected array of questions.",
                errorDetails: {
                    message: "Questions data must be an array",
                    code: "INVALID_FORMAT",
                    details: { dataType: typeof questions, isArray: Array.isArray(questions) },
                    context,
                    timestamp: new Date().toISOString()
                }
            };
        }

        if (questions.length === 0) {
            console.error("❌ No questions provided");
            return {
                error: "No questions provided.",
                errorDetails: {
                    message: "Questions array is empty",
                    code: "EMPTY_DATA",
                    details: { questionsLength: questions.length },
                    context,
                    timestamp: new Date().toISOString()
                }
            };
        }

        if (questions.length > 1000) {
            console.error("❌ Too many questions:", questions.length);
            return {
                error: "Too many questions. Maximum 1000 questions per upload.",
                errorDetails: {
                    message: `Attempted to upload ${questions.length} questions, maximum is 1000`,
                    code: "LIMIT_EXCEEDED",
                    details: { 
                        questionsCount: questions.length, 
                        maxAllowed: 1000 
                    },
                    context,
                    timestamp: new Date().toISOString()
                }
            };
        }

        console.log("✅ Validation passed, inserting questions...");
        context.validationPassed = true;

        const insertStartTime = Date.now();
        const { error } = await supabase.rpc('bulk_insert_questions', {
            questions_data: questions
        });
        
        const insertDuration = Date.now() - insertStartTime;
        context.insertDuration = insertDuration;

        if (error) {
            console.error("❌ Database RPC error:", error);
            return {
                error: `Database error: ${error.message}`,
                errorDetails: {
                    message: "Database bulk insert failed",
                    code: "DATABASE_ERROR",
                    details: {
                        supabaseError: error,
                        rpcFunction: 'bulk_insert_questions',
                        questionsCount: questions.length
                    },
                    context,
                    timestamp: new Date().toISOString()
                }
            };
        }

        const totalDuration = Date.now() - startTime;
        context.totalDuration = totalDuration;
        context.success = true;

        console.log("🎉 Bulk upload completed successfully:", {
            questionsCount: questions.length,
            totalDuration,
            insertDuration
        });

        return { 
            success: true, 
            count: questions.length 
        };

    } catch (e: any) {
        const totalDuration = Date.now() - startTime;
        context.totalDuration = totalDuration;
        context.error = {
            message: e.message,
            name: e.name,
            stack: e.stack
        };

        console.error("❌ Bulk upload unexpected error:", e);
        
        return {
            error: "An unexpected error occurred during bulk upload.",
            errorDetails: {
                message: e.message || "Unexpected error during bulk upload",
                code: "UNEXPECTED_ERROR",
                details: {
                    errorName: e.name,
                    errorMessage: e.message,
                    questionsCount: questions?.length || 0
                },
                stack: e.stack,
                context,
                timestamp: new Date().toISOString()
            }
        };
    }
}
