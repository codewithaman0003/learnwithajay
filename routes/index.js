const express = require('express');
const router = express.Router();
const Webinar = require('../models/Webinar');

// Home page
router.get('/', async (req, res) => {
    try {
        const webinars = await Webinar.find({ isActive: true }).limit(3);
        res.render('pages/index', { 
            webinars 
        });
    } catch (error) {
        res.status(500).send('Server error: ' + error.message);
    }
});

// About page
router.get('/about', (req, res) => {
    res.render('pages/about');
});

// Webinars page
router.get('/webinars', async (req, res) => {
    try {
        const webinars = await Webinar.find({ isActive: true });
        res.render('pages/webinars', { 
            webinars 
        });
    } catch (error) {
        res.status(500).send('Server error: ' + error.message);
    }
});

// Webinar detail page
router.get('/webinar/:id', async (req, res) => {
    try {
        const webinar = await Webinar.findById(req.params.id);
        if (!webinar) {
            return res.status(404).send('Webinar not found');
        }
        res.render('pages/webinar-detail', { 
            webinar 
        });
    } catch (error) {
        res.status(500).send('Server error: ' + error.message);
    }
});

// Portfolio page
router.get('/portfolio', (req, res) => {
    res.render('pages/portfolio');
});

// Contact page
router.get('/contact', (req, res) => {
    res.render('pages/contact');
});

module.exports = router;