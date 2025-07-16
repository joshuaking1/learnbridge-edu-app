// supabase/functions/text-to-embedding/index.ts
const HF_EMBED_URL = 'https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction';
const HF_TOKEN = Deno.env.get('HUGGINGFACE_ACCESS_TOKEN');

async function fetchWithRetry(url: string, opts: RequestInit, attempts = 2) {
  for (let i = 1; i <= attempts; i++) {
    const res = await fetch(url + '?wait_for_model=true', opts);
    if (res.ok) return res;
    if ((res.status === 404 || res.status === 422) && i < attempts) {
      console.warn(`Attempt ${i} failed (${res.status}); retrying...`);
      await new Promise(r => setTimeout(r, 500));
      continue;
    }
    return res;
  }
  throw new Error('Retry limit reached');
}

Deno.serve(async (req) => {
  try {
    const { text } = await req.json();
    if (!text) throw new Error("Missing 'text' in request body");

    const res = await fetchWithRetry(HF_EMBED_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: [text] }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`HF API Error: ${res.status} ${errorBody}`);
    }

    const embeddings: number[][] = await res.json();
    const embedding = embeddings[0];

    return new Response(JSON.stringify({ embedding }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Text to Embedding Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
