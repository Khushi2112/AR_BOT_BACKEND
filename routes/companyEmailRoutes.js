import express from 'express';
import CompanyEmail from '../models/CompanyEmail.js';
import Invoice from '../models/Invoice.js';

const router = express.Router();

// GET all companies (Configurations + unique ones from Invoices)
router.get('/', async (req, res) => {
    try {
        // 1. Get all saved configurations
        const allConfigs = await CompanyEmail.find().sort({ companyName: 1 });

        // 2. Get all unique company names from Invoices
        const invoiceCompanies = await Invoice.distinct('companyName');

        // 3. Create a Map of existing configs for easy lookup
        const configMap = new Map();
        allConfigs.forEach(c => {
            configMap.set(c.companyName.trim().toLowerCase(), c);
        });

        // 4. Combine both lists
        const combinedResults = [];

        // First add all saved configurations
        allConfigs.forEach(c => {
            combinedResults.push({
                companyName: c.companyName,
                config: c
            });
        });

        // Then add companies from invoices that DON'T have a config yet
        const garbageValues = ['bill to', 'customer', 'n/a', 'unknown', 'name', 'test', null, undefined];
        invoiceCompanies.forEach(name => {
            if (!name) return;
            const trimmedName = name.trim();
            const lowerName = trimmedName.toLowerCase();

            if (garbageValues.includes(lowerName)) return;

            if (!configMap.has(lowerName)) {
                combinedResults.push({
                    companyName: trimmedName,
                    config: null
                });
                // Add to map to prevent duplicates if multiple variations exist in invoices
                configMap.set(lowerName, null);
            }
        });

        // Sort by name
        combinedResults.sort((a, b) => a.companyName.localeCompare(b.companyName));

        res.json(combinedResults);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET unconfigured company names from invoices
router.get('/unconfigured', async (req, res) => {
    try {
        // Get all unique company names from Invoices
        const invoiceCompanies = await Invoice.distinct('companyName');

        // Get all configured company names (trimmed and lowercased for comparison)
        const configurations = await CompanyEmail.find({}, { companyName: 1 });
        const configuredNamesSet = new Set(configurations.map(c => c.companyName.trim().toLowerCase()));

        // Clean and filter invoice company names
        const unconfigured = Array.from(new Set(invoiceCompanies
            .map(name => name ? name.trim() : null)
            .filter(name => {
                if (!name) return false;

                // Filter out obvious garbage values from old data
                const lowerName = name.toLowerCase();
                const garbageValues = ['bill to', 'customer', 'n/a', 'unknown', 'name', 'test'];
                if (garbageValues.includes(lowerName)) return false;

                // Filter out those already configured (case-insensitive)
                return !configuredNamesSet.has(lowerName);
            })
        )).sort();

        res.json(unconfigured);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST new configuration
router.post('/', async (req, res) => {
    try {
        const { companyName, toEmails, ccEmails } = req.body;

        // Check if already exists
        const existing = await CompanyEmail.findOne({ companyName });
        if (existing) {
            return res.status(400).json({ message: 'Company already configured' });
        }

        const config = new CompanyEmail({
            companyName,
            toEmails: toEmails || [],
            ccEmails: ccEmails || []
        });

        const newConfig = await config.save();
        res.status(201).json(newConfig);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PUT update configuration
router.put('/:id', async (req, res) => {
    try {
        const { toEmails, ccEmails } = req.body;

        const updatedConfig = await CompanyEmail.findByIdAndUpdate(
            req.params.id,
            { toEmails, ccEmails },
            { new: true, runValidators: true }
        );

        if (!updatedConfig) {
            return res.status(404).json({ message: 'Configuration not found' });
        }

        res.json(updatedConfig);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE configuration
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await CompanyEmail.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: 'Configuration not found' });
        }
        res.json({ message: 'Configuration deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
