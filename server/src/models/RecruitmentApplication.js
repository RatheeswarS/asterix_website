import mongoose from 'mongoose';
import {
    CYCLE,
    TRACK_IDS,
    STAGE_VALUES,
    STAGES,
    ALL_PHASES,
    APPLICATION_STATUSES
} from '../lib/recruitmentConstants.js';

/**
 * One candidate's application for one cycle.
 *
 * Deliberately its own collection rather than a field on `SiteData`: that
 * document is a last-write-wins blob the admin replaces wholesale on every
 * save, so applications living inside it would be destroyed the first time two
 * edits overlapped.
 *
 * There are no candidate passwords. Identity is a public `refCode` plus a
 * secret token issued once at apply time; only the bcrypt hash of that token is
 * stored, so a database leak does not let anyone act as an applicant.
 */

const SubmissionSchema = new mongoose.Schema({
    phase: { type: String, enum: ALL_PHASES, required: true },
    url: { type: String, required: true, trim: true },
    note: { type: String, default: '', trim: true },
    submittedAt: { type: Date, default: Date.now },
    ip: { type: String, default: '' }
}, { _id: false });

const RecruitmentApplicationSchema = new mongoose.Schema({
    refCode: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
    // bcrypt hash of the one-time token. Never returned by any route.
    tokenHash: { type: String, required: true },

    track: { type: String, enum: TRACK_IDS, required: true, index: true },
    cycle: { type: String, default: CYCLE, index: true },

    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: '', trim: true },
    rollNumber: { type: String, default: '', trim: true },
    department: { type: String, default: '', trim: true },
    year: { type: String, default: '', trim: true },
    priorExperience: { type: String, default: '', trim: true },

    stage: { type: String, enum: STAGE_VALUES, default: STAGES.APPLIED, index: true },
    status: { type: String, enum: APPLICATION_STATUSES, default: 'ACTIVE', index: true },

    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'RecruitmentTeam', default: null, index: true },

    // Powertrain only. The test itself runs offline; this records the outcome.
    writtenTest: {
        attended: { type: Boolean, default: false },
        score: { type: Number, default: null },
        passed: { type: Boolean, default: false }
    },

    // Append-only. A resubmission adds an entry rather than replacing one, so an
    // accidental second submit can never destroy the work already on record.
    submissions: { type: [SubmissionSchema], default: [] },

    // Internal only -- excluded from every candidate-facing response.
    adminNotes: { type: String, default: '' }
}, {
    timestamps: true
});

// One application per person per cycle. This is what stops a candidate hedging
// by applying to all three tracks at once.
RecruitmentApplicationSchema.index({ email: 1, cycle: 1 }, { unique: true });

export default mongoose.models.RecruitmentApplication
    || mongoose.model('RecruitmentApplication', RecruitmentApplicationSchema);
