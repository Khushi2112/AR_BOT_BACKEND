import * as SibApiV3Sdk from '@getbrevo/brevo';
import dotenv from 'dotenv';
import { getInvoiceEmailTemplate } from './emailTemplates.js';

dotenv.config();

/**
 * Send an automated invoice email using Brevo (HTTP API)
 * @param {Object} invoice - The invoice document
 * @param {Object} config - The CompanyEmail configuration
 * @returns {Promise<Object>} Brevo response
 */
export const sendInvoiceEmail = async (invoice, config) => {
    console.log(`[EMAIL] Using Brevo API for: ${invoice.companyName}`);

    // 1. Clean and validate recipients
    const toRecipients = (config.toEmails || []).filter(email => email && email.trim() !== '');
    const ccRecipients = (config.ccEmails || []).filter(email => email && email.trim() !== '');

    if (toRecipients.length === 0) {
        throw new Error(`No "To" email addresses configured for ${invoice.companyName}.`);
    }

    try {
        // 2. Setup Brevo Client
        const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
        apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

        const htmlContent = getInvoiceEmailTemplate(invoice, config);
        const invoiceNo = invoice.invoiceNumber || invoice.invoice_number || 'N/A';

        // 3. Prepare Email Request
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.subject = `Invoice Announcement #${invoiceNo} - ${invoice.companyName}`;
        sendSmtpEmail.htmlContent = htmlContent;
        sendSmtpEmail.sender = { name: "AR_EMAIL", email: "solankinihal111@gmail.com" };
        sendSmtpEmail.to = toRecipients.map(email => ({ email }));

        if (ccRecipients.length > 0) {
            sendSmtpEmail.cc = ccRecipients.map(email => ({ email }));
        }

        sendSmtpEmail.replyTo = { email: "solankinihal111@gmail.com" };

        // 4. Send via HTTP (Bypasses Render SMTP blocks)
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('[EMAIL] Success! Message ID:', data.body.messageId);
        return data;

    } catch (error) {
        console.error('[EMAIL] Brevo API Error:', error.response ? error.response.body : error.message);
        throw new Error(`Email delivery failed (Brevo): ${error.message}`);
    }
};
