import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import dns from 'dns';
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

    // 2. Setup transporter (Hardened IPv4 forcing)
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        connectionTimeout: 40000,
        greetingTimeout: 40000,
        socketTimeout: 60000,
        // FORCE IPv4 ONLY to fix ENETUNREACH on restricted server networks
        lookup: (hostname, options, callback) => {
            dns.lookup(hostname, { family: 4 }, callback);
        }
    });

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

        console.log(`[EMAIL] Attempting IPv4 send to: ${mailOptions.to}`);

        // 4. Send
        const info = await transporter.sendMail(mailOptions);
        console.log('[EMAIL] Success! Message ID:', info.messageId);
        return info;
    } catch (error) {
        console.error('[EMAIL] Delivery Error:', error);

        if (error.code === 'ENETUNREACH' || error.message.includes('ENETUNREACH')) {
            throw new Error('Network Routing Error: The server could not reach Gmail. Please ensure IPv4 routing is enabled.');
        }

        if (error.code === 'EAUTH') {
            throw new Error('Gmail authentication failed. Please check your App Password.');
        }

        throw new Error(`Email delivery failed: ${error.message}`);
    }
};
