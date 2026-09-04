/**
 * PDF Compressor V2 — Core Optimization Engine
 *
 * Provides intelligent, content-aware compression:
 * - Directs text/vector PDFs through structural optimization (QPDF / PDF-Lib)
 * - Directs scanned/image PDFs through calibrated, single-pass Ghostscript
 * - Prevents redundant multi-pass re-encoding
 * - Guarantees output integrity and accurate metrics
 */

const { PDFDocument } = require('pdf-lib');
const { execFile } = require('child_process');
const os = require('os');
const pathMod = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { classifyPDF, PDF_TYPES } = require('./pdfClassifier');

// ===== HARDWARE & THREADING =====
const CPU_CORES = Math.max(1, os.cpus()?.length || 2);

// ===== BINARY DETECTION =====
let gsBinaryName = null;
let gsChecked = false;

function detectGhostscriptBinary() {
  if (gsChecked) return Promise.resolve(gsBinaryName);

  const binariesToTest = process.platform === 'win32'
    ? ['gswin64c', 'gswin32c', 'gs']
    : ['gs', '/usr/bin/gs', '/usr/local/bin/gs'];

  return new Promise((resolve) => {
    let index = 0;
    function tryNext() {
      if (index >= binariesToTest.length) {
        gsBinaryName = null;
        gsChecked = true;
        console.warn('[pdfOptimizer] Ghostscript binary not found on this system.');
        return resolve(null);
      }
      const bin = binariesToTest[index++];
      execFile(bin, ['--version'], { timeout: 4000 }, (err, stdout) => {
        if (!err) {
          gsBinaryName = bin;
          gsChecked = true;
          console.log(`[pdfOptimizer] Ghostscript binary detected: ${bin} (v${(stdout || '').trim()})`);
          return resolve(bin);
        }
        tryNext();
      });
    }
    tryNext();
  });
}

function isGhostscriptAvailable() {
  return detectGhostscriptBinary().then((bin) => Boolean(bin));
}

let qpdfBinaryName = null;
let qpdfChecked = false;

function detectQpdfBinary() {
  if (qpdfChecked) return Promise.resolve(qpdfBinaryName);

  const bins = process.platform === 'win32' ? ['qpdf'] : ['qpdf', '/usr/bin/qpdf', '/usr/local/bin/qpdf'];
  let idx = 0;
  return new Promise((resolve) => {
    function tryNext() {
      if (idx >= bins.length) {
        qpdfBinaryName = null;
        qpdfChecked = true;
        return resolve(null);
      }
      const bin = bins[idx++];
      execFile(bin, ['--version'], { timeout: 3000 }, (err) => {
        if (!err) {
          qpdfBinaryName = bin;
          qpdfChecked = true;
          return resolve(bin);
        }
        tryNext();
      });
    }
    tryNext();
  });
}

function isQpdfAvailable() {
  return detectQpdfBinary().then((bin) => Boolean(bin));
}

// ===== LEVEL CONFIGURATION =====
// Calibrated profiles designed to balance visual quality, speed, and size reduction
const LEVEL_CONFIGS = {
  low: {
    pdfSettings: '/printer',
    dpi: 180,
    monoDpi: 300,
    name: 'Low',
    summary: 'High Quality — minimal compression, preserves clarity (180 DPI)'
  },
  medium: {
    pdfSettings: '/ebook',
    dpi: 140,
    monoDpi: 200,
    name: 'Medium',
    summary: 'Balanced — recommended for everyday documents (140 DPI)'
  },
  high: {
    pdfSettings: '/screen',
    dpi: 100,
    monoDpi: 150,
    name: 'High',
    summary: 'Strong — smaller file size, text remains legible (100 DPI)'
  },
  extreme: {
    pdfSettings: '/screen',
    dpi: 75,
    monoDpi: 100,
    name: 'Extreme',
    summary: 'Maximum — aggressive compression for strict file limits (75 DPI)'
  }
};

function normalizeLevel(level) {
  const norm = String(level || 'medium').toLowerCase().trim();
  if (norm === 'lowest' || norm === 'low') return 'low';
  if (norm === 'high') return 'high';
  if (norm === 'extreme' || norm === 'max') return 'extreme';
  return 'medium';
}

// ===== OUTPUT VALIDATION =====
/**
 * Fast, non-blocking validation that a generated buffer is a well-formed PDF.
 */
