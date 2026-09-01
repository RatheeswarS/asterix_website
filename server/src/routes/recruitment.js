import { Router } from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

import RecruitmentApplication from '../models/RecruitmentApplication.js';
import RecruitmentTeam from '../models/RecruitmentTeam.js';
import RecruitmentConfig from '../models/RecruitmentConfig.js';
import { authenticateToken } from '../middleware/auth.js';
import { rateLimit, clientIp } from '../lib/rateLimit.js';
import { DEFAULT_CONFIG } from '../lib/recruitmentDefaults.js';
import { isMongoConnected } from '../db/mongodb.js';
import { drawTeams, generateSeed, teamCodeFor } from '../lib/recruitmentDraw.js';
import {
    CYCLE,
    TRACKS,
    TRACK_IDS,
    PHASE_TRACK,
    STAGES,
    TRACK_STAGES,
    APPLICATION_STATUSES,
    hasReachedStage,
    isTrack
} from '../lib/recruitmentConstants.js';

const router = Router();

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

let localMemoryConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

/** The singleton config, seeded from defaults the first time it is asked for. */
async function getConfig() {
    if (!isMongoConnected()) {
        return localMemoryConfig;
    }
    let config = await RecruitmentConfig.findOne({ key: 'main' });
    if (!config) {
        config = await RecruitmentConfig.create(DEFAULT_CONFIG);
        console.log('Seeded recruitment config for cycle', DEFAULT_CONFIG.cycle);
    }
    return config;
}

async function saveRecruitmentConfig(config) {
    if (!isMongoConnected()) {
        localMemoryConfig = config;
        return true;
    }
    if (typeof config.markModified === 'function') {
        /* Named individually rather than derived, so adding a field to the
           schema and forgetting it here shows up as an edit that will not
           stick. `tracks` genuinely needs this -- nested arrays of subdocuments
           are not always seen as dirty -- and the scalars are marked alongside
           it so the list stays one thing to keep in step with the schema. */
        for (const field of ['tracks', 'headline', 'intro', 'notice', 'resultsNote', 'briefsLaunchAt', 'stayTunedMessage']) {
            config.markModified(field);
        }
        await config.save();
    }
    return true;
}

const trackConfig = (config, trackId) => config.tracks.find((t) => t.id === trackId) || null;

const parseIso = (value) => {
    if (!value) return null;
    const ms = new Date(value).getTime();
    return Number.isNaN(ms) ? null : ms;
};

/**
 * Whether a window is open right now, judged by the *server* clock.
 *
 * The countdown in the browser is presentation only. Every decision that
 * matters is made here, so a candidate who changes their system clock or posts
 * directly with curl gains nothing.
 */
function windowOpen(opensAt, closesAt, now = Date.now()) {
    const start = parseIso(opensAt);
    const end = parseIso(closesAt);
    if (start !== null && now < start) return { open: false, reason: 'not_yet_open', start, end };
    if (end !== null && now > end) return { open: false, reason: 'closed', start, end };
    return { open: true, reason: null, start, end };
}

const stageForPhase = (track, phase) =>
    track?.stages?.find((s) => s.submissionPhase === phase) || null;

/** Every stage whose window is open right now. Usually one, but an admin can
    set overlapping windows, and at a boundary instant two match. */
const openStages = (track, now = Date.now()) =>
    (track?.stages || []).filter((s) => windowOpen(s.opensAt, s.closesAt, now).open);

/**
 * The stage currently running for a track, or null when none is.
 *
 * A stage that accepts a submission wins over one that does not. With
 * overlapping windows -- easy to set by accident in the admin, and unavoidable
 * for one instant where one stage closes exactly as the next opens -- taking
 * the first match would hide the submission stage, and a candidate would be
 * told there was nothing to submit while the window was actually open.
 */
function currentStage(track, now = Date.now()) {
    const open = openStages(track, now);
    if (open.length === 0) return null;
    return open.find((s) => s.submissionPhase) || open[0];
}

/** The submission phase a candidate can file against right now, if any. */
function openSubmissionPhase(track, now = Date.now()) {
    return openStages(track, now).find((s) => s.submissionPhase)?.submissionPhase || null;
}

/** The next stage that has not closed yet. */
function nextStage(track, now = Date.now()) {
    if (!track?.stages?.length) return null;
    return track.stages.find((s) => {
        const end = parseIso(s.closesAt);
        return end === null || end > now;
    }) || null;
}

/**
 * A track as the public is allowed to see it.
 *
 * This is the fix for the current leak, where every problem statement sits in
 * the public site-data blob for anyone to curl. A gated brief keeps its title
 * and one-line description -- applicants need to know what they are signing up
 * for -- but the body and any attached file are withheld until the applicant
 * has actually earned them.
 */
