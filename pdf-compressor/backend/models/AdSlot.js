const mongoose = require('mongoose');

const adSlotSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  code: { type: String, default: '' },
  label: { type: String },
  desc: { type: String },
  category: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('AdSlot', adSlotSchema);
