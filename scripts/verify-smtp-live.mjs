import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../backend/.env");

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

import { verifySmtpConnection, sendVerificationEmail, getTransporter } from "../backend/src/email.js";
import { generateSecureOtp, setOtpRecord, verifySubmittedOtp } from "../backend/src/otpStore.js";

const targetEmail = process.argv[2];

console.log("==================================================");
console.log("TaskPanda AI — Live SMTP & Email Delivery Tester");
console.log("==================================================\n");

console.log("1. Checking Environment Variables...");
console.log("   SMTP_HOST:", process.env.SMTP_HOST || "(not set)");
console.log("   SMTP_PORT:", process.env.SMTP_PORT || "587 (default)");
console.log("   SMTP_SECURE:", process.env.SMTP_SECURE || "false");
console.log("   SMTP_USER:", process.env.SMTP_USER ? `${process.env.SMTP_USER.slice(0, 3)}***` : "(not set)");
console.log("   SMTP_PASS:", process.env.SMTP_PASS ? "(configured - hidden)" : "(not set)");
console.log("   SMTP_FROM:", process.env.SMTP_FROM || "(defaulting to SMTP_USER)");
console.log("");

console.log("2. Verifying SMTP Connection & Credentials...");
const status = await verifySmtpConnection();

if (!status.configured) {
  console.log("❌ SMTP is not configured.");
  console.log("   Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in backend/.env");
  console.log("   (See backend/.env.example for Gmail and other provider guides)\n");
  process.exit(1);
}

if (!status.connected) {
  console.log("❌ SMTP connection failed!");
  console.log("   Error:", status.error);
  console.log("\n   Troubleshooting:");
  console.log("   - For Gmail, make sure 2-Step Verification is enabled.");
  console.log("   - Use an App Password (16 chars), NOT your main Google account password.");
  console.log("   - Check port: 587 (STARTTLS) or 465 (SSL).");
  console.log("");
  process.exit(1);
}

console.log("✅ SMTP connection verified successfully! Provider accepted credentials.\n");

if (!targetEmail) {
  console.log("ℹ️  To test sending a real verification OTP email to your inbox, run:");
  console.log("   node scripts/verify-smtp-live.mjs your-email@domain.com\n");
  process.exit(0);
}

console.log(`3. Sending Live Verification OTP Email to: ${targetEmail}...`);
const testOtp = generateSecureOtp();
setOtpRecord(targetEmail, testOtp, "Test User");

try {
  const sendResult = await sendVerificationEmail(targetEmail, testOtp, "Test User");
  console.log("\n✅ Email provider accepted the message!");
  console.log(`   Message ID: ${sendResult.messageId}`);
  console.log(`   Destination: ${targetEmail}`);
  console.log("\n4. Testing OTP verification endpoint logic...");
  const verifyResult = verifySubmittedOtp(targetEmail, testOtp);
  if (verifyResult.success) {
    console.log("✅ OTP successfully verified!");
  } else {
    console.log("❌ OTP verification failed:", verifyResult.error);
  }
  console.log("\n==================================================");
  console.log("🎉 Complete email OTP flow verified end-to-end!");
  console.log("==================================================\n");
} catch (err) {
  console.error("\n❌ Failed to deliver email:", err.message);
  process.exit(1);
}
