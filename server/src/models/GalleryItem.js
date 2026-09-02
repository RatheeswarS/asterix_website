import mongoose from 'mongoose';

const GalleryItemSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        default: 'PIT LANE'
    },
    year: {
        type: String,
        default: '2026'
    },
    src: {
        type: String,
        required: true
    },
    desc: {
        type: String,
        default: ''
    },
    fit: {
        type: String,
        default: 'cover'
    },
    position: {
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

export default mongoose.models.GalleryItem || mongoose.model('GalleryItem', GalleryItemSchema);
