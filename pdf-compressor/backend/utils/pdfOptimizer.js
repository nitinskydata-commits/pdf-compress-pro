const { PDFDocument } = require('pdf-lib');
const { execFile } = require('child_process');
const os = require('os');
const pathMod = require('path');
const fs = require('fs');
const crypto = require('crypto');

// ===== HARDWARE DETECTION =====
const CPU_CORES = os.cpus().length || 2;
const MAX_CONCURRENCY = Math.max(1, CPU_CORES);

// ===== GHOSTSCRIPT (C-POWERED ENGINE) =====
function isGhostscriptAvailable() {
  return new Promise((resolve) => {
    execFile('gs', ['--version'], (err) => resolve(!err));
  });
}

/**
 * High-speed Ghostscript implementation with multi-threading
 */
async function compressWithGhostscript(inputBuffer, level, sampleOnly = false) {
  const tmpDir = os.tmpdir();
  const id = crypto.randomBytes(8).toString('hex');
  const inputPath = pathMod.join(tmpDir, `pdf_in_${id}.pdf`);
  const outputPath = pathMod.join(tmpDir, `pdf_out_${id}.pdf`);

  let finalInputBuffer = inputBuffer;

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
    } catch (_) {}
  }

  fs.writeFileSync(inputPath, finalInputBuffer);

  const settingsMap = {
    low:     { pdfSettings: '/ebook',  dpi: 150 },
    medium:  { pdfSettings: '/screen', dpi: 96  },
    high:    { pdfSettings: '/screen', dpi: 72  },
    extreme: { pdfSettings: '/screen', dpi: 40  } // Lower DPI for extreme
  };

  const { pdfSettings, dpi } = settingsMap[level] || settingsMap.medium;

  const args = [
    '-dBATCH', '-dNOPAUSE', '-dQUIET',
    '-sDEVICE=pdfwrite',
    '-dCompatibilityLevel=1.4',
    `-dNumRenderingThreads=${CPU_CORES}`, // Use multiple CPU cores
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
    execFile('gs', args, { timeout: 180000 }, (error) => {
      try { fs.unlinkSync(inputPath); } catch (_) {}

      if (error) {
        try { fs.unlinkSync(outputPath); } catch (_) {}
        reject(new Error(`Ghostscript failed: ${error.message}`));
        return;
      }

      try {
        const output = fs.readFileSync(outputPath);
        if (sampleOnly) {
          const ratio = output.length / finalInputBuffer.length;
          resolve({ buffer: Buffer.alloc(Math.round(inputBuffer.length * ratio)), ratio });
        } else {
          resolve({ buffer: output });
        }
        try { fs.unlinkSync(outputPath); } catch (_) {}
      } catch (e) {
        reject(e);
      }
    });
  });
}

// ===== CANVAS FALLBACK (RUST-POWERED RENDERING) =====
async function loadPdfJs() {
  try { return await import('pdfjs-dist/legacy/build/pdf.mjs'); } 
  catch (_) { return await import('pdfjs-dist/legacy/build/pdf.js'); }
}

function getRasterProfiles(level) {
  if (level === 'low')    return [{ scale: 1.1, quality: 0.65, grayscale: false }];
  if (level === 'medium') return [{ scale: 0.75, quality: 0.30, grayscale: false }];
  if (level === 'high')   return [{ scale: 0.45, quality: 0.12, grayscale: true }];
  if (level === 'extreme')return [{ scale: 0.28, quality: 0.05, grayscale: true }]; // Extreme image scaling
  return [];
}

