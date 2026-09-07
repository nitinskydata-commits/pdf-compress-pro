import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const frontendDir = path.join(__dirname, 'pdf-compressor', 'frontend');
const frontendAssetsDir = path.join(frontendDir, 'assets');

const SITE_URL = 'https://pdfcompressorpro.pages.dev';
const SITE_NAME = 'PDFCompress Pro';

// SEO metadata for each pre-rendered route
const routeSEO = {
  'compress-pdf-to-200kb': {
    title: 'Compress PDF to 200KB Online Free — PDFCompress Pro',
    description: 'Compress PDF to 200KB or less for free. Perfect for government portals, university submissions, and email attachments with strict file size limits.',
    canonical: '/compress-pdf-to-200kb',
  },
  'contact': {
    title: 'Contact Us — PDFCompress Pro',
    description: 'Get in touch with the PDFCompress Pro team. We\'d love to hear your feedback, questions, or suggestions about our free online PDF and image tools.',
    canonical: '/contact',
  },
  'privacy': {
    title: 'Privacy Policy — PDFCompress Pro',
    description: 'Read the PDFCompress Pro privacy policy. Learn how we protect your data — all file processing happens in your browser, so your files never leave your device.',
    canonical: '/privacy',
  },
  'terms': {
    title: 'Terms of Service — PDFCompress Pro',
    description: 'Read the PDFCompress Pro terms of service. Understand the terms and conditions for using our free online PDF compression and utility tools.',
    canonical: '/terms',
  },
};

/**
 * Inject page-specific SEO meta tags into an HTML string.
 * Replaces the generic homepage title/meta with route-specific values
 * and adds canonical URL + Open Graph tags.
 */
function injectSEO(html, seo) {
  const canonicalUrl = `${SITE_URL}${seo.canonical}`;

  // Replace the generic title
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${seo.title}</title>`
  );

  // Insert meta description, canonical, and OG tags right after the title
  const seoTags = [
    `<meta name="description" content="${seo.description}">`,
    `<link rel="canonical" href="${canonicalUrl}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${seo.title}">`,
    `<meta property="og:description" content="${seo.description}">`,
    `<meta property="og:url" content="${canonicalUrl}">`,
    `<meta property="og:site_name" content="${SITE_NAME}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${seo.title}">`,
    `<meta name="twitter:description" content="${seo.description}">`,
  ].join('\n    ');

  // Insert SEO tags after the closing </title> tag
  html = html.replace(
    /(<\/title>)/,
    `$1\n    ${seoTags}`
  );

  return html;
}

if (fs.existsSync(distDir)) {
  const distIndexPath = path.join(distDir, 'index.html');
  let indexHtmlContent = fs.readFileSync(distIndexPath, 'utf8');

  // Convert render-blocking stylesheet to non-blocking preload to unlock sub-second FCP / Speed Index
  indexHtmlContent = indexHtmlContent.replace(
    /<link rel="stylesheet" crossorigin href="(\/assets\/index-[^"]+\.css)">/g,
    '<link rel="preload" crossorigin href="$1" as="style" onload="this.onload=null;this.rel=\'stylesheet\'"><noscript><link rel="stylesheet" crossorigin href="$1"></noscript>'
  );
  fs.writeFileSync(distIndexPath, indexHtmlContent, 'utf8');

  // Generate dedicated physical route directories with page-specific SEO
  for (const [route, seo] of Object.entries(routeSEO)) {
    const rDir = path.join(distDir, route);
    fs.mkdirSync(rDir, { recursive: true });

    const routeHtml = injectSEO(indexHtmlContent, seo);
    fs.writeFileSync(path.join(rDir, 'index.html'), routeHtml, 'utf8');
    console.log(`  ✓ Generated ${route}/index.html with SEO: "${seo.title}"`);
  }

  fs.mkdirSync(frontendDir, { recursive: true });
  if (fs.existsSync(frontendAssetsDir)) {
    fs.rmSync(frontendAssetsDir, { recursive: true, force: true });
  }
  fs.cpSync(distDir, frontendDir, { recursive: true });
  console.log('✓ Successfully synced dist/ to pdf-compressor/frontend/ with SEO-injected route pages and non-blocking CSS');
}
