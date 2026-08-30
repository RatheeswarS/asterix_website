/**
 * Client-side image compressor.
 * Resizes images to reasonable dimensions (max 1280px) and converts to WebP/JPEG
 * at ~82% quality. Reduces large 5-15MB camera photos down to lightweight ~40-90KB data URLs.
 * Enables 100% free, zero-card image storage directly in Cloud Firestore documents.
 */
export async function compressImage(file, maxWidth = 1280, maxHeight = 1280, quality = 0.82) {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
            return reject(new Error('Selected file is not an image'));
        }

        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.onload = (e) => {
            const img = new Image();
            img.onerror = () => reject(new Error('Failed to load image for compression'));
            img.onload = () => {
                let { width, height } = img;

                // Scale down proportionally if larger than maximum dimensions
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return resolve(e.target.result); // Fallback to raw data URL if canvas context unavailable
                }

                // Smooth resampling
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                // Prefer WebP export for maximum compression efficiency
                let compressedDataUrl = canvas.toDataURL('image/webp', quality);

                // If browser falls back to PNG because it doesn't support WebP export, use JPEG
                if (!compressedDataUrl.startsWith('data:image/webp')) {
                    compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                }

                resolve(compressedDataUrl);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}
