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

// Initialize Resend with API Key
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

        console.log(`[MAIL] Starting send-invoice via RESEND for company: ${invoice.companyName}`);
        console.log(`[MAIL] From: ${fromEmail}, To: ${toEmails.join(', ')}`);

        if (!process.env.RESEND_API_KEY) {
            console.error('[MAIL] RESEND_API_KEY is missing');
            return res.status(500).json({ message: 'Resend API Key is not configured in environment variables.' });
        }

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
        try {
            if (fs.existsSync(logo1Path)) {
                attachments.push({
                    filename: 'Picture1.png',
                    content: fs.readFileSync(logo1Path),
                });
            }
            if (fs.existsSync(logo2Path)) {
                attachments.push({
                    filename: 'Picture2.png',
                    content: fs.readFileSync(logo2Path),
                });
            }
        } catch (atErr) {
            console.warn('[MAIL] Failed to attach logos:', atErr.message);
        }

        console.log(`[MAIL] Attempting to deliver via Resend API...`);

        const { data, error } = await resend.emails.send({
            from: `${senderName || 'AR System'} <onboarding@resend.dev>`, // Default Resend domain unless verified
            reply_to: fromEmail,
            to: toEmails,
            cc: ccEmails.length > 0 ? ccEmails : undefined,
            subject: `Invoice Overdue/Due Notice — ${invoice.companyName}`,
            html: htmlBody,
            attachments: attachments
        });

        if (error) {
            console.error('[MAIL] Resend API Error:', error);
            return res.status(400).json({ message: 'Resend delivery failed', error });
        }

        console.log(`[MAIL] Success! MessageId: ${data.id}`);

        res.json({
            message: `Email sent successfully via Resend to ${toEmails.length} recipient(s).`,
            messageId: data.id,
            to: toEmails,
            cc: ccEmails,
        });

    } catch (error) {
        console.error('Email send error:', error);
        res.status(500).json({ message: error.message || 'Failed to send email.' });
    }
});

export default router;
