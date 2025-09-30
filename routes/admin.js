const express = require('express');
const router = express.Router();
const Webinar = require('../models/Webinar');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { sendBulkEmail } = require('../utils/emailService');

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
    if (req.session.adminLoggedIn) {
        next();
    } else {
        res.redirect('/admin/login');
    }
};

// Admin login page
router.get('/login', (req, res) => {
    if (req.session.adminLoggedIn) {
        return res.redirect('/admin/dashboard');
    }
    res.render('admin/login');
});

// Admin login handler
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        req.session.adminLoggedIn = true;
        res.redirect('/admin/dashboard');
    } else {
        res.render('admin/login', { error: 'Invalid credentials' });
    }
});

// Admin logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

// Admin dashboard
router.get('/dashboard', authenticateAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalWebinars = await Webinar.countDocuments({ isDeleted: false });
        const totalRevenue = await Payment.aggregate([
            { $match: { status: 'paid' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        const recentRegistrations = await User.find()
            .populate('webinarId')
            .sort({ createdAt: -1 })
            .limit(10);

        // Add safe data processing
        const safeRegistrations = recentRegistrations.map(registration => ({
            ...registration.toObject(),
            webinarTitle: registration.webinarId ? registration.webinarId.title : 'Webinar Not Found',
            webinarId: registration.webinarId ? registration.webinarId._id : null
        }));

        res.render('admin/dashboard', {
            totalUsers,
            totalWebinars,
            totalRevenue: totalRevenue[0]?.total || 0,
            recentRegistrations: safeRegistrations
        });
    } catch (error) {
        res.status(500).render('admin/error', { error: 'Server error' });
    }
});

// Webinar management - only show non-deleted webinars
router.get('/webinars', authenticateAdmin, async (req, res) => {
    try {
        const webinars = await Webinar.find({ isDeleted: false }).sort({ createdAt: -1 });
        res.render('admin/webinars', { 
            webinars,
            success: req.query.success 
        });
    } catch (error) {
        res.status(500).render('admin/error', { error: 'Server error' });
    }
});

// Create webinar page
router.get('/webinars/create', authenticateAdmin, (req, res) => {
    res.render('admin/create-webinar');
});

// Create webinar handler
router.post('/webinars', authenticateAdmin, async (req, res) => {
    try {
        console.log('Received webinar data:', req.body);
        
        // Validate required fields
        const { title, description, date, time, duration, speaker, price } = req.body;
        
        if (!title || !description || !date || !time || !duration || !speaker || !price) {
            return res.status(400).render('admin/error', { 
                error: 'All required fields must be filled: title, description, date, time, duration, speaker, price' 
            });
        }

        // Prepare webinar data with proper boolean handling
        const webinarData = {
            title: req.body.title,
            description: req.body.description,
            date: new Date(req.body.date),
            time: req.body.time,
            duration: req.body.duration,
            speaker: req.body.speaker,
            price: parseFloat(req.body.price),
            maxParticipants: req.body.maxParticipants ? parseInt(req.body.maxParticipants) : null,
            isActive: req.body.isActive === 'true',
            isDeleted: false // Explicitly set to false for new webinars
        };

        console.log('Creating webinar with data:', webinarData);

        const webinar = new Webinar(webinarData);
        await webinar.save();
        
        console.log('Webinar created successfully:', webinar._id);
        console.log('Webinar active status:', webinar.isActive);
        res.redirect('/admin/webinars');
        
    } catch (error) {
        console.error('Webinar creation error:', error);
        res.status(500).render('admin/error', { 
            error: `Failed to create webinar: ${error.message}` 
        });
    }
});

// Toggle webinar status
router.get('/webinars/toggle-status/:id', authenticateAdmin, async (req, res) => {
    try {
        const webinarId = req.params.id;
        console.log('Toggling status for webinar:', webinarId);
        
        const webinar = await Webinar.findOne({ _id: webinarId, isDeleted: false });
        
        if (!webinar) {
            return res.status(404).render('admin/error', { error: 'Webinar not found' });
        }

        // Toggle the status
        webinar.isActive = !webinar.isActive;
        await webinar.save();

        console.log('Webinar status updated:', webinar.title, 'is now', webinar.isActive ? 'Active' : 'Inactive');
        res.redirect('/admin/webinars');
        
    } catch (error) {
        console.error('Toggle status error:', error);
        res.status(500).render('admin/error', { error: 'Failed to update webinar status: ' + error.message });
    }
});

// Soft delete webinar
router.get('/webinars/delete/:id', authenticateAdmin, async (req, res) => {
    try {
        const webinarId = req.params.id;
        console.log('Soft deleting webinar:', webinarId);
        
        const webinar = await Webinar.findOne({ _id: webinarId, isDeleted: false });
        
        if (!webinar) {
            return res.status(404).render('admin/error', { error: 'Webinar not found' });
        }

        // Mark as deleted instead of actually deleting
        webinar.isDeleted = true;
        webinar.isActive = false; // Also deactivate when deleting
        webinar.deletedAt = new Date();
        await webinar.save();

        console.log('Webinar soft deleted:', webinar.title);
        res.redirect('/admin/webinars?success=Webinar deleted successfully');
        
    } catch (error) {
        console.error('Delete webinar error:', error);
        res.status(500).render('admin/error', { error: 'Failed to delete webinar: ' + error.message });
    }
});

// User management
router.get('/users', authenticateAdmin, async (req, res) => {
    try {
        const { webinar, paymentStatus } = req.query;
        let filter = {};
        
        if (webinar) filter.webinarId = webinar;
        if (paymentStatus) filter.paymentStatus = paymentStatus;

        const users = await User.find(filter)
            .populate('webinarId')
            .sort({ createdAt: -1 });

        // Add safe data processing
        const safeUsers = users.map(user => ({
            ...user.toObject(),
            webinarTitle: user.webinarId ? user.webinarId.title : 'Webinar Not Found',
            webinarExists: !!user.webinarId
        }));

        const webinars = await Webinar.find({ isDeleted: false, isActive: true });
        
        res.render('admin/users', { 
            users: safeUsers, 
            webinars, 
            filters: req.query 
        });
    } catch (error) {
        res.status(500).render('admin/error', { error: 'Server error' });
    }
});

// Bulk email page
router.get('/bulk-email', authenticateAdmin, async (req, res) => {
    try {
        const webinars = await Webinar.find({ isDeleted: false, isActive: true });
        res.render('admin/bulk-email', { 
            webinars,
            success: req.query.success 
        });
    } catch (error) {
        res.status(500).render('admin/error', { error: 'Server error' });
    }
});

// Send bulk email
router.post('/send-bulk-email', authenticateAdmin, async (req, res) => {
    try {
        const { subject, message, webinarId, paymentStatus } = req.body;
        
        let filter = {};
        if (webinarId) filter.webinarId = webinarId;
        if (paymentStatus) filter.paymentStatus = paymentStatus;

        const users = await User.find(filter).populate('webinarId');
        
        await sendBulkEmail(users, subject, message);
        
        res.redirect('/admin/bulk-email?success=true');
    } catch (error) {
        res.status(500).render('admin/error', { error: 'Failed to send emails' });
    }
});

// Optional: Restore deleted webinars (if you want to add this feature later)
router.get('/webinars/restore/:id', authenticateAdmin, async (req, res) => {
    try {
        const webinarId = req.params.id;
        console.log('Restoring webinar:', webinarId);
        
        const webinar = await Webinar.findOne({ _id: webinarId, isDeleted: true });
        
        if (!webinar) {
            return res.status(404).render('admin/error', { error: 'Deleted webinar not found' });
        }

        // Restore the webinar
        webinar.isDeleted = false;
        webinar.isActive = true;
        webinar.deletedAt = null;
        await webinar.save();

        console.log('Webinar restored:', webinar.title);
        res.redirect('/admin/webinars?success=Webinar restored successfully');
        
    } catch (error) {
        console.error('Restore webinar error:', error);
        res.status(500).render('admin/error', { error: 'Failed to restore webinar: ' + error.message });
    }
});

// Optional: View deleted webinars (if you want to add this feature later)
router.get('/webinars/deleted', authenticateAdmin, async (req, res) => {
    try {
        const deletedWebinars = await Webinar.find({ isDeleted: true }).sort({ deletedAt: -1 });
        res.render('admin/deleted-webinars', { 
            webinars: deletedWebinars 
        });
    } catch (error) {
        res.status(500).render('admin/error', { error: 'Server error' });
    }
});

module.exports = router;