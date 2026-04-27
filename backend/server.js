require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const repairRoutes = require('./routes/repairs');
const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3001;

const rateLimit = require('express-rate-limit');

// Middleware
app.use(cors());
app.use(express.json());


// Global limiter — all routes
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,                  // 100 requests per window per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again in 15 minutes.' }
});

// Strict limiter — chat route only (costs money per call)
const chatLimiter = rateLimit({
    windowMs: 60 * 1000,  // 1 minute
    max: 10,              // 10 chat messages per minute per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Chat limit reached. Please wait a moment before sending another message.' }
});

app.use(globalLimiter);
app.use('/api/chat', chatLimiter);

// Routes
app.use('/api/repairs', repairRoutes);
app.use('/api/chat', chatRoutes);

// Health check — Render uses this to confirm the service is alive
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Connect to MongoDB then start server
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB Atlas');
        app.listen(PORT, () => {
            console.log(`Nexus API running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    });