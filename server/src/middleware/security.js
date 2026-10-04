// Security headers and a same-origin check for state-changing requests (CSRF defence in depth;
// the session cookie is also SameSite=Strict).
import { config } from '../config.js';

const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
  + "font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; object-src 'none'; "
  + "base-uri 'self'; frame-ancestors 'none'; form-action 'self'";

export function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store');
  if (config.isProduction) {
    res.setHeader('Content-Security-Policy', CSP);
    if (config.appOrigin?.startsWith('https://')) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  }
  next();
}

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function sameOriginOnly(req, res, next) {
  const origin = req.get('origin');
  if (!UNSAFE_METHODS.has(req.method) || !origin) return next();
  const host = (req.get('x-forwarded-host') || req.get('host') || '').split(',')[0].trim();
  const protocol = (req.get('x-forwarded-proto') || req.protocol || 'https').split(',')[0].trim();
  if (origin === `${protocol}://${host}` || origin === config.appOrigin) return next();
  return res.status(403).json({ error: 'Invalid request origin.' });
}