/**
 * Whether the problem statements have been released yet.
 *
 * Judged on the server clock like every other window, so a candidate cannot
 * read a statement early by moving their own clock forward. An empty or
 * unparseable date counts as released: a missing value must not hide the
 * briefs forever, which is the failure a team would notice far too late.
 */
function briefsAreLive(config, now = Date.now()) {
    const at = parseIso(config?.briefsLaunchAt);
    return at === null || now >= at;
}

function publicTrack(track, briefsLive = true) {
    const brief = track.brief || {};
    const gated = brief.gated !== false;
    return {
        id: track.id,
        name: track.name,
        enabled: track.enabled !== false,
        blurb: track.blurb || '',
        teamBased: Boolean(TRACKS[track.id]?.teamBased),
        hasWrittenTest: Boolean(TRACKS[track.id]?.hasWrittenTest),
        applyOpensAt: track.applyOpensAt || '',
        applyClosesAt: track.applyClosesAt || '',
        applyOpen: windowOpen(track.applyOpensAt, track.applyClosesAt).open,
        stages: (track.stages || []).map((s) => ({
            id: s.id,
            label: s.label,
            detail: s.detail,
            opensAt: s.opensAt,
            closesAt: s.closesAt,
            submissionPhase: s.submissionPhase || null
        })),
        brief: {
            /* Two independent gates. `briefsLive` is the timed release that
               applies to every track at once; `gated` is the per-track
               entitlement that outlasts it. Before the release nothing about
               the statement is public -- not even its title, which would
               otherwise give the game away on the page that says "stay tuned". */
            stayTuned: !briefsLive,
            title: briefsLive ? (brief.title || '') : '',
            description: briefsLive ? (brief.description || '') : '',
            deliverables: briefsLive ? (brief.deliverables || '') : '',
            gated,
            // Withheld unless the brief is ungated. Entitled applicants receive
            // it through /lookup instead, never through the public config.
            bodyMarkdown: (briefsLive && !gated) ? (brief.bodyMarkdown || '') : null,
            fileUrl: (briefsLive && !gated) ? (brief.fileUrl || '') : null,
            /* Test portions are public once released even on a gated track.
               They are what a candidate revises from, and a syllabus nobody can
               read is not a syllabus. */
            portions: briefsLive ? (brief.portions || '') : ''
        },
        resultsPublished: Boolean(track.resultsPublished),
        // Embargoed until explicitly published, so the 20 Sept result date holds.
        resultsBody: track.resultsPublished ? (track.resultsBody || '') : ''
    };
}

/** Generates a reference code, retrying past the rare random collision. */
async function generateRefCode(trackId) {
    const prefix = TRACKS[trackId]?.refPrefix || 'AX';
    for (let attempt = 0; attempt < 10; attempt += 1) {
        const digits = String(crypto.randomInt(0, 10000)).padStart(4, '0');
        const candidate = `ASX-${prefix}-${digits}`;
        const clash = await RecruitmentApplication.exists({ refCode: candidate });
        if (!clash) return candidate;
    }
    throw new Error('Could not allocate a unique reference code. Please retry.');
}

/**
 * Resolves `{refCode, token}` to an application.
 *
 * Always runs a bcrypt comparison, even when the ref code matched nothing, so
 * the response time does not reveal which reference codes exist.
 */
const DUMMY_HASH = bcrypt.hashSync('not-a-real-token', 10);

async function resolveApplicant(refCode, token) {
    if (typeof refCode !== 'string' || typeof token !== 'string' || !refCode.trim() || !token.trim()) {
        return null;
    }
    const application = await RecruitmentApplication.findOne({
        refCode: refCode.trim().toUpperCase(),
        cycle: CYCLE
    });
    const hash = application?.tokenHash || DUMMY_HASH;
    const matched = bcrypt.compareSync(token.trim(), hash);
    return application && matched ? application : null;
}

