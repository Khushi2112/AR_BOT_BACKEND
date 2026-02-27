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
    console.log(`[EMAIL] Preparing to send email for: ${invoice.companyName}`);
    console.log(`[EMAIL] Raw config from DB:`, {
        to: config.toEmails,
        cc: config.ccEmails
    });

    const toRecipients = (config.toEmails || []).filter(email => email && email.trim() !== '');
    const ccRecipients = (config.ccEmails || []).filter(email => email && email.trim() !== '');

    console.log(`[EMAIL] Processed recipients:`, {
        to: toRecipients,
        cc: ccRecipients
    });

    if (toRecipients.length === 0) {
        throw new Error(`No valid "To" email addresses found for ${invoice.companyName}. Please check your configuration.`);
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const htmlContent = getInvoiceEmailTemplate(invoice, config);
    const invoiceNo = invoice.invoiceNumber || invoice.invoice_number || 'N/A';

    const mailOptions = {
        from: `"Accounts Receivable" <${process.env.EMAIL_USER}>`,
        to: toRecipients.join(', '),
        cc: ccRecipients.length > 0 ? ccRecipients.join(', ') : undefined,
        subject: `Invoice Statement #${invoiceNo} - ${invoice.companyName}`,
        html: htmlContent
    };

    console.log(`[EMAIL] SMTP Mail Options:`, {
        from: mailOptions.from,
        to: mailOptions.to,
        cc: mailOptions.cc,
        subject: mailOptions.subject
    });

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('[EMAIL] SMTP Success info:', info);
        return info;
    } catch (error) {
        console.error('[EMAIL] SMTP Error:', error);
        throw new Error(`Failed to send email to ${toRecipients.join(', ')}. ${error.message}`);
    }
};