async function validatePDFBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 64) {
    return { valid: false, error: 'Output buffer is empty or too small' };
  }

  // Fast check for magic bytes %PDF- in header
  const header = buffer.slice(0, 8192).toString('latin1');
  if (!header.includes('%PDF-')) {
    return { valid: false, error: 'Output lacks valid %PDF- header magic bytes' };
  }

  // Fast check for EOF marker in trailer
  const tail = buffer.slice(Math.max(0, buffer.length - 4096)).toString('latin1');
  if (!tail.includes('%%EOF')) {
    return { valid: false, error: 'Output lacks standard %%EOF trailer' };
  }

  return { valid: true };
}

// ===== GHOSTSCRIPT COMPRESSION =====
async function compressWithGhostscript(inputSource, level) {
  const bin = await detectGhostscriptBinary();
  if (!bin) {
    throw new Error('Ghostscript binary not found on this system');
  }

  const tmpDir = os.tmpdir();
  const id = crypto.randomBytes(8).toString('hex');
  const inputPath = pathMod.join(tmpDir, `gs_in_${id}.pdf`);
  const outputPath = pathMod.join(tmpDir, `gs_out_${id}.pdf`);

  let cleanupInput = false;

  try {
    if (Buffer.isBuffer(inputSource)) {
      fs.writeFileSync(inputPath, inputSource);
      cleanupInput = true;
    } else if (typeof inputSource === 'string' && fs.existsSync(inputSource)) {
      fs.copyFileSync(inputSource, inputPath);
      cleanupInput = true;
    } else {
      throw new Error('Invalid input source for Ghostscript compression');
    }

    const config = LEVEL_CONFIGS[level] || LEVEL_CONFIGS.medium;

    // Ghostscript universal pdfwrite arguments:
    // Pure universal flags with Subsample downsampling for maximum throughput
    const gsArgs = [
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      `-dPDFSETTINGS=${config.pdfSettings || '/ebook'}`,
      '-dNOPAUSE',
      '-dQUIET',
      '-dBATCH',
      '-dAutoRotatePages=/None',
      '-dColorConversionStrategy=/sRGB',
      '-dDownsampleColorImages=true',
      '-dColorImageDownsampleType=/Subsample',
      `-dColorImageResolution=${config.dpi}`,
      '-dColorImageDownsampleThreshold=1.0',
      '-dDownsampleGrayImages=true',
      '-dGrayImageDownsampleType=/Subsample',
      `-dGrayImageResolution=${config.dpi}`,
      '-dGrayImageDownsampleThreshold=1.0',
      '-dDownsampleMonoImages=true',
      '-dMonoImageDownsampleType=/Subsample',
      `-dMonoImageResolution=${config.monoDpi}`,
      '-dMonoImageDownsampleThreshold=1.0',
      '-dSubsetFonts=true',
      '-dCompressFonts=true',
      '-dBufferSpace=100000000',
      '-dNumRenderingThreads=2',
      `-sOutputFile=${outputPath}`,
      inputPath
    ];

    // Execute Ghostscript natively with 120s timeout for large multi-page scans on shared CPU
    await new Promise((resolve, reject) => {
      execFile(bin, gsArgs, { timeout: 120000 }, (error, stdout, stderr) => {
        if (error) {
          const detail = (stderr || stdout || error.message || '').trim();
          console.error(`[pdfOptimizer] Ghostscript execution error: ${detail}`);
          return reject(new Error(`Ghostscript failed: ${detail}`));
        }
        resolve();
      });
    });

    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
      throw new Error('Ghostscript produced an empty output file');
    }

    const outputBuffer = fs.readFileSync(outputPath);

    // Validate integrity
    const validation = await validatePDFBuffer(outputBuffer);
    if (!validation.valid) {
      throw new Error(`Output validation failed: ${validation.error}`);
    }

    return {
      buffer: outputBuffer,
      engine: 'Ghostscript',
      levelConfig: config
    };
  } finally {
    if (cleanupInput) { try { fs.unlinkSync(inputPath); } catch (_) {} }
    try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch (_) {}
  }
}