/** Everything an applicant is allowed to know about their own application. */
async function applicantView(application, config) {
    const track = trackConfig(config, application.track);
    const now = Date.now();

    let team = null;
    if (application.teamId) {
        const doc = await RecruitmentTeam.findById(application.teamId).populate('members', 'refCode name');
        if (doc) {
            team = {
                teamCode: doc.teamCode,
                drawSeed: doc.drawSeed,
                rosterHash: doc.rosterHash,
                drawnAt: doc.drawnAt,
                members: doc.members.map((m) => ({ refCode: m.refCode, name: m.name })),
                submissions: doc.submissions.map((s) => ({
                    phase: s.phase,
                    url: s.url,
                    note: s.note,
                    submittedAt: s.submittedAt,
                    submittedByRef: s.submittedByRef
                }))
            };
        }
    }

    const brief = track?.brief || {};
    /* The timed release binds here too. Reaching TEAM_ASSIGNED early must not
       hand someone the statement before the announcement -- otherwise the
       people drawn first get a head start nobody agreed to. */
    const briefsLive = briefsAreLive(config, now);
    const entitled = briefsLive && (
        brief.gated === false
        || hasReachedStage(application.stage, brief.gatedToStage || STAGES.TEAM_ASSIGNED)
    );

    const running = currentStage(track, now);
    const openPhase = openSubmissionPhase(track, now);

    return {
        refCode: application.refCode,
        name: application.name,
        email: application.email,
        track: application.track,
        trackName: track?.name || application.track,
        teamBased: Boolean(TRACKS[application.track]?.teamBased),
        stage: application.stage,
        status: application.status,
        appliedAt: application.createdAt,
        writtenTest: TRACKS[application.track]?.hasWrittenTest
            ? {
                attended: application.writtenTest?.attended || false,
                passed: application.writtenTest?.passed || false
            }
            : null,
        team,
        // Own submissions only. No applicant ever sees another's.
        submissions: application.submissions.map((s) => ({
            phase: s.phase,
            url: s.url,
            note: s.note,
            submittedAt: s.submittedAt
        })),
        currentStage: running
            ? { id: running.id, label: running.label, detail: running.detail, closesAt: running.closesAt }
            : null,
        nextStage: (() => {
            const n = nextStage(track, now);
            return n ? { id: n.id, label: n.label, detail: n.detail, opensAt: n.opensAt, closesAt: n.closesAt } : null;
        })(),
        // Non-null only when a phase is open *and* this applicant may submit to it.
        openSubmissionPhase: openPhase,
        brief: entitled
            ? {
                title: brief.title || '',
                description: brief.description || '',
                deliverables: brief.deliverables || '',
                bodyMarkdown: brief.bodyMarkdown || '',
                fileUrl: brief.fileUrl || '',
                portions: brief.portions || ''
            }
            : null,
        briefLockedReason: entitled
            ? null
            : (briefsLive
                ? 'The problem statement is released once you reach the required stage for this track.'
                : (config.stayTunedMessage
                    || 'The problem statements have not been released yet. Stay tuned.'))
    };
}

/** Admin-facing shape. Includes notes and the token hash is never present. */
const adminView = (a) => ({
    id: a._id.toString(),
    refCode: a.refCode,
    track: a.track,
    name: a.name,
    email: a.email,
    phone: a.phone,
    rollNumber: a.rollNumber,
    department: a.department,
    year: a.year,
    priorExperience: a.priorExperience,
    stage: a.stage,
    status: a.status,
    teamId: a.teamId ? a.teamId.toString() : null,
    writtenTest: a.writtenTest,
    submissions: a.submissions,
    adminNotes: a.adminNotes,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt
});

/* ------------------------------------------------------------------ *
 * Public routes
 * ------------------------------------------------------------------ */

// GET /api/recruitment/config
router.get('/config', async (req, res) => {
    try {
        const config = await getConfig();
        const briefsLive = briefsAreLive(config);
        res.json({
            cycle: config.cycle,
            headline: config.headline,
            intro: config.intro,
            notice: config.notice,
            resultsNote: config.resultsNote,
            briefsLaunchAt: config.briefsLaunchAt || '',
            stayTunedMessage: config.stayTunedMessage || '',
            briefsLive,
            serverTime: new Date().toISOString(),
            tracks: config.tracks
                .filter((t) => t.enabled !== false)
                .map((t) => publicTrack(t, briefsLive))
        });
    } catch (err) {
        console.error('Failed to build public recruitment config:', err);
        res.status(500).json({ error: 'Could not load the recruitment schedule.', details: err.message });
    }
});

// POST /api/recruitment/apply
/* Limits are per IP, and a college campus sits behind one NAT -- a whole
   cohort applying from campus wifi shares a single address. They are therefore
   set to stop a script hammering the endpoint, not to ration a normal rush,
   because the {email, cycle} unique index already makes duplicate applications
   impossible and a too-tight limit here would lock out legitimate applicants on
   the busiest hour of the cycle. */
