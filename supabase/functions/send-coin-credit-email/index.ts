import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  try {
    const { email, username, coins, amount } = await req.json()

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Oplus AI <noreply@oplusai.com>',
        to: [email],
        subject: '🎉 Your Coins Have Been Credited!',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                }
                .container {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  border-radius: 16px;
                  padding: 40px;
                  text-align: center;
                  color: white;
                }
                .coin-badge {
                  background: rgba(255, 255, 255, 0.2);
                  border-radius: 50%;
                  width: 120px;
                  height: 120px;
                  margin: 0 auto 20px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 48px;
                  font-weight: bold;
                }
                .amount {
                  font-size: 36px;
                  font-weight: bold;
                  margin: 20px 0;
                  color: #FFD700;
                }
                .button {
                  display: inline-block;
                  background: white;
                  color: #667eea;
                  padding: 14px 32px;
                  border-radius: 8px;
                  text-decoration: none;
                  font-weight: 600;
                  margin-top: 20px;
                }
                .footer {
                  margin-top: 30px;
                  padding-top: 20px;
                  border-top: 1px solid rgba(255, 255, 255, 0.3);
                  font-size: 14px;
                  opacity: 0.9;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="coin-badge">🪙</div>
                <h1>Payment Verified!</h1>
                <p>Hi ${username},</p>
                <p>Great news! Your payment has been verified and your coins have been credited to your account.</p>
                
                <div class="amount">${coins} Coins</div>
                
                <p style="margin: 20px 0;">
                  <strong>Payment Amount:</strong> ₹${amount}<br>
                  <strong>Exchange Rate:</strong> ₹1 = 2 Coins
                </p>
                
                <p>You can now use these coins to support your favorite game creators!</p>
                
                <a href="https://oplusai.vercel.app/profile" class="button">View Your Profile</a>
                
                <div class="footer">
                  <p>Thank you for being a Plus member! 👑</p>
                  <p style="font-size: 12px; margin-top: 10px;">
                    This is an automated email from Oplus AI. Please do not reply to this email.
                  </p>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    })

    const data = await res.json()

    return new Response(
      JSON.stringify(data),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 400 
      },
    )
  }
})
