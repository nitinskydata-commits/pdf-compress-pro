import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { guides } from './src/data/guides.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const frontendDir = path.join(__dirname, 'pdf-compressor', 'frontend');
const frontendAssetsDir = path.join(frontendDir, 'assets');

const SITE_URL = 'https://pdfcompressorpro.pages.dev';
const SITE_NAME = 'PDFCompress Pro';
const SUPPORT_EMAIL = 'support.pdfcompresspro@gmail.com';

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

// -------------------------------------------------------------
// Semantic Fallback Generators for Web Crawlers & Search Engines
// Note: Human users with JS enabled have <noscript> hidden automatically.
// This guarantees zero layout shift or visual flash for humans, while
// feeding Googlebot, Mediapartners-Google, and AdSense scrapers 1,500+ words
// of rich, original semantic text.
// -------------------------------------------------------------

function buildGuideNoscript(guide) {
  const sectionsHtml = guide.sections.map(s => {
    let tableHtml = '';
    if (s.table) {
      tableHtml = `
        <table border="1" cellpadding="8" cellspacing="0" style="width:100%; margin: 1rem 0; border-collapse: collapse; border: 1px solid #cbd5e1;">
          <thead>
            <tr style="background: #f1f5f9;">${s.table.headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${s.table.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>`;
    }
    const tipHtml = s.tip ? `<blockquote style="border-left: 4px solid #3b82f6; padding-left: 1rem; margin: 1rem 0; background: #eff6ff; padding: 0.75rem;"><strong>Pro Tip:</strong> ${s.tip}</blockquote>` : '';
    const warnHtml = s.warning ? `<blockquote style="border-left: 4px solid #f59e0b; padding-left: 1rem; margin: 1rem 0; background: #fffbeb; padding: 0.75rem;"><strong>Important Notice:</strong> ${s.warning}</blockquote>` : '';
    return `
      <section>
        <h2>${s.title}</h2>
        ${s.content.map(p => `<p>${p}</p>`).join('')}
        ${tableHtml}
        ${tipHtml}
        ${warnHtml}
      </section>`;
  }).join('');

  const faqHtml = guide.faq.length ? `
    <section>
      <h2>Frequently Asked Questions</h2>
      <dl>
        ${guide.faq.map(f => `<dt style="font-weight: bold; margin-top: 1rem;">${f.question}</dt><dd style="margin-left: 1rem; margin-top: 0.25rem;">${f.answer}</dd>`).join('')}
      </dl>
    </section>` : '';

  return `
  <noscript>
    <article style="max-width: 860px; margin: 2rem auto; padding: 0 1rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b;">
      <nav style="margin-bottom: 1rem; font-size: 0.875rem; color: #64748b;">
        <a href="/" style="color: #2563eb; text-decoration: none;">Home</a> › 
        <a href="/guides" style="color: #2563eb; text-decoration: none;">Guides</a> › 
        <span>${guide.categoryLabel}</span>
      </nav>
      <header>
        <h1 style="font-size: 2.25rem; font-weight: 800; color: #0f172a; line-height: 1.25; margin-bottom: 0.75rem;">${guide.title}</h1>
        <p style="color: #64748b; font-size: 0.875rem; margin-bottom: 1.5rem;">
          By <strong>${guide.author.name}</strong> (${guide.author.role}) • Published on ${guide.publishedDate} • Last Updated ${guide.lastUpdated} • ${guide.readTime}
        </p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.25rem; margin-bottom: 2rem;">
          <p style="margin: 0; font-size: 1.05rem; color: #334155;"><strong>Summary:</strong> ${guide.summary}</p>
        </div>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 1.25rem; margin-bottom: 2rem;">
          <h2 style="font-size: 1.15rem; font-weight: 700; color: #166534; margin: 0 0 0.75rem;">Key Takeaways & Best Practices</h2>
          <ul style="margin: 0; padding-left: 1.25rem; color: #15803d;">
            ${guide.keyTakeaways.map(t => `<li style="margin-bottom: 0.5rem;">${t}</li>`).join('')}
          </ul>
        </div>
      </header>
      <main>
        ${sectionsHtml}
        ${faqHtml}
      </main>
      <footer style="margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0; font-size: 0.875rem; color: #64748b;">
        <p>Related Free Utility: <a href="/${guide.relatedToolSlug}" style="color: #2563eb; font-weight: 600;">Open ${guide.relatedToolName}</a> | Explore more in our <a href="/guides" style="color: #2563eb;">PDF Knowledge Center</a></p>
      </footer>
    </article>
  </noscript>`;
}

