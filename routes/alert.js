// women-safety-backend/routes/alerts.js

const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert'); // Import the Alert model

// GET all alerts
router.get('/', async (req, res) => {
    try {
        const alerts = await Alert.find();
        res.json(alerts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST a new alert (to simulate a new detection)
router.post('/', async (req, res) => {
    const alert = new Alert({
        type: req.body.type,
        location: req.body.location
    });

    try {
        const newAlert = await alert.save();
        res.status(201).json(newAlert);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;