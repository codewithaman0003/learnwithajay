import bcrypt from 'bcryptjs';

export const requireAdminAuth = (req, res, next) => {
    // Check if admin is logged in via session
    if (req.session.adminLoggedIn && req.session.adminUser) {
        return next();
    }

    // Check for admin token in headers
    const authHeader = req.headers['admin-authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        // You can add JWT verification here if needed
    }

    res.redirect('/admin/login');
};

export const validateAdminCredentials = (username, password) => {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminPassword) {
        console.error('❌ ADMIN_PASSWORD not set in environment variables');
        return false;
    }
    
    return username === adminUsername && password === adminPassword;
};

// Rate limiting for admin login
export const adminLoginLimiter = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login attempts per windowMs
    message: 'Too many login attempts, please try again after 15 minutes'
};