// women-safety-backend/routes/alerts.js

const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const User = require('../models/User');
const jwt = require('jsonwebtoken'); // Added missing import for jwt

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

// GET all alerts (admin and police only)
router.get('/', auth, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        
        if (!['admin', 'police'].includes(currentUser.role)) {
            return res.status(403).json({ message: 'Access denied. Admin and Police only.' });
        }

        const alerts = await Alert.find().populate('userId', 'name email').sort({ createdAt: -1 });
        res.json(alerts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET alerts by user ID
router.get('/user/:userId', auth, async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUser = await User.findById(req.user.id);
        
        // Users can only see their own alerts, admins and police can see all
        if (currentUser.role === 'user' && currentUser.id !== userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const alerts = await Alert.find({ userId }).populate('userId', 'name email');
        res.json(alerts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET alerts by jurisdiction (for police)
router.get('/jurisdiction/:jurisdiction', auth, async (req, res) => {
    try {
        const { jurisdiction } = req.params;
        const currentUser = await User.findById(req.user.id);
        
        if (currentUser.role !== 'police') {
            return res.status(403).json({ message: 'Access denied. Police only.' });
        }

        let query = {};
        if (jurisdiction && jurisdiction !== 'all' && jurisdiction !== 'undefined') {
            query.jurisdiction = jurisdiction;
        }
        // If jurisdiction is 'all' or undefined, show all alerts

        const alerts = await Alert.find(query).populate('userId', 'name email');
        res.json(alerts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET assigned cases for a police officer
router.get('/assigned/:policeOfficerId', auth, async (req, res) => {
    try {
        const { policeOfficerId } = req.params;
        const currentUser = await User.findById(req.user.id);
        
        if (currentUser.role !== 'police') {
            return res.status(403).json({ message: 'Access denied. Police only.' });
        }
        
        // Allow police to view their own assigned cases
        if (currentUser.id.toString() !== policeOfficerId) {
            console.log('User ID mismatch:', currentUser.id, 'vs', policeOfficerId);
            return res.status(403).json({ message: 'Access denied' });
        }

        console.log('Fetching assigned cases for police officer:', policeOfficerId);
        console.log('Current user ID:', currentUser.id);
        
        const alerts = await Alert.find({ 
            assignedPoliceOfficer: policeOfficerId 
        }).populate('userId', 'name email').populate('assignedPoliceOfficer', 'name badgeNumber');
        
        console.log('Found assigned alerts:', alerts.length);
        
        // Also log all alerts to see what's in the database
        const allAlerts = await Alert.find({}).populate('userId', 'name email');
        console.log('All alerts in database:', allAlerts.map(a => ({
            id: a._id,
            status: a.status,
            assignedPoliceOfficer: a.assignedPoliceOfficer,
            userName: a.userName
        })));
        
        res.json(alerts);
    } catch (err) {
        console.error('Error fetching assigned cases:', err);
        res.status(500).json({ message: err.message });
    }
});

// POST a new alert
router.post('/', auth, async (req, res) => {
    try {
        const { userId, userName, location, coordinates, type, priority, status, description, emergencyContacts } = req.body;
        
        const alert = new Alert({
            userId,
            userName,
            location,
            coordinates,
            type: type || 'manual',
            priority: priority || 'medium',
            status: status || 'active',
            description,
            emergencyContacts: emergencyContacts || [],
            createdAt: new Date()
        });

        const newAlert = await alert.save();
        res.status(201).json(newAlert);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT update alert status/assign case
router.put('/:alertId/:action', auth, async (req, res) => {
    try {
        const { alertId, action } = req.params;
        const { assignedPoliceOfficer, policeStation, badgeNumber, jurisdiction } = req.body;
        
        const currentUser = await User.findById(req.user.id);
        if (!['admin', 'police'].includes(currentUser.role)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        let updateData = {};
        
        switch (action) {
            case 'assign':
                updateData = {
                    assignedPoliceOfficer: assignedPoliceOfficer || currentUser.id,
                    policeStation,
                    badgeNumber,
                    jurisdiction,
                    status: 'assigned',
                    assignedAt: new Date()
                };
                console.log('Assigning case with data:', updateData);
                break;
            case 'acknowledge':
                updateData = {
                    status: 'acknowledged',
                    acknowledgedAt: new Date()
                };
                break;
            case 'in-progress':
                updateData = {
                    status: 'in-progress',
                    inProgressAt: new Date()
                };
                break;
            case 'resolved':
                updateData = {
                    status: 'resolved',
                    resolvedAt: new Date()
                };
                break;
            case 'escalate':
                updateData = {
                    status: 'escalated',
                    escalatedAt: new Date(),
                    escalatedBy: currentUser.id
                };
                break;
            default:
                return res.status(400).json({ message: 'Invalid action' });
        }

        const alert = await Alert.findByIdAndUpdate(
            alertId,
            updateData,
            { new: true }
        ).populate('userId', 'name email');

        if (!alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }

        console.log('Updated alert:', alert);
        res.json(alert);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE alert (admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        if (currentUser.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const alert = await Alert.findByIdAndDelete(req.params.id);
        if (!alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }

        res.json({ message: 'Alert deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;