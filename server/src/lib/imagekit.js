import ImageKit from 'imagekit';

let imagekitClient = null;

/**
 * Returns the ImageKit SDK client instance if credentials are configured.
 */
export function getImageKitClient() {
    if (imagekitClient) return imagekitClient;

    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

    if (!publicKey || !privateKey || !urlEndpoint) {
        return null;
    }

    imagekitClient = new ImageKit({
        publicKey,
        privateKey,
        urlEndpoint
    });

    return imagekitClient;
}

/**
 * Check if ImageKit credentials are provided in the environment.
 */
export function isImageKitConfigured() {
    return Boolean(
        process.env.IMAGEKIT_PUBLIC_KEY &&
        process.env.IMAGEKIT_PRIVATE_KEY &&
        process.env.IMAGEKIT_URL_ENDPOINT
    );
}

/**
 * Upload an image buffer directly to ImageKit cloud media library.
 */
export async function uploadToImageKit({ fileBuffer, fileName, folder = '/asterix', tags = ['website'] }) {
    const ik = getImageKitClient();
    if (!ik) {
        throw new Error('ImageKit is not configured in server environment variables.');
    }

    const base64File = fileBuffer.toString('base64');

    const result = await ik.upload({
        file: base64File,
        fileName,
        folder,
        tags,
        useUniqueFileName: true
    });

    return {
        url: result.url,
        fileId: result.fileId,
        thumbnailUrl: result.thumbnailUrl,
        name: result.name,
        size: result.size,
        height: result.height,
        width: result.width
    };
}

/**
 * Generates client-side authentication parameters (signature, token, expire)
 * for direct frontend ImageKit uploads if needed.
 */
export function getImageKitAuthParams() {
    const ik = getImageKitClient();
    if (!ik) {
        throw new Error('ImageKit is not configured in server environment variables.');
    }
    return ik.getAuthenticationParameters();
}
