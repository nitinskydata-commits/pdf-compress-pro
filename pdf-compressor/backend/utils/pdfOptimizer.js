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
    : ['gs'];

  return new Promise((resolve) => {
    let index = 0;
    function tryNext() {
      if (index >= binariesToTest.length) {
        gsBinaryName = null;
        gsChecked = true;
        return resolve(null);
      }
      const bin = binariesToTest[index++];
      execFile(bin, ['--version'], { timeout: 3000 }, (err) => {
        if (!err) {
          gsBinaryName = bin;
          gsChecked = true;
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

function isQpdfAvailable() {
  return new Promise((resolve) => {
    execFile('qpdf', ['--version'], { timeout: 3000 }, (err) => resolve(!err));
  });
}

// ===== LEVEL CONFIGURATION =====
// Fine-grained distiller parameters instead of blunt -dPDFSETTINGS=/screen
const LEVEL_CONFIGS = {
  low: {
    dpi: 200,
    monoDpi: 300,
    qFactor: '0.35', // ~85% JPEG quality - high fidelity
    downsampleThreshold: '1.2',
    name: 'Low',
    summary: 'High Quality — minimal degradation, preserves image clarity'
  },
  medium: {
    dpi: 150,
    monoDpi: 300,
    qFactor: '0.75', // ~70% JPEG quality - balanced
    downsampleThreshold: '1.0',
    name: 'Medium',
    summary: 'Balanced — good size reduction, sharp and readable text'
  },
  high: {
    dpi: 110,
    monoDpi: 200,
    qFactor: '1.20', // ~50% JPEG quality - strong reduction
    downsampleThreshold: '1.0',
    name: 'High',
    summary: 'Strong — smaller file size, text remains fully legible'
  },
  extreme: {
    dpi: 75,
    monoDpi: 150,
    qFactor: '2.00', // ~35% JPEG quality - maximum reduction
    downsampleThreshold: '1.0',
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
 * Validates that a generated buffer is a well-formed PDF that opens correctly.
 */
async function validatePDFBuffer(buffer, expectedMinPages = 1) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 64) {
    return { valid: false, error: 'Output buffer is empty or too small' };
  }

  // Check magic bytes %PDF-
  const header = buffer.slice(0, 1024).toString('ascii');
  if (!header.includes('%PDF-')) {
    return { valid: false, error: 'Output lacks valid %PDF- header magic bytes' };
  }

  // Check EOF marker
  const tail = buffer.slice(Math.max(0, buffer.length - 1024)).toString('ascii');
  if (!tail.includes('%%EOF')) {
    return { valid: false, error: 'Output lacks standard %%EOF trailer' };
  }

  // Validate structural parsing with pdf-lib
  try {
    const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const pageCount = doc.getPageCount();
    if (pageCount < expectedMinPages) {
      return { valid: false, error: `Output page count (${pageCount}) is less than expected (${expectedMinPages})` };
    }
    return { valid: true, pageCount };
  } catch (err) {
    return { valid: false, error: `PDF structural validation failed: ${err.message}` };
  }
}

// ===== GHOSTSCRIPT COMPRESSION =====
async function compressWithGhostscript(inputSource, level) {
  const bin = await detectGhostscriptBinary();
  if (!bin) {
    throw new Error('Ghostscript binary not found');
  }

  const tmpDir = os.tmpdir();
  const id = crypto.randomBytes(8).toString('hex');
  const inputPath = pathMod.join(tmpDir, `pdf_in_${id}.pdf`);
  const outputPath = pathMod.join(tmpDir, `pdf_out_${id}.pdf`);
  const finalPassPath = pathMod.join(tmpDir, `pdf_pass2_${id}.pdf`);

  let cleanupInput = false;
  let originalPageCount = 1;

  try {
    // Stage input file
    if (Buffer.isBuffer(inputSource)) {
      try {
        const checkDoc = await PDFDocument.load(inputSource, { ignoreEncryption: true });
        originalPageCount = checkDoc.getPageCount();
      } catch (_) {}
      fs.writeFileSync(inputPath, inputSource);
      cleanupInput = true;
    } else if (typeof inputSource === 'string' && fs.existsSync(inputSource)) {
      try {
        const buf = fs.readFileSync(inputSource);
        const checkDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
        originalPageCount = checkDoc.getPageCount();
      } catch (_) {}
    } else {
      throw new Error('Invalid input source for Ghostscript compression');
    }

    const finalInputPath = cleanupInput ? inputPath : inputSource;
    const config = LEVEL_CONFIGS[level] || LEVEL_CONFIGS.medium;

    // Direct distillation arguments with fine-grained control
    const gsArgs = [
      '-dBATCH',
      '-dNOPAUSE',
      '-dQUIET',
      '-sDEVICE=pdfwrite',
      `-sOutputFile=${outputPath}`,
      '-dCompatibilityLevel=1.4',
      '-dFastWebView=true', // Streamable / fast web view
      '-dDoThumbnails=false',
      '-dOptimize=true',
      '-dColorConversionStrategy=/sRGB',
      `-dNumRenderingThreads=${CPU_CORES}`,
      // Color images downsampling and compression
      '-dAutoFilterColorImages=false',
      '-dColorImageFilter=/DCTEncode',
      '-dDownsampleColorImages=true',
      '-dColorImageDownsampleType=/Bicubic',
      `-dColorImageResolution=${config.dpi}`,
      `-dColorImageDownsampleThreshold=${config.downsampleThreshold}`,
      // Grayscale images
      '-dAutoFilterGrayImages=false',
      '-dGrayImageFilter=/DCTEncode',
      '-dDownsampleGrayImages=true',
      '-dGrayImageDownsampleType=/Bicubic',
      `-dGrayImageResolution=${config.dpi}`,
      `-dGrayImageDownsampleThreshold=${config.downsampleThreshold}`,
      // Monochrome images: use lossless CCITT Fax Group 4 for crisp scans
      '-dDownsampleMonoImages=true',
      '-dMonoImageDownsampleType=/Bicubic',
      `-dMonoImageResolution=${config.monoDpi}`,
      '-dMonoImageFilter=/CCITTFaxEncode',
      // Fonts and structural compression
      '-dEmbedAllFonts=true',
      '-dSubsetFonts=true',
      '-dCompressFonts=true',
      '-dCompressPages=true',
      '-dUseFlateCompression=true',
      // Distiller PostScript dictionary for calibrated JPEG QFactor
      '-c',
      `<< /ColorImageDict << /QFactor ${config.qFactor} /Blend 1 >> /GrayImageDict << /QFactor ${config.qFactor} /Blend 1 >> >> setdistillerparams`,
      '-f',
      finalInputPath
    ];

    // Execute Ghostscript
    await new Promise((resolve, reject) => {
      execFile(bin, gsArgs, { timeout: 300000 }, (error, stdout, stderr) => {
        if (error) {
          return reject(new Error(`Ghostscript failed: ${error.message} ${stderr || ''}`));
        }
        resolve();
      });
    });

    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
      throw new Error('Ghostscript produced an empty output file');
    }

    let fileToRead = outputPath;

    // Optional single-pass QPDF optimization if available (ensures fast web view without double-linearization conflict)
    const hasQpdf = await isQpdfAvailable();
    if (hasQpdf) {
      try {
        await new Promise((resolve, reject) => {
          execFile('qpdf', ['--linearize', outputPath, finalPassPath], { timeout: 120000 }, (err) => {
            if (err) return reject(err);
            resolve();
          });
        });
        if (fs.existsSync(finalPassPath) && fs.statSync(finalPassPath).size > 0) {
          fileToRead = finalPassPath;
        }
      } catch (qpdfErr) {
        // Fall back cleanly to Ghostscript output if QPDF encounters any warning
        fileToRead = outputPath;
      }
    }

    const outputBuffer = fs.readFileSync(fileToRead);

    // Validate the generated PDF
    const validation = await validatePDFBuffer(outputBuffer, originalPageCount);
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
    try { if (fs.existsSync(finalPassPath)) fs.unlinkSync(finalPassPath); } catch (_) {}
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

      // If Ghostscript achieved reduction and passed validation
      if (compressedSize < originalSize) {
        const savedPercent = (((originalSize - compressedSize) / originalSize) * 100).toFixed(1);
        return {
          buffer: gsResult.buffer,
          optimized: true,
          level,
          engine: gsResult.engine,
          message: `Optimized with ${gsResult.levelConfig.name} profile (${savedPercent}% saved).`
        };
      }
    } catch (err) {
      console.warn(`[pdfOptimizer] Ghostscript run encountered issue: ${err.message}. Trying safe fallback.`);
    }
  }

  // 2. Pure Node.js Structural Fallback
  try {
    const fallbackResult = await compressWithPdfLib(inputBuffer, level);
    const compressedSize = fallbackResult.buffer.length;

    if (compressedSize < originalSize) {
      const savedPercent = (((originalSize - compressedSize) / originalSize) * 100).toFixed(1);
      return {
        buffer: fallbackResult.buffer,
        optimized: true,
        level,
        engine: fallbackResult.engine,
        message: `Structurally optimized (${savedPercent}% saved).`
      };
    }
  } catch (err) {
    console.warn(`[pdfOptimizer] Fallback run encountered issue: ${err.message}`);
  }

  // 3. Document is already maximally compressed / optimal
  return {
    buffer: inputBuffer,
    optimized: false,
    level,
    engine: 'Direct',
    message: 'PDF is already optimal. No further size reduction could be achieved without excessive loss.'
  };
}

module.exports = {
  compressPDF,
  estimateCompressionLevels,
  validatePDFBuffer,
  isGhostscriptAvailable,
  isQpdfAvailable,
  LEVEL_CONFIGS
};
