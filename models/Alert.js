const mongoose = require('mongoose');

// Define the schema for our alert data
const AlertSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  details: {
    type: String
  }
});

// Create and export the Mongoose model
const Alert = mongoose.model('Alert', AlertSchema);

module.exports = Alert;