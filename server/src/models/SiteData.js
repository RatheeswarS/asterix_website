import mongoose from 'mongoose';

const SiteDataSchema = new mongoose.Schema({
    key: {
        type: String,
        default: 'main',
        unique: true,
        index: true
    },
    hero: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    story: {
        type: String,
        default: ''
    },
    subsystems: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    gallery: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    updates: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    contact: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    sponsorship: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    recruitment: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    lastModified: {
        type: String,
        default: () => new Date().toISOString()
    }
}, {
    timestamps: true,
    minimize: false
});

export default mongoose.models.SiteData || mongoose.model('SiteData', SiteDataSchema);