router.post('/apply', rateLimit({ name: 'apply', max: 40, windowMs: 10 * 60 * 1000 }), async (req, res) => {
    try {
        const { track, name, email, phone, rollNumber, department, year, priorExperience } = req.body || {};

        if (!isTrack(track)) {
            return res.status(400).json({ error: 'Choose a valid subsystem track.' });
        }
        if (!name?.trim() || !email?.trim()) {
            return res.status(400).json({ error: 'Name and email are required.' });
        }
        const cleanEmail = email.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            return res.status(400).json({ error: 'That does not look like a valid email address.' });
        }

        const config = await getConfig();
        const trackCfg = trackConfig(config, track);
        if (!trackCfg || trackCfg.enabled === false) {
            return res.status(403).json({ error: 'That track is not recruiting this cycle.' });
        }

        // Server-clock enforced. A client with a wrong clock cannot apply late.
        const window = windowOpen(trackCfg.applyOpensAt, trackCfg.applyClosesAt);
        if (!window.open) {
            return res.status(403).json({
                error: window.reason === 'not_yet_open'
                    ? `Applications for ${trackCfg.name} have not opened yet.`
                    : `Applications for ${trackCfg.name} have closed.`,
                reason: window.reason
            });
        }

        const existing = await RecruitmentApplication.findOne({ email: cleanEmail, cycle: CYCLE });
        if (existing) {
            return res.status(409).json({
                error: `An application already exists for ${cleanEmail} in this cycle (${existing.refCode}, ${existing.track}). One application per person.`
            });
        }

        const refCode = await generateRefCode(track);
        // Shown to the candidate exactly once; only the hash is kept.
        const plainToken = crypto.randomBytes(24).toString('base64url');

        const application = await RecruitmentApplication.create({
            refCode,
            tokenHash: bcrypt.hashSync(plainToken, 10),
            track,
            cycle: CYCLE,
            name: name.trim(),
            email: cleanEmail,
            phone: (phone || '').trim(),
            rollNumber: (rollNumber || '').trim(),
            department: (department || '').trim(),
            year: (year || '').trim(),
            priorExperience: (priorExperience || '').trim(),
            stage: STAGES.APPLIED,
            status: 'ACTIVE'
        });

        res.status(201).json({
            success: true,
            refCode: application.refCode,
            token: plainToken,
            track,
            trackName: trackCfg.name,
            message: 'Application received. Save your reference code and access token now — the token is shown only once.'
        });
    } catch (err) {
        if (err?.code === 11000) {
            return res.status(409).json({ error: 'An application already exists for that email in this cycle.' });
        }
        console.error('Recruitment apply failed:', err);
        res.status(500).json({ error: 'Could not record the application.', details: err.message });
    }
});

// POST /api/recruitment/lookup
router.post('/lookup', rateLimit({ name: 'lookup', max: 120, windowMs: 10 * 60 * 1000 }), async (req, res) => {
    try {
        const { refCode, token } = req.body || {};
        const application = await resolveApplicant(refCode, token);
        if (!application) {
            return res.status(401).json({ error: 'That reference code and token do not match.' });
        }
        const config = await getConfig();
        res.json(await applicantView(application, config));
    } catch (err) {
        console.error('Recruitment lookup failed:', err);
        res.status(500).json({ error: 'Could not load your application.', details: err.message });
    }
});

