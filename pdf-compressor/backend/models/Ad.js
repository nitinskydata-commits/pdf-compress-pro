const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    position: {
        type: String,
        enum: ['top-banner', 'sidebar-1', 'sidebar-2', 'bottom-banner', 'in-content'],
        required: true
    },
    code: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    impressions: {
        type: Number,
        default: 0
    },
    clicks: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Ad', adSchema);