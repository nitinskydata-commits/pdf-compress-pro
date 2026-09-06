const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
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
const nodemailer = require('nodemailer');
const { compressPDF, estimateCompressionLevels, isGhostscriptAvailable, isQpdfAvailable } = require('./utils/pdfOptimizer');

const mongoose = require('mongoose');
const AdSlot = require('./models/AdSlot');
const Analytic = require('./models/Analytic');
const Compression = require('./models/Compression');
const Setting = require('./models/Setting');
const ToolActivity = require('./models/ToolActivity');
const ContactMessage = require('./models/ContactMessage');
const serverless = require('serverless-http');

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const FRONTEND_DIR = path.resolve(__dirname, '..', 'frontend');
const rawEnvEmail = process.env.ADMIN_EMAIL || '';
const DEFAULT_ADMIN_EMAIL = (rawEnvEmail && rawEnvEmail !== 'admin@pdfcompresspro.com')
  ? rawEnvEmail
  : 'support.pdfcompresspro@gmail.com';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';
const JWT_SECRET = process.env.JWT_SECRET || 'pdf-compress-pro-jwt-secret-key-2026';
const MONGODB_URI = process.env.MONGODB_URI;
const SITE_URL = process.env.SITE_URL || 'https://pdfcompressorpro.pages.dev';

// DB Connection Cache & State
let isConnected = false;
let isConnecting = false;
let lastConnectAttempt = 0;
let lastDbError = null;
let standaloneNoticeLogged = false;

function normalizeMongoUri(rawUri) {
  if (!rawUri || typeof rawUri !== 'string') return null;
  let uri = rawUri.trim();

  // Strip accidental outer quotes
  if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
    uri = uri.slice(1, -1).trim();
  }

  // Auto-fix accidental angle brackets around password: :<password>@ -> :password@
  uri = uri.replace(/:<([^>]+)>@/, ':$1@');

  // If URI has user:pass@host but lacks database name before '?' or at the end
  if (uri.includes('@') && uri.includes('://')) {
    const parts = uri.split('?');
    const base = parts[0];
    const query = parts[1] || '';
    
    const afterAt = base.split('@')[1] || '';
    if (!afterAt.includes('/') || afterAt.endsWith('/')) {
      const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
      const params = new URLSearchParams(query);
      if (!params.has('retryWrites')) params.set('retryWrites', 'true');
      if (!params.has('w')) params.set('w', 'majority');
      if (!params.has('authSource')) params.set('authSource', 'admin');
      uri = `${cleanBase}/pdfcompresspro?${params.toString()}`;
    }
  }

  return uri;
}

function getMaskedUri(uri) {
  if (!uri || typeof uri !== 'string') return null;
  try {
    return uri.replace(/\/\/(.*?):(.*?)@/, (_, user, pass) => {
      const maskedUser = user.length > 3 ? `${user.slice(0, 3)}***` : '***';
      const maskedPass = pass.length > 2 ? `${pass.slice(0, 2)}***` : '***';
      return `//${maskedUser}:${maskedPass}@`;
    });
  } catch (_) {
    return 'mongodb+srv://***:***@...';
  }
}