// POST /api/recruitment/submit
router.post('/submit', rateLimit({ name: 'submit', max: 60, windowMs: 10 * 60 * 1000 }), async (req, res) => {
    try {
        const { refCode, token, phase, url, note } = req.body || {};

        const application = await resolveApplicant(refCode, token);
        if (!application) {
            return res.status(401).json({ error: 'That reference code and token do not match.' });
        }
        if (application.status !== 'ACTIVE') {
            return res.status(403).json({ error: `This application is marked ${application.status} and cannot submit.` });
        }

        // Cross-track guard. Phase ids are namespaced per track, so a powertrain
        // phase posted by a mechanical applicant is rejected outright rather
        // than quietly landing on the wrong record.
        if (PHASE_TRACK[phase] !== application.track) {
            return res.status(403).json({
                error: 'That submission phase does not belong to your track.'
            });
        }

        if (typeof url !== 'string' || !/^https?:\/\/\S+$/i.test(url.trim())) {
            return res.status(400).json({
                error: 'Provide a working http(s) link to your submission (Drive, GitHub, OneDrive).'
            });
        }

        const config = await getConfig();
        const trackCfg = trackConfig(config, application.track);
        const stage = stageForPhase(trackCfg, phase);
        if (!stage) {
            return res.status(400).json({ error: 'That submission phase is not part of the current schedule.' });
        }

        const window = windowOpen(stage.opensAt, stage.closesAt);
        if (!window.open) {
            return res.status(403).json({
                error: window.reason === 'not_yet_open'
                    ? `"${stage.label}" has not opened yet.`
                    : `"${stage.label}" closed on ${new Date(window.end).toISOString()}. Late submissions are not accepted.`,
                reason: window.reason
            });
        }

        const entry = {
            phase,
            url: url.trim(),
            note: (note || '').trim(),
            submittedAt: new Date(),
            ip: clientIp(req)
        };

        const teamBased = Boolean(TRACKS[application.track]?.teamBased);

        if (teamBased) {
            if (!application.teamId) {
                return res.status(403).json({
                    error: 'You have not been drawn into a team yet, so there is nothing to submit against.'
                });
            }
            const team = await RecruitmentTeam.findById(application.teamId);
            if (!team) {
                return res.status(404).json({ error: 'Your team record could not be found. Contact the recruitment leads.' });
            }
            // Append, never replace. A second submit adds a newer entry so an
            // accidental resubmission cannot destroy work already on record.
            team.submissions.push({ ...entry, submittedByRef: application.refCode });
            await team.save();

            const newStage = phase === 'sw-phase-1'
                ? STAGES.PHASE_1_SUBMITTED
                : phase === 'sw-phase-2'
                    ? STAGES.PHASE_2_SUBMITTED
                    : STAGES.SOLUTION_SUBMITTED;

            team.stage = newStage;
            await team.save();
            await RecruitmentApplication.updateMany({ teamId: team._id }, { $set: { stage: newStage } });

            return res.status(201).json({
                success: true,
                scope: 'team',
                teamCode: team.teamCode,
                phase,
                submittedAt: entry.submittedAt,
                message: `Submission recorded for ${team.teamCode}. Your whole team can see it.`
            });
        }

        application.submissions.push(entry);
        application.stage = STAGES.SOLUTION_SUBMITTED;
        await application.save();

        return res.status(201).json({
            success: true,
            scope: 'individual',
            phase,
            submittedAt: entry.submittedAt,
            message: 'Submission recorded. You can resubmit until the window closes; the latest entry is the one reviewed.'
        });
    } catch (err) {
        console.error('Recruitment submit failed:', err);
        res.status(500).json({ error: 'Could not record the submission.', details: err.message });
    }
});

/* ------------------------------------------------------------------ *
 * Admin routes
 * ------------------------------------------------------------------ */

// GET /api/recruitment/applications
router.get('/applications', authenticateToken, async (req, res) => {
    try {
        const { track, stage, status, teamId, q } = req.query;
        const filter = { cycle: CYCLE };
        if (track && isTrack(track)) filter.track = track;
        if (stage) filter.stage = stage;
        if (status) filter.status = status;
        if (teamId) filter.teamId = teamId;
        if (q) {
            const rx = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            filter.$or = [{ name: rx }, { email: rx }, { refCode: rx }, { rollNumber: rx }];
        }

        const limit = Math.min(Number(req.query.limit) || 500, 1000);
        const skip = Math.max(Number(req.query.skip) || 0, 0);

        const [items, total] = await Promise.all([
            RecruitmentApplication.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            RecruitmentApplication.countDocuments(filter)
        ]);

        res.json({ total, skip, limit, items: items.map(adminView) });
    } catch (err) {
        res.status(500).json({ error: 'Failed to list applications', details: err.message });
    }
});

// PATCH /api/recruitment/applications/:id
router.patch('/applications/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        if (!RecruitmentApplication.base.isValidObjectId(id)) {
            return res.status(400).json({ error: 'Invalid application id.' });
        }
        const application = await RecruitmentApplication.findById(id);
        if (!application) return res.status(404).json({ error: 'Application not found.' });

        const { stage, status, writtenTest, adminNotes } = req.body || {};

        if (stage) {
            const allowed = TRACK_STAGES[application.track] || [];
            if (!allowed.includes(stage)) {
                return res.status(400).json({
                    error: `"${stage}" is not a valid stage for the ${application.track} track.`
                });
            }
            application.stage = stage;
        }
        if (status) {
            if (!APPLICATION_STATUSES.includes(status)) {
                return res.status(400).json({ error: `Status must be one of: ${APPLICATION_STATUSES.join(', ')}` });
            }
            application.status = status;
        }
        if (writtenTest && typeof writtenTest === 'object') {
            if (!TRACKS[application.track]?.hasWrittenTest) {
                return res.status(400).json({ error: 'That track has no written test.' });
            }
            if (typeof writtenTest.attended === 'boolean') application.writtenTest.attended = writtenTest.attended;
            if (writtenTest.score !== undefined) application.writtenTest.score = writtenTest.score;
            if (typeof writtenTest.passed === 'boolean') {
                application.writtenTest.passed = writtenTest.passed;
                // Keep the lifecycle stage consistent with the recorded result,
                // unless an admin has already moved the applicant further on.
                if (application.stage === STAGES.APPLIED) {
                    application.stage = writtenTest.passed ? STAGES.TEST_PASSED : STAGES.TEST_FAILED;
                }
            }
        }
        if (adminNotes !== undefined) application.adminNotes = String(adminNotes);

        await application.save();
        res.json({ success: true, application: adminView(application) });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update the application', details: err.message });
    }
});

