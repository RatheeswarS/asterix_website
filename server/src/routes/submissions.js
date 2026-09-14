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
 * GET /api/submissions/phase1-eligible
 * Public endpoint returning eligible teams/groups that submitted in Phase 1 for Software track.
 */
router.get('/phase1-eligible', async (req, res) => {
    try {
        const { subsystem = 'software' } = req.query;
        const normalizedSubsystem = String(subsystem).toLowerCase().trim();

        // Find all submissions for this subsystem that are Phase 1
        const phase1Submissions = await Submission.find({
            subsystem: normalizedSubsystem,
            phase: { $in: ['phase1', 'Phase 1', 'Phase 01', 'phase 1'] }
        }).sort({ createdAt: -1 });

        const eligibleGroups = new Set();
        const eligiblePhones = new Set();
        const eligibleNames = new Set();
        const groupDetails = {};

        phase1Submissions.forEach(sub => {
            const grp = sub.group?.trim();
            const cohort = sub.cohort?.trim() || 'General';
            if (grp) {
                const key = `${cohort}:::${grp}`.toLowerCase();
                eligibleGroups.add(grp);
                if (!groupDetails[key]) {
                    groupDetails[key] = {
                        group: grp,
                        cohort,
                        problemStatement: sub.problemStatement,
                        submitterName: sub.submitterName,
                        submitterPhone: sub.submitterPhone,
                        partnerName: sub.partnerName,
                        p1DriveUrl: sub.driveUrl,
                        p1GithubUrl: sub.githubUrl,
                        p1SubmittedAt: sub.createdAt
                    };
                }
            }
            if (sub.submitterPhone) eligiblePhones.add(normalizePhone(sub.submitterPhone));
            if (sub.submitterName) eligibleNames.add(sub.submitterName.toLowerCase().trim());
            if (sub.partnerName) eligibleNames.add(sub.partnerName.toLowerCase().trim());
        });

        res.json({
            success: true,
            subsystem: normalizedSubsystem,
            eligibleGroups: Array.from(eligibleGroups),
            eligiblePhones: Array.from(eligiblePhones),
            eligibleGroupDetails: groupDetails,
            totalEligibleTeams: Object.keys(groupDetails).length
        });
    } catch (err) {
        console.error('Error fetching Phase 1 eligible teams:', err);
        res.status(500).json({ error: 'Failed to fetch Phase 1 eligible teams', details: err.message });
    }
});

/**
 * POST /api/submissions
 * Public endpoint for candidates to submit their Google Drive & GitHub links.
 * Every submission is append-only: past submissions are never overwritten or deleted.
 */
