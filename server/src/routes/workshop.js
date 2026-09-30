import { Router } from 'express';
import mongoose from 'mongoose';
import WorkshopRegistration from '../models/WorkshopRegistration.js';
import { nextSequence } from '../models/Counter.js';
import { authenticateToken } from '../middleware/auth.js';
import { isMongoConnected } from '../db/mongodb.js';
import {
    WORKSHOP_PACKAGES,
    WORKSHOP_TRACKS,
    WORKSHOP_CURRENCY,
    WORKSHOP_DEPARTMENTS,
    getWorkshopPackage,
    isPriced
} from '../config/workshopPackages.js';
import {
    isRazorpayConfigured,
    isWebhookConfigured,
    getRazorpayKeyId,
    createRazorpayOrder,
    verifyPaymentSignature,
    verifyWebhookSignature
} from '../lib/razorpay.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// The workshop is for first- and second-years.
const VALID_YEARS = ['1', '2'];
const STATUSES = ['pending', 'paid', 'failed'];

function normalizePhone(phone) {
    if (!phone) return '';
    return String(phone).replace(/\D/g, '').slice(-10);
}

function requireDb(req, res, next) {
    if (!isMongoConnected()) {
        return res.status(503).json({ error: 'Database unavailable. Please try again shortly.' });
    }
    next();
}

// Registrations can be viewed by all authenticated admin team members (SuperAdmin, Lead, Member, Admin).
function requireLeadOrAdmin(req, res, next) {
    const level = req.user?.accessLevel || req.user?.role;
    if (!req.user || !['SuperAdmin', 'Lead', 'Member', 'Admin'].includes(level)) {
        return res.status(403).json({ error: 'Forbidden: Admin privileges required.' });
    }
    next();
}

function formatReceiptNo(seq) {
    return `AST-WS-${String(seq).padStart(4, '0')}`;
}

/**
 * Moves a registration to `paid` exactly once, whichever of the checkout
 * callback and the webhook gets there first, and then gives it a receipt
 * number. If isUpgrade is true, upgrades the package to combo and updates the total amount.
 */
async function markPaid(registrationId, paymentId, isUpgrade = false) {
    let reg = await WorkshopRegistration.findById(registrationId);
    if (!reg) return null;

    if (isUpgrade || (reg.status === 'paid' && reg.package !== 'combo')) {
        reg.package = 'combo';
        reg.tracksEnrolled = ['software', 'powertrain'];
        reg.amount = 1750;
        reg.razorpayPaymentId = paymentId;
        reg.status = 'paid';
        reg.paidAt = new Date();
        await reg.save();
        return ensureReceipt(reg);
    }

    const claimed = await WorkshopRegistration.findOneAndUpdate(
        { _id: registrationId, status: { $ne: 'paid' } },
        { $set: { status: 'paid', razorpayPaymentId: paymentId, paidAt: new Date() } },
        { returnDocument: 'after' }
    );
    const updated = claimed || await WorkshopRegistration.findById(registrationId);
    return ensureReceipt(updated);
}

async function ensureReceipt(reg) {
    if (!reg || reg.status !== 'paid' || reg.receiptNo) return reg;
    const receiptNo = formatReceiptNo(await nextSequence('workshopReceipt'));
    const updated = await WorkshopRegistration.findOneAndUpdate(
        { _id: reg._id, receiptNo: { $exists: false } },
        { $set: { receiptNo } },
        { returnDocument: 'after' }
    );
    return updated || WorkshopRegistration.findById(reg._id);
}

function publicView(reg) {
    return {
        registrationId: reg._id.toString(),
        name: reg.name,
        email: reg.email,
        package: reg.package,
        packageName: getWorkshopPackage(reg.package)?.name || reg.package,
        tracksEnrolled: reg.tracksEnrolled,
        amount: reg.amount,
        currency: reg.currency,
        status: reg.status,
        receiptNo: reg.receiptNo || null,
        paidAt: reg.paidAt,
        createdAt: reg.createdAt
    };
}

