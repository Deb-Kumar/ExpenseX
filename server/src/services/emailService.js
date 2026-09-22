import nodemailer from 'nodemailer';

/**
 * Service to deliver transactional emails and OTP codes via Nodemailer
 */

let transporter = null;

const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  // Fallback to jsonTransport / console logger if no credentials configured yet
  return null;
};

export const sendVerificationOtpEmail = async ({ toEmail, otp, userName = 'ExpenseX User' }) => {
  const emailFrom = process.env.EMAIL_FROM || '"ExpenseX Security" <noreply@expensex.app>';

  // Visual banner in server logs for dev observability and instant testing
  console.log(`\n============================================================`);
  console.log(`✉️  [ExpenseX Email Service] OTP Verification Code Generated`);
  console.log(`To      : ${toEmail}`);
  console.log(`OTP Code: ${otp}`);
  console.log(`Expires : In 10 minutes`);
  console.log(`============================================================\n`);

  if (!transporter) {
    transporter = createTransporter();
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email Address</title>
      <style>
        body { margin: 0; padding: 0; background-color: #0b1120; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc; }
        .wrapper { width: 100%; max-width: 540px; margin: 40px auto; background-color: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
        .header { background: linear-gradient(135deg, #0d9488 0%, #2563eb 100%); padding: 32px 24px; text-align: center; }
        .logo-text { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; margin: 0; }
        .content { padding: 32px 24px; text-align: center; }
        .greeting { font-size: 18px; font-weight: 700; color: #ffffff; margin-bottom: 8px; }
        .description { font-size: 13px; color: #94a3b8; line-height: 1.6; margin-bottom: 28px; }
        .otp-box { display: inline-block; background-color: #1e293b; border: 2px dashed #0d9488; border-radius: 16px; padding: 18px 36px; margin: 0 auto 28px; letter-spacing: 8px; font-size: 32px; font-weight: 800; color: #2dd4bf; font-family: monospace; }
        .expiry-note { font-size: 11px; color: #64748b; margin-bottom: 24px; }
        .footer { padding: 20px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center; font-size: 11px; color: #475569; background-color: #090e17; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1 class="logo-text">ExpenseX &bull; Security Verification</h1>
        </div>
        <div class="content">
          <div class="greeting">Hello, ${userName} 👋</div>
          <p class="description">
            You requested to update your email address on your ExpenseX personal finance account.
            Please use the 6-digit One-Time Password (OTP) below to complete verification:
          </p>
          <div class="otp-box">${otp}</div>
          <p class="expiry-note">
            ⏱️ This verification code is valid for <strong>10 minutes</strong>. If you did not request this update, please ignore this email or change your password.
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} ExpenseX &bull; Smart Personal Finance Tracker. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: emailFrom,
        to: toEmail,
        subject: `ExpenseX Verification Code: ${otp}`,
        text: `Your ExpenseX verification code is: ${otp}. It expires in 10 minutes.`,
        html: htmlContent,
      });
      console.log(`✅ [Nodemailer] Email dispatched successfully: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`⚠️  [Nodemailer] Failed to send via SMTP:`, err.message);
      // Even if SMTP fails (e.g. invalid credentials), do not crash the app; the OTP is logged to console for testing
      return { success: false, error: err.message };
    }
  }

  // When no SMTP credentials are configured, we return success so testing can proceed using the logged OTP
  return { success: true, devMode: true };
};
