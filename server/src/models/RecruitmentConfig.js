import mongoose from 'mongoose';
import { CYCLE } from '../lib/recruitmentConstants.js';

/**
 * The authoritative recruitment schedule and problem statements.
 *
 * This is a separate collection rather than a section of `SiteData` for one
 * specific reason: the server reads it to decide whether a submission window is
 * open, and `SiteData` is a client-writable blob replaced wholesale on every
 * admin save. A deadline that anything but this route can overwrite is not a
 * deadline.
 *
 * Stored as a singleton, `{ key: 'main' }`, mirroring the SiteData convention.
 */

const BriefSchema = new mongoose.Schema({
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    deliverables: { type: String, default: '' },
    // When true, `bodyMarkdown` and `fileUrl` are stripped from the public
    // config and released only to entitled applicants on this track.
    gated: { type: Boolean, default: true },
    gatedToStage: { type: String, default: 'TEAM_ASSIGNED' },
    bodyMarkdown: { type: String, default: '' },
    fileUrl: { type: String, default: '' }
}, { _id: false });

const StageSchema = new mongoose.Schema({
    id: { type: String, required: true },
    label: { type: String, default: '' },
    detail: { type: String, default: '' },
    // ISO strings carrying an explicit +05:30, so no consumer has to guess a zone.
    opensAt: { type: String, default: '' },
    closesAt: { type: String, default: '' },
    // Non-null only for stages that accept a submission.
    submissionPhase: { type: String, default: null }
}, { _id: false });

const TrackSchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
    blurb: { type: String, default: '' },
    applyOpensAt: { type: String, default: '' },
    applyClosesAt: { type: String, default: '' },
    stages: { type: [StageSchema], default: [] },
    brief: { type: BriefSchema, default: () => ({}) },
    resultsPublished: { type: Boolean, default: false },
    resultsBody: { type: String, default: '' }
}, { _id: false });

const RecruitmentConfigSchema = new mongoose.Schema({
    key: { type: String, default: 'main', unique: true, index: true },
    cycle: { type: String, default: CYCLE },
    headline: { type: String, default: '' },
    intro: { type: String, default: '' },
    // Free-text banner shown above the track cards. Empty hides it.
    notice: { type: String, default: '' },
    resultsNote: { type: String, default: '' },
    tracks: { type: [TrackSchema], default: [] }
}, {
    timestamps: true,
    minimize: false
});

export default mongoose.models.RecruitmentConfig
    || mongoose.model('RecruitmentConfig', RecruitmentConfigSchema);
