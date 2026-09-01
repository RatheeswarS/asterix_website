import { Router } from 'express';
import { upload, saveBufferToLocal } from '../middleware/upload.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadToImageKit, isImageKitConfigured, getImageKitAuthParams } from '../lib/imagekit.js';

const router = Router();

/* Local disk is only a real destination when the host mounts a persistent
   volume at UPLOADS_DIR. Without one, a container rebuild erases every file and
   the URLs saved in the database keep pointing at 404s -- which is exactly how
   the gallery and squad photos were lost. */
const persistentUploads = Boolean(process.env.UPLOADS_DIR) || process.env.ALLOW_LOCAL_UPLOADS === 'true';

// GET /api/upload/status (Public - no secrets, just whether uploads can persist)
router.get('/status', (req, res) => {
    const imagekit = isImageKitConfigured();
    res.json({
        imagekit,
        localFallback: persistentUploads,
        persistent: imagekit || persistentUploads
    });
});

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
                /* This used to fall through to local disk silently. On a host
                   without a persistent volume that turns a failed upload into a
                   URL that works once and 404s forever after, with nothing in
                   the response to say so. Report the failure instead. */
                console.error('ImageKit upload failed:', ikErr.message);
                if (!persistentUploads) {
                    return res.status(502).json({
                        error: 'ImageKit upload failed and there is no persistent local fallback on this host.',
                        details: ikErr.message
                    });
                }
                console.warn('Falling back to persistent local storage at UPLOADS_DIR.');
            }
        } else if (!persistentUploads) {
            /* Refusing beats writing a file that is guaranteed to disappear. */
            return res.status(503).json({
                error: 'Image uploads are not configured. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY and IMAGEKIT_URL_ENDPOINT on the server, or mount a persistent volume and set UPLOADS_DIR.',
                code: 'UPLOADS_NOT_PERSISTENT'
            });
        }

        // 2. Fallback to local storage (only reached when UPLOADS_DIR is set)
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
