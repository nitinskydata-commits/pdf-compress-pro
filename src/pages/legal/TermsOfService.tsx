import SEOHead from '../../components/SEOHead'
import { SITE_NAME } from '../../data/tools'

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <SEOHead
        title={`Terms of Service — ${SITE_NAME}`}
        description={`Read the Terms of Service for using ${SITE_NAME} utility tools.`}
        canonical="/terms"
      />

      <nav className="breadcrumb mb-6">
        <a href="/">Home</a>
        <span className="separator">›</span>
        <span>Terms of Service</span>
      </nav>

      <div className="card-premium p-8 prose prose-surface max-w-none">
        <h1 className="text-3xl font-extrabold text-surface-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-surface-500 mb-8">Last updated: September 5, 2026</p>

        <section className="space-y-4 text-surface-700 text-sm leading-relaxed">
          <h2 className="text-xl font-bold text-surface-800">1. Acceptance of Terms</h2>
          <p>
            By accessing and using <strong>{SITE_NAME}</strong>, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this site.
          </p>

          <h2 className="text-xl font-bold text-surface-800 mt-6">2. Use License & Intellectual Property</h2>
          <p>
            Permission is granted to use {SITE_NAME} tools for personal, educational, and commercial purposes free of charge. You retain all copyrights and intellectual property ownership over any files, documents, or data you process through our tools.
          </p>
          <p>
            You agree not to use the service to process unlawful, malicious, defamatory, or copyright-infringing content, nor attempt to reverse engineer or disrupt the service infrastructure.
          </p>

          <h2 className="text-xl font-bold text-surface-800 mt-6">3. Disclaimer of Warranties</h2>
          <p>
            The tools and materials on {SITE_NAME} are provided on an 'as is' and 'as available' basis. {SITE_NAME} makes no warranties, expressed or implied, regarding the accuracy, completeness, or reliability of tool outputs or fitness for a particular purpose. Always keep local backup copies of critical files.
          </p>

          <h2 className="text-xl font-bold text-surface-800 mt-6">4. Limitation of Liability</h2>
          <p>
            In no event shall {SITE_NAME}, its developers, or its affiliates be liable for any direct, indirect, incidental, or consequential damages (including loss of data or profit) arising out of the use or inability to use the tools on this website.
          </p>

          <h2 className="text-xl font-bold text-surface-800 mt-6">5. Governing Law</h2>
          <p>
            These terms and conditions are governed by and construed in accordance with applicable laws, without regard to conflict of law principles.
          </p>
        </section>
      </div>
    </div>
  )
}
