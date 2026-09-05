import { Link } from 'react-router-dom'
import type { ToolInfo } from '../data/tools'

interface ToolCardProps {
  tool: ToolInfo
}

export default function ToolCard({ tool }: ToolCardProps) {
  return (
    <Link to={`/${tool.slug}`} className="tool-card group">
      <div className="tool-card-icon">
        <span>{tool.icon}</span>
      </div>
      <h3 className="font-semibold text-surface-800 text-sm mt-1">{tool.shortName}</h3>
      <p className="text-xs text-surface-500 leading-relaxed line-clamp-2">{tool.description}</p>
      <span className={`category-badge ${tool.category} mt-2`}>{tool.categoryLabel}</span>
    </Link>
  )
}
