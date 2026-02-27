import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function debugData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;
        const invoices = await db.collection('invoices').find().limit(5).toArray();

        console.log('--- ALL KEYS IN FIRST 5 INVOICES ---');
        const allKeys = new Set();
        invoices.forEach(inv => {
            Object.keys(inv).forEach(key => allKeys.add(key));
        });
        console.log(Array.from(allKeys));

        console.log('--- VALUES FOR COMPANY RELATED FIELDS ---');
        const companyFields = ['companyName', 'company_name', 'Bill To', 'Customer', 'client'];
        for (const field of companyFields) {
            const values = await db.collection('invoices').distinct(field);
            console.log(`${field} values:`, values.slice(0, 10));
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

debugData();
