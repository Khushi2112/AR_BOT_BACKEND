import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { getInvoiceEmailTemplate } from './emailTemplates.js';

dotenv.config();

/**
 * Send an automated invoice email using Gmail SMTP
 * @param {Object} invoice - The invoice document
 * @param {Object} config - The CompanyEmail configuration
 * @returns {Promise<Object>} Nodemailer response
 */
export const sendInvoiceEmail = async (invoice, config) => {
    console.log(`[EMAIL] Starting delivery for: ${invoice.companyName}`);

    // 1. Clean and validate recipients
    const toRecipients = (config.toEmails || []).filter(email => email && email.trim() !== '');
    const ccRecipients = (config.ccEmails || []).filter(email => email && email.trim() !== '');

    if (toRecipients.length === 0) {
        throw new Error(`No "To" email addresses configured for ${invoice.companyName}.`);
    }

    // 2. Setup transporter (Hardened with timeouts and IPv4 forcing)
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        family: 4,                  // Force IPv4
        connectionTimeout: 20000,   // 20s
        greetingTimeout: 20000,     // 20s
        socketTimeout: 30000,       // 30s
        debug: true,                // Detailed logs in console
        logger: true                // Log internal SMTP traffic
    });

    // We removed the pooling/service:gmail for maximum reliability on live servers

    try {
        // 3. Generate content with safety
        const htmlContent = getInvoiceEmailTemplate(invoice, config);
        const invoiceNo = invoice.invoiceNumber || invoice.invoice_number || 'N/A';

        const mailOptions = {
            from: `"Accounts Receivable Team" <${process.env.EMAIL_USER}>`,
            to: toRecipients.join(', '),
            cc: ccRecipients.length > 0 ? ccRecipients.join(', ') : undefined,
            subject: `Invoice Announcement #${invoiceNo} - ${invoice.companyName}`,
            html: htmlContent,
            replyTo: process.env.EMAIL_USER
        };

        console.log(`[EMAIL] Sending to: ${mailOptions.to} (CC: ${mailOptions.cc || 'None'})`);

        // 4. Send
        const info = await transporter.sendMail(mailOptions);
        console.log('[EMAIL] Success! Message ID:', info.messageId);
        return info;
    } catch (error) {
        console.error('[EMAIL] Detailed Error:', error);
        // Throw a cleaner message to the frontend
        if (error.code === 'EAUTH') {
            throw new Error('Gmail authentication failed. Please check your App Password.');
        }
        throw new Error(`Email delivery failed: ${error.message}`);
    }
};
