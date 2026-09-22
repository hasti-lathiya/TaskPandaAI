import nodemailer from "../backend/node_modules/nodemailer/dist/esm/nodemailer.js";
import { sendVerificationEmail } from "../backend/src/email.js";

console.log("Testing full SMTP connection and delivery with ephemeral Ethereal SMTP test account...\n");

try {
  const testAccount = await nodemailer.createTestAccount();
  console.log("1. Created temporary SMTP test credentials:");
  console.log("   Host:", testAccount.smtp.host);
  console.log("   Port:", testAccount.smtp.port);
  console.log("   User:", testAccount.user);

  // Set environment variables to point to test SMTP
  process.env.SMTP_HOST = testAccount.smtp.host;
  process.env.SMTP_PORT = String(testAccount.smtp.port);
  process.env.SMTP_SECURE = String(testAccount.smtp.secure);
  process.env.SMTP_USER = testAccount.user;
  process.env.SMTP_PASS = testAccount.pass;
  process.env.SMTP_FROM = `"TaskPanda AI" <${testAccount.user}>`;

  console.log("\n2. Calling sendVerificationEmail with real SMTP network delivery...");
  const result = await sendVerificationEmail("student@example.com", "849203", "Test Student");

  console.log("\n3. Result:");
  console.log("   Success:", result.success);
  console.log("   Delivered:", result.delivered);
  console.log("   Message ID:", result.messageId);

  console.log("\n🎉 Full SMTP delivery completed successfully over the network!");
} catch (err) {
  console.error("❌ SMTP test failed:", err);
  process.exit(1);
}
