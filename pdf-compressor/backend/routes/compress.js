const express = require('express');
const router = express.Router();
const { compressPDF } = require('../utils/pdfCompressor');
const Compression = require('../models/Compression');
const Analytics = require('../models/Analytics');

// Compression endpoint
router.post('/', async (req, res) => {
    try {
        if (!req.files || !req.files.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        
        const file = req.files.file;
        const compressionLevel = req.body.level || 'medium';
        
        // Validate file type
        if (file.mimetype !== 'application/pdf') {
            return res.status(400).json({ success: false, message: 'Only PDF files are allowed' });
        }
        
        // Validate file size (50MB max)
        if (file.size > 50 * 1024 * 1024) {
            return res.status(400).json({ success: false, message: 'File too large. Max 50MB' });
        }
        
        // Compress the PDF
        const compressedBuffer = await compressPDF(file.data, compressionLevel);
        
        // Calculate statistics
        const originalSize = file.size;
        const compressedSize = compressedBuffer.length;
        const reductionPercent = ((1 - compressedSize / originalSize) * 100).toFixed(1);
        
        // Save compression record
        await Compression.create({
            fileName: file.name,
            originalSize,
            compressedSize,
            reductionPercent,
            compressionLevel,
            ipAddress: req.ip
        });
        
        // Update analytics
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        await Analytics.findOneAndUpdate(
            { date: today },
            {
                $inc: {
                    totalCompressions: 1,
                    totalSizeSaved: originalSize - compressedSize,
                    [`compressionLevels.${compressionLevel}`]: 1
                }
            },
            { upsert: true }
        );
        
        // Send compressed file
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="compressed_${file.name}"`);
        res.send(compressedBuffer);
        
    } catch (error) {
        console.error('Compression error:', error);
        res.status(500).json({ success: false, message: 'Compression failed' });
    }
});

// Get compression statistics (for frontend display)
router.get('/stats', async (req, res) => {
    try {
        const total = await Compression.countDocuments();
        const avgReduction = await Compression.aggregate([
            { $group: { _id: null, avg: { $avg: '$reductionPercent' } } }
        ]);
        
        res.json({
            success: true,
            totalCompressions: total,
            averageReduction: avgReduction[0]?.avg.toFixed(1) || 0
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get stats' });
    }
});

module.exports = router;