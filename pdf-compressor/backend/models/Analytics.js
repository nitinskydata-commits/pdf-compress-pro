const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    totalCompressions: {
        type: Number,
        default: 0
    },
    totalSizeSaved: {
        type: Number,
        default: 0
    },
    uniqueVisitors: {
        type: Number,
        default: 0
    },
    pageViews: {
        type: Number,
        default: 0
    },
    adImpressions: {
        type: Number,
        default: 0
    },
    adClicks: {
        type: Number,
        default: 0
    },
    compressionLevels: {
        low: { type: Number, default: 0 },
        medium: { type: Number, default: 0 },
        high: { type: Number, default: 0 }
    }
});

module.exports = mongoose.model('Analytics', analyticsSchema);