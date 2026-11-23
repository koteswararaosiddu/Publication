
import { SignJWT, jwtVerify } from 'jose';
import { createHash, timingSafeEqual } from 'crypto';

function getSecret() {
  if (!process.env.AUTH_SECRET) {
    throw new Error('AUTH_SECRET is missing.');
  }

  return new TextEncoder().encode(process.env.AUTH_SECRET);
}

export async function createOtpChallenge(username, otp) {
  const otpHash = createHash('sha256')
    .update(String(otp))
    .digest('hex');

  return new SignJWT({
    username,
    otpHash,
    purpose: 'email-otp'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(getSecret());
}

export async function verifyOtpChallenge(token, submittedOtp) {
  try {
    const { payload } = await jwtVerify(token, getSecret());

    if (
      payload.purpose !== 'email-otp' ||
      typeof payload.username !== 'string' ||
      typeof payload.otpHash !== 'string' ||
      !/^\d{6}$/.test(String(submittedOtp))
    ) {
      return null;
    }

    const submittedHash = createHash('sha256')
      .update(String(submittedOtp))
      .digest('hex');

    const expected = Buffer.from(payload.otpHash, 'hex');
    const actual = Buffer.from(submittedHash, 'hex');

    if (
      expected.length !== actual.length ||
      !timingSafeEqual(expected, actual)
    ) {
      return null;
    }

    return { username: payload.username };

  } catch {
    return null;
  }
}
