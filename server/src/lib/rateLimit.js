/**
 * Minimal in-process rate limiter.
 *
 * Deliberately dependency-free and in-memory: the recruitment endpoints need
 * enough friction to stop a bored applicant scripting a thousand submissions,
 * not a distributed quota system. A restart clears the counters, and a second
 * server instance would keep its own -- both acceptable for a single free-tier
 * dyno running a two-week intake.
 */

const buckets = new Map();

/** Drops windows nothing has touched recently so the map cannot grow forever. */
function prune(now) {
    for (const [key, entry] of buckets) {
        if (now - entry.resetAt > 60 * 60 * 1000) {
            buckets.delete(key);
        }
    }
}

/**
 * Express middleware. `max` requests per `windowMs` per IP per `name`.
 */
export function rateLimit({ name, max, windowMs }) {
    return function limiter(req, res, next) {
        const now = Date.now();
        if (buckets.size > 5000) prune(now);

        const ip = req.headers['x-forwarded-for']?.split(',')[0].trim()
            || req.socket?.remoteAddress
            || 'unknown';
        const key = `${name}:${ip}`;

        let entry = buckets.get(key);
        if (!entry || now >= entry.resetAt) {
            entry = { count: 0, resetAt: now + windowMs };
            buckets.set(key, entry);
        }

        entry.count += 1;
        if (entry.count > max) {
            const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
            res.set('Retry-After', String(retryAfter));
            return res.status(429).json({
                error: `Too many requests. Try again in ${retryAfter} seconds.`
            });
        }

        return next();
    };
}

/** The client IP, recorded alongside submissions for abuse investigation. */
export function clientIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0].trim()
        || req.socket?.remoteAddress
        || '';
}
