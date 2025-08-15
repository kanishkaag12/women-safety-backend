const mongoose = require('mongoose');

// Define the schema for our alert data
const AlertSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['emergency', 'voice', 'manual', 'suspicious'],
        default: 'manual'
    },
    location: {
        type: String,
        required: true
    },
    coordinates: {
        type: String,
        default: ''
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['active', 'acknowledged', 'assigned', 'in-progress', 'resolved', 'escalated', 'closed'],
        default: 'active'
    },
    description: {
        type: String
    },
    // Police assignment fields
    assignedPoliceOfficer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    policeStation: String,
    badgeNumber: String,
    jurisdiction: String,
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    assignedAt: Date,
    acknowledgedAt: Date,
    inProgressAt: Date,
    resolvedAt: Date,
    escalatedAt: Date,
    closedAt: Date,
    // Additional metadata
    source: {
        type: String,
        enum: ['app', 'voice', 'manual', 'emergency'],
        default: 'app'
    },
    tags: [String],
    // Response tracking
    responseTime: Number, // in minutes
    escalationReason: String,
    escalatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

// Create indexes for better query performance
AlertSchema.index({ userId: 1, createdAt: -1 });
AlertSchema.index({ status: 1, createdAt: -1 });
AlertSchema.index({ assignedPoliceOfficer: 1, status: 1 });
AlertSchema.index({ jurisdiction: 1, status: 1 });

// Create and export the Mongoose model
const Alert = mongoose.model('Alert', AlertSchema);

module.exports = Alert;