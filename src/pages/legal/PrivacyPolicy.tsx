import { Link } from 'react-router-dom'
import SEOHead from '../../components/SEOHead'
import { SITE_NAME, SITE_URL } from '../../data/tools'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-surface-50/40 py-10 lg:py-16">
      <SEOHead
        title={`Privacy Policy — ${SITE_NAME}`}
        description={`Learn how ${SITE_NAME} safeguards your privacy. All documents are processed securely with client-side execution or ephemeral stream processing with zero permanent storage.`}
        canonical="/privacy"
        keywords={['privacy policy', 'PDFCompress Pro privacy', 'data security', 'cookie policy', 'Google AdSense disclosure']}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="breadcrumb mb-8" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="separator">›</span>
          <span>Privacy Policy</span>
        </nav>

        <div className="card-premium p-8 sm:p-12 prose prose-surface max-w-none">
          <div className="border-b border-surface-100 pb-6 mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-surface-900 tracking-tight mb-2">
              Privacy Policy & Data Transparency
            </h1>
            <p className="text-xs sm:text-sm text-surface-500">
              Effective Date: September 19, 2026 • Version 2.4
            </p>
          </div>

          <div className="space-y-8 text-surface-700 text-sm sm:text-base leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-3">1. Introduction and Commitment</h2>
              <p>
                At <strong>{SITE_NAME}</strong> accessible from <strong>{SITE_URL}</strong>, one of our main priorities is the privacy of our visitors. This Privacy Policy document outlines the types of information that is collected and recorded by {SITE_NAME} and how we treat user documents and data.
              </p>
              <p>
                Unlike traditional document converter services that retain files on remote servers, {SITE_NAME} was engineered with a strict <strong>Privacy-First Architecture</strong>. We do not require account registration, we do not require your email to download processed files, and we do not monetize user document contents in any manner.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-3">2. Document & File Handling Architecture</h2>
              <p>
                We clearly disclose how user files are processed based on the specific utility being utilized:
              </p>
              
              <div className="my-4 p-5 rounded-2xl bg-surface-50 border border-surface-200 space-y-3">
                <h3 className="font-bold text-surface-900 text-sm">A. Local Browser Processing (Client-Side Utilities)</h3>
                <p className="text-xs text-surface-600 leading-relaxed">
                  The vast majority of utilities on {SITE_NAME}—including PDF Merger, PDF Splitter, Image Compressor, Image Resizer, Image Cropper, Word Counter, JSON Formatter, Calculators, and Developer tools—operate <strong>entirely within your web browser</strong> using client-side JavaScript, WebAssembly, and HTML5 Canvas.
                </p>
                <p className="text-xs text-emerald-700 font-semibold">
                  ✓ Technical Guarantee: Files loaded into these utilities are never transmitted across the internet to any server. They reside purely in your device’s volatile memory and are cleared when the browser tab is closed.
                </p>
              </div>

              <div className="my-4 p-5 rounded-2xl bg-surface-50 border border-surface-200 space-y-3">
                <h3 className="font-bold text-surface-900 text-sm">B. Ephemeral Stream Processing (Server-Side Optimization)</h3>
                <p className="text-xs text-surface-600 leading-relaxed">
                  For complex PDF compression routines requiring advanced Ghostscript distillation, font subsetting, and bicubic stream downsampling, files are transmitted via an encrypted SSL/TLS connection (HTTPS) to an isolated ephemeral processing container.
                </p>
                <p className="text-xs text-primary-700 font-semibold">
                  ✓ Technical Guarantee: Documents are processed in temporary RAM memory and permanently deleted immediately after generation. No file copies, previews, backups, or derivative files are ever stored on disk.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-3">3. Google AdSense & Third-Party Advertising Disclosures</h2>
              <p>
                We partner with Google AdSense and third-party advertising networks to support the ongoing maintenance and server costs of offering free document utilities. In compliance with Google AdSense terms and policies:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-surface-600 text-xs sm:text-sm">
                <li>
                  <strong>Third-Party Vendor Cookies:</strong> Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to {SITE_NAME} or other websites on the internet.
                </li>
                <li>
                  <strong>Google's Advertising Cookies:</strong> Google's use of advertising cookies (including the DoubleClick / DART cookie) enables it and its partners to serve personalized ads to our users based on their visit to our site and/or other sites across the World Wide Web.
                </li>
                <li>
                  <strong>Opting Out of Personalized Advertising:</strong> Users may opt out of personalized advertising by visiting Google's <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-primary-600 underline font-semibold">Ads Settings</a>. Alternatively, users can opt out of a third-party vendor's use of cookies for personalized advertising by visiting <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-primary-600 underline font-semibold">www.aboutads.info</a>.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-3">4. Log Files and Web Analytics</h2>
              <p>
                Like most standard websites, {SITE_NAME} follows a standard procedure of utilizing log files. The information collected by log files includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks.
              </p>
              <p>
                These are not linked to any information that is personally identifiable. The purpose of this information is strictly for analyzing performance trends, administering the site, tracking technical errors, and gathering aggregate demographic information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-3">5. Cookies and Web Beacons</h2>
              <p>
                {SITE_NAME} uses cookies to store information about visitors' preferences, to record user-specific information on which pages the visitor accesses or visits, and to customize web page content based on visitors' browser type or other information that the visitor sends via their browser.
              </p>
              <p>
                You can choose to disable cookies through your individual browser options. Detailed information about cookie management with specific web browsers can be found at the browsers' respective official websites.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-3">6. GDPR & CCPA Data Privacy Rights</h2>
              <p>
                Under data privacy regulations including the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA), users are entitled to fundamental rights:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-surface-600 text-xs sm:text-sm">
                <li><strong>The right to know:</strong> What categories of personal data are processed.</li>
                <li><strong>The right to access:</strong> You have the right to request copies of your personal data.</li>
                <li><strong>The right to erasure:</strong> You have the right to request that we erase your personal data. (Because we do not store user files or accounts, there is zero persistent personal document data to erase).</li>
                <li><strong>The right to non-discrimination:</strong> We do not discriminate against any user for exercising their privacy rights.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-3">7. Children's Online Privacy Protection Act (COPPA)</h2>
              <p>
                Another part of our priority is adding protection for children while using the internet. {SITE_NAME} does not knowingly collect any Personal Identifiable Information from children under the age of 13. If you think that your child provided this kind of information on our website, we strongly encourage you to contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-3">8. Changes to This Privacy Policy</h2>
              <p>
                We may update our Privacy Policy periodically to reflect technological improvements or regulatory updates. We advise you to review this page periodically for any changes. Changes are effective immediately upon posting on this page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-3">9. Contacting Our Data Privacy Officer</h2>
              <p>
                If you have any questions, suggestions, or concerns regarding this Privacy Policy or our file handling practices, please do not hesitate to contact us at:
              </p>
              <div className="p-4 rounded-xl bg-surface-100 border border-surface-200 text-xs sm:text-sm">
                <div><strong>Email:</strong> support.pdfcompresspro@gmail.com</div>
                <div><strong>Direct Contact Form:</strong> <Link to="/contact" className="text-primary-600 font-semibold underline">Contact Us Page</Link></div>
                <div><strong>Expected Response Time:</strong> Within 24–48 business hours</div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
