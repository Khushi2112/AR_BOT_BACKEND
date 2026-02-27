import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CompanyEmail from './models/CompanyEmail.js';

dotenv.config();

async function checkConfigs() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const configs = await CompanyEmail.find({});
        console.log('--- START CONFIG DUMP ---');
        configs.forEach(c => {
            console.log('COMPANY_START');
            console.log(`NAME: ${c.companyName}`);
            console.log(`TO_ARRAY: ${JSON.stringify(c.toEmails)}`);
            console.log(`CC_ARRAY: ${JSON.stringify(c.ccEmails)}`);
            console.log('COMPANY_END');
        });
        console.log('--- END CONFIG DUMP ---');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkConfigs();
