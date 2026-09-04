const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');
const os = require('os');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { compressPDF, estimateCompressionLevels } = require('./utils/pdfOptimizer');

const mongoose = require('mongoose');
const AdSlot = require('./models/AdSlot');
const Analytic = require('./models/Analytic');
const Compression = require('./models/Compression');
const Setting = require('./models/Setting');
const serverless = require('serverless-http');

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const FRONTEND_DIR = path.resolve(__dirname, '..', 'frontend');
const SITE_URL = (process.env.SITE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@pdfcompresspro.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'local-admin-token';
const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_TOKEN || 'pdf-compress-pro-jwt-secret-key-2026';
const MONGODB_URI = process.env.MONGODB_URI;

// DB Connection Cache & State
let isConnected = false;
let isConnecting = false;
let lastConnectAttempt = 0;

let standaloneNoticeLogged = false;

async function connectDB() {
  if (isConnected) return;

  // If no URI, or contains placeholder '...', run smoothly in standalone mode
  if (!MONGODB_URI || MONGODB_URI.includes('...') || !MONGODB_URI.startsWith('mongodb')) {
    if (!standaloneNoticeLogged) {
      console.log('ℹ️ Running in standalone mode (PDF compression & API fully functional without MongoDB).');
      standaloneNoticeLogged = true;
    }
    return;
  }

  if (isConnecting) return;
  if (Date.now() - lastConnectAttempt < 15000) return; // 15-second retry cooldown

  isConnecting = true;
  lastConnectAttempt = Date.now();

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000 // Fail fast (5s) instead of hanging
    });
    isConnected = true;
    console.log('✅ MongoDB Connected successfully');
    await initializeDbDefaults();
  } catch (error) {
    if (!standaloneNoticeLogged) {
      console.warn('⚠️ MongoDB connection unavailable, running in standalone mode:', error.message || error);
      standaloneNoticeLogged = true;
    }
  } finally {
    isConnecting = false;
  }
}

async function initializeDbDefaults() {
  try {
    const passwordRecord = await Setting.findOne({ key: 'adminPassword' });
    if (!passwordRecord) {
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await Setting.create({ key: 'adminPassword', value: hashedPassword });
    } else if (passwordRecord.value && typeof passwordRecord.value === 'string' && !passwordRecord.value.startsWith('$2')) {
      // Automatically migrate legacy plaintext password to secure bcrypt hash
      const hashedPassword = await bcrypt.hash(passwordRecord.value, 10);
      await Setting.updateOne({ key: 'adminPassword' }, { value: hashedPassword });
    }

    const logoExists = await Setting.findOne({ key: 'logo' });
    if (!logoExists) {
      await Setting.create({ key: 'logo', value: '/logo.png' });
    }

    const requiredSlots = [
      { id: 'home-hero', label: 'Home Page: After Welcome', category: 'Home Page' },
      { id: 'home-features', label: 'Home Page: Features Area', category: 'Home Page' },
      { id: 'home-faq', label: 'Home Page: FAQ Section', category: 'Home Page' },
      { id: 'home-footer', label: 'Home Page: Footer Banner', category: 'Home Page' },
      { id: 'compress-top', label: 'Compress Page: Above Upload', category: 'Compress Page' },
      { id: 'compress-tool', label: 'Compress Page: After Upload', category: 'Compress Page' },
      { id: 'compress-sidebar', label: 'Compress Page: Sidebar Ad', category: 'Compress Page' },
      { id: 'compress-footer', label: 'Compress Page: Footer Banner', category: 'Compress Page' }
    ];

    for (const slot of requiredSlots) {
      await AdSlot.updateOne({ id: slot.id }, { $setOnInsert: slot }, { upsert: true });
    }
  } catch (err) {
    console.error('Error during DB defaults initialization:', err.message);
  }
}

