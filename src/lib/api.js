/**
 * Base API URL resolver.
 * In local dev (Vite), relative URLs ('/api/...') are proxied to http://localhost:5000 via vite.config.js.
 * In production, set VITE_API_URL in your environment (e.g. on Vercel) to point to your cloud backend
 * (e.g. 'https://asterix-backend.onrender.com'), or configure vercel.json rewrites.
 */
export const API_BASE = (
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD ? 'https://asterix-backend.onrender.com' : '')
).replace(/\/+$/, '');

export function apiUrl(path) {
    if (!path || typeof path !== 'string') return '';
    const trimmed = path.trim();
    if (!trimmed) return '';
    // Filter out legacy non-existent local disk upload links pointing to render
    if (trimmed.includes('onrender.com/uploads/')) {
        return '';
    }
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
        return trimmed;
    }
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return API_BASE ? `${API_BASE}${cleanPath}` : cleanPath;
}

