import { Link } from 'react-router-dom'
import { getRelatedTools } from '../data/tools'

interface RelatedToolsProps {
  currentSlug: string
  limit?: number
}

export default function RelatedTools({ currentSlug, limit = 4 }: RelatedToolsProps) {
  const related = getRelatedTools(currentSlug, limit)

  return (
    <section className="content-section">
      <h2 className="text-section text-surface-800 mb-6">Related Tools You Might Like</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {related.map(tool => (
          <Link
            key={tool.slug}
            to={`/${tool.slug}`}
            className="flex flex-col items-center gap-3 p-4 rounded-xl border border-surface-200 hover:border-primary-200 hover:shadow-lg transition-all hover:-translate-y-1 text-center"
          >
            <span className="text-2xl">{tool.icon}</span>
            <span className="text-sm font-semibold text-surface-700">{tool.shortName}</span>
            <span className={`category-badge ${tool.category}`}>{tool.categoryLabel}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