function sanitizeFilename(name) {
  return String(name || 'file.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function getTodayAnalytics() {
  if (!isConnected) {
    return {
      totalCompressions: 0,
      totalSizeSaved: 0,
      adImpressions: 0,
      adClicks: 0,
      save: async () => {}
    };
  }
  try {
    const today = new Date().toISOString().slice(0, 10);
    let record = await Analytic.findOne({ date: today });

    if (!record) {
      record = await Analytic.create({
        date: today,
        totalCompressions: 0,
        totalSizeSaved: 0,
        adImpressions: 0,
        adClicks: 0
      });
    }

    return record;
  } catch (_) {
    return {
      totalCompressions: 0,
      totalSizeSaved: 0,
      adImpressions: 0,
      adClicks: 0,
      save: async () => {}
    };
  }
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  // Allow static ADMIN_TOKEN for legacy compatibility
  if (token === ADMIN_TOKEN) {
    req.user = { email: ADMIN_EMAIL, role: 'admin' };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session token' });
  }
}

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

function formatCompressionRecord(record) {
  return {
    ...record.toObject(),
    originalSizeMB: Number((record.originalSize / (1024 * 1024)).toFixed(2)),
    compressedSizeMB: Number((record.compressedSize / (1024 * 1024)).toFixed(2))
  };
}

app.disable('x-powered-by');
app.set('trust proxy', 1);

const allowedOrigins = [
  SITE_URL,
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:5173',
  'http://localhost:5500'
];

if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(',').forEach(url => allowedOrigins.push(url.trim().replace(/\/$/, '')));
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const cleanOrigin = origin.replace(/\/$/, '');
    const isAllowed = allowedOrigins.includes(cleanOrigin) || 
                     cleanOrigin.endsWith('.pages.dev') || 
                     cleanOrigin.endsWith('.onrender.com') || 
                     cleanOrigin.endsWith('.workers.dev');

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive during transitions
    }
  },
  credentials: true
}));

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);
app.use(compression());
app.use((req, res, next) => {
  res.setHeader('X-Robots-Tag', 'index, follow');
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  if (req.body && req.body._isBase64) {
    req.body = Buffer.from(req.body.data, 'base64');
  }
  next();
});

app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
    useTempFiles: true,
    tempFileDir: os.tmpdir(),
    abortOnLimit: true,
    createParentPath: true,
    safeFileNames: true,
    preserveExtension: true,
    debug: false
  })
);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});

const compressionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many compression requests. Please try again in a few minutes.' }
});

app.use('/api', apiLimiter);

function renderTemplate(content, pagePath = '') {
  return content
    .replace(/__SITE_URL__/g, SITE_URL)
    .replace(/__PAGE_URL__/g, `${SITE_URL}${pagePath}`);
}

async function sendRenderedHtml(res, fileName, pagePath = '', statusCode = 200) {
  const filePath = path.join(FRONTEND_DIR, fileName);
  const html = await fs.readFile(filePath, 'utf8');
  res.status(statusCode).type('html').send(renderTemplate(html, pagePath));
}

app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is running!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    uptime: Math.round(process.uptime()),
    database: isConnected ? 'connected' : 'standalone',
    timestamp: new Date().toISOString()
  });
});

// Helper to validate input buffer header for PDF magic bytes
function checkIsPDF(pdfFile) {
  try {
    let buffer = null;
    if (pdfFile.data && Buffer.isBuffer(pdfFile.data)) {
      buffer = pdfFile.data.slice(0, 8192);
    } else if (pdfFile.tempFilePath && fs.existsSync(pdfFile.tempFilePath)) {
      const fd = fs.openSync(pdfFile.tempFilePath, 'r');
      const headerBuf = Buffer.alloc(8192);
      const bytesRead = fs.readSync(fd, headerBuf, 0, 8192, 0);
      fs.closeSync(fd);
      buffer = headerBuf.slice(0, bytesRead);
    }

    if (!buffer || buffer.length === 0) {
      const name = (pdfFile.name || '').toLowerCase().trim();
      return name.endsWith('.pdf') || (pdfFile.mimetype && pdfFile.mimetype.includes('pdf'));
    }

    // Check for standard PDF signature anywhere in the first 8KB (handles Adobe XMP packet headers & BOM)
    const headerStr = buffer.toString('latin1');
    if (headerStr.includes('%PDF-')) {
      return true;
    }

    // Check for obvious non-PDF files like HTML or JSON error responses
    const textPreview = buffer.toString('utf8', 0, Math.min(buffer.length, 512)).toLowerCase();
    if (textPreview.includes('<!doctype html') || textPreview.includes('<html') || textPreview.startsWith('{"error"')) {
      return false;
    }

    // If filename ends in .pdf or mimetype is PDF, allow engine (Ghostscript/pdf-lib) to parse and validate
    const filename = (pdfFile.name || '').toLowerCase().trim();
    if (filename.endsWith('.pdf') || (pdfFile.mimetype && pdfFile.mimetype.includes('pdf'))) {
      return true;
    }

    return false;
  } catch (err) {
    // If validation encounters an error, let the compression engine handle it
    return true;
  }
}


