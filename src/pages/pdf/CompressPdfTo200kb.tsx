import PdfCompressor from './PdfCompressor'
import SEOHead from '../../components/SEOHead'
import { getToolBySlug, SITE_URL } from '../../data/tools'

const tool = getToolBySlug('compress-pdf-to-200kb')!

export default function CompressPdfTo200kb() {
  return (
    <>
      <SEOHead
        title={tool.metaTitle}
        description={tool.metaDescription}
        canonical={`/${tool.slug}`}
        keywords={tool.keywords}
        structuredData={{
          '@context': 'https://schema.org', '@type': 'WebApplication',
          name: tool.name, url: `${SITE_URL}/${tool.slug}`,
          description: tool.metaDescription, applicationCategory: 'BusinessApplication',
          operatingSystem: 'All', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        }}
      />
      <PdfCompressor />
    </>
  )
}
