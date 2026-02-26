export const getInvoiceEmailTemplate = (invoices, { senderName, fromEmail, senderPhone, diffLabel, invoiceNo }) => {
    const fmt = (v) => `${parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    const invoiceList = Array.isArray(invoices) ? invoices : [invoices];

    const parseDate = (d) => {
        if (!d) return null;
        const parts = d.split('-');
        if (parts.length === 3) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        return new Date(d);
    };

    const rows = invoiceList.map((invoice, idx) => {
        let label = diffLabel;
        if (!label) {
            const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
            const due = parseDate(invoice.dueDate);
            if (due) {
                due.setHours(0, 0, 0, 0);
                const diffTime = due.getTime() - todayDate.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                label = diffDays < 0 ? `${Math.abs(diffDays)}d Overdue` : `${diffDays}d Due`;
            } else {
                label = '-';
            }
        }

        const invNo = invoice.invoiceNumber || invoice.invoice_number || invoiceNo || '-';
        const bgColor = idx % 2 === 0 ? '#ffffff' : '#f8fafc';

        return `
            <tr style="background-color: ${bgColor};">
                <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 11px;">${invoice.invoiceDate || '-'}</td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #1e293b;">${invNo}</td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0;">
                    <div style="font-weight: bold; color: #0f172a;">${invoice.companyName}</div>
                    <div style="font-size: 10px; color: #64748b;">${invoice.paymentStatus || 'Active'}</div>
                </td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; text-align: center;">
                    <span style="display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: bold; background-color: ${label.includes('Overdue') ? '#fef2f2' : '#f0f9ff'}; color: ${label.includes('Overdue') ? '#b91c1c' : '#0369a1'};">
                        ${label}
                    </span>
                </td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 500;">₹${fmt(invoice.total_Amount)}</td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; text-align: right;">
                    <span style="font-weight: 800; color: #2563eb; font-size: 14px;">₹${fmt(invoice.balance_due)}</span>
                </td>
            </tr>
        `;
    }).join('');

    const totalBalance = invoiceList.reduce((acc, inv) => acc + parseFloat(inv.balance_due || 0), 0);

    return `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; max-width: 800px; margin: 0 auto; line-height: 1.6; background-color: #ffffff;">
        <div style="padding: 40px 20px; text-align: center; background-color: #f1f5f9; border-radius: 16px 16px 0 0;">
            <h1 style="margin: 0; color: #0f172a; font-size: 24px; letter-spacing: -0.02em;">Payment Reminder</h1>
            <p style="margin: 10px 0 0; color: #64748b;">Statement for Outstanding Invoices</p>
        </div>

        <div style="padding: 30px;">
            <p style="font-size: 16px;">Hello Team,</p>
            <p style="color: #475569;">This is a friendly reminder regarding the balance on your account. According to our records, the following invoices are due for payment. Please arrange for settlement at your earliest convenience.</p>
            
            <div style="margin: 30px 0; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <thead>
                        <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                            <th style="padding: 15px; text-align: left; font-weight: bold; color: #475569; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em;">Date</th>
                            <th style="padding: 15px; text-align: left; font-weight: bold; color: #475569; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em;">Invoice #</th>
                            <th style="padding: 15px; text-align: left; font-weight: bold; color: #475569; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em;">Customer</th>
                            <th style="padding: 15px; text-align: center; font-weight: bold; color: #475569; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em;">Timeline</th>
                            <th style="padding: 15px; text-align: right; font-weight: bold; color: #475569; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em;">Total</th>
                            <th style="padding: 15px; text-align: right; font-weight: bold; color: #475569; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em;">Balance Due</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                    <tfoot>
                        <tr style="background-color: #f8fafc;">
                            <td colspan="5" style="padding: 20px; text-align: right; font-weight: bold; color: #64748b; font-size: 12px; text-transform: uppercase;">Total Outstanding Amount</td>
                            <td style="padding: 20px; text-align: right; font-weight: 800; color: #2563eb; font-size: 18px; border-left: 1px solid #e2e8f0;">₹${fmt(totalBalance)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; border-radius: 8px; margin-bottom: 40px;">
                <p style="margin: 0; color: #0369a1; font-weight: 600; font-size: 14px;">Next Step</p>
                <p style="margin: 5px 0 0; color: #0c4a6e; font-size: 13px;">Payments can be made via Bank Transfer or online portal. Please ignore this message if you have already initiated the payment.</p>
            </div>

            <div style="border-top: 1px solid #e2e8f0; padding-top: 30px;">
                <p style="margin: 0; font-weight: bold; color: #0f172a;">Best Regards,</p>
                <p style="margin: 5px 0 20px; color: #64748b; font-size: 13px;">Accounts Receivable Team</p>
                
                <table style="width: 100%;">
                    <tr>
                        <td style="width: 140px;">
                            <img src="cid:logo1" alt="Logo" style="height: 45px; display: block; filter: grayscale(100%); opacity: 0.8;">
                        </td>
                        <td style="padding-left: 20px; border-left: 1px solid #e2e8f0;">
                            <p style="margin: 0; font-weight: bold; font-size: 14px; color: #0f172a;">TecnoPrism Solutions</p>
                            <p style="margin: 5px 0; color: #64748b; font-size: 12px;">
                                <strong>Phone:</strong> ${senderPhone || '+91 97126 36570'} | <strong>Email:</strong> <a href="mailto:${fromEmail || 'finance@tecnoprism.com'}" style="color: #2563eb; text-decoration: none;">${fromEmail || 'finance@tecnoprism.com'}</a>
                            </p>
                            <a href="https://www.tecnoprism.com" style="color: #64748b; text-decoration: none; font-size: 12px; font-weight: bold;">www.tecnoprism.com</a>
                        </td>
                    </tr>
                </table>
            </div>
        </div>
        
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 0 0 16px 16px; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em;">© 2026 FinancePortal • Automated Billing System</p>
        </div>
    </div>
    `;
};
