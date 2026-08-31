import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import SiteData from '../models/SiteData.js';
import User from '../models/User.js';
import Subscriber from '../models/Subscriber.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export async function migrateSqliteToMongo(options = {}) {
    const dataDir = process.env.DATA_DIR
        ? path.resolve(process.env.DATA_DIR)
        : path.resolve(__dirname, '../../../server/data');
    const dbPath = path.join(dataDir, 'asterix.db');

    if (!fs.existsSync(dbPath)) {
        console.log(`ℹ️ No SQLite database found at ${dbPath}. Skipping migration.`);
        return { migrated: false, reason: 'SQLite DB not found' };
    }

    console.log(`📦 Found existing SQLite database at: ${dbPath}`);
    let sqliteDb;
    const report = {
        siteDataMigrated: false,
        usersMigrated: 0,
        subscribersMigrated: 0
    };

    try {
        sqliteDb = new DatabaseSync(dbPath);

        // 1. Migrate Site Data
        const siteCount = await SiteData.countDocuments();
        const sqliteSiteRows = sqliteDb.prepare("SELECT section, content, updated_at FROM site_data").all();

        if (sqliteSiteRows.length > 0 && (siteCount === 0 || options.force)) {
            console.log(`🔄 Migrating ${sqliteSiteRows.length} site_data sections from SQLite to MongoDB Atlas...`);
            const sitePayload = {
                key: 'main',
                lastModified: new Date().toISOString()
            };

            for (const row of sqliteSiteRows) {
                try {
                    sitePayload[row.section] = JSON.parse(row.content);
                } catch {
                    sitePayload[row.section] = row.content;
                }
            }

            await SiteData.findOneAndUpdate(
                { key: 'main' },
                { $set: sitePayload },
                { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
            );
            report.siteDataMigrated = true;
            console.log(`✓ SiteData migrated successfully.`);
        }

        // 2. Migrate Users
        const sqliteUsers = sqliteDb.prepare("SELECT * FROM users").all();
        if (sqliteUsers.length > 0) {
            console.log(`🔄 Checking ${sqliteUsers.length} user accounts for migration...`);
            for (const u of sqliteUsers) {
                const cleanUsername = (u.username || '').trim().toLowerCase();
                const existing = await User.findOne({ username: cleanUsername });
                if (!existing) {
                    await User.create({
                        username: cleanUsername,
                        passwordHash: u.password_hash,
                        name: u.name,
                        role: u.role || 'Team Member',
                        accessLevel: u.access_level || 'Lead'
                    });
                    report.usersMigrated++;
                    console.log(`  + Migrated user: ${cleanUsername} (${u.access_level || 'Lead'})`);
                }
            }
        }

        // 3. Migrate Subscribers
        const sqliteSubscribers = sqliteDb.prepare("SELECT * FROM subscribers").all();
        if (sqliteSubscribers.length > 0) {
            console.log(`🔄 Checking ${sqliteSubscribers.length} subscribers for migration...`);
            for (const s of sqliteSubscribers) {
                const cleanEmail = (s.email || '').trim().toLowerCase();
                if (cleanEmail) {
                    await Subscriber.findOneAndUpdate(
                        { email: cleanEmail },
                        { $set: { phone: s.phone || null } },
                        { upsert: true, setDefaultsOnInsert: true }
                    );
                    report.subscribersMigrated++;
                }
            }
            console.log(`  + Synced ${report.subscribersMigrated} subscribers.`);
        }

        console.log('🎉 SQLite to MongoDB Atlas migration completed successfully!');
        return { migrated: true, report };
    } catch (err) {
        console.error('❌ Migration failed with error:', err);
        return { migrated: false, error: err.message };
    } finally {
        if (sqliteDb) {
            try { sqliteDb.close(); } catch { /* ignore */ }
        }
    }
}

// Standalone execution: node src/scripts/migrateFromSqlite.js
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
    (async () => {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.error('❌ MONGODB_URI environment variable is required to run migration.');
            process.exit(1);
        }

        try {
            console.log('Connecting to MongoDB Atlas...');
            try {
                await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
            } catch (connErr) {
                await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000, tlsAllowInvalidCertificates: true });
            }
            console.log('Connected.');
            await migrateSqliteToMongo({ force: process.argv.includes('--force') });
        } catch (e) {
            console.error('Error during migration run:', e);
        } finally {
            await mongoose.disconnect();
            process.exit(0);
        }
    })();
}
