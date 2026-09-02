import { Router } from 'express';
import GalleryItem from '../models/GalleryItem.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// GET /api/gallery (Public - List all gallery items)
router.get('/', async (req, res) => {
    try {
        const items = await GalleryItem.find().sort({ order: 1, createdAt: -1 }).lean();
        res.json(items);
    } catch (err) {
        console.error('Error fetching gallery items:', err);
        res.status(500).json({ error: 'Failed to fetch gallery items', details: err.message });
    }
});

// POST /api/gallery (Protected - Create new gallery item)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { title, category, year, src, desc, fit, position, order } = req.body;
        if (!title || !src) {
            return res.status(400).json({ error: 'Title and image URL (src) are required.' });
        }

        const id = req.body.id || `gal-${Date.now()}`;
        const newItem = await GalleryItem.create({
            id,
            title,
            category: category || 'PIT LANE',
            year: year || '2026',
            src,
            desc: desc || '',
            fit: fit || 'cover',
            position: position || '50% 50%',
            order: order !== undefined ? order : 0
        });

        res.status(201).json(newItem);
    } catch (err) {
        console.error('Error creating gallery item:', err);
        res.status(500).json({ error: 'Failed to create gallery item', details: err.message });
    }
});

// PUT /api/gallery/:id (Protected - Update gallery item)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const updated = await GalleryItem.findOneAndUpdate(
            { id: req.params.id },
            { $set: req.body },
            { new: true }
        );
        if (!updated) {
            return res.status(404).json({ error: 'Gallery item not found.' });
        }
        res.json(updated);
    } catch (err) {
        console.error('Error updating gallery item:', err);
        res.status(500).json({ error: 'Failed to update gallery item', details: err.message });
    }
});

// DELETE /api/gallery/:id (Protected - Delete gallery item)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const deleted = await GalleryItem.findOneAndDelete({ id: req.params.id });
        if (!deleted) {
            return res.status(404).json({ error: 'Gallery item not found.' });
        }
        res.json({ success: true, message: 'Gallery item deleted successfully.' });
    } catch (err) {
        console.error('Error deleting gallery item:', err);
        res.status(500).json({ error: 'Failed to delete gallery item', details: err.message });
    }
});

export default router;
