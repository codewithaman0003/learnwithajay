import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    razorpayOrderId: {
        type: String
    },
    razorpayPaymentId: {
        type: String
    },
    amount: {
        type: Number,
        default: 49
    },
    paidAt: {
        type: Date
    },
    registeredAt: {
        type: Date,
        default: Date.now
    },
    emailSent: {
        welcome: { type: Boolean, default: false },
        reminder: { type: Boolean, default: false },
        success: { type: Boolean, default: false }
    },
    webinarAccess: {
        type: Boolean,
        default: false
    }
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ paymentStatus: 1 });
userSchema.index({ registeredAt: -1 });

export default mongoose.model('User', userSchema);