const mongoose = require('mongoose');

const compressionSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  fileName: { type: String, required: true },
  originalSize: { type: Number, required: true },
  compressedSize: { type: Number, required: true },
  reductionPercent: { type: Number },
  level: { type: String },
  method: { type: String },
  optimized: { type: Boolean, default: true },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Compression', compressionSchema);