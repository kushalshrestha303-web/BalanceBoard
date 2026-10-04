// In-memory limiter for authentication endpoints: 15 failed attempts per IP per 15 minutes.
// A successful attempt clears the counter so genuine users are never locked out by their own logins.
const WINDOW_MS = 15 * 60_000;
const MAX_FAILURES = 15;
const MAX_TRACKED_IPS = 5000;

export function createAuthLimiter() {
  const failures = new Map();
  return function authLimiter(req, res, next) {
    const key = req.ip || 'local';
    const now = Date.now();
    for (const [ip, entry] of failures) if (entry.until < now) failures.delete(ip);
    if (failures.size >= MAX_TRACKED_IPS && !failures.has(key)) return res.status(429).json({ error: 'Too many requests. Try again later.' });
    const entry = failures.get(key);
    if (entry && entry.count >= MAX_FAILURES) return res.status(429).json({ error: 'Too many attempts. Try again later.' });
    res.on('finish', () => {
      if (res.statusCode < 400) { failures.delete(key); return; }
      if (res.statusCode === 429) return;
      const current = failures.get(key) || { count: 0, until: Date.now() + WINDOW_MS };
      current.count++;
      failures.set(key, current);
    });
    next();
  };
}