function validateRegistration(body) {
    const str = (v, max = 120) => String(v ?? '').trim().slice(0, max);
    const data = {
        name: str(body.name, 100),
        email: str(body.email, 254).toLowerCase(),
        phone: normalizePhone(body.phone),
        college: str(body.college, 150),
        year: str(body.year, 2),
        department: str(body.department, 100),
        rollNo: str(body.rollNo, 40),
        package: str(body.package, 20).toLowerCase()
    };

    const errors = {};
    if (data.name.length < 2) errors.name = 'Enter your full name.';
    if (!EMAIL_RE.test(data.email)) {
        errors.email = 'Enter a valid email address.';
    } else if (!data.email.endsWith('@psgitech.ac.in')) {
        errors.email = 'Please use your college email address (@psgitech.ac.in).';
    }
    if (data.phone.length !== 10) errors.phone = 'Enter a valid 10-digit phone number.';
    if (!VALID_YEARS.includes(data.year)) errors.year = 'Select 1st or 2nd year.';
    if (!WORKSHOP_DEPARTMENTS.includes(data.department)) errors.department = 'Select your department.';
    if (!data.rollNo) errors.rollNo = 'Enter your roll number.';

    const pkg = getWorkshopPackage(data.package);
    if (!pkg) errors.package = 'Select a valid workshop package.';
    else if (!pkg.open) errors.package = 'Registrations for this package are closed.';
    else if (!isPriced(pkg)) errors.package = 'Pricing for this package has not been announced yet.';

    return { data, pkg, errors };
}

/**
 * GET /api/workshop/packages
 * Public package catalogue for the front end.
 */
router.get('/packages', (req, res) => {
    res.json({
        success: true,
        currency: WORKSHOP_CURRENCY,
        tracks: WORKSHOP_TRACKS,
        packages: WORKSHOP_PACKAGES
    });
});

/**
 * POST /api/workshop/register
 * Public. Validates the form, records a pending registration and creates a
 * Razorpay order. The amount comes from the package config; any amount in
 * the request body is ignored.
 */
router.post('/register', requireDb, async (req, res) => {
    try {
        if (!isRazorpayConfigured()) {
            return res.status(503).json({ error: 'Online payments are not configured yet. Please try again later.' });
        }

        const { data, pkg, errors } = validateRegistration(req.body || {});
        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ error: 'Please correct the highlighted fields.', fields: errors });
        }

        // Refuse a second payment for a track this person already holds, and offer upgrade if single-track.
        const alreadyPaid = await WorkshopRegistration.findOne({
            status: 'paid',
            tracksEnrolled: { $in: pkg.tracksIncluded },
            $or: [{ email: data.email }, { phone: data.phone }]
        });
        if (alreadyPaid) {
            const canUpgrade = alreadyPaid.package !== 'combo';
            return res.status(409).json({
                error: `You are already registered for ${getWorkshopPackage(alreadyPaid.package)?.name || alreadyPaid.package} (receipt ${alreadyPaid.receiptNo || 'pending'}).`,
                alreadyPaid: true,
                canUpgrade,
                existingRegistrationId: alreadyPaid._id.toString(),
                existingPackage: alreadyPaid.package,
                existingName: alreadyPaid.name,
                upgradePrice: 750
            });
        }

        const registration = await WorkshopRegistration.create({
            ...data,
            package: pkg.id,
            tracksEnrolled: pkg.tracksIncluded,
            amount: pkg.price,
            currency: WORKSHOP_CURRENCY,
            status: 'pending'
        });

        let order;
        try {
            order = await createRazorpayOrder({
                amountPaise: Math.round(pkg.price * 100),
                currency: WORKSHOP_CURRENCY,
                receipt: registration._id.toString(),
                notes: { registrationId: registration._id.toString(), package: pkg.id }
            });
        } catch (orderErr) {
            console.error('Workshop order creation failed:', orderErr.message);
            registration.status = 'failed';
            await registration.save();
            return res.status(502).json({ error: 'Could not start the payment. Please try again.' });
        }

        registration.razorpayOrderId = order.id;
        await registration.save();

        res.status(201).json({
            success: true,
            registrationId: registration._id.toString(),
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency
            },
            keyId: getRazorpayKeyId(),
            package: { id: pkg.id, name: pkg.name, price: pkg.price },
            prefill: { name: data.name, email: data.email, contact: data.phone }
        });
    } catch (err) {
        console.error('Workshop registration error:', err);
        res.status(500).json({ error: 'Failed to record registration.' });
    }
});

/**
 * POST /api/workshop/upgrade
 * Initiates Razorpay checkout to upgrade an existing single-track registration to Combo for 750.
 */
