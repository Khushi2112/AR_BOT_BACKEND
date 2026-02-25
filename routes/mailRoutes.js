import express from 'express';
import nodemailer from 'nodemailer';
import Invoice from '../models/Invoice.js';
import CustomerEmail from '../models/CustomerEmail.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Create transporter - configured via environment variables
const createTransporter = () => nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// POST /api/mail/send-invoice/:invoiceId
router.post('/send-invoice/:invoiceId', async (req, res) => {
    try {
        const { senderName, fromEmail } = req.body;
        const invoice = await Invoice.findById(req.params.invoiceId);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        const company = await CustomerEmail.findOne({ companyName: invoice.companyName });
        if (!company) return res.status(404).json({ message: 'No email contacts found for this company. Please set up emails in Company Emails page.' });

        const toEmails = company.toEmails?.filter(Boolean) || [];
        const ccEmails = company.ccEmails?.filter(Boolean) || [];

        if (toEmails.length === 0) {
            return res.status(400).json({ message: 'No TO email addresses configured for this company. Please add them in Company Emails page.' });
        }

        const transporter = createTransporter();

        // Helper to parse DD-MM-YYYY
        const parseDate = (d) => {
            if (!d) return new Date();
            const parts = d.split('-');
            if (parts.length === 3) {
                return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            }
            return new Date(d);
        };

        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        const due = parseDate(invoice.dueDate);
        due.setHours(0, 0, 0, 0);

        const diffTime = due.getTime() - todayDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const overdueDays = diffDays < 0 ? Math.abs(diffDays) : diffDays;
        const diffLabel = diffDays < 0 ? overdueDays : diffDays;

        // Format currency
        const fmt = (v) => `${parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        const invoiceNo = invoice.invoiceNumber || invoice.invoice_number || invoice._id.toString().slice(-6).toUpperCase();

        const htmlBody = `
        <div style="font-family: Arial, sans-serif; color: #000; font-size: 14px; line-height: 1.6;">
            <p>Hello Team,</p>
            <br/>
            <p>The Invoice's given below will be due on the due date's mentioned in the table below. We request you to arrange for its payment on its due date.</p>
            <br/>

            <table style="width: 100%; border-collapse: collapse; border: 1px solid #999; font-size: 11px;">
                <tr style="background-color: #bfbfbf; font-weight: bold; text-align: center;">
                    <th style="border: 1px solid #999; padding: 6px;">Invoice Date</th>
                    <th style="border: 1px solid #999; padding: 6px;">Due Date</th>
                    <th style="border: 1px solid #999; padding: 6px;">Payment Term</th>
                    <th style="border: 1px solid #999; padding: 6px;">Today</th>
                    <th style="border: 1px solid #999; padding: 6px;">OverDue By / Due Within</th>
                    <th style="border: 1px solid #999; padding: 6px;">Invoice No.</th>
                    <th style="border: 1px solid #999; padding: 6px;">Customer Name</th>
                    <th style="border: 1px solid #999; padding: 6px;">Payment Status</th>
                    <th style="border: 1px solid #999; padding: 6px;">USD</th>
                    <th style="border: 1px solid #999; padding: 6px;">Gross INR</th>
                    <th style="border: 1px solid #999; padding: 6px;">GST</th>
                    <th style="border: 1px solid #999; padding: 6px;">Total Invoice Amount</th>
                </tr>
                <tr style="text-align: center; background-color: #ffffff;">
                    <td style="border: 1px solid #999; padding: 8px;">${invoice.invoiceDate || '-'}</td>
                    <td style="border: 1px solid #999; padding: 8px;">${invoice.dueDate || '-'}</td>
                    <td style="border: 1px solid #999; padding: 8px;">${invoice.Terms || '-'}</td>
                    <td style="border: 1px solid #999; padding: 8px;">${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-')}</td>
                    <td style="border: 1px solid #999; padding: 8px;">${diffLabel}</td>
                    <td style="border: 1px solid #999; padding: 8px;">${invoiceNo}</td>
                    <td style="border: 1px solid #999; padding: 8px; color: #ff0000; font-weight: bold;">${invoice.companyName}</td>
                    <td style="border: 1px solid #999; padding: 8px;">${invoice.paymentStatus || 'Due'}</td>
                    <td style="border: 1px solid #999; padding: 8px;">-</td>
                    <td style="border: 1px solid #999; padding: 8px;">${fmt(invoice.subtotal)}</td>
                    <td style="border: 1px solid #999; padding: 8px;">${fmt(invoice.GST_Amount)}</td>
                    <td style="border: 1px solid #999; padding: 8px;">${fmt(invoice.total_Amount)}</td>
                </tr>
            </table>

            <br/>
            <p>Best Regards,</p>
            <br/>
            <p style="font-weight: bold; margin-bottom: 20px;">Accounts Receivable Team</p>
            
            <div style="margin-top: 20px;">
                <img src="cid:logo1" alt="TecnoPrism" style="height: 60px; margin-right: 15px; vertical-align: middle;">
                <img src="cid:logo2" alt="Partner" style="height: 60px; vertical-align: middle;">
            </div>

            <p style="margin-top: 20px; font-style: italic;">
                <span style="font-weight: bold;">Mobile.</span> +919712636570 
                <span style="font-weight: bold; margin-left: 10px;">Email.</span> <a href="mailto:finance@tecnoprism.com" style="color: #007bff; text-decoration: underline;">finance@tecnoprism.com</a>
            </p>
            <p style="margin-top: 5px;">
                <a href="http://www.tecnoprism.com" style="color: #007bff; text-decoration: underline; font-weight: bold;">www.tecnoprism.com</a>
            </p>
        </div>
        `;

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
            from: `"${senderName || 'Accounts Receivable Team'}" <${process.env.EMAIL_USER}>`,
            replyTo: fromEmail,
            to: toEmails.join(', '),
            cc: ccEmails.length > 0 ? ccEmails.join(', ') : undefined,
            subject: `Invoice Overdue/Due Notice — ${invoice.companyName}`,
            html: htmlBody,
            attachments: attachments
        };

        await transporter.sendMail(mailOptions);

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
