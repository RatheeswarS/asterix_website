import mongoose from 'mongoose';

const SponsorInquirySchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: true,
        trim: true
    },
    contactPerson: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        default: ''
    },
    tier: {
        type: String,
        default: 'TECHNICAL'
    },
    message: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['NEW', 'REVIEWED', 'CONTACTED', 'ARCHIVED'],
        default: 'NEW'
    }
}, {
    timestamps: true
});

export default mongoose.models.SponsorInquiry || mongoose.model('SponsorInquiry', SponsorInquirySchema);
