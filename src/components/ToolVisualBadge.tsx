interface ToolVisualBadgeProps {
  category: string
  slug: string
  name: string
  icon?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export default function ToolVisualBadge({
  category,
  slug,
  name,
  icon,
  size = 'md',
  className = '',
}: ToolVisualBadgeProps) {
  // Determine distinct color palette per category
  let gradient = 'from-blue-500 to-indigo-600'
  let formatBadge = ''
  let actionIconType: 'compress' | 'convert' | 'merge' | 'split' | 'crop' | 'calc' | 'code' | 'security' | 'media' | 'qr' | 'doc' | 'generic' = 'generic'

  // Extract file formats if conversion
  if (slug.includes('to-')) {
    const parts = slug.split('-to-')
    if (parts.length === 2) {
      formatBadge = `${parts[0].slice(0, 4).toUpperCase()} › ${parts[1].slice(0, 4).toUpperCase()}`
      actionIconType = 'convert'
    }
  } else if (slug.includes('jpg') || slug.includes('jpeg')) {
    formatBadge = 'JPG'
  } else if (slug.includes('png')) {
    formatBadge = 'PNG'
  } else if (slug.includes('webp')) {
    formatBadge = 'WEBP'
  } else if (slug.includes('pdf')) {
    formatBadge = 'PDF'
  } else if (slug.includes('svg')) {
    formatBadge = 'SVG'
  } else if (slug.includes('json')) {
    formatBadge = 'JSON'
  } else if (slug.includes('csv')) {
    formatBadge = 'CSV'
  } else if (slug.includes('bmi')) {
    formatBadge = 'BMI'
  } else if (slug.includes('emi')) {
    formatBadge = 'EMI'
  } else if (slug.includes('qr')) {
    formatBadge = 'QR'
  }

  // Assign rich gradients and icon themes based on category & action
  switch (category) {
    case 'pdf':
      gradient = 'from-rose-500 via-red-600 to-amber-600'
      if (slug.includes('compress')) actionIconType = 'compress'
      else if (slug.includes('merge')) actionIconType = 'merge'
      else if (slug.includes('split') || slug.includes('extract')) actionIconType = 'split'
      break
    case 'image':
      gradient = 'from-sky-500 via-blue-600 to-indigo-600'
      if (slug.includes('compress')) actionIconType = 'compress'
      else if (slug.includes('crop') || slug.includes('resize')) actionIconType = 'crop'
      break
    case 'svg':
      gradient = 'from-fuchsia-500 via-pink-600 to-rose-600'
      break
    case 'document':
      gradient = 'from-blue-600 via-indigo-600 to-sky-700'
      actionIconType = 'doc'
      break
    case 'spreadsheet':
      gradient = 'from-emerald-500 via-teal-600 to-green-700'
      actionIconType = 'doc'
      break
    case 'developer':
      gradient = 'from-violet-600 via-purple-700 to-slate-900'
      actionIconType = 'code'
      break
    case 'seo':
      gradient = 'from-cyan-500 via-blue-600 to-teal-600'
      break
    case 'calculator':
    case 'converter':
      gradient = 'from-amber-500 via-orange-600 to-red-500'
      actionIconType = 'calc'
      break
    case 'security':
      gradient = 'from-slate-700 via-zinc-800 to-black'
      actionIconType = 'security'
      break
    case 'qr':
      gradient = 'from-teal-500 via-emerald-600 to-cyan-700'
      actionIconType = 'qr'
      break
    case 'text':
      gradient = 'from-indigo-500 via-violet-600 to-purple-600'
      actionIconType = 'doc'
      break
    case 'student':
      gradient = 'from-amber-500 via-yellow-600 to-orange-600'
      actionIconType = 'calc'
      break
    case 'business':
    case 'invoice':
      gradient = 'from-emerald-600 via-teal-700 to-slate-800'
      actionIconType = 'doc'
      break
    case 'social':
      gradient = 'from-pink-500 via-rose-500 to-purple-600'
      actionIconType = 'media'
      break
    case 'video':
    case 'audio':
      gradient = 'from-red-500 via-rose-600 to-fuchsia-700'
      actionIconType = 'media'
      break
    case 'hardware-test':
    case 'miscellaneous':
      gradient = 'from-slate-800 via-zinc-900 to-neutral-950'
      break
    default:
      gradient = 'from-primary-500 to-indigo-600'
  }

  // Size mapping
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg text-xs',
    md: 'w-11 h-11 rounded-xl text-sm',
    lg: 'w-16 h-16 rounded-2xl text-xl',
    xl: 'w-20 h-20 rounded-3xl text-2xl',
  }

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 bg-gradient-to-br ${gradient} text-white shadow-md shadow-black/10 group-hover:scale-105 group-hover:shadow-lg transition-all select-none overflow-hidden ${sizeClasses[size]} ${className}`}
      title={name}
    >
      {/* Background glow & subtle geometric pattern */}
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-white/15 rounded-full blur-xs pointer-events-none" />

      {/* Action / Format Vector or Emoji */}
      <div className="relative z-10 flex flex-col items-center justify-center font-bold">
        {actionIconType === 'convert' ? (
          <span className="tracking-tighter font-extrabold text-[11px] scale-90">⇄</span>
        ) : actionIconType === 'compress' ? (
          <span className="font-extrabold text-[12px] leading-none">⤓</span>
        ) : actionIconType === 'merge' ? (
          <span className="font-extrabold text-[12px] leading-none">⧉</span>
        ) : actionIconType === 'split' ? (
          <span className="font-extrabold text-[12px] leading-none">✂</span>
        ) : actionIconType === 'crop' ? (
          <span className="font-extrabold text-[12px] leading-none">⛶</span>
        ) : actionIconType === 'code' ? (
          <span className="font-mono text-[11px] font-black">{`{;}`}</span>
        ) : actionIconType === 'calc' ? (
          <span className="font-mono text-[12px] font-black">±%</span>
        ) : actionIconType === 'security' ? (
          <span className="text-[12px] leading-none">🔒</span>
        ) : icon ? (
          <span className="leading-none text-base">{icon}</span>
        ) : (
          <span className="font-bold text-xs uppercase">{name.slice(0, 2)}</span>
        )}

        {/* Small format label if available and size is large enough */}
        {formatBadge && (size === 'md' || size === 'lg' || size === 'xl') && (
          <span className="text-[7.5px] font-mono font-black tracking-tighter opacity-90 uppercase leading-none mt-0.5">
            {formatBadge.length > 5 ? formatBadge.slice(0, 5) : formatBadge}
          </span>
        )}
      </div>

      {/* Corner badge highlight */}
      <div className="absolute top-0 right-0 w-3 h-3 bg-white/20 rounded-bl-lg pointer-events-none" />
    </div>
  )
}
