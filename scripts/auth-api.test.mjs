import assert from "node:assert/strict";
import http from "node:http";
import app from "../backend/src/app.js";
import { setOtpRecord, generateSecureOtp } from "../backend/src/otpStore.js";

console.log("Running Express API router integration tests...\n");

const server = http.createServer(app);

await new Promise((resolve) => server.listen(0, resolve));
const port = server.address().port;
const baseUrl = `http://127.0.0.1:${port}`;

try {
  // Test 1: POST /api/auth/send-otp validation
  {
    const res = await fetch(`${baseUrl}/api/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "invalid-email" }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    console.log("✓ API Test 1: Invalid email rejected with 400");
  }

  // Test 2: POST /api/auth/send-otp without configured SMTP rejects with 503 (no fake delivery)
  {
    const res = await fetch(`${baseUrl}/api/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "integration@panda.edu", fullName: "Panda Student" }),
    });
    assert.equal(res.status, 503, "Must return HTTP 503 when SMTP is not configured");
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.otp, undefined, "OTP must NEVER be returned in response");
    console.log("✓ API Test 2: Unconfigured SMTP correctly rejected with 503 (No fake success)");
  }

  // Seed record for verification and cooldown tests
  setOtpRecord("integration@panda.edu", generateSecureOtp(), "Panda Student");

  // Test 3: POST /api/auth/verify-otp with wrong OTP
  {
    const res = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "integration@panda.edu", otp: "000000" }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.remainingAttempts < 5);
    console.log("✓ API Test 3: Wrong OTP rejected with attempt count");
  }

  // Test 4: POST /api/auth/resend-otp cooldown check
  {
    const res = await fetch(`${baseUrl}/api/auth/resend-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "integration@panda.edu" }),
    });
    assert.equal(res.status, 429, "Cooldown should return 429 Too Many Requests");
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.remainingSeconds > 0);
    console.log("✓ API Test 4: Resend cooldown enforced via HTTP 429");
  }

  // Test 5: POST /api/auth/check-status
  {
    const res = await fetch(`${baseUrl}/api/auth/check-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "integration@panda.edu" }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.verified, false);
    console.log("✓ API Test 5: check-status correctly reports unverified");
  }

  console.log("\nAll Express API router integration tests passed! 🚀");
} finally {
  server.close();
}
