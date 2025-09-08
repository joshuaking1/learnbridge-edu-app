// supabase/functions/process-ai-job/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { trackEdgeFunctionEvent } from '../_shared/posthog.ts'

// Self-contained embedding function using Cloudflare AI
async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const accountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
    const apiToken = Deno.env.get('CLOUDFLARE_API_TOKEN');
    
    if (!accountId || !apiToken) {
      console.error('Missing Cloudflare credentials');
      return null;
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/baai/bge-base-en-v1.5`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: [text] }),
      }
    );

    if (!response.ok) {
      console.error('Cloudflare AI API error:', response.status, response.statusText);
      return null;
    }

    const result = await response.json();
    return result.result?.data?.[0] || null;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { record: job } = await req.json(); // Triggered by a webhook
    
    // Track AI job processing start
    await trackEdgeFunctionEvent('ai_job_processing_started', {
      job_id: job.id,
      job_type: job.job_type,
      user_id: job.user_id,
      timestamp: new Date().toISOString()
    });
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Process the AI job based on its type
    if (job.job_type === 'assessment_generation') {
      await processAssessmentGeneration(supabaseAdmin, job);
    } else if (job.job_type === 'lesson_plan_generation') {
      await processLessonPlanGeneration(supabaseAdmin, job);
    } else {
      throw new Error(`Unknown job type: ${job.job_type}`);
    }

    // Track successful AI job completion
    await trackEdgeFunctionEvent('ai_job_processing_completed', {
      job_id: job.id,
      job_type: job.job_type,
      user_id: job.user_id,
      timestamp: new Date().toISOString()
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Process AI Job Error:', error);
    
    // Track AI job processing error
    await trackEdgeFunctionEvent('ai_job_processing_failed', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function processAssessmentGeneration(supabaseAdmin: any, job: any) {
  try {
    const inputData = job.input_data;
    
    // 1. Get embedding for the topic using Cloudflare AI
    const embedding = await generateEmbedding(inputData.topic);
    if (!embedding) throw new Error("Failed to generate embedding for topic");

    // 2. Match relevant curriculum chunks
    const { data: chunks, error: matchError } = await supabaseAdmin.rpc('match_sbc_chunks', {
      query_embedding: embeddingResponse.embedding,
      match_threshold: 0.7,
      match_count: 5
    });

    if (matchError) throw new Error(`Chunk Matching Error: ${matchError.message}`);

    // For now, just mark as complete with basic structure
    // In a full implementation, you would call Groq AI here
    const mockQuizData = {
      title: `Assessment for ${inputData.topic}`,
      questions: [
        {
          type: "mcq",
          question: `What is the main concept of ${inputData.topic}?`,
          options: ["Option A", "Option B", "Option C", "Option D"],
          correctAnswer: "Option A"
        }
      ]
    };

    // 3. Update the job with the result
    await supabaseAdmin.from('ai_generation_jobs')
      .update({ 
        status: 'completed', 
        output_data: mockQuizData,
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id);

  } catch (error) {
    // Update job with error status
    await supabaseAdmin.from('ai_generation_jobs')
      .update({ 
        status: 'failed', 
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id);
    
    throw error;
  }
}

async function processLessonPlanGeneration(supabaseAdmin: any, job: any) {
  try {
    const inputData = job.input_data;
    
    // Similar structure to assessment generation
    // For now, just mark as complete with basic structure
    const mockLessonPlan = {
      title: `Lesson Plan for ${inputData.topic}`,
      contentStandard: "Sample content standard",
      learningOutcome: "Students will understand the basics",
      activities: ["Activity 1", "Activity 2"]
    };

    await supabaseAdmin.from('ai_generation_jobs')
      .update({ 
        status: 'completed', 
        output_data: mockLessonPlan,
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id);

  } catch (error) {
    await supabaseAdmin.from('ai_generation_jobs')
      .update({ 
        status: 'failed', 
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id);
    
    throw error;
  }
}