
import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: { type: String, required: true, unique: true },
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

// Performance Indexes
invoiceSchema.index({ companyName: 1 });
invoiceSchema.index({ invoiceDate: -1 });
invoiceSchema.index({ paymentStatus: 1 });
invoiceSchema.index({ createdAt: -1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
