import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        default: 'Team Member'
    },
    accessLevel: {
        type: String,
        enum: ['SuperAdmin', 'Lead', 'Member'],
        default: 'Lead'
    }
}, {
    timestamps: true
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
