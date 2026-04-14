const mongoose = require('mongoose');

const analyticSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // Format: YYYY-MM-DD
  totalCompressions: { type: Number, default: 0 },
  totalSizeSaved: { type: Number, default: 0 },
  adImpressions: { type: Number, default: 0 },
  adClicks: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Analytic', analyticSchema);
