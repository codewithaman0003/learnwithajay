import express from 'express';
const router = express.Router();

// Home page route
router.get('/home', (req, res) => {
    res.render('pages/index', {
        title: 'Ajay - AI-Powered Digital Marketing Expert',
        currentPage: 'home'
    });
});

// About page route
router.get('/about', (req, res) => {
    res.render('pages/about', {
        title: 'About Ajay - Digital Marketing Expert',
        currentPage: 'about'
    });
});

// Contact page route
router.get('/contact', (req, res) => {
    res.render('pages/contact', {
        title: 'Contact Ajay - Get in Touch',
        currentPage: 'contact'
    });
});

// Portfolio page route
router.get('/portfolio', (req, res) => {
    res.render('pages/portfolio', {
        title: 'Portfolio - Ajay\'s Projects & Case Studies',
        currentPage: 'portfolio'
    });
});

// Services page route
router.get('/services', (req, res) => {
    res.render('pages/services', {
        title: 'Services - Digital Marketing Solutions',
        currentPage: 'services'
    });
});

// Webinar page route
router.get('/webinar', (req, res) => {
    res.render('pages/webinar', {
        title: 'Webinar - Earn Money Like the Wealthy',
        currentPage: 'webinar'
    });
});

// Webinar registration route (if you have it)
router.get('/register', (req, res) => {
    res.render('pages/register', {
        title: 'Register for Webinar',
        currentPage: 'webinar'
    });
});

// Success page route
router.get('/success', (req, res) => {
    res.render('pages/success', {
        title: 'Registration Successful',
        currentPage: 'success'
    });
});

export default router;