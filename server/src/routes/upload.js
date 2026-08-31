import { Router } from 'express';
import { upload, saveBufferToLocal } from '../middleware/upload.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadToImageKit, isImageKitConfigured, getImageKitAuthParams } from '../lib/imagekit.js';

const router = Router();

// GET /api/upload/auth (Protected - Return ImageKit auth parameters for client SDKs)
router.get('/auth', authenticateToken, (req, res) => {
    try {
        if (!isImageKitConfigured()) {
            return res.status(503).json({ error: 'ImageKit is not configured in server environment variables.' });
        }
        const authParams = getImageKitAuthParams();
        res.json(authParams);
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate ImageKit auth parameters', details: err.message });
    }
});

// POST /api/upload (Protected - Upload image to ImageKit or fallback to local storage)
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided in request.' });
        }

        const folder = req.body.folder || '/asterix';
        const tags = req.body.tags ? req.body.tags.split(',').map(t => t.trim()) : ['asterix', 'website'];

        // 1. Upload to ImageKit if configured
        if (isImageKitConfigured()) {
            try {
                const ikResult = await uploadToImageKit({
                    fileBuffer: req.file.buffer,
                    fileName: req.file.originalname,
                    folder,
                    tags
                });

                return res.status(201).json({
                    success: true,
                    provider: 'imagekit',
                    url: ikResult.url,
                    thumbnailUrl: ikResult.thumbnailUrl,
                    fileId: ikResult.fileId,
                    filename: ikResult.name,
                    size: ikResult.size,
                    width: ikResult.width,
                    height: ikResult.height
                });
            } catch (ikErr) {
                console.warn('⚠️ ImageKit upload failed, falling back to local storage:', ikErr.message);
            }
        }

        // 2. Fallback to local storage
        const localResult = await saveBufferToLocal(req.file.buffer, req.file.originalname);
        res.status(201).json({
            success: true,
            provider: 'local',
            url: localResult.fileUrl,
            filename: localResult.filename,
            size: req.file.size
        });
    } catch (err) {
        console.error('File upload error:', err);
        res.status(500).json({ error: 'Failed to process image upload', details: err.message });
    }
});

export default router;
