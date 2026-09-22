import dns from "node:dns";
import nodemailer from "nodemailer";

// Render and cloud container runtimes do not have IPv6 routing enabled.
// Force Node.js and Nodemailer to resolve IPv4 addresses to prevent ENETUNREACH.
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

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
      family: 4, // Force IPv4 to prevent ENETUNREACH on cloud environments like Render
    });
    console.log(`[EmailService] Configured SMTP via ${host}:${port}`);
  }

  return transporter;
}

/**
 * Verify email connection and credentials across supported providers
 * @returns {Promise<{ configured: boolean, provider?: string, connected: boolean, error?: string }>}
 */
export async function verifySmtpConnection() {
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/api-keys", {
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}` },
      });
      if (res.ok) {
        return { configured: true, provider: "resend", connected: true };
      }
      return {
        configured: true,
        provider: "resend",
        connected: false,
        error: "Invalid RESEND_API_KEY",
      };
    } catch (err) {
      return {
        configured: true,
        provider: "resend",
        connected: false,
        error: err.message,
      };
    }
  }

  if (process.env.BREVO_API_KEY) {
    try {
      const res = await fetch("https://api.brevo.com/v3/account", {
        headers: { "api-key": process.env.BREVO_API_KEY.trim() },
      });
      if (res.ok) {
        return { configured: true, provider: "brevo", connected: true };
      }
      return {
        configured: true,
        provider: "brevo",
        connected: false,
        error: "Invalid BREVO_API_KEY",
      };
    } catch (err) {
      return {
        configured: true,
        provider: "brevo",
        connected: false,
        error: err.message,
      };
    }
  }

  const transport = getTransporter();
  if (!transport) {
    return {
      configured: false,
      connected: false,
      error: "No email provider configured. On Render Free tier, SMTP ports (25/465/587) are blocked; please set RESEND_API_KEY or BREVO_API_KEY.",
    };
  }

  try {
    await transport.verify();
    return { configured: true, provider: "smtp", connected: true };
  } catch (err) {
    console.error(`[EmailService] SMTP verification failed: ${err.message}`);
    return {
      configured: true,
      provider: "smtp",
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

  // Option 1: Resend HTTP API (port 443 HTTPS — works on Render Free Tier!)
  if (process.env.RESEND_API_KEY) {
    console.log("[OTP] Email send started (Resend API)");
    try {
      const from = process.env.RESEND_FROM || process.env.SMTP_FROM || "TaskPanda AI <onboarding@resend.dev>";
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [email],
          subject: `Your TaskPanda AI Verification Code: ${otp}`,
          text: `Your TaskPanda AI verification code is ${otp}. This code expires in 10 minutes.`,
          html: htmlContent,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || `Resend error ${response.status}`);
      }

      console.log("[OTP] Email provider response received");
      console.log("[OTP] Email send successful");
      return { success: true, delivered: true, messageId: data.id };
    } catch (err) {
      console.error(`[OTP] Email send failed: ${err.message}`);
      throw new Error(`Email delivery failed: ${err.message}`);
    }
  }

  // Option 2: Brevo HTTP API (port 443 HTTPS — works on Render Free Tier!)
  if (process.env.BREVO_API_KEY) {
    console.log("[OTP] Email send started (Brevo API)");
    try {
      const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || "noreply@taskpanda.ai";
      const senderName = process.env.BREVO_SENDER_NAME || "TaskPanda AI";
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": process.env.BREVO_API_KEY.trim(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email, name: name || undefined }],
          subject: `Your TaskPanda AI Verification Code: ${otp}`,
          textContent: `Your TaskPanda AI verification code is ${otp}. This code expires in 10 minutes.`,
          htmlContent,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || `Brevo error ${response.status}`);
      }

      console.log("[OTP] Email provider response received");
      console.log("[OTP] Email send successful");
      return { success: true, delivered: true, messageId: data.messageId };
    } catch (err) {
      console.error(`[OTP] Email send failed: ${err.message}`);
      throw new Error(`Email delivery failed: ${err.message}`);
    }
  }

  // Option 3: Standard SMTP (Nodemailer)
  const transport = getTransporter();
  if (!transport) {
    console.error("[OTP] Email send failed: No email provider configured.");
    throw new Error(
      "Email delivery service is not configured. On Render Free tier, SMTP ports are blocked; please set RESEND_API_KEY or BREVO_API_KEY."
    );
  }

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
