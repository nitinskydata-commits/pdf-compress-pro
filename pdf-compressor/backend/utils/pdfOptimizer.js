const { PDFDocument } = require('pdf-lib');
const { execFile } = require('child_process');
const os = require('os');
const pathMod = require('path');
const fs = require('fs');
const crypto = require('crypto');

// ===== GHOSTSCRIPT (Primary) =====
function isGhostscriptAvailable() {
  return new Promise((resolve) => {
    execFile('gs', ['--version'], (err) => resolve(!err));
  });
}

async function compressWithGhostscript(inputBuffer, level) {
  const tmpDir = os.tmpdir();
  const id = crypto.randomBytes(8).toString('hex');
  const inputPath = pathMod.join(tmpDir, `pdf_in_${id}.pdf`);
  const outputPath = pathMod.join(tmpDir, `pdf_out_${id}.pdf`);

  fs.writeFileSync(inputPath, inputBuffer);

  const settingsMap = {
    low:     { pdfSettings: '/ebook',  dpi: 150 },
    medium:  { pdfSettings: '/screen', dpi: 96  },
    high:    { pdfSettings: '/screen', dpi: 72  },
    extreme: { pdfSettings: '/screen', dpi: 48  }
  };

  const { pdfSettings, dpi } = settingsMap[level] || settingsMap.medium;

  const args = [
    '-dBATCH', '-dNOPAUSE', '-dQUIET',
    '-sDEVICE=pdfwrite',
    '-dCompatibilityLevel=1.4',
    `-dPDFSETTINGS=${pdfSettings}`,
    `-dColorImageResolution=${dpi}`,
    `-dGrayImageResolution=${dpi}`,
    `-dMonoImageResolution=${dpi}`,
    '-dColorImageDownsampleType=/Bicubic',
    '-dGrayImageDownsampleType=/Bicubic',
    '-dDownsampleColorImages=true',
    '-dDownsampleGrayImages=true',
    '-dDownsampleMonoImages=true',
    '-dEmbedAllFonts=true',
    '-dSubsetFonts=true',
    '-dCompressFonts=true',
    '-dCompressPages=true',
    `-sOutputFile=${outputPath}`,
    inputPath
  ];

  return new Promise((resolve, reject) => {
    execFile('gs', args, { timeout: 120000 }, (error) => {
      try { fs.unlinkSync(inputPath); } catch (_) { /* ignore */ }

      if (error) {
        try { fs.unlinkSync(outputPath); } catch (_) { /* ignore */ }
        reject(new Error(`Ghostscript error: ${error.message}`));
        return;
      }

      try {
        const output = fs.readFileSync(outputPath);
        fs.unlinkSync(outputPath);
        resolve(output);
      } catch (e) {
        reject(e);
      }
    });
  });
}

// ===== CANVAS-BASED FALLBACK =====
async function loadPdfJs() {
  // pdfjs-dist v5 uses .mjs, v3 uses .js — try both
  try {
    return await import('pdfjs-dist/legacy/build/pdf.mjs');
  } catch (_) {
    return await import('pdfjs-dist/legacy/build/pdf.js');
  }
}

function getStructuralProfiles(level) {
  if (level === 'low')    return [{ useObjectStreams: true, objectsPerTick: 140 }];
  if (level === 'high')   return [{ useObjectStreams: true, objectsPerTick: 40  }];
  if (level === 'extreme')return [{ useObjectStreams: true, objectsPerTick: 20  }];
  return [{ useObjectStreams: true, objectsPerTick: 80 }]; // medium
}

function getRasterProfiles(level) {
  if (level === 'low')    return [{ scale: 1.2, quality: 0.68, grayscale: false }, { scale: 1.0, quality: 0.56, grayscale: false }];
  if (level === 'medium') return [{ scale: 0.9, quality: 0.34, grayscale: false }, { scale: 0.78, quality: 0.26, grayscale: false }, { scale: 0.68, quality: 0.18, grayscale: true }];
  if (level === 'high')   return [{ scale: 0.62, quality: 0.16, grayscale: true }, { scale: 0.5, quality: 0.12, grayscale: true }, { scale: 0.35, quality: 0.07, grayscale: true }];
  if (level === 'extreme')return [{ scale: 0.5, quality: 0.12, grayscale: true }, { scale: 0.38, quality: 0.08, grayscale: true }, { scale: 0.28, quality: 0.05, grayscale: true }, { scale: 0.22, quality: 0.04, grayscale: true }];
  return [];
}

function applyGrayscale(context, width, height) {
  const imageData = context.getImageData(0, 0, width, height);
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    data[i] = gray; data[i + 1] = gray; data[i + 2] = gray;
  }
  context.putImageData(imageData, 0, 0);
}

async function createStructuralCopy(fileBuffer, saveOptions) {
  const source = await PDFDocument.load(fileBuffer, { ignoreEncryption: true, updateMetadata: false });
  const target = await PDFDocument.create();
  const pages = await target.copyPages(source, source.getPageIndices());
  pages.forEach((page) => target.addPage(page));
  return target.save({ addDefaultPage: false, updateFieldAppearances: false, ...saveOptions });
}

