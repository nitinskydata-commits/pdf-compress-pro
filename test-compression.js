const fs = require('fs-extra');
const { execFile } = require('child_process');
const { compressPDF } = require('./pdf-compressor/backend/utils/pdfOptimizer');

async function checkGhostscript() {
  return new Promise((resolve) => {
    execFile('gs', ['--version'], (err, stdout) => {
      if (err) {
        console.log('⚠️  Ghostscript NOT found locally (will use canvas fallback)');
        resolve(false);
      } else {
        console.log(`✅ Ghostscript found: v${stdout.trim()}`);
        resolve(true);
      }
    });
  });
}

async function test() {
  await checkGhostscript();

  const filePath = './synthetic-image-heavy.pdf';
  if (!(await fs.pathExists(filePath))) {
    console.error('❌ Test file not found:', filePath);
    return;
  }

  const buffer = await fs.readFile(filePath);
  console.log(`\nOriginal size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB\n`);

  for (const level of ['low', 'medium', 'high', 'extreme']) {
    try {
      console.time(level);
      const result = await compressPDF(buffer, level);
      const ratio = ((1 - result.buffer.length / buffer.length) * 100).toFixed(1);
      console.log(`[${level.padEnd(7)}] ${(result.buffer.length / 1024 / 1024).toFixed(2)} MB  (-${ratio}%)  ${result.message}`);
      console.timeEnd(level);
    } catch (err) {
      console.log(`[${level.padEnd(7)}] FAILED: ${err.message}`);
    }
    console.log('');
  }
}

test();
