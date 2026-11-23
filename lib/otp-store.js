
const OTP_EXPIRY = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

// Keep the OTP store on the Node.js global object
const otpStore =
  globalThis.__publicationExtractorOtpStore ||
  (globalThis.__publicationExtractorOtpStore = new Map());

export function saveOtp(challengeId, data) {
  otpStore.set(challengeId, {
    ...data,
    createdAt: Date.now(),
    expiresAt: Date.now() + OTP_EXPIRY,
    attempts: 0
  });
}

export function getOtp(challengeId) {
  const challenge = otpStore.get(challengeId);

  if (!challenge) return null;

  if (Date.now() > challenge.expiresAt) {
    otpStore.delete(challengeId);
    return null;
  }

  return challenge;
}

export function incrementOtpAttempts(challengeId) {
  const challenge = getOtp(challengeId);

  if (!challenge) return null;

  challenge.attempts += 1;

  if (challenge.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(challengeId);
    return null;
  }

  return challenge;
}

export function deleteOtp(challengeId) {
  otpStore.delete(challengeId);
}

export function getRemainingAttempts(challengeId) {
  const challenge = getOtp(challengeId);

  if (!challenge) return 0;

  return Math.max(0, MAX_ATTEMPTS - challenge.attempts);
}
