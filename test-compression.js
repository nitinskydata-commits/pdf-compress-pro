const fs = require('fs-extra');
const path = require('path');
const { compressPDF } = require('./pdf-compressor/backend/utils/pdfOptimizer');

async function test() {
  const filePath = './synthetic-image-heavy.pdf';
  if (!(await fs.pathExists(filePath))) {
    console.error('Test file not found');
    return;
  }

  const buffer = await fs.readFile(filePath);
  console.log(`Original size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

  try {
    const result = await compressPDF(buffer, 'medium');
    console.log(`Compressed size: ${(result.buffer.length / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Optimized: ${result.optimized}`);
    console.log(`Message: ${result.message}`);

    await fs.writeFile('test-output.pdf', result.buffer);
  } catch (error) {
    console.error('Compression failed:', error);
  }
}

test();
