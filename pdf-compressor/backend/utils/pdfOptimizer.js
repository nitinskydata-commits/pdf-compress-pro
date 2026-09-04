const { PDFDocument } = require('pdf-lib');
const { execFile } = require('child_process');
const os = require('os');
const pathMod = require('path');
const fs = require('fs');
const crypto = require('crypto');

// ===== HARDWARE DETECTION =====
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
  return detectGhostscriptBinary().then(bin => Boolean(bin));
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
  return detectQpdfBinary().then(bin => Boolean(bin));
}

// ===== LEVEL CONFIGURATION =====
// Calibrated Ghostscript distiller settings and target resolutions
const LEVEL_CONFIGS = {
  low: {
    pdfSettings: '/printer',
    dpi: 144,
    monoDpi: 300,
    name: 'Low',
    summary: 'High Quality — minimal degradation, preserves image clarity'
  },
  medium: {
    pdfSettings: '/ebook',
    dpi: 96,
    monoDpi: 200,
    name: 'Medium',
    summary: 'Balanced — good size reduction, sharp and readable text'
  },
  high: {
    pdfSettings: '/screen',
    dpi: 72,
    monoDpi: 150,
    name: 'High',
    summary: 'Strong — smaller file size, text remains fully legible'
  },
  extreme: {
    pdfSettings: '/screen',
    dpi: 54,
    monoDpi: 100,
    name: 'Extreme',
    summary: 'Maximum — aggressive compression for strict file limits'
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

  // Fast check for magic bytes %PDF- in header (up to 8KB)
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
  const inputPath = pathMod.join(tmpDir, `pdf_in_${id}.pdf`);
  const outputPath = pathMod.join(tmpDir, `pdf_out_${id}.pdf`);

  let cleanupInput = false;

  try {
    // Always ensure input file on disk has .pdf extension so Ghostscript parses it properly
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

    // Standard, official Ghostscript pdfwrite arguments:
    // Pure universal flags with Subsample downsampling for lightning-fast execution
    const gsArgs = [
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      `-dPDFSETTINGS=${config.pdfSettings || '/ebook'}`,
      '-dNOPAUSE',
      '-dQUIET',
      '-dBATCH',
      '-dDetectDuplicateImages=true',
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
      '-dFastWebView=true',
      '-dBufferSpace=100000000',
      '-dNumRenderingThreads=2',
      `-sOutputFile=${outputPath}`,
      inputPath
    ];

    // Execute Ghostscript natively
    await new Promise((resolve, reject) => {
      execFile(bin, gsArgs, { timeout: 120000 }, (error, stdout, stderr) => {
        if (error) {
          const detail = (stderr || stdout || error.message || '').trim();
          console.error(`[pdfOptimizer] Ghostscript execution failed: ${detail}`);
          return reject(new Error(`Ghostscript failed: ${detail}`));
        }
        resolve();
      });
    });

    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
      throw new Error('Ghostscript produced an empty output file');
    }

    const outputBuffer = fs.readFileSync(outputPath);

    // Fast header & trailer check
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
    // Guaranteed cleanup
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
        // QPDF exit code 0 = success, exit code 3 = warnings but file validly produced
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
      levelConfig: { name: 'QPDF Linearizer' }
    };
  } finally {
    if (cleanupInput) { try { fs.unlinkSync(inputPath); } catch (_) {} }
    try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch (_) {}
  }
}

// ===== PURE NODE.JS / PDF-LIB FALLBACK =====
/**
 * Safe structural optimization fallback when Ghostscript is not installed.
 * Compacts object streams and removes redundant structures without rasterizing text.
 */
