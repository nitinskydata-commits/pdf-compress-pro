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
  'about': {
    title: 'About Us — The Mission & Team Behind PDFCompress Pro',
    description: 'Learn who built PDFCompress Pro, why we created a privacy-first PDF utility suite, our development and testing approach, and our commitment to free tools.',
    canonical: '/about',
  },
  'help': {
    title: 'Help Center & Troubleshooting Support — PDFCompress Pro',
    description: 'Find step-by-step instructions, troubleshooting solutions for failed uploads or downloads, browser compatibility, and file limits on PDFCompress Pro.',
    canonical: '/help',
  },
  'guides': {
    title: 'PDF Guides & Tutorials — Learn to Manage Documents Better | PDFCompress Pro',
    description: 'Comprehensive guides, tutorials, and practical experiments on PDF compression, merging, format conversion, and security. Written by engineers.',
    canonical: '/guides',
  },
  'guides/how-to-compress-pdf': {
    title: 'How to Compress a PDF Without Losing Quality — PDFCompress Pro',
    description: 'Learn how to reduce PDF file size while preserving razor-sharp text and clear photos. Understand lossy vs. lossless compression and DPI targets.',
    canonical: '/guides/how-to-compress-pdf',
  },
  'guides/compress-pdf-for-college-assignments': {
    title: 'How to Compress PDF for College Assignments (<200KB / <500KB) — PDFCompress Pro',
    description: 'Step-by-step guide to compressing academic papers, lab reports, and handwritten assignment scans for Canvas, Blackboard, Moodle, and university portals.',
    canonical: '/guides/compress-pdf-for-college-assignments',
  },
  'guides/merge-pdf-files': {
    title: 'How to Merge PDF Files Online Free — Step-by-Step Guide — PDFCompress Pro',
    description: 'Learn how to combine multiple PDF documents into a single organized file. Master page ordering, handling mixed orientations, and preserving document integrity.',
    canonical: '/guides/merge-pdf-files',
  },
  'guides/split-pdf-pages': {
    title: 'How to Split PDF Pages Online Free — Extract Custom Pages — PDFCompress Pro',
    description: 'Step-by-step tutorial on splitting large PDF documents, extracting selected page ranges, separating single pages, and verifying output integrity.',
    canonical: '/guides/split-pdf-pages',
  },
  'guides/why-scanned-pdfs-are-large': {
    title: 'Why Are Scanned PDFs So Large? Causes and Solutions — PDFCompress Pro',
    description: 'Discover why scanned PDF files reach 30MB+ for simple paper pages. Understand DPI resolution, 24-bit color depth, uncompressed TIFF streams, and how to fix them.',
    canonical: '/guides/why-scanned-pdfs-are-large',
  },
  'guides/online-pdf-tool-safety': {
    title: 'Are Online PDF Tools Safe to Use? Complete Privacy Guide — PDFCompress Pro',
    description: 'Is uploading confidential tax forms and resumes to online PDF tools safe? Learn the crucial difference between client-side browser processing and server storage.',
    canonical: '/guides/online-pdf-tool-safety',
  },
  'guides/pdf-vs-jpg-vs-png': {
    title: 'PDF vs. JPG vs. PNG: When to Use Which File Format Guide — PDFCompress Pro',
    description: 'Comparing PDF, JPG, and PNG: Understand vector vs raster typography, compression artifacts, transparency support, multi-page capacity, and ideal use cases.',
    canonical: '/guides/pdf-vs-jpg-vs-png',
  },
  'guides/pdf-upload-download-troubleshooting': {
    title: 'Fix PDF Upload or Download Failed Errors — Troubleshooting Guide — PDFCompress Pro',
    description: 'Encountering upload failed, download blocked, or corrupted file errors? Practical troubleshooting steps for browser memory, CORS, firewall, and file limits.',
    canonical: '/guides/pdf-upload-download-troubleshooting',
  },
  'guides/pdf-compression-quality': {
    title: 'PDF Compression Quality Guide: File Size vs. DPI Trade-Offs — PDFCompress Pro',
    description: 'Detailed technical analysis of PDF compression: DCT quantization, Flate stream encoding, font subsetting, and empirical quality benchmarks.',
    canonical: '/guides/pdf-compression-quality',
  },
  'guides/organize-digital-documents': {
    title: 'A Practical Guide to Organizing Digital Documents & Records — PDFCompress Pro',
    description: 'Master digital document management: standardized naming conventions, folder taxonomy, audit backups, and PDF maintenance workflows for students and professionals.',
    canonical: '/guides/organize-digital-documents',
  },
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
    description: 'Read the PDFCompress Pro privacy policy. Learn how we protect your data — all file processing happens in your browser or ephemeral memory.',
    canonical: '/privacy',
  },
  'privacy-policy': {
    title: 'Privacy Policy — PDFCompress Pro',
    description: 'Read the PDFCompress Pro privacy policy. Learn how we protect your data — all file processing happens in your browser or ephemeral memory.',
    canonical: '/privacy-policy',
  },
  'terms': {
    title: 'Terms of Service — PDFCompress Pro',
    description: 'Read the PDFCompress Pro terms of service. Understand the terms and conditions for using our free online PDF compression and utility tools.',
    canonical: '/terms',
  },
  'terms-of-service': {
    title: 'Terms of Service — PDFCompress Pro',
    description: 'Read the PDFCompress Pro terms of service. Understand the terms and conditions for using our free online PDF compression and utility tools.',
    canonical: '/terms-of-service',
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

    let routeHtml = injectSEO(indexHtmlContent, seo);

    // Save clean HTML with page-specific SEO meta tags (React renders the page content)
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
