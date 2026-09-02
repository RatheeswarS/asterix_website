import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import SiteData from '../models/SiteData.js';
import SiteConfig from '../models/SiteConfig.js';
import Subsystem from '../models/Subsystem.js';
import TeamMember from '../models/TeamMember.js';
import GalleryItem from '../models/GalleryItem.js';
import TeamUpdate from '../models/TeamUpdate.js';

async function runMigration() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('❌ MONGODB_URI environment variable is missing.');
        process.exit(1);
    }

    try {
        console.log('Connecting to MongoDB Atlas (target database: "asterix")...');
        try {
            await mongoose.connect(mongoUri, { dbName: 'asterix' });
        } catch (err) {
            console.log('Retrying with TLS fallback...');
            await mongoose.connect(mongoUri, { dbName: 'asterix', tlsAllowInvalidCertificates: true });
        }
        console.log('Connected to "asterix" database!');

        let legacy = await SiteData.findOne({ key: 'main' }).lean();
        if (!legacy) {
            console.log('Checking fallback legacy SiteData...');
            legacy = await SiteData.findOne().lean();
        }

        if (!legacy) {
            console.log('No legacy SiteData document found to migrate.');
            process.exit(0);
        }

        console.log('📦 Starting migration of legacy SiteData into 5 collections...');

        // 1. SiteConfig
        console.log('1/5 Migrating SiteConfig...');
        await SiteConfig.findOneAndUpdate(
            { key: 'main' },
            {
                $set: {
                    hero: legacy.hero || {},
                    story: legacy.story || '',
                    contact: legacy.contact || {},
                    sponsorship: legacy.sponsorship || {},
                    recruitment: legacy.recruitment || {},
                    lastModified: legacy.lastModified || new Date().toISOString()
                }
            },
            { upsert: true }
        );

        // 2. Subsystems & TeamMembers
        console.log('2/5 Migrating Subsystems and TeamMembers...');
        let memberCount = 0;
        if (Array.isArray(legacy.subsystems)) {
            for (let subIdx = 0; subIdx < legacy.subsystems.length; subIdx++) {
                const sub = legacy.subsystems[subIdx];
                if (!sub || !sub.id) continue;

                await Subsystem.findOneAndUpdate(
                    { id: sub.id },
                    {
                        $set: {
                            name: sub.name || '',
                            badge: sub.badge || '',
                            tagline: sub.tagline || '',
                            fullDesc: sub.fullDesc || '',
                            contactEmail: sub.contactEmail || '',
                            order: subIdx
                        }
                    },
                    { upsert: true }
                );

                if (Array.isArray(sub.teamMembers)) {
                    for (let memIdx = 0; memIdx < sub.teamMembers.length; memIdx++) {
                        const m = sub.teamMembers[memIdx];
                        if (!m) continue;
                        const memId = m.id || `mem-${sub.id}-${memIdx}`;
                        await TeamMember.findOneAndUpdate(
                            { id: memId },
                            {
                                $set: {
                                    id: memId,
                                    subsystemId: sub.id,
                                    name: m.name || '',
                                    role: m.role || '',
                                    phone: m.phone || '',
                                    initials: m.initials || '',
                                    badge: m.badge || 'SPECIALIST',
                                    status: m.status || 'Active Member',
                                    bio: m.bio || '',
                                    photo: m.photo || '',
                                    photoFit: m.photoFit || 'cover',
                                    photoPosition: m.photoPosition || '50% 50%',
                                    order: memIdx
                                }
                            },
                            { upsert: true }
                        );
                        memberCount++;
                    }
                }
            }
        }

        // 3. GalleryItems
        console.log('3/5 Migrating GalleryItems...');
        let galleryCount = 0;
        if (Array.isArray(legacy.gallery)) {
            for (let galIdx = 0; galIdx < legacy.gallery.length; galIdx++) {
                const item = legacy.gallery[galIdx];
                if (!item) continue;
                const galId = item.id || `gal-${galIdx}`;
                await GalleryItem.findOneAndUpdate(
                    { id: galId },
                    {
                        $set: {
                            id: galId,
                            title: item.title || '',
                            category: item.category || 'PIT LANE',
                            year: item.year || '2026',
                            src: item.src || '',
                            desc: item.desc || '',
                            fit: item.fit || 'cover',
                            position: item.position || '50% 50%',
                            order: galIdx
                        }
                    },
                    { upsert: true }
                );
                galleryCount++;
            }
        }

        // 4. TeamUpdates
        console.log('4/5 Migrating TeamUpdates...');
        let updateCount = 0;
        if (Array.isArray(legacy.updates)) {
            for (let updIdx = 0; updIdx < legacy.updates.length; updIdx++) {
                const upd = legacy.updates[updIdx];
                if (!upd) continue;
                const updId = upd.id || `upd-${updIdx}`;
                await TeamUpdate.findOneAndUpdate(
                    { id: updId },
                    {
                        $set: {
                            id: updId,
                            label: upd.label || '',
                            tag: upd.tag || 'PROVING GROUNDS',
                            image: upd.image || '',
                            link: upd.link || '#',
                            fit: upd.fit || 'cover',
                            position: upd.position || '50% 50%',
                            order: updIdx
                        }
                    },
                    { upsert: true }
                );
                updateCount++;
            }
        }

        console.log(`✅ Migration complete!`);
        console.log(`- Config migrated: 1`);
        console.log(`- Subsystems migrated: ${legacy.subsystems?.length || 0}`);
        console.log(`- Team Members migrated: ${memberCount}`);
        console.log(`- Gallery Items migrated: ${galleryCount}`);
        console.log(`- Team Updates migrated: ${updateCount}`);

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
