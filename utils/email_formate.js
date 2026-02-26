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

        return `
            <tr>
                <td style="padding: 16px 0; border-bottom: 1px solid #f1f5f9;">
                    <div style="font-weight: 700; color: #1e293b; font-size: 14px;">${invNo}</div>
                    <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Issued on ${invoice.invoiceDate || '-'}</div>
                </td>
                <td style="padding: 16px 0; border-bottom: 1px solid #f1f5f9; text-align: center;">
                    <div style="display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; background-color: ${label.includes('Overdue') ? '#fff1f2' : '#f0fdf4'}; color: ${label.includes('Overdue') ? '#e11d48' : '#16a34a'};">
                        ${label}
                    </div>
                </td>
                <td style="padding: 16px 0; border-bottom: 1px solid #f1f5f9; text-align: right;">
                    <div style="font-weight: 800; color: #0f172a; font-size: 15px;">₹${fmt(invoice.balance_due)}</div>
                    <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">Total: ₹${fmt(invoice.total_Amount)}</div>
                </td>
            </tr>
        `;
    }).join('');

    const totalBalance = invoiceList.reduce((acc, inv) => acc + parseFloat(inv.balance_due || 0), 0);

    return `
    <div style="background-color: #f8fafc; padding: 60px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 32px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);">
            
            <!-- Branding Header -->
            <div style="padding: 48px 40px 0; text-align: center;">
                <div style="width: 64px; height: 64px; background-color: #1e293b; border-radius: 20px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                    <img src="cid:logo1" alt="Logo" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.9;">
                </div>
                <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: #0f172a; letter-spacing: -0.03em;">Payment Statement</h1>
                <p style="margin: 8px 0 0; color: #64748b; font-size: 15px; font-weight: 500;">TecnoPrism Solutions Private Limited</p>
            </div>

            <!-- Body Content -->
            <div style="padding: 40px;">
                <div style="background-color: #f8fafc; border-radius: 24px; padding: 32px; text-align: center; margin-bottom: 40px;">
                    <p style="margin: 0; font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Total Outstanding Balance</p>
                    <h2 style="margin: 8px 0 0; font-size: 44px; font-weight: 900; color: #2563eb; letter-spacing: -0.04em;">₹${fmt(totalBalance)}</h2>
                    <div style="margin-top: 24px; display: inline-flex; align-items: center; gap: 8px; background-color: #ffffff; padding: 8px 16px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #1e293b;">
                         ${invoiceList.length} Active Invoice${invoiceList.length > 1 ? 's' : ''}
                    </div>
                </div>

                <p style="margin: 0 0 24px; font-size: 16px; color: #334155; line-height: 1.6;">
                    Hello <strong>Team</strong>,<br/>
                    We hope you're having a great week. This is a gentle reminder that there is an outstanding balance on your account.
                </p>

                <div style="margin-bottom: 40px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr>
                                <th style="text-align: left; padding-bottom: 12px; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #f1f5f9;">Invoice details</th>
                                <th style="text-align: center; padding-bottom: 12px; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #f1f5f9;">Status</th>
                                <th style="text-align: right; padding-bottom: 12px; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #f1f5f9;">Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                </div>

                <div style="background-color: #eff6ff; border-radius: 20px; padding: 24px;">
                    <h4 style="margin: 0; font-size: 14px; font-weight: 800; color: #1e40af; text-transform: uppercase; letter-spacing: 0.05em;">Payment Information</h4>
                    <p style="margin: 8px 0 0; font-size: 13px; color: #3b82f6; line-height: 1.6; font-weight: 500;">
                        Please arrange for the settlement at your earliest convenience. You can pay via Bank Transfer using the details provided in the attached invoices.
                    </p>
                </div>
            </div>

            <!-- Footer -->
            <div style="padding: 40px; background-color: #f8fafc; border-top: 1px solid #f1f5f9;">
                <div style="margin-bottom: 32px;">
                    <p style="margin: 0; font-size: 14px; font-weight: 700; color: #0f172a;">Best Regards,</p>
                    <p style="margin: 4px 0 0; font-size: 13px; color: #64748b; font-weight: 500;">Accounts Receivable Management</p>
                </div>
                
                <div style="display: flex; align-items: flex-start; gap: 16px;">
                    <div style="flex: 1;">
                        <p style="margin: 0; font-size: 12px; font-weight: 600; color: #1e293b;">${senderName || 'Finance Support'}</p>
                        <p style="margin: 2px 0; font-size: 11px; color: #94a3b8;">
                            Email: <a href="mailto:${fromEmail || 'finance@tecnoprism.com'}" style="color: #2563eb; text-decoration: none; font-weight: 600;">${fromEmail || 'finance@tecnoprism.com'}</a>
                        </p>
                        <p style="margin: 0; font-size: 11px; color: #94a3b8;">Phone: ${senderPhone || '+91 97126 36570'}</p>
                    </div>
                </div>

                <div style="margin-top: 32px; pt: 32px; border-top: 1px solid #e2e8f0; text-align: center;">
                    <p style="margin: 24px 0 0; font-size: 10px; font-weight: 800; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.2em;">
                        &copy; 2026 FINANCEPORTAL • AUTOMATED SYSTEM
                    </p>
                </div>
            </div>
        </div>
    </div>
    `;
};
