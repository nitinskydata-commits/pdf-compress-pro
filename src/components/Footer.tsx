import { Link } from 'react-router-dom'
import { SITE_NAME } from '../data/tools'
import { useSiteLogo } from '../utils/toolStatus'

export default function Footer() {
  const siteLogo = useSiteLogo()
  const officialEmail = 'support.pdfcompresspro@gmail.com'

  return (
    <footer className="bg-surface-900 text-white mt-auto border-t border-surface-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand & Mission Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              {siteLogo && siteLogo !== '/logo.png' && siteLogo.length > 50 ? (
                <img src={siteLogo} alt={SITE_NAME} width="36" height="36" className="h-9 max-h-9 w-auto max-w-[150px] object-contain rounded-lg bg-white/10 p-1" />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  P
                </div>
              )}
              <span className="text-xl font-extrabold tracking-tight">
                <span className="text-primary-300">PDFCompress</span>
                <span className="text-white">Pro</span>
              </span>
            </Link>
            <p className="text-surface-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              Practical, privacy-first online tools and educational guides for everyday PDF and document workflows. 100% free with client-side or ephemeral stream processing and zero permanent document retention.
            </p>
            <div className="pt-2 text-xs text-surface-400 space-y-1">
              <div><strong>Support:</strong> <a href={`mailto:${officialEmail}`} className="text-primary-300 hover:underline">{officialEmail}</a></div>
              <div><strong>Response Time:</strong> Within 24–48 hours</div>
            </div>
          </div>

          {/* Popular Tools */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-surface-300 mb-4 flex items-center gap-1.5">
              <span>🗜️</span>
              <span>Popular Tools</span>
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/pdf-compressor" className="text-surface-400 hover:text-primary-300 transition-colors">
                  Compress PDF
                </Link>
              </li>
              <li>
                <Link to="/compress-pdf-to-200kb" className="text-surface-400 hover:text-primary-300 transition-colors">
                  Compress PDF to 200KB
                </Link>
              </li>
              <li>
                <Link to="/pdf-merger" className="text-surface-400 hover:text-primary-300 transition-colors">
                  Merge PDF
                </Link>
              </li>
              <li>
                <Link to="/pdf-splitter" className="text-surface-400 hover:text-primary-300 transition-colors">
                  Split PDF
                </Link>
              </li>
              <li>
                <Link to="/jpg-to-pdf" className="text-surface-400 hover:text-primary-300 transition-colors">
                  JPG to PDF
                </Link>
              </li>
              <li>
                <Link to="/pdf-to-jpg" className="text-surface-400 hover:text-primary-300 transition-colors">
                  PDF to JPG
                </Link>
              </li>
            </ul>
          </div>

          {/* Learning Center Guides */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-surface-300 mb-4 flex items-center gap-1.5">
              <span>📚</span>
              <span>PDF Guides</span>
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/guides/how-to-compress-pdf" className="text-surface-400 hover:text-primary-300 transition-colors line-clamp-1">
                  How to Compress PDFs
                </Link>
              </li>
              <li>
                <Link to="/guides/compress-pdf-for-college-assignments" className="text-surface-400 hover:text-primary-300 transition-colors line-clamp-1">
                  College Assignments (&lt;200KB)
                </Link>
              </li>
              <li>
                <Link to="/guides/merge-pdf-files" className="text-surface-400 hover:text-primary-300 transition-colors line-clamp-1">
                  Merging Multi-Page Files
                </Link>
              </li>
              <li>
                <Link to="/guides/why-scanned-pdfs-are-large" className="text-surface-400 hover:text-primary-300 transition-colors line-clamp-1">
                  Why Scanned PDFs are Large
                </Link>
              </li>
              <li>
                <Link to="/guides/online-pdf-tool-safety" className="text-surface-400 hover:text-primary-300 transition-colors line-clamp-1">
                  Are Online Tools Safe?
                </Link>
              </li>
              <li className="pt-1">
                <Link to="/guides" className="text-primary-300 font-semibold hover:underline">
                  View All 10 Guides →
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-surface-300 mb-4 flex items-center gap-1.5">
              <span>🛡️</span>
              <span>Trust & Legal</span>
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/about" className="text-surface-400 hover:text-primary-300 transition-colors">
                  About Us & Mission
                </Link>
              </li>
              <li>
                <Link to="/help" className="text-surface-400 hover:text-primary-300 transition-colors">
                  Help Center & FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-surface-400 hover:text-primary-300 transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-surface-400 hover:text-primary-300 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-surface-400 hover:text-primary-300 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-surface-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-surface-400">
          <p>
            © {new Date().getFullYear()} {SITE_NAME}. All rights reserved. Independent project built for genuine document productivity.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/privacy-policy" className="hover:text-primary-300 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-primary-300 transition-colors">Terms</Link>
            <Link to="/about" className="hover:text-primary-300 transition-colors">About</Link>
            <Link to="/contact" className="hover:text-primary-300 transition-colors">Contact</Link>
            <Link to="/admin/dashboard" className="text-surface-600 hover:text-surface-400 text-[11px] transition-colors">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
