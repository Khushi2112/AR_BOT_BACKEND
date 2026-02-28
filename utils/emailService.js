import { Resend } from 'resend';
import dotenv from 'dotenv';
import { getInvoiceEmailTemplate } from './emailTemplates.js';

dotenv.config();

// Use Resend for delivery because it works over HTTP (Port 443)
// This is required because Render.com blocks SMTP ports (465/587) on the free tier.
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send an automated invoice email using Resend (HTTP API)
 * @param {Object} invoice - The invoice document
 * @param {Object} config - The CompanyEmail configuration
 * @returns {Promise<Object>} Resend response
 */
export const sendInvoiceEmail = async (invoice, config) => {
    console.log(`[EMAIL] Using Resend API for: ${invoice.companyName}`);

    // 1. Clean and validate recipients
    const toRecipients = (config.toEmails || []).filter(email => email && email.trim() !== '');
    const ccRecipients = (config.ccEmails || []).filter(email => email && email.trim() !== '');

    if (toRecipients.length === 0) {
        throw new Error(`No "To" email addresses configured for ${invoice.companyName}.`);
    }

    try {
        const htmlContent = getInvoiceEmailTemplate(invoice, config);
        const invoiceNo = invoice.invoiceNumber || invoice.invoice_number || 'N/A';

        // 2. Send via Resend HTTP API (No ports blocked)
        const { data, error } = await resend.emails.send({
            from: 'AR_EMAIL <onboarding@resend.dev>', // Name updated to AR_EMAIL
            to: toRecipients,
            cc: ccRecipients.length > 0 ? ccRecipients : undefined,
            subject: `Invoice Announcement #${invoiceNo} - ${invoice.companyName}`,
            html: htmlContent,
            reply_to: process.env.EMAIL_USER // This allows replies to go to the user's Gmail
        });

        if (error) {
            console.error('[EMAIL] Resend Error:', error);
            throw new Error(error.message);
        }

        console.log('[EMAIL] Success! ID:', data.id);
        return data;
    } catch (error) {
        console.error('[EMAIL] Detailed API Error:', error);
        throw new Error(`Email delivery blocked by Render or API: ${error.message}`);
    }
};
