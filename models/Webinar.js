import mongoose from 'mongoose';

const webinarSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    dateTime: {
        type: Date,
        required: true
    },
    price: {
        type: Number,
        default: 49
    },
    duration: {
        type: String,
        default: "60 minutes"
    },
    meetingLink: {
        type: String,
        default: "To be provided after payment"
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Webinar', webinarSchema);