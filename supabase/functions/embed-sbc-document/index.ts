// supabase/functions/embed-sbc-document/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const HF_EMBED_URL = 'https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction';
const HF_TOKEN = Deno.env.get('HUGGINGFACE_ACCESS_TOKEN');

async function fetchWithRetry(url: string, opts: RequestInit, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(url, opts);
    if (res.ok) return res;
    if ((res.status === 404 || res.status === 422) && attempt < maxAttempts) {
      console.warn(`Attempt ${attempt} got ${res.status}, retrying...`);
      await new Promise(r => setTimeout(r, 1000));
      continue;
    }
    return res;
  }
  throw new Error('Unreachable retry logic');
}

class DocumentChunker {
  static chunkText(text: string): string[] {
    return text
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 50);
  }
}

Deno.serve(async (req) => {
  const { documentId } = await req.json();
  if (!documentId) return new Response(JSON.stringify({ error: "Missing documentId" }), { status: 400 });

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    await supabaseAdmin.from('sbc_curriculum_documents').update({ status: 'processing' }).eq('id', documentId);

    const { data: doc, error: fetchError } = await supabaseAdmin
      .from('sbc_curriculum_documents')
      .select('raw_text')
      .eq('id', documentId)
      .single();

    if (fetchError || !doc) throw new Error(`Could not find document: ${documentId}`);

    const chunks = DocumentChunker.chunkText(doc.raw_text);

    for (const chunk of chunks) {
      const res = await fetchWithRetry(HF_EMBED_URL + '?wait_for_model=true', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: chunk }),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`Hugging Face API Error: ${res.status} ${errorBody}`);
      }

      const embedding = await res.json();

      await supabaseAdmin
        .from('sbc_document_chunks')
        .insert({ document_id: documentId, content: chunk, embedding });
    }

    await supabaseAdmin.from('sbc_curriculum_documents')
      .update({ status: 'embedding_complete' })
      .eq('id', documentId);

    return new Response(JSON.stringify({ message: `Successfully embedded ${chunks.length} chunks.` }), { status: 200 });

  } catch (error) {
    await supabaseAdmin.from('sbc_curriculum_documents')
      .update({ status: 'error', error_message: error.message })
      .eq('id', documentId);
    console.error("Embedding Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
