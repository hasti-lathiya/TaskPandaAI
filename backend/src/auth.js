import { Router } from "express";
import {
  generateSecureOtp,
  setOtpRecord,
  verifySubmittedOtp,
  getResendStatus,
  isEmailVerified,
} from "./otpStore.js";
import { sendVerificationEmail } from "./email.js";

const authRouter = Router();

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

/**
 * POST /api/auth/send-otp
 * Generates and sends a 6-digit OTP code to the requested email.
 */
authRouter.post("/send-otp", async (req, res) => {
  try {
    const { email, fullName } = req.body || {};

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid email address.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = String(fullName || "").trim();

    // Generate secure 6-digit code
    const otp = generateSecureOtp();

    // Store hashed OTP with rate limiting and expiration
    const recordResult = setOtpRecord(cleanEmail, otp, cleanName);
    if (!recordResult.success) {
      return res.status(429).json({
        success: false,
        error: recordResult.error,
        remainingSeconds: recordResult.remainingSeconds,
      });
    }

    // Send email (never expose the OTP in response)
    await sendVerificationEmail(cleanEmail, otp, cleanName);

    return res.json({
      success: true,
      message: "Verification code sent to your email.",
    });
  } catch (err) {
    console.error("[Auth API] send-otp error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to send verification email. Please try again later.",
    });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verifies the 6-digit OTP submitted by user.
 */
authRouter.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body || {};

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid email address.",
      });
    }

    if (!otp || String(otp).trim().length !== 6) {
      return res.status(400).json({
        success: false,
        error: "Please enter the complete 6-digit verification code.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const result = verifySubmittedOtp(cleanEmail, otp);

    if (!result.success) {
      const statusCode = result.locked ? 429 : 400;
      return res.status(statusCode).json({
        success: false,
        error: result.error,
        remainingAttempts: result.remainingAttempts,
        locked: result.locked,
        expired: result.expired,
      });
    }

    return res.json({
      success: true,
      message: "Email verified successfully.",
    });
  } catch (err) {
    console.error("[Auth API] verify-otp error:", err);
    return res.status(500).json({
      success: false,
      error: "Verification failed. Please try again later.",
    });
  }
});

/**
 * POST /api/auth/resend-otp
 * Resends a fresh OTP code, enforcing cooldown and invalidating prior code.
 */
authRouter.post("/resend-otp", async (req, res) => {
  try {
    const { email, fullName } = req.body || {};

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid email address.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check cooldown
    const cooldown = getResendStatus(cleanEmail);
    if (!cooldown.canResend) {
      return res.status(429).json({
        success: false,
        error: `Please wait ${cooldown.remainingSeconds} second(s) before requesting another code.`,
        remainingSeconds: cooldown.remainingSeconds,
      });
    }

    const otp = generateSecureOtp();
    const recordResult = setOtpRecord(cleanEmail, otp, fullName);

    if (!recordResult.success) {
      return res.status(429).json({
        success: false,
        error: recordResult.error,
        remainingSeconds: recordResult.remainingSeconds,
      });
    }

    await sendVerificationEmail(cleanEmail, otp, fullName);

    return res.json({
      success: true,
      message: "A new verification code has been sent to your email.",
    });
  } catch (err) {
    console.error("[Auth API] resend-otp error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to resend verification code. Please try again later.",
    });
  }
});

/**
 * POST /api/auth/check-status
 * Checks whether an email is verified.
 */
authRouter.post("/check-status", (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  const verified = isEmailVerified(email);
  return res.json({ verified });
});

export default authRouter;
