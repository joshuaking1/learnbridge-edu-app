// supabase/functions/parse-sbc-pdf/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import pdf from 'pdf-parse';

console.log("Parse SBC PDF Function Initialized");

Deno.serve(async (req) => {
  try {
    const { filePath } = await req.json();
    if (!filePath) {
      throw new Error("Missing 'filePath' in request body");
    }

    // Create a Supabase client with the service role key to download the file
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Download the file from storage
    const { data: blob, error: downloadError } = await supabaseAdmin.storage
      .from('sbc_documents')
      .download(filePath);
    
    if (downloadError) throw downloadError;

    // Convert the blob to a Buffer Deno can work with
    const buffer = new Uint8Array(await blob.arrayBuffer());

    // Parse the PDF buffer
    const data = await pdf(buffer);

    // Return the extracted text
    return new Response(
      JSON.stringify({ text: data.text }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error("Function Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});