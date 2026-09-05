import { Helmet } from 'react-helmet-async'
import { SITE_NAME, SITE_URL } from '../data/tools'

interface SEOHeadProps {
  title: string
  description: string
  canonical?: string
  keywords?: string[]
  type?: 'website' | 'article'
  structuredData?: object
  faqData?: Array<{ question: string; answer: string }>
  toolName?: string
  ratingValue?: string
  ratingCount?: string
}

export default function SEOHead({
  title,
  description,
  canonical,
  keywords = [],
  type = 'website',
  structuredData,
  faqData,
  toolName,
  ratingValue = '4.9',
  ratingCount = '1280',
}: SEOHeadProps) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`
  const canonicalUrl = canonical ? `${SITE_URL}${canonical.startsWith('/') ? canonical : `/${canonical}`}` : undefined

  // Default rich SoftwareApplication schema for tools
  const appSchema = toolName || canonical ? {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: toolName || title.split('—')[0].trim(),
    operatingSystem: 'All (Windows, macOS, Linux, iOS, Android)',
    applicationCategory: 'UtilitiesApplication',
    description: description,
    url: canonicalUrl || SITE_URL,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: ratingValue,
      ratingCount: ratingCount,
      bestRating: '5',
      worstRating: '1',
    },
  } : null

  // Breadcrumb schema
  const breadcrumbSchema = canonical && canonical !== '/' ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: toolName || title.split('—')[0].trim(),
        item: canonicalUrl,
      },
    ],
  } : null

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />

      {/* Primary Application / Custom Schema */}
      {structuredData ? (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      ) : appSchema ? (
        <script type="application/ld+json">
          {JSON.stringify(appSchema)}
        </script>
      ) : null}

      {/* Breadcrumb Schema for Google SERP URL Path */}
      {breadcrumbSchema && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      )}

      {/* FAQ Accordion Schema for Google Rich Snippets */}
      {faqData && faqData.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqData.map(item => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
              },
            })),
          })}
        </script>
      )}
    </Helmet>
  )
}
