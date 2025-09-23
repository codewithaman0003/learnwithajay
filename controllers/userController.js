import User from '../models/User.js';
import { createOrder } from '../utils/paymentService.js';
import { sendWelcomeEmail } from '../utils/emailService.js';

export const getRegisterPage = (req, res) => {
    res.render('pages/register', { 
        error: null,
        success: null 
    });
};

export const registerUser = async (req, res) => {
    try {
        const { name, email, phone } = req.body;

        // Validate input
        if (!name || !email || !phone) {
            return res.render('pages/register', { 
                error: 'All fields are required',
                success: null
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('pages/register', { 
                error: 'User already registered with this email',
                success: null
            });
        }

        // Create new user
        const user = new User({ name, email, phone });
        await user.save();

        // Create Razorpay order
        const order = await createOrder(49, `receipt_${user._id}`);
        
        user.razorpayOrderId = order.id;
        await user.save();

        // Send welcome email
        await sendWelcomeEmail(user);

        // Store user ID in session
        req.session.userId = user._id;
        
        res.render('pages/payment', {
            key: process.env.RAZORPAY_KEY_ID,
            amount: 49,
            orderId: order.id,
            user: user,
            error: null,
            success: null
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.render('pages/register', { 
            error: 'Registration failed. Please try again.',
            success: null
        });
    }
};

export const paymentSuccess = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id } = req.body;
        
        const user = await User.findOne({ razorpayOrderId: razorpay_order_id });
        if (!user) {
            return res.status(400).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        user.paymentStatus = 'completed';
        user.razorpayPaymentId = razorpay_payment_id;
        await user.save();

        // Update session
        req.session.paymentCompleted = true;

        res.json({ 
            success: true, 
            redirectUrl: '/success' 
        });
    } catch (error) {
        console.error('Payment success error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Payment verification failed' 
        });
    }
};

export const successPage = (req, res) => {
    if (!req.session.paymentCompleted) {
        return res.redirect('/register');
    }
    res.render('pages/success', {
        error: null,
        success: null
    });
};