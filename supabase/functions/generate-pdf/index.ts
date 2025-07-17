// supabase/functions/generate-pdf/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import puppeteer from 'https://esm.sh/puppeteer-core@22.10.0';

// Helper function to generate HTML from our lesson plan JSON
const generateLessonPlanHtml = (data: any) => {
    const { inputs, aiContent } = data;
    // This is a basic HTML template. It can be styled extensively with CSS.
    return `
        <html>
            <head>
                <style>
                    body { font-family: sans-serif; padding: 20px; }
                    h1, h2, h3 { color: #022e7d; }
                    table { width: 100%; border-collapse: collapse; }
                    td, th { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                </style>
            </head>
            <body>
                <h1>Lesson Plan: ${inputs.subject}</h1>
                <h2>Topic: ${aiContent.contentStandard || inputs.topic}</h2>
                <hr/>
                <h3>Learning Objectives</h3>
                <p>${aiContent.learningIndicator}</p>
                <h3>Pedagogical Strategies</h3>
                <p>${aiContent.pedagogicalStrategies.join(', ')}</p>
                {/* Add more sections as needed */}
            </body>
        </html>
    `;
};

Deno.serve(async (req) => {
  const { content, fileName, userId } = await req.json();

  if (!content || !fileName || !userId) {
    return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });
  }

  const htmlContent = generateLessonPlanHtml(content.structured_content);
  const filePath = `generated-pdfs/${userId}/${fileName.replace(/ /g, '_')}.pdf`;
  
  try {
    // Launch a headless browser using a browser endpoint
    const browser = await puppeteer.connect({
        browserWSEndpoint: `wss://browser.lite.supabase.com?token=${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    // Upload the generated PDF to Supabase Storage
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error: uploadError } = await supabaseAdmin.storage
        .from('teacher_resources') // We can reuse this bucket
        .upload(filePath, pdfBuffer, { contentType: 'application/pdf', upsert: true });

    if (uploadError) throw uploadError;

    // Generate a signed URL for the user to download the file
    const { data, error: urlError } = await supabaseAdmin.storage
        .from('teacher_resources')
        .createSignedUrl(filePath, 300); // URL is valid for 5 minutes

    if (urlError) throw urlError;

    return new Response(JSON.stringify({ downloadUrl: data.signedUrl }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
    });

  } catch (error) {
    console.error("PDF Generation Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});