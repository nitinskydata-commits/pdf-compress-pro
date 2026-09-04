/**
 * PDF Compressor V2 — Content Classifier
 * Rapidly inspects PDF characteristics to choose the optimal compression pipeline.
 */

const fs = require('fs');

const PDF_TYPES = {
  IMAGE_HEAVY: 'IMAGE_HEAVY',
  TEXT_VECTOR: 'TEXT_VECTOR',
  MIXED: 'MIXED',
  ALREADY_COMPRESSED: 'ALREADY_COMPRESSED'
};

/**
 * Classifies a PDF document to determine the most effective optimization strategy.
 *
 * @param {Buffer|string} inputSource - PDF buffer or file path on disk
 * @returns {Promise<{ type: string, pageCount: number, bytesPerPage: number, hasImages: boolean, isAlreadyOptimized: boolean, summary: string }>}
 */
async function classifyPDF(inputSource) {
  let bufferSample;
  let fileSize = 0;

  if (Buffer.isBuffer(inputSource)) {
    fileSize = inputSource.length;
    bufferSample = inputSource.slice(0, Math.min(inputSource.length, 512 * 1024)); // First 512KB
  } else if (typeof inputSource === 'string' && fs.existsSync(inputSource)) {
    const stat = fs.statSync(inputSource);
    fileSize = stat.size;
    const fd = fs.openSync(inputSource, 'r');
    const readLen = Math.min(fileSize, 512 * 1024);
    const buf = Buffer.alloc(readLen);
    fs.readSync(fd, buf, 0, readLen, 0);
    fs.closeSync(fd);
    bufferSample = buf;
  } else {
    throw new Error('Invalid input source for PDF classification');
  }

  const sampleStr = bufferSample.toString('latin1');

  // 1. Fast Page Count Approximation
  let pageCount = 1;
  const countMatches = sampleStr.match(/\/Count\s+(\d+)/);
  if (countMatches && countMatches[1]) {
    const parsed = parseInt(countMatches[1], 10);
    if (parsed > 0 && parsed < 10000) {
      pageCount = parsed;
    }
  }

  if (pageCount === 1) {
    const pageMatches = sampleStr.match(/\/Type\s*\/Page\b/g);
    if (pageMatches && pageMatches.length > 0) {
      pageCount = pageMatches.length;
    }
  }

  const bytesPerPage = Math.round(fileSize / Math.max(1, pageCount));

  // 2. Image and Raster Stream Detection
  const hasImageSubtype = sampleStr.includes('/Subtype/Image') || sampleStr.includes('/Subtype /Image');
  const hasDctDecode = sampleStr.includes('/DCTDecode'); // JPEG
  const hasJpxDecode = sampleStr.includes('/JPXDecode'); // JPEG 2000
  const hasJbig2Decode = sampleStr.includes('/JBIG2Decode'); // Monochrome fax/scans

  const hasRasterImages = hasImageSubtype || hasDctDecode || hasJpxDecode || hasJbig2Decode;

  // 3. Check for previous compression or Ghostscript/Distiller signatures
  const isGhostscriptGenerated = sampleStr.includes('GPL Ghostscript') || sampleStr.includes('Artifex Software');
  const isDistiller = sampleStr.includes('Acrobat Distiller') || sampleStr.includes('pdfwrite');

  const isAlreadyOptimized = (isGhostscriptGenerated || isDistiller) && bytesPerPage < 150 * 1024;

  // 4. Determine Classification
  let type = PDF_TYPES.MIXED;
  let summary = 'Mixed content with text and graphics';

  if (!hasRasterImages && bytesPerPage < 100 * 1024) {
    type = PDF_TYPES.TEXT_VECTOR;
    summary = 'Digital document with selectable text and vector elements (Zero raster images)';
  } else if (isAlreadyOptimized) {
    type = PDF_TYPES.ALREADY_COMPRESSED;
    summary = 'Document was previously compressed with PDF distiller engine';
  } else if (bytesPerPage > 200 * 1024 || (hasRasterImages && bytesPerPage > 100 * 1024)) {
    type = PDF_TYPES.IMAGE_HEAVY;
    summary = 'Image-heavy or scanned document with photographic elements';
  } else {
    type = PDF_TYPES.MIXED;
    summary = 'Balanced document with text and visual graphics';
  }

  return {
    type,
    pageCount,
    fileSize,
    bytesPerPage,
    hasImages: hasRasterImages,
    isAlreadyOptimized,
    summary
  };
}

module.exports = {
  PDF_TYPES,
  classifyPDF
};
