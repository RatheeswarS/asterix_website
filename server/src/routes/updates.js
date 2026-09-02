import { Router } from 'express';
import TeamUpdate from '../models/TeamUpdate.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// GET /api/updates (Public - List all team updates)
router.get('/', async (req, res) => {
    try {
        const updates = await TeamUpdate.find().sort({ order: 1, createdAt: -1 }).lean();
        res.json(updates);
    } catch (err) {
        console.error('Error fetching team updates:', err);
        res.status(500).json({ error: 'Failed to fetch team updates', details: err.message });
    }
});

// POST /api/updates (Protected - Create new team update)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { label, tag, image, link, fit, position, order } = req.body;
        if (!label) {
            return res.status(400).json({ error: 'Update label is required.' });
        }

        const id = req.body.id || `upd-${Date.now()}`;
        const newUpdate = await TeamUpdate.create({
            id,
            label,
            tag: tag || 'PROVING GROUNDS',
            image: image || '',
            link: link || '#',
            fit: fit || 'cover',
            position: position || '50% 50%',
            order: order !== undefined ? order : 0
        });

        res.status(201).json(newUpdate);
    } catch (err) {
        console.error('Error creating team update:', err);
        res.status(500).json({ error: 'Failed to create team update', details: err.message });
    }
});

// PUT /api/updates/:id (Protected - Update team update)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const updated = await TeamUpdate.findOneAndUpdate(
            { id: req.params.id },
            { $set: req.body },
            { new: true }
        );
        if (!updated) {
            return res.status(404).json({ error: 'Team update not found.' });
        }
        res.json(updated);
    } catch (err) {
        console.error('Error updating team update:', err);
        res.status(500).json({ error: 'Failed to update team update', details: err.message });
    }
});

// DELETE /api/updates/:id (Protected - Delete team update)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const deleted = await TeamUpdate.findOneAndDelete({ id: req.params.id });
        if (!deleted) {
            return res.status(404).json({ error: 'Team update not found.' });
        }
        res.json({ success: true, message: 'Team update deleted successfully.' });
    } catch (err) {
        console.error('Error deleting team update:', err);
        res.status(500).json({ error: 'Failed to delete team update', details: err.message });
    }
});

export default router;
