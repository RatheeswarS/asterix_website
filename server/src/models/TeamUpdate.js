import mongoose from 'mongoose';

const TeamUpdateSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    label: {
        type: String,
        required: true
    },
    tag: {
        type: String,
        default: 'PROVING GROUNDS'
    },
    image: {
        type: String,
        default: ''
    },
    link: {
        type: String,
        default: '#'
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

export default mongoose.models.TeamUpdate || mongoose.model('TeamUpdate', TeamUpdateSchema);
