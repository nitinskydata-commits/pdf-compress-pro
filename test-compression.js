const fs = require('fs-extra');
const {
  compressPDF,
  estimateCompressionLevels,
  validatePDFBuffer,
  isGhostscriptAvailable,
  isQpdfAvailable,
  LEVEL_CONFIGS
} = require('./pdf-compressor/backend/utils/pdfOptimizer');

async function runTestSuite() {
  console.log('====================================================');
  console.log('       PDF COMPRESS PRO — TEST SUITE');
  console.log('====================================================\n');

  const hasGs = await isGhostscriptAvailable();
  const hasQpdf = await isQpdfAvailable();
  console.log(`[Environment] Ghostscript available: ${hasGs ? 'YES' : 'NO (using structural pure-JS engine)'}`);
  console.log(`[Environment] QPDF available:        ${hasQpdf ? 'YES' : 'NO'}\n`);

  const testFiles = [
    { name: 'Image-Heavy / Scanned PDF', path: './synthetic-image-heavy.pdf' },
    { name: 'Small / Text PDF', path: './compressed_test.pdf' },
    { name: 'Multi-page Test PDF', path: './test-output.pdf' }
  ];

  const levels = ['low', 'medium', 'high', 'extreme'];

  for (const testFile of testFiles) {
    if (!(await fs.pathExists(testFile.path))) {
      console.log(`⚠️  Skipping ${testFile.name}: File not found at ${testFile.path}`);
      continue;
    }

    const buffer = await fs.readFile(testFile.path);
    const originalSize = buffer.length;
    const originalSizeMB = (originalSize / 1024 / 1024).toFixed(3);

    console.log('----------------------------------------------------');
    console.log(`File: ${testFile.name}`);
    console.log(`Path: ${testFile.path}`);
    console.log(`Original Size: ${originalSizeMB} MB (${originalSize} bytes)`);
    console.log('----------------------------------------------------');

    // 1. Test Estimation
    try {
      console.log('\n[1] Testing Estimation API:');
      const estimates = await estimateCompressionLevels(buffer);
      estimates.forEach(est => {
        const estMB = (est.compressedSize / 1024 / 1024).toFixed(3);
        console.log(`  - ${est.level.padEnd(8)}: Est ~${estMB} MB (~${est.reductionPercent}% reduction) | ${est.message}`);
      });
    } catch (estErr) {
      console.error(`  ❌ Estimation error: ${estErr.message}`);
    }

    // 2. Test Each Compression Level
    console.log('\n[2] Testing Actual Compression Pipeline:');
    for (const level of levels) {
      const startTime = Date.now();
      try {
        const result = await compressPDF(buffer, level);
        const elapsedMs = Date.now() - startTime;
        const compSize = result.buffer.length;
        const compSizeMB = (compSize / 1024 / 1024).toFixed(3);
        const savedPercent = originalSize > 0
          ? (((originalSize - compSize) / originalSize) * 100).toFixed(1)
          : '0.0';

        // 3. Validate Output Integrity
        const validation = await validatePDFBuffer(result.buffer);
        const validTag = validation.valid ? 'VALID (Passed)' : `CORRUPT (${validation.error})`;

        console.log(`  [${level.toUpperCase().padEnd(7)}] -> ${compSizeMB} MB (${savedPercent}% saved) | Time: ${elapsedMs}ms | Integrity: ${validTag} | Engine: ${result.engine}`);
      } catch (compErr) {
        const elapsedMs = Date.now() - startTime;
        console.error(`  [${level.toUpperCase().padEnd(7)}] -> FAILED: ${compErr.message} (${elapsedMs}ms)`);
      }
    }

    console.log('\n');
  }

  console.log('====================================================');
  console.log('              TEST SUITE COMPLETED');
  console.log('====================================================\n');
}

if (require.main === module) {
  runTestSuite().catch(err => {
    console.error('Fatal test error:', err);
  });
}

module.exports = { runTestSuite };