router.post('/upgrade', requireDb, async (req, res) => {
    try {
        if (!isRazorpayConfigured()) {
            return res.status(503).json({ error: 'Online payments are not configured yet. Please try again later.' });
        }

        const { registrationId, email, phone, rollNo } = req.body || {};
        let reg = null;

        if (registrationId) {
            reg = await WorkshopRegistration.findById(registrationId);
        } else if (rollNo || email || phone) {
            const query = { status: 'paid' };
            const orConditions = [];
            if (rollNo) orConditions.push({ rollNo: String(rollNo).trim() });
            if (email) orConditions.push({ email: String(email).toLowerCase().trim() });
            if (phone) orConditions.push({ phone: normalizePhone(phone) });
            if (orConditions.length > 0) query.$or = orConditions;
            reg = await WorkshopRegistration.findOne(query).sort({ createdAt: -1 });
        }

        if (!reg || reg.status !== 'paid') {
            return res.status(404).json({ error: 'No paid single-track registration found to upgrade.' });
        }

        if (reg.package === 'combo' || (Array.isArray(reg.tracksEnrolled) && reg.tracksEnrolled.length >= 2)) {
            return res.status(400).json({ error: 'This registration is already enrolled in the full Combo package.' });
        }

        const upgradePrice = 750;
        const order = await createRazorpayOrder({
            amountPaise: Math.round(upgradePrice * 100),
            currency: WORKSHOP_CURRENCY,
            receipt: `upg_${reg._id.toString()}`,
            notes: {
                registrationId: reg._id.toString(),
                type: 'upgrade',
                targetPackage: 'combo'
            }
        });

        reg.razorpayOrderId = order.id;
        await reg.save();

        res.json({
            success: true,
            registrationId: reg._id.toString(),
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency
            },
            keyId: getRazorpayKeyId(),
            package: { id: 'combo', name: 'Dual-Track Combo (Upgrade)', price: upgradePrice },
            prefill: { name: reg.name, email: reg.email, contact: reg.phone }
        });
    } catch (err) {
        console.error('Workshop upgrade order creation failed:', err);
        res.status(500).json({ error: 'Failed to initiate workshop upgrade.' });
    }
});

/**
 * POST /api/workshop/verify
 * Called by the front end with the fields the Razorpay checkout returns.
 * Marks the registration paid only if the signature checks out.
 */
router.post('/verify', requireDb, async (req, res) => {
    try {
        const {
            razorpay_order_id: orderId,
            razorpay_payment_id: paymentId,
            razorpay_signature: signature
        } = req.body || {};

        if (!verifyPaymentSignature(orderId, paymentId, signature)) {
            return res.status(400).json({ error: 'Payment verification failed.' });
        }

        const reg = await WorkshopRegistration.findOne({ razorpayOrderId: String(orderId) });
        if (!reg) {
            return res.status(404).json({ error: 'Registration not found for this order.' });
        }

        const isUpgrade = reg.status === 'paid' && reg.package !== 'combo';
        const paid = await markPaid(reg._id, String(paymentId), isUpgrade);
        res.json({ success: true, registration: publicView(paid), upgraded: isUpgrade });
    } catch (err) {
        console.error('Workshop payment verification error:', err);
        res.status(500).json({ error: 'Failed to verify payment.' });
    }
});

/**
 * POST /api/workshop/webhook
 * Razorpay webhook, a backup for when the browser never reaches /verify
 * (closed tab, dropped connection). index.js mounts a raw body parser on this
 * path so the signature is checked against the exact bytes Razorpay sent.
 */
