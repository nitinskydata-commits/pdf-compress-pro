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

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const FRONTEND_DIR = path.resolve(__dirname, '..', 'frontend');
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const SITE_URL = (process.env.SITE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@pdfcompresspro.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'local-admin-token';

const initialDb = {
  analytics: [],
  settings: {
    logo: '/logo.png',
    adminPassword: '' 
  },
  adSlots: {
    'top-banner': '',
    'bottom-banner': '',
    'hero-inline': '',
    'faq-inline': '',
    'tool-inline': '',
    'post-result': '',
    'sidebar-1': '',
    'sidebar-2': ''
  }
};

const db = {
  ads: [],
  compressions: [],
  analytics: [],
  settings: {
    logo: '/logo.png',
    adminPassword: ''
  },
  adSlots: {}
};

function sanitizeFilename(name) {
  return String(name || 'file.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function loadDb() {
  await fs.ensureDir(DATA_DIR);
  if (!(await fs.pathExists(DB_PATH))) {
    await fs.writeJson(DB_PATH, initialDb, { spaces: 2 });
    return JSON.parse(JSON.stringify(initialDb));
  }

  const file = await fs.readJson(DB_PATH);
  return {
    ads: Array.isArray(file.ads) ? file.ads : [],
    compressions: Array.isArray(file.compressions) ? file.compressions : [],
    analytics: Array.isArray(file.analytics) ? file.analytics : [],
    settings: file.settings || { logo: '/logo.png', adminPassword: '' },
    adSlots: file.adSlots || initialDb.adSlots
  };
}

async function saveDb() {
  await fs.writeJson(DB_PATH, db, { spaces: 2 });
}

function getTodayAnalytics() {
  const today = new Date().toISOString().slice(0, 10);
  let record = db.analytics.find((entry) => entry.date === today);

  if (!record) {
    record = {
      date: today,
      totalCompressions: 0,
      totalSizeSaved: 0,
      adImpressions: 0,
      adClicks: 0
    };
    db.analytics.push(record);
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

function formatCompressionRecord(record) {
  return {
    ...record,
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
  'http://localhost:5500',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5500',
  'http://127.0.0.1:5000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
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
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
    abortOnLimit: true,
    createParentPath: false,
    safeFileNames: true,
    preserveExtension: true
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

app.post('/api/compress', compressionLimiter, async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const file = req.files.file;
    const compressionLevel = ['low', 'medium', 'high'].includes(req.body.level)
      ? req.body.level
      : 'medium';

    if (file.mimetype !== 'application/pdf') {
      return res.status(400).json({ success: false, error: 'Only PDF files are allowed' });
    }

    const originalBuffer = Buffer.from(file.data);
    const compressionResult = await compressPDF(originalBuffer, compressionLevel);
    const finalBuffer = Buffer.from(compressionResult.buffer);
    const originalSize = originalBuffer.length;
    const compressedSize = finalBuffer.length;
    const reductionPercent = Math.max(0, (1 - compressedSize / originalSize) * 100);

    const record = {
      _id: uuidv4(),
      fileName: sanitizeFilename(file.name),
      originalSize,
      compressedSize,
      reductionPercent: Number(reductionPercent.toFixed(1)),
      compressionLevel,
      optimized: compressionResult.optimized,
      message: compressionResult.message,
      checksum: crypto.createHash('sha1').update(originalBuffer).digest('hex'),
      timestamp: new Date().toISOString()
    };

    db.compressions.unshift(record);
    db.compressions = db.compressions.slice(0, 100);

    const analytics = getTodayAnalytics();
    analytics.totalCompressions += 1;
    analytics.totalSizeSaved += Math.max(0, originalSize - compressedSize);

    await saveDb();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="compressed_${sanitizeFilename(file.name)}"`
    );
    res.setHeader('X-Compression-Original-Size', String(originalSize));
    res.setHeader('X-Compression-Compressed-Size', String(compressedSize));
    res.setHeader('X-Compression-Reduction', record.reductionPercent.toFixed(1));
    res.setHeader('X-Compression-Optimized', String(compressionResult.optimized));
    res.setHeader('X-Compression-Message', encodeURIComponent(compressionResult.message));
    res.send(finalBuffer);
  } catch (error) {
    const message =
      error && error.message
        ? error.message
        : 'Unable to process this PDF. Try another file or a lower compression level.';

    res.status(500).json({ success: false, error: message });
  }
});

app.post('/api/compress/estimate', compressionLimiter, async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const file = req.files.file;

    if (file.mimetype !== 'application/pdf') {
      return res.status(400).json({ success: false, error: 'Only PDF files are allowed' });
    }

    const originalBuffer = Buffer.from(file.data);
    const estimates = await estimateCompressionLevels(originalBuffer);

    res.json({
      success: true,
      fileName: sanitizeFilename(file.name),
      originalSize: originalBuffer.length,
      estimates
    });
  } catch (error) {
    const message =
      error && error.message
        ? error.message
        : 'Unable to estimate compression for this PDF.';

    res.status(500).json({ success: false, error: message });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  const validPassword = db.settings.adminPassword || ADMIN_PASSWORD;

  if (email === ADMIN_EMAIL && password === validPassword) {
    return res.json({
      success: true,
      token: ADMIN_TOKEN,
      user: { email, role: 'admin' }
    });
  }

  return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (email === ADMIN_EMAIL) {
    return res.json({ 
      success: true, 
      message: 'If this email is registered, you will receive a reset link (Simulated).' 
    });
  }
  return res.json({ success: true, message: 'If this email is registered, you will receive a reset link.' });
});

app.get('/api/ads', (req, res) => {
  res.json({ success: true, ads: db.adSlots || {} });
});

app.get('/api/admin/ads', authMiddleware, (req, res) => {
  res.json({ success: true, ads: db.adSlots || {} });
});

app.post('/api/admin/ads/save', authMiddleware, async (req, res) => {
  const { position, code } = req.body;
  if (!position) {
    return res.status(400).json({ success: false, error: 'Position is required' });
  }
  
  db.adSlots[position] = code || '';
  await saveDb();
  res.json({ success: true, message: 'Ad updated' });
});

app.put('/api/admin/ads/:id', authMiddleware, async (req, res) => {
  const index = db.ads.findIndex((ad) => ad._id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Ad not found' });
  }

  db.ads[index] = {
    ...db.ads[index],
    ...req.body,
    isActive: req.body.isActive === true || req.body.isActive === 'true',
    updatedAt: new Date().toISOString()
  };

  await saveDb();
  res.json({ success: true, ad: db.ads[index] });
});

app.delete('/api/admin/ads/:id', authMiddleware, async (req, res) => {
  db.ads = db.ads.filter((ad) => ad._id !== req.params.id);
  await saveDb();
  res.json({ success: true, message: 'Ad deleted' });
});

app.post('/api/admin/track-impression', async (req, res) => {
  const ad = db.ads.find((entry) => entry._id === req.body.adId);
  if (ad) {
    ad.impressions += 1;
  }
  getTodayAnalytics().adImpressions += 1;
  await saveDb();
  res.json({ success: true });
});

app.post('/api/admin/track-click', async (req, res) => {
  const ad = db.ads.find((entry) => entry._id === req.body.adId);
  if (ad) {
    ad.clicks += 1;
  }
  getTodayAnalytics().adClicks += 1;
  await saveDb();
  res.json({ success: true });
});

app.get('/api/admin/dashboard', authMiddleware, (req, res) => {
  const totalCompressions = db.compressions.length;
  const totalSizeSaved = db.compressions.reduce(
    (sum, item) => sum + Math.max(0, item.originalSize - item.compressedSize),
    0
  );
  const averageReduction =
    totalCompressions > 0
      ? db.compressions.reduce((sum, item) => sum + Number(item.reductionPercent || 0), 0) /
        totalCompressions
      : 0;

  res.json({
    success: true,
    stats: {
      totalCompressions,
      totalSizeSavedMB: Number((totalSizeSaved / (1024 * 1024)).toFixed(2)),
      monthlyTotal: totalCompressions,
      monthlyAvgReduction: Number(averageReduction.toFixed(1)),
      recentCompressions: db.compressions.slice(0, 10).map(formatCompressionRecord)
    }
  });
});

app.get('/api/admin/analytics', authMiddleware, (req, res) => {
  res.json({ success: true, analytics: db.analytics });
});

app.get('/api/admin/settings', authMiddleware, (req, res) => {
  res.json({ success: true, settings: { logo: db.settings.logo } });
});

app.post('/api/admin/settings', authMiddleware, async (req, res) => {
  if (req.body.adminPassword) {
    db.settings.adminPassword = req.body.adminPassword;
  }
  await saveDb();
  res.json({ success: true, message: 'Settings updated' });
});

app.delete('/api/admin/compressions', authMiddleware, async (req, res) => {
  db.compressions = [];
  await saveDb();
  res.json({ success: true, message: 'Compression history cleared' });
});

app.post('/api/admin/logo', authMiddleware, async (req, res) => {
  if (!req.files || !req.files.logo) {
    return res.status(400).json({ success: false, error: 'No logo file uploaded' });
  }

  const logoFile = req.files.logo;
  const extension = path.extname(logoFile.name);
  const logoName = `logo_${Date.now()}${extension}`;
  const uploadPath = path.join(FRONTEND_DIR, 'uploads', logoName);

  await fs.ensureDir(path.join(FRONTEND_DIR, 'uploads'));
  await logoFile.mv(uploadPath);

  db.settings.logo = `/uploads/${logoName}`;
  await saveDb();

  res.json({ success: true, logoUrl: db.settings.logo });
});

app.get('/api/logo', (req, res) => {
  res.json({ success: true, logo: db.settings.logo });
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`);
});

app.get('/sitemap.xml', (req, res) => {
  const pages = [
    { loc: `${SITE_URL}/`, priority: '1.0' },
    { loc: `${SITE_URL}/compress`, priority: '0.9' },
    { loc: `${SITE_URL}/privacy.html`, priority: '0.3' },
    { loc: `${SITE_URL}/terms.html`, priority: '0.3' },
    { loc: `${SITE_URL}/contact.html`, priority: '0.5' }
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (page) => `  <url>
    <loc>${page.loc}</loc>
    <changefreq>weekly</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  res.type('application/xml').send(xml);
});

app.use(express.static(FRONTEND_DIR));

app.get('/', async (req, res, next) => {
  try {
    await sendRenderedHtml(res, 'index.html', '/');
  } catch (error) {
    next(error);
  }
});

app.get('/compress', async (req, res, next) => {
  try {
    await sendRenderedHtml(res, 'compress.html', '/compress');
  } catch (error) {
    next(error);
  }
});

app.get('/login', async (req, res, next) => {
  try {
    await sendRenderedHtml(res, 'login.html', '/login');
  } catch (error) {
    next(error);
  }
});

app.get('/admin', async (req, res, next) => {
  try {
    await sendRenderedHtml(res, 'admin.html', '/admin');
  } catch (error) {
    next(error);
  }
});

app.get('/privacy.html', async (req, res, next) => {
  try {
    await sendRenderedHtml(res, 'privacy.html', '/privacy.html');
  } catch (error) {
    next(error);
  }
});

app.get('/terms.html', async (req, res, next) => {
  try {
    await sendRenderedHtml(res, 'terms.html', '/terms.html');
  } catch (error) {
    next(error);
  }
});

app.get('/contact.html', async (req, res, next) => {
  try {
    await sendRenderedHtml(res, 'contact.html', '/contact.html');
  } catch (error) {
    next(error);
  }
});

app.use(async (req, res, next) => {
  try {
    await sendRenderedHtml(res, '404.html', req.path, 404);
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  console.error('Unhandled server error:', error);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

async function start() {
  const loadedDb = await loadDb();
  db.ads = loadedDb.ads;
  db.compressions = loadedDb.compressions;
  db.analytics = loadedDb.analytics;
  db.settings = loadedDb.settings;
  db.adSlots = loadedDb.adSlots;

  app.listen(PORT, () => {
    console.log(`PDFCompress Pro listening on http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
