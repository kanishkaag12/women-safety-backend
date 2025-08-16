// women-safety-backend/routes/alerts.js

const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const User = require('../models/User');
const VoiceRecording = require('../models/VoiceRecording');
const jwt = require('jsonwebtoken'); // Added missing import for jwt
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

// GET recordings for an alert (admin and police only)
router.get('/:alertId/recordings', auth, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        if (!['admin', 'police'].includes(currentUser.role)) {
            return res.status(403).json({ message: 'Access denied. Admin and Police only.' });
        }
        const recordings = await VoiceRecording.find({ alertId: req.params.alertId })
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });
        res.json(recordings);
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
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const alert = new Alert({
            userId,
            userName,
            location,
            coordinates,
            type: type || 'manual',
            priority: priority || 'medium',
            status: status || 'active',
            description,
            emergencyContacts: user.emergencyContacts || [],
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
                // If not already assigned, assign to the acknowledging officer so it shows up in their lists
                try {
                    const existingAlert = await Alert.findById(alertId);
                    updateData = {
                        status: 'acknowledged',
                        acknowledgedAt: new Date(),
                        ...(existingAlert && !existingAlert.assignedPoliceOfficer ? { assignedPoliceOfficer: currentUser.id } : {})
                    };
                } catch (e) {
                    // Fallback: still acknowledge even if read failed
                    updateData = {
                        status: 'acknowledged',
                        acknowledgedAt: new Date(),
                        assignedPoliceOfficer: currentUser.id
                    };
                }
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

// --- Voice Alert Upload (multipart/form-data) ---
// Storage setup
const uploadsBase = path.join(__dirname, '..', 'uploads');
const voiceDir = path.join(uploadsBase, 'voice');
try {
    if (!fs.existsSync(uploadsBase)) fs.mkdirSync(uploadsBase);
    if (!fs.existsSync(voiceDir)) fs.mkdirSync(voiceDir);
} catch (e) {
    console.error('Failed to ensure upload directories exist:', e);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, voiceDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname || '').toLowerCase() || '.webm';
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    fileFilter: (req, file, cb) => {
        // Accept common audio mime types
        const ok = /audio\/(webm|wav|mp4|mpeg|ogg|3gpp|3gpp2)/.test(file.mimetype || '');
        if (!ok) return cb(new Error('Unsupported audio type'));
        cb(null, true);
    }
});

// Create or attach a voice alert
router.post('/voice', auth, upload.single('audio'), async (req, res) => {
    try {
        const { userId, userName, location, coordinates, type, priority, status, alertId, mimeType } = req.body;
        if (!req.file) {
            return res.status(400).json({ message: 'Audio file is required (field name: audio)' });
        }

        const currentUser = await User.findById(req.user.id);
        if (!currentUser) return res.status(401).json({ message: 'Invalid user' });

        const fileUrl = `/uploads/voice/${req.file.filename}`;
        const fileMime = mimeType || req.file.mimetype || 'audio/webm';
        const fileSize = req.file.size || 0;

        // If alertId provided attach voice to existing alert and record
        if (alertId) {
            const existing = await Alert.findByIdAndUpdate(
                alertId,
                {
                    voiceFileUrl: fileUrl,
                    voiceMimeType: fileMime,
                    voiceSize: fileSize,
                    // keep status/type if provided
                    ...(type ? { type } : {}),
                    ...(status ? { status } : {})
                },
                { new: true }
            );
            if (!existing) return res.status(404).json({ message: 'Alert not found' });

            // Attribute the recording to the original alert owner (victim), not the uploader
            const ownerUser = await User.findById(existing.userId);

            await VoiceRecording.create({
                alertId: existing._id,
                userId: ownerUser ? ownerUser._id : currentUser._id,
                userName: ownerUser?.name || userName || currentUser.name || 'Unknown',
                fileUrl: fileUrl,
                mimeType: fileMime,
                size: fileSize
            });
            // Notify dashboards to refresh recordings
            try { req.app.get('io')?.emit('recording-saved', { alertId: existing._id.toString() }); } catch (_) {}
            return res.json(existing);
        }

        // Otherwise create a new alert of type voice
        const ownerUserId = userId || req.user.id;
        const owner = await User.findById(ownerUserId);
        if (!owner) return res.status(404).json({ message: 'User not found' });

        const alert = new Alert({
            userId: owner._id,
            userName: userName || owner.name || 'Unknown',
            location: location || 'Location not available',
            coordinates: coordinates || '',
            type: type || 'voice',
            priority: priority || 'high',
            status: status || 'active',
            createdAt: new Date(),
            voiceFileUrl: fileUrl,
            voiceMimeType: fileMime,
            voiceSize: fileSize
        });

        const saved = await alert.save();
        // also save a recording entry
        await VoiceRecording.create({
            alertId: saved._id,
            userId: owner._id,
            userName: saved.userName,
            fileUrl: fileUrl,
            mimeType: fileMime,
            size: fileSize
        });
        // Notify dashboards to refresh recordings
        try { req.app.get('io')?.emit('recording-saved', { alertId: saved._id.toString() }); } catch (_) {}
        return res.status(201).json(saved);
    } catch (err) {
        console.error('Voice upload failed:', err);
        return res.status(500).json({ message: err.message || 'Server error' });
    }
});

module.exports = router;