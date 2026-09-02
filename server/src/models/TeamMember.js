import mongoose from 'mongoose';

const TeamMemberSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    subsystemId: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: '',
        trim: true
    },
    initials: {
        type: String,
        default: ''
    },
    badge: {
        type: String,
        default: 'SPECIALIST'
    },
    status: {
        type: String,
        default: 'Active Member'
    },
    bio: {
        type: String,
        default: ''
    },
    photo: {
        type: String,
        default: ''
    },
    photoFit: {
        type: String,
        default: 'cover'
    },
    photoPosition: {
        type: String,
        default: '50% 50%'
    },
    order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

export default mongoose.models.TeamMember || mongoose.model('TeamMember', TeamMemberSchema);
