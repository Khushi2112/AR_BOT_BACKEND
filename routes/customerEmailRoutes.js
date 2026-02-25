import CustomerEmail from '../models/CustomerEmail.js';
import Invoice from '../models/Invoice.js';

const router = express.Router();

// GET all customer emails (with auto-sync from Invoices)
router.get('/', async (req, res) => {
    try {
        // 1. Get all unique company names from Invoices
        const uniqueCompanies = await Invoice.distinct('companyName');

        // 2. Ensure each exists in CustomerEmail collection
        const existingCompanies = await CustomerEmail.find({
            companyName: { $in: uniqueCompanies }
        });

        const existingNames = new Set(existingCompanies.map(c => c.companyName));
        const missingNames = uniqueCompanies.filter(name => name && !existingNames.has(name));

        if (missingNames.length > 0) {
            const newEntries = missingNames.map(name => ({
                companyName: name,
                toEmails: [],
                ccEmails: []
            }));
            await CustomerEmail.insertMany(newEntries, { ordered: false });
        }

        // 3. Return all customer emails
        const customers = await CustomerEmail.find().sort({ companyName: 1 });
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET a single customer email by ID
router.get('/:id', async (req, res) => {
    try {
        const customer = await CustomerEmail.findById(req.params.id);
        if (!customer) return res.status(404).json({ message: 'Company not found' });
        res.json(customer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST a new customer email (manual add)
router.post('/', async (req, res) => {
    try {
        const customer = new CustomerEmail(req.body);
        const newCustomer = await customer.save();
        res.status(201).json(newCustomer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PUT update a customer email
router.put('/:id', async (req, res) => {
    try {
        const { toEmails, ccEmails } = req.body;

        if (toEmails && toEmails.length > 4) {
            return res.status(400).json({ message: 'Maximum of 4 TO email addresses are allowed.' });
        }
        if (ccEmails && ccEmails.length > 8) {
            return res.status(400).json({ message: 'Maximum of 8 CC email addresses are allowed.' });
        }

        const updated = await CustomerEmail.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!updated) return res.status(404).json({ message: 'Company not found' });
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE a customer email
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await CustomerEmail.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Company not found' });
        res.json({ message: 'Company deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
