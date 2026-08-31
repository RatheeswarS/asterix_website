import { Router } from 'express';
import SponsorInquiry from '../models/SponsorInquiry.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// POST /api/sponsor-inquiries (Public - Submit inquiry)
router.post('/', async (req, res) => {
    try {
        const { companyName, contactPerson, email, phone, tier, message } = req.body;

        if (!companyName || !email) {
            return res.status(400).json({ error: 'Company name and email are required.' });
        }

        const inquiry = await SponsorInquiry.create({
            companyName: companyName.trim(),
            contactPerson: (contactPerson || '').trim(),
            email: email.trim().toLowerCase(),
            phone: (phone || '').trim(),
            tier: tier || 'TECHNICAL',
            message: (message || '').trim(),
            status: 'NEW'
        });

        res.status(201).json({
            success: true,
            message: 'Sponsorship inquiry received. Team Asterix will reach out shortly!',
            inquiryId: inquiry._id.toString()
        });
    } catch (err) {
        console.error('Error recording sponsor inquiry:', err);
        res.status(500).json({ error: 'Failed to submit inquiry', details: err.message });
    }
});

// GET /api/sponsor-inquiries (Protected - Admin)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const inquiries = await SponsorInquiry.find().sort({ createdAt: -1 });
        res.json(inquiries.map(i => ({
            id: i._id.toString(),
            companyName: i.companyName,
            contactPerson: i.contactPerson,
            email: i.email,
            phone: i.phone,
            tier: i.tier,
            message: i.message,
            status: i.status,
            createdAt: i.createdAt
        })));
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve inquiries', details: err.message });
    }
});

// PATCH /api/sponsor-inquiries/:id (Protected - Admin update status)
router.patch('/:id', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        const allowedStatuses = ['NEW', 'REVIEWED', 'CONTACTED', 'ARCHIVED'];
        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({ error: `Status must be one of: ${allowedStatuses.join(', ')}` });
        }

        const targetId = req.params.id;
        if (!SponsorInquiry.base.isValidObjectId(targetId)) {
            return res.status(400).json({ error: 'Invalid inquiry ID format.' });
        }

        const inquiry = await SponsorInquiry.findByIdAndUpdate(
            targetId,
            { $set: { status } },
            { returnDocument: 'after' }
        );

        if (!inquiry) {
            return res.status(404).json({ error: 'Inquiry not found.' });
        }

        res.json({ success: true, message: 'Status updated.', status: inquiry.status });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update inquiry', details: err.message });
    }
});

// DELETE /api/sponsor-inquiries/:id (Protected - Admin)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const targetId = req.params.id;
        if (!SponsorInquiry.base.isValidObjectId(targetId)) {
            return res.status(400).json({ error: 'Invalid inquiry ID format.' });
        }
        await SponsorInquiry.findByIdAndDelete(targetId);
        res.json({ success: true, message: 'Inquiry removed.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete inquiry', details: err.message });
    }
});

export default router;
