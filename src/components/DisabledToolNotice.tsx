import { Link } from 'react-router-dom'
import { tools, type ToolInfo } from '../data/tools'
import { useDisabledToolsList } from '../utils/toolStatus'

interface DisabledToolNoticeProps {
  tool: ToolInfo
}

export default function DisabledToolNotice({ tool }: DisabledToolNoticeProps) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const disabledTools = useDisabledToolsList()
  const otherTools = tools.filter((t) => t.slug !== tool.slug && t.isActive && !disabledTools.includes(t.slug)).slice(0, 6)

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-3xl mb-4 shadow-sm">
        {tool.icon || '🛠️'}
      </div>

      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 mb-3">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
        Tool Temporarily Offline
      </span>

      <h1 className="text-2xl sm:text-3xl font-black text-surface-900 tracking-tight max-w-xl">
        {tool.name} is Temporarily Disabled
      </h1>

      <p className="text-sm text-surface-500 max-w-md mt-2">
        This tool is currently switched off for maintenance or system updates. Please check back shortly or explore our other available utilities.
      </p>

      {token && (
        <div className="mt-4 p-3 rounded-xl bg-primary-50 border border-primary-200 text-xs text-primary-900 max-w-md">
          <span className="font-bold">Admin Notice:</span> You have disabled this tool in system settings.{' '}
          <Link to="/admin/settings" className="font-bold underline hover:text-primary-700">
            Open Admin Settings to Re-enable →
          </Link>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="btn-primary !text-sm px-6 py-2.5 shadow-sm"
        >
          ← Back to Homepage
        </Link>
        {tool.slug !== 'pdf-compressor' && !disabledTools.includes('pdf-compressor') ? (
          <Link
            to="/pdf-compressor"
            className="btn-secondary !text-sm px-6 py-2.5"
          >
            Open PDF Compressor
          </Link>
        ) : (
          <a
            href="/#all-tools"
            className="btn-secondary !text-sm px-6 py-2.5"
          >
            Explore All Tools →
          </a>
        )}
      </div>

      <div className="mt-12 max-w-2xl w-full border-t border-surface-200 pt-8">
        <p className="text-xs font-bold uppercase tracking-wider text-surface-400 mb-4">
          Popular Active Tools
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {otherTools.map((t) => (
            <Link
              key={t.slug}
              to={`/${t.slug}`}
              className="p-3 rounded-xl border border-surface-200 bg-white hover:border-primary-300 hover:shadow-xs transition-all flex items-center gap-2.5 text-left"
            >
              <span className="text-xl">{t.icon}</span>
              <span className="text-xs font-bold text-surface-800 truncate">{t.shortName}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
