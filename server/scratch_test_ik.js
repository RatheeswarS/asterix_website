import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

import { uploadToImageKit, isImageKitConfigured } from './src/lib/imagekit.js';

console.log('ImageKit configured?:', isImageKitConfigured());
console.log('Public Key:', process.env.IMAGEKIT_PUBLIC_KEY);
console.log('URL Endpoint:', process.env.IMAGEKIT_URL_ENDPOINT);

async function testUpload() {
    try {
        const dummyBuffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
        const res = await uploadToImageKit({
            fileBuffer: dummyBuffer,
            fileName: 'test-pixel.gif',
            folder: '/asterix/test',
            tags: ['test']
        });
        console.log('Upload Result:', res);
    } catch (err) {
        console.error('Upload Error:', err);
    }
}

testUpload();