// POST /api/recruitment/applications/bulk-advance
router.post('/applications/bulk-advance', authenticateToken, async (req, res) => {
    try {
        const { track, refCodes, passed = true } = req.body || {};
        if (!isTrack(track)) return res.status(400).json({ error: 'A valid track is required.' });
        if (!Array.isArray(refCodes) || refCodes.length === 0) {
            return res.status(400).json({ error: 'Provide the reference codes to advance.' });
        }
        if (!TRACKS[track].hasWrittenTest) {
            return res.status(400).json({ error: 'Bulk advance applies to the written-test track only.' });
        }

        const codes = refCodes.map((c) => String(c).trim().toUpperCase());
        // Scoped to the requested track, so a stray code from another track is
        // ignored rather than silently advanced.
        const result = await RecruitmentApplication.updateMany(
            { refCode: { $in: codes }, track, cycle: CYCLE },
            {
                $set: {
                    'writtenTest.attended': true,
                    'writtenTest.passed': Boolean(passed),
                    stage: passed ? STAGES.TEST_PASSED : STAGES.TEST_FAILED
                }
            }
        );

        const matchedDocs = await RecruitmentApplication.find({
            refCode: { $in: codes }, track, cycle: CYCLE
        }).select('refCode');
        const matched = new Set(matchedDocs.map((d) => d.refCode));
        const unmatched = codes.filter((c) => !matched.has(c));

        res.json({
            success: true,
            updated: result.modifiedCount,
            unmatched,
            message: unmatched.length
                ? `${result.modifiedCount} updated. ${unmatched.length} code(s) matched nothing on this track.`
                : `${result.modifiedCount} application(s) updated.`
        });
    } catch (err) {
        res.status(500).json({ error: 'Bulk advance failed', details: err.message });
    }
});

// POST /api/recruitment/teams/draw
router.post('/teams/draw', authenticateToken, async (req, res) => {
    try {
        const { track, teamSize = 4, seed: providedSeed, confirmRedraw = false } = req.body || {};

        if (!isTrack(track)) return res.status(400).json({ error: 'A valid track is required.' });
        if (!TRACKS[track].teamBased) {
            return res.status(400).json({ error: `The ${TRACKS[track].name} track does not use teams.` });
        }

        const existing = await RecruitmentTeam.countDocuments({ track, cycle: CYCLE });
        if (existing > 0 && !confirmRedraw) {
            return res.status(409).json({
                error: `${existing} team(s) already exist for ${TRACKS[track].name}. Re-drawing discards them and reassigns everyone.`,
                requiresConfirmation: true
            });
        }

        // Eligibility differs per track: Software draws from everyone who
        // applied, Powertrain only from those who cleared the written test.
        const eligibilityStage = TRACKS[track].drawAfter === 'written-test'
            ? STAGES.TEST_PASSED
            : STAGES.APPLIED;

        const eligible = await RecruitmentApplication.find({
            track,
            cycle: CYCLE,
            status: 'ACTIVE',
            ...(TRACKS[track].drawAfter === 'written-test'
                ? { 'writtenTest.passed': true }
                : {}),
            stage: { $in: [eligibilityStage, STAGES.TEAM_ASSIGNED] }
        }).sort({ refCode: 1 });

        if (eligible.length === 0) {
            return res.status(400).json({
                error: TRACKS[track].drawAfter === 'written-test'
                    ? 'Nobody has been marked as having cleared the written test yet.'
                    : 'There are no eligible applicants on this track yet.'
            });
        }

        const seed = String(providedSeed || generateSeed());
        const { teams, rosterHash } = drawTeams({
            applications: eligible,
            teamSize: Number(teamSize) || 4,
            seed,
            track
        });

        // Clear the previous draw only once the new one has been computed
        // successfully, so a failed draw never leaves the track team-less.
        if (existing > 0) {
            const stale = await RecruitmentTeam.find({ track, cycle: CYCLE }).select('_id');
            await RecruitmentApplication.updateMany(
                { teamId: { $in: stale.map((t) => t._id) } },
                { $set: { teamId: null, stage: eligibilityStage } }
            );
            await RecruitmentTeam.deleteMany({ track, cycle: CYCLE });
        }

        const prefix = TRACKS[track].refPrefix;
        const drawnBy = req.user?.username || 'unknown';
        const created = [];

        for (let i = 0; i < teams.length; i += 1) {
            const members = teams[i];
            const team = await RecruitmentTeam.create({
                teamCode: teamCodeFor(prefix, i),
                track,
                cycle: CYCLE,
                members: members.map((m) => m._id),
                drawSeed: seed,
                rosterHash,
                drawnAt: new Date(),
                drawnBy,
                stage: STAGES.TEAM_ASSIGNED,
                status: 'ACTIVE'
            });
            await RecruitmentApplication.updateMany(
                { _id: { $in: members.map((m) => m._id) } },
                { $set: { teamId: team._id, stage: STAGES.TEAM_ASSIGNED } }
            );
            created.push({
                teamCode: team.teamCode,
                members: members.map((m) => ({ refCode: m.refCode, name: m.name, track: m.track }))
            });
        }

        // Belt and braces: prove after the fact that nothing crossed tracks.
        const mixed = await RecruitmentTeam.find({ track, cycle: CYCLE }).populate('members', 'track refCode');
        const offenders = mixed.flatMap((t) =>
            t.members.filter((m) => m.track !== track).map((m) => `${t.teamCode}:${m.refCode}`)
        );
        if (offenders.length > 0) {
            return res.status(500).json({
                error: `Draw produced cross-track members (${offenders.join(', ')}). Nothing has been published; investigate before retrying.`
            });
        }

        res.status(201).json({
            success: true,
            track,
            trackName: TRACKS[track].name,
            seed,
            rosterHash,
            teamCount: created.length,
            drawnPool: eligible.length,
            teams: created,
            message: `Drew ${created.length} team(s) from ${eligible.length} eligible applicant(s). Seed ${seed} is recorded, so this draw can be reproduced.`
        });
    } catch (err) {
        console.error('Team draw failed:', err);
        res.status(500).json({ error: 'Team draw failed', details: err.message });
    }
});

