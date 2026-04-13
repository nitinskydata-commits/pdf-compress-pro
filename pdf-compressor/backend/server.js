const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { compressPDF } = require('./utils/pdfCompressor');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }
}));

console.log('\n========================================');
console.log('🚀 PDF Compressor Backend Starting...');
console.log(`📡 Port: ${PORT}`);
console.log('========================================\n');

// In-Memory Database
const db = {
    ads: [],
    compressions: [],
    analytics: []
};

function getTodayAnalytics() {
    const today = new Date().toISOString().split('T')[0];
    let record = db.analytics.find(a => a.date === today);
    if (!record) {
        record = { date: today, totalCompressions: 0, totalSizeSaved: 0, adImpressions: 0, adClicks: 0 };
        db.analytics.push(record);
    }
    return record;
}

// Simple test endpoint
app.get('/api/test', (req, res) => {
    res.json({ success: true, message: 'Backend is running!' });
});

// Compression endpoint
app.post('/api/compress', async (req, res) => {
    console.log('📥 Compression request received');
    
    try {
        if (!req.files || !req.files.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.files.file;
        const compressionLevel = req.body.level || 'medium';
        console.log(`📄 File: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(2)} MB, Level: ${compressionLevel}`);
        
        if (file.mimetype !== 'application/pdf') {
            return res.status(400).json({ error: 'Only PDF files are allowed' });
        }

        console.log('🔄 Compressing file...');
        const compressedBuffer = await compressPDF(file.data, compressionLevel);

        // Update DB
        const originalSize = file.size;
        const compressedSize = compressedBuffer.length;
        const reductionPercent = ((1 - compressedSize / originalSize) * 100).toFixed(1);
        
        db.compressions.unshift({
            _id: uuidv4(),
            fileName: file.name,
            originalSize,
            compressedSize,
            reductionPercent,
            compressionLevel,
            timestamp: new Date()
        });
        
        const analytics = getTodayAnalytics();
        analytics.totalCompressions++;
        analytics.totalSizeSaved += (originalSize - compressedSize);

        console.log(`📤 Sending compressed file (${(compressedBuffer.length / 1024 / 1024).toFixed(2)} MB)...`);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="compressed_${file.name}"`);
        res.send(Buffer.from(compressedBuffer));
        
        console.log('✅ Request completed\n');

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Admin Auth
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (email === 'admin@pdfcompresspro.com' && password === 'Admin@123456') {
        res.json({ success: true, token: 'fake-token', user: { email, role: 'admin' } });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// Admin Ads CRUD
app.get('/api/admin/ads', (req, res) => {
    res.json({ success: true, ads: db.ads });
});

app.post('/api/admin/ads', (req, res) => {
    const newAd = { _id: uuidv4(), ...req.body, impressions: 0, clicks: 0, createdAt: new Date() };
    db.ads.push(newAd);
    res.json({ success: true, ad: newAd });
});

app.put('/api/admin/ads/:id', (req, res) => {
    const index = db.ads.findIndex(a => a._id === req.params.id);
    if (index !== -1) {
        db.ads[index] = { ...db.ads[index], ...req.body, updatedAt: new Date() };
        res.json({ success: true, ad: db.ads[index] });
    } else {
        res.status(404).json({ success: false, message: 'Ad not found' });
    }
});

app.delete('/api/admin/ads/:id', (req, res) => {
    db.ads = db.ads.filter(a => a._id !== req.params.id);
    res.json({ success: true, message: 'Ad deleted' });
});

// Tracking
app.post('/api/admin/track-impression', (req, res) => {
    const { adId } = req.body;
    const ad = db.ads.find(a => a._id === adId);
    if (ad) ad.impressions++;
    getTodayAnalytics().adImpressions++;
    res.json({ success: true });
});

app.post('/api/admin/track-click', (req, res) => {
    const { adId } = req.body;
    const ad = db.ads.find(a => a._id === adId);
    if (ad) ad.clicks++;
    getTodayAnalytics().adClicks++;
    res.json({ success: true });
});

// Admin Dashboard stats
app.get('/api/admin/dashboard', (req, res) => {
    const totalCompressions = db.compressions.length;
    const totalSizeSaved = db.compressions.reduce((acc, curr) => acc + (curr.originalSize - curr.compressedSize), 0);
    
    res.json({ 
        success: true, 
        stats: { 
            totalCompressions, 
            totalSizeSavedMB: (totalSizeSaved / (1024 * 1024)).toFixed(2),
            monthlyTotal: totalCompressions,
            monthlyAvgReduction: totalCompressions > 0 ? (db.compressions.reduce((acc, curr) => acc + parseFloat(curr.reductionPercent), 0) / totalCompressions).toFixed(1) : parseFloat(0).toFixed(1),
            recentCompressions: db.compressions.slice(0, 10)
        } 
    });
});

app.get('/api/admin/analytics', (req, res) => {
    res.json({ success: true, analytics: db.analytics });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Backend running on http://localhost:${PORT}`);
    console.log(`📡 Test: http://localhost:${PORT}/api/test\n`);
});