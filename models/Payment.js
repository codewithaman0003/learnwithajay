const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    webinarId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Webinar',
        required: true
    },
    amount: Number,
    currency: {
        type: String,
        default: 'INR'
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    status: {
        type: String,
        enum: ['created', 'attempted', 'paid', 'failed'],
        default: 'created'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);