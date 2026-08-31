import mongoose from 'mongoose';

const SubscriberSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

export default mongoose.models.Subscriber || mongoose.model('Subscriber', SubscriberSchema);
