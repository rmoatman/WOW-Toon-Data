// Lightweight validation helpers — no external dependency.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_RE.test(email.trim());
}

/**
 * Password rules: at least 8 chars, with a letter and a number.
 * Returns null if valid, otherwise an error message.
 */
export function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must include at least one letter and one number.';
  }
  return null;
}

// Throw a 400-style error the central handler can format.
export function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}
