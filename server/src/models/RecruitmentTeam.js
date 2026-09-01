import mongoose from 'mongoose';
import { CYCLE, TRACK_IDS, ALL_PHASES, STAGE_VALUES, STAGES, TEAM_STATUSES } from '../lib/recruitmentConstants.js';

/**
 * A randomly drawn team, always within a single track.
 *
 * `drawSeed` and `rosterHash` exist so the draw is auditable. The shuffle is
 * seeded and deterministic, and the hash pins the exact input roster, so a
 * candidate who believes the draw was rigged can be shown that re-running it
 * with the recorded seed over the recorded roster reproduces the same teams.
 */

const TeamSubmissionSchema = new mongoose.Schema({
    phase: { type: String, enum: ALL_PHASES, required: true },
    url: { type: String, required: true, trim: true },
    note: { type: String, default: '', trim: true },
    submittedAt: { type: Date, default: Date.now },
    // Which member filed it, for a "who submitted for us?" question later.
    submittedByRef: { type: String, default: '' },
    ip: { type: String, default: '' }
}, { _id: false });

const RecruitmentTeamSchema = new mongoose.Schema({
    teamCode: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
    track: { type: String, enum: TRACK_IDS, required: true, index: true },
    cycle: { type: String, default: CYCLE, index: true },

    members: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'RecruitmentApplication' }],
        default: []
    },

    // Audit trail for the draw.
    drawSeed: { type: String, default: '' },
    rosterHash: { type: String, default: '' },
    drawnAt: { type: Date, default: Date.now },
    drawnBy: { type: String, default: '' },

    submissions: { type: [TeamSubmissionSchema], default: [] },

    stage: { type: String, enum: STAGE_VALUES, default: STAGES.TEAM_ASSIGNED },
    status: { type: String, enum: TEAM_STATUSES, default: 'ACTIVE', index: true },
    adminNotes: { type: String, default: '' }
}, {
    timestamps: true
});

export default mongoose.models.RecruitmentTeam
    || mongoose.model('RecruitmentTeam', RecruitmentTeamSchema);
