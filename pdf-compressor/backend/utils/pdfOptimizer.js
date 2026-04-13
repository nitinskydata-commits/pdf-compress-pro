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

/**
 * Compresses PDF using Ghostscript.
 * @param {Buffer} inputBuffer 
 * @param {string} level 
 * @param {boolean} sampleOnly - If true, only compresses the first few pages for speed.
 */
async function compressWithGhostscript(inputBuffer, level, sampleOnly = false) {
  const tmpDir = os.tmpdir();
  const id = crypto.randomBytes(8).toString('hex');
  const inputPath = pathMod.join(tmpDir, `pdf_in_${id}.pdf`);
  const outputPath = pathMod.join(tmpDir, `pdf_out_${id}.pdf`);

  let finalInputBuffer = inputBuffer;

  // If sampling, create a smaller PDF first
  if (sampleOnly) {
    try {
      const doc = await PDFDocument.load(inputBuffer, { ignoreEncryption: true });
      const pagesToKeep = Math.min(doc.getPageCount(), 5);
      if (pagesToKeep < doc.getPageCount()) {
        const samplerDoc = await PDFDocument.create();
        const copiedPages = await samplerDoc.copyPages(doc, Array.from({ length: pagesToKeep }, (_, i) => i));
        copiedPages.forEach(p => samplerDoc.addPage(p));
        finalInputBuffer = Buffer.from(await samplerDoc.save());
      }
    } catch (e) {
      console.warn('[pdfOptimizer] Sampling failed, using full file:', e.message);
    }
  }

  fs.writeFileSync(inputPath, finalInputBuffer);

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
        if (sampleOnly) {
          // If we sampled, we need to estimate the full size
          const originalSampleSize = finalInputBuffer.length;
          const compressedSampleSize = output.length;
          const ratio = compressedSampleSize / originalSampleSize;
          // We return a buffer that simulates the ratio for estimation purposes
          const estimatedSize = Math.round(inputBuffer.length * ratio);
          resolve({ buffer: Buffer.alloc(estimatedSize), isEstimate: true, ratio });
        } else {
          resolve({ buffer: output, isEstimate: false });
        }
        try { fs.unlinkSync(outputPath); } catch (_) { /* ignore */ }
      } catch (e) {
        reject(e);
      }
    });
  });
}

// ===== CANVAS-BASED FALLBACK =====
async function loadPdfJs() {
  try { return await import('pdfjs-dist/legacy/build/pdf.mjs'); } 
  catch (_) { return await import('pdfjs-dist/legacy/build/pdf.js'); }
}

function getStructuralProfiles(level) {
  if (level === 'low')    return [{ useObjectStreams: true, objectsPerTick: 140 }];
  if (level === 'high')   return [{ useObjectStreams: true, objectsPerTick: 40  }];
  if (level === 'extreme')return [{ useObjectStreams: true, objectsPerTick: 20  }];
  return [{ useObjectStreams: true, objectsPerTick: 80 }];
}

function getRasterProfiles(level) {
  if (level === 'low')    return [{ scale: 1.2, quality: 0.68, grayscale: false }];
  if (level === 'medium') return [{ scale: 0.8, quality: 0.32, grayscale: false }];
  if (level === 'high')   return [{ scale: 0.5, quality: 0.15, grayscale: true }];
  if (level === 'extreme')return [{ scale: 0.35, quality: 0.08, grayscale: true }];
  return [];
}

async function createStructuralCopy(fileBuffer, saveOptions) {
  const source = await PDFDocument.load(fileBuffer, { ignoreEncryption: true, updateMetadata: false });
  const target = await PDFDocument.create();
  const pages = await target.copyPages(source, source.getPageIndices());
  pages.forEach((page) => target.addPage(page));
  return target.save({ addDefaultPage: false, updateFieldAppearances: false, ...saveOptions });
}

/**
 * Rasterizes pages in parallel for speed.
 */
