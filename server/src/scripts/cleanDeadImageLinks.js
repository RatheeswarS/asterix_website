/**
 * Repairs image URLs in the stored site data.
 *
 * Two kinds of dead link accumulated while the server ran without ImageKit
 * credentials:
 *
 *   1. Uploads that fell back to the container's own disk, saved as
 *      'https://<backend-host>/uploads/asterix-<timestamp>-<random>.jpg'. That
 *      disk is recreated empty on every deploy, so the files stopped existing
 *      and the URLs now answer 404. Nothing can restore them; they are cleared
 *      so each component falls back to its placeholder instead of showing a
 *      broken image, and the picture can be re-uploaded through the dashboard.
 *
 *   2. Build output paths, '/assets/<name>-<hash>.jpg'. The hash is regenerated
 *      by every production build, so these broke on the first rebuild after they
 *      were saved. The same pictures ship unhashed in the frontend's public/
 *      directory, so they are rewritten to '/gallery/<name>.jpg', which stays
 *      valid across builds.
 *
 * Runs as a dry run by default and prints what it would change. Pass --apply to
 * write. Requires MONGODB_URI in the environment.
 *
 *   node --use-system-ca src/scripts/cleanDeadImageLinks.js
 *   node --use-system-ca src/scripts/cleanDeadImageLinks.js --apply
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

const APPLY = process.argv.includes('--apply');

/* Matched by host and path so that a backend serving a genuinely persistent
   volume at /uploads is left alone. */
const DEAD_UPLOAD = /^https?:\/\/[^/]*onrender\.com\/uploads\//i;
const HASHED_BUILD_ASSET = /^\/assets\/(.+)-[A-Za-z0-9_-]{8}(\.[a-z0-9]+)$/i;

// Fields that hold an image URL anywhere in the site data tree.
const IMAGE_KEYS = new Set(['src', 'image', 'photo', 'photoUrl', 'imageUrl', 'logo', 'avatar', 'thumbnail', 'banner', 'cover']);

function repair(value, trail, changes) {
    if (DEAD_UPLOAD.test(value)) {
        changes.push({ trail, from: value, to: '', reason: 'file erased with the container disk' });
        return '';
    }
    const hashed = value.match(HASHED_BUILD_ASSET);
    if (hashed) {
        const rewritten = `/gallery/${hashed[1]}${hashed[2]}`;
        changes.push({ trail, from: value, to: rewritten, reason: 'build hash changes every deploy' });
        return rewritten;
    }
    return value;
}

function walk(node, trail, changes) {
    if (Array.isArray(node)) {
        node.forEach((item, i) => walk(item, `${trail}[${i}]`, changes));
        return;
    }
    if (!node || typeof node !== 'object') return;

    for (const [key, value] of Object.entries(node)) {
        const here = trail ? `${trail}.${key}` : key;
        if (typeof value === 'string' && IMAGE_KEYS.has(key) && value) {
            const repaired = repair(value, here, changes);
            if (repaired !== value) node[key] = repaired;
        } else if (value && typeof value === 'object') {
            walk(value, here, changes);
        }
    }
}

export const REPAIRED_FIELDS = ['hero', 'subsystems', 'gallery', 'updates', 'contact', 'sponsorship', 'recruitment'];

/** Rewrites image URLs in place and returns the list of changes made. */
export function repairSiteData(data) {
    const changes = [];
    for (const field of REPAIRED_FIELDS) {
        walk(data[field], field, changes);
    }
    return changes;
}

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI is not set. Point it at the database you want to repair.');
        process.exit(1);
    }

    const { default: SiteData } = await import('../models/SiteData.js');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });

    const doc = await SiteData.findOne({ key: 'main' }) || await SiteData.findOne();
    if (!doc) {
        console.log('No site data document found; nothing to repair.');
        await mongoose.disconnect();
        return;
    }

    const data = doc.toObject();
    const changes = repairSiteData(data);

    if (changes.length === 0) {
        console.log('No dead image links found.');
        await mongoose.disconnect();
        return;
    }

    console.log(`${changes.length} dead image link(s) found:\n`);
    for (const c of changes) {
        console.log(`  ${c.trail}`);
        console.log(`    from: ${c.from}`);
        console.log(`    to:   ${c.to || '(cleared -- re-upload through the dashboard)'}`);
        console.log(`    why:  ${c.reason}\n`);
    }

    if (!APPLY) {
        console.log('Dry run. Re-run with --apply to write these changes.');
        await mongoose.disconnect();
        return;
    }

    for (const field of REPAIRED_FIELDS) {
        doc.set(field, data[field]);
        doc.markModified(field);
    }
    doc.lastModified = new Date().toISOString();
    await doc.save();

    console.log(`Applied ${changes.length} change(s).`);
    await mongoose.disconnect();
}

/* Only connect when run as a command; importing this module (the tests do)
   must not open a database connection. */
const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) main().catch(async (err) => {
    console.error('Repair failed:', err.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
});
