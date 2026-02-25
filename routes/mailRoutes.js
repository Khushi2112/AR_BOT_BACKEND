import express from 'express';
import nodemailer from 'nodemailer';
import Invoice from '../models/Invoice.js';
import CustomerEmail from '../models/CustomerEmail.js';

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

        // Format currency
        const fmt = (v) => `₹${parseFloat(v || 0).toLocaleString('en-IN')}`;

        const invoiceNo = invoice.invoiceNumber || invoice.invoice_number || invoice._id.toString().slice(-6).toUpperCase();

        const htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: #0f172a; padding: 32px 40px; border-radius: 12px 12px 0 0;">
                <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">Invoice #${invoiceNo}</h1>
                <p style="color: #94a3b8; margin: 6px 0 0; font-size: 14px;">${invoice.companyName}</p>
            </div>
            <div style="padding: 32px 40px; border: 1px solid #e2e8f0; border-top: none;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 12px 0; color: #64748b; font-weight: 500;">Invoice Date</td>
                        <td style="padding: 12px 0; color: #0f172a; font-weight: 600; text-align: right;">${invoice.invoiceDate || '-'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 12px 0; color: #64748b; font-weight: 500;">Due Date</td>
                        <td style="padding: 12px 0; color: #0f172a; font-weight: 600; text-align: right;">${invoice.dueDate || '-'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 12px 0; color: #64748b; font-weight: 500;">Description</td>
                        <td style="padding: 12px 0; color: #0f172a; font-weight: 600; text-align: right;">${invoice.description || '-'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 12px 0; color: #64748b; font-weight: 500;">Unit Price</td>
                        <td style="padding: 12px 0; color: #0f172a; font-weight: 600; text-align: right;">${fmt(invoice.total_price)}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 12px 0; color: #64748b; font-weight: 500;">Quantity</td>
                        <td style="padding: 12px 0; color: #0f172a; font-weight: 600; text-align: right;">${invoice.quantity || '-'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 12px 0; color: #64748b; font-weight: 500;">Subtotal</td>
                        <td style="padding: 12px 0; color: #0f172a; font-weight: 600; text-align: right;">${fmt(invoice.subtotal)}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 12px 0; color: #64748b; font-weight: 500;">GST (${invoice.GST || 0}%)</td>
                        <td style="padding: 12px 0; color: #0f172a; font-weight: 600; text-align: right;">${fmt(invoice.GST_Amount)}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 12px 0; color: #64748b; font-weight: 500;">Total Amount</td>
                        <td style="padding: 12px 0; color: #0f172a; font-weight: 700; text-align: right; font-size: 15px;">${fmt(invoice.total_Amount)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 16px 0 8px; color: #64748b; font-weight: 500;">Balance Due</td>
                        <td style="padding: 16px 0 8px; color: #2563eb; font-weight: 800; text-align: right; font-size: 18px;">${fmt(invoice.balance_due)}</td>
                    </tr>
                </table>

                <div style="margin-top: 28px; padding: 16px 20px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <p style="margin: 0; color: #64748b; font-size: 13px;">Payment Status: <strong style="color: #0f172a;">${invoice.paymentStatus || 'Unknown'}</strong></p>
                </div>

                <p style="margin-top: 28px; color: #94a3b8; font-size: 12px; line-height: 1.6;">
                    This is an automated invoice notification. Please do not reply to this email.
                </p>
            </div>
            <div style="background: #f8fafc; padding: 20px 40px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
                <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">FinancePortal · Sent on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
        </div>
        `;

        const mailOptions = {
            from: `"FinancePortal" <${process.env.EMAIL_USER}>`,
            to: toEmails.join(', '),
            cc: ccEmails.length > 0 ? ccEmails.join(', ') : undefined,
            subject: `Invoice #${invoiceNo} — ${invoice.companyName}`,
            html: htmlBody,
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
