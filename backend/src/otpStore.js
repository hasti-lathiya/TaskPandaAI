import crypto from "crypto";

// Security parameters
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_ATTEMPTS = 5; // Max 5 incorrect attempts before temporary lockout
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout
const MAX_RESENDS_PER_HOUR = 5;
const OTP_SECRET = process.env.OTP_SECRET || "taskpanda_secure_otp_salt_2026";

/**
 * In-memory state for OTPs and verified users
 * Keyed by normalised email (lowercase, trimmed)
 */
const otpRecords = new Map();
const verifiedEmails = new Set();

function hashOtp(otp) {
  return crypto
    .createHash("sha256")
    .update(`${otp}:${OTP_SECRET}`)
    .digest("hex");
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/**
 * Generate a cryptographically secure 6-digit OTP code
 */
export function generateSecureOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Store a new OTP for an email, invalidating any existing OTP
 */
export function setOtpRecord(email, rawOtp, fullName = "") {
  const normEmail = normalizeEmail(email);
  const now = Date.now();
  const existing = otpRecords.get(normEmail);

  // Check rate limit: max requests per hour
  const resendHistory = (existing?.resendHistory || []).filter(
    (time) => now - time < 60 * 60 * 1000
  );

  if (resendHistory.length >= MAX_RESENDS_PER_HOUR) {
    const oldest = resendHistory[0];
    const waitMinutes = Math.ceil((60 * 60 * 1000 - (now - oldest)) / 60000);
    return {
      success: false,
      error: `Too many verification requests. Please wait ${waitMinutes} minute(s) before trying again.`,
    };
  }

  // Cooldown check (60 seconds)
  if (existing?.lastSentAt && now - existing.lastSentAt < RESEND_COOLDOWN_MS) {
    const remainingSeconds = Math.ceil(
      (RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000
    );
    return {
      success: false,
      error: `Please wait ${remainingSeconds} second(s) before requesting another code.`,
      remainingSeconds,
    };
  }

  resendHistory.push(now);

  const newRecord = {
    hashedOtp: hashOtp(rawOtp),
    expiresAt: now + OTP_EXPIRY_MS,
    lastSentAt: now,
    attempts: 0,
    blockedUntil: null,
    fullName,
    resendHistory,
  };

  otpRecords.set(normEmail, newRecord);

  return { success: true };
}

/**
 * Get resend cooldown status for an email
 */
export function getResendStatus(email) {
  const normEmail = normalizeEmail(email);
  const existing = otpRecords.get(normEmail);
  const now = Date.now();

  if (!existing?.lastSentAt) {
    return { canResend: true, remainingSeconds: 0 };
  }

  const elapsed = now - existing.lastSentAt;
  if (elapsed < RESEND_COOLDOWN_MS) {
    return {
      canResend: false,
      remainingSeconds: Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000),
    };
  }

  return { canResend: true, remainingSeconds: 0 };
}

/**
 * Verify submitted OTP against stored hash
 */
export function verifySubmittedOtp(email, submittedOtp) {
  const normEmail = normalizeEmail(email);
  const record = otpRecords.get(normEmail);
  const now = Date.now();

  if (!record) {
    return {
      success: false,
      error: "No verification code found for this email. Please request a new code.",
    };
  }

  // Check if locked out
  if (record.blockedUntil && now < record.blockedUntil) {
    const waitMinutes = Math.ceil((record.blockedUntil - now) / 60000);
    return {
      success: false,
      error: `Too many incorrect attempts. Verification is temporarily locked for ${waitMinutes} minute(s).`,
      locked: true,
    };
  }

  // Check expiration
  if (now > record.expiresAt) {
    return {
      success: false,
      error: "The verification code has expired. Please request a new one.",
      expired: true,
    };
  }

  // Validate format
  const cleanOtp = String(submittedOtp || "").trim();
  if (!/^\d{6}$/.test(cleanOtp)) {
    return {
      success: false,
      error: "Please enter a valid 6-digit code.",
    };
  }

  const submittedHash = hashOtp(cleanOtp);

  // Constant-time comparison to prevent timing attacks
  const match = crypto.timingSafeEqual(
    Buffer.from(submittedHash, "hex"),
    Buffer.from(record.hashedOtp, "hex")
  );

  if (!match) {
    record.attempts += 1;

    if (record.attempts >= MAX_ATTEMPTS) {
      record.blockedUntil = now + LOCKOUT_DURATION_MS;
      return {
        success: false,
        error: `Too many incorrect attempts. Your account verification is locked for 15 minutes.`,
        locked: true,
      };
    }

    const remainingAttempts = MAX_ATTEMPTS - record.attempts;
    return {
      success: false,
      error: `Incorrect code. ${remainingAttempts} attempt(s) remaining.`,
      remainingAttempts,
    };
  }

  // Success: mark email verified and remove active OTP record
  verifiedEmails.add(normEmail);
  otpRecords.delete(normEmail);

  return { success: true };
}

/**
 * Check if an email is marked verified
 */
export function isEmailVerified(email) {
  const normEmail = normalizeEmail(email);
  return verifiedEmails.has(normEmail);
}

/**
 * Mark an email as verified
 */
export function markEmailVerified(email) {
  const normEmail = normalizeEmail(email);
  verifiedEmails.add(normEmail);
}
