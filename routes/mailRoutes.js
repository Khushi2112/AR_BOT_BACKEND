import express from 'express';
import nodemailer from 'nodemailer';
import Invoice from '../models/Invoice.js';
import CustomerEmail from '../models/CustomerEmail.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { getInvoiceEmailTemplate } from '../utils/email_formate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Create transporter - configured via environment variables
const createTransporter = () => {
    console.log('[MAIL] Creating transporter with:', process.env.EMAIL_USER);
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        connectionTimeout: 15000, // 15s
        greetingTimeout: 15000,   // 15s
        socketTimeout: 20000,     // 20s
        tls: {
            rejectUnauthorized: false // Helps in some cloud environments with cert issues
        }
    });
};

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

        console.log(`[MAIL] Starting send-invoice for invoice: ${req.params.invoiceId}`);
        const transporter = createTransporter();

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
                path: logo1Path,
                cid: 'logo1'
            });
        }
        if (fs.existsSync(logo2Path)) {
            attachments.push({
                filename: 'Picture2.png',
                path: logo2Path,
                cid: 'logo2'
            });
        }

        const mailOptions = {
            from: `"${senderName || 'Accounts Receivable Team'}" <${fromEmail || process.env.EMAIL_USER}>`,
            replyTo: fromEmail || process.env.EMAIL_USER,
            to: toEmails.join(', '),
            cc: ccEmails.length > 0 ? ccEmails.join(', ') : undefined,
            subject: `Invoice Overdue/Due Notice — ${invoice.companyName}`,
            html: htmlBody,
            attachments: attachments
        };

        console.log(`[MAIL] Attempting to send to: ${mailOptions.to}`);
        await transporter.sendMail(mailOptions);
        console.log(`[MAIL] Success: Email sent to ${invoice.companyName}`);

        res.json({
            message: `Email sent successfully to ${toEmails.length} recipient(s)${ccEmails.length > 0 ? ` and ${ccEmails.length} CC` : ''}.`,
            to: toEmails,
            cc: ccEmails,
        });

    } catch (error) {
        console.error('Email send error:', error);
        res.status(500).json({ message: error.message || 'Failed to send email.' });
    }
});

export default router;
