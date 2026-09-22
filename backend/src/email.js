import nodemailer from "nodemailer";

let transporter = null;

export function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER;
  // Clean up any spaces in SMTP_PASS (e.g. Google 16-character App Passwords "xxxx yyyy zzzz wwww")
  const pass = process.env.SMTP_PASS ? String(process.env.SMTP_PASS).replace(/\s+/g, "") : "";

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
    console.log(`[EmailService] Configured SMTP via ${host}:${port}`);
  }

  return transporter;
}

/**
 * Verify SMTP connection and credentials
 * @returns {Promise<{ configured: boolean, connected: boolean, error?: string }>}
 */
export async function verifySmtpConnection() {
  const transport = getTransporter();
  if (!transport) {
    return {
      configured: false,
      connected: false,
      error: "SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) are not set.",
    };
  }

  try {
    await transport.verify();
    return { configured: true, connected: true };
  } catch (err) {
    console.error(`[EmailService] SMTP verification failed: ${err.message}`);
    return {
      configured: true,
      connected: false,
      error: err.message || "Failed to authenticate or connect with SMTP server.",
    };
  }
}

/**
 * Send 6-digit OTP verification email to user
 * @param {string} email - Destination email address
 * @param {string} otp - 6-digit verification code
 * @param {string} [name] - User full name if available
 */
export async function sendVerificationEmail(email, otp, name = "") {
  const transport = getTransporter();

  if (!transport) {
    console.error("[OTP] Email send failed: SMTP is not configured. Missing SMTP_HOST, SMTP_USER, or SMTP_PASS.");
    throw new Error("Email delivery service is not configured. Please contact the administrator.");
  }

  const user = process.env.SMTP_USER;
  const greeting = name ? `Hi ${name},` : "Hello,";
  const fromAddress =
    process.env.SMTP_FROM || (user ? `"TaskPanda AI" <${user}>` : `"TaskPanda AI" <noreply@taskpanda.ai>`);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify your TaskPanda AI account</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 20px; padding: 36px 32px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <span style="font-size: 48px; line-height: 1;">🐼</span>
                    <h1 style="margin: 12px 0 4px; font-size: 22px; font-weight: 800; color: #4338ca;">TaskPanda AI</h1>
                    <p style="margin: 0; font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Account Verification</p>
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 15px; line-height: 1.6; color: #334155; padding-bottom: 24px;">
                    <p style="margin: 0 0 12px;">${greeting}</p>
                    <p style="margin: 0;">Welcome to TaskPanda AI! Please enter the 6-digit verification code below to verify your email address and activate your account:</p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 12px 0 28px;">
                    <div style="background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 14px; padding: 18px 24px; display: inline-block;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #312e81;">${otp}</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 13px; line-height: 1.5; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                    <p style="margin: 0 0 8px;">⏳ <strong>This code expires in 10 minutes.</strong></p>
                    <p style="margin: 0 0 8px;">🔒 Never share this code with anyone. TaskPanda staff will never ask for your code.</p>
                    <p style="margin: 0;">If you did not request this email, please ignore it or report to support.</p>
                  </td>
                </tr>
              </table>
              <table width="100%" style="max-width: 520px; padding: 16px 0;">
                <tr>
                  <td align="center" style="font-size: 12px; color: #94a3b8;">
                    &copy; ${new Date().getFullYear()} TaskPanda AI. All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  console.log("[OTP] Email send started");
  try {
    const info = await transport.sendMail({
      from: fromAddress,
      to: email,
      subject: `Your TaskPanda AI Verification Code: ${otp}`,
      text: `Your TaskPanda AI verification code is ${otp}. This code expires in 10 minutes.`,
      html: htmlContent,
    });
    console.log("[OTP] Email provider response received");
    console.log("[OTP] Email send successful");
    return { success: true, delivered: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[OTP] Email send failed: ${err.message}`);
    throw new Error(`Email delivery failed: ${err.message}`);
  }
}