async function createRasterizedCopy(fileBuffer, rasterProfile, sampleOnly = false) {
  let createCanvas;
  try { createCanvas = require('@napi-rs/canvas').createCanvas; } 
  catch (_) { throw new Error('@napi-rs/canvas not available'); }

  const pdfjs = await loadPdfJs();
  const source = await pdfjs.getDocument({ data: new Uint8Array(fileBuffer), disableWorker: true, isEvalSupported: false }).promise;
  const target = await PDFDocument.create();

  const numPages = source.numPages;
  const pagesToProcess = sampleOnly ? Math.min(numPages, 3) : numPages;

  // Process pages in chunks to avoid slamming memory
  const CONCURRENCY = 3;
  for (let i = 1; i <= pagesToProcess; i += CONCURRENCY) {
    const chunk = Array.from({ length: Math.min(CONCURRENCY, pagesToProcess - i + 1) }, (_, index) => i + index);
    
    await Promise.all(chunk.map(async (pageNumber) => {
      const page = await source.getPage(pageNumber);
      const viewport = page.getViewport({ scale: rasterProfile.scale });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      const context = canvas.getContext('2d');
      
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: context, viewport }).promise;

      if (rasterProfile.grayscale) {
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        for (let j = 0; j < imageData.data.length; j += 4) {
          const gray = Math.round(imageData.data[j]*0.299 + imageData.data[j+1]*0.587 + imageData.data[j+2]*0.114);
          imageData.data[j] = gray; imageData.data[j+1] = gray; imageData.data[j+2] = gray;
        }
        context.putImageData(imageData, 0, 0);
      }

      const jpegBytes = canvas.toBuffer('image/jpeg', { quality: rasterProfile.quality });
      const image = await target.embedJpg(jpegBytes);
      const pdfPage = target.addPage([page.view[2], page.view[3]]);
      pdfPage.drawImage(image, { x: 0, y: 0, width: pdfPage.getWidth(), height: pdfPage.getHeight() });
    }));
  }

  const resultBuffer = await target.save({ addDefaultPage: false, useObjectStreams: true });
  await source.destroy();

  if (sampleOnly && pagesToProcess < numPages) {
    const ratio = resultBuffer.length / (fileBuffer.length * (pagesToProcess / numPages));
    const estimatedSize = Math.round(fileBuffer.length * ratio);
    return { buffer: Buffer.alloc(estimatedSize), ratio };
  }

  return { buffer: resultBuffer };
}

// ===== MAIN COMPRESS FUNCTION =====
async function compressPDF(fileBuffer, compressionLevel = 'medium', sampleOnly = false) {
  const originalBytes = Uint8Array.from(fileBuffer);

  // 1. Ghostscript
  if (await isGhostscriptAvailable()) {
    try {
      const gsRes = await compressWithGhostscript(fileBuffer, compressionLevel, sampleOnly);
      if (gsRes.buffer.length < originalBytes.length || sampleOnly) {
        return { buffer: gsRes.buffer, optimized: true, message: 'PDF compressed with Ghostscript.', isEstimate: sampleOnly };
      }
    } catch (err) {
      console.error('[pdfOptimizer] GS failed:', err.message);
    }
  }

  // 2. Structural
  if (!sampleOnly) {
    for (const profile of getStructuralProfiles(compressionLevel)) {
      try {
        const bytes = await createStructuralCopy(fileBuffer, profile);
        if (bytes.length < originalBytes.length) return { buffer: bytes, optimized: true, message: 'PDF compressed (structural).' };
      } catch (_) {}
    }
  }

  // 3. Rasterization Fallback
  for (const profile of getRasterProfiles(compressionLevel)) {
    try {
      const res = await createRasterizedCopy(fileBuffer, profile, sampleOnly);
      if (res.buffer.length < originalBytes.length || sampleOnly) {
        return { buffer: res.buffer, optimized: true, message: 'PDF compressed (rasterized).', isEstimate: sampleOnly };
      }
    } catch (err) {
      console.error('[pdfOptimizer] Raster failed:', err.message);
    }
  }

  return { buffer: originalBytes, optimized: false, message: 'Already optimized.' };
}

async function estimateCompressionLevels(fileBuffer, levels = ['low', 'medium', 'high', 'extreme']) {
  const estimates = [];
  // Use map to run estimations in parallel for even more speed
  const promises = levels.map(async (level) => {
    try {
      const result = await compressPDF(fileBuffer, level, true);
      const compressedSize = result.buffer.length;
      const reductionPercent = Math.max(0, (1 - compressedSize / fileBuffer.length) * 100);
      return {
        level,
        originalSize: fileBuffer.length,
        compressedSize,
        reductionPercent: Number(reductionPercent.toFixed(1)),
        optimized: true,
        message: 'Estimated size'
      };
    } catch (err) {
      console.error(`[pdfOptimizer] Est failed for ${level}:`, err.message);
      return { level, originalSize: fileBuffer.length, compressedSize: fileBuffer.length, reductionPercent: 0, optimized: false };
    }
  });

  return Promise.all(promises);
}

module.exports = { compressPDF, estimateCompressionLevels };
