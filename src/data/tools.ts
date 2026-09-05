export interface ToolInfo {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  icon: string;
  category: 'pdf' | 'image' | 'calculator' | 'text' | 'developer' | 'utility';
  categoryLabel: string;
  isActive: boolean;
  keywords: string[];
}

export const SITE_NAME = 'PDFCompress Pro';
export const SITE_URL = 'https://pdfcompressorpro.pages.dev';
export const ADSENSE_CLIENT = 'ca-pub-2803958264462693';

export const tools: ToolInfo[] = [
  // ===== PDF TOOLS =====
  {
    id: 'pdf-compressor',
    slug: 'pdf-compressor',
    name: 'PDF Compressor',
    shortName: 'Compress PDF',
    description: 'Reduce PDF file size up to 80% while preserving crisp text, vector art, and formatting.',
    metaTitle: 'Free PDF Compressor Online — Reduce PDF File Size | PDFCompress Pro',
    metaDescription: 'Compress PDF files online for free. Reduce PDF size up to 80% without losing quality. Multiple compression levels, instant estimates, and 100% private processing.',
    icon: '🗜️',
    category: 'pdf',
    categoryLabel: 'PDF Tools',
    isActive: true,
    keywords: ['compress PDF', 'reduce PDF size', 'PDF compressor online', 'free PDF optimizer'],
  },
  {
    id: 'compress-pdf-to-200kb',
    slug: 'compress-pdf-to-200kb',
    name: 'Compress PDF to 200KB',
    shortName: 'PDF to 200KB',
    description: 'Compress your PDF file to exactly 200KB or less for strict upload portals and email limits.',
    metaTitle: 'Compress PDF to 200KB Online Free — PDFCompress Pro',
    metaDescription: 'Compress PDF to 200KB or less for free. Perfect for government portals, university submissions, and email attachments with strict file size limits.',
    icon: '📦',
    category: 'pdf',
    categoryLabel: 'PDF Tools',
    isActive: true,
    keywords: ['compress PDF to 200kb', 'reduce PDF to 200kb', 'PDF under 200kb'],
  },
  {
    id: 'pdf-merger',
    slug: 'pdf-merger',
    name: 'PDF Merger',
    shortName: 'Merge PDF',
    description: 'Combine multiple PDF files into one document. Drag to reorder pages before merging.',
    metaTitle: 'Merge PDF Files Online Free — Combine PDFs | PDFCompress Pro',
    metaDescription: 'Merge multiple PDF files into one document online for free. Drag and drop to reorder, combine unlimited PDFs, and download instantly. No signup required.',
    icon: '📑',
    category: 'pdf',
    categoryLabel: 'PDF Tools',
    isActive: true,
    keywords: ['merge PDF', 'combine PDF', 'join PDF files', 'PDF merger online'],
  },
  {
    id: 'pdf-splitter',
    slug: 'pdf-splitter',
    name: 'PDF Splitter',
    shortName: 'Split PDF',
    description: 'Split a PDF into individual pages or custom page ranges. Extract specific pages instantly.',
    metaTitle: 'Split PDF Online Free — Extract Pages from PDF | PDFCompress Pro',
    metaDescription: 'Split PDF files into separate pages or custom ranges online for free. Extract specific pages from any PDF document instantly. Privacy guaranteed.',
    icon: '✂️',
    category: 'pdf',
    categoryLabel: 'PDF Tools',
    isActive: true,
    keywords: ['split PDF', 'extract PDF pages', 'PDF splitter online', 'separate PDF pages'],
  },
  {
    id: 'pdf-to-jpg',
    slug: 'pdf-to-jpg',
    name: 'PDF to JPG Converter',
    shortName: 'PDF to JPG',
    description: 'Convert PDF pages to high-quality JPG images. Download individual pages or all at once.',
    metaTitle: 'Convert PDF to JPG Online Free — PDF to Image | PDFCompress Pro',
    metaDescription: 'Convert PDF to JPG images online for free. Extract each page as a high-quality JPEG image. Supports multi-page PDFs with batch download.',
    icon: '🖼️',
    category: 'pdf',
    categoryLabel: 'PDF Tools',
    isActive: true,
    keywords: ['PDF to JPG', 'PDF to image', 'convert PDF to JPEG', 'extract images from PDF'],
  },
  {
    id: 'jpg-to-pdf',
    slug: 'jpg-to-pdf',
    name: 'JPG to PDF Converter',
    shortName: 'JPG to PDF',
    description: 'Convert JPG, PNG, and WebP images to PDF documents. Combine multiple images into one PDF.',
    metaTitle: 'Convert JPG to PDF Online Free — Image to PDF | PDFCompress Pro',
    metaDescription: 'Convert JPG, PNG, and WebP images to PDF online for free. Combine multiple images into a single PDF document. Drag to reorder pages.',
    icon: '📄',
    category: 'pdf',
    categoryLabel: 'PDF Tools',
    isActive: true,
    keywords: ['JPG to PDF', 'image to PDF', 'convert JPEG to PDF', 'photo to PDF'],
  },

  // ===== IMAGE TOOLS =====
  {
    id: 'image-compressor',
    slug: 'image-compressor',
    name: 'Image Compressor',
    shortName: 'Compress Image',
    description: 'Compress JPG, PNG, and WebP images while maintaining visual quality. Reduce file size by up to 90%.',
    metaTitle: 'Free Image Compressor Online — Reduce Image Size | PDFCompress Pro',
    metaDescription: 'Compress images online for free. Reduce JPG, PNG, and WebP file sizes by up to 90% without visible quality loss. Processed in your browser — 100% private.',
    icon: '🎨',
    category: 'image',
    categoryLabel: 'Image Tools',
    isActive: true,
    keywords: ['compress image', 'reduce image size', 'image compressor', 'compress JPG online'],
  },
  {
    id: 'image-resizer',
    slug: 'image-resizer',
    name: 'Image Resizer',
    shortName: 'Resize Image',
    description: 'Resize images to exact dimensions or social media presets. Maintain aspect ratio or crop to fit.',
    metaTitle: 'Free Image Resizer Online — Resize Photos & Images | PDFCompress Pro',
    metaDescription: 'Resize images to any dimension online for free. Includes presets for Instagram, Facebook, Twitter, and LinkedIn. Supports JPG, PNG, WebP.',
    icon: '📐',
    category: 'image',
    categoryLabel: 'Image Tools',
    isActive: true,
    keywords: ['resize image', 'image resizer', 'resize photo online', 'change image dimensions'],
  },
  {
    id: 'image-cropper',
    slug: 'image-cropper',
    name: 'Image Cropper',
    shortName: 'Crop Image',
    description: 'Crop images with precision. Use preset aspect ratios or free-form cropping with interactive handles.',
    metaTitle: 'Free Image Cropper Online — Crop Photos Precisely | PDFCompress Pro',
    metaDescription: 'Crop images online for free. Interactive drag-to-crop with preset aspect ratios (1:1, 4:3, 16:9). Supports JPG, PNG, WebP formats.',
    icon: '✂️',
    category: 'image',
    categoryLabel: 'Image Tools',
    isActive: true,
    keywords: ['crop image', 'image cropper', 'crop photo online', 'trim image'],
  },

  // ===== CALCULATOR TOOLS =====
  {
    id: 'age-calculator',
    slug: 'age-calculator',
    name: 'Age Calculator',
    shortName: 'Age Calc',
    description: 'Calculate your exact age in years, months, days, hours, and minutes from your date of birth.',
    metaTitle: 'Free Age Calculator — Calculate Your Exact Age | PDFCompress Pro',
    metaDescription: 'Calculate your exact age in years, months, and days. Enter your date of birth to find your precise age, next birthday countdown, and zodiac sign.',
    icon: '🎂',
    category: 'calculator',
    categoryLabel: 'Calculators',
    isActive: true,
    keywords: ['age calculator', 'calculate age', 'how old am I', 'date of birth calculator'],
  },
  {
    id: 'percentage-calculator',
    slug: 'percentage-calculator',
    name: 'Percentage Calculator',
    shortName: '% Calculator',
    description: 'Calculate percentages instantly. Find X% of Y, percentage increase/decrease, and more.',
    metaTitle: 'Free Percentage Calculator — Calculate % Instantly | PDFCompress Pro',
    metaDescription: 'Calculate percentages online for free. Find X% of Y, percentage change, increase/decrease, and what percent X is of Y. Instant results.',
    icon: '📊',
    category: 'calculator',
    categoryLabel: 'Calculators',
    isActive: true,
    keywords: ['percentage calculator', 'calculate percentage', 'percent calculator', '% calculator'],
  },
  {
    id: 'emi-calculator',
    slug: 'emi-calculator',
    name: 'EMI Calculator',
    shortName: 'EMI Calc',
    description: 'Calculate monthly EMI for home loans, car loans, and personal loans with amortization schedule.',
    metaTitle: 'Free EMI Calculator — Calculate Loan EMI Instantly | PDFCompress Pro',
    metaDescription: 'Calculate EMI for home loans, car loans, and personal loans. View monthly payment breakdown, total interest, and amortization schedule. Free online tool.',
    icon: '🏦',
    category: 'calculator',
    categoryLabel: 'Calculators',
    isActive: true,
    keywords: ['EMI calculator', 'loan EMI calculator', 'home loan EMI', 'car loan calculator'],
  },
  {
    id: 'attendance-calculator',
    slug: 'attendance-calculator',
    name: 'Attendance Calculator',
    shortName: 'Attendance',
    description: 'Calculate your attendance percentage and find how many classes you can skip or need to attend.',
    metaTitle: 'Free Attendance Calculator — Track Your Attendance % | PDFCompress Pro',
    metaDescription: 'Calculate your attendance percentage. Find how many classes you can miss while staying above minimum attendance. Perfect for students.',
    icon: '📋',
    category: 'calculator',
    categoryLabel: 'Calculators',
    isActive: true,
    keywords: ['attendance calculator', 'attendance percentage', 'class attendance calculator'],
  },
  {
    id: 'cgpa-calculator',
    slug: 'cgpa-calculator',
    name: 'CGPA/GPA Calculator',
    shortName: 'CGPA Calc',
    description: 'Calculate your CGPA or GPA from grades and credit hours. Supports multiple grading scales.',
    metaTitle: 'Free CGPA/GPA Calculator — Calculate Your GPA | PDFCompress Pro',
    metaDescription: 'Calculate CGPA and GPA from your semester grades and credit hours. Supports 4.0, 10.0, and custom grading scales. Free online calculator.',
    icon: '🎓',
    category: 'calculator',
    categoryLabel: 'Calculators',
    isActive: true,
    keywords: ['CGPA calculator', 'GPA calculator', 'calculate CGPA', 'grade point average'],
  },
  {
    id: 'date-difference-calculator',
    slug: 'date-difference-calculator',
    name: 'Date Difference Calculator',
    shortName: 'Date Diff',
    description: 'Calculate the exact difference between two dates in years, months, days, weeks, and hours.',
    metaTitle: 'Free Date Difference Calculator — Days Between Dates | PDFCompress Pro',
    metaDescription: 'Calculate the difference between two dates in days, weeks, months, and years. Find days until a future date or since a past date. Free online tool.',
    icon: '📅',
    category: 'calculator',
    categoryLabel: 'Calculators',
    isActive: true,
    keywords: ['date difference calculator', 'days between dates', 'date calculator', 'how many days'],
  },

  // ===== TEXT TOOLS =====
  {
    id: 'word-counter',
    slug: 'word-counter',
    name: 'Word Counter',
    shortName: 'Word Count',
    description: 'Count words, characters, sentences, paragraphs, and estimate reading time instantly.',
    metaTitle: 'Free Word Counter — Count Words & Characters Online | PDFCompress Pro',
    metaDescription: 'Count words, characters, sentences, and paragraphs in your text. Estimate reading and speaking time. Free online word counter tool.',
    icon: '📝',
    category: 'text',
    categoryLabel: 'Text Tools',
    isActive: true,
    keywords: ['word counter', 'character counter', 'word count online', 'count words'],
  },
  {
    id: 'case-converter',
    slug: 'case-converter',
    name: 'Case Converter',
    shortName: 'Case Convert',
    description: 'Convert text between UPPERCASE, lowercase, Title Case, Sentence case, camelCase, and more.',
    metaTitle: 'Free Case Converter — Change Text Case Online | PDFCompress Pro',
    metaDescription: 'Convert text to uppercase, lowercase, title case, sentence case, camelCase, snake_case, and kebab-case. Free online text case converter.',
    icon: '🔤',
    category: 'text',
    categoryLabel: 'Text Tools',
    isActive: true,
    keywords: ['case converter', 'text case converter', 'uppercase converter', 'lowercase converter'],
  },

  // ===== DEVELOPER TOOLS =====
  {
    id: 'json-formatter',
    slug: 'json-formatter',
    name: 'JSON Formatter',
    shortName: 'JSON Format',
    description: 'Format, validate, and beautify JSON data with syntax highlighting and error detection.',
    metaTitle: 'Free JSON Formatter & Validator Online | PDFCompress Pro',
    metaDescription: 'Format and validate JSON online for free. Beautify, minify, and inspect JSON data with syntax highlighting. Detect and fix JSON errors instantly.',
    icon: '{ }',
    category: 'developer',
    categoryLabel: 'Developer Tools',
    isActive: true,
    keywords: ['JSON formatter', 'JSON validator', 'format JSON online', 'beautify JSON'],
  },
  {
    id: 'base64-encoder-decoder',
    slug: 'base64-encoder-decoder',
    name: 'Base64 Encoder/Decoder',
    shortName: 'Base64',
    description: 'Encode text or files to Base64, or decode Base64 strings back to text or files.',
    metaTitle: 'Free Base64 Encoder/Decoder Online | PDFCompress Pro',
    metaDescription: 'Encode and decode Base64 online for free. Convert text and files to Base64 format and back. Supports images, documents, and any file type.',
    icon: '🔐',
    category: 'developer',
    categoryLabel: 'Developer Tools',
    isActive: true,
    keywords: ['base64 encoder', 'base64 decoder', 'encode base64', 'decode base64 online'],
  },
  {
    id: 'url-encoder-decoder',
    slug: 'url-encoder-decoder',
    name: 'URL Encoder/Decoder',
    shortName: 'URL Encode',
    description: 'Encode or decode URLs and query strings. Handle special characters for safe web use.',
    metaTitle: 'Free URL Encoder/Decoder Online | PDFCompress Pro',
    metaDescription: 'Encode and decode URLs online for free. Handle special characters, query strings, and URI components. Essential tool for web developers.',
    icon: '🔗',
    category: 'developer',
    categoryLabel: 'Developer Tools',
    isActive: true,
    keywords: ['URL encoder', 'URL decoder', 'encode URL online', 'percent encoding'],
  },

  // ===== UTILITY TOOLS =====
  {
    id: 'unit-converter',
    slug: 'unit-converter',
    name: 'Unit Converter',
    shortName: 'Convert Units',
    description: 'Convert between units of length, weight, temperature, area, volume, speed, and data.',
    metaTitle: 'Free Unit Converter — Convert Any Units Online | PDFCompress Pro',
    metaDescription: 'Convert between units of measurement online for free. Length, weight, temperature, area, volume, speed, time, and data storage conversions.',
    icon: '🔄',
    category: 'utility',
    categoryLabel: 'Utility Tools',
    isActive: true,
    keywords: ['unit converter', 'convert units', 'measurement converter', 'metric converter'],
  },
  {
    id: 'qr-code-generator',
    slug: 'qr-code-generator',
    name: 'QR Code Generator',
    shortName: 'QR Code',
    description: 'Generate QR codes for URLs, text, WiFi, email, and more. Customize colors and download as PNG/SVG.',
    metaTitle: 'Free QR Code Generator — Create QR Codes Online | PDFCompress Pro',
    metaDescription: 'Generate QR codes online for free. Create QR codes for URLs, text, WiFi, email, and vCards. Customize colors and size, download as PNG or SVG.',
    icon: '📱',
    category: 'utility',
    categoryLabel: 'Utility Tools',
    isActive: true,
    keywords: ['QR code generator', 'create QR code', 'QR code maker', 'free QR generator'],
  },
];

