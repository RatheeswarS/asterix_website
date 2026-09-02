import mongoose from 'mongoose';

const SubsystemSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    badge: {
        type: String,
        default: ''
    },
    tagline: {
        type: String,
        default: ''
    },
    shortDesc: {
        type: String,
        default: ''
    },
    fullDesc: {
        type: String,
        default: ''
    },
    contactEmail: {
        type: String,
        default: ''
    },
    color: {
        type: String,
        default: 'bg-sky-400'
    },
    stat: {
        type: String,
        default: ''
    },
    specifications: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    highlights: {
        type: [String],
        default: []
    },
    order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

export default mongoose.models.Subsystem || mongoose.model('Subsystem', SubsystemSchema);
