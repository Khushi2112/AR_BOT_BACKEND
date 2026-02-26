import express from 'express';
import { Resend } from 'resend';
import Invoice from '../models/Invoice.js';
import CustomerEmail from '../models/CustomerEmail.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { getInvoiceEmailTemplate } from '../utils/email_formate.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// GET /api/mail/preview/:invoiceId
router.get('/preview/:invoiceId', async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.invoiceId);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        const companyInvoices = await Invoice.find({
            companyName: invoice.companyName,
            paymentStatus: { $ne: 'Paid' }
        }).sort({ invoiceDate: 1 });

        const { senderName, fromEmail, senderPhone } = req.query;
        const company = await CustomerEmail.findOne({ companyName: invoice.companyName });
        const toEmails = company?.toEmails?.filter(Boolean) || [];
        const ccEmails = company?.ccEmails?.filter(Boolean) || [];

        const htmlBody = getInvoiceEmailTemplate(companyInvoices, {
            senderName,
            fromEmail,
            senderPhone,
            toEmails,
            ccEmails,
            invoiceNo: invoice.invoiceNumber || invoice.invoice_number
        });

        res.json({
            invoices: companyInvoices,
            html: htmlBody
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/mail/send-invoice/:invoiceId
router.post('/send-invoice/:invoiceId', async (req, res) => {
    try {
        const { senderName, fromEmail, senderPhone } = req.body;
        const invoice = await Invoice.findById(req.params.invoiceId);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        // Find all unpaid invoices for this company to send as a statement
        const companyInvoices = await Invoice.find({
            companyName: invoice.companyName,
            paymentStatus: { $ne: 'Paid' }
        }).sort({ invoiceDate: 1 });

        const company = await CustomerEmail.findOne({ companyName: invoice.companyName });
        if (!company) return res.status(404).json({ message: 'No email contacts found for this company. Please set up emails in Company Emails page.' });

        const toEmails = company.toEmails?.filter(Boolean) || [];
        const ccEmails = company.ccEmails?.filter(Boolean) || [];

        if (toEmails.length === 0) {
            return res.status(400).json({ message: 'No TO email addresses configured for this company. Please add them in Company Emails page.' });
        }

        if (!process.env.RESEND_API_KEY) {
            console.error('[MAIL] RESEND_API_KEY is missing');
            return res.status(500).json({ message: 'Mail server configuration error: RESEND_API_KEY is missing.' });
        }

        console.log(`[MAIL] Starting send-invoice (Resend) for company: ${invoice.companyName}`);
        console.log(`[MAIL] To: ${toEmails.join(', ')}`);

        const invoiceNo = invoice.invoiceNumber || invoice.invoice_number || invoice._id.toString().slice(-6).toUpperCase();

        const htmlBody = getInvoiceEmailTemplate(companyInvoices, {
            senderName,
            fromEmail,
            senderPhone,
            toEmails,
            ccEmails,
            invoiceNo
        });

        const logo1Path = path.resolve(__dirname, '../../frontend/image/Picture1.png');
        const logo2Path = path.resolve(__dirname, '../../frontend/image/Picture2.png');

        const attachments = [];
        if (fs.existsSync(logo1Path)) {
            attachments.push({
                filename: 'Picture1.png',
                content: fs.readFileSync(logo1Path),
                content_id: 'logo1'
            });
        }
        if (fs.existsSync(logo2Path)) {
            attachments.push({
                filename: 'Picture2.png',
                content: fs.readFileSync(logo2Path),
                content_id: 'logo2'
            });
        }

        const mailOptions = {
            from: `${senderName || 'Accounts Receivable Team'} <onboarding@resend.dev>`, // Resend requires verified domain or onboarding address
            to: toEmails,
            cc: ccEmails.length > 0 ? ccEmails : undefined,
            reply_to: fromEmail || 'finance@tecnoprism.com',
            subject: `Invoice Overdue/Due Notice — ${invoice.companyName}`,
            html: htmlBody,
            attachments: attachments
        };

        // Note: Resend "from" field format is slightly different or requires domain verification. 
        // If the user hasn't verified a domain, they MUST use onboarding@resend.dev.
        // I will keep it as onboarding@resend.dev for now as it's the safest default for a new setup.

        console.log(`[MAIL] Attempting delivery to ${mailOptions.to.join(', ')} via Resend...`);

        const { data, error } = await resend.emails.send(mailOptions);

        if (error) {
            console.error('[MAIL] Resend API Error:', error);
            throw new Error(`Resend API Error: ${error.message}`);
        }

        console.log(`[MAIL] Success! Message ID: ${data.id}`);

        res.json({
            message: `Email sent successfully to ${toEmails.length} recipient(s).`,
            messageId: data.id,
            to: toEmails,
            cc: ccEmails,
        });

    } catch (error) {
        console.error('Email send error:', error);
        res.status(500).json({ message: error.message || 'Failed to send email via Resend.' });
    }
});

export default router;
