import express from 'express';
import path from 'path';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import userRoutes from './routes/user.js';
import adminRoutes from './routes/admin.js';
import mainRoutes from './routes/mainRoutes.js';
import helmet from 'helmet';

dotenv.config();

const app = express();
// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

// Routes
app.use('/', userRoutes);
app.use('/', adminRoutes);
app.use('/', mainRoutes);

// Security middleware
app.use(helmet());
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
}));
// Start server
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

// ✅ Export app for Vercel
export default app;
