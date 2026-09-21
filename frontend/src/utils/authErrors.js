// Firebase surfaces machine codes like "auth/invalid-credential". Showing those
// to a student mid-signup is meaningless, so map the ones we can actually hit to
// plain language and fall back to a neutral message for anything unmapped.
//
// Note: the wrong-password / user-not-found / invalid-credential cases all share
// one message on purpose. Telling a visitor "no account with that email" lets a
// stranger probe which addresses are registered, so we stay vague about which
// half of the pair was wrong.
const AUTH_ERROR_MESSAGES = {
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/invalid-credential": "Email or password is incorrect.",
  "auth/wrong-password": "Email or password is incorrect.",
  "auth/user-not-found": "Email or password is incorrect.",
  "auth/missing-password": "Please enter your password.",
  "auth/user-disabled": "This account has been disabled. Please contact support.",
  "auth/email-already-in-use": "An account with this email already exists. Try logging in instead.",
  "auth/weak-password": "Password is too weak — please use at least 6 characters.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
  "auth/operation-not-allowed": "This sign-in method is currently unavailable.",
  "auth/requires-recent-login": "Please log in again to continue.",
  "auth/internal-error": "Something went wrong on our end. Please try again.",
};

export function getAuthErrorMessage(err) {
  if (!err) return "Something went wrong. Please try again.";
  return (
    AUTH_ERROR_MESSAGES[err.code] ||
    "Something went wrong. Please try again."
  );
}

export default getAuthErrorMessage;
