import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadDir = process.env.UPLOADS_DIR ? path.resolve(process.env.UPLOADS_DIR) : path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Use memory storage so file buffers can be uploaded to ImageKit directly
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|svg|gif/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);

    if (ext || mime) {
        return cb(null, true);
    }
    cb(new Error('Only image files (JPEG, JPG, PNG, WEBP, SVG, GIF) are allowed.'));
};

export const upload = multer({
    storage,
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max
    fileFilter
});

/**
 * Fallback helper to persist a buffer to local disk when ImageKit is not configured.
 */
export async function saveBufferToLocal(buffer, originalname) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const cleanName = (originalname || 'upload.jpg').replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `asterix-${uniqueSuffix}${path.extname(cleanName)}`;
    const fullPath = path.join(uploadDir, filename);

    await fs.promises.writeFile(fullPath, buffer);
    return {
        filename,
        fileUrl: `/uploads/${filename}`
    };
}

