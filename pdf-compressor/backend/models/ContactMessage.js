const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  subject: { type: String, trim: true, default: 'General Support Inquiry' },
  message: { type: String, required: true, trim: true },
  status: { type: String, enum: ['unread', 'read', 'replied', 'archived'], default: 'unread' },
  ip: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  emailDispatched: { type: Boolean, default: false },
  dispatchError: { type: String, default: '' }
}, { timestamps: true });

contactMessageSchema.index({ createdAt: -1 });
contactMessageSchema.index({ status: 1 });

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