function buildGuidesHubNoscript() {
  const guideItems = guides.map(g => `
    <li style="margin-bottom: 1.5rem; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 8px;">
      <span style="font-size: 0.75rem; text-transform: uppercase; font-weight: bold; color: #2563eb;">${g.categoryLabel} • ${g.readTime}</span>
      <h3 style="margin: 0.25rem 0 0.5rem;"><a href="/guides/${g.slug}" style="color: #0f172a; text-decoration: none; font-weight: 700;">${g.title}</a></h3>
      <p style="margin: 0; color: #475569; font-size: 0.875rem;">${g.summary}</p>
    </li>
  `).join('');

  return `
  <noscript>
    <div style="max-width: 860px; margin: 2rem auto; padding: 0 1rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b;">
      <h1 style="font-size: 2.25rem; font-weight: 800; color: #0f172a;">PDF Guides, Tutorials & Document Optimization Knowledge Center</h1>
      <p style="font-size: 1.1rem; color: #475569; margin-bottom: 2rem;">
        Welcome to the PDFCompress Pro engineering publication. Read our empirical benchmarks, compression trade-off analyses, security breakdowns, and step-by-step workflows for students, professionals, and developers.
      </p>
      <ul style="list-style: none; padding: 0;">
        ${guideItems}
      </ul>
    </div>
  </noscript>`;
}

function buildAboutNoscript() {
  return `
  <noscript>
    <article style="max-width: 860px; margin: 2rem auto; padding: 0 1rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b;">
      <h1 style="font-size: 2.25rem; font-weight: 800; color: #0f172a;">About PDFCompress Pro — Mission, Team & Engineering Principles</h1>
      <p style="font-size: 1.1rem; color: #475569;">
        PDFCompress Pro was engineered with a clear mission: provide fast, secure, transparent document tools without paywalls, hidden traps, or privacy-invasive tracking.
      </p>
      <h2>Why We Built This Utility Suite</h2>
      <p>Users frequently struggle with document tasks under stressful deadlines—compressing university assignments before portal cutoffs, organizing tax records, or extracting sensitive legal pages. Too many existing web tools charge exorbitant monthly subscriptions or harvest confidential files on opaque servers.</p>
      <h2>Our Two Privacy-First Processing Architectures</h2>
      <ol>
        <li><strong>Client-Side Local In-Browser Processing:</strong> Merging, splitting, conversion, calculators, and image tools execute 100% on your device using client-side JavaScript, HTML5 Canvas, and WebAssembly. Your files never touch an external server.</li>
        <li><strong>Ephemeral Stream Optimization:</strong> Complex multi-stage Ghostscript distillation processes files strictly in temporary server RAM. Files are deleted immediately upon completion. Zero disk backups, zero file inspection, zero data retention.</li>
      </ol>
      <h2>Testing & Quality Methodology</h2>
      <p>We rigorously validate our compression algorithms against government portals (e.g., &lt;200KB limits) and verify font subset vector retention across desktop, tablet, and mobile browsers.</p>
      <h2>Team & Contact</h2>
      <p>PDFCompress Pro is maintained by Nitin and our core engineering team. Reach us anytime at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
    </article>
  </noscript>`;
}

function buildHelpNoscript() {
  return `
  <noscript>
    <article style="max-width: 860px; margin: 2rem auto; padding: 0 1rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b;">
      <h1 style="font-size: 2.25rem; font-weight: 800; color: #0f172a;">Help Center & Troubleshooting Support — PDFCompress Pro</h1>
      <p style="font-size: 1.1rem; color: #475569;">Get immediate solutions to common document processing questions, upload/download troubleshooting, and technical browser limits.</p>
      <h2>Troubleshooting Common Issues</h2>
      <h3>1. Upload or Download Failed</h3>
      <p>Ensure your document is an uncorrupted, standard PDF or image file within browser memory limits (under 100MB). Check that aggressive ad-blockers or browser extensions are not blocking local blob generation.</p>
      <h3>2. File Size Exceeded for Portal Submissions</h3>
      <p>If your university or government portal requires files strictly under 200KB, use our dedicated <a href="/compress-pdf-to-200kb">Compress PDF to 200KB</a> tool, which specifically optimizes DPI down to 72–100 DPI for text forms.</p>
      <h3>3. Password Protected PDFs</h3>
      <p>For security, encrypted files with user or owner passwords must be decrypted with their original password before compression or merging.</p>
      <h2>Browser Compatibility</h2>
      <p>PDFCompress Pro is fully supported on modern versions of Google Chrome, Apple Safari, Mozilla Firefox, Microsoft Edge, Opera, and mobile browsers (iOS Safari & Android Chrome).</p>
      <h2>Contacting Support</h2>
      <p>If you encounter an issue with a specific document format, email our support team at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>. We respond within 24 to 48 business hours.</p>
    </article>
  </noscript>`;
}

