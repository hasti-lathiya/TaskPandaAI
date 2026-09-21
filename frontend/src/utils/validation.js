// Good enough to catch typos and obvious non-addresses without rejecting
// valid-but-unusual ones. Shared so the team screens can't drift apart on
// what counts as an acceptable invite address.
export const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

export default isValidEmail;
