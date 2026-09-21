const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

/**
 * Request a 6-digit verification code to be emailed to user
 */
export async function requestVerificationOtp(email, fullName = "") {
  const response = await fetch(`${API_BASE}/api/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: String(email || "").trim().toLowerCase(),
      fullName: String(fullName || "").trim(),
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Failed to send verification email.");
  }

  return data;
}

/**
 * Verify the 6-digit code with the backend
 */
export async function verifyOtpCode(email, otp) {
  const response = await fetch(`${API_BASE}/api/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: String(email || "").trim().toLowerCase(),
      otp: String(otp || "").trim(),
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Verification failed. Please check your code.");
    error.remainingAttempts = data.remainingAttempts;
    error.locked = data.locked;
    error.expired = data.expired;
    throw error;
  }

  return data;
}

/**
 * Resend a new verification code, subject to cooldown
 */
export async function resendVerificationOtp(email, fullName = "") {
  const response = await fetch(`${API_BASE}/api/auth/resend-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: String(email || "").trim().toLowerCase(),
      fullName: String(fullName || "").trim(),
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Failed to resend code.");
    error.remainingSeconds = data.remainingSeconds;
    throw error;
  }

  return data;
}

/**
 * Check if an email is already verified
 */
export async function checkEmailVerified(email) {
  try {
    const response = await fetch(`${API_BASE}/api/auth/check-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: String(email || "").trim().toLowerCase(),
      }),
    });
    if (!response.ok) return false;
    const data = await response.json().catch(() => ({}));
    return Boolean(data.verified);
  } catch {
    return false;
  }
}
