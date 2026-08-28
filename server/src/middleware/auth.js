import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'asterix_super_secret_jwt_key_sae_baja_2026';

export function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No authorization token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token.', details: err.message });
    }
}

export function requireSuperAdmin(req, res, next) {
    if (!req.user || req.user.accessLevel !== 'SuperAdmin') {
        return res.status(403).json({ error: 'Forbidden: SuperAdmin privileges required.' });
    }
    next();
}
