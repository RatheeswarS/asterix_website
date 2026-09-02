import { Router } from 'express';
import SiteConfig from '../models/SiteConfig.js';
import Subsystem from '../models/Subsystem.js';
import TeamMember from '../models/TeamMember.js';
import GalleryItem from '../models/GalleryItem.js';
import TeamUpdate from '../models/TeamUpdate.js';
import SiteData from '../models/SiteData.js';
import { authenticateToken } from '../middleware/auth.js';
import { isMongoConnected } from '../db/mongodb.js';

const router = Router();

// Auto-migrate legacy SiteData single-document into the 5 collections if needed
async function autoMigrateLegacySiteData() {
    try {
        const legacy = await SiteData.findOne({ key: 'main' }).lean();
        if (!legacy) return;

        console.log('Migrating legacy SiteData into 5 separate MongoDB collections...');

        // 1. SiteConfig
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
                        const memId = m.id || `mem-${sub.id}-${memIdx}-${Date.now()}`;
                        await TeamMember.findOneAndUpdate(
                            { id: memId },
                            {
                                $set: {
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
                    }
                }
            }
        }

        // 3. GalleryItems
        if (Array.isArray(legacy.gallery)) {
            for (let galIdx = 0; galIdx < legacy.gallery.length; galIdx++) {
                const item = legacy.gallery[galIdx];
                if (!item) continue;
                const galId = item.id || `gal-${galIdx}-${Date.now()}`;
                await GalleryItem.findOneAndUpdate(
                    { id: galId },
                    {
                        $set: {
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
            }
        }

        // 4. TeamUpdates
        if (Array.isArray(legacy.updates)) {
            for (let updIdx = 0; updIdx < legacy.updates.length; updIdx++) {
                const upd = legacy.updates[updIdx];
                if (!upd) continue;
                const updId = upd.id || `upd-${updIdx}-${Date.now()}`;
                await TeamUpdate.findOneAndUpdate(
                    { id: updId },
                    {
                        $set: {
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
            }
        }

        console.log('Legacy SiteData successfully migrated into 5 collections!');
    } catch (err) {
        console.warn('Auto-migration notice:', err.message);
    }
}

// GET /api/site-data (Public - Aggregates all 5 collections for fast front-page load)
router.get('/', async (req, res) => {
    try {
        if (!isMongoConnected()) {
            return res.json({
                hero: null,
                story: '',
                subsystems: [],
                gallery: [],
                updates: [],
                contact: null,
                sponsorship: null,
                recruitment: null,
                lastModified: new Date().toISOString()
            });
        }

        // Check if legacy data needs migration
        const configCount = await SiteConfig.countDocuments({ key: 'main' });
        if (configCount === 0) {
            await autoMigrateLegacySiteData();
        }

        const [config, subsystems, allMembers, gallery, updates] = await Promise.all([
            SiteConfig.findOne({ key: 'main' }).lean(),
            Subsystem.find().sort({ order: 1 }).lean(),
            TeamMember.find().sort({ order: 1, createdAt: 1 }).lean(),
            GalleryItem.find().sort({ order: 1, createdAt: -1 }).lean(),
            TeamUpdate.find().sort({ order: 1, createdAt: -1 }).lean()
        ]);

        const aggregatedSubsystems = subsystems.map(sub => ({
            ...sub,
            specifications: sub.specifications || [],
            highlights: sub.highlights || [],
            teamMembers: allMembers.filter(m => m.subsystemId === sub.id)
        }));

        res.json({
            hero: config?.hero || null,
            story: config?.story || '',
            subsystems: aggregatedSubsystems,
            gallery: gallery || [],
            updates: updates || [],
            contact: config?.contact || null,
            sponsorship: config?.sponsorship || null,
            recruitment: config?.recruitment || null,
            lastModified: config?.lastModified || config?.updatedAt?.toISOString() || new Date().toISOString()
        });
    } catch (err) {
        console.error('Error fetching site data:', err);
        res.status(500).json({ error: 'Failed to retrieve site data', details: err.message });
    }
});

// PUT /api/site-data (Protected - Bulk sync across the 5 MongoDB collections)
router.put('/', authenticateToken, async (req, res) => {
    try {
        const payload = req.body;
        const now = new Date().toISOString();

        // 1. Update SiteConfig
        const configFields = { lastModified: now };
        for (const field of ['hero', 'story', 'contact', 'sponsorship', 'recruitment']) {
            if (payload[field] !== undefined) {
                configFields[field] = payload[field];
            }
        }
        const siteConfig = await SiteConfig.findOneAndUpdate(
            { key: 'main' },
            { $set: configFields },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        // 2. Sync Subsystems & Members
        if (Array.isArray(payload.subsystems)) {
            for (let subIdx = 0; subIdx < payload.subsystems.length; subIdx++) {
                const sub = payload.subsystems[subIdx];
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
                    // Sync members in this subsystem
                    const currentMemIds = [];
                    for (let memIdx = 0; memIdx < sub.teamMembers.length; memIdx++) {
                        const m = sub.teamMembers[memIdx];
                        if (!m) continue;
                        const memId = m.id || `mem-${sub.id}-${memIdx}-${Date.now()}`;
                        currentMemIds.push(memId);

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
                    }
                    // Clean up deleted members for this subsystem
                    await TeamMember.deleteMany({ subsystemId: sub.id, id: { $nin: currentMemIds } });
                }
            }
        }

        // 3. Sync GalleryItems
        if (Array.isArray(payload.gallery)) {
            const currentGalIds = [];
            for (let galIdx = 0; galIdx < payload.gallery.length; galIdx++) {
                const item = payload.gallery[galIdx];
                if (!item) continue;
                const galId = item.id || `gal-${galIdx}-${Date.now()}`;
                currentGalIds.push(galId);

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
            }
            await GalleryItem.deleteMany({ id: { $nin: currentGalIds } });
        }

        // 4. Sync TeamUpdates
        if (Array.isArray(payload.updates)) {
            const currentUpdIds = [];
            for (let updIdx = 0; updIdx < payload.updates.length; updIdx++) {
                const upd = payload.updates[updIdx];
                if (!upd) continue;
                const updId = upd.id || `upd-${updIdx}-${Date.now()}`;
                currentUpdIds.push(updId);

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
            }
            await TeamUpdate.deleteMany({ id: { $nin: currentUpdIds } });
        }

        res.json({
            success: true,
            message: 'Website data saved successfully across 5 MongoDB collections!',
            lastModified: siteConfig.lastModified
        });
    } catch (err) {
        console.error('Error updating site data:', err);
        res.status(500).json({ error: 'Failed to update site data', details: err.message });
    }
});

export default router;