async function createRasterizedCopy(fileBuffer, rasterProfile) {
  let createCanvas;
  try {
    createCanvas = require('@napi-rs/canvas').createCanvas;
  } catch (_) {
    throw new Error('@napi-rs/canvas not available');
  }

  const pdfjs = await loadPdfJs();
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(fileBuffer),
    disableWorker: true,
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true
  });
  const source = await loadingTask.promise;
  const target = await PDFDocument.create();

  for (let pageNumber = 1; pageNumber <= source.numPages; pageNumber += 1) {
    const page = await source.getPage(pageNumber);
    const viewport = page.getViewport({ scale: rasterProfile.scale });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const context = canvas.getContext('2d');

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: context, viewport }).promise;

    if (rasterProfile.grayscale) applyGrayscale(context, canvas.width, canvas.height);

    const jpegBytes = canvas.toBuffer('image/jpeg', { quality: rasterProfile.quality, progressive: true, chromaSubsampling: true });
    const image = await target.embedJpg(jpegBytes);
    const pdfPage = target.addPage([page.view[2], page.view[3]]);
    pdfPage.drawImage(image, { x: 0, y: 0, width: pdfPage.getWidth(), height: pdfPage.getHeight() });
  }

  await source.destroy();
  return target.save({ addDefaultPage: false, useObjectStreams: true, objectsPerTick: 20 });
}

// ===== MAIN COMPRESS FUNCTION =====
async function compressPDF(fileBuffer, compressionLevel = 'medium') {
  const originalBytes = Uint8Array.from(fileBuffer);

  // --- Try Ghostscript first (best quality compression) ---
  const gsAvailable = await isGhostscriptAvailable();
  if (gsAvailable) {
    try {
      const gsResult = await compressWithGhostscript(fileBuffer, compressionLevel);
      console.log(`[pdfOptimizer] Ghostscript: ${(originalBytes.length / 1024 / 1024).toFixed(2)} MB → ${(gsResult.length / 1024 / 1024).toFixed(2)} MB`);
      if (gsResult.length < originalBytes.length) {
        return { buffer: gsResult, optimized: true, message: 'PDF compressed with Ghostscript engine.' };
      }
    } catch (err) {
      console.error('[pdfOptimizer] Ghostscript failed, falling back to canvas:', err.message);
    }
  } else {
    console.warn('[pdfOptimizer] Ghostscript not available, using canvas fallback.');
  }

  // --- Canvas-based fallback ---
  const candidates = [];

  for (const profile of getStructuralProfiles(compressionLevel)) {
    try {
      const bytes = await createStructuralCopy(fileBuffer, profile);
      candidates.push({ bytes, method: 'structural' });
    } catch (err) {
      console.error('[pdfOptimizer] Structural candidate failed:', err.message);
    }
  }

  for (const rasterProfile of getRasterProfiles(compressionLevel)) {
    try {
      const rasterized = await createRasterizedCopy(fileBuffer, rasterProfile);
      if (rasterized) {
        console.log(`[pdfOptimizer] Canvas raster (scale ${rasterProfile.scale}): ${(rasterized.length / 1024 / 1024).toFixed(2)} MB`);
        candidates.push({ bytes: rasterized, method: 'rasterized' });
      }
    } catch (err) {
      console.error(`[pdfOptimizer] Canvas raster (scale ${rasterProfile.scale}) failed:`, err.message);
    }
  }

  if (candidates.length === 0) {
    throw new Error('This PDF could not be compressed. Try a different file or a lower compression level.');
  }

  const best = candidates.reduce((smallest, current) =>
    current.bytes.length < smallest.bytes.length ? current : smallest
  );

  if (best.bytes.length < originalBytes.length) {
    return {
      buffer: best.bytes,
      optimized: true,
      message: best.method === 'rasterized'
        ? 'PDF compressed with strong image optimization.'
        : 'PDF compressed successfully.'
    };
  }

  return {
    buffer: originalBytes,
    optimized: false,
    message: 'PDF was already fully optimized. No smaller version was possible.'
  };
}

// ===== ESTIMATE FUNCTION =====
async function estimateCompressionLevels(fileBuffer, levels = ['low', 'medium', 'high', 'extreme']) {
  const estimates = [];
  for (const level of levels) {
    try {
      const result = await compressPDF(fileBuffer, level);
      const buffer = Buffer.from(result.buffer);
      const originalSize = fileBuffer.length;
      const compressedSize = buffer.length;
      const reductionPercent = Math.max(0, (1 - compressedSize / originalSize) * 100);
      estimates.push({
        level,
        originalSize,
        compressedSize,
        reductionPercent: Number(reductionPercent.toFixed(1)),
        optimized: result.optimized,
        message: result.message
      });
    } catch (err) {
      console.error(`[pdfOptimizer] Estimation failed for level ${level}:`, err.message);
    }
  }
  return estimates;
}

module.exports = { compressPDF, estimateCompressionLevels };
