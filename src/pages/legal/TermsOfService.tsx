import { Link } from 'react-router-dom'
import SEOHead from '../../components/SEOHead'
import { SITE_NAME, SITE_URL } from '../../data/tools'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-surface-50/40 py-10 lg:py-16">
      <SEOHead
        title={`Terms of Service — ${SITE_NAME}`}
        description={`Read the Terms of Service for using ${SITE_NAME} document utilities, compression tools, acceptable use policy, and limitations.`}
        canonical="/terms"
        keywords={['terms of service', 'PDFCompress Pro terms', 'acceptable use policy', 'disclaimer of warranties']}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="breadcrumb mb-8" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="separator">›</span>
          <span>Terms of Service</span>
        </nav>

        <div className="card-premium p-8 sm:p-12 prose prose-surface max-w-none">
          <div className="border-b border-surface-100 pb-6 mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-surface-900 tracking-tight mb-2">
              Terms of Service & Acceptable Use
            </h1>
            <p className="text-xs sm:text-sm text-surface-500">
              Effective Date: September 19, 2026 • Version 2.4
            </p>
          </div>

          <section className="space-y-6 text-surface-700 text-sm sm:text-base leading-relaxed">
            <div>
              <h2 className="text-xl font-bold text-surface-900 mb-3">1. Agreement to Terms</h2>
              <p>
                By accessing, browsing, or utilizing the web applications, tools, and guides provided on <strong>{SITE_NAME}</strong> ({SITE_URL}), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service, all applicable laws, and regulations. If you do not agree to these terms, you must discontinue use of the service immediately.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-surface-900 mb-3">2. Description of Service & Free Access</h2>
              <p>
                {SITE_NAME} offers online productivity tools designed to process PDF documents, images, text, and mathematical calculations. The core utilities are offered free of charge without mandatory account registration. We reserve the right to modify, enhance, or discontinue any feature or service at any time without prior notice.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-surface-900 mb-3">3. Ownership of User Documents</h2>
              <p>
                You retain 100% of all copyrights, intellectual property rights, and ownership in any files, documents, images, or data you process through {SITE_NAME}. We claim no ownership, license, or rights in your content.
              </p>
              <p>
                Because client-side tools run in your device's browser memory and server-side optimization operates on ephemeral memory streams, no copies of your processed files are permanently preserved or cataloged on our systems.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-surface-900 mb-3">4. Acceptable Use Policy</h2>
              <p>When using {SITE_NAME}, you expressly agree that you will NOT:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-surface-600 text-xs sm:text-sm">
                <li>Upload or process documents containing computer viruses, malware, trojans, corrupted zip-bombs, or destructive software code.</li>
                <li>Process documents that infringe upon third-party copyrights, trademarks, trade secrets, or proprietary rights.</li>
                <li>Attempt to bypass rate limits, probe security vulnerabilities, or launch denial-of-service (DoS/DDoS) attacks against our infrastructure.</li>
                <li>Employ automated bots, scrapers, or scripts to bulk-process documents without explicit prior written authorization.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-surface-900 mb-3">5. Service Limitations and File Limits</h2>
              <p>
                Standard file uploads are subject to an operational maximum of <strong>50MB per file</strong> to safeguard resource availability for all users. We do not guarantee continuous, uninterrupted, or error-free availability of the service.
              </p>
              <p>
                <strong>User Responsibility:</strong> Always maintain local, uncompressed backup copies of critical documents (e.g. tax filings, legal deeds, academic submissions). While our tools are tested for high fidelity, document processing inherently involves format conversions that should be inspected before official submission.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-surface-900 mb-3">6. Disclaimer of Warranties</h2>
              <p>
                The materials, tools, and guides on {SITE_NAME} are provided strictly on an <strong>"as is" and "as available"</strong> basis. To the maximum extent permitted by law, {SITE_NAME} disclaims all warranties, express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-surface-900 mb-3">7. Limitation of Liability</h2>
              <p>
                In no event shall {SITE_NAME}, its developers, affiliates, or licensors be liable for any direct, indirect, incidental, special, consequential, or punitive damages (including loss of data, profits, business interruption, or missed portal deadlines) arising out of or related to your use of or inability to use our tools.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-surface-900 mb-3">8. Changes to Terms</h2>
              <p>
                We reserve the right to revise or update these Terms of Service at our sole discretion. Any updates become effective immediately upon posting. Your continued use of the website signifies your acceptance of any revisions.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-surface-900 mb-3">9. Contact Information</h2>
              <p>
                If you have questions regarding these Terms of Service, please contact us at:
              </p>
              <div className="p-4 rounded-xl bg-surface-100 border border-surface-200 text-xs sm:text-sm mt-2">
                <div><strong>Support Desk:</strong> support.pdfcompresspro@gmail.com</div>
                <div><strong>Inquiry Form:</strong> <Link to="/contact" className="text-primary-600 font-semibold underline">Contact Us</Link></div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
