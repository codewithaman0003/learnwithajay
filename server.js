require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const serverless = require('serverless-http');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));

// Make variables available to all templates
app.use((req, res, next) => {
    res.locals.baseUrl = process.env.BASE_URL || '';
    res.locals.canonicalUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    next();
});

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ✅ Cached MongoDB connection
let cached = global.mongoose;
if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // fail fast if unreachable
            socketTimeoutMS: 45000,        // keep alive longer
        }).then((mongoose) => mongoose);
    }

    cached.conn = await cached.promise;
    return cached.conn;
}

// Routes (connect DB before handling)
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error("MongoDB connection error:", err);
        res.status(500).send("Database connection error");
    }
});

app.use('/', require('./routes/index'));
app.use('/admin', require('./routes/admin'));
app.use('/payment', require('./routes/payment'));

// ❌ No app.listen() on Vercel
module.exports = app;
module.exports.handler = serverless(app);