// ===== QPDF STREAM OPTIMIZATION =====
async function compressWithQpdf(inputSource) {
  const bin = await detectQpdfBinary();
  if (!bin) throw new Error('QPDF binary not available');

  const tmpDir = os.tmpdir();
  const id = crypto.randomBytes(8).toString('hex');
  const inputPath = pathMod.join(tmpDir, `qpdf_in_${id}.pdf`);
  const outputPath = pathMod.join(tmpDir, `qpdf_out_${id}.pdf`);
  let cleanupInput = false;

  try {
    if (Buffer.isBuffer(inputSource)) {
      fs.writeFileSync(inputPath, inputSource);
      cleanupInput = true;
    } else if (typeof inputSource === 'string' && fs.existsSync(inputSource)) {
      fs.copyFileSync(inputSource, inputPath);
      cleanupInput = true;
    } else {
      throw new Error('Invalid input source for QPDF');
    }

    const qpdfArgs = [
      '--linearize',
      '--object-streams=generate',
      '--recompress-flate',
      '--compression-level=9',
      inputPath,
      outputPath
    ];

    await new Promise((resolve, reject) => {
      execFile(bin, qpdfArgs, { timeout: 30000 }, (err) => {
        if (err && err.code !== 3) {
          return reject(err);
        }
        resolve();
      });
    });

    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
      throw new Error('QPDF produced empty output');
    }

    const buffer = fs.readFileSync(outputPath);
    const validation = await validatePDFBuffer(buffer);
    if (!validation.valid) {
      throw new Error(`QPDF output validation failed: ${validation.error}`);
    }

    return {
      buffer,
      engine: 'QPDF',
      levelConfig: { name: 'QPDF Stream Linearizer' }
    };
  } finally {
    if (cleanupInput) { try { fs.unlinkSync(inputPath); } catch (_) {} }
    try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch (_) {}
  }
}

// ===== PURE NODE.JS / PDF-LIB FALLBACK =====
/**
 * Safe structural optimization fallback.
 * Compacts object streams and removes redundant structures without rasterizing text.
 */
async function compressWithPdfLib(inputBuffer, level) {
  const doc = await PDFDocument.load(inputBuffer, { ignoreEncryption: true });

  if (level === 'high' || level === 'extreme') {
    doc.setTitle('');
    doc.setAuthor('');
    doc.setSubject('');
    doc.setKeywords([]);
    doc.setProducer('PDFCompress Pro');
    doc.setCreator('PDFCompress Pro');
  }

  const compressedBytes = await doc.save({
    useObjectStreams: true,
    addDefaultPage: false
  });

  const outputBuffer = Buffer.from(compressedBytes);
  const validation = await validatePDFBuffer(outputBuffer);
  if (!validation.valid) {
    throw new Error(`Pure JS optimization validation failed: ${validation.error}`);
  }

  return {
    buffer: outputBuffer,
    engine: 'PDF-Lib (Structural)',
    levelConfig: LEVEL_CONFIGS[level] || LEVEL_CONFIGS.medium
  };
}

// ===== CONTENT-AWARE ESTIMATION =====
/**
 * Predicts realistic compression ranges based on classified PDF content.
 */
async function estimateCompressionLevels(inputSource) {
  const classification = await classifyPDF(inputSource);
  const originalSize = classification.fileSize;

  let profiles;
  if (classification.type === PDF_TYPES.IMAGE_HEAVY) {
    profiles = {
      low:     { min: 20, max: 40, expected: 30 },
      medium:  { min: 45, max: 68, expected: 55 },
      high:    { min: 65, max: 80, expected: 72 },
      extreme: { min: 75, max: 88, expected: 82 }
    };
  } else if (classification.type === PDF_TYPES.TEXT_VECTOR) {
    profiles = {
      low:     { min: 5, max: 15, expected: 10 },
      medium:  { min: 10, max: 25, expected: 18 },
      high:    { min: 15, max: 35, expected: 25 },
      extreme: { min: 20, max: 40, expected: 30 }
    };
  } else if (classification.type === PDF_TYPES.ALREADY_COMPRESSED) {
    profiles = {
      low:     { min: 0, max: 5, expected: 2 },
      medium:  { min: 0, max: 8, expected: 5 },
      high:    { min: 2, max: 12, expected: 8 },
      extreme: { min: 5, max: 18, expected: 12 }
    };
  } else {
    // MIXED
    profiles = {
      low:     { min: 10, max: 25, expected: 18 },
      medium:  { min: 25, max: 45, expected: 35 },
      high:    { min: 40, max: 60, expected: 50 },
      extreme: { min: 55, max: 72, expected: 62 }
    };
  }

  return ['low', 'medium', 'high', 'extreme'].map((level) => {
    const prof = profiles[level];
    const estimatedSize = Math.max(1024, Math.round(originalSize * (1 - prof.expected / 100)));
    const config = LEVEL_CONFIGS[level];

    return {
      level,
      name: config.name,
      originalSize,
      compressedSize: estimatedSize,
      reductionPercent: prof.expected,
      optimized: true,
      isEstimate: true,
      message: `${config.summary} (Est. range: ~${prof.min}%–${prof.max}%)`
    };
  });
}

