import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

async function debugData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;

        const invoices = await db.collection('invoices').find().limit(20).toArray();
        fs.writeFileSync('invoice_samples.json', JSON.stringify(invoices, null, 2));

        console.log('Saved 20 samples to invoice_samples.json');
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

debugData();
