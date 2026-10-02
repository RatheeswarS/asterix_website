import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import WorkshopRegistration from '../models/WorkshopRegistration.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;
const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

async function checkRazorpay() {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME?.trim() || 'asterix';

    await mongoose.connect(uri, { 
        dbName, 
        serverSelectionTimeoutMS: 10000,
        tlsAllowInvalidCertificates: true 
    });

    const pending = await WorkshopRegistration.find({ status: 'pending' }).lean();
    console.log(`Checking ${pending.length} pending registrations in Razorpay...`);

    for (const reg of pending) {
        if (!reg.razorpayOrderId) {
            console.log(`[NO ORDER ID] ${reg.name} (${reg.email})`);
            continue;
        }

        try {
            // Fetch payments for this order from Razorpay
            const res = await fetch(`https://api.razorpay.com/v1/orders/${reg.razorpayOrderId}/payments`, {
                headers: { Authorization: `Basic ${auth}` }
            });
            const data = await res.json();
            
            if (data.items && data.items.length > 0) {
                console.log(`\n🚨 FOUND PAYMENT(S) FOR PENDING REGISTRATION:`);
                console.log(`Name: ${reg.name} | Roll: ${reg.rollNo} | Email: ${reg.email}`);
                console.log(`DB Reg ID: ${reg._id} | Order ID: ${reg.razorpayOrderId}`);
                data.items.forEach(p => {
                    console.log(`  -> Payment ID: ${p.id}, Status: ${p.status}, Amount: ${p.amount / 100}, Method: ${p.method}, Captured: ${p.captured}`);
                });
            } else {
                console.log(`No payments for ${reg.name} (${reg.rollNo}) - order ${reg.razorpayOrderId} status: empty`);
            }
        } catch (err) {
            console.error(`Error checking order ${reg.razorpayOrderId} for ${reg.name}:`, err.message);
        }
    }

    process.exit(0);
}

checkRazorpay().catch(console.error);
