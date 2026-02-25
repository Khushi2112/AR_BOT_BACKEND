/**
 * Email Template for Invoice Notifications
 * Matches the high-fidelity design with 12 table columns and professional signature.
 * Now supports multiple invoice rows.
 */
export const getInvoiceEmailTemplate = (invoices, { senderName, fromEmail, senderPhone, diffLabel, invoiceNo }) => {
    // Helper to format currency
    const fmt = (v) => `${parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

    // Fallback if single invoice passed
    const invoiceList = Array.isArray(invoices) ? invoices : [invoices];

    // Helper to parse dates for per-row Today calculation if needed
    const parseDate = (d) => {
        if (!d) return null;
        const parts = d.split('-');
        if (parts.length === 3) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        return new Date(d);
    };

    const rows = invoiceList.map(invoice => {
        // Calculate per-row label if not provided in batch
        let label = diffLabel;
        if (!label) {
            const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
            const due = parseDate(invoice.dueDate);
            if (due) {
                due.setHours(0, 0, 0, 0);
                const diffTime = due.getTime() - todayDate.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                label = diffDays < 0 ? Math.abs(diffDays) : diffDays;
            } else {
                label = '-';
            }
        }

        const invNo = invoice.invoiceNumber || invoice.invoice_number || invoiceNo || '-';

        return `
            <tr style="text-align: center; background-color: #ffffff;">
                <td style="border: 1px solid #999; padding: 8px;">${invoice.invoiceDate || '-'}</td>
                <td style="border: 1px solid #999; padding: 8px;">${invoice.dueDate || '-'}</td>
                <td style="border: 1px solid #999; padding: 8px;">${invoice.Terms || '-'}</td>
                <td style="border: 1px solid #999; padding: 8px;">${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-')}</td>
                <td style="border: 1px solid #999; padding: 8px;">${label}</td>
                <td style="border: 1px solid #999; padding: 8px;">${invNo}</td>
                <td style="border: 1px solid #999; padding: 8px; color: #ff0000; font-weight: bold;">${invoice.companyName}</td>
                <td style="border: 1px solid #999; padding: 8px;">${invoice.paymentStatus || 'Due'}</td>
                <td style="border: 1px solid #999; padding: 8px;">-</td>
                <td style="border: 1px solid #999; padding: 8px;">${fmt(invoice.subtotal)}</td>
                <td style="border: 1px solid #999; padding: 8px;">${fmt(invoice.GST_Amount)}</td>
                <td style="border: 1px solid #999; padding: 8px;">${fmt(invoice.total_Amount)}</td>
                <td style="border: 1px solid #999; padding: 8px; font-weight: bold; background-color: #fffff0;">${fmt(invoice.balance_due)}</td>
            </tr>
        `;
    }).join('');

    return `
    <div style="font-family: Arial, sans-serif; color: #000; font-size: 14px; line-height: 1.6;">
        <p>Hello Team,</p>
        <br/>
        <p>The Invoice’s given below will be due on the due date’s mentioned in the table below. We request you to arrange for its payment on its due date.</p>
        <br/>

        <table style="width: 100%; border-collapse: collapse; border: 1px solid #999; font-size: 10px;">
            <tr style="background-color: #bfbfbf; font-weight: bold; text-align: center;">
                <th style="border: 1px solid #999; padding: 6px;">Invoice Date</th>
                <th style="border: 1px solid #999; padding: 6px;">Due Date</th>
                <th style="border: 1px solid #999; padding: 6px;">Payment Term</th>
                <th style="border: 1px solid #999; padding: 6px;">Today</th>
                <th style="border: 1px solid #999; padding: 6px;">OverDue By / Due Within</th>
                <th style="border: 1px solid #999; padding: 6px;">Invoice No.</th>
                <th style="border: 1px solid #999; padding: 6px;">Customer Name</th>
                <th style="border: 1px solid #999; padding: 6px;">Status</th>
                <th style="border: 1px solid #999; padding: 6px;">USD</th>
                <th style="border: 1px solid #999; padding: 6px;">Gross INR</th>
                <th style="border: 1px solid #999; padding: 6px;">GST</th>
                <th style="border: 1px solid #999; padding: 6px;">Total</th>
                <th style="border: 1px solid #999; padding: 6px; background-color: #ffd700;">Balance Due</th>
            </tr>
            ${rows}
        </table>

        <br/>
        <p>Best Regards,</p>
        <br/>
        <p style="font-weight: bold; margin-bottom: 20px;">Accounts Receivable Team</p>
        
        <div style="margin-top: 20px;">
            <img src="cid:logo1" alt="TecnoPrism" style="height: 60px; margin-right: 15px; vertical-align: middle;">
            <img src="cid:logo2" alt="Partner" style="height: 60px; vertical-align: middle;">
        </div>

        <p style="margin-top: 15px; font-style: italic;">
            <span style="font-weight: bold;">Mobile.</span> ${senderPhone || '+919712636570'} <span style="font-weight: bold; margin-left: 10px;">Email.</span> <a href="mailto:${fromEmail || 'finance@tecnoprism.com'}" style="color: #007bff; text-decoration: underline;">${fromEmail || 'finance@tecnoprism.com'}</a>
        </p>
        <p style="margin-top: 5px;">
            <a href="http://www.tecnoprism.com" style="color: #007bff; text-decoration: underline; font-weight: bold;">www.tecnoprism.com</a>
        </p>
    </div>
    `;
};
