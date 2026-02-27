import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Invoice from './models/Invoice.js';

dotenv.config();

async function debugData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const totalInvoices = await Invoice.countDocuments();
        console.log('Total Invoices:', totalInvoices);

        const sample = await Invoice.findOne();
        if (sample) {
            console.log('Sample Invoice Keys:', Object.keys(sample.toObject()));
            console.log('Sample Invoice Data:', JSON.stringify(sample, null, 2));
        }

        const distinctNames = await Invoice.distinct('companyName');
        console.log('Distinct companyName values (count):', distinctNames.length);
        console.log('Distinct companyName values (first 20):', JSON.stringify(distinctNames.slice(0, 20), null, 2));

        // Check for common field variations
        const distinctNamesAlt = await Invoice.distinct('company_name');
        if (distinctNamesAlt.length > 0) {
            console.log('Detected company_name field! Count:', distinctNamesAlt.length);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

debugData();
