import crypto from 'node:crypto';

/**
 * Minimal Razorpay client over the REST API (no SDK dependency).
 *
 * Keys come only from the environment. RAZORPAY_KEY_SECRET never leaves the
 * server; RAZORPAY_KEY_ID is public by design and is handed to the checkout
 * widget.
 */

const API_BASE = 'https://api.razorpay.com/v1';

/**
 * Reads a Razorpay env value, treating the .env.example placeholders
 * ("rzp_test_xxxx...", "your_...") as unset so a copied example file never
 * counts as configured.
 */
function envValue(name) {
    const value = process.env[name]?.trim() || '';
    if (!value || value.startsWith('your_') || /x{6,}/i.test(value)) return '';
    return value;
}

export function isRazorpayConfigured() {
    return Boolean(envValue('RAZORPAY_KEY_ID') && envValue('RAZORPAY_KEY_SECRET'));
}

export function isWebhookConfigured() {
    return Boolean(envValue('RAZORPAY_WEBHOOK_SECRET'));
}

export function getRazorpayKeyId() {
    return envValue('RAZORPAY_KEY_ID');
}

/**
 * One line for the startup log, so a deploy shows at a glance what is missing.
 */
export function describeRazorpayStatus() {
    const keys = isRazorpayConfigured()
        ? `keys set (${envValue('RAZORPAY_KEY_ID').startsWith('rzp_live_') ? 'LIVE' : 'test'} mode)`
        : 'keys not set, registrations refused';
    const webhook = isWebhookConfigured() ? 'webhook secret set' : 'webhook secret not set';
    return `Razorpay: ${keys}; ${webhook}.`;
}

/**
 * Creates an order. `amountPaise` must already be computed server-side.
 */
export async function createRazorpayOrder({ amountPaise, currency, receipt, notes }) {
    const keyId = envValue('RAZORPAY_KEY_ID');
    const keySecret = envValue('RAZORPAY_KEY_SECRET');
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const response = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${auth}`
        },
        body: JSON.stringify({ amount: amountPaise, currency, receipt, notes }),
        signal: AbortSignal.timeout(15000)
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
        const reason = body?.error?.description || `HTTP ${response.status}`;
        throw new Error(`Razorpay order creation failed: ${reason}`);
    }
    return body;
}

function safeEqualHex(expected, received) {
    const a = Buffer.from(String(expected), 'utf8');
    const b = Buffer.from(String(received || ''), 'utf8');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Checkout callback signature: HMAC-SHA256(order_id + "|" + payment_id, key secret).
 */
export function verifyPaymentSignature(orderId, paymentId, signature) {
    const secret = envValue('RAZORPAY_KEY_SECRET');
    if (!secret || !orderId || !paymentId || !signature) return false;
    const expected = crypto
        .createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');
    return safeEqualHex(expected, signature);
}

/**
 * Webhook signature: HMAC-SHA256(raw request body, webhook secret). The
 * webhook secret is the one set in the Razorpay dashboard for this webhook,
 * which is not the API key secret.
 */
export function verifyWebhookSignature(rawBody, signature) {
    const secret = envValue('RAZORPAY_WEBHOOK_SECRET');
    if (!secret || !rawBody || !signature) return false;
    const expected = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');
    return safeEqualHex(expected, signature);
}