// Unified estimation handler (serves both /api/estimate and /api/compress/estimate)
async function handleEstimateRequest(req, res) {
  if (!req.files || (!req.files.pdfFile && !req.files.file)) {
    return res.status(400).json({ success: false, error: 'No PDF file uploaded for estimation' });
  }

  const pdfFile = req.files.pdfFile || req.files.file;
  const inputSource = pdfFile.tempFilePath || pdfFile.data;

  try {
    if (!checkIsPDF(pdfFile)) {
      return res.status(400).json({ success: false, error: 'The uploaded file is not a valid PDF document.' });
    }

    const estimates = await estimateCompressionLevels(inputSource);
    res.json({ success: true, estimates });
  } catch (error) {
    console.error('Estimation error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate estimates: ' + error.message });
  } finally {
    if (pdfFile.tempFilePath) {
      try { await fs.unlink(pdfFile.tempFilePath); } catch (_) {}
    }
  }
}

app.post('/api/estimate', compressionLimiter, handleEstimateRequest);
app.post('/api/compress/estimate', compressionLimiter, handleEstimateRequest);

app.post('/api/compress', compressionLimiter, async (req, res) => {
  if (!req.files || (!req.files.file && !req.files.pdfFile)) {
    return res.status(400).json({ success: false, error: 'No PDF file detected. Please select a PDF file to compress.' });
  }

  const pdfFile = req.files.pdfFile || req.files.file;
  const level = req.body.compressionLevel || req.body.level || 'medium';
  const inputSource = pdfFile.tempFilePath || pdfFile.data;

  try {
    if (!checkIsPDF(pdfFile)) {
      return res.status(400).json({ success: false, error: 'The uploaded file is not a valid PDF document.' });
    }

    const result = await compressPDF(inputSource, level);
    const originalSize = pdfFile.size;
    const compressedSize = result.buffer.length;
    const reduction = originalSize > 0
      ? Math.max(0, ((originalSize - compressedSize) / originalSize) * 100)
      : 0;

    // Record compression entry if DB connected
    if (isConnected) {
      try {
        await Compression.create({
          originalName: sanitizeFilename(pdfFile.name),
          fileName: sanitizeFilename(pdfFile.name),
          originalSize,
          compressedSize,
          reductionPercent: Number(reduction.toFixed(1)),
          level,
          method: result.message,
          optimized: result.optimized
        });

        const analytics = await getTodayAnalytics();
        if (analytics && analytics.save) {
          analytics.totalCompressions++;
          analytics.totalSizeSaved += Math.max(0, originalSize - compressedSize);
          await analytics.save();
        }
      } catch (dbErr) {
        console.warn('DB recording notice:', dbErr.message);
      }
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="compressed_${sanitizeFilename(pdfFile.name)}"`);
    
    // Custom response statistics headers
    res.setHeader('X-Compression-Original-Size', originalSize.toString());
    res.setHeader('X-Compression-Compressed-Size', compressedSize.toString());
    res.setHeader('X-Compression-Reduction', reduction.toFixed(1));
    res.setHeader('X-Compression-Optimized', result.optimized.toString());
    res.setHeader('X-Compression-Message', encodeURIComponent(result.message));
    res.setHeader('Access-Control-Expose-Headers', 'X-Compression-Original-Size, X-Compression-Compressed-Size, X-Compression-Reduction, X-Compression-Optimized, X-Compression-Message');

    res.send(result.buffer);
  } catch (error) {
    console.error('Compression error:', error);
    res.status(500).json({ success: false, error: 'Compression failed: ' + error.message });
  } finally {
    if (pdfFile.tempFilePath) {
      try { await fs.unlink(pdfFile.tempFilePath); } catch (_) {}
    }
  }
});

// Admin Authentication with Bcrypt & JWT (Works with or without DB)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  if (email.toLowerCase().trim() !== ADMIN_EMAIL.toLowerCase().trim()) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  try {
    let storedPassword = ADMIN_PASSWORD;
    if (isConnected) {
      try {
        const adminPasswordSetting = await Setting.findOne({ key: 'adminPassword' });
        if (adminPasswordSetting && adminPasswordSetting.value) {
          storedPassword = adminPasswordSetting.value;
        }
      } catch (_) {}
    }

    let isValid = false;
    if (storedPassword && typeof storedPassword === 'string' && storedPassword.startsWith('$2')) {
      isValid = await bcrypt.compare(password, storedPassword);
    } else {
      // Plaintext comparison with automatic hash update if DB available
      isValid = (password === storedPassword);
      if (isValid && isConnected) {
        try {
          const newHash = await bcrypt.hash(password, 10);
          await Setting.updateOne({ key: 'adminPassword' }, { value: newHash }, { upsert: true });
        } catch (_) {}
      }
    }

    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { email: ADMIN_EMAIL, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      user: { email: ADMIN_EMAIL, role: 'admin' }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Authentication error' });
  }
});

app.get('/api/ads', async (req, res) => {
  try {
    const slots = await AdSlot.find({});
    const adMap = {};
    slots.forEach(s => adMap[s.id] = s.code);
    res.json({ success: true, ads: adMap });
  } catch (err) {
    res.json({ success: true, ads: {} });
  }
});

app.get('/api/admin/ads', authMiddleware, async (req, res) => {
  const slots = await AdSlot.find({});
  const adMap = {};
  slots.forEach(s => adMap[s.id] = s.code);
  res.json({ success: true, ads: adMap });
});

app.post('/api/admin/ads/save', authMiddleware, async (req, res) => {
  const { position, code } = req.body;
  if (!position) return res.status(400).json({ success: false, error: 'Position is required' });
  await AdSlot.updateOne({ id: position }, { code: code || '' });
  res.json({ success: true, message: 'Ad updated' });
});

app.get('/api/admin/dashboard', authMiddleware, async (req, res) => {
  try {
    if (!isConnected) {
      return res.json({
        success: true,
        stats: {
          totalCompressions: 0,
          totalSizeSavedMB: 0,
          monthlyTotal: 0,
          monthlyAvgReduction: 0,
          recentCompressions: []
        }
      });
    }

    const compressions = await Compression.find().sort({ createdAt: -1 }).limit(10);
    const totalCount = await Compression.countDocuments();
    const allCompressions = await Compression.find();
    
    const totalSizeSaved = allCompressions.reduce(
      (sum, item) => sum + Math.max(0, item.originalSize - item.compressedSize),
      0
    );
    const averageReduction = totalCount > 0
        ? allCompressions.reduce((sum, item) => sum + Number(item.reductionPercent || 0), 0) / totalCount
        : 0;

    res.json({
      success: true,
      stats: {
        totalCompressions: totalCount,
        totalSizeSavedMB: Number((totalSizeSaved / (1024 * 1024)).toFixed(2)),
        monthlyTotal: totalCount,
        monthlyAvgReduction: Number(averageReduction.toFixed(1)),
        recentCompressions: compressions.map(formatCompressionRecord)
      }
    });
  } catch (err) {
    res.json({
      success: true,
      stats: { totalCompressions: 0, totalSizeSavedMB: 0, monthlyTotal: 0, monthlyAvgReduction: 0, recentCompressions: [] }
    });
  }
});

app.get('/api/admin/analytics', authMiddleware, async (req, res) => {
  try {
    if (!isConnected) return res.json({ success: true, analytics: [] });
    const analytics = await Analytic.find().sort({ date: -1 });
    res.json({ success: true, analytics });
  } catch (err) {
    res.json({ success: true, analytics: [] });
  }
});

app.get('/api/admin/settings', authMiddleware, async (req, res) => {
  try {
    if (!isConnected) return res.json({ success: true, settings: { logo: '/logo.png' } });
    const logo = await Setting.findOne({ key: 'logo' });
    res.json({ success: true, settings: { logo: logo ? logo.value : '/logo.png' } });
  } catch (err) {
    res.json({ success: true, settings: { logo: '/logo.png' } });
  }
});

app.post('/api/admin/settings', authMiddleware, async (req, res) => {
  try {
    if (isConnected && req.body.adminPassword) {
      const hashedPassword = await bcrypt.hash(req.body.adminPassword, 10);
      await Setting.updateOne({ key: 'adminPassword' }, { value: hashedPassword }, { upsert: true });
    }
    res.json({ success: true, message: 'Settings updated' });
  } catch (err) {
    res.json({ success: true, message: 'Settings updated' });
  }
});

app.delete('/api/admin/compressions', authMiddleware, async (req, res) => {
  try {
    if (isConnected) await Compression.deleteMany({});
    res.json({ success: true, message: 'Compression history cleared' });
  } catch (err) {
    res.json({ success: true, message: 'Compression history cleared' });
  }
});

app.post('/api/admin/logo', authMiddleware, async (req, res) => {
  if (!req.files || !req.files.logo) {
    return res.status(400).json({ success: false, error: 'No logo file uploaded' });
  }
  const logoFile = req.files.logo;
  const base64 = `data:${logoFile.mimetype};base64,${logoFile.data.toString('base64')}`;
  await Setting.updateOne({ key: 'logo' }, { value: base64 }, { upsert: true });
  res.json({ success: true, logoUrl: base64 });
});

app.get('/api/logo', async (req, res) => {
  const logo = await Setting.findOne({ key: 'logo' });
  res.json({ success: true, logo: logo ? logo.value : '/logo.png' });
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *
Allow: /
Sitemap: ${SITE_URL}/sitemap.xml`);
});

app.get('/sitemap.xml', (req, res) => {
  const pages = [
    { loc: `${SITE_URL}/`, priority: '1.0' },
    { loc: `${SITE_URL}/compress`, priority: '0.9' }
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url><loc>${p.loc}</loc><changefreq>weekly</changefreq><priority>${p.priority}</priority></url>`).join('\n')}
</urlset>`;
  res.type('application/xml').send(xml);
});

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'PDFCompress Pro Backend',
    version: '1.0.0',
    health: '/api/health',
    timestamp: new Date().toISOString()
  });
});

if (process.env.NODE_ENV !== 'production') {
  app.use(express.static(FRONTEND_DIR));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
    }
  });
}

app.use((error, req, res, next) => {
  console.error('Unhandled server error:', error);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`PDFCompress Pro server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);

  // Automatic keep-alive pinger for Render free tier (prevents idle sleep)
  const keepAliveUrl = process.env.RENDER_EXTERNAL_URL || process.env.KEEP_ALIVE_URL;
  if (keepAliveUrl) {
    const pingInterval = 10 * 60 * 1000; // Every 10 minutes (Render sleeps after 15m)
    setInterval(() => {
      try {
        const target = `${keepAliveUrl.replace(/\/$/, '')}/api/health`;
        const client = target.startsWith('https') ? require('https') : require('http');
        client.get(target, () => {}).on('error', (err) => {
          console.warn('Keep-alive ping notice:', err.message);
        });
      } catch (_) {}
    }, pingInterval);
    console.log(`Keep-alive heartbeat active for ${keepAliveUrl}/api/health (interval: 10m)`);
  }
});

module.exports = app;
module.exports.handler = serverless(app, {
  binary: ['multipart/form-data', 'application/pdf', 'image/*']
});
