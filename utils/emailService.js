import dotenv from 'dotenv';
import { getInvoiceEmailTemplate } from './emailTemplates.js';

dotenv.config();

/**
 * Send an automated invoice email using Brevo (Direct HTTP API)
 * This is 100% reliable and bypasses ESM import errors.
 * @param {Object} invoice - The invoice document
 * @param {Object} config - The CompanyEmail configuration
 * @returns {Promise<Object>} API response
 */
export const sendInvoiceEmail = async (invoice, config) => {
    console.log(`[EMAIL] Using Brevo HTTP for: ${invoice.companyName}`);

    // 1. Clean and validate recipients
    const toRecipients = (config.toEmails || []).filter(email => email && email.trim() !== '');
    const ccRecipients = (config.ccEmails || []).filter(email => email && email.trim() !== '');

    if (toRecipients.length === 0) {
        throw new Error(`No "To" email addresses configured for ${invoice.companyName}.`);
    }

    try {
        const htmlContent = getInvoiceEmailTemplate(invoice, config);
        const invoiceNo = invoice.invoiceNumber || invoice.invoice_number || 'N/A';

        // 2. Prepare Payload
        const payload = {
            sender: { name: "AR_EMAIL", email: "solankinihal111@gmail.com" },
            to: toRecipients.map(email => ({ email })),
            subject: `Invoice Announcement #${invoiceNo} - ${invoice.companyName}`,
            htmlContent: htmlContent,
            replyTo: { email: "solankinihal111@gmail.com" }
        };

        if (ccRecipients.length > 0) {
            payload.cc = ccRecipients.map(email => ({ email }));
        }

        // 3. Send via Native Fetch (Node 18+)
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': process.env.BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `Brevo API returned ${response.status}`);
        }

        console.log('[EMAIL] Success! Message ID:', data.messageId);
        return data;

    } catch (error) {
        console.error('[EMAIL] Brevo HTTP Error:', error.message);
        throw new Error(`Email delivery blocked by Brevo: ${error.message}`);
    }
};
