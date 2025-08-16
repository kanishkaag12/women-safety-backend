const mongoose = require('mongoose');

const VoiceRecordingSchema = new mongoose.Schema({
  alertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alert',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  mimeType: { type: String, default: '' },
  size: { type: Number, default: 0 },
  durationMs: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

VoiceRecordingSchema.index({ alertId: 1, createdAt: -1 });
VoiceRecordingSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('VoiceRecording', VoiceRecordingSchema);
