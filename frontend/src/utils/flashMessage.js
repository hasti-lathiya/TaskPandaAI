// A one-shot message handed from one route to the next.
//
// Router state alone is not enough here: Firebase signs a user in the moment
// they register or log in, so PublicRoute's own <Navigate to="/dashboard" />
// can win the race against the page's navigate(..., { state }) call — and that
// redirect carries no state, silently dropping the message. sessionStorage
// survives whichever navigation happens to win.
//
// Reading and clearing are deliberately separate. Under StrictMode React
// double-invokes state initialisers, so a read that also cleared would consume
// the message on the first invocation and hand the second an empty string.

const KEY = "taskpanda:flash";

export function setFlashMessage(message) {
  try {
    sessionStorage.setItem(KEY, message);
  } catch {
    // Private mode or blocked storage — the banner is a nicety, not critical.
  }
}

/** Pure read. Safe to call during render. */
export function peekFlashMessage() {
  try {
    return sessionStorage.getItem(KEY) || "";
  } catch {
    return "";
  }
}

/** Clears the message so it can never show twice. Call from an effect. */
export function clearFlashMessage() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to do — see above.
  }
}
