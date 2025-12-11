import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { email } = await req.json();

    if (!email || !email.trim()) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user exists
    const { data: user, error: userError } = await supabaseClient
      .from('profiles')
      .select('id, email, username')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (userError || !user) {
      // Don't reveal if email exists or not for security
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'If an account with this email exists, you will receive an OTP shortly.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Store OTP in database
    const { error: otpError } = await supabaseClient
      .from('password_reset_otps')
      .upsert({
        email: email.trim().toLowerCase(),
        otp: otp,
        expires_at: expiresAt.toISOString(),
        used: false
      });

    if (otpError) {
      console.error('Error storing OTP:', otpError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate OTP' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send email using Brevo SMTP
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    
    if (!brevoApiKey) {
      console.error('BREVO_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset OTP - Oplus</title>
        <style>
          @media only screen and (max-width: 600px) {
            .container { padding: 20px 10px !important; }
            .main-content { padding: 30px 20px !important; }
            .otp-code { font-size: 28px !important; letter-spacing: 4px !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #000000; color: #ffffff;">
        <div class="container" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px;">
            <img src="https://your-domain.com/Oplus%20full%20logo.png" alt="Oplus" style="height: 60px; width: auto; max-width: 200px;">
          </div>
          
          <!-- Main Content -->
          <div class="main-content" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 16px; padding: 40px; text-align: center;">
            <h1 style="margin: 0 0 20px 0; font-size: 28px; font-weight: bold; color: #ffffff;">🔐 Password Reset Request</h1>
            
            <p style="margin: 0 0 30px 0; font-size: 16px; color: #e5e7eb; line-height: 1.5;">
              Hi <strong>${user.username || 'there'}</strong>,<br><br>
              You requested to reset your password for your Oplus account. Use the OTP below to continue:
            </p>
            
            <!-- OTP Code -->
            <div style="background: rgba(255, 255, 255, 0.1); border: 2px solid rgba(255, 255, 255, 0.2); border-radius: 12px; padding: 30px; margin: 30px 0; backdrop-filter: blur(10px);">
              <div style="font-size: 14px; color: #e5e7eb; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Your OTP Code</div>
              <div class="otp-code" style="font-size: 36px; font-weight: bold; color: #ffffff; letter-spacing: 8px; font-family: 'Courier New', monospace; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">${otp}</div>
              <div style="font-size: 12px; color: #d1d5db; margin-top: 10px;">⏰ Valid for 10 minutes only</div>
            </div>
            
            <!-- Security Notice -->
            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-size: 13px; color: #fca5a5;">
                🛡️ <strong>Security Notice:</strong> Never share this OTP with anyone. Oplus will never ask for your OTP via phone or other channels.
              </p>
            </div>
            
            <p style="margin: 30px 0 0 0; font-size: 14px; color: #d1d5db;">
              If you didn't request this password reset, please ignore this email or contact our support team if you have concerns.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #374151;">
            <p style="margin: 0 0 10px 0; font-size: 12px; color: #6b7280;">
              This email was sent by Oplus Gaming Platform
            </p>
            <p style="margin: 0; font-size: 11px; color: #4b5563;">
              Please do not reply to this email. For support, visit our help center.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': brevoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'Oplus',
          email: 'playgenofficial.com' // Replace with your verified Brevo sender email
        },
        to: [{
          email: email.trim(),
          name: user.username || 'User'
        }],
        subject: `Your Oplus Password Reset OTP: ${otp}`,
        htmlContent: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Email send failed:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'OTP sent successfully! Check your email for the 6-digit code.' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('OTP generation error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});