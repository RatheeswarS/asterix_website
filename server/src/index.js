import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables before importing dependent modules
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

import express from 'express';
import cors from 'cors';

import { connectMongoDB } from './db/mongodb.js';
import siteDataRoutes from './routes/siteData.js';
import authRoutes from './routes/auth.js';
import subscriberRoutes from './routes/subscribers.js';
import sponsorInquiryRoutes from './routes/sponsorInquiries.js';
import uploadRoutes from './routes/upload.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas (or fallback mode if MONGODB_URI is not set yet)
connectMongoDB();

// Middleware
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
    : ['http://localhost:5173', 'http://localhost:3000', 'https://asterix-website.vercel.app'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        if (origin.endsWith('.vercel.app') && origin.includes('asterix')) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads serving
const uploadsPath = process.env.UPLOADS_DIR
    ? path.resolve(process.env.UPLOADS_DIR)
    : path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        database: 'MongoDB Atlas',
        service: 'Team Asterix API Engine',
        timestamp: new Date().toISOString()
    });
});

// Mount routes
app.use('/api/site-data', siteDataRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/subscribers', subscriberRoutes);
app.use('/api/sponsor-inquiries', sponsorInquiryRoutes);
app.use('/api/upload', uploadRoutes);

// Global error handler
app.use((err, req, res, _next) => {
    console.error('Unhandled server error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error'
    });
});

const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log(`🚀 Asterix Server & MongoDB API running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
    console.log(`📁 Uploads available at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/uploads/`);
});
