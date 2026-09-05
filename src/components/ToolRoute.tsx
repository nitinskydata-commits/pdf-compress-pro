import React from 'react'
import { tools } from '../data/tools'
import { useIsToolDisabled } from '../utils/toolStatus'
import DisabledToolNotice from './DisabledToolNotice'

interface ToolRouteProps {
  slug: string
  children: React.ReactNode
}

export default function ToolRoute({ slug, children }: ToolRouteProps) {
  const isDisabled = useIsToolDisabled(slug)

  if (isDisabled) {
    const tool = tools.find((t) => t.slug === slug) || {
      id: slug,
      slug,
      name: slug,
      shortName: slug,
      description: '',
      metaTitle: '',
      metaDescription: '',
      icon: '🛠️',
      category: 'utility' as const,
      categoryLabel: 'Utility',
      isActive: true,
      keywords: [],
    }
    return <DisabledToolNotice tool={tool} />
  }

  return <>{children}</>
}
