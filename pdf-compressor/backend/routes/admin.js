const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Ad = require('../models/Ad');
const Analytics = require('../models/Analytics');
const Compression = require('../models/Compression');

// Middleware to check admin role
const isAdmin = async (req, res, next) => {
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
};

// Get dashboard stats
router.get('/dashboard', auth, isAdmin, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - 7);
        
        const startOfMonth = new Date(today);
        startOfMonth.setDate(1);
        
        // Get statistics
        const [totalCompressions, totalSizeSaved, weeklyStats, monthlyStats, ads, recentCompressions] = await Promise.all([
            Compression.countDocuments(),
            Compression.aggregate([{ $group: { _id: null, total: { $sum: '$originalSize' } } }]),
            Compression.aggregate([
                { $match: { timestamp: { $gte: startOfWeek } } },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, count: { $sum: 1 } } }
            ]),
            Compression.aggregate([
                { $match: { timestamp: { $gte: startOfMonth } } },
                { $group: { _id: null, count: { $sum: 1 }, totalReduction: { $avg: '$reductionPercent' } } }
            ]),
            Ad.find(),
            Compression.find().sort({ timestamp: -1 }).limit(10)
        ]);
        
        res.json({
            success: true,
            stats: {
                totalCompressions,
                totalSizeSavedMB: ((totalSizeSaved[0]?.total || 0) / (1024 * 1024)).toFixed(2),
                weeklyData: weeklyStats,
                monthlyTotal: monthlyStats[0]?.count || 0,
                monthlyAvgReduction: monthlyStats[0]?.totalReduction?.toFixed(1) || 0,
                recentCompressions
            },
            ads
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard data' });
    }
});

// Manage Ads
router.get('/ads', auth, isAdmin, async (req, res) => {
    try {
        const ads = await Ad.find();
        res.json({ success: true, ads });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch ads' });
    }
});

router.post('/ads', auth, isAdmin, async (req, res) => {
    try {
        const { name, position, code } = req.body;
        const ad = await Ad.create({ name, position, code });
        res.json({ success: true, ad });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create ad' });
    }
});

router.put('/ads/:id', auth, isAdmin, async (req, res) => {
    try {
        const { name, position, code, isActive } = req.body;
        const ad = await Ad.findByIdAndUpdate(
            req.params.id,
            { name, position, code, isActive, updatedAt: Date.now() },
            { new: true }
        );
        res.json({ success: true, ad });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update ad' });
    }
});

router.delete('/ads/:id', auth, isAdmin, async (req, res) => {
    try {
        await Ad.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Ad deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete ad' });
    }
});

// Track ad click
router.post('/track-click', async (req, res) => {
    try {
        const { adId } = req.body;
        await Ad.findByIdAndUpdate(adId, { $inc: { clicks: 1 } });
        
        // Update analytics
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        await Analytics.findOneAndUpdate(
            { date: today },
            { $inc: { adClicks: 1 } },
            { upsert: true }
        );
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// Track ad impression
router.post('/track-impression', async (req, res) => {
    try {
        const { adId } = req.body;
        await Ad.findByIdAndUpdate(adId, { $inc: { impressions: 1 } });
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        await Analytics.findOneAndUpdate(
            { date: today },
            { $inc: { adImpressions: 1 } },
            { upsert: true }
        );
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// Get analytics data
router.get('/analytics', auth, isAdmin, async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        const analytics = await Analytics.find({
            date: { $gte: startDate }
        }).sort({ date: 1 });
        
        res.json({ success: true, analytics });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
    }
});

module.exports = router;