// GET /api/recruitment/teams
router.get('/teams', authenticateToken, async (req, res) => {
    try {
        const filter = { cycle: CYCLE };
        if (req.query.track && isTrack(req.query.track)) filter.track = req.query.track;
        const teams = await RecruitmentTeam.find(filter)
            .sort({ track: 1, teamCode: 1 })
            .populate('members', 'refCode name email track stage');
        res.json(teams.map((t) => ({
            id: t._id.toString(),
            teamCode: t.teamCode,
            track: t.track,
            stage: t.stage,
            status: t.status,
            drawSeed: t.drawSeed,
            rosterHash: t.rosterHash,
            drawnAt: t.drawnAt,
            drawnBy: t.drawnBy,
            members: t.members.map((m) => ({
                refCode: m.refCode, name: m.name, email: m.email, track: m.track, stage: m.stage
            })),
            submissions: t.submissions
        })));
    } catch (err) {
        res.status(500).json({ error: 'Failed to list teams', details: err.message });
    }
});

// PATCH /api/recruitment/teams/:id
router.patch('/teams/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        if (!RecruitmentTeam.base.isValidObjectId(id)) {
            return res.status(400).json({ error: 'Invalid team id.' });
        }
        const team = await RecruitmentTeam.findById(id);
        if (!team) return res.status(404).json({ error: 'Team not found.' });

        const { stage, status, adminNotes, memberRefCodes } = req.body || {};
        if (stage) team.stage = stage;
        if (status) team.status = status;
        if (adminNotes !== undefined) team.adminNotes = String(adminNotes);

        if (Array.isArray(memberRefCodes)) {
            const codes = memberRefCodes.map((c) => String(c).trim().toUpperCase());
            const members = await RecruitmentApplication.find({ refCode: { $in: codes }, cycle: CYCLE });
            const stray = members.find((m) => m.track !== team.track);
            if (stray) {
                return res.status(400).json({
                    error: `${stray.refCode} is on the ${stray.track} track and cannot join a ${team.track} team.`
                });
            }
            await RecruitmentApplication.updateMany({ teamId: team._id }, { $set: { teamId: null } });
            team.members = members.map((m) => m._id);
            await RecruitmentApplication.updateMany(
                { _id: { $in: team.members } },
                { $set: { teamId: team._id, stage: STAGES.TEAM_ASSIGNED } }
            );
        }

        await team.save();
        res.json({ success: true, message: 'Team updated.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update the team', details: err.message });
    }
});

// GET /api/recruitment/config/admin — the unredacted config
router.get('/config/admin', authenticateToken, async (req, res) => {
    try {
        const config = await getConfig();
        res.json(config.toObject());
    } catch (err) {
        res.status(500).json({ error: 'Failed to load the config', details: err.message });
    }
});

