import express from 'express';
import { 
    getAdminLogin, 
    adminLogin, 
    adminDashboard, 
    getUsers, 
    sendBulkEmail,
    adminLogout,
    getEmailForm
} from '../controllers/adminController.js';
import { requireAdminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

// Admin login routes
router.get('/admin/login', getAdminLogin);
router.post('/admin/login', adminLogin);
router.get('/admin/logout', adminLogout);

// Protected admin routes
router.get('/admin/dashboard', requireAdminAuth, adminDashboard);
router.get('/admin/users', requireAdminAuth, getUsers);
router.get('/admin/emails', requireAdminAuth, getEmailForm);
router.post('/admin/send-bulk-email', requireAdminAuth, sendBulkEmail);

// Add these routes to your existing admin routes
router.get('/admin/api/users/:id', requireAdminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

router.post('/admin/api/users/:id/remind', requireAdminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Send payment reminder email
        await sendPaymentReminderEmail(user);
        
        res.json({ success: true, message: 'Payment reminder sent successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to send reminder' });
    }
});

router.delete('/admin/api/users/:id', requireAdminAuth, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
});

router.get('/admin/api/users/export', requireAdminAuth, async (req, res) => {
    try {
        const { filter, search } = req.query;
        let query = {};
        
        if (filter === 'paid') {
            query.paymentStatus = 'completed';
        } else if (filter === 'pending') {
            query.paymentStatus = 'pending';
        }
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query).sort({ registeredAt: -1 });
        
        // Generate CSV
        let csv = 'Name,Email,Phone,Payment Status,Amount,Registered At,Paid At\n';
        users.forEach(user => {
            csv += `"${user.name}","${user.email}","${user.phone}",${user.paymentStatus},${user.amount || 49},"${user.registeredAt}","${user.paidAt || ''}"\n`;
        });
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
        res.send(csv);
    } catch (error) {
        res.status(500).json({ error: 'Failed to export users' });
    }
});

export default router;