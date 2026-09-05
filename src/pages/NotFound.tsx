import { Link } from 'react-router-dom'
import SEOHead from '../components/SEOHead'
import { tools } from '../data/tools'

export default function NotFound() {
  const popularTools = tools.slice(0, 4)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <SEOHead
        title="404 — Page Not Found | PDFCompress Pro"
        description="The page or tool you are looking for does not exist or has moved."
        canonical="/404"
      />

      <div className="card-premium p-10 space-y-6">
        <div className="text-6xl font-black text-primary-500">404</div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-800">Page Not Found</h1>
        <p className="text-surface-500 text-sm max-w-md mx-auto">
          We couldn't find the page or tool you were looking for. It may have been renamed, moved, or is temporarily unavailable.
        </p>

        <div className="pt-2">
          <Link to="/" className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm">
            <span>🏠 Return to Homepage</span>
          </Link>
        </div>

        <div className="mt-8 pt-8 border-t border-surface-100 text-left">
          <h2 className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-3">Popular Free Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {popularTools.map((t) => (
              <Link
                key={t.id}
                to={`/${t.slug}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-surface-200 hover:border-primary-300 hover:bg-surface-50 transition"
              >
                <span className="text-2xl">{t.icon}</span>
                <div>
                  <div className="font-bold text-sm text-surface-800">{t.name}</div>
                  <div className="text-xs text-surface-500 line-clamp-1">{t.shortName}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
