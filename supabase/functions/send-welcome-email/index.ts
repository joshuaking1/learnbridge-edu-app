// supabase/functions/send-welcome-email/index.ts

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { Resend } from 'resend';

// Email templates with inline CSS for maximum compatibility
const teacherEmailHtml = (name: string, district: string) => `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f7; }
  .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
  .header { background-color: #022e7d; color: #ffffff; padding: 40px; text-align: center; }
  .header h1 { font-family: 'DM Serif Display', serif; margin: 0; font-size: 32px; }
  .content { padding: 40px; color: #334155; line-height: 1.6; }
  .content p { margin: 0 0 20px; }
  .content a { color: #fd6a3e; text-decoration: none; font-weight: bold; }
  .footer { background-color: #f1f5f9; text-align: center; padding: 20px; font-size: 12px; color: #64748b; }
</style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>Welcome to the Revolution, ${name}!</h1></div>
    <div class="content">
      <p>Hi ${name},</p>
      <p>I am thrilled to personally welcome you to LearnBridgeEdu.</p>
      <p>As a dedicated educator in <strong>${district}</strong>, you are on the front lines of shaping Ghana's future. We built LearnBridgeEdu for you—to be your AI-powered co-teacher, to simplify the complexities of the SBC, and to give you back the time to do what you do best: <strong>inspire</strong>.</p>
      <p>Your journey starts now. Dive into the <a href="YOUR_APP_URL/dashboard/teacher">AI Lesson Planner</a>, explore our resource hub, and connect with a community of forward-thinking teachers just like you.</p>
      <p>We are honored to have you with us. Let's build the future of education together.</p>
      <p>Warmly,<br><strong>Samuel Ohene-Sarfo</strong><br>CEO, LearnBridgeEdu</p>
    </div>
    <div class="footer">© ${new Date().getFullYear()} LearnBridgeEdu. All Rights Reserved.</div>
  </div>
</body>
</html>
`;

const studentEmailHtml = (name: string, school: string) => `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f7; }
  .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
  .header { background-color: #fd6a3e; color: #ffffff; padding: 40px; text-align: center; }
  .header h1 { font-family: 'DM Serif Display', serif; margin: 0; font-size: 32px; }
  .content { padding: 40px; color: #334155; line-height: 1.6; }
  .content p { margin: 0 0 20px; }
  .content a { color: #022e7d; text-decoration: none; font-weight: bold; }
  .footer { background-color: #f1f5f9; text-align: center; padding: 20px; font-size: 12px; color: #64748b; }
</style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>Your Adventure Starts NOW, ${name}! 🚀</h1></div>
    <div class="content">
      <p>Hi ${name},</p>
      <p>Welcome to LearnBridgeEdu! I'm so excited you're here.</p>
      <p>School is an adventure, and we've built this platform to be your ultimate guide. Whether you're a science explorer at <strong>${school}</strong> or a future history expert, we have everything you need to ace your classes and have fun doing it.</p>
      <p>Get ready to <a href="YOUR_APP_URL/dashboard/student">tackle homework with your AI buddy</a>, climb the leaderboard in learning quests, and discover just how amazing you are.</p>
      <p>Your learning journey is unique, and we'll be with you every step of the way. Let the adventure begin!</p>
      <p>Go for it!<br><strong>Samuel Ohene-Sarfo</strong><br>CEO, LearnBridgeEdu</p>
    </div>
    <div class="footer">© ${new Date().getFullYear()} LearnBridgeEdu. All Rights Reserved.</div>
  </div>
</body>
</html>
`;

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    const { record } = await req.json();

    const { role, full_name, email, location_district, school_name } = record;

    let subject = '';
    let htmlContent = '';

    if (role === 'teacher') {
      subject = `Welcome to the Revolution, ${full_name}!`;
      htmlContent = teacherEmailHtml(full_name, location_district || 'your district');
    } else if (role === 'student') {
      subject = `Your Adventure Starts NOW, ${full_name}! 🚀`;
      htmlContent = studentEmailHtml(full_name, school_name || 'your school');
    } else {
      return new Response(JSON.stringify({ message: 'No email sent for this role.' }), { status: 200 });
    }

    await resend.emails.send({
      from: 'welcome@marketing.learnbridgedu.com', // MUST be from your verified Resend domain
      to: email,
      subject: subject,
      html: htmlContent,
    });

    return new Response(JSON.stringify({ message: 'Email sent successfully!' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});