import mongoose from 'mongoose';

const SubmissionSchema = new mongoose.Schema({
    subsystem: {
        type: String,
        required: true,
        enum: ['software', 'mechanical', 'powertrain'],
        lowercase: true,
        trim: true
    },
    phase: {
        type: String,
        default: 'phase1',
        trim: true
    },
    cohort: {
        type: String,
        default: 'General',
        trim: true
    },
    group: {
        type: String,
        required: true,
        trim: true
    },
    submitterName: {
        type: String,
        required: true,
        trim: true
    },
    submitterPhone: {
        type: String,
        required: true,
        trim: true
    },
    partnerName: {
        type: String,
        default: '',
        trim: true
    },
    partnerDept: {
        type: String,
        default: '',
        trim: true
    },
    driveUrl: {
        type: String,
        required: true,
        trim: true
    },
    notes: {
        type: String,
        default: '',
        trim: true
    },
    ip: {
        type: String,
        default: ''
    },
    userAgent: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['SUBMITTED', 'REVIEWED', 'FLAGGED'],
        default: 'SUBMITTED'
    }
}, {
    timestamps: true
});

// Index for fast team history lookup
SubmissionSchema.index({ subsystem: 1, group: 1, createdAt: -1 });

export default mongoose.models.Submission || mongoose.model('Submission', SubmissionSchema);
