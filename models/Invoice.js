import mongoose from 'mongoose';
import CompanyEmail from './CompanyEmail.js';

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: { type: String, required: true, unique: true },
    invoice_number: { type: String }, // Legacy/Sync support
    invoiceDate: { type: String, required: true },
    dueDate: { type: String, required: true },
    Terms: { type: String, required: true },
    companyName: { type: String },
    State: { type: String },
    total_Amount: { type: Number },
    balance_due: { type: Number, default: 0 },
    description: { type: String },
    quantity: { type: Number, default: 1 },
    total_price: { type: Number },
    subtotal: { type: Number },
    GST: { type: Number, default: 18 },
    GST_Amount: { type: Number, default: 0 },
    paymentStatus: {
        type: String,
        enum: ['Due', 'Paid', 'PartiallyPaid', 'Overdue'],
        default: 'Due'
    }
}, { timestamps: true });

// --- Automatic Company Discovery Middleware ---

const ensureCompanyExists = async (companyName) => {
    if (!companyName) return;
    const trimmed = companyName.trim();
    const garbage = ['bill to', 'customer', 'n/a', 'unknown', 'name', 'test', 'bill to:', 'ship to', 'ship to:'];
    if (garbage.includes(trimmed.toLowerCase())) return;

    try {
        // Use case-insensitive find
        const doc = await CompanyEmail.findOne({
            companyName: { $regex: new RegExp(`^${trimmed}$`, 'i') }
        });

        if (!doc) {
            console.log(`[MIDDLEWARE] New company discovered: ${trimmed}`);
            await CompanyEmail.create({ companyName: trimmed, toEmails: [], ccEmails: [] });
        }
    } catch (err) {
        console.error('[MIDDLEWARE ERROR]:', err);
    }
};

invoiceSchema.post('save', async function (doc) {
    await ensureCompanyExists(doc.companyName);
});

invoiceSchema.post('insertMany', async function (docs) {
    for (const doc of docs) {
        await ensureCompanyExists(doc.companyName);
    }
});

// Performance Indexes
invoiceSchema.index({ companyName: 1 });
invoiceSchema.index({ invoiceDate: -1 });
invoiceSchema.index({ paymentStatus: 1 });
invoiceSchema.index({ createdAt: -1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
