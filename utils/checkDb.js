import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CustomerEmail from '../models/CustomerEmail.js';

dotenv.config();

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const customer = await CustomerEmail.findOne({ companyName: /Tecnoprism/i });
        console.log('Customer in DB:', JSON.stringify(customer, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

check();
