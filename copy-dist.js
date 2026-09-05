import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const frontendDir = path.join(__dirname, 'pdf-compressor', 'frontend');
const frontendAssetsDir = path.join(frontendDir, 'assets');

if (fs.existsSync(distDir)) {
  fs.mkdirSync(frontendDir, { recursive: true });
  if (fs.existsSync(frontendAssetsDir)) {
    fs.rmSync(frontendAssetsDir, { recursive: true, force: true });
  }
  fs.cpSync(distDir, frontendDir, { recursive: true });
  console.log('✓ Successfully synced dist/ to pdf-compressor/frontend/');
}
