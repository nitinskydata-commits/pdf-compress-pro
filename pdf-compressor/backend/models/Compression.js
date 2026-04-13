const mongoose = require('mongoose');

const compressionSchema = new mongoose.Schema({
    fileName: String,
    originalSize: Number,
    compressedSize: Number,
    reductionPercent: Number,
    compressionLevel: String,
    ipAddress: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Compression', compressionSchema);