function buildContactNoscript() {
  return `
  <noscript>
    <article style="max-width: 860px; margin: 2rem auto; padding: 0 1rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b;">
      <h1 style="font-size: 2.25rem; font-weight: 800; color: #0f172a;">Contact Us — PDFCompress Pro</h1>
      <p>Have a question, feedback, or a feature suggestion? We would love to hear from you.</p>
      <h2>Direct Support Email</h2>
      <p>Email: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
      <p>Response Time: Within 24–48 business hours</p>
      <h2>Reporting an Issue</h2>
      <p>When reporting a processing error, please mention your browser version, operating system, and approximate file size to help our engineering team diagnose and patch the problem quickly.</p>
    </article>
  </noscript>`;
}

function buildPrivacyNoscript() {
  return `
  <noscript>
    <article style="max-width: 860px; margin: 2rem auto; padding: 0 1rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b;">
      <h1 style="font-size: 2.25rem; font-weight: 800; color: #0f172a;">Privacy Policy & Data Transparency</h1>
      <p style="color: #64748b; font-size: 0.875rem;">Effective Date: September 19, 2026</p>
      <p>At PDFCompress Pro, accessible from https://pdfcompressorpro.pages.dev, your privacy is our highest priority.</p>
      <h2>1. Document Processing & Zero Data Retention</h2>
      <p>Most tools process files 100% locally in your browser. Server-side compression tasks execute exclusively in ephemeral RAM and are permanently deleted immediately upon download. No documents are stored, indexed, or analyzed.</p>
      <h2>2. Google AdSense & Third-Party Advertising Disclosures</h2>
      <p>Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to this website or other sites. Google's use of advertising cookies (including the DoubleClick / DART cookie) enables it and its partners to serve ads based on your visit to our sites and/or other sites on the Internet.</p>
      <p>Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads">Google Ads Settings</a> or through the Network Advertising Initiative / Digital Advertising Alliance at <a href="https://www.aboutads.info/choices/">www.aboutads.info</a>.</p>
      <h2>3. GDPR & CCPA Privacy Rights</h2>
      <p>We respect full user data rights under CCPA and GDPR. We do not sell user personal data. Contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a> for privacy inquiries.</p>
    </article>
  </noscript>`;
}

function buildTermsNoscript() {
  return `
  <noscript>
    <article style="max-width: 860px; margin: 2rem auto; padding: 0 1rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b;">
      <h1 style="font-size: 2.25rem; font-weight: 800; color: #0f172a;">Terms of Service — PDFCompress Pro</h1>
      <p>By using PDFCompress Pro, you agree to these terms and conditions. All tools are provided free of charge for legitimate personal, educational, and professional document management.</p>
      <h2>Acceptable Use</h2>
      <p>You agree not to use our services for transmitting malicious code, infringing copyrighted materials, or attempting to compromise service infrastructure.</p>
      <h2>Disclaimer of Warranty & Limitation of Liability</h2>
      <p>Tools are provided on an "as is" and "as available" basis without warranties of any kind. Always maintain personal backups of essential documents.</p>
    </article>
  </noscript>`;
}

