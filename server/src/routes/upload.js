import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// POST /api/upload (Protected - Admin)
router.post('/', authenticateToken, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded.' });
        }

        // Return path relative to server root
        const fileUrl = `/uploads/${req.file.filename}`;

        res.status(201).json({
            success: true,
            url: fileUrl,
            filename: req.file.filename,
            size: req.file.size
        });
    } catch (err) {
        console.error('File upload error:', err);
        res.status(500).json({ error: 'Failed to process image upload', details: err.message });
    }
});

export default router;