router.post('/webhook', async (req, res) => {
    try {
        if (!isWebhookConfigured()) {
            // Secret not added yet: say so plainly instead of "invalid signature".
            // Non-2xx also means Razorpay keeps the event and retries it later.
            console.warn('Workshop webhook received but RAZORPAY_WEBHOOK_SECRET is not set.');
            return res.status(503).json({ error: 'Webhook not configured.' });
        }
        const rawBody = Buffer.isBuffer(req.body) ? req.body : null;
        if (!verifyWebhookSignature(rawBody, req.headers['x-razorpay-signature'])) {
            return res.status(400).json({ error: 'Invalid signature.' });
        }
        if (!isMongoConnected()) {
            // Non-2xx makes Razorpay retry later.
            return res.status(503).json({ error: 'Database unavailable.' });
        }

        const event = JSON.parse(rawBody.toString('utf8'));
        const payment = event?.payload?.payment?.entity;
        if (!payment?.order_id) return res.json({ received: true });

        const reg = await WorkshopRegistration.findOne({ razorpayOrderId: payment.order_id });
        if (!reg) return res.json({ received: true });

        if (event.event === 'payment.captured') {
            const isUpgrade = reg.status === 'paid' && reg.package !== 'combo';
            const expectedPaise = isUpgrade ? 75000 : Math.round(reg.amount * 100);
            if (payment.amount !== expectedPaise || payment.currency !== reg.currency) {
                console.error(`Workshop webhook amount mismatch on ${payment.order_id}: got ${payment.amount} ${payment.currency}, expected ${expectedPaise} ${reg.currency}`);
                return res.json({ received: true });
            }
            await markPaid(reg._id, payment.id, isUpgrade);
        } else if (event.event === 'payment.failed') {
            await WorkshopRegistration.updateOne(
                { _id: reg._id, status: 'pending' },
                { $set: { status: 'failed', razorpayPaymentId: payment.id || '' } }
            );
        }

        res.json({ received: true });
    } catch (err) {
        console.error('Workshop webhook error:', err);
        res.status(500).json({ error: 'Webhook processing failed.' });
    }
});

/**
 * GET /api/workshop/status/:id
 * Public, minimal view of one registration for the confirmation page.
 */
router.get('/status/:id', requireDb, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ error: 'Registration not found.' });
        }
        const reg = await ensureReceipt(await WorkshopRegistration.findById(req.params.id));
        if (!reg) return res.status(404).json({ error: 'Registration not found.' });
        res.json({ success: true, registration: publicView(reg) });
    } catch (err) {
        console.error('Workshop status error:', err);
        res.status(500).json({ error: 'Failed to fetch registration.' });
    }
});

/* Name + register number are known to classmates, so this lookup is throttled
   and returns the email and phone masked. Render's proxy appends the real
   client address as the last X-Forwarded-For entry; earlier entries can be
   set by the client, so only the last one is used. */
const LOOKUP_WINDOW_MS = 15 * 60 * 1000;
const LOOKUP_MAX = 10;
const lookupHits = new Map();

function clientKey(req) {
    const forwarded = String(req.headers['x-forwarded-for'] || '').split(',').map(s => s.trim()).filter(Boolean);
    return forwarded[forwarded.length - 1] || req.socket.remoteAddress || 'unknown';
}

function lookupLimited(req) {
    const now = Date.now();
    const key = clientKey(req);
    const hits = (lookupHits.get(key) || []).filter(t => now - t < LOOKUP_WINDOW_MS);
    hits.push(now);
    lookupHits.set(key, hits);
    if (lookupHits.size > 5000) {
        for (const [k, times] of lookupHits) {
            if (times.every(t => now - t >= LOOKUP_WINDOW_MS)) lookupHits.delete(k);
        }
    }
    return hits.length > LOOKUP_MAX;
}

function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function maskEmail(email) {
    const [user, domain] = String(email || '').split('@');
    if (!domain) return '';
    return `${user.slice(0, 2)}${'*'.repeat(Math.max(user.length - 2, 1))}@${domain}`;
}

function maskPhone(phone) {
    const digits = String(phone || '');
    return digits ? `${'*'.repeat(Math.max(digits.length - 4, 0))}${digits.slice(-4)}` : '';
}

/**
 * POST /api/workshop/receipt-lookup
 * Body: { name, rollNo }. Paid registrations matching both (case and extra
 * spaces ignored), for students re-downloading a receipt they lost.
 */