async function connectDB(force = false) {
  if (isConnected) return true;

  const rawUri = process.env.MONGODB_URI;
  if (!rawUri || rawUri.includes('...') || !rawUri.startsWith('mongodb')) {
    if (!standaloneNoticeLogged) {
      console.log('ℹ️ Running in standalone mode (MONGODB_URI is not set or empty).');
      standaloneNoticeLogged = true;
    }
    return false;
  }

  if (isConnecting) return false;
  if (!force && Date.now() - lastConnectAttempt < 10000) return false; // 10s cooldown between auto retries

  isConnecting = true;
  lastConnectAttempt = Date.now();

  const finalUri = normalizeMongoUri(rawUri);

  try {
    await mongoose.connect(finalUri, {
      serverSelectionTimeoutMS: 6000 // 6s timeout
    });
    isConnected = true;
    lastDbError = null;
    console.log(`✅ MongoDB Connected successfully to database: ${mongoose.connection.name || 'default'}`);
    await initializeDbDefaults();
    return true;
  } catch (error) {
    lastDbError = error.message || String(error);
    if (!standaloneNoticeLogged) {
      console.warn('⚠️ MongoDB connection unavailable, running in standalone mode:', lastDbError);
      standaloneNoticeLogged = true;
    }
    return false;
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

    const smtpRecord = await Setting.findOne({ key: 'smtpConfig' });
    if (smtpRecord && smtpRecord.value) {
      memorySettings.smtpConfig = smtpRecord.value;
    }

    const emailRecord = await Setting.findOne({ key: 'adminEmail' });
    if (emailRecord && emailRecord.value) {
      memorySettings.adminEmail = emailRecord.value;
    }

    const requiredSlots = [
      // All Tools Global Slots
      { id: 'global-tool-top', label: 'All Tools: Above Interface Banner', category: 'All Tools' },
      { id: 'global-tool-bottom', label: 'All Tools: Below Result Banner', category: 'All Tools' },
      // Suite Categories
      { id: 'pdf-suite-banner', label: 'PDF Suite: Header Placement', category: 'PDF Suite' },
      { id: 'image-suite-banner', label: 'Image Suite: Banner Placement', category: 'Image Suite' },
      { id: 'calc-suite-banner', label: 'Calculators: Banner Placement', category: 'Calculators' },
      { id: 'dev-suite-banner', label: 'Dev Tools: Banner Placement', category: 'Dev Tools' },
      // Home Page
      { id: 'home-hero', label: 'Home Page: After Welcome', category: 'Home Page' },
      { id: 'home-features', label: 'Home Page: Features Area', category: 'Home Page' },
      { id: 'home-faq', label: 'Home Page: FAQ Section', category: 'Home Page' },
      { id: 'home-footer', label: 'Home Page: Footer Banner', category: 'Home Page' },
      // Compress Page
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

app.get('/api/health', async (req, res) => {
  const gsAvailable = await isGhostscriptAvailable();
  const qpdfAvailable = await isQpdfAvailable();

  // If not yet connected and MONGODB_URI is present, attempt connect
  if (!isConnected && process.env.MONGODB_URI) {
    await connectDB(true);
  }

  const rawUri = process.env.MONGODB_URI;
  const maskedUri = getMaskedUri(normalizeMongoUri(rawUri));

  res.json({
    success: true,
    uptime: Math.round(process.uptime()),
    database: isConnected ? 'connected' : 'standalone',
    databaseDetails: {
      connected: isConnected,
      uriProvided: Boolean(rawUri),
      maskedUri: maskedUri || null,
      error: isConnected ? null : (lastDbError || (rawUri ? 'Connecting...' : 'MONGODB_URI not configured'))
    },
    engines: {
      ghostscript: gsAvailable,
      qpdf: qpdfAvailable,
      nodePdfLib: true
    },
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

// Lightweight Concurrency Limiter: bounds simultaneous CPU/memory heavy compression
function createConcurrencyLimiter(maxConcurrent = 2) {
  let active = 0;
  const queue = [];

  return function run(task) {
    return new Promise((resolve, reject) => {
      const execute = async () => {
        active++;
        try {
          const res = await task();
          resolve(res);
        } catch (err) {
          reject(err);
        } finally {
          active--;
          if (queue.length > 0) {
            const next = queue.shift();
            next();
          }
        }
      };

      if (active < maxConcurrent) {
        execute();
      } else {
        queue.push(execute);
      }
    });
  };
}

const compressionQueue = createConcurrencyLimiter(2);

app.post('/api/compress', compressionLimiter, async (req, res) => {
  if (!req.files || (!req.files.file && !req.files.pdfFile)) {
    return res.status(400).json({ success: false, error: 'No PDF file detected. Please select a PDF file to compress.' });
  }

  const pdfFile = req.files.pdfFile || req.files.file;
  const level = req.body.compressionLevel || req.body.level || 'medium';
  const targetSizeKb = Number(req.body.targetSizeKb || req.body.targetKb) || null;
  const inputSource = pdfFile.tempFilePath || pdfFile.data;

  try {
    if (!checkIsPDF(pdfFile)) {
      return res.status(400).json({ success: false, error: 'The uploaded file is not a valid PDF document.' });
    }

    // Run compression inside the concurrency limiter (max 2 parallel on Render free tier)
    const result = await compressionQueue(() => compressPDF(inputSource, level, targetSizeKb));
    const originalSize = pdfFile.size;
    const compressedSize = result.buffer.length;
    const reduction = originalSize > 0
      ? Math.max(0, ((originalSize - compressedSize) / originalSize) * 100)
      : 0;

    // Asynchronous non-blocking database recording (does not delay client response)
    if (isConnected) {
      Compression.create({
        originalName: sanitizeFilename(pdfFile.name),
        fileName: sanitizeFilename(pdfFile.name),
        originalSize,
        compressedSize,
        reductionPercent: Number(reduction.toFixed(1)),
        level: targetSizeKb ? `target${targetSizeKb}` : level,
        method: result.message,
        optimized: result.optimized
      }).catch((dbErr) => console.warn('DB compression record notice:', dbErr.message));

      getTodayAnalytics()
        .then((analytics) => {
          if (analytics && analytics.save) {
            analytics.totalCompressions++;
            analytics.totalSizeSaved += Math.max(0, originalSize - compressedSize);
            return analytics.save();
          }
        })
        .catch((aErr) => console.warn('DB analytics record notice:', aErr.message));
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="compressed_${sanitizeFilename(pdfFile.name)}"`);
    
    // Custom response statistics headers
    res.setHeader('X-Compression-Original-Size', originalSize.toString());
    res.setHeader('X-Compression-Compressed-Size', compressedSize.toString());
    res.setHeader('X-Compression-Reduction', reduction.toFixed(1));
    res.setHeader('X-Compression-Optimized', result.optimized.toString());
    res.setHeader('X-Compression-Message', encodeURIComponent(result.message));
    res.setHeader('X-Compression-Target-Size', targetSizeKb ? targetSizeKb.toString() : '');
    res.setHeader('X-Compression-Target-Met', result.targetMet !== undefined ? result.targetMet.toString() : (targetSizeKb ? (compressedSize <= targetSizeKb * 1024).toString() : ''));
    res.setHeader('Access-Control-Expose-Headers', 'X-Compression-Original-Size, X-Compression-Compressed-Size, X-Compression-Reduction, X-Compression-Optimized, X-Compression-Message, X-Compression-Target-Size, X-Compression-Target-Met');

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

// Rate limiter specifically for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 20, // max 20 requests per 15 min window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again after 15 minutes.' }
});

// In-Memory OTP Store
const otpStore = new Map();

function maskEmail(email) {
  if (!email || !email.includes('@')) return 'admin@***';
  const [user, domain] = email.split('@');
  const visible = user.length > 2 ? user.slice(0, 3) : user.slice(0, 1);
  return `${visible}***@${domain}`;
}

function isAuthorizedAdminEmail(inputEmail, targetEmail) {
  const clean = String(inputEmail || '').trim().toLowerCase();
  const cleanTarget = String(targetEmail || '').trim().toLowerCase();
  if (clean === 'admin@pdfcompresspro.com') return false;
  return clean === cleanTarget || clean === 'support.pdfcompresspro@gmail.com' || clean === 'nitinsaini45903@gmail.com';
}

async function getEffectiveAdminCredentials() {
  let targetEmail = memorySettings.adminEmail || DEFAULT_ADMIN_EMAIL;
  if (targetEmail === 'admin@pdfcompresspro.com') {
    targetEmail = DEFAULT_ADMIN_EMAIL;
    memorySettings.adminEmail = DEFAULT_ADMIN_EMAIL;
  }
  let storedPassword = memorySettings.adminPassword || DEFAULT_ADMIN_PASSWORD;

  if (isConnected) {
    try {
      const emailRecord = await Setting.findOne({ key: 'adminEmail' });
      if (emailRecord && emailRecord.value) {
        if (emailRecord.value === 'admin@pdfcompresspro.com') {
          targetEmail = DEFAULT_ADMIN_EMAIL;
          await Setting.updateOne({ key: 'adminEmail' }, { value: DEFAULT_ADMIN_EMAIL });
        } else {
          targetEmail = emailRecord.value;
        }
      }
      const passRecord = await Setting.findOne({ key: 'adminPassword' });
      if (passRecord && passRecord.value) {
        storedPassword = passRecord.value;
      }
    } catch (_) {}
  }

  return { targetEmail, storedPassword };
}

async function getSmtpConfig() {
  let config = memorySettings.smtpConfig || null;
  if (isConnected) {
    try {
      const smtpRecord = await Setting.findOne({ key: 'smtpConfig' });
      if (smtpRecord && smtpRecord.value) {
        config = smtpRecord.value;
      }
    } catch (_) {}
  }

  // Fallback to environment variables
  if (!config || !config.user) {
    const user = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.GMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;
    if (user && pass) {
      config = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 465,
        user,
        pass,
        secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465
      };
    }
  }

  return config;
}

async function sendCoreEmail({ toEmail, subject, htmlBody, textBody, customConfig = null }) {
  const smtp = customConfig || await getSmtpConfig();

  if (!smtp || !smtp.user || !smtp.pass) {
    console.log(`ℹ️ SMTP/Email API not configured yet. Email dispatch skipped.`);
    return { sent: false, reason: 'SMTP / Email API credentials are not configured yet.' };
  }

  const passStr = String(smtp.pass || '').trim();
  const isResend = smtp.provider === 'resend' || passStr.startsWith('re_');
  const isBrevo = smtp.provider === 'brevo' || passStr.startsWith('xkeysib-');

  // 1. HTTP API: Resend (Port 443 — Unblocked on Render Free Tier)
  if (isResend) {
    try {
      const fromAddr = (smtp.user && smtp.user.includes('@') && !smtp.user.includes('@gmail.com'))
        ? `PDFCompress Pro <${smtp.user.trim()}>`
        : 'PDFCompress Pro <onboarding@resend.dev>';

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${passStr}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromAddr,
          to: [toEmail],
          subject,
          text: textBody,
          html: htmlBody
        })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.id) {
        console.log(`✅ [RESEND EMAIL SENT] Id: ${data.id} to ${toEmail}`);
        return { sent: true, messageId: data.id };
      } else {
        const msg = data.message || 'Resend HTTP API failed';
        console.error('⚠️ [RESEND ERROR]:', msg);

        // Resend Sandbox limitation auto-routing:
        const match = msg.match(/testing emails to your own email address \(([^)]+)\)/i);
        if (match && match[1]) {
          const allowedEmail = match[1].trim().toLowerCase();
          console.log(`🔄 Auto-routing to Resend account email: ${allowedEmail}...`);
          try {
            const retryRes = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${passStr}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                from: fromAddr,
                to: [allowedEmail],
                subject,
                text: textBody,
                html: htmlBody
              })
            });
            const retryData = await retryRes.json().catch(() => ({}));
            if (retryRes.ok && retryData.id) {
              console.log(`✅ [RESEND DELIVERED] to registered account: ${allowedEmail}`);
              return {
                sent: true,
                messageId: retryData.id,
                deliveredTo: allowedEmail,
                notice: `Delivered to your Resend account email (${allowedEmail})! In Admin Settings, update "Authorized Administrator Email" to ${allowedEmail} so your login OTPs always go there (or verify your domain at resend.com/domains).`
              };
            }
          } catch (_) {}
        }

        return { sent: false, error: `Resend: ${msg}` };
      }
    } catch (e) {
      console.error('⚠️ [RESEND NETWORK ERROR]:', e.message);
      return { sent: false, error: 'Resend connection error: ' + e.message };
    }
  }

  // 2. HTTP API: Brevo (Port 443 — Unblocked on Render Free Tier)
  if (isBrevo) {
    try {
      const senderEmail = (smtp.user && smtp.user.includes('@')) ? smtp.user.trim() : 'support.pdfcompresspro@gmail.com';
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': passStr,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'PDFCompress Pro Security', email: senderEmail },
          to: [{ email: toEmail }],
          subject,
          textContent: textBody,
          htmlContent: htmlBody
        })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && (data.messageId || data.id)) {
        console.log(`✅ [BREVO EMAIL SENT] Id: ${data.messageId || data.id} to ${toEmail}`);
        return { sent: true, messageId: data.messageId || data.id };
      } else {
        const msg = data.message || 'Brevo HTTP API failed';
        console.error('⚠️ [BREVO ERROR]:', msg);
        return { sent: false, error: `Brevo error: ${msg}` };
      }
    } catch (e) {
      console.error('⚠️ [BREVO NETWORK ERROR]:', e.message);
      return { sent: false, error: 'Brevo connection error: ' + e.message };
    }
  }

  // 3. SMTP Transporter (for VPS, localhost, or Render Starter / Paid Tier)
  try {
    const isGmail = (smtp.host && smtp.host.toLowerCase().includes('gmail')) || (smtp.user && smtp.user.toLowerCase().includes('@gmail.com'));
    const isExplicit587 = Number(smtp.port) === 587;
    const isSecure = smtp.secure !== undefined ? Boolean(smtp.secure) : (!isExplicit587);

    const transportOpts = (isGmail && !isExplicit587) ? {
      service: 'gmail',
      family: 4,
      auth: {
        user: smtp.user,
        pass: smtp.pass
      },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      greetingTimeout: 6000,
      socketTimeout: 15000
    } : {
      host: smtp.host || (isGmail ? 'smtp.gmail.com' : 'smtp.gmail.com'),
      port: Number(smtp.port) || (isSecure ? 465 : 587),
      secure: isSecure,
      family: 4,
      auth: {
        user: smtp.user,
        pass: smtp.pass
      },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      greetingTimeout: 6000,
      socketTimeout: 15000
    };

    let transporter = nodemailer.createTransport(transportOpts);

    const mailOptions = {
      from: `"PDFCompress Pro" <${smtp.user}>`,
      to: toEmail,
      subject,
      text: textBody,
      html: htmlBody
    };

    let info;
    try {
      info = await transporter.sendMail(mailOptions);
    } catch (primaryErr) {
      // If port 465 timed out or had an unreachable/socket issue, auto-fallback to port 587 (TLS)
      const errStr = (primaryErr.message || '').toLowerCase();
      if ((primaryErr.code === 'ETIMEDOUT' || primaryErr.code === 'ESOCKET' || primaryErr.code === 'ENETUNREACH' || errStr.includes('timeout') || errStr.includes('socket') || errStr.includes('unreach')) && !isExplicit587) {
        console.warn('⚠️ Port 465 error. Attempting automatic fallback to smtp.gmail.com:587 (IPv4 TLS)...');
        const fallbackTransporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          family: 4,
          auth: {
            user: smtp.user,
            pass: smtp.pass
          },
          tls: { rejectUnauthorized: false },
          connectionTimeout: 10000,
          greetingTimeout: 6000,
          socketTimeout: 15000
        });
        info = await fallbackTransporter.sendMail(mailOptions);
      } else {
        throw primaryErr;
      }
    }

    console.log(`✅ [EMAIL SENT] MessageId: ${info.messageId} to ${toEmail}`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    let friendlyError = err.message || 'Unknown SMTP error';
    const lower = friendlyError.toLowerCase();
    if (err.code === 'EAUTH' || lower.includes('invalid login') || lower.includes('username and password not accepted') || lower.includes('badcredentials')) {
      friendlyError = 'SMTP Authentication failed. For Gmail, you MUST use a 16-character Google App Password (not your standard Gmail account password). Visit: Google Account > Security > 2-Step Verification > App passwords.';
    } else if (err.code === 'ETIMEDOUT' || lower.includes('timeout') || err.code === 'esocket') {
      friendlyError = `Connection to ${smtp.host || 'SMTP host'}:${smtp.port || 465} timed out. Render's Free tier blocks outbound SMTP ports 25, 465, and 587. To send emails on Render Free tier, paste a free Resend API key (resend.com) into the password field, or upgrade Render to Starter ($7/mo).`;
    } else if (err.code === 'ENETUNREACH' || lower.includes('enetunreach') || lower.includes('unreach')) {
      friendlyError = `Network route unreachable to ${smtp.host || 'SMTP host'} (${err.message}). IPv4 connection routing forced.`;
    } else if (err.code === 'ECONNREFUSED') {
      friendlyError = `Connection refused by ${smtp.host}:${smtp.port}. Please check your SMTP host and port number.`;
    }
    console.error('⚠️ [EMAIL SEND ERROR]:', friendlyError, `(Raw: ${err.message})`);
    return { sent: false, error: friendlyError };
  }
}

async function sendOtpEmail(toEmail, otpCode, customConfig = null) {
  console.log(`\n========================================`);
  console.log(`🔐 [ADMIN OTP DISPATCH] Code: [ ${otpCode} ] -> To: ${toEmail}`);
  console.log(`⏳ Valid for 10 minutes`);
  console.log(`========================================\n`);

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 12px; background: #2563eb; color: #ffffff; font-weight: 900; font-size: 20px;">P</div>
        <h2 style="color: #0f172a; margin: 12px 0 4px; font-size: 20px; font-weight: 800;">Admin Verification Code</h2>
        <p style="color: #64748b; font-size: 13px; margin: 0;">PDFCompress Pro Admin Portal</p>
      </div>
      <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
        A login attempt was initiated for your administrator account. Use the one-time code below to complete sign-in:
      </p>
      <div style="background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 14px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <span style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #2563eb; display: inline-block;">
          ${otpCode}
        </span>
      </div>
      <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin-bottom: 8px;">
        ⏳ This code will expire in <strong>10 minutes</strong>.
      </p>
      <p style="color: #94a3b8; font-size: 11px; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px;">
        If you did not request this login attempt, please check your credentials immediately.
      </p>
    </div>
  `;

  return sendCoreEmail({
    toEmail,
    subject: `🔐 Your Admin Verification Code: ${otpCode}`,
    htmlBody,
    textBody: `Your PDFCompress Pro Admin one-time verification code is: ${otpCode}. It expires in 10 minutes.`,
    customConfig
  });
}

async function sendContactNotificationEmail({ name, email, subject, message, ip, userAgent }) {
  const { targetEmail } = await getEffectiveAdminCredentials();
  const recipient = (targetEmail && targetEmail !== 'admin@pdfcompresspro.com') ? targetEmail : 'nitinsaini45903@gmail.com';

  console.log(`\n========================================`);
  console.log(`📬 [CONTACT INQUIRY DISPATCH] From: ${name} <${email}> -> To Admin: ${recipient}`);
  console.log(`========================================\n`);

  const cleanName = String(name || '').replace(/</g, '&lt;');
  const cleanEmail = String(email || '').replace(/</g, '&lt;');
  const cleanSubject = String(subject || 'General Support Inquiry').replace(/</g, '&lt;');
  const cleanMsg = String(message || '').replace(/</g, '&lt;');
  const cleanIp = String(ip || 'Not provided').replace(/</g, '&lt;');
  const cleanUa = String(userAgent || 'Not provided').replace(/</g, '&lt;');

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px;">
      <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 20px;">
        <div style="display: inline-block; width: 40px; height: 40px; line-height: 40px; text-align: center; border-radius: 12px; background: #2563eb; color: #ffffff; font-weight: 900; font-size: 18px;">P</div>
        <h2 style="color: #0f172a; margin: 12px 0 2px; font-size: 18px; font-weight: 800;">New Contact Form Message</h2>
        <p style="color: #64748b; font-size: 12px; margin: 0;">PDFCompress Pro Support Portal</p>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; margin-bottom: 20px;">
        <table style="width: 100%; font-size: 13px; color: #334155;" cellpadding="4">
          <tr>
            <td style="font-weight: 700; width: 110px; color: #64748b;">Sender Name:</td>
            <td style="font-weight: 700; color: #0f172a;">${cleanName}</td>
          </tr>
          <tr>
            <td style="font-weight: 700; color: #64748b;">Sender Email:</td>
            <td><a href="mailto:${cleanEmail}" style="color: #2563eb; font-weight: 600; text-decoration: none;">${cleanEmail}</a></td>
          </tr>
          <tr>
            <td style="font-weight: 700; color: #64748b;">Topic / Subject:</td>
            <td style="font-weight: 600; color: #0f172a;">${cleanSubject}</td>
          </tr>
          <tr>
            <td style="font-weight: 700; color: #64748b;">Date & Time:</td>
            <td style="color: #64748b;">${new Date().toLocaleString()}</td>
          </tr>
          <tr>
            <td style="font-weight: 700; color: #64748b;">Sender IP:</td>
            <td style="color: #64748b; font-family: monospace; font-size: 12px;">${cleanIp}</td>
          </tr>
          <tr>
            <td style="font-weight: 700; color: #64748b;">Device / UA:</td>
            <td style="color: #64748b; font-size: 11px; word-break: break-all;">${cleanUa}</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 24px;">
        <p style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 8px;">User Message:</p>
        <div style="background-color: #f1f5f9; border-left: 4px solid #2563eb; padding: 16px; border-radius: 0 12px 12px 0; font-size: 14px; line-height: 1.6; color: #1e293b; white-space: pre-wrap; font-family: inherit;">${cleanMsg}</div>
      </div>

      <div style="text-align: center; padding-top: 16px; border-top: 1px solid #f1f5f9; display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
        <a href="mailto:${cleanEmail}?subject=Re: ${encodeURIComponent(cleanSubject)}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; border-radius: 12px;">
          ✉️ Direct Reply to ${cleanName}
        </a>
        <a href="${SITE_URL}/admin/messages" style="display: inline-block; padding: 12px 24px; background: #f1f5f9; color: #1e293b; text-decoration: none; font-weight: 700; font-size: 13px; border-radius: 12px; border: 1px solid #cbd5e1;">
          📬 Open Admin Inbox
        </a>
      </div>
    </div>
  `;

  return sendCoreEmail({
    toEmail: recipient,
    subject: `📬 New Support Message from ${cleanName}: "${cleanSubject}"`,
    htmlBody,
    textBody: `New Message from ${cleanName} (${cleanEmail})\n\nSubject: ${cleanSubject}\nDate: ${new Date().toLocaleString()}\nSender IP: ${cleanIp}\nDevice: ${cleanUa}\n\nMessage:\n${cleanMsg}\n\nReply directly to: ${cleanEmail}\nAdmin Inbox: ${SITE_URL}/admin/messages`
  });
}

// Request OTP with Email + Password
app.post('/api/auth/request-otp', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const { targetEmail, storedPassword } = await getEffectiveAdminCredentials();

    if (!isAuthorizedAdminEmail(email, targetEmail)) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    let isValid = false;
    if (storedPassword && typeof storedPassword === 'string' && storedPassword.startsWith('$2')) {
      isValid = await bcrypt.compare(password, storedPassword);
    } else {
      isValid = (password === storedPassword);
    }

    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    // Generate 6-digit numeric OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const destinationEmail = (targetEmail || email.trim()).toLowerCase();

    const otpRecord = {
      email: destinationEmail,
      otpHash,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes window
      attempts: 0,
      createdAt: Date.now()
    };

    // 1. In-memory map
    otpStore.set(destinationEmail, otpRecord);

    // 2. Persistent settings file (survives container spin-downs & restarts)
    memorySettings.activeOtp = otpRecord;
    try {
      fs.outputJsonSync(SETTINGS_FILE, memorySettings);
    } catch (_) {}

    // 3. Database persistence
    if (isConnected) {
      try {
        await Setting.updateOne({ key: 'active_admin_otp' }, { value: otpRecord }, { upsert: true });
      } catch (_) {}
    }

    const sendResult = await sendOtpEmail(destinationEmail, otp);

    return res.json({
      success: true,
      message: sendResult.sent
        ? `A 6-digit verification code was sent to ${maskEmail(destinationEmail)}`
        : `Code generated for ${maskEmail(destinationEmail)}. Notice: ${sendResult.error || sendResult.reason || 'Email delivery issue. Check server logs or configure SMTP in Settings.'}`,
      step: 'OTP_REQUIRED',
      email: destinationEmail,
      maskedEmail: maskEmail(destinationEmail),
      emailDispatched: Boolean(sendResult.sent)
    });
  } catch (err) {
    console.error('Error requesting OTP:', err);
    res.status(500).json({ success: false, message: 'Failed to process login request' });
  }
});

// Verify OTP to obtain signed JWT
app.post('/api/auth/verify-otp', authLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (!otp) {
      return res.status(400).json({ success: false, message: 'Verification code is required' });
    }

    const cleanOtp = String(otp).trim().replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      return res.status(400).json({ success: false, message: 'Verification code must be 6 digits' });
    }

    const { targetEmail } = await getEffectiveAdminCredentials();
    const cleanEmail = String(email || targetEmail || '').trim().toLowerCase();

    // Look up OTP record across: 1. Memory Store -> 2. Persistent File -> 3. MongoDB -> 4. Active Fallback
    let record = otpStore.get(cleanEmail);

    if (!record && memorySettings.activeOtp) {
      const fileRec = memorySettings.activeOtp;
      if (fileRec.email === cleanEmail || cleanEmail === targetEmail.toLowerCase() || isAuthorizedAdminEmail(cleanEmail, targetEmail)) {
        record = fileRec;
      }
    }

    if (!record && isConnected) {
      try {
        const dbRecord = await Setting.findOne({ key: 'active_admin_otp' });
        if (dbRecord && dbRecord.value) {
          record = dbRecord.value;
        }
      } catch (_) {}
    }

    // Ultimate fallback: if only one active admin OTP exists and is unexpired, use it
    if (!record) {
      for (const [_, rec] of otpStore.entries()) {
        if (rec && Date.now() <= rec.expiresAt) {
          record = rec;
          break;
        }
      }
      if (!record && memorySettings.activeOtp && Date.now() <= memorySettings.activeOtp.expiresAt) {
        record = memorySettings.activeOtp;
      }
    }

    if (!record) {
      return res.status(401).json({ success: false, message: 'No active OTP session found or code expired. Please request a new code.' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(cleanEmail);
      delete memorySettings.activeOtp;
      try { fs.outputJsonSync(SETTINGS_FILE, memorySettings); } catch (_) {}
      if (isConnected) {
        try { await Setting.deleteOne({ key: 'active_admin_otp' }); } catch (_) {}
      }
      return res.status(401).json({ success: false, message: 'Verification code has expired. Please request a new one.' });
    }

    if (record.attempts >= 5) {
      otpStore.delete(cleanEmail);
      delete memorySettings.activeOtp;
      try { fs.outputJsonSync(SETTINGS_FILE, memorySettings); } catch (_) {}
      if (isConnected) {
        try { await Setting.deleteOne({ key: 'active_admin_otp' }); } catch (_) {}
      }
      return res.status(401).json({ success: false, message: 'Too many incorrect attempts. Please request a new code.' });
    }

    const isMatch = await bcrypt.compare(cleanOtp, record.otpHash);
    if (!isMatch) {
      record.attempts = (record.attempts || 0) + 1;
      if (memorySettings.activeOtp) {
        memorySettings.activeOtp.attempts = record.attempts;
        try { fs.outputJsonSync(SETTINGS_FILE, memorySettings); } catch (_) {}
      }
      if (isConnected) {
        try { await Setting.updateOne({ key: 'active_admin_otp' }, { value: record }); } catch (_) {}
      }
      const remaining = 5 - record.attempts;
      return res.status(401).json({
        success: false,
        message: `Incorrect code. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.`
      });
    }

    // Success - invalidate used OTP across all stores
    otpStore.delete(cleanEmail);
    delete memorySettings.activeOtp;
    try { fs.outputJsonSync(SETTINGS_FILE, memorySettings); } catch (_) {}
    if (isConnected) {
      try { await Setting.deleteOne({ key: 'active_admin_otp' }); } catch (_) {}
    }

    const tokenEmail = record.email || cleanEmail || targetEmail;
    const token = jwt.sign(
      { email: tokenEmail, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      token,
      user: { email: tokenEmail, role: 'admin' }
    });
  } catch (err) {
    console.error('Error verifying OTP:', err);
    res.status(500).json({ success: false, message: 'Failed to verify code' });
  }
});

// Resend OTP
app.post('/api/auth/resend-otp', authLimiter, async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const existing = otpStore.get(cleanEmail);

    if (existing && Date.now() - existing.createdAt < 45000) {
      const waitSeconds = Math.ceil((45000 - (Date.now() - existing.createdAt)) / 1000);
      return res.status(429).json({ success: false, message: `Please wait ${waitSeconds}s before requesting a new code.` });
    }

    const { targetEmail } = await getEffectiveAdminCredentials();
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const destinationEmail = targetEmail || cleanEmail;

    otpStore.set(destinationEmail.toLowerCase(), {
      otpHash,
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
      createdAt: Date.now()
    });

    const sendResult = await sendOtpEmail(destinationEmail, otp);

    return res.json({
      success: true,
      message: sendResult.sent
        ? `A fresh verification code was sent to ${maskEmail(destinationEmail)}`
        : `Fresh code generated for ${maskEmail(destinationEmail)}. Notice: ${sendResult.error || sendResult.reason || 'Email delivery issue.'}`,
      maskedEmail: maskEmail(destinationEmail),
      emailDispatched: Boolean(sendResult.sent)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to resend code' });
  }
});

// Verify active session token
app.get('/api/auth/verify', authMiddleware, (req, res) => {
  res.json({ success: true, user: req.user });
});

// Dual-action login endpoint (supports request OTP or direct OTP verification)
app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { otp, email, password } = req.body || {};
  if (otp) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const record = otpStore.get(cleanEmail);
    if (!record || Date.now() > record.expiresAt) {
      return res.status(401).json({ success: false, message: 'OTP expired. Please request a new code.' });
    }
    const isMatch = await bcrypt.compare(String(otp).trim(), record.otpHash);
    if (!isMatch) {
      record.attempts = (record.attempts || 0) + 1;
      return res.status(401).json({ success: false, message: 'Invalid OTP code' });
    }
    otpStore.delete(cleanEmail);
    const token = jwt.sign({ email: cleanEmail, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ success: true, token, user: { email: cleanEmail, role: 'admin' } });
  }

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const { targetEmail, storedPassword } = await getEffectiveAdminCredentials();
  if (!isAuthorizedAdminEmail(email, targetEmail)) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  let isValid = false;
  if (storedPassword && typeof storedPassword === 'string' && storedPassword.startsWith('$2')) {
    isValid = await bcrypt.compare(password, storedPassword);
  } else {
    isValid = (password === storedPassword);
  }

  if (!isValid) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const newOtp = crypto.randomInt(100000, 999999).toString();
  const otpHash = await bcrypt.hash(newOtp, 10);
  const destinationEmail = targetEmail || email.trim().toLowerCase();

  otpStore.set(destinationEmail.toLowerCase(), {
    otpHash,
    expiresAt: Date.now() + 10 * 60 * 1000,
    attempts: 0,
    createdAt: Date.now()
  });

  const sendResult = await sendOtpEmail(destinationEmail, newOtp);

  return res.json({
    success: true,
    step: 'OTP_REQUIRED',
    message: sendResult.sent
      ? `Verification code sent to ${maskEmail(destinationEmail)}`
      : `Code generated for ${maskEmail(destinationEmail)}. Notice: ${sendResult.error || sendResult.reason || 'Email delivery issue.'}`,
    email: destinationEmail,
    maskedEmail: maskEmail(destinationEmail),
    emailDispatched: Boolean(sendResult.sent)
  });
});

app.get('/api/ads', async (req, res) => {
  try {
    res.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=600');
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

let memoryToolActivities = [];

// Track tool usage telemetry across all 22 tools
app.post('/api/telemetry/event', async (req, res) => {
  try {
    const { toolId, toolName, category, action, details, originalSize, compressedSize, sizeSaved, reductionPercent, method } = req.body;
    const record = {
      id: req.body.id || ('act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)),
      toolId: toolId || 'unknown',
      toolName: toolName || 'Tool',
      category: category || 'utility',
      action: action || 'Tool executed',
      details: details || '',
      originalSize: Number(originalSize) || 0,
      compressedSize: Number(compressedSize) || 0,
      sizeSaved: Number(sizeSaved) || 0,
      reductionPercent: Number(reductionPercent) || 0,
      method: method || 'client',
      timestamp: req.body.timestamp ? new Date(req.body.timestamp) : new Date()
    };

    memoryToolActivities.unshift(record);
    if (memoryToolActivities.length > 500) memoryToolActivities.length = 500;

    if (isConnected) {
      await ToolActivity.create(record).catch(() => {});
    }

    res.json({ success: true });
  } catch (_) {
    res.json({ success: true });
  }
});

app.get('/api/admin/dashboard', authMiddleware, async (req, res) => {
  try {
    let dbActivities = [];
    let dbCompressions = [];

    if (isConnected) {
      dbCompressions = await Compression.find().sort({ createdAt: -1 }).limit(50);
      dbActivities = await ToolActivity.find().sort({ createdAt: -1 }).limit(100);
    }

    // Merge memory events with DB events for real-time visibility
    const allRecent = [...memoryToolActivities];
    for (const d of dbActivities) {
      if (!allRecent.some(r => r.id === d._id?.toString() || r.id === d.id)) {
        allRecent.push({
          id: d._id?.toString(),
          toolId: d.toolId,
          toolName: d.toolName,
          category: d.category,
          action: d.action,
          details: d.details,
          originalSize: d.originalSize,
          compressedSize: d.compressedSize,
          sizeSaved: d.sizeSaved,
          reductionPercent: d.reductionPercent,
          method: d.method,
          timestamp: d.timestamp || d.createdAt
        });
      }
    }
    for (const c of dbCompressions) {
      allRecent.push({
        id: c._id?.toString(),
        toolId: 'pdf-compressor',
        toolName: 'PDF Compressor',
        category: 'pdf',
        action: `Compressed ${c.originalName || c.fileName}`,
        details: `Saved ${(Math.max(0, (c.originalSize || 0) - (c.compressedSize || 0)) / 1024).toFixed(1)} KB`,
        originalSize: c.originalSize,
        compressedSize: c.compressedSize,
        sizeSaved: Math.max(0, (c.originalSize || 0) - (c.compressedSize || 0)),
        reductionPercent: c.reductionPercent,
        method: c.method || (c.optimized ? 'Ghostscript' : 'PDF-Lib'),
        timestamp: c.timestamp || c.createdAt
      });
    }

    // Sort by timestamp descending
    allRecent.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Calculate totals
    const toolBreakdown = {};
    let totalSavedBytes = 0;
    let totalReductions = 0;
    let reductionCount = 0;

    for (const ev of allRecent) {
      toolBreakdown[ev.toolId] = (toolBreakdown[ev.toolId] || 0) + 1;
      if (ev.sizeSaved && ev.sizeSaved > 0) totalSavedBytes += ev.sizeSaved;
      if (ev.reductionPercent && Number(ev.reductionPercent) > 0) {
        totalReductions += Number(ev.reductionPercent);
        reductionCount++;
      }
    }

    const totalCount = allRecent.length;
    const avgReduction = reductionCount > 0 ? Number((totalReductions / reductionCount).toFixed(1)) : 0;

    res.json({
      success: true,
      stats: {
        totalOperations: totalCount,
        totalCompressions: (toolBreakdown['pdf-compressor'] || 0) + (toolBreakdown['image-compressor'] || 0),
        totalSizeSavedMB: Number((totalSavedBytes / (1024 * 1024)).toFixed(2)),
        monthlyTotal: totalCount,
        monthlyAvgReduction: avgReduction,
        toolBreakdown,
        recentActivity: allRecent.slice(0, 30),
        recentCompressions: allRecent.slice(0, 15)
      }
    });
  } catch (err) {
    res.json({
      success: true,
      stats: {
        totalOperations: 0,
        totalCompressions: 0,
        totalSizeSavedMB: 0,
        monthlyTotal: 0,
        monthlyAvgReduction: 0,
        toolBreakdown: {},
        recentActivity: [],
        recentCompressions: []
      }
    });
  }
});

app.get('/api/admin/compressions', authMiddleware, async (req, res) => {
  try {
    const { toolId, category } = req.query;
    let activities = [...memoryToolActivities];

    if (isConnected) {
      const query = {};
      if (toolId && toolId !== 'all') query.toolId = toolId;
      if (category && category !== 'all') query.category = category;

      const dbActs = await ToolActivity.find(query).sort({ createdAt: -1 }).limit(100);
      for (const d of dbActs) {
        if (!activities.some(a => a.id === d._id?.toString() || a.id === d.id)) {
          activities.push(d);
        }
      }

      if (!toolId || toolId === 'all' || toolId === 'pdf-compressor') {
        const dbComps = await Compression.find().sort({ createdAt: -1 }).limit(50);
        for (const c of dbComps) {
          activities.push({
            id: c._id?.toString(),
            toolId: 'pdf-compressor',
            toolName: 'PDF Compressor',
            category: 'pdf',
            action: `Compressed ${c.originalName || c.fileName}`,
            fileName: c.originalName || c.fileName,
            originalSize: c.originalSize,
            compressedSize: c.compressedSize,
            reductionPercent: c.reductionPercent,
            level: c.level,
            method: c.method || (c.optimized ? 'Ghostscript' : 'PDF-Lib'),
            timestamp: c.timestamp || c.createdAt
          });
        }
      }
    }

    if (toolId && toolId !== 'all') {
      activities = activities.filter(a => a.toolId === toolId);
    }
    if (category && category !== 'all') {
      activities = activities.filter(a => a.category === category);
    }

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({
      success: true,
      compressions: activities,
      stats: { recentCompressions: activities }
    });
  } catch (err) {
    res.json({ success: true, compressions: [] });
  }
});

app.delete('/api/admin/compressions', authMiddleware, async (req, res) => {
  try {
    memoryToolActivities = [];
    if (isConnected) {
      await Compression.deleteMany({});
      await ToolActivity.deleteMany({});
    }
    res.json({ success: true, message: 'All tool history and compression logs cleared' });
  } catch (err) {
    res.json({ success: true, message: 'All tool history cleared' });
  }
});

const SETTINGS_FILE = path.join(__dirname, 'data', 'settings.json');
let memorySettings = {
  disabledTools: [],
  logo: '/logo.png'
};

try {
  if (fs.existsSync(SETTINGS_FILE)) {
    const loaded = fs.readJsonSync(SETTINGS_FILE);
    if (loaded && typeof loaded === 'object') {
      memorySettings = { ...memorySettings, ...loaded };
    }
  }
} catch (_) {}

function getSanitizedLogo(rawLogo) {
  if (!rawLogo || typeof rawLogo !== 'string') return '/logo.png';
  if (rawLogo === 'data:image/png;base64,' || rawLogo === 'data:;base64,' || rawLogo.trim().length < 30) {
    return '/logo.png';
  }
  return rawLogo;
}

function getSanitizedFavicon(rawFavicon) {
  if (!rawFavicon || typeof rawFavicon !== 'string') return '/favicon.svg';
  if (rawFavicon === 'data:image/svg+xml;base64,' || rawFavicon === 'data:;base64,' || rawFavicon.trim().length < 20) {
    return '/favicon.svg';
  }
  return rawFavicon;
}

function sendBase64Image(res, base64String, fallbackPath) {
  if (!base64String || typeof base64String !== 'string' || !base64String.startsWith('data:')) {
    return res.redirect(fallbackPath);
  }
  const matches = base64String.match(/^data:([A-Za-z0-9-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return res.redirect(fallbackPath);
  }
  const contentType = matches[1];
  const buffer = Buffer.from(matches[2], 'base64');
  res.set('Content-Type', contentType);
  res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  res.set('Content-Length', buffer.length);
  return res.send(buffer);
}

// Dedicated cached binary image endpoints for custom brand assets
app.get('/api/logo/image', async (req, res) => {
  try {
    let logo = memorySettings.logo;
    if (isConnected) {
      const record = await Setting.findOne({ key: 'logo' });
      if (record && record.value) logo = record.value;
    }
    return sendBase64Image(res, logo, '/logo.png');
  } catch (_) {
    return res.redirect('/logo.png');
  }
});

app.get('/api/favicon/image', async (req, res) => {
  try {
    let favicon = memorySettings.favicon;
    if (isConnected) {
      const record = await Setting.findOne({ key: 'favicon' });
      if (record && record.value) favicon = record.value;
    }
    return sendBase64Image(res, favicon, '/favicon.svg');
  } catch (_) {
    return res.redirect('/favicon.svg');
  }
});

// Public settings endpoint - Optimized for high performance / PageSpeed
app.get('/api/settings', async (req, res) => {
  try {
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    let disabledTools = memorySettings.disabledTools || [];
    let logo = getSanitizedLogo(memorySettings.logo);
    let favicon = getSanitizedFavicon(memorySettings.favicon);

    if (isConnected) {
      const disabledRecord = await Setting.findOne({ key: 'disabledTools' });
      if (disabledRecord && Array.isArray(disabledRecord.value)) {
        disabledTools = disabledRecord.value;
      }
      const logoRecord = await Setting.findOne({ key: 'logo' });
      if (logoRecord && logoRecord.value) {
        logo = getSanitizedLogo(logoRecord.value);
      }
      const faviconRecord = await Setting.findOne({ key: 'favicon' });
      if (faviconRecord && faviconRecord.value) {
        favicon = getSanitizedFavicon(faviconRecord.value);
      }
    }

    // High performance optimization: Never return megabytes of raw Base64 data in public config API!
    // Instead return the lightweight cached image endpoint URL
    const host = req.get('host');
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const baseUrl = host ? `${protocol}://${host}` : '';

    const effectiveLogo = (logo && logo.startsWith('data:') && logo.length > 500)
      ? `${baseUrl}/api/logo/image`
      : logo;
    const effectiveFavicon = (favicon && favicon.startsWith('data:') && favicon.length > 500)
      ? `${baseUrl}/api/favicon/image`
      : favicon;

    res.json({ success: true, settings: { disabledTools, logo: effectiveLogo, favicon: effectiveFavicon } });
  } catch (err) {
    res.json({ success: true, settings: { disabledTools: memorySettings.disabledTools || [], logo: '/logo.png', favicon: '/favicon.svg' } });
  }
});

// Admin settings endpoints
app.get('/api/admin/settings', authMiddleware, async (req, res) => {
  try {
    let disabledTools = memorySettings.disabledTools || [];
    let logo = getSanitizedLogo(memorySettings.logo);
    let favicon = getSanitizedFavicon(memorySettings.favicon);
    let adminEmail = memorySettings.adminEmail || DEFAULT_ADMIN_EMAIL;

    if (isConnected) {
      const disabledRecord = await Setting.findOne({ key: 'disabledTools' });
      if (disabledRecord && Array.isArray(disabledRecord.value)) {
        disabledTools = disabledRecord.value;
      }
      const logoRecord = await Setting.findOne({ key: 'logo' });
      if (logoRecord && logoRecord.value) {
        logo = getSanitizedLogo(logoRecord.value);
      }
      const faviconRecord = await Setting.findOne({ key: 'favicon' });
      if (faviconRecord && faviconRecord.value) {
        favicon = getSanitizedFavicon(faviconRecord.value);
      }
      const emailRecord = await Setting.findOne({ key: 'adminEmail' });
      if (emailRecord && emailRecord.value) {
        adminEmail = emailRecord.value;
      }
    }

    const smtp = await getSmtpConfig();
    const smtpStatus = {
      configured: Boolean(smtp && smtp.user && smtp.pass),
      host: smtp?.host || 'smtp.gmail.com',
      port: smtp?.port || 465,
      user: smtp?.user || '',
      pass: smtp?.pass || '',
      hasPassword: Boolean(smtp && smtp.pass)
    };

    res.json({
      success: true,
      settings: {
        disabledTools,
        logo,
        favicon,
        adminEmail,
        smtp: smtpStatus
      }
    });
  } catch (err) {
    res.json({
      success: true,
      settings: {
        disabledTools: memorySettings.disabledTools || [],
        logo: '/logo.png',
        adminEmail: DEFAULT_ADMIN_EMAIL,
        smtp: { configured: false }
      }
    });
  }
});

app.post('/api/admin/settings', authMiddleware, async (req, res) => {
  try {
    let body = req.body || {};
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (_) {}
    }
    const { adminPassword, adminEmail, disabledTools, logo, smtpConfig } = body;

    if (disabledTools !== undefined && Array.isArray(disabledTools)) {
      memorySettings.disabledTools = disabledTools;
      if (isConnected) {
        await Setting.updateOne({ key: 'disabledTools' }, { value: disabledTools }, { upsert: true });
      }
      try {
        fs.outputJsonSync(SETTINGS_FILE, memorySettings);
      } catch (_) {}
    }

    if (logo !== undefined && typeof logo === 'string') {
      const clean = getSanitizedLogo(logo);
      memorySettings.logo = clean;
      if (isConnected) {
        await Setting.updateOne({ key: 'logo' }, { value: clean }, { upsert: true });
      }
      try {
        fs.outputJsonSync(SETTINGS_FILE, memorySettings);
      } catch (_) {}
    }

    if (adminEmail && typeof adminEmail === 'string' && adminEmail.includes('@')) {
      const cleanEmail = adminEmail.trim().toLowerCase();
      memorySettings.adminEmail = cleanEmail;
      if (isConnected) {
        await Setting.updateOne({ key: 'adminEmail' }, { value: cleanEmail }, { upsert: true });
      }
      try {
        fs.outputJsonSync(SETTINGS_FILE, memorySettings);
      } catch (_) {}
    }

    if (adminPassword && typeof adminPassword === 'string') {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      memorySettings.adminPassword = hashedPassword;
      if (isConnected) {
        await Setting.updateOne({ key: 'adminPassword' }, { value: hashedPassword }, { upsert: true });
      }
      try {
        fs.outputJsonSync(SETTINGS_FILE, memorySettings);
      } catch (_) {}
    }

    if (smtpConfig && typeof smtpConfig === 'object') {
      const { host, port, user, pass, secure } = smtpConfig;
      const existingSmtp = await getSmtpConfig() || {};
      const effectiveUser = user ? String(user).trim() : existingSmtp.user;
      const effectivePass = pass ? String(pass).replace(/\s+/g, '').trim() : existingSmtp.pass;

      if (effectiveUser && effectivePass) {
        const cleanSmtp = {
          host: host || existingSmtp.host || 'smtp.gmail.com',
          port: Number(port) || existingSmtp.port || 465,
          user: effectiveUser,
          pass: effectivePass,
          secure: secure !== undefined ? Boolean(secure) : Number(port || existingSmtp.port || 465) === 465
        };
        memorySettings.smtpConfig = cleanSmtp;
        if (isConnected) {
          try {
            await Setting.findOneAndUpdate(
              { key: 'smtpConfig' },
              { $set: { key: 'smtpConfig', value: cleanSmtp } },
              { upsert: true, new: true }
            );
          } catch (e) {
            console.error('Failed to save smtpConfig in DB:', e.message);
          }
        }
        try {
          fs.outputJsonSync(SETTINGS_FILE, memorySettings);
        } catch (_) {}
      }
    }

    const currentSmtp = await getSmtpConfig();
    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: {
        disabledTools: memorySettings.disabledTools,
        logo: getSanitizedLogo(memorySettings.logo),
        adminEmail: memorySettings.adminEmail || DEFAULT_ADMIN_EMAIL,
        smtp: {
          configured: Boolean(currentSmtp && currentSmtp.user && currentSmtp.pass),
          host: currentSmtp?.host || 'smtp.gmail.com',
          port: currentSmtp?.port || 465,
          user: currentSmtp?.user || '',
          pass: currentSmtp?.pass || '',
          hasPassword: Boolean(currentSmtp && currentSmtp.pass)
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
});

app.post('/api/admin/smtp/test', authMiddleware, async (req, res) => {
  try {
    const { targetEmail: defaultTarget } = await getEffectiveAdminCredentials();
    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (_) {}
    }

    const savedSmtp = await getSmtpConfig() || {};
    const effectiveHost = body.host || savedSmtp.host || 'smtp.gmail.com';
    const effectivePort = Number(body.port) || savedSmtp.port || 465;
    const effectiveUser = String(body.user || savedSmtp.user || '').trim();
    const effectivePass = String(body.pass || savedSmtp.pass || '').replace(/\s+/g, '').trim();
    const effectiveSecure = body.secure !== undefined ? Boolean(body.secure) : (savedSmtp.secure !== undefined ? Boolean(savedSmtp.secure) : effectivePort === 465);

    if (!effectiveUser || !effectivePass) {
      return res.status(400).json({
        success: false,
        message: 'No SMTP credentials provided or saved. Please enter your sender email and 16-character App Password, then click Save.'
      });
    }

    const customConfig = {
      host: effectiveHost,
      port: effectivePort,
      user: effectiveUser,
      pass: effectivePass,
      secure: effectiveSecure
    };

    const recipient = String(body.targetEmail || defaultTarget || effectiveUser).trim().toLowerCase();
    const testOtp = crypto.randomInt(100000, 999999).toString();
    const result = await sendOtpEmail(recipient, testOtp, customConfig);

    if (result.sent) {
      const destination = result.deliveredTo || recipient;
      return res.json({
        success: true,
        message: result.notice
          ? `✓ ${result.notice} [Code: ${testOtp}]`
          : `✓ Test verification email [Code: ${testOtp}] dispatched to ${destination}! Check your inbox & Spam/Junk folder.`
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.error || result.reason || 'Failed to send test email. Please check your SMTP credentials.'
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Internal error while dispatching test email' });
  }
});

app.post('/api/admin/logo', authMiddleware, async (req, res) => {
  try {
    if (!req.files || !req.files.logo) {
      return res.status(400).json({ success: false, error: 'No logo file uploaded' });
    }
    const logoFile = req.files.logo;
    let fileBuffer;

    if (logoFile.data && logoFile.data.length > 0) {
      fileBuffer = logoFile.data;
    } else if (logoFile.tempFilePath && fs.existsSync(logoFile.tempFilePath)) {
      fileBuffer = await fs.readFile(logoFile.tempFilePath);
    } else {
      return res.status(400).json({ success: false, error: 'Unable to read uploaded logo file contents' });
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return res.status(400).json({ success: false, error: 'Uploaded logo file is empty' });
    }

    const mime = logoFile.mimetype || 'image/png';
    const base64 = `data:${mime};base64,${fileBuffer.toString('base64')}`;

    memorySettings.logo = base64;
    try {
      fs.outputJsonSync(SETTINGS_FILE, memorySettings);
    } catch (_) {}

    if (isConnected) {
      await Setting.updateOne({ key: 'logo' }, { value: base64 }, { upsert: true });
    }

    res.json({ success: true, logoUrl: base64, logo: base64 });
  } catch (err) {
    console.error('Logo upload error:', err);
    res.status(500).json({ success: false, error: 'Failed to process logo: ' + err.message });
  }
});

app.delete('/api/admin/logo', authMiddleware, async (req, res) => {
  try {
    memorySettings.logo = '/logo.png';
    try {
      fs.outputJsonSync(SETTINGS_FILE, memorySettings);
    } catch (_) {}

    if (isConnected) {
      await Setting.updateOne({ key: 'logo' }, { value: '/logo.png' }, { upsert: true });
    }

    res.json({ success: true, logoUrl: '/logo.png', logo: '/logo.png', message: 'Logo reset to default' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to reset logo' });
  }
});

app.get('/api/logo', async (req, res) => {
  try {
    let logo = getSanitizedLogo(memorySettings.logo);
    if (isConnected) {
      const record = await Setting.findOne({ key: 'logo' });
      if (record && record.value) logo = getSanitizedLogo(record.value);
    }
    res.json({ success: true, logo });
  } catch (_) {
    res.json({ success: true, logo: '/logo.png' });
  }
});

app.post('/api/admin/favicon', authMiddleware, async (req, res) => {
  try {
    if (!req.files || !req.files.favicon) {
      return res.status(400).json({ success: false, error: 'No favicon file uploaded' });
    }
    const favFile = req.files.favicon;
    let fileBuffer;

    if (favFile.data && favFile.data.length > 0) {
      fileBuffer = favFile.data;
    } else if (favFile.tempFilePath && fs.existsSync(favFile.tempFilePath)) {
      fileBuffer = await fs.readFile(favFile.tempFilePath);
    } else {
      return res.status(400).json({ success: false, error: 'Unable to read uploaded favicon file contents' });
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return res.status(400).json({ success: false, error: 'Uploaded favicon file is empty' });
    }

    const mime = favFile.mimetype || (favFile.name.endsWith('.svg') ? 'image/svg+xml' : 'image/png');
    const base64 = `data:${mime};base64,${fileBuffer.toString('base64')}`;

    memorySettings.favicon = base64;
    try {
      fs.outputJsonSync(SETTINGS_FILE, memorySettings);
    } catch (_) {}

    if (isConnected) {
      await Setting.updateOne({ key: 'favicon' }, { value: base64 }, { upsert: true });
    }

    res.json({ success: true, faviconUrl: base64, favicon: base64, message: 'Favicon updated successfully' });
  } catch (err) {
    console.error('Favicon upload error:', err);
    res.status(500).json({ success: false, error: 'Failed to process favicon: ' + err.message });
  }
});

app.delete('/api/admin/favicon', authMiddleware, async (req, res) => {
  try {
    memorySettings.favicon = '/favicon.svg';
    try {
      fs.outputJsonSync(SETTINGS_FILE, memorySettings);
    } catch (_) {}

    if (isConnected) {
      await Setting.updateOne({ key: 'favicon' }, { value: '/favicon.svg' }, { upsert: true });
    }

    res.json({ success: true, faviconUrl: '/favicon.svg', favicon: '/favicon.svg', message: 'Favicon reset to default' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to reset favicon' });
  }
});

app.get('/api/favicon', async (req, res) => {
  try {
    let favicon = getSanitizedFavicon(memorySettings.favicon);
    if (isConnected) {
      const record = await Setting.findOne({ key: 'favicon' });
      if (record && record.value) favicon = getSanitizedFavicon(record.value);
    }
    res.json({ success: true, favicon });
  } catch (_) {
    res.json({ success: true, favicon: '/favicon.svg' });
  }
});

// ==========================================
// CONTACT & SUPPORT INQUIRIES API
// ==========================================

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many contact messages submitted. Please wait a few minutes before trying again.' }
});

let memoryContactMessages = [];
const MESSAGES_FILE = path.join(__dirname, 'data', 'contact_messages.json');
try {
  if (fs.existsSync(MESSAGES_FILE)) {
    memoryContactMessages = fs.readJsonSync(MESSAGES_FILE);
    if (!Array.isArray(memoryContactMessages)) memoryContactMessages = [];
  }
} catch (_) {}

function saveMemoryMessages() {
  try {
    fs.outputJsonSync(MESSAGES_FILE, memoryContactMessages.slice(0, 500));
  } catch (_) {}
}

// Public: Submit a contact inquiry
app.post('/api/contact', contactLimiter, async (req, res) => {
  try {
    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (_) {}
    }
    const { name, email, subject, message } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter your name.' });
    }
    if (!email || typeof email !== 'string' || !email.includes('@') || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter your message.' });
    }

    const cleanName = name.trim().slice(0, 100);
    const cleanEmail = email.trim().toLowerCase().slice(0, 150);
    const cleanSubject = (subject && typeof subject === 'string' && subject.trim())
      ? subject.trim().slice(0, 200)
      : 'General Support Inquiry';
    const cleanMessage = message.trim().slice(0, 5000);

    const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim();
    const clientUserAgent = (req.headers['user-agent'] || '').toString().slice(0, 250);

    let savedDoc = null;
    const fallbackId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const messageData = {
      name: cleanName,
      email: cleanEmail,
      subject: cleanSubject,
      message: cleanMessage,
      status: 'unread',
      ip: clientIp,
      userAgent: clientUserAgent,
      emailDispatched: false,
      dispatchError: ''
    };

    // 1. Save to MongoDB if available
    if (isConnected) {
      try {
        savedDoc = await ContactMessage.create(messageData);
      } catch (dbErr) {
        console.warn('⚠️ ContactMessage DB save error, falling back to disk cache:', dbErr.message);
      }
    }

    // 2. Persist to local JSON file
    const memRecord = {
      _id: savedDoc ? savedDoc._id.toString() : fallbackId,
      id: savedDoc ? savedDoc._id.toString() : fallbackId,
      ...messageData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    memoryContactMessages.unshift(memRecord);
    saveMemoryMessages();

    // 3. Dispatch automated email notification to admin with all details
    let emailResult = { sent: false };
    try {
      emailResult = await sendContactNotificationEmail({
        name: cleanName,
        email: cleanEmail,
        subject: cleanSubject,
        message: cleanMessage,
        ip: clientIp,
        userAgent: clientUserAgent
      });
    } catch (sendErr) {
      console.error('⚠️ Error dispatching contact email notification:', sendErr.message);
      emailResult = { sent: false, error: sendErr.message };
    }

    // Update dispatch status in database and cache
    if (savedDoc) {
      try {
        await ContactMessage.findByIdAndUpdate(savedDoc._id, {
          emailDispatched: Boolean(emailResult.sent),
          dispatchError: emailResult.error || ''
        });
      } catch (_) {}
    }
    memRecord.emailDispatched = Boolean(emailResult.sent);
    memRecord.dispatchError = emailResult.error || '';
    saveMemoryMessages();

    return res.json({
      success: true,
      message: 'Thank you! Your message has been received and our team has been notified.',
      emailDispatched: Boolean(emailResult.sent)
    });
  } catch (err) {
    console.error('Contact endpoint error:', err);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while submitting your message. Please try again or email us directly.'
    });
  }
});

// Admin: Get all contact messages
app.get('/api/admin/messages', authMiddleware, async (req, res) => {
  try {
    let messages = [];
    let unreadCount = 0;

    if (isConnected) {
      try {
        messages = await ContactMessage.find({}).sort({ createdAt: -1 }).limit(300).lean();
        unreadCount = await ContactMessage.countDocuments({ status: 'unread' });
      } catch (dbErr) {
        console.warn('DB fetch messages error, using fallback:', dbErr.message);
      }
    }

    if (messages.length === 0 && memoryContactMessages.length > 0) {
      messages = memoryContactMessages;
      unreadCount = memoryContactMessages.filter(m => m.status === 'unread').length;
    }

    res.json({
      success: true,
      messages: messages.map(m => ({
        ...m,
        id: m._id ? m._id.toString() : m.id
      })),
      unreadCount
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve messages' });
  }
});

// Admin: Update message status (read, unread, replied, archived)
app.patch('/api/admin/messages/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (_) {}
    }
    const { status } = body;

    const validStatuses = ['unread', 'read', 'replied', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    if (isConnected && mongoose.Types.ObjectId.isValid(id)) {
      try {
        await ContactMessage.findByIdAndUpdate(id, { status });
      } catch (_) {}
    }

    const found = memoryContactMessages.find(m => (m._id === id || m.id === id));
    if (found) {
      found.status = status;
      found.updatedAt = new Date().toISOString();
      saveMemoryMessages();
    }

    res.json({ success: true, message: `Message marked as ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update message status' });
  }
});

// Admin: Reply directly via email from dashboard
app.post('/api/admin/messages/:id/reply', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (_) {}
    }
    const { replySubject, replyMessage } = body;

    if (!replyMessage || !replyMessage.trim()) {
      return res.status(400).json({ success: false, message: 'Reply message cannot be empty' });
    }

    let targetMessage = null;
    if (isConnected && mongoose.Types.ObjectId.isValid(id)) {
      targetMessage = await ContactMessage.findById(id);
    }
    if (!targetMessage) {
      targetMessage = memoryContactMessages.find(m => (m._id === id || m.id === id));
    }

    if (!targetMessage || !targetMessage.email) {
      return res.status(404).json({ success: false, message: 'Message or recipient email not found' });
    }

    const cleanReply = replyMessage.trim();
    const cleanSubject = (replySubject && replySubject.trim())
      ? replySubject.trim()
      : `Re: ${targetMessage.subject || 'Your inquiry to PDFCompress Pro'}`;

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px;">
        <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 20px;">
          <div style="display: inline-block; width: 40px; height: 40px; line-height: 40px; text-align: center; border-radius: 12px; background: #2563eb; color: #ffffff; font-weight: 900; font-size: 18px;">P</div>
          <h2 style="color: #0f172a; margin: 12px 0 2px; font-size: 18px; font-weight: 800;">Response from PDFCompress Pro</h2>
          <p style="color: #64748b; font-size: 12px; margin: 0;">Official Support Desk</p>
        </div>

        <p style="font-size: 14px; color: #334155; margin-bottom: 16px;">Hello <strong>${targetMessage.name}</strong>,</p>

        <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; border-radius: 0 12px 12px 0; font-size: 14px; line-height: 1.6; color: #1e293b; white-space: pre-wrap; margin-bottom: 24px;">${cleanReply.replace(/</g, '&lt;')}</div>

        <div style="background: #f1f5f9; padding: 12px 16px; border-radius: 10px; font-size: 12px; color: #64748b; margin-bottom: 20px;">
          <strong>Your Original Message:</strong><br/>
          <em>"${(targetMessage.message || '').replace(/</g, '&lt;')}"</em>
        </div>

        <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px;">
          Best regards,<br/>
          <strong>PDFCompress Pro Support Team</strong><br/>
          <a href="${SITE_URL}" style="color: #2563eb; text-decoration: none;">${SITE_URL}</a>
        </p>
      </div>
    `;

    const sendResult = await sendCoreEmail({
      toEmail: targetMessage.email,
      subject: cleanSubject,
      htmlBody,
      textBody: `Hello ${targetMessage.name},\n\n${cleanReply}\n\n---\nYour original message:\n${targetMessage.message}\n\nBest regards,\nPDFCompress Pro Support Team\n${SITE_URL}`
    });

    if (sendResult.sent) {
      if (isConnected && mongoose.Types.ObjectId.isValid(id)) {
        try { await ContactMessage.findByIdAndUpdate(id, { status: 'replied' }); } catch (_) {}
      }
      const mem = memoryContactMessages.find(m => (m._id === id || m.id === id));
      if (mem) {
        mem.status = 'replied';
        saveMemoryMessages();
      }
      return res.json({ success: true, message: `Reply dispatched to ${targetMessage.email} successfully!` });
    } else {
      let failMsg = sendResult.error || sendResult.reason || 'Failed to dispatch email reply. Check SMTP settings.';
      if (failMsg.includes('testing emails to your own email address')) {
        failMsg = 'Resend Free Sandbox: Resend testing keys can only send to your own registered email address. To send from the server to external visitors, verify a custom domain at resend.com/domains or use Gmail SMTP with App Password. Alternatively, click "Send via Mail App" below to reply instantly from your email client.';
      }
      return res.status(400).json({
        success: false,
        message: failMsg
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to send reply: ' + err.message });
  }
});

// Admin: Delete a contact message
app.delete('/api/admin/messages/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (isConnected && mongoose.Types.ObjectId.isValid(id)) {
      try {
        await ContactMessage.findByIdAndDelete(id);
      } catch (_) {}
    }

    memoryContactMessages = memoryContactMessages.filter(m => (m._id !== id && m.id !== id));
    saveMemoryMessages();

    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete message' });
  }
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

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PDFCompress Pro server is running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);

    // Automatic keep-alive pinger for Render free tier (prevents idle sleep)
    const keepAliveUrl = process.env.RENDER_EXTERNAL_URL || process.env.KEEP_ALIVE_URL || (process.env.NODE_ENV === 'production' ? 'https://pdf-compress-backend.onrender.com' : null);
    if (keepAliveUrl) {
      const pingInterval = 8 * 60 * 1000; // Every 8 minutes (Render sleeps after 15m)
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
}

module.exports = app;
module.exports.handler = serverless(app, {
  binary: ['multipart/form-data', 'application/pdf', 'image/*']
});
