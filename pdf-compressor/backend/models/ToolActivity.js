const mongoose = require('mongoose');

const toolActivitySchema = new mongoose.Schema({
  toolId: { type: String, required: true, index: true },
  toolName: { type: String, required: true },
  category: { type: String, default: 'utility', index: true },
  action: { type: String, required: true },
  details: { type: String, default: '' },
  originalSize: { type: Number, default: 0 },
  compressedSize: { type: Number, default: 0 },
  sizeSaved: { type: Number, default: 0 },
  reductionPercent: { type: Number, default: 0 },
  method: { type: String, default: 'client' },
  timestamp: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

module.exports = mongoose.models.ToolActivity || mongoose.model('ToolActivity', toolActivitySchema);
