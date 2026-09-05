import SEOHead from '../../components/SEOHead'
import { SITE_NAME, SITE_URL } from '../../data/tools'

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <SEOHead
        title={`Privacy Policy — ${SITE_NAME}`}
        description={`Learn how ${SITE_NAME} safeguards your privacy. All documents and images are processed client-side directly in your browser.`}
        canonical="/privacy"
      />

      <nav className="breadcrumb mb-6">
        <a href="/">Home</a>
        <span className="separator">›</span>
        <span>Privacy Policy</span>
      </nav>

      <div className="card-premium p-8 prose prose-surface max-w-none">
        <h1 className="text-3xl font-extrabold text-surface-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-surface-500 mb-8">Last updated: September 5, 2026</p>

        <section className="space-y-4 text-surface-700 text-sm leading-relaxed">
          <h2 className="text-xl font-bold text-surface-800">1. Client-Side Processing & Data Confidentiality</h2>
          <p>
            At <strong>{SITE_NAME}</strong> ({SITE_URL}), we prioritize your absolute privacy and data security.
            The overwhelming majority of our utility tools—including image compressors, PDF mergers, splitters, converters, calculators, and developer tools—run <strong>100% client-side</strong> inside your web browser.
          </p>
          <p>
            Your confidential files, personal documents, financial figures, and text snippets are never uploaded, stored, or indexed on our servers. When processing takes place, data remains in your device memory and is released immediately when the tab is closed.
          </p>

          <h2 className="text-xl font-bold text-surface-800 mt-6">2. Server-Side Processing (Where Applicable)</h2>
          <p>
            For advanced compression tasks requiring specialized server rendering (such as Ghostscript PDF optimization), files are transferred via secure, encrypted TLS/HTTPS connections to an isolated ephemeral container.
            Files are processed immediately in memory and deleted immediately after generation. No file retention or permanent storage is maintained.
          </p>

          <h2 className="text-xl font-bold text-surface-800 mt-6">3. Cookies and Advertising Partners</h2>
          <p>
            We may partner with third-party advertising networks, such as Google AdSense, to display advertisements when you visit our website.
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Google, as a third-party vendor, uses cookies to serve ads on {SITE_NAME}.</li>
            <li>Google's use of advertising cookies enables it and its partners to serve ads to users based on their visits to our site and/or other sites on the Internet.</li>
            <li>Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">Google Ads Settings</a>.</li>
          </ul>

          <h2 className="text-xl font-bold text-surface-800 mt-6">4. Web Analytics</h2>
          <p>
            We may use aggregated, privacy-focused analytics to track overall page impressions, device types, and general geographical trends to optimize platform performance. No personally identifiable information (PII) is recorded.
          </p>

          <h2 className="text-xl font-bold text-surface-800 mt-6">5. Changes to This Policy</h2>
          <p>
            We reserve the right to revise this Privacy Policy at any time. Any changes will be posted on this page with an updated timestamp.
          </p>

          <h2 className="text-xl font-bold text-surface-800 mt-6">6. Contact Us</h2>
          <p>
            If you have questions regarding this Privacy Policy, please reach out through our <a href="/contact" className="text-primary-600 underline font-medium">Contact Page</a>.
          </p>
        </section>
      </div>
    </div>
  )
}
