import { Link } from 'react-router-dom'
import SEOHead from '../components/SEOHead'
import ToolCard from '../components/ToolCard'
import FAQ from '../components/FAQ'
import { tools, categories, SITE_NAME, SITE_URL } from '../data/tools'

const homeFAQ = [
  { question: 'Are all tools completely free?', answer: 'Yes! Every tool on PDFCompress Pro is 100% free with no account registration, watermarks, or hidden limits. We believe essential online utilities should be accessible to everyone.' },
  { question: 'Are my files safe and private?', answer: 'Absolutely. The majority of our tools process files directly in your browser — your files never leave your device. For tools requiring server processing (like advanced PDF compression), files are processed in isolated memory and deleted immediately.' },
  { question: 'Do I need to install any software?', answer: 'No. All tools work directly in your web browser. No downloads, no plugins, no Java — just open the tool and start using it on any device.' },
  { question: 'Can I use these tools on mobile devices?', answer: 'Yes! All tools are fully responsive and optimized for smartphones and tablets. Works perfectly on Chrome (Android), Safari (iOS), and all modern mobile browsers.' },
  { question: 'What file formats do you support?', answer: 'Our PDF tools handle all standard PDF files. Image tools support JPG/JPEG, PNG, WebP, and more. Each tool page lists its specific supported formats.' },
]

export default function Home() {
  return (
    <>
      <SEOHead
        title={`${SITE_NAME} — Free Online PDF, Image & Utility Tools`}
        description="Free online tools: compress PDF, merge PDF, image compressor, QR code generator, EMI calculator, and 20+ utilities. 100% private — files processed in your browser."
        canonical="/"
        keywords={['online tools', 'PDF compressor', 'image compressor', 'free online tools', 'PDF merger', 'QR code generator']}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: SITE_NAME,
          description: 'Free online PDF, image, calculator, and developer tools. All processing happens in your browser.',
          url: SITE_URL,
          applicationCategory: 'UtilityApplication',
          operatingSystem: 'All',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        }}
        faqData={homeFAQ}
      />

      {/* Hero Section */}
      <section className="bg-hero-gradient text-white py-20 md:py-28 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm font-medium mb-6 border border-white/20">
            <span className="animate-pulse-soft">🚀</span>
            <span>22 Free Online Tools — No Signup Required</span>
          </div>
          <h1 className="text-hero text-white mb-6">
            All-in-One Free Online<br />
            <span className="bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent">PDF, Image & Utility Tools</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8 leading-relaxed">
            Compress PDFs, resize images, calculate EMIs, generate QR codes, and more. 
            Everything runs in your browser — your files never leave your device.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/pdf-compressor" className="btn-primary bg-white text-primary-600 hover:bg-white/90 shadow-xl shadow-black/10 !text-base px-8 py-4">
              🗜️ Compress PDF Now
            </Link>
            <a href="#all-tools" className="btn-secondary border-white/30 text-white hover:bg-white/10 !text-base px-8 py-4">
              View All Tools →
            </a>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b border-surface-100 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">22+</div>
              <div className="text-sm text-surface-500 font-medium mt-1">Free Tools</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">100%</div>
              <div className="text-sm text-surface-500 font-medium mt-1">Private & Free</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">0</div>
              <div className="text-sm text-surface-500 font-medium mt-1">Files Stored</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">⚡</div>
              <div className="text-sm text-surface-500 font-medium mt-1">Instant Results</div>
            </div>
          </div>
        </div>
      </section>

      {/* All Tools Section */}
      <section id="all-tools" className="py-16 md:py-24 bg-mesh">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-section text-surface-800 mb-4">All Free Online Tools</h2>
            <p className="text-surface-500 max-w-xl mx-auto">
              Professional-grade tools that work directly in your browser. No uploads, no signups, no limits.
            </p>
          </div>

          {categories.map(cat => {
            const catTools = tools.filter(t => t.category === cat.id && t.isActive)
            if (catTools.length === 0) return null
            return (
              <div key={cat.id} className="mb-12">
                <h3 className="text-lg font-bold text-surface-700 mb-4 flex items-center gap-2">
                  <span>{cat.icon}</span>
                  {cat.label}
                  <span className="text-xs font-medium text-surface-400 ml-1">({catTools.length} tools)</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {catTools.map(tool => (
                    <ToolCard key={tool.slug} tool={tool} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-section text-surface-800 mb-4">Why Choose PDFCompress Pro?</h2>
            <p className="text-surface-500 max-w-xl mx-auto">
              Built for speed, privacy, and quality. Here's what makes us different.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🔒', title: '100% Private', desc: 'Most tools process files directly in your browser. Your documents never touch our servers.' },
              { icon: '⚡', title: 'Lightning Fast', desc: 'No upload delays. Client-side processing delivers instant results for images, text, and calculations.' },
              { icon: '📱', title: 'Mobile Friendly', desc: 'Every tool is optimized for smartphones and tablets. Works seamlessly on Chrome, Safari, and Firefox.' },
              { icon: '💯', title: 'Completely Free', desc: 'No hidden costs, no watermarks, no signup walls. All 22+ tools are free forever.' },
              { icon: '🎯', title: 'Professional Quality', desc: 'Calibrated compression algorithms, precise calculators, and standards-compliant output every time.' },
              { icon: '🛡️', title: 'No Installation', desc: 'Works directly in your browser. No software downloads, no plugins, no Java required.' },
            ].map((f, i) => (
              <div key={i} className="card-premium p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center text-2xl mb-4">
                  {f.icon}
                </div>
                <h3 className="font-bold text-surface-800 mb-2">{f.title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-surface-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-section text-surface-800 mb-4">How It Works</h2>
          <p className="text-surface-500 max-w-xl mx-auto mb-12">Three simple steps to use any tool.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', icon: '📤', title: 'Choose Your Tool', desc: 'Browse our collection and select the tool you need.' },
              { step: '2', icon: '⚙️', title: 'Upload or Enter Data', desc: 'Drop your files or type your input. Processing starts instantly.' },
              { step: '3', icon: '📥', title: 'Download Result', desc: 'Get your processed file or result immediately. Done!' },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-xl mb-4 shadow-lg shadow-primary-500/20">
                  {s.step}
                </div>
                <h3 className="font-bold text-surface-800 mb-2">{s.title}</h3>
                <p className="text-sm text-surface-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <FAQ items={homeFAQ} />
        </div>
      </section>
    </>
  )
}
