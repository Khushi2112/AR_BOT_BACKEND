import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CompanyEmail from './models/CompanyEmail.js';

dotenv.config();

async function checkConfigs() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const configs = await CompanyEmail.find({});
        console.log('Total Configurations found:', configs.length);
        configs.forEach(c => {
            console.log(`- Company: ${c.companyName}`);
            console.log(`  To: ${JSON.stringify(c.toEmails)}`);
            console.log(`  CC: ${JSON.stringify(c.ccEmails)}`);
        });
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkConfigs();
