import User from '../models/User.js';
import { sendBulkEmails } from '../utils/emailService.js';
import { validateAdminCredentials } from '../middleware/adminAuth.js';
import rateLimit from 'express-rate-limit';

// Apply rate limiting to admin login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts. Please try again in 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
});

export const getAdminLogin = (req, res) => {
    // If already logged in, redirect to dashboard
    if (req.session.adminLoggedIn) {
        return res.redirect('/admin/dashboard');
    }
    
    // Get success message from query parameter
    const success = req.query.success || null;
    const error = req.query.error || null;
    
    res.render('admin/login', { 
        error: error,
        success: success 
    });
};

export const adminLogin = [loginLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Validate input
        if (!username || !password) {
            return res.render('admin/login', { 
                error: 'Username and password are required',
                success: null
            });
        }

        // Check credentials
        const isValid = validateAdminCredentials(username, password);
        
        if (isValid) {
            // Set admin session
            req.session.adminLoggedIn = true;
            req.session.adminUser = username;
            req.session.adminLoginTime = new Date();
            
            // Log admin access
            console.log(`🔐 Admin login: ${username} from IP: ${req.ip} at ${new Date()}`);
            
            res.redirect('/admin/dashboard');
        } else {
            res.render('admin/login', { 
                error: 'Invalid credentials',
                success: null
            });
        }
    } catch (error) {
        console.error('Admin login error:', error);
        res.render('admin/login', { 
            error: 'Login failed. Please try again.',
            success: null
        });
    }
}];

export const adminLogout = (req, res) => {
    // Log logout
    console.log(`🔒 Admin logout: ${req.session.adminUser} at ${new Date()}`);
    
    // Destroy session
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.redirect('/admin/dashboard');
        }
        res.redirect('/admin/login?success=Logged out successfully');
    });
};

export const adminDashboard = async (req, res) => {
    try {
        const paidUsers = await User.find({ paymentStatus: 'completed' });
        const pendingUsers = await User.find({ paymentStatus: 'pending' });
        const totalRevenue = paidUsers.reduce((sum, user) => sum + (user.amount || 49), 0);
        
        // Recent registrations (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentUsers = await User.find({
            registeredAt: { $gte: sevenDaysAgo }
        }).sort({ registeredAt: -1 }).limit(10);

        res.render('admin/dashboard', {
            adminUser: req.session.adminUser,
            paidUsersCount: paidUsers.length,
            pendingUsersCount: pendingUsers.length,
            totalUsers: paidUsers.length + pendingUsers.length,
            totalRevenue: totalRevenue,
            recentUsers: recentUsers,
            loginTime: req.session.adminLoginTime || new Date(),
            error: null,
            success: null
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.render('admin/dashboard', { 
            error: 'Failed to load dashboard data',
            adminUser: req.session.adminUser,
            paidUsersCount: 0,
            pendingUsersCount: 0,
            totalUsers: 0,
            totalRevenue: 0,
            recentUsers: [],
            loginTime: new Date(),
            success: null
        });
    }
};

export const getUsers = async (req, res) => {
    try {
        const { filter, search } = req.query;
        let query = {};
        
        // Apply filters
        if (filter === 'paid') {
            query.paymentStatus = 'completed';
        } else if (filter === 'pending') {
            query.paymentStatus = 'pending';
        }
        
        // Apply search
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query).sort({ registeredAt: -1 });
        const paidCount = await User.countDocuments({ paymentStatus: 'completed' });
        const pendingCount = await User.countDocuments({ paymentStatus: 'pending' });

        res.render('admin/users', {
            adminUser: req.session.adminUser,
            users: users,
            filter: filter || 'all',
            search: search || '',
            paidCount: paidCount,
            pendingCount: pendingCount,
            totalCount: paidCount + pendingCount,
            error: null,
            success: null
        });
    } catch (error) {
        console.error('Users fetch error:', error);
        res.render('admin/users', { 
            error: 'Failed to fetch users',
            adminUser: req.session.adminUser,
            users: [],
            filter: 'all',
            search: '',
            paidCount: 0,
            pendingCount: 0,
            totalCount: 0,
            success: null
        });
    }
};

export const sendBulkEmail = async (req, res) => {
    try {
        const { filter, subject, message } = req.body;
        
        if (!subject || !message) {
            return res.render('admin/email-sent', {
                success: false,
                error: 'Subject and message are required',
                adminUser: req.session.adminUser,
                count: 0,
                filter: filter || 'all'
            });
        }

        let users;
        if (filter === 'paid') {
            users = await User.find({ paymentStatus: 'completed' });
        } else if (filter === 'pending') {
            users = await User.find({ paymentStatus: 'pending' });
        } else {
            users = await User.find();
        }

        const result = await sendBulkEmails(users, subject, message, filter);

        if (result.success) {
            // Log email activity
            console.log(`📧 Bulk email sent by ${req.session.adminUser}: ${result.count} users`);
            
            res.render('admin/email-sent', {
                success: true,
                count: result.count,
                filter: filter,
                adminUser: req.session.adminUser,
                error: null
            });
        } else {
            res.render('admin/email-sent', {
                success: false,
                error: result.error,
                adminUser: req.session.adminUser,
                count: 0,
                filter: filter || 'all'
            });
        }
    } catch (error) {
        console.error('Bulk email error:', error);
        res.render('admin/email-sent', {
            success: false,
            error: 'Failed to send emails',
            adminUser: req.session.adminUser,
            count: 0,
            filter: req.body.filter || 'all'
        });
    }
};

// Add this new method for the email form page
export const getEmailForm = (req, res) => {
    res.render('admin/send-email', {
        adminUser: req.session.adminUser,
        error: null,
        success: null
    });
};