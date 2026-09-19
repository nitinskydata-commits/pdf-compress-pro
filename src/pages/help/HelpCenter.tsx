import { useState } from 'react'
import { Link } from 'react-router-dom'
import SEOHead from '../../components/SEOHead'
import FAQ from '../../components/FAQ'
import { SITE_NAME, SITE_URL } from '../../data/tools'

const helpFaqs = [
  {
    question: 'How do I compress a PDF to less than 200KB?',
    answer: 'Use our dedicated "Compress PDF to 200KB" tool or select the "Extreme" profile in the main PDF Compressor. Our engine will calibrate image downsampling to reach the target threshold for government, board exam, or university portals.'
  },
  {
    question: 'Why did my upload fail or freeze at 10%?',
    answer: 'Upload failures usually occur due to temporary network timeouts, active VPN connections, or corporate proxy firewalls. Try switching off your VPN, opening the page in an Incognito/Private window, or testing with a smaller file first.'
  },
  {
    question: 'Why didn’t the download start after processing?',
    answer: 'Some modern browsers automatically block programmatic file downloads to prevent unwanted popups. Look at the right side of your browser address bar for a blocked download icon, click it, and select "Always allow downloads from this site".'
  },
  {
    question: 'Can I process password-protected PDF files?',
    answer: 'Encrypted PDFs have scrambled object trees. You must enter your PDF password to unlock the document before merging, splitting, or compressing, as our engine cannot modify encrypted streams.'
  },
  {
    question: 'What is the maximum file size supported?',
    answer: 'PDFCompress Pro comfortably handles files up to 50MB. For larger documents (such as 100MB+ book scans), we recommend using our PDF Splitter tool to divide the document into smaller chapters first.'
  },
  {
    question: 'Are my files saved on your servers?',
    answer: 'No. Most utilities run 100% locally in your browser memory. For tools requiring server-side optimization (like Ghostscript compression), documents are processed in temporary RAM and purged immediately after download. We maintain zero permanent storage.'
  },
  {
    question: 'Do your tools work on iPhones and Android phones?',
    answer: 'Yes! PDFCompress Pro is fully responsive and tested on Chrome for Android and Safari for iOS. On iPhones, downloaded files can be accessed via the Apple "Files" app inside the "Downloads" folder.'
  }
]