router.post('/receipt-lookup', requireDb, async (req, res) => {
    try {
        if (lookupLimited(req)) {
            return res.status(429).json({ error: 'Too many attempts. Please wait a few minutes and try again.' });
        }
        const rollNo = String(req.body?.rollNo ?? '').trim().slice(0, 40);
        const phone = String(req.body?.phone ?? req.body?.mobile ?? '').trim();
        const query = String(req.body?.query ?? '').trim();

        const terms = [rollNo, phone, query].filter(Boolean);
        if (terms.length === 0) {
            return res.status(400).json({ error: 'Enter your College Registration Number or Phone Number.' });
        }

        const orConditions = [];
        for (const term of terms) {
            // Match rollNo directly (case-insensitive exact or trimmed)
            orConditions.push({ rollNo: new RegExp(`^\\s*${escapeRegex(term)}\\s*$`, 'i') });

            // Match phone (clean digits)
            const digits = normalizePhone(term);
            if (digits.length >= 10) {
                orConditions.push({ phone: digits.slice(-10) });
            }
            orConditions.push({ phone: term });

            // Also check partial roll number if 4 or more chars
            if (term.length >= 4) {
                orConditions.push({ rollNo: new RegExp(escapeRegex(term), 'i') });
            }
        }

        const regs = await WorkshopRegistration.find({
            status: 'paid',
            $or: orConditions
        }).sort({ paidAt: -1 }).limit(5);

        if (regs.length === 0) {
            return res.status(404).json({
                error: 'No paid registration found for that number. Please verify what you entered.'
            });
        }

        const receipts = [];
        for (const reg of regs) {
            const withReceipt = await ensureReceipt(reg);
            receipts.push({
                ...publicView(withReceipt),
                rollNo: withReceipt.rollNo,
                department: withReceipt.department,
                year: withReceipt.year,
                email: maskEmail(withReceipt.email),
                phone: maskPhone(withReceipt.phone)
            });
        }
        res.json({ success: true, receipts });
    } catch (err) {
        console.error('Workshop receipt lookup error:', err);
        res.status(500).json({ error: 'Could not look up your receipt. Please try again.' });
    }
});

const CSV_COLUMNS = [
    ['receiptNo', 'Receipt No'],
    ['name', 'Name'],
    ['email', 'Email'],
    ['phone', 'Phone'],
    ['college', 'College'],
    ['year', 'Year'],
    ['department', 'Department'],
    ['rollNo', 'Roll No'],
    ['package', 'Package'],
    ['tracksEnrolled', 'Tracks'],
    ['amount', 'Amount (INR)'],
    ['status', 'Status'],
    ['razorpayOrderId', 'Razorpay Order ID'],
    ['razorpayPaymentId', 'Razorpay Payment ID'],
    ['paidAt', 'Paid At'],
    ['createdAt', 'Registered At']
];

function csvCell(value) {
    let text;
    if (value == null) text = '';
    else if (Array.isArray(value)) text = value.join('+');
    else if (value instanceof Date) text = value.toISOString();
    else text = String(value);
    // Spreadsheet formula injection guard: these fields are user-supplied.
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
}

/**
 * GET /api/workshop/registrations?package=&track=&status=&format=csv
 * Protected: SuperAdmins, Leads, and Members.
 */
router.get('/registrations', authenticateToken, requireLeadOrAdmin, requireDb, async (req, res) => {
    try {
        const { package: pkgId, track, status, format } = req.query;
        const filter = {};

        if (pkgId && pkgId !== 'all') {
            if (!getWorkshopPackage(pkgId)) return res.status(400).json({ error: 'Unknown package.' });
            filter.package = String(pkgId).toLowerCase().trim();
        }
        if (track && track !== 'all') {
            if (!WORKSHOP_TRACKS[track]) return res.status(400).json({ error: 'Unknown track.' });
            filter.tracksEnrolled = track;
        }
        if (status && status !== 'all') {
            if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Unknown status.' });
            filter.status = status;
        }

        const registrations = await WorkshopRegistration.find(filter).sort({ createdAt: -1 }).lean();

        if (format === 'csv') {
            const lines = [
                CSV_COLUMNS.map(([, label]) => csvCell(label)).join(','),
                ...registrations.map(r => CSV_COLUMNS.map(([key]) => csvCell(r[key])).join(','))
            ];
            const stamp = new Date().toISOString().slice(0, 10);
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="workshop-registrations-${stamp}.csv"`);
            // BOM so Excel reads UTF-8 names correctly.
            return res.send('﻿' + lines.join('\r\n'));
        }

        const summary = { total: registrations.length, paid: 0, pending: 0, failed: 0, revenue: 0 };
        for (const r of registrations) {
            summary[r.status] += 1;
            if (r.status === 'paid') summary.revenue += r.amount;
        }

        res.json({ success: true, summary, registrations });
    } catch (err) {
        console.error('Error fetching workshop registrations:', err);
        res.status(500).json({ error: 'Failed to fetch registrations.' });
    }
});

export default router;