router.post('/', async (req, res) => {
    try {
        const {
            subsystem,
            phase = 'phase2',
            cohort = 'General',
            group,
            submitterName,
            submitterPhone,
            partnerName,
            partnerDept,
            problemStatement = 'ps1',
            driveUrl,
            githubUrl,
            notes
        } = req.body;

        const isSoftware = String(subsystem).toLowerCase().trim() === 'software';
        const isPowertrain = String(subsystem).toLowerCase().trim() === 'powertrain';
        const isMechanical = String(subsystem).toLowerCase().trim() === 'mechanical';
        const cleanPhase = String(phase || (isPowertrain ? 'Round 2' : 'phase2')).toLowerCase().trim();

        // Prevent Phase 1 submission for software since deadline has passed
        if (isSoftware && (cleanPhase === 'phase1' || cleanPhase === 'phase 1' || cleanPhase === 'phase 01')) {
            return res.status(400).json({
                error: 'Phase 1 submissions are now officially closed. Please select Phase 2 to submit your implementation deliverables.'
            });
        }

        // Basic validation
        if (!subsystem || !group || !submitterName || !submitterPhone) {
            return res.status(400).json({
                error: 'Missing required fields: recruitment track, duo group, submitter name, and phone number are mandatory.'
            });
        }

        const normalizedPhone = normalizePhone(submitterPhone);
        if (normalizedPhone.length < 10) {
            return res.status(400).json({
                error: 'Please enter a valid 10-digit registered contact phone number.'
            });
        }

        const cleanUrl = String(driveUrl || '').trim();
        const cleanGithub = String(githubUrl || '').trim();

        // Validation for Software Phase 2:
        if (isSoftware) {
            // Check Phase 1 eligibility:
            // "Only the teams who have submitted phase one are allowed to submit the phase 2.
            // if anyone in the duo team has submitted in phase 1, then the team is eligible to submit phase 2."
            const phase1Matches = await Submission.find({
                subsystem: 'software',
                phase: { $in: ['phase1', 'Phase 1', 'Phase 01', 'phase 1'] },
                $or: [
                    { group: String(group).trim() },
                    { submitterPhone: normalizedPhone },
                    { submitterName: new RegExp(`^${String(submitterName).trim()}$`, 'i') },
                    { partnerName: new RegExp(`^${String(submitterName).trim()}$`, 'i') }
                ]
            });

            if (phase1Matches.length === 0) {
                return res.status(403).json({
                    error: `Eligibility restriction: Only teams who submitted Phase 1 deliverables are eligible to submit Phase 2. No Phase 1 record was found for ${group} (${submitterName}). If anyone from your duo team submitted Phase 1, please reach out to the Software Lead.`
                });
            }

            // In Phase 2, both Google Drive URL and GitHub URL are REQUIRED for BOTH PS1 and PS2!
            if (!cleanUrl || !cleanUrl.toLowerCase().includes('drive.google.com')) {
                return res.status(400).json({
                    error: 'Google Drive link required: Please provide a valid Google Drive folder URL (must contain drive.google.com) for your Phase 2 documentation & weights.'
                });
            }

            if (!cleanGithub || !cleanGithub.toLowerCase().includes('github.com')) {
                return res.status(400).json({
                    error: 'GitHub Repository link required: Phase 2 requires a valid GitHub repository URL (must contain github.com) with your source code and replay instructions.'
                });
            }
        } else if (isMechanical) {
            if (!cleanUrl || !cleanUrl.toLowerCase().includes('drive.google.com')) {
                return res.status(400).json({
                    error: 'Invalid link: Please provide a valid Google Drive folder link (must contain drive.google.com).'
                });
            }
        } else if (isPowertrain) {
            if (cleanUrl && !cleanUrl.toLowerCase().includes('drive.google.com')) {
                return res.status(400).json({
                    error: 'Invalid link: Please provide a valid Google Drive folder link (must contain drive.google.com).'
                });
            }
        }

        // Count previous submissions for this group in this subsystem & phase to determine version number
        const existingCount = await Submission.countDocuments({
            subsystem: subsystem.toLowerCase().trim(),
            group: group.trim(),
            phase: cleanPhase
        });

        const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '';
        const userAgent = req.headers['user-agent'] || '';

        const newSubmission = await Submission.create({
            subsystem: subsystem.toLowerCase().trim(),
            phase: cleanPhase,
            cohort: String(cohort).trim(),
            group: String(group).trim(),
            problemStatement: String(problemStatement || 'ps1').trim(),
            submitterName: String(submitterName).trim(),
            submitterPhone: normalizedPhone,
            partnerName: String(partnerName || '').trim(),
            partnerDept: String(partnerDept || '').trim(),
            driveUrl: cleanUrl,
            githubUrl: cleanGithub,
            notes: String(notes || '').trim(),
            ip: clientIp,
            userAgent,
            status: 'SUBMITTED'
        });

        const submissionVersion = existingCount + 1;

        let successMsg = 'Your submission has been successfully recorded!';
        if (isSoftware && (cleanPhase === 'phase2' || cleanPhase === 'phase 2')) {
            successMsg = existingCount > 0
                ? `Phase 2 Submission Revision #${submissionVersion} recorded! Your previous links remain safely preserved in the audit log.`
                : 'Your Phase 2 Google Drive and GitHub repository submission has been successfully recorded!';
        } else if (isPowertrain) {
            successMsg = existingCount > 0
                ? `Powertrain Registration #${submissionVersion} recorded!`
                : 'Your Problem Statement registration has been successfully recorded!';
        } else if (isMechanical) {
            successMsg = existingCount > 0
                ? `Mechanical Submission #${submissionVersion} recorded!`
                : 'Your Mechanical presentation submission has been successfully recorded!';
        }

        res.status(201).json({
            success: true,
            submissionId: newSubmission._id.toString(),
            version: submissionVersion,
            isUpdate: existingCount > 0,
            timestamp: newSubmission.createdAt,
            phase: cleanPhase,
            message: successMsg
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
            if (phase === 'phase1') {
                filter.phase = { $in: ['phase1', 'Phase 1', 'Phase 01', 'phase 1'] };
            } else if (phase === 'phase2') {
                filter.phase = { $in: ['phase2', 'Phase 2', 'Phase 02', 'phase 2'] };
            } else {
                filter.phase = phase.trim();
            }
        }

        const allSubmissions = await Submission.find(filter).sort({ createdAt: -1 });

        // Group submissions by subsystem + group so leads can see latest vs full revision history
        const grouped = {};
        allSubmissions.forEach(sub => {
            const phaseKey = (sub.phase || 'phase1').toLowerCase().trim();
            const key = `${sub.subsystem}:::${phaseKey}:::${sub.group}`;
            if (!grouped[key]) {
                grouped[key] = {
                    key,
                    subsystem: sub.subsystem,
                    phase: sub.phase,
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