export default function HelpCenter() {
  const [activeTab, setActiveTab] = useState<'getting-started' | 'troubleshooting' | 'compatibility' | 'limits'>('getting-started')

  return (
    <div className="min-h-screen bg-surface-50/40 py-10 lg:py-16">
      <SEOHead
        title={`Help Center & Troubleshooting Support — ${SITE_NAME}`}
        description={`Find step-by-step instructions, troubleshooting solutions for failed uploads or downloads, browser compatibility, and file limits on ${SITE_NAME}.`}
        canonical="/help"
        keywords={['PDFCompress Pro help', 'PDF troubleshooting', 'fix PDF upload failed', 'PDF download problems', 'browser compatibility']}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'HelpPage',
          name: `${SITE_NAME} Help Center`,
          description: 'Comprehensive troubleshooting and user support guides for PDFCompress Pro utilities.',
          url: `${SITE_URL}/help`,
        }}
        faqData={helpFaqs}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="breadcrumb mb-8" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="separator">›</span>
          <span>Help Center</span>
        </nav>

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-bold uppercase tracking-wider mb-4">
            User Support & Documentation
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-surface-900 tracking-tight mb-4">
            How Can We Help You Today?
          </h1>
          <p className="text-surface-600 text-base sm:text-lg leading-relaxed">
            Quick solutions to common document questions, step-by-step tutorials, and direct engineering support.
          </p>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { id: 'getting-started', label: 'Getting Started', icon: '🚀', desc: 'Basic workflow & guides' },
            { id: 'troubleshooting', label: 'Troubleshooting', icon: '🛠️', desc: 'Fix upload & download errors' },
            { id: 'compatibility', label: 'Compatibility', icon: '💻', desc: 'Browsers & mobile devices' },
            { id: 'limits', label: 'File Limits', icon: '📏', desc: 'Size & format limits' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`p-4 sm:p-5 rounded-2xl text-left border transition-all ${
                activeTab === tab.id
                  ? 'bg-white border-primary-500 shadow-md ring-2 ring-primary-100'
                  : 'bg-white/80 border-surface-200 hover:border-surface-300 hover:bg-white'
              }`}
            >
              <div className="text-2xl mb-2">{tab.icon}</div>
              <div className="font-bold text-surface-900 text-sm">{tab.label}</div>
              <div className="text-xs text-surface-500 mt-0.5">{tab.desc}</div>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="card-premium p-6 sm:p-8 lg:p-10 mb-12">
          {activeTab === 'getting-started' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
                <span>🚀</span>
                <span>Getting Started with PDFCompress Pro</span>
              </h2>
              <p className="text-surface-600 text-sm sm:text-base leading-relaxed">
                Using any tool on PDFCompress Pro is designed to be completed in under 30 seconds without creating an account or installing any software:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="p-4 rounded-xl bg-surface-50 border border-surface-200">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 font-bold flex items-center justify-center mb-3">
                    1
                  </div>
                  <h3 className="font-bold text-surface-900 text-sm mb-1">Select Your Tool</h3>
                  <p className="text-xs text-surface-600">
                    Navigate to <Link to="/pdf-compressor" className="text-primary-600 underline">Compress PDF</Link>, <Link to="/pdf-merger" className="text-primary-600 underline">Merge PDF</Link>, or browse our 20+ utilities.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface-50 border border-surface-200">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 font-bold flex items-center justify-center mb-3">
                    2
                  </div>
                  <h3 className="font-bold text-surface-900 text-sm mb-1">Drop Your File</h3>
                  <p className="text-xs text-surface-600">
                    Drag and drop your file into the upload zone, or click to select from your device or smartphone storage.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface-50 border border-surface-200">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 font-bold flex items-center justify-center mb-3">
                    3
                  </div>
                  <h3 className="font-bold text-surface-900 text-sm mb-1">Process & Download</h3>
                  <p className="text-xs text-surface-600">
                    Choose your compression level or arrangement, click process, and download your finalized document instantly.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-surface-100 flex flex-wrap items-center justify-between gap-4">
                <span className="text-xs text-surface-500">Want deeper educational tutorials?</span>
                <Link to="/guides" className="text-xs font-bold text-primary-600 hover:underline">
                  Visit PDF Learning Center →
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'troubleshooting' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
                <span>🛠️</span>
                <span>Troubleshooting Failed Uploads & Downloads</span>
              </h2>
              <p className="text-surface-600 text-sm leading-relaxed">
                If you encounter an issue during processing, review these verified solutions:
              </p>

              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-surface-200 bg-surface-50">
                  <h3 className="font-bold text-surface-900 text-sm mb-1">Issue: File Upload Fails or Gets Stuck</h3>
                  <p className="text-xs text-surface-600 mb-2 leading-relaxed">
                    Check whether your file is larger than 50MB. If so, split the file into smaller sections first. Alternatively, temporary network interruptions or strict corporate VPNs can drop upload connections.
                  </p>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Fix: Temporarily disable VPN or try an Incognito/Private window.
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-surface-200 bg-surface-50">
                  <h3 className="font-bold text-surface-900 text-sm mb-1">Issue: Download Doesn’t Start Automatically</h3>
                  <p className="text-xs text-surface-600 mb-2 leading-relaxed">
                    Modern web browsers frequently block automatic file downloads if they classify them as unprompted popups.
                  </p>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Fix: Check the browser address bar for a blocked pop-up icon and select "Always Allow".
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-surface-200 bg-surface-50">
                  <h3 className="font-bold text-surface-900 text-sm mb-1">Issue: "Invalid PDF Structure" or Corrupted Stream</h3>
                  <p className="text-xs text-surface-600 mb-2 leading-relaxed">
                    If an original document was interrupted during download from another website, its cross-reference table may be damaged.
                  </p>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Fix: Open the PDF in Chrome or Edge, press Ctrl+P (Print), and choose "Save as PDF" to repair it.
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-surface-100 flex items-center justify-between">
                <span className="text-xs text-surface-500">Need our engineering team to inspect a bug?</span>
                <Link to="/contact" className="text-xs font-bold text-primary-600 hover:underline">
                  Contact Technical Support →
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'compatibility' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
                <span>💻</span>
                <span>Browser & Device Compatibility</span>
              </h2>
              <p className="text-surface-600 text-sm leading-relaxed">
                PDFCompress Pro relies on standard W3C Web APIs (Canvas, FileReader, WebAssembly, Fetch). It runs seamlessly on any modern web browser without installing extensions.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-surface-200 bg-surface-50">
                      <th className="py-2.5 px-3 font-bold text-surface-800">Browser / Platform</th>
                      <th className="py-2.5 px-3 font-bold text-surface-800">Support Status</th>
                      <th className="py-2.5 px-3 font-bold text-surface-800">Recommended Version</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-surface-800">Google Chrome (Desktop & Mobile)</td>
                      <td className="py-2.5 px-3 text-emerald-600 font-semibold">✅ 100% Fully Supported</td>
                      <td className="py-2.5 px-3 text-surface-600">Chrome 90+</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-surface-800">Apple Safari (macOS & iOS)</td>
                      <td className="py-2.5 px-3 text-emerald-600 font-semibold">✅ 100% Fully Supported</td>
                      <td className="py-2.5 px-3 text-surface-600">Safari 14+</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-surface-800">Mozilla Firefox</td>
                      <td className="py-2.5 px-3 text-emerald-600 font-semibold">✅ 100% Fully Supported</td>
                      <td className="py-2.5 px-3 text-surface-600">Firefox 88+</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-surface-800">Microsoft Edge</td>
                      <td className="py-2.5 px-3 text-emerald-600 font-semibold">✅ 100% Fully Supported</td>
                      <td className="py-2.5 px-3 text-surface-600">Edge 90+</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-surface-800">Legacy Internet Explorer 11</td>
                      <td className="py-2.5 px-3 text-danger-500 font-semibold">❌ Not Supported</td>
                      <td className="py-2.5 px-3 text-surface-600">Please upgrade to Edge or Chrome</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'limits' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
                <span>📏</span>
                <span>File Size & Supported Formats</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-surface-200 bg-surface-50">
                  <h3 className="font-bold text-surface-900 text-sm mb-1">Max File Size Limit</h3>
                  <p className="text-xs text-surface-600 leading-relaxed">
                    Standard tools accept files up to <strong>50MB per document</strong>. For files exceeding 50MB, split them into multiple sections before processing.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-surface-200 bg-surface-50">
                  <h3 className="font-bold text-surface-900 text-sm mb-1">Supported Document Formats</h3>
                  <p className="text-xs text-surface-600 leading-relaxed">
                    Full support for standard <strong>PDF 1.4 through PDF 2.0</strong>, PDF/A archival documents, scanned image PDFs, and form-filled documents.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-surface-200 bg-surface-50">
                  <h3 className="font-bold text-surface-900 text-sm mb-1">Supported Image Formats</h3>
                  <p className="text-xs text-surface-600 leading-relaxed">
                    Image utilities support <strong>JPG, JPEG, PNG, and WebP</strong> formats with batch conversion capabilities.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-surface-200 bg-surface-50">
                  <h3 className="font-bold text-surface-900 text-sm mb-1">Cost & Usage Limits</h3>
                  <p className="text-xs text-surface-600 leading-relaxed">
                    <strong>100% Free</strong>. No credit card required, no mandatory subscription, and no watermarks placed on your documents.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FAQs Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-surface-900 mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="card-premium p-6 sm:p-8">
            <FAQ items={helpFaqs} />
          </div>
        </div>

        {/* Still Need Help Box */}
        <div className="card-premium p-8 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-3xl shadow-lg text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold mb-1">Still have a question or encountered a bug?</h3>
            <p className="text-white/80 text-xs sm:text-sm max-w-lg">
              Our engineering team is happy to assist. Send us a message and we'll reply within 24 to 48 hours.
            </p>
          </div>
          <Link
            to="/contact"
            className="btn-primary bg-white text-primary-600 hover:bg-white/95 !text-sm px-6 py-3 whitespace-nowrap shadow-md"
          >
            Contact Support Desk →
          </Link>
        </div>
      </div>
    </div>
  )
}
