import { Router } from 'express';
import db from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// POST /api/subscribers (Public - Join the Alliance)
router.post('/', (req, res) => {
    try {
        const { email, phone } = req.body;
        if (!email || !email.includes('@')) {
            return res.status(400).json({ error: 'A valid email address is required.' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const cleanPhone = phone ? phone.trim() : null;
        const now = new Date().toISOString();
        const id = 'sub-' + Date.now();

        const stmt = db.prepare(`
            INSERT INTO subscribers (id, email, phone, created_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(email) DO UPDATE SET
                phone = COALESCE(excluded.phone, subscribers.phone)
        `);

        stmt.run(id, cleanEmail, cleanPhone, now);

        res.status(201).json({
            success: true,
            message: 'Thank you for joining the Asterix Racing Alliance!'
        });
    } catch (err) {
        console.error('Error adding subscriber:', err);
        res.status(500).json({ error: 'Failed to record subscription', details: err.message });
    }
});

// GET /api/subscribers (Protected - Admin)
router.get('/', authenticateToken, (req, res) => {
    try {
        const stmt = db.prepare('SELECT id, email, phone, created_at FROM subscribers ORDER BY created_at DESC');
        const list = stmt.all();
        res.json(list);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve subscribers', details: err.message });
    }
});

// DELETE /api/subscribers/:id (Protected - Admin)
router.delete('/:id', authenticateToken, (req, res) => {
    try {
        const stmt = db.prepare('DELETE FROM subscribers WHERE id = ?');
        stmt.run(req.params.id);
        res.json({ success: true, message: 'Subscriber removed.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete subscriber', details: err.message });
    }
});

export default router;
