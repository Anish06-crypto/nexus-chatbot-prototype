const express = require('express');
const router = express.Router();
const Repair = require('../models/Repair');

// Generate reference number: NEX-YYYY-NNNN
function generateReference() {
    const year = new Date().getFullYear();
    const random = String(Math.floor(Math.random() * 9000) + 1000);
    return `NEX-${year}-${random}`;
}

// POST /api/repairs — submit a new repair
router.post('/', async (req, res) => {
    try {
        const { issue_type, location, urgency, description, photo_uri } = req.body;

        const repair = new Repair({
            reference: generateReference(),
            issue_type,
            location,
            urgency,
            description,
            photo_uri
        });

        const saved = await repair.save();
        res.status(201).json(saved);
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/repairs — fetch all repairs, newest first
router.get('/', async (req, res) => {
    try {
        const repairs = await Repair.find({})
            .sort({ created_at: -1 })
            .limit(50);
        res.json(repairs);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /api/repairs/:id — update repair status
router.patch('/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const updated = await Repair.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );
        if (!updated) return res.status(404).json({ error: 'Repair not found' });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;