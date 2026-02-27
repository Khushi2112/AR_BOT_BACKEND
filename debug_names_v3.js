import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function debugData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;

        // Find 5 invoices that DON'T have companyName
        const oldInvoices = await db.collection('invoices').find({
            $or: [
                { companyName: { $exists: false } },
                { companyName: null },
                { companyName: "" }
            ]
        }).limit(5).toArray();

        console.log('--- SAMPLES WITHOUT companyName ---');
        console.log(JSON.stringify(oldInvoices, null, 2));

        // Find 1 invoice THAT HAS companyName but is "old" (maybe by date or _id)
        const newInvoices = await db.collection('invoices').find({
            companyName: { $exists: true, $ne: "" }
        }).limit(5).toArray();
        console.log('--- SAMPLES WITH companyName ---');
        console.log(JSON.stringify(newInvoices, null, 2));

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

debugData();