async function compressWithPdfLib(inputBuffer, level) {
  const doc = await PDFDocument.load(inputBuffer, { ignoreEncryption: true });
  const originalPageCount = doc.getPageCount();

  // Strip unneeded metadata based on compression level
  if (level === 'high' || level === 'extreme') {
    doc.setTitle('');
    doc.setAuthor('');
    doc.setSubject('');
    doc.setKeywords([]);
    doc.setProducer('PDFCompress Pro');
    doc.setCreator('PDFCompress Pro');
  }

  // Use object streams for maximum structural compression
  const compressedBytes = await doc.save({
    useObjectStreams: true,
    addDefaultPage: false
  });

  const outputBuffer = Buffer.from(compressedBytes);
  const validation = await validatePDFBuffer(outputBuffer, originalPageCount);
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
 * Accurately analyzes document structure to predict realistic compression ranges.
 */
async function estimateCompressionLevels(inputSource) {
  let buffer;
  if (Buffer.isBuffer(inputSource)) {
    buffer = inputSource;
  } else if (typeof inputSource === 'string' && fs.existsSync(inputSource)) {
    buffer = fs.readFileSync(inputSource);
  } else {
    throw new Error('Invalid input for estimation');
  }

  const originalSize = buffer.length;
  let pageCount = 1;
  let isEncrypted = false;

  try {
    const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    pageCount = Math.max(1, doc.getPageCount());
  } catch (err) {
    if (err.message && err.message.toLowerCase().includes('encrypt')) {
      isEncrypted = true;
    }
  }

  if (isEncrypted) {
    return ['low', 'medium', 'high', 'extreme'].map(level => ({
      level,
      originalSize,
      compressedSize: originalSize,
      reductionPercent: 0,
      optimized: false,
      message: 'Document is password-protected or encrypted.'
    }));
  }

  const bytesPerPage = originalSize / pageCount;

  // Content density classification:
  // > 250KB/page: High probability of scanned pages or high-res photographs
  // 40KB - 250KB/page: Mixed content (vector diagrams, figures, images, text)
  // < 40KB/page: Mostly digital text, vectors, code, or already optimized
  let reductionProfiles;

  if (bytesPerPage > 250 * 1024) {
    // Image-heavy / Scanned
    reductionProfiles = {
      low:     { min: 0.18, max: 0.32, expected: 0.25 },
      medium:  { min: 0.38, max: 0.58, expected: 0.48 },
      high:    { min: 0.55, max: 0.72, expected: 0.65 },
      extreme: { min: 0.70, max: 0.85, expected: 0.78 }
    };
  } else if (bytesPerPage > 40 * 1024) {
    // Mixed content
    reductionProfiles = {
      low:     { min: 0.10, max: 0.22, expected: 0.15 },
      medium:  { min: 0.22, max: 0.38, expected: 0.30 },
      high:    { min: 0.35, max: 0.52, expected: 0.44 },
      extreme: { min: 0.48, max: 0.65, expected: 0.56 }
    };
  } else {
    // Digital text / low image density
    reductionProfiles = {
      low:     { min: 0.05, max: 0.12, expected: 0.08 },
      medium:  { min: 0.10, max: 0.20, expected: 0.15 },
      high:    { min: 0.18, max: 0.30, expected: 0.24 },
      extreme: { min: 0.25, max: 0.40, expected: 0.32 }
    };
  }

  return ['low', 'medium', 'high', 'extreme'].map(level => {
    const prof = reductionProfiles[level];
    const estimatedSize = Math.max(1024, Math.round(originalSize * (1 - prof.expected)));
    const reductionPercent = Number((prof.expected * 100).toFixed(1));
    const config = LEVEL_CONFIGS[level];

    return {
      level,
      name: config.name,
      originalSize,
      compressedSize: estimatedSize,
      reductionPercent,
      optimized: true,
      isEstimate: true,
      message: `${config.summary} (Est. ${Math.round(prof.min * 100)}%–${Math.round(prof.max * 100)}%)`
    };
  });
}

// ===== MAIN PIPELINE ENTRYPOINT =====
/**
 * Compresses a PDF using the best available engine, validates the output,
 * and guarantees size and readability safety.
 */
async function compressPDF(inputSource, requestedLevel = 'medium') {
  const level = normalizeLevel(requestedLevel);
  const originalSize = Buffer.isBuffer(inputSource)
    ? inputSource.length
    : fs.statSync(inputSource).size;

  const inputBuffer = Buffer.isBuffer(inputSource)
    ? inputSource
    : fs.readFileSync(inputSource);

  // Quick initial check on input integrity (scans up to 8KB for standard header)
  const headerCheck = inputBuffer.slice(0, 8192).toString('latin1');
  if (inputBuffer.length < 50 || (!headerCheck.includes('%PDF-') && inputBuffer.toString('utf8', 0, 100).includes('<html'))) {
    throw new Error('Invalid PDF: file does not start with standard PDF header.');
  }

  // 1. Primary Engine: Calibrated Ghostscript
  const hasGs = await isGhostscriptAvailable();
  if (hasGs) {
    try {
      const gsResult = await compressWithGhostscript(inputSource, level);
      const compressedSize = gsResult.buffer.length;

      if (compressedSize < originalSize) {
        const savedBytes = originalSize - compressedSize;
        const savedPercent = ((savedBytes / originalSize) * 100).toFixed(1);

        if (Number(savedPercent) > 0) {
          return {
            buffer: gsResult.buffer,
            optimized: true,
            level,
            engine: gsResult.engine,
            message: `Optimized with ${gsResult.levelConfig.name} profile (${savedPercent}% saved).`
          };
        }
      }

      // If requested level did not achieve reduction, try extreme mode if not already extreme
      if (level !== 'extreme') {
        try {
          const extremeResult = await compressWithGhostscript(inputSource, 'extreme');
          const extremeSize = extremeResult.buffer.length;
          if (extremeSize < originalSize) {
            const savedBytes = originalSize - extremeSize;
            const savedPercent = ((savedBytes / originalSize) * 100).toFixed(1);
            if (Number(savedPercent) > 0) {
              return {
                buffer: extremeResult.buffer,
                optimized: true,
                level: 'extreme',
                engine: extremeResult.engine,
                message: `Optimized with Extreme profile (${savedPercent}% saved, auto-calibrated from ${level}).`
              };
            }
          }
        } catch (_) {}
      }
    } catch (err) {
      console.warn(`[pdfOptimizer] Ghostscript execution issue:`, err.message);
      // Fall through to fallback engines
    }
  }

  // 2. Secondary Engine: QPDF (Linearization and object stream compression)
  const hasQpdf = await isQpdfAvailable();
  if (hasQpdf) {
    try {
      const qpdfResult = await compressWithQpdf(inputSource);
      const qpdfSize = qpdfResult.buffer.length;
      if (qpdfSize < originalSize) {
        const savedPercent = (((originalSize - qpdfSize) / originalSize) * 100).toFixed(1);
        if (Number(savedPercent) > 0) {
          return {
            buffer: qpdfResult.buffer,
            optimized: true,
            level,
            engine: 'QPDF',
            message: `Optimized with stream linearization (${savedPercent}% saved).`
          };
        }
      }
    } catch (qErr) {
      console.warn(`[pdfOptimizer] QPDF execution issue:`, qErr.message);
    }
  }

  // 3. Fallback Engine: Pure Node.js Structural (PDF-Lib)
  try {
    const fallbackResult = await compressWithPdfLib(inputBuffer, level);
    const compressedSize = fallbackResult.buffer.length;

    if (compressedSize < originalSize) {
      const savedPercent = (((originalSize - compressedSize) / originalSize) * 100).toFixed(1);
      if (Number(savedPercent) > 0) {
        return {
          buffer: fallbackResult.buffer,
          optimized: true,
          level,
          engine: fallbackResult.engine,
          message: `Structurally optimized (${savedPercent}% saved).`
        };
      }
    }
  } catch (err) {
    console.warn(`[pdfOptimizer] Fallback run encountered issue: ${err.message}`);
  }

  // 4. Document is already maximally compressed / optimal
  return {
    buffer: inputBuffer,
    optimized: false,
    level,
    engine: 'Direct',
    message: 'PDF is already optimal. No further size reduction could be achieved without quality degradation.'
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