export function getToolBySlug(slug: string): ToolInfo | undefined {
  return tools.find(t => t.slug === slug);
}

export function getToolsByCategory(category: ToolInfo['category']): ToolInfo[] {
  return tools.filter(t => t.category === category);
}

export function getRelatedTools(currentSlug: string, limit = 4): ToolInfo[] {
  const current = getToolBySlug(currentSlug);
  if (!current) return tools.filter(t => t.isActive).slice(0, limit);
  
  const sameCategory = tools.filter(t => t.category === current.category && t.slug !== currentSlug && t.isActive);
  const others = tools.filter(t => t.category !== current.category && t.isActive);
  
  return [...sameCategory, ...others].slice(0, limit);
}

export const categories = [
  { id: 'pdf', label: 'PDF Tools', icon: '📄', color: 'from-amber-500 to-orange-500' },
  { id: 'image', label: 'Image Tools', icon: '🖼️', color: 'from-blue-500 to-cyan-500' },
  { id: 'calculator', label: 'Calculators', icon: '🧮', color: 'from-emerald-500 to-teal-500' },
  { id: 'text', label: 'Text Tools', icon: '📝', color: 'from-violet-500 to-purple-500' },
  { id: 'developer', label: 'Developer Tools', icon: '💻', color: 'from-pink-500 to-rose-500' },
  { id: 'utility', label: 'Utility Tools', icon: '🔧', color: 'from-indigo-500 to-blue-500' },
] as const;
