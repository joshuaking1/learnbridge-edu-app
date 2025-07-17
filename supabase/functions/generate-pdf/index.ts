// supabase/functions/generate-pdf/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const API2PDF_KEY = Deno.env.get('API2PDF_KEY');
const API_ENDPOINT = 'https://v2018.api2pdf.com/chrome/html';

// Same helper function to generate HTML from our lesson plan JSON
const generateLessonPlanHtml = (data: any) => {
    const { inputs, aiContent } = data;
    return `
        <html>
            <head>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; padding: 40px; font-size: 14px; line-height: 1.6; }
                    h1, h2, h3 { color: #022e7d; }
                    h1 { font-size: 28px; } h2 { font-size: 22px; border-bottom: 1px solid #eee; padding-bottom: 5px; } h3 { font-size: 18px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                    td, th { border: 1px solid #ddd; padding: 10px; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                    .meta-table { margin-bottom: 20px; }
                    .meta-table td { border: none; padding: 2px 0; }
                </style>
            </head>
            <body>
                <h1>Lesson Plan: ${inputs.subject}</h1>
                <table class="meta-table">
                    <tr><td><b>Topic:</b></td><td>${aiContent.contentStandard || inputs.topic}</td></tr>
                    <tr><td><b>Form/Class:</b></td><td>${inputs.grade}</td></tr>
                    <tr><td><b>Week:</b></td><td>${inputs.week}</td></tr>
                </table>
                
                <h2>Learning Objectives</h2>
                <p>${aiContent.learningIndicator}</p>
                
                <h2>Pedagogical Strategies</h2>
                <p>${aiContent.pedagogicalStrategies.join(', ')}</p>

                <h2>Teaching & Learning Resources</h2>
                <ul>${aiContent.teachingAndLearningResources.map((r: string) => `<li>${r}</li>`).join('')}</ul>
                
                <h2>Essential Questions</h2>
                <ul>${aiContent.essentialQuestions.map((q: string) => `<li>${q}</li>`).join('')}</ul>
                
                <h2>Differentiation Notes</h2>
                <ul>${aiContent.differentiationNotes.map((n: string) => `<li>${n}</li>`).join('')}</ul>
                
                <h2>Lesson Activities</h2>
                
                <h3>Starter Activity</h3>
                <table>
                    <tr><th>Teacher</th><th>Learner</th></tr>
                    <tr><td>${aiContent.starterActivity.teacher}</td><td>${aiContent.starterActivity.learner}</td></tr>
                </table>
                
                <h3>Introductory Activity</h3>
                <table>
                    <tr><th>Teacher</th><th>Learner</th></tr>
                    <tr><td>${aiContent.introductoryActivity.teacher}</td><td>${aiContent.introductoryActivity.learner}</td></tr>
                </table>
                
                <h3>Main Activity 1</h3>
                <table>
                    <tr><th>Teacher</th><th>Learner</th></tr>
                    <tr><td>${aiContent.mainActivity1.teacher}</td><td>${aiContent.mainActivity1.learner}</td></tr>
                </table>
                
                <h3>Main Activity 2</h3>
                <table>
                    <tr><th>Teacher</th><th>Learner</th></tr>
                    <tr><td>${aiContent.mainActivity2.teacher}</td><td>${aiContent.mainActivity2.learner}</td></tr>
                </table>
                
                <h3>Lesson Closure</h3>
                <table>
                    <tr><th>Teacher</th><th>Learner</th></tr>
                    <tr><td>${aiContent.lessonClosure.teacher}</td><td>${aiContent.lessonClosure.learner}</td></tr>
                </table>
            </body>
        </html>
    `;
};

Deno.serve(async (req) => {
  const { content, fileName } = await req.json();

  if (!content || !fileName) {
    return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });
  }

  const htmlContent = generateLessonPlanHtml(content.structured_content);
  
  try {
    // Call the external API to convert our HTML to a PDF
    const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
            'Authorization': API2PDF_KEY!,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            html: htmlContent,
            fileName: `${fileName.replace(/ /g, '_')}.pdf`,
            inline: false // This gives us a URL to the PDF instead of the raw file
        })
    });

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.message || "Failed to convert HTML to PDF.");
    }

    const result = await response.json();

    if (!result.success) {
        throw new Error(result.error);
    }

    // The result.pdf contains the URL to the generated PDF.
    return new Response(JSON.stringify({ downloadUrl: result.pdf }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
    });

  } catch (error) {
    console.error("PDF Generation Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