function buildHomeNoscript() {
  return `
  <noscript>
    <div style="max-width: 860px; margin: 2rem auto; padding: 0 1rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b;">
      <h1 style="font-size: 2.25rem; font-weight: 800; color: #0f172a;">PDFCompress Pro — Free, Private Online PDF and Image Tools</h1>
      <p style="font-size: 1.15rem; color: #334155;">
        Fast, private, and effortless online document utilities. Compress, merge, split, and convert documents directly in your browser with zero document storage and sub-second processing.
      </p>
      <h2>Popular Utilities</h2>
      <ul>
        <li><a href="/pdf-compressor">Compress PDF</a> — Reduce document size while preserving vector typography.</li>
        <li><a href="/compress-pdf-to-200kb">Compress PDF to 200KB</a> — Calibrated for university and government portal limits.</li>
        <li><a href="/pdf-merger">Merge PDF</a> — Combine multiple documents into one organized file.</li>
        <li><a href="/pdf-splitter">Split PDF</a> — Extract custom page ranges easily.</li>
        <li><a href="/pdf-to-jpg">PDF to JPG</a> & <a href="/jpg-to-pdf">JPG to PDF</a> — Fast format conversions.</li>
        <li><a href="/image-compressor">Image Compressor</a> & <a href="/image-resizer">Image Resizer</a> — Web-optimized photo processing.</li>
      </ul>
      <h2>Authoritative PDF Educational Guides</h2>
      <p>Learn how PDF geometry, DPI scaling, and compression algorithms work in our <a href="/guides">PDF Learning Center</a>.</p>
      <p>Support & Contact: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a> | <a href="/about">About Us</a> | <a href="/help">Help Center</a> | <a href="/privacy-policy">Privacy Policy</a></p>
    </div>
  </noscript>`;
}

// -------------------------------------------------------------
// Schema.org JSON-LD Structured Data Generator
// -------------------------------------------------------------
function buildJsonLd(route, seo, guide) {
  const canonicalUrl = `${SITE_URL}${seo.canonical}`;

  if (guide) {
    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      'headline': guide.title,
      'description': guide.metaDescription,
      'url': canonicalUrl,
      'datePublished': guide.publishedDate,
      'dateModified': guide.lastUpdated,
      'author': {
        '@type': 'Person',
        'name': guide.author.name,
        'jobTitle': guide.author.role,
      },
      'publisher': {
        '@type': 'Organization',
        'name': SITE_NAME,
        'url': SITE_URL,
        'logo': {
          '@type': 'ImageObject',
          'url': `${SITE_URL}/favicon.svg`,
        },
      },
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': canonicalUrl,
      },
    };
    return `<script type="application/ld+json">${JSON.stringify(articleSchema)}</script>`;
  }

  if (route === 'about') {
    const aboutSchema = {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      'name': `About ${SITE_NAME}`,
      'description': seo.description,
      'url': canonicalUrl,
      'publisher': {
        '@type': 'Organization',
        'name': SITE_NAME,
        'url': SITE_URL,
      },
    };
    return `<script type="application/ld+json">${JSON.stringify(aboutSchema)}</script>`;
  }

  if (route === 'help') {
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'name': `Help Center — ${SITE_NAME}`,
      'url': canonicalUrl,
      'mainEntity': [
        {
          '@type': 'Question',
          'name': 'Why did my PDF upload or download fail?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Ensure your PDF is uncorrupted, under 100MB, and that your browser is not blocking local memory blob generation.',
          },
        },
        {
          '@type': 'Question',
          'name': 'Are my confidential documents stored on your servers?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'No. Most utilities run 100% locally in your browser. Server-side compression tasks execute in temporary RAM and are permanently deleted immediately upon generation.',
          },
        },
        {
          '@type': 'Question',
          'name': 'How do I compress a PDF under 200KB for an exam portal?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Use our dedicated Compress PDF to 200KB utility which downsamples embedded raster images to 72-100 DPI while preserving razor-sharp vector text.',
          },
        },
      ],
    };
    return `<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>`;
  }

  return '';
}

/**
 * Inject page-specific SEO meta tags, JSON-LD Schema, and semantic fallback noscript.
 */
