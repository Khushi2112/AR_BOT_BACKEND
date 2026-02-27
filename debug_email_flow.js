import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Invoice from './models/Invoice.js';
import CompanyEmail from './models/CompanyEmail.js';
import { sendInvoiceEmail } from './utils/emailService.js';

dotenv.config();

async function debugFlow() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Find an invoice for a configured company
        const configs = await CompanyEmail.find({});
        if (configs.length === 0) {
            console.log('No configurations found.');
            process.exit(0);
        }

        const config = configs[0];
        console.log(`Testing with Company: ${config.companyName}`);

        const invoice = await Invoice.findOne({
            companyName: { $regex: new RegExp(`^${config.companyName}$`, 'i') }
        });

        if (!invoice) {
            console.log(`No invoice found for ${config.companyName}`);
        } else {
            console.log(`Found Invoice: #${invoice.invoiceNumber || invoice.invoice_number}`);

            // DRY RUN or ACTUAL SEND?
            // Let's just log what would be sent by calling the service
            // but the service now has many logs.
            console.log('--- STARTING SEND ---');
            // We can't easily intercept the mailOptions unless we change the service
            // but the service already logs them! 
            const result = await sendInvoiceEmail(invoice, config);
            console.log('--- DONE ---');
            console.log('Result:', result.envelope);
            console.log('Accepted:', result.accepted);
            console.log('Rejected:', result.rejected);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error in debug flow:', error);
        process.exit(1);
    }
}

debugFlow();
