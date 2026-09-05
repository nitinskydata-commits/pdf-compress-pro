import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const frontendDir = path.join(__dirname, 'pdf-compressor', 'frontend');

if (fs.existsSync(distDir)) {
  fs.mkdirSync(frontendDir, { recursive: true });
  fs.cpSync(distDir, frontendDir, { recursive: true });
  console.log('✓ Successfully synced dist/ to pdf-compressor/frontend/');
}