async function createRasterizedCopy(fileBuffer, rasterProfile, sampleOnly = false) {
  let createCanvas;
  try { createCanvas = require('@napi-rs/canvas').createCanvas; } 
  catch (_) { throw new Error('Canvas buffer fallback not available.'); }

  const pdfjs = await loadPdfJs();
  const source = await pdfjs.getDocument({ data: new Uint8Array(fileBuffer), disableWorker: true, isEvalSupported: false }).promise;
  const target = await PDFDocument.create();

  const numPages = source.numPages;
  const pagesToProcess = sampleOnly ? Math.min(numPages, 3) : numPages;

  //Engaging MAX_CONCURRENCY for speed
  for (let i = 1; i <= pagesToProcess; i += MAX_CONCURRENCY) {
    const chunk = Array.from({ length: Math.min(MAX_CONCURRENCY, pagesToProcess - i + 1) }, (_, idx) => i + idx);
    
    await Promise.all(chunk.map(async (pageNumber) => {
      const page = await source.getPage(pageNumber);
      const viewport = page.getViewport({ scale: rasterProfile.scale });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      const context = canvas.getContext('2d');
      
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: context, viewport }).promise;

      if (rasterProfile.grayscale) {
        const img = context.getImageData(0, 0, canvas.width, canvas.height);
        for (let j = 0; j < img.data.length; j += 4) {
          const g = Math.round(img.data[j]*0.3 + img.data[j+1]*0.59 + img.data[j+2]*0.11);
          img.data[j] = img.data[j+1] = img.data[j+2] = g;
        }
        context.putImageData(img, 0, 0);
      }

      const jpeg = canvas.toBuffer('image/jpeg', { quality: rasterProfile.quality });
      const image = await target.embedJpg(jpeg);
      const pdfPage = target.addPage([page.view[2], page.view[3]]);
      pdfPage.drawImage(image, { x: 0, y: 0, width: pdfPage.getWidth(), height: pdfPage.getHeight() });
    }));
  }

  const result = await target.save({ useObjectStreams: true });
  await source.destroy();

  if (sampleOnly && pagesToProcess < numPages) {
    const ratio = result.length / (fileBuffer.length * (pagesToProcess / numPages));
    return { buffer: Buffer.alloc(Math.round(fileBuffer.length * ratio)), ratio };
  }
  return { buffer: result };
}

// ===== MAIN COMMANDER =====
async function compressPDF(fileBuffer, compressionLevel = 'medium', sampleOnly = false) {
  const originalSize = fileBuffer.length;

  // 1. Ghostscript is the king of speed and quality
  if (await isGhostscriptAvailable()) {
    try {
      const gsRes = await compressWithGhostscript(fileBuffer, compressionLevel, sampleOnly);
      if (gsRes.buffer.length < originalSize || sampleOnly) {
        return { buffer: gsRes.buffer, optimized: true, message: 'Flash-compressed with C-engine.', isEstimate: sampleOnly };
      }
    } catch (err) {
      console.error('[pdfOptimizer] C-engine failed:', err.message);
    }
  }

  // 2. Fallback to parallel rasterization
  for (const profile of getRasterProfiles(compressionLevel)) {
    try {
      const res = await createRasterizedCopy(fileBuffer, profile, sampleOnly);
      if (res.buffer.length < originalSize || sampleOnly) {
        return { buffer: res.buffer, optimized: true, message: 'Compressed with Rust-rendering fallback.', isEstimate: sampleOnly };
      }
    } catch (err) {
      console.error('[pdfOptimizer] Raster failed:', err.message);
    }
  }

  return { buffer: fileBuffer, optimized: false, message: 'File is already optimal.' };
}

async function estimateCompressionLevels(fileBuffer, levels = ['low', 'medium', 'high', 'extreme']) {
  // Parallel estimation
  const promises = levels.map(level => compressPDF(fileBuffer, level, true).then(res => ({
    level,
    originalSize: fileBuffer.length,
    compressedSize: res.buffer.length,
    reductionPercent: Number((Math.max(0, (1 - res.buffer.length / fileBuffer.length)) * 100).toFixed(1)),
    optimized: true,
    message: res.message
  })));
  return Promise.all(promises);
}

module.exports = { compressPDF, estimateCompressionLevels };
