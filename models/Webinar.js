const mongoose = require('mongoose');

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
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    duration: {
        type: String,
        required: true
    },
    speaker: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    maxParticipants: {
        type: Number,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Webinar', webinarSchema);