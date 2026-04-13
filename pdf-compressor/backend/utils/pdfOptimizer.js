const { PDFDocument } = require('pdf-lib');
const { createCanvas } = require('@napi-rs/canvas');

async function loadPdfJs() {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.js');
  return pdfjs;
}

function getStructuralProfiles(level) {
  if (level === 'low') {
    return [
      { useObjectStreams: true, objectsPerTick: 140 },
      { useObjectStreams: false, objectsPerTick: 140 }
    ];
  }

  if (level === 'high') {
    return [
      { useObjectStreams: true, objectsPerTick: 40 },
      { useObjectStreams: false, objectsPerTick: 40 }
    ];
  }

  return [
    { useObjectStreams: true, objectsPerTick: 80 },
    { useObjectStreams: false, objectsPerTick: 80 }
  ];
}

function getRasterProfiles(level) {
  if (level === 'low') {
    return [
      { scale: 1.2, quality: 0.68, grayscale: false },
      { scale: 1.0, quality: 0.56, grayscale: false }
    ];
  }

  if (level === 'medium') {
    return [
      { scale: 0.9, quality: 0.34, grayscale: false },
      { scale: 0.78, quality: 0.26, grayscale: false },
      { scale: 0.68, quality: 0.18, grayscale: true }
    ];
  }

  if (level === 'high') {
    return [
      { scale: 0.62, quality: 0.16, grayscale: true },
      { scale: 0.5, quality: 0.12, grayscale: true },
      { scale: 0.42, quality: 0.09, grayscale: true },
      { scale: 0.35, quality: 0.07, grayscale: true }
    ];
  }

  return [];
}

function applyGrayscale(context, width, height) {
  const imageData = context.getImageData(0, 0, width, height);
  const { data } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }

  context.putImageData(imageData, 0, 0);
}

async function createStructuralCopy(fileBuffer, saveOptions) {
  const source = await PDFDocument.load(fileBuffer, {
    ignoreEncryption: true,
    updateMetadata: false
  });

  const target = await PDFDocument.create();
  const pages = await target.copyPages(source, source.getPageIndices());
  pages.forEach((page) => target.addPage(page));

  return target.save({
    addDefaultPage: false,
    updateFieldAppearances: false,
    ...saveOptions
  });
}

async function createRasterizedCopy(fileBuffer, rasterProfile) {
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

    await page.render({
      canvasContext: context,
      viewport
    }).promise;

    if (rasterProfile.grayscale) {
      applyGrayscale(context, canvas.width, canvas.height);
    }

    const jpegBytes = canvas.toBuffer('image/jpeg', {
      quality: rasterProfile.quality,
      progressive: true,
      chromaSubsampling: true
    });

    const image = await target.embedJpg(jpegBytes);
    const pdfPage = target.addPage([page.view[2], page.view[3]]);
    pdfPage.drawImage(image, {
      x: 0,
      y: 0,
      width: pdfPage.getWidth(),
      height: pdfPage.getHeight()
    });
  }

  await source.destroy();

  return target.save({
    addDefaultPage: false,
    useObjectStreams: true,
    objectsPerTick: 20
  });
}

async function compressPDF(fileBuffer, compressionLevel = 'medium') {
  const originalBytes = Uint8Array.from(fileBuffer);
  const candidates = [];

  for (const profile of getStructuralProfiles(compressionLevel)) {
    try {
      const bytes = await createStructuralCopy(fileBuffer, profile);
      candidates.push({
        bytes,
        optimized: bytes.length < originalBytes.length,
        method: 'structural'
      });
    } catch (error) {
      // Keep trying other strategies.
    }
  }

  for (const rasterProfile of getRasterProfiles(compressionLevel)) {
    try {
      const rasterized = await createRasterizedCopy(fileBuffer, rasterProfile);
      if (rasterized) {
        candidates.push({
          bytes: rasterized,
          optimized: rasterized.length < originalBytes.length,
          method: 'rasterized'
        });
      }
    } catch (error) {
      // Structural optimization can still succeed even if rasterization does not.
    }
  }

  if (candidates.length === 0) {
    throw new Error('This PDF could not be processed safely.');
  }

  const best = candidates.reduce((smallest, current) =>
    current.bytes.length < smallest.bytes.length ? current : smallest
  );

  if (best.bytes.length < originalBytes.length) {
    return {
      buffer: best.bytes,
      optimized: true,
      message:
        best.method === 'rasterized'
          ? 'PDF compressed with strong image optimization.'
          : 'PDF compressed successfully.'
    };
  }

  return {
    buffer: originalBytes,
    optimized: false,
    message: 'PDF was processed successfully, but no smaller version was possible.'
  };
}

async function estimateCompressionLevels(fileBuffer, levels = ['low', 'medium', 'high']) {
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
      console.error(`Estimation failed for level ${level}:`, err);
      // Fallback or skip
    }
  }

  return estimates;
}

module.exports = { compressPDF, estimateCompressionLevels };
