import { createHash, createPublicKey, verify } from 'node:crypto';

const b64 = value => Buffer.from(value, 'base64url');
let keys = null;
let keysUntil = 0;

async function googleKeys(force=false) {
  if (!force && keys && Date.now() < keysUntil) return keys;
  const response = await fetch('https://www.googleapis.com/oauth2/v3/certs', { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('Google certificates unavailable.');
  const data = await response.json();
  if (!Array.isArray(data.keys)) throw new Error('Invalid Google certificates.');
  keys = data.keys;
  const maxAge = Number(response.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1] || 300);
  keysUntil = Date.now() + Math.min(Math.max(maxAge, 60), 3600) * 1000;
  return keys;
}

export async function verifyGoogleIdToken(token, clientId, nonce) {
  try {
    if (typeof token !== 'string' || token.length > 20000) throw new Error('Invalid token.');
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token.');
    const header = JSON.parse(b64(parts[0]).toString('utf8'));
    const claims = JSON.parse(b64(parts[1]).toString('utf8'));
    if (header.alg !== 'RS256' || typeof header.kid !== 'string') throw new Error('Invalid algorithm.');
    let key = (await googleKeys()).find(k => k.kid === header.kid && k.kty === 'RSA' && k.use === 'sig');
    if(!key) key=(await googleKeys(true)).find(k=>k.kid===header.kid && k.kty==='RSA' && k.use==='sig');
    if (!key || !verify('RSA-SHA256', Buffer.from(`${parts[0]}.${parts[1]}`), createPublicKey({ key, format: 'jwk' }), b64(parts[2]))) throw new Error('Invalid signature.');
    const now = Math.floor(Date.now() / 1000);
    if (!['accounts.google.com', 'https://accounts.google.com'].includes(claims.iss) ||
        claims.aud !== clientId || (claims.azp && claims.azp !== clientId) ||
        !Number.isInteger(claims.exp) || claims.exp <= now ||
        !Number.isInteger(claims.iat) || claims.iat > now + 60 ||
        claims.nonce !== nonce ||
        typeof claims.sub !== 'string' || !claims.sub || claims.sub.length > 255 ||
        claims.email_verified !== true && claims.email_verified !== 'true' ||
        typeof claims.email !== 'string' || !claims.email.includes('@')) throw new Error('Invalid identity claims.');
    return { sub: claims.sub, email: claims.email };
  } catch { const e = new Error('Google sign-in could not be verified.'); e.status = 401; throw e; }
}

export function challenge(verifier) { return createHash('sha256').update(verifier).digest('base64url'); }
