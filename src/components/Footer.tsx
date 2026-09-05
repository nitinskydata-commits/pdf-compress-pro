import { Link } from 'react-router-dom'
import { tools, categories, SITE_NAME } from '../data/tools'
import { useDisabledToolsList, useSiteLogo } from '../utils/toolStatus'

export default function Footer() {
  const disabledTools = useDisabledToolsList()
  const siteLogo = useSiteLogo()
  return (
    <footer className="bg-surface-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              {siteLogo && siteLogo !== '/logo.png' && siteLogo.length > 50 ? (
                <img src={siteLogo} alt={SITE_NAME} className="h-9 max-h-9 w-auto max-w-[150px] object-contain rounded-lg bg-white/10 p-1" />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold text-sm shadow-md">P</div>
              )}
              <span className="text-lg font-extrabold">
                <span className="text-primary-300">PDFCompress</span>
                <span className="text-white">Pro</span>
              </span>
            </Link>
            <p className="text-surface-400 text-sm leading-relaxed">
              Fast, free, and secure online PDF, image, and utility suite. 100% private — documents are processed securely in temporary memory.
            </p>
          </div>

          {/* Tool Categories */}
          {categories.slice(0, 4).map(cat => {
            const catTools = tools
              .filter(t => t.category === cat.id && t.isActive && !disabledTools.includes(t.slug))
              .slice(0, 5)
            return (
              <div key={cat.id}>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-surface-300 mb-4">
                  {cat.icon} {cat.label}
                </h4>
                <ul className="space-y-2">
                  {catTools.map(tool => (
                    <li key={tool.slug}>
                      <Link to={`/${tool.slug}`} className="text-sm text-surface-400 hover:text-primary-300 transition-colors">
                        {tool.shortName}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-surface-700/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-surface-500 text-sm">
            © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <Link to="/privacy" className="text-surface-400 hover:text-primary-300 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-surface-400 hover:text-primary-300 transition-colors">Terms of Service</Link>
            <Link to="/contact" className="text-surface-400 hover:text-primary-300 transition-colors">Contact</Link>
            <Link to="/admin/dashboard" className="text-surface-500 hover:text-surface-300 text-xs transition-colors">Admin Portal</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
