import { Router } from 'express';
import SiteData from '../models/SiteData.js';
import { authenticateToken } from '../middleware/auth.js';
import { isMongoConnected } from '../db/mongodb.js';

const router = Router();

// GET /api/site-data (Public)
router.get('/', async (req, res) => {
    try {
        let site = isMongoConnected() ? await SiteData.findOne({ key: 'main' }).lean() : null;

        if (!site) {
            return res.json({
                hero: null,
                story: '',
                subsystems: [],
                gallery: [],
                updates: [],
                contact: null,
                sponsorship: null,
                recruitment: null,
                lastModified: new Date().toISOString()
            });
        }

        res.json({
            hero: site.hero || null,
            story: site.story || '',
            subsystems: site.subsystems || [],
            gallery: site.gallery || [],
            updates: site.updates || [],
            contact: site.contact || null,
            sponsorship: site.sponsorship || null,
            recruitment: site.recruitment || null,
            lastModified: site.lastModified || site.updatedAt?.toISOString() || new Date().toISOString()
        });
    } catch (err) {
        console.error('Error fetching site data:', err);
        res.status(500).json({ error: 'Failed to retrieve site data', details: err.message });
    }
});

// PUT /api/site-data (Protected - Admin)
router.put('/', authenticateToken, async (req, res) => {
    try {
        const payload = req.body;
        const now = new Date().toISOString();

        const updateFields = {
            lastModified: now
        };

        const allowedFields = [
            'hero', 'story', 'subsystems', 'gallery', 'updates', 
            'contact', 'sponsorship', 'recruitment'
        ];

        for (const field of allowedFields) {
            if (payload[field] !== undefined) {
                updateFields[field] = payload[field];
            }
        }

        const site = await SiteData.findOneAndUpdate(
            { key: 'main' },
            { $set: updateFields },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.json({
            success: true,
            message: 'Website data saved successfully to MongoDB Atlas!',
            lastModified: site.lastModified
        });
    } catch (err) {
        console.error('Error updating site data:', err);
        res.status(500).json({ error: 'Failed to update site data', details: err.message });
    }
});

export default router;
