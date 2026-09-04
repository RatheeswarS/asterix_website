import { Router } from 'express';
import Submission from '../models/Submission.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

/**
 * Helper to normalize phone numbers (strip spaces, +, dashes)
 */
function normalizePhone(phone) {
    if (!phone) return '';
    return String(phone).replace(/\D/g, '').slice(-10);
}

/**
 * POST /api/submissions
 * Public endpoint for candidates to submit their Google Drive link.
 * Every submission is append-only: past submissions are never overwritten or deleted.
 */
router.post('/', async (req, res) => {
    try {
        const {
            subsystem,
            phase = 'phase1',
            cohort = 'General',
            group,
            submitterName,
            submitterPhone,
            partnerName,
            partnerDept,
            driveUrl,
            notes
        } = req.body;

        // Basic validation
        if (!subsystem || !group || !submitterName || !submitterPhone || !driveUrl) {
            return res.status(400).json({
                error: 'Missing required fields: subsystem, group, submitterName, submitterPhone, and driveUrl are mandatory.'
            });
        }

        const cleanUrl = String(driveUrl).trim();
        if (!cleanUrl.toLowerCase().includes('drive.google.com')) {
            return res.status(400).json({
                error: 'Invalid link: Please provide a valid Google Drive link (containing drive.google.com).'
            });
        }

        const normalizedPhone = normalizePhone(submitterPhone);
        if (normalizedPhone.length < 10) {
            return res.status(400).json({
                error: 'Please enter a valid 10-digit registered contact phone number.'
            });
        }

        // Count previous submissions for this group in this subsystem to determine version number
        const existingCount = await Submission.countDocuments({
            subsystem: subsystem.toLowerCase().trim(),
            group: group.trim()
        });

        const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '';
        const userAgent = req.headers['user-agent'] || '';

        const newSubmission = await Submission.create({
            subsystem: subsystem.toLowerCase().trim(),
            phase: String(phase).trim(),
            cohort: String(cohort).trim(),
            group: String(group).trim(),
            submitterName: String(submitterName).trim(),
            submitterPhone: normalizedPhone,
            partnerName: String(partnerName || '').trim(),
            partnerDept: String(partnerDept || '').trim(),
            driveUrl: cleanUrl,
            notes: String(notes || '').trim(),
            ip: clientIp,
            userAgent,
            status: 'SUBMITTED'
        });

        const submissionVersion = existingCount + 1;

        res.status(201).json({
            success: true,
            submissionId: newSubmission._id.toString(),
            version: submissionVersion,
            isUpdate: existingCount > 0,
            timestamp: newSubmission.createdAt,
            message: existingCount > 0
                ? `Submission #${submissionVersion} recorded! Your previous submission remains safely preserved in the audit log.`
                : 'Your Phase 1 Google Drive submission has been successfully recorded!'
        });
    } catch (err) {
        console.error('Error recording recruitment submission:', err);
        res.status(500).json({ error: 'Failed to record submission', details: err.message });
    }
});

/**
 * GET /api/submissions
 * Protected endpoint for Admin / Subsystem Leads to view all submissions.
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { subsystem, phase } = req.query;
        const filter = {};

        if (subsystem && subsystem !== 'all') {
            filter.subsystem = subsystem.toLowerCase().trim();
        }
        if (phase && phase !== 'all') {
            filter.phase = phase.trim();
        }

        const allSubmissions = await Submission.find(filter).sort({ createdAt: -1 });

        // Group submissions by subsystem + group so leads can see latest vs full revision history
        const grouped = {};
        allSubmissions.forEach(sub => {
            const key = `${sub.subsystem}:::${sub.group}`;
            if (!grouped[key]) {
                grouped[key] = {
                    key,
                    subsystem: sub.subsystem,
                    group: sub.group,
                    cohort: sub.cohort,
                    latest: sub,
                    history: []
                };
            }
            grouped[key].history.push(sub);
        });

        res.json({
            success: true,
            totalSubmissions: allSubmissions.length,
            uniqueTeamsCount: Object.keys(grouped).length,
            submissions: allSubmissions,
            groupedTeams: Object.values(grouped)
        });
    } catch (err) {
        console.error('Error fetching submissions:', err);
        res.status(500).json({ error: 'Failed to fetch submissions', details: err.message });
    }
});

/**
 * PATCH /api/submissions/:id/status
 * Protected endpoint to update status (e.g. REVIEWED, FLAGGED)
 */
router.patch('/:id/status', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['SUBMITTED', 'REVIEWED', 'FLAGGED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const updated = await Submission.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        res.json({ success: true, submission: updated });
    } catch (err) {
        console.error('Error updating submission status:', err);
        res.status(500).json({ error: 'Failed to update status', details: err.message });
    }
});

export default router;