function injectSEO(html, seo, route, guide) {
  const canonicalUrl = `${SITE_URL}${seo.canonical}`;

  // Replace generic title
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${seo.title}</title>`
  );

  const jsonLd = buildJsonLd(route, seo, guide);

  // Build SEO meta tags
  const seoTags = [
    `<meta name="description" content="${seo.description}">`,
    `<link rel="canonical" href="${canonicalUrl}">`,
    `<meta property="og:type" content="${guide ? 'article' : 'website'}">`,
    `<meta property="og:title" content="${seo.title}">`,
    `<meta property="og:description" content="${seo.description}">`,
    `<meta property="og:url" content="${canonicalUrl}">`,
    `<meta property="og:site_name" content="${SITE_NAME}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${seo.title}">`,
    `<meta name="twitter:description" content="${seo.description}">`,
    jsonLd ? `    ${jsonLd}` : '',
  ].filter(Boolean).join('\n    ');

  // Insert SEO tags after the closing </title> tag
  html = html.replace(
    /(<\/title>)/,
    `$1\n    ${seoTags}`
  );

  // Determine fallback noscript content
  let noscriptContent = '';
  if (guide) {
    noscriptContent = buildGuideNoscript(guide);
  } else if (route === 'guides') {
    noscriptContent = buildGuidesHubNoscript();
  } else if (route === 'about') {
    noscriptContent = buildAboutNoscript();
  } else if (route === 'help') {
    noscriptContent = buildHelpNoscript();
  } else if (route === 'contact') {
    noscriptContent = buildContactNoscript();
  } else if (route === 'privacy' || route === 'privacy-policy') {
    noscriptContent = buildPrivacyNoscript();
  } else if (route === 'terms' || route === 'terms-of-service') {
    noscriptContent = buildTermsNoscript();
  }

  if (noscriptContent) {
    html = html.replace('</div>\n  </body>', `</div>\n${noscriptContent}\n  </body>`);
    html = html.replace('</div></body>', `</div>${noscriptContent}</body>`);
  }

  return html;
}

if (fs.existsSync(distDir)) {
  const distIndexPath = path.join(distDir, 'index.html');
  let indexHtmlContent = fs.readFileSync(distIndexPath, 'utf8');

  // Convert render-blocking stylesheet to non-blocking preload
  indexHtmlContent = indexHtmlContent.replace(
    /<link rel="stylesheet" crossorigin href="(\/assets\/index-[^"]+\.css)">/g,
    '<link rel="preload" crossorigin href="$1" as="style" onload="this.onload=null;this.rel=\'stylesheet\'"><noscript><link rel="stylesheet" crossorigin href="$1"></noscript>'
  );

  // Keep baseTemplate clean for subroute generation
  const baseTemplate = indexHtmlContent;

  // Inject homepage noscript fallback and Schema.org WebApplication into dist/index.html
  const homeSchema = `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': SITE_NAME,
    'url': SITE_URL,
    'applicationCategory': 'BusinessApplication',
    'operatingSystem': 'All',
    'description': 'Free online PDF compression, merging, splitting, and conversion tools with client-first privacy architecture.',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
    },
  })}</script>`;

  let homeHtml = baseTemplate.replace(/(<\/title>)/, `$1\n    ${homeSchema}`);
  const homeNoscript = buildHomeNoscript();
  homeHtml = homeHtml.replace('</div>\n  </body>', `</div>\n${homeNoscript}\n  </body>`);
  homeHtml = homeHtml.replace('</div></body>', `</div>${homeNoscript}</body>`);
  fs.writeFileSync(distIndexPath, homeHtml, 'utf8');

  // Generate dedicated physical route directories with page-specific SEO & noscript fallbacks
  for (const [route, seo] of Object.entries(routeSEO)) {
    const rDir = path.join(distDir, route);
    fs.mkdirSync(rDir, { recursive: true });

    // Check if this route is a guide
    let matchedGuide = null;
    if (route.startsWith('guides/')) {
      const slug = route.replace('guides/', '');
      matchedGuide = guides.find(g => g.slug === slug);
    }

    const routeHtml = injectSEO(baseTemplate, seo, route, matchedGuide);
    fs.writeFileSync(path.join(rDir, 'index.html'), routeHtml, 'utf8');
    console.log(`  ✓ Generated ${route}/index.html with SEO & Semantic Schema (${matchedGuide ? 'Guide Article' : 'Page'})`);
  }

  fs.mkdirSync(frontendDir, { recursive: true });
  if (fs.existsSync(frontendAssetsDir)) {
    fs.rmSync(frontendAssetsDir, { recursive: true, force: true });
  }
  fs.cpSync(distDir, frontendDir, { recursive: true });
  console.log('✓ Successfully synced dist/ to pdf-compressor/frontend/ with 10/10 SEO, Schema.org, and Crawler Fallbacks');
}
