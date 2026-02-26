import express from 'express';
import Invoice from '../models/Invoice.js';


const router = express.Router();


// GET all invoices (with pagination, search, and filter)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const status = req.query.status || 'All';

        // Build query
        let query = {};

        if (search) {
            query.$or = [
                { invoiceNumber: { $regex: search, $options: 'i' } },
                { companyName: { $regex: search, $options: 'i' } }
            ];
        }

        if (status !== 'All') {
            query.paymentStatus = status;
        }

        const invoices = await Invoice.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Invoice.countDocuments(query);

        res.json({
            invoices,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET financial statistics (Optimized)
router.get('/stats', async (req, res) => {
    try {
        const stats = await Invoice.aggregate([
            {
                $group: {
                    _id: null,
                    totalInvoices: { $sum: 1 },
                    totalAmount: { $sum: "$total_Amount" },
                    balanceDue: { $sum: "$balance_due" },
                    paidCount: {
                        $sum: { $cond: [{ $lte: ["$balance_due", 0] }, 1, 0] }
                    },
                    pendingCount: {
                        $sum: { $cond: [{ $gt: ["$balance_due", 0] }, 1, 0] }
                    }
                }
            }
        ]);

        // Calculate Overdue (Simplified for now - can be refined with date logic)
        const todayStr = new Date().toISOString().split('T')[0];
        const overdue = await Invoice.aggregate([
            {
                $match: {
                    balance_due: { $gt: 0 },
                    dueDate: { $lt: todayStr }
                }
            },
            {
                $group: {
                    _id: null,
                    amount: { $sum: "$balance_due" },
                    count: { $sum: 1 }
                }
            }
        ]);

        const result = stats[0] || { totalInvoices: 0, totalAmount: 0, balanceDue: 0, paidCount: 0, pendingCount: 0 };
        const overdueResult = overdue[0] || { amount: 0, count: 0 };

        res.json({
            ...result,
            overdueAmount: overdueResult.amount,
            overdueCount: overdueResult.count,
            paidAmount: result.totalAmount - result.balanceDue
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET latest invoice
router.get('/latest', async (req, res) => {
    try {
        const latestInvoice = await Invoice.findOne().sort({ createdAt: -1 });
        res.json(latestInvoice);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET single invoice
router.get('/:id', async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (invoice) {
            res.json(invoice);
        } else {
            res.status(404).json({ message: 'Invoice not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST new invoice
router.post('/', async (req, res) => {
    try {
        const invoice = new Invoice(req.body);
        const newInvoice = await invoice.save();

        res.status(201).json(newInvoice);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PUT update invoice
router.put('/:id', async (req, res) => {
    try {
        const updatedInvoice = await Invoice.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json(updatedInvoice);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE invoice
router.delete('/:id', async (req, res) => {
    try {
        await Invoice.findByIdAndDelete(req.params.id);



        res.json({ message: 'Invoice deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
