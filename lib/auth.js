import { SignJWT, jwtVerify } from 'jose';

function getSecret() {
  if (!process.env.AUTH_SECRET) {
    throw new Error('AUTH_SECRET is missing.');
  }

  return new TextEncoder().encode(process.env.AUTH_SECRET);
}

export async function createSession(username) {
  return new SignJWT({
    username,
    authenticated: true
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecret());
}

export async function verifySession(token) {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());

    if (payload.authenticated !== true) return null;

    return payload;
  } catch {
    return null;
  }
}