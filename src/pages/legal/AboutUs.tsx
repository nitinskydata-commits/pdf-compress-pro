import { Link } from 'react-router-dom'
import SEOHead from '../../components/SEOHead'
import { SITE_NAME, SITE_URL } from '../../data/tools'

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-surface-50/40 py-10 lg:py-16">
      <SEOHead
        title={`About Us — The Mission & Team Behind ${SITE_NAME}`}
        description={`Learn who built ${SITE_NAME}, why we created a privacy-first PDF utility suite, our development and testing approach, and our commitment to free, accessible tools.`}
        canonical="/about"
        keywords={['about PDFCompress Pro', 'PDF tool engineering', 'client-side document security', 'PDFCompress Pro mission']}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: `About ${SITE_NAME}`,
          description: `The story, engineering principles, and team behind ${SITE_NAME}.`,
          url: `${SITE_URL}/about`,
        }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="breadcrumb mb-8" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="separator">›</span>
          <span>About Us</span>
        </nav>

        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-bold uppercase tracking-wider mb-4">
            Our Story & Mission
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-surface-900 tracking-tight mb-4">
            Making Everyday Document Tasks Easier & Private
          </h1>
          <p className="text-surface-600 text-base sm:text-lg leading-relaxed">
            {SITE_NAME} was founded on a simple conviction: essential document tools should be fast, transparent, and respectful of user privacy—without paywalls, hidden traps, or deceptive downloads.
          </p>
        </div>

        {/* Main Content Sections */}
        <div className="space-y-10">
          {/* Section 1: The Problem */}
          <section className="card-premium p-8 sm:p-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center text-xl font-bold">
                💡
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-surface-900">
                Why We Built {SITE_NAME}
              </h2>
            </div>
            <div className="space-y-4 text-surface-700 text-sm sm:text-base leading-relaxed">
              <p>
                Almost everyone who uses a computer or smartphone has struggled with PDF tasks: trying to compress an assignment before a university portal deadline, merging financial receipts for tax filing, or extracting a single page from a 100-page bank statement.
              </p>
              <p>
                When searching the web for a quick solution, users encounter an overwhelming landscape of frustration:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-surface-600">
                <li>Websites that lure users in as "free" only to demand a monthly credit card subscription after a 5-minute upload.</li>
                <li>Invasive websites that upload sensitive resumes, medical records, and legal contracts to opaque third-party servers with zero disclosure on retention or data harvesting.</li>
                <li>Cluttered web pages covered in deceptive fake "Download" buttons and disruptive pop-ups.</li>
              </ul>
              <p>
                We built <strong>{SITE_NAME}</strong> as an independent, engineer-driven alternative. Our goal is to provide honest utilities with transparent file processing and practical educational guidance.
              </p>
            </div>
          </section>

          {/* Section 2: Engineering Architecture */}
          <section className="card-premium p-8 sm:p-10 border-l-4 border-l-primary-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-bold">
                ⚙️
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-surface-900">
                Our Engineering & Privacy Principles
              </h2>
            </div>
            <div className="space-y-4 text-surface-700 text-sm sm:text-base leading-relaxed">
              <p>
                We believe privacy is not an afterthought; it is an architectural decision. We separate our utilities into two distinct processing models, clearly communicated to users:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                <div className="p-5 rounded-2xl bg-surface-50 border border-surface-200">
                  <div className="flex items-center gap-2 font-bold text-surface-900 text-sm mb-2">
                    <span className="text-emerald-500">🟢</span>
                    <span>100% Client-Side In-Browser</span>
                  </div>
                  <p className="text-xs text-surface-600 leading-relaxed">
                    Utilities such as PDF Merger, PDF Splitter, Image Compressors, Resizers, Calculators, and Developer utilities execute locally on your device via modern JavaScript and WebAssembly. Your files never transmit over the internet.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-surface-50 border border-surface-200">
                  <div className="flex items-center gap-2 font-bold text-surface-900 text-sm mb-2">
                    <span className="text-primary-500">🔵</span>
                    <span>Ephemeral Stream Processing</span>
                  </div>
                  <p className="text-xs text-surface-600 leading-relaxed">
                    For specialized compression tasks requiring deep Ghostscript distillation and font subsetting, files are transmitted via secure TLS/HTTPS to ephemeral memory containers. Files are processed immediately in RAM and purged instantly upon download.
                  </p>
                </div>
              </div>

              <p>
                We maintain an absolute zero permanent retention policy. We never inspect, harvest, catalog, or train AI models on user documents.
              </p>
            </div>
          </section>

          {/* Section 3: Testing & Quality Methodology */}
          <section className="card-premium p-8 sm:p-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center text-xl font-bold">
                🧪
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-surface-900">
                Development & Testing Methodology
              </h2>
            </div>
            <div className="space-y-4 text-surface-700 text-sm sm:text-base leading-relaxed">
              <p>
                Every feature and algorithm on {SITE_NAME} undergoes rigorous empirical testing before release. We test across:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-surface-600">
                <li><strong>Vector Typography Integrity:</strong> Ensuring that body fonts, mathematical equations, and legal footnotes remain vector paths rather than rasterized images.</li>
                <li><strong>Strict Portal Compliance:</strong> Calibrating target sizes (like our popular <Link to="/compress-pdf-to-200kb" className="text-primary-600 font-semibold hover:underline">Compress PDF to 200KB</Link> tool) specifically against guidelines used by government exams, university admissions, and corporate portals.</li>
                <li><strong>Cross-Platform Compatibility:</strong> Verifying that all tools and generated documents render flawlessly across Chrome, Safari, Firefox, Edge, iOS, and Android.</li>
              </ul>
            </div>
          </section>

          {/* Section 4: Who We Are & Roadmap */}
          <section className="card-premium p-8 sm:p-10 bg-gradient-to-br from-white to-surface-50 border border-surface-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
                🚀
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-surface-900">
                Who We Are & What Lies Ahead
              </h2>
            </div>
            <div className="space-y-4 text-surface-700 text-sm sm:text-base leading-relaxed">
              <p>
                {SITE_NAME} is built and maintained by <strong>Nitin and the PDFCompress Pro engineering team</strong>. We are a software development team passionate about high-performance web applications, document systems, and digital privacy.
              </p>
              <p>
                Alongside our tools, we continuously expand our <Link to="/guides" className="text-primary-600 font-semibold hover:underline">PDF Learning Center</Link> with practical, original articles teaching users how PDF architecture, DPI resolution, and digital archiving really work.
              </p>
              <p>
                We welcome suggestions, bug reports, and partnership inquiries. If you ever have feedback or find an issue with a document, please reach out directly through our <Link to="/contact" className="text-primary-600 font-semibold hover:underline">Contact Page</Link>.
              </p>
            </div>
          </section>

          {/* Quick Links CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-6 rounded-2xl bg-primary-50 border border-primary-100 gap-4">
            <div>
              <h3 className="font-bold text-surface-900 text-base">Want to explore our tools or read our guides?</h3>
              <p className="text-xs sm:text-sm text-surface-600">Discover all free tools or check out our in-depth PDF tutorials.</p>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/guides" className="btn-secondary !text-xs px-4 py-2.5">
                Browse Guides
              </Link>
              <Link to="/pdf-compressor" className="btn-primary !text-xs px-4 py-2.5">
                Compress PDF
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