// ===== MAIN PIPELINE ENTRYPOINT =====
/**
 * Compresses a PDF using the optimal pipeline:
 * - Text/vector: Structural optimization (preserves searchable text & vectors)
 * - Scanned/image: Ghostscript with calibrated downsampling (single pass)
 * - Validates output and guarantees smaller file return
 */
async function compressPDF(inputSource, requestedLevel = 'medium') {
  const level = normalizeLevel(requestedLevel);
  const originalSize = Buffer.isBuffer(inputSource)
    ? inputSource.length
    : fs.statSync(inputSource).size;

  const inputBuffer = Buffer.isBuffer(inputSource)
    ? inputSource
    : fs.readFileSync(inputSource);

  // Quick header integrity check
  const headerCheck = inputBuffer.slice(0, 8192).toString('latin1');
  if (inputBuffer.length < 50 || (!headerCheck.includes('%PDF-') && inputBuffer.toString('utf8', 0, 100).includes('<html'))) {
    throw new Error('Invalid PDF: file does not start with standard PDF header.');
  }

  // Step 1: Upfront Classification
  const classification = await classifyPDF(inputSource);
  console.log(`[pdfOptimizer] Document classified as: ${classification.type} (${classification.summary})`);

  let bestResult = null;

  // Step 2: Route by Classification

  // Case A: Pure Text / Vector PDF
  if (classification.type === PDF_TYPES.TEXT_VECTOR) {
    const hasQpdf = await isQpdfAvailable();
    if (hasQpdf) {
      try {
        const qpdfResult = await compressWithQpdf(inputSource);
        if (qpdfResult.buffer.length < originalSize) {
          bestResult = qpdfResult;
        }
      } catch (qErr) {
        console.warn(`[pdfOptimizer] QPDF notice: ${qErr.message}`);
      }
    }

    if (!bestResult) {
      try {
        const jsResult = await compressWithPdfLib(inputBuffer, level);
        if (jsResult.buffer.length < originalSize) {
          bestResult = jsResult;
        }
      } catch (jsErr) {
        console.warn(`[pdfOptimizer] PDF-Lib notice: ${jsErr.message}`);
      }
    }
  }

  // Case B: Scanned / Image-heavy or Mixed PDF
  if (!bestResult && (classification.type === PDF_TYPES.IMAGE_HEAVY || classification.type === PDF_TYPES.MIXED || classification.type === PDF_TYPES.ALREADY_COMPRESSED)) {
    const hasGs = await isGhostscriptAvailable();
    if (hasGs) {
      try {
        // Run ONE optimized Ghostscript pass
        const gsResult = await compressWithGhostscript(inputSource, level);
        if (gsResult.buffer.length < originalSize) {
          bestResult = gsResult;
        }
      } catch (gsErr) {
        console.warn(`[pdfOptimizer] Ghostscript notice: ${gsErr.message}`);
      }
    }

    // Secondary fallback: QPDF
    if (!bestResult) {
      const hasQpdf = await isQpdfAvailable();
      if (hasQpdf) {
        try {
          const qpdfResult = await compressWithQpdf(inputSource);
          if (qpdfResult.buffer.length < originalSize) {
            bestResult = qpdfResult;
          }
        } catch (_) {}
      }
    }

    // Tertiary fallback: Pure JS structural compaction
    if (!bestResult) {
      try {
        const fallbackResult = await compressWithPdfLib(inputBuffer, level);
        if (fallbackResult.buffer.length < originalSize) {
          bestResult = fallbackResult;
        }
      } catch (_) {}
    }
  }

  // Step 3: Compare results
  if (bestResult && bestResult.buffer.length < originalSize) {
    const compressedSize = bestResult.buffer.length;
    const savedBytes = originalSize - compressedSize;
    const savedPercent = ((savedBytes / originalSize) * 100).toFixed(1);

    if (Number(savedPercent) > 0) {
      return {
        buffer: bestResult.buffer,
        optimized: true,
        level,
        engine: bestResult.engine,
        message: `Optimized with ${bestResult.levelConfig?.name || level} profile (${savedPercent}% saved).`
      };
    }
  }

  // Document is already optimal
  return {
    buffer: inputBuffer,
    optimized: false,
    level,
    engine: 'Direct',
    message: 'PDF content is already compressed. No further size reduction possible without quality degradation.'
  };
}

module.exports = {
  compressPDF,
  estimateCompressionLevels,
  validatePDFBuffer,
  isGhostscriptAvailable,
  isQpdfAvailable,
  compressWithGhostscript,
  compressWithQpdf,
  compressWithPdfLib,
  LEVEL_CONFIGS
};
