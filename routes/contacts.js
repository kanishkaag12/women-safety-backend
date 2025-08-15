const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Get all emergency contacts for a user
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('emergencyContacts');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user.emergencyContacts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add a new emergency contact
router.post('/', auth, async (req, res) => {
    try {
        const { name, phoneNumber, relationship } = req.body;
        
        if (!name || !phoneNumber) {
            return res.status(400).json({ message: 'Name and phone number are required' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.emergencyContacts.push({ name, phoneNumber, relationship });
        await user.save();

        res.status(201).json(user.emergencyContacts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update an emergency contact
router.put('/:contactId', auth, async (req, res) => {
    try {
        const { name, phoneNumber, relationship } = req.body;
        const contactId = req.params.contactId;
        
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const contactIndex = user.emergencyContacts.findIndex(contact => 
            contact._id.toString() === contactId
        );

        if (contactIndex === -1) {
            return res.status(404).json({ message: 'Contact not found' });
        }

        if (name) user.emergencyContacts[contactIndex].name = name;
        if (phoneNumber) user.emergencyContacts[contactIndex].phoneNumber = phoneNumber;
        if (relationship) user.emergencyContacts[contactIndex].relationship = relationship;

        await user.save();
        res.json(user.emergencyContacts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete an emergency contact
router.delete('/:contactId', auth, async (req, res) => {
    try {
        const contactId = req.params.contactId;
        
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const contactIndex = user.emergencyContacts.findIndex(contact => 
            contact._id.toString() === contactId
        );

        if (contactIndex === -1) {
            return res.status(404).json({ message: 'Contact not found' });
        }

        user.emergencyContacts.splice(contactIndex, 1);
        await user.save();

        res.json({ message: 'Contact removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;