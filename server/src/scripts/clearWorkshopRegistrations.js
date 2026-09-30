import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import WorkshopRegistration from '../models/WorkshopRegistration.js';
import Counter from '../models/Counter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function clearWorkshopRegistrations() {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME?.trim() || 'asterix';

    if (!uri) {
        console.error('MONGODB_URI is not set in .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(uri, { 
            dbName, 
            serverSelectionTimeoutMS: 10000,
            tlsAllowInvalidCertificates: true 
        });
        console.log(`Connected to database "${dbName}".`);

        const deleteResult = await WorkshopRegistration.deleteMany({});
        console.log(`✓ Deleted ${deleteResult.deletedCount} workshop registrations.`);

        const counterResult = await Counter.deleteOne({ _id: 'workshopReceipt' });
        console.log(`✓ Reset workshopReceipt counter (next receipt will start at AST-WS-0001).`);

        console.log('\nWorkshop registrations table cleared completely.');
        process.exit(0);
    } catch (err) {
        console.error('Error clearing workshop registrations:', err);
        process.exit(1);
    }
}

clearWorkshopRegistrations();