// PUT /api/recruitment/config
router.put('/config', authenticateToken, async (req, res) => {
    try {
        const { headline, intro, notice, resultsNote, briefsLaunchAt, stayTunedMessage, tracks } = req.body || {};
        const config = await getConfig();

        if (headline !== undefined) config.headline = String(headline);
        if (intro !== undefined) config.intro = String(intro);
        if (notice !== undefined) config.notice = String(notice);
        if (resultsNote !== undefined) config.resultsNote = String(resultsNote);
        if (briefsLaunchAt !== undefined) config.briefsLaunchAt = String(briefsLaunchAt);
        if (stayTunedMessage !== undefined) config.stayTunedMessage = String(stayTunedMessage);

        if (Array.isArray(tracks)) {
            const unknown = tracks.filter((t) => !isTrack(t.id)).map((t) => t.id);
            if (unknown.length) {
                return res.status(400).json({ error: `Unknown track id(s): ${unknown.join(', ')}` });
            }
            // Merge per track so a partial payload cannot blank a brief nobody
            // was editing.
            config.tracks = TRACK_IDS.map((id) => {
                const incoming = tracks.find((t) => t.id === id);
                const current = config.tracks.find((t) => t.id === id);
                if (!incoming) return current;
                return {
                    ...(current ? current.toObject?.() ?? current : {}),
                    ...incoming,
                    id,
                    brief: { ...(current?.brief?.toObject?.() ?? current?.brief), ...incoming.brief }
                };
            }).filter(Boolean);
        }

        await saveRecruitmentConfig(config);
        res.json({ success: true, message: 'Recruitment schedule saved.' });
    } catch (err) {
        console.error('Failed to save recruitment config:', err);
        res.status(500).json({ error: 'Failed to save the schedule', details: err.message });
    }
});

// POST /api/recruitment/config/publish-results
router.post('/config/publish-results', authenticateToken, async (req, res) => {
    try {
        const { track, published, resultsBody } = req.body || {};
        if (!isTrack(track)) return res.status(400).json({ error: 'A valid track is required.' });

        const config = await getConfig();
        const trackCfg = config.tracks.find((t) => t.id === track);
        if (!trackCfg) return res.status(404).json({ error: 'That track is not in the schedule.' });

        if (resultsBody !== undefined) trackCfg.resultsBody = String(resultsBody);
        if (typeof published === 'boolean') trackCfg.resultsPublished = published;

        await saveRecruitmentConfig(config);
        res.json({
            success: true,
            track,
            resultsPublished: trackCfg.resultsPublished,
            message: trackCfg.resultsPublished
                ? `Results for ${TRACKS[track].name} are now public.`
                : `Results for ${TRACKS[track].name} are hidden.`
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to publish results', details: err.message });
    }
});

// GET /api/recruitment/export
router.get('/export', authenticateToken, async (req, res) => {
    try {
        const filter = { cycle: CYCLE };
        if (req.query.track && isTrack(req.query.track)) filter.track = req.query.track;

        const applications = await RecruitmentApplication.find(filter).sort({ track: 1, refCode: 1 });
        const teams = await RecruitmentTeam.find(filter).select('_id teamCode');
        const teamCode = new Map(teams.map((t) => [t._id.toString(), t.teamCode]));

        const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const header = [
            'Ref Code', 'Track', 'Team', 'Name', 'Email', 'Phone', 'Roll Number',
            'Department', 'Year', 'Stage', 'Status', 'Test Attended', 'Test Score',
            'Test Passed', 'Submissions', 'Latest Submission', 'Applied At'
        ];
        const rows = applications.map((a) => [
            a.refCode,
            a.track,
            a.teamId ? teamCode.get(a.teamId.toString()) || '' : '',
            a.name,
            a.email,
            a.phone,
            a.rollNumber,
            a.department,
            a.year,
            a.stage,
            a.status,
            a.writtenTest?.attended ? 'yes' : 'no',
            a.writtenTest?.score ?? '',
            a.writtenTest?.passed ? 'yes' : 'no',
            a.submissions.length,
            a.submissions.at(-1)?.url || '',
            a.createdAt?.toISOString() || ''
        ].map(esc).join(','));

        const csv = [header.map(esc).join(','), ...rows].join('\r\n');
        const name = `asterix-applications-${req.query.track || 'all'}-${new Date().toISOString().slice(0, 10)}.csv`;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
        res.send(csv);
    } catch (err) {
        res.status(500).json({ error: 'Export failed', details: err.message });
    }
});

export default router;
