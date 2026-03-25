import dotenv from 'dotenv';
import { getInvoiceEmailTemplate } from './emailTemplates.js';

dotenv.config();

/**
 * Send an automated invoice email using Brevo (Direct HTTP API)
 * Uses dual-header authentication to support both old and new Brevo keys.
 * @param {Object} invoice - The invoice document
 * @param {Object} config - The CompanyEmail configuration
 * @returns {Promise<Object>} API response
 */
export const sendInvoiceEmail = async (invoice, config, type = 'due') => {
    console.log(`[EMAIL] Executing Brevo delivery for: ${invoice.companyName} (${type})`);

    // 1. Clean and validate recipients
    const toRecipients = (config.toEmails || []).filter(email => email && email.trim() !== '');
    const ccRecipients = (config.ccEmails || []).filter(email => email && email.trim() !== '');

    if (toRecipients.length === 0) {
        throw new Error(`No "To" email addresses configured for ${invoice.companyName}.`);
    }

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
        throw new Error('BREVO_API_KEY is missing. Please add it to your .env or Render settings.');
    }

    try {
        const htmlContent = getInvoiceEmailTemplate(invoice, config, type);
        const invoiceNo = invoice.invoiceNumber || invoice.invoice_number || 'N/A';

        // Dynamic Subject based on type
        let subject = `Invoice Announcement #${invoiceNo} - ${invoice.companyName}`;
        if (type === 'overdue') {
            subject = `IMPORTANT: Overdue Invoice Notification #${invoiceNo} - ${invoice.companyName}`;
        } else if (type === 'paid') {
            subject = `Payment Received - Thank You! (Invoice #${invoiceNo})`;
        }

        // 2. Prepare Payload
        const payload = {
            sender: { name: "Tecnoprism", email: "solankinihal111@gmail.com" },
            to: toRecipients.map(email => ({ email })),
            subject: subject,
            htmlContent: htmlContent,
            replyTo: { email: "solankinihal111@gmail.com" }
        };

        if (ccRecipients.length > 0) {
            payload.cc = ccRecipients.map(email => ({ email }));
        }

        // 3. Send via Native Fetch (Node 18+)
        // We use both 'api-key' and 'x-sib-api-key' for maximum compatibility with old/new keys
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey.trim(),
                'x-sib-api-key': apiKey.trim(), // Legacy support
                'content-type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            // Check if it's an authorization error
            if (response.status === 401 || response.status === 403) {
                throw new Error(`Invalid API Key. Brevo says: ${data.message || 'Access Denied'}. Make sure you are using the v3 API key, not the SMTP password.`);
            }
            throw new Error(data.message || `Brevo Error: ${response.status}`);
        }

        console.log('[EMAIL] Success! Message ID:', data.messageId);
        return data;

    } catch (error) {
        console.error('[EMAIL] Brevo Error Detail:', error.message);
        throw new Error(error.message);
    }
};

