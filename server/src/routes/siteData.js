import { Router } from 'express';
import db from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// GET /api/site-data (Public)
router.get('/', (req, res) => {
    try {
        const stmt = db.prepare('SELECT section, content, updated_at FROM site_data');
        const rows = stmt.all();

        const result = {
            hero: null,
            story: '',
            subsystems: [],
            gallery: [],
            updates: [],
            contact: null,
            lastModified: new Date().toISOString()
        };

        let latestUpdate = '';

        for (const row of rows) {
            try {
                result[row.section] = JSON.parse(row.content);
            } catch {
                result[row.section] = row.content;
            }
            if (!latestUpdate || row.updated_at > latestUpdate) {
                latestUpdate = row.updated_at;
            }
        }

        if (latestUpdate) {
            result.lastModified = latestUpdate;
        }

        res.json(result);
    } catch (err) {
        console.error('Error fetching site data:', err);
        res.status(500).json({ error: 'Failed to retrieve site data', details: err.message });
    }
});

// PUT /api/site-data (Protected - Admin)
router.put('/', authenticateToken, (req, res) => {
    try {
        const payload = req.body;
        const now = new Date().toISOString();
        const allowedSections = ['hero', 'story', 'subsystems', 'gallery', 'updates', 'contact'];

        const upsertStmt = db.prepare(`
            INSERT INTO site_data (section, content, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(section) DO UPDATE SET
                content = excluded.content,
                updated_at = excluded.updated_at
        `);

        for (const section of allowedSections) {
            if (payload[section] !== undefined) {
                const serialized = typeof payload[section] === 'string'
                    ? payload[section]
                    : JSON.stringify(payload[section]);
                upsertStmt.run(section, serialized, now);
            }
        }

        res.json({
            success: true,
            message: 'Website data saved successfully to database',
            lastModified: now
        });
    } catch (err) {
        console.error('Error updating site data:', err);
        res.status(500).json({ error: 'Failed to update site data', details: err.message });
    }
});

export default router;
