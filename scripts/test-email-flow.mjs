import assert from "node:assert/strict";
import http from "node:http";
import app from "../backend/src/app.js";
import {
  generateSecureOtp,
  setOtpRecord,
  verifySubmittedOtp,
  getResendStatus,
} from "../backend/src/otpStore.js";

console.log("==================================================");
console.log("Running Complete Email OTP Flow Verification Tests");
console.log("==================================================\n");

const server = http.createServer(app);
await new Promise((resolve) => server.listen(0, resolve));
const port = server.address().port;
const baseUrl = `http://127.0.0.1:${port}`;

try {
  // Test 1: Diagnostic endpoint /api/auth/email-status when unconfigured
  {
    const res = await fetch(`${baseUrl}/api/auth/email-status`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    console.log(`✓ Test 1: /api/auth/email-status reports configured=${data.configured}`);
  }

  // Test 2: POST /api/auth/send-otp must NOT fake delivery when SMTP is unconfigured
  {
    const res = await fetch(`${baseUrl}/api/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test-unconfigured@example.com", fullName: "Test User" }),
    });
    // When SMTP is not configured, it must return 503 and NOT claim success
    assert.equal(res.status, 503, "Unconfigured SMTP must return HTTP 503");
    const data = await res.json();
    assert.equal(data.success, false, "Must not fake delivery success");
    assert.match(data.error, /Unable to send verification email/i);
    console.log("✓ Test 2: Unconfigured SMTP correctly rejects send-otp with 503 (No fake delivery)");
  }

  // Test 3: OTP generation and format
  {
    const otp = generateSecureOtp();
    assert.equal(typeof otp, "string");
    assert.equal(otp.length, 6);
    assert.match(otp, /^\d{6}$/);
    console.log("✓ Test 3: Secure 6-digit numeric OTP generated correctly");
  }

  // Test 4: OTP storage and incorrect OTP rejection
  {
    const testEmail = "verifier-test@panda.edu";
    const realOtp = generateSecureOtp();
    setOtpRecord(testEmail, realOtp, "Tester");

    // Submit wrong OTP
    const wrongRes = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, otp: "000000" }),
    });
    assert.equal(wrongRes.status, 400);
    const wrongData = await wrongRes.json();
    assert.equal(wrongData.success, false);
    assert.equal(wrongData.remainingAttempts, 4);
    console.log("✓ Test 4: Incorrect OTP rejected with remaining attempts decremented");
  }

  // Test 5: Valid OTP verification
  {
    const testEmail = "valid-verify@panda.edu";
    const realOtp = generateSecureOtp();
    setOtpRecord(testEmail, realOtp, "Tester");

    const validRes = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, otp: realOtp }),
    });
    assert.equal(validRes.status, 200);
    const validData = await validRes.json();
    assert.equal(validData.success, true);
    console.log("✓ Test 5: Valid 6-digit OTP accepted and marked verified");

    // Check status
    const statusRes = await fetch(`${baseUrl}/api/auth/check-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail }),
    });
    const statusData = await statusRes.json();
    assert.equal(statusData.verified, true);
    console.log("✓ Test 5b: check-status confirms user is verified");
  }

  // Test 6: Expired OTP is rejected
  {
    const testEmail = "expired-otp@panda.edu";
    const realOtp = generateSecureOtp();
    setOtpRecord(testEmail, realOtp, "Tester");

    // Verify once
    const result = verifySubmittedOtp(testEmail, realOtp);
    assert.equal(result.success, true);

    // Verify again (should fail as it was consumed)
    const reVerify = verifySubmittedOtp(testEmail, realOtp);
    assert.equal(reVerify.success, false);
    console.log("✓ Test 6: Consumed OTP cannot be reused");
  }

  // Test 7: Resend cooldown enforcement
  {
    const testEmail = "cooldown-test@panda.edu";
    const otp1 = generateSecureOtp();
    setOtpRecord(testEmail, otp1, "Tester");

    const cooldownStatus = getResendStatus(testEmail);
    assert.equal(cooldownStatus.canResend, false);
    assert.ok(cooldownStatus.remainingSeconds > 0 && cooldownStatus.remainingSeconds <= 60);
    console.log(`✓ Test 7: Resend cooldown enforced (${cooldownStatus.remainingSeconds}s remaining)`);
  }

  console.log("\n==================================================");
  console.log("All Email OTP Flow Unit & API tests PASSED! 🚀");
  console.log("==================================================\n");
} finally {
  server.close();
}
