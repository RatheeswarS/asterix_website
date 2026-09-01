import { Router } from 'express';
import SiteData from '../models/SiteData.js';
import { isMongoConnected } from '../db/mongodb.js';
import { buildCredentials } from '../lib/credentials.js';

const router = Router();

/**
 * Public credential lookup.
 *
 * This is what makes a badge worth anything. The page a member shares renders
 * from the browser's own copy of the roster, which the member could have edited
 * in devtools before taking a screenshot; the check below is the independent
 * one, answered by the team's database rather than by the visitor's tab. A
 * recruiter following the link gets `verified: true` only if the roster the
 * team maintains still carries that person with that role.
 *
 * Removing someone from the roster, or unticking their credential in the
 * admin, retires the badge immediately -- there is nothing cached and nothing
 * signed that could outlive the record.
 */

/* The roster the credential is checked against. `SiteData` is the one the admin
   writes, so a credential can never claim a role the site does not show. */
async function roster() {
    if (!isMongoConnected()) return null;
    const site = await SiteData.findOne({ key: 'main' }).lean();
    const subsystems = site?.subsystems;
    /* An empty roster is "the registry has nothing to check against", not
       "this person is not on the team". Returning `[]` here would make every
       badge answer 404 -- an accusation -- on a fresh database where the admin
       simply has not saved the site content yet. */
    if (!Array.isArray(subsystems) || subsystems.length === 0) return null;
    return subsystems;
}

// GET /api/credentials — every issued credential, newest roster order.
router.get('/', async (req, res) => {
    try {
        const subsystems = await roster();
        if (!subsystems) {
            return res.status(503).json({
                error: 'The credential registry is unavailable because the database is not connected.',
                credentials: []
            });
        }

        let credentials = buildCredentials(subsystems);

        const { status, subsystem } = req.query;
        if (status === 'alumni') credentials = credentials.filter((c) => c.status === 'Alumni');
        if (status === 'active') credentials = credentials.filter((c) => c.status !== 'Alumni');
        if (subsystem) credentials = credentials.filter((c) => c.subsystemId === subsystem);

        res.json({
            total: credentials.length,
            checkedAt: new Date().toISOString(),
            credentials
        });
    } catch (err) {
        console.error('Failed to list credentials:', err);
        res.status(500).json({ error: 'Could not read the credential registry.', details: err.message });
    }
});

// GET /api/credentials/:id — one credential, verified against the live roster.
router.get('/:id', async (req, res) => {
    try {
        const id = String(req.params.id || '').trim().toUpperCase();
        const subsystems = await roster();

        if (!subsystems) {
            return res.status(503).json({
                verified: false,
                reason: 'registry_unavailable',
                error: 'The credential registry is unavailable because the database is not connected.'
            });
        }

        const credential = buildCredentials(subsystems).find((c) => c.id === id);
        if (!credential) {
            /* A retired badge and a badge that never existed answer the same
               way on purpose. Distinguishing them would turn this endpoint into
               a way to enumerate people who have left the team. */
            return res.status(404).json({
                verified: false,
                reason: 'not_on_roster',
                error: 'No active credential carries that identifier.'
            });
        }

        res.json({
            verified: true,
            checkedAt: new Date().toISOString(),
            issuer: {
                name: 'Team Asterix — SAEINDIA BAJA',
                institution: 'PSG Institute of Technology and Applied Research'
            },
            credential
        });
    } catch (err) {
        console.error('Failed to verify a credential:', err);
        res.status(500).json({ verified: false, error: 'Could not verify the credential.', details: err.message });
    }
});

export default router;
