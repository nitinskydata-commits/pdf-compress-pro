import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const frontendDir = path.join(__dirname, 'pdf-compressor', 'frontend');
const frontendAssetsDir = path.join(frontendDir, 'assets');

if (fs.existsSync(distDir)) {
  const distIndexPath = path.join(distDir, 'index.html');
  let indexHtmlContent = fs.readFileSync(distIndexPath, 'utf8');

  // Convert render-blocking stylesheet to non-blocking preload to unlock sub-second FCP / Speed Index
  indexHtmlContent = indexHtmlContent.replace(
    /<link rel="stylesheet" crossorigin href="(\/assets\/index-[^"]+\.css)">/g,
    '<link rel="preload" crossorigin href="$1" as="style" onload="this.onload=null;this.rel=\'stylesheet\'"><noscript><link rel="stylesheet" crossorigin href="$1"></noscript>'
  );
  fs.writeFileSync(distIndexPath, indexHtmlContent, 'utf8');

  // Generate dedicated physical route directories so Cloudflare Pages never serves stale deleted cache
  const cleanRoutes = ['contact', 'privacy', 'terms', 'compress-pdf-to-200kb'];
  for (const r of cleanRoutes) {
    const rDir = path.join(distDir, r);
    fs.mkdirSync(rDir, { recursive: true });
    fs.writeFileSync(path.join(rDir, 'index.html'), indexHtmlContent, 'utf8');
  }

  fs.mkdirSync(frontendDir, { recursive: true });
  if (fs.existsSync(frontendAssetsDir)) {
    fs.rmSync(frontendAssetsDir, { recursive: true, force: true });
  }
  fs.cpSync(distDir, frontendDir, { recursive: true });
  console.log('✓ Successfully synced dist/ to pdf-compressor/frontend/ with clean route pages and non-blocking CSS');
}
