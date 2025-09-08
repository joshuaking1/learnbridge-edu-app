// supabase/functions/text-to-embedding/index.ts
import { corsHeaders } from '../_shared/cors.ts'
import { trackEdgeFunctionEvent } from '../_shared/posthog.ts'

const CF_ACCOUNT_ID = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
const CF_API_TOKEN = Deno.env.get('CLOUDFLARE_API_TOKEN');

// The specific, battle-tested model we will use on Cloudflare's infrastructure
const MODEL = '@cf/baai/bge-small-en-v1.5';

Deno.serve(async (req) => {
  // This is needed to handle OPTIONS requests from the browser
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text } = await req.json();
    if (!text) throw new Error("Missing 'text' in request body");

    // Track embedding request
    await trackEdgeFunctionEvent('embedding_requested', {
      text_length: text.length,
      timestamp: new Date().toISOString()
    });

    // Construct the Cloudflare API URL
    const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${MODEL}`;

    // Call the Cloudflare API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: [text] }), // Cloudflare expects an array of texts
    });

    if (!response.ok) {
      const errorBody = await response.text();
      
      // Track embedding failure
      await trackEdgeFunctionEvent('embedding_failed', {
        error: `Cloudflare AI Error: ${response.status} ${errorBody}`,
        text_length: text.length,
        timestamp: new Date().toISOString()
      });
      
      throw new Error(`Cloudflare AI Error: ${response.status} ${errorBody}`);
    }

    const result = await response.json();
    
    // The embedding is in result.result.data[0]
    const embedding = result.result.data[0];

    // Track successful embedding generation
    await trackEdgeFunctionEvent('embedding_generated', {
      text_length: text.length,
      embedding_dimensions: embedding?.length || 0,
      timestamp: new Date().toISOString()
    });

    return new Response(JSON.stringify({ embedding }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // Track embedding error
    await trackEdgeFunctionEvent('embedding_error', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});