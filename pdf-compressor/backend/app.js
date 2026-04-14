const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
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
const MONGODB_URI = process.env.MONGODB_URI;

// DB Connection Cache
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined in environment variables');
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000 // Fail fast (5s) instead of hanging
    });
    isConnected = true;
    console.log('MongoDB Connected');
    await initializeDbDefaults();
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
  }
}

async function initializeDbDefaults() {
  const passwordExists = await Setting.findOne({ key: 'adminPassword' });
  if (!passwordExists) {
    await Setting.create({ key: 'adminPassword', value: ADMIN_PASSWORD });
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
}

function sanitizeFilename(name) {
  return String(name || 'file.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function getTodayAnalytics() {
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
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  next();
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
                     cleanOrigin.endsWith('.netlify.app') || 
                     cleanOrigin.endsWith('.onrender.com');

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
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
    limits: { fileSize: 10 * 1024 * 1024 },
    useTempFiles: true,
    tempFileDir: '/tmp/',
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
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many compression requests. Please try again shortly.' }
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
    timestamp: new Date().toISOString()
  });
});

app.post('/api/estimate', compressionLimiter, async (req, res) => {
  if (!req.files || !req.files.pdfFile) {
    return res.status(400).json({ success: false, error: 'No PDF file uploaded' });
  }

  const pdfFile = req.files.pdfFile;
  const inputSource = pdfFile.tempFilePath || pdfFile.data;

  try {
    const estimates = await estimateCompressionLevels(inputSource);
    res.json({ success: true, estimates });

    if (pdfFile.tempFilePath) {
      try { await fs.unlink(pdfFile.tempFilePath); } catch (_) {}
    }
  } catch (error) {
    console.error('Estimation error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate estimates' });
    if (pdfFile.tempFilePath) {
      try { await fs.unlink(pdfFile.tempFilePath); } catch (_) {}
    }
  }
});

app.post('/api/compress', compressionLimiter, async (req, res) => {
  console.log('[API] /compress request received');
  if (!req.files || (!req.files.file && !req.files.pdfFile)) {
    return res.status(400).json({ success: false, error: 'No PDF file detected. (Check if file > 6MB)' });
  }

  const pdfFile = req.files.pdfFile || req.files.file;
  const level = req.body.compressionLevel || req.body.level || 'medium';
  const inputSource = pdfFile.tempFilePath || pdfFile.data;

  try {
    const result = await compressPDF(inputSource, level);
    const originalSize = pdfFile.size;
    const compressedSize = result.buffer.length;
    const reduction = ((originalSize - compressedSize) / originalSize) * 100;

    const record = await Compression.create({
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
    analytics.totalCompressions++;
    analytics.totalSizeSaved += Math.max(0, originalSize - compressedSize);
    await analytics.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="compressed_${record.fileName}"`);
    res.send(result.buffer);

    if (pdfFile.tempFilePath) {
      try { await fs.unlink(pdfFile.tempFilePath); } catch (_) {}
    }
  } catch (error) {
    console.error('Compression error:', error);
    res.status(500).json({ success: false, error: 'Compression failed: ' + error.message });
    if (pdfFile.tempFilePath) {
      try { await fs.unlink(pdfFile.tempFilePath); } catch (_) {}
    }
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const adminPasswordSetting = await Setting.findOne({ key: 'adminPassword' });
  const validPassword = adminPasswordSetting ? adminPasswordSetting.value : ADMIN_PASSWORD;

  if (email === ADMIN_EMAIL && password === validPassword) {
    return res.json({
      success: true,
      token: ADMIN_TOKEN,
      user: { email, role: 'admin' }
    });
  }
  return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

app.get('/api/ads', async (req, res) => {
  const slots = await AdSlot.find({});
  const adMap = {};
  slots.forEach(s => adMap[s.id] = s.code);
  res.json({ success: true, ads: adMap });
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
});

app.get('/api/admin/analytics', authMiddleware, async (req, res) => {
  const analytics = await Analytic.find().sort({ date: -1 });
  res.json({ success: true, analytics });
});

app.get('/api/admin/settings', authMiddleware, async (req, res) => {
  const logo = await Setting.findOne({ key: 'logo' });
  res.json({ success: true, settings: { logo: logo ? logo.value : '/logo.png' } });
});

app.post('/api/admin/settings', authMiddleware, async (req, res) => {
  if (req.body.adminPassword) {
    await Setting.updateOne({ key: 'adminPassword' }, { value: req.body.adminPassword }, { upsert: true });
  }
  res.json({ success: true, message: 'Settings updated' });
});

app.delete('/api/admin/compressions', authMiddleware, async (req, res) => {
  await Compression.deleteMany({});
  res.json({ success: true, message: 'Compression history cleared' });
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

if (process.env.NODE_ENV === 'development') {
  app.listen(PORT, () => console.log(`PDFCompress Pro server at http://localhost:${PORT}`));
}

module.exports = app;
module.exports.handler = serverless(app, {
  binary: ['multipart/form-data', 'application/pdf', 'image/*']
});
