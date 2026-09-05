import { useState } from 'react'
import SEOHead from '../../components/SEOHead'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import { getToolBySlug, SITE_URL } from '../../data/tools'

const tool = getToolBySlug('percentage-calculator')!
const faqItems = [
  { question: 'What calculations can this tool do?', answer: 'Calculate X% of Y, find what percentage X is of Y, calculate percentage increase/decrease, and find the original value from a percentage.' },
]

export default function PercentageCalculator() {
  const [mode, setMode] = useState<'of' | 'is' | 'change' | 'addrem'>('of')
  const [a, setA] = useState(''); const [b, setB] = useState('')
  const [result, setResult] = useState<string | null>(null)

  const calc = () => {
    const x = parseFloat(a), y = parseFloat(b)
    if (isNaN(x) || isNaN(y)) { setResult('Please enter valid numbers.'); return }
    switch (mode) {
      case 'of': setResult(`${x}% of ${y} = ${(x / 100 * y).toFixed(4)}`); break
      case 'is': setResult(`${x} is ${((x / y) * 100).toFixed(4)}% of ${y}`); break
      case 'change': setResult(`Change from ${x} to ${y} = ${(((y - x) / Math.abs(x)) * 100).toFixed(4)}%`); break
      case 'addrem': setResult(`${y} + ${x}% = ${(y * (1 + x / 100)).toFixed(4)}\n${y} − ${x}% = ${(y * (1 - x / 100)).toFixed(4)}`); break
    }
  }

  const modes = [
    { id: 'of' as const, label: 'X% of Y', placeholders: ['Percentage (%)', 'Number'] },
    { id: 'is' as const, label: 'X is what % of Y', placeholders: ['Number X', 'Number Y'] },
    { id: 'change' as const, label: '% Change', placeholders: ['From', 'To'] },
    { id: 'addrem' as const, label: 'Add/Remove %', placeholders: ['Percentage (%)', 'Number'] },
  ]
  const cur = modes.find(m => m.id === mode)!

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <SEOHead title={tool.metaTitle} description={tool.metaDescription} canonical={`/${tool.slug}`} keywords={tool.keywords}
        structuredData={{ '@context': 'https://schema.org', '@type': 'WebApplication', name: tool.name, url: `${SITE_URL}/${tool.slug}`, description: tool.metaDescription, applicationCategory: 'UtilityApplication', operatingSystem: 'All', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }}
        faqData={faqItems} />
      <nav className="breadcrumb"><a href="/">Home</a><span className="separator">›</span><span>{tool.shortName}</span></nav>
      <h1 className="text-2xl md:text-3xl font-extrabold text-surface-800 mb-2">{tool.name}</h1>
      <p className="text-surface-500 mb-6">{tool.description}</p>

      <div className="card-premium p-6 space-y-4">
        <div className="flex flex-wrap gap-2">{modes.map(m => <button key={m.id} onClick={() => { setMode(m.id); setResult(null) }} className={`text-sm px-4 py-2 rounded-full border transition-colors ${mode === m.id ? 'border-primary-500 bg-primary-50 text-primary-700 font-semibold' : 'border-surface-200'}`}>{m.label}</button>)}</div>
        <div className="grid grid-cols-2 gap-4">
          <input type="number" value={a} onChange={e => setA(e.target.value)} placeholder={cur.placeholders[0]} className="px-4 py-3 border border-surface-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
          <input type="number" value={b} onChange={e => setB(e.target.value)} placeholder={cur.placeholders[1]} className="px-4 py-3 border border-surface-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
        </div>
        <button onClick={calc} className="btn-primary w-full py-4">📊 Calculate</button>
        {result && <div className="p-4 bg-primary-50 rounded-xl text-center"><pre className="text-lg font-bold text-primary-700 whitespace-pre-line">{result}</pre></div>}
      </div>

      <section className="content-section mt-8"><h2>How to Calculate Percentages</h2><p>This tool handles four types of percentage calculations: finding X% of a number, determining what percentage one number is of another, calculating percentage change between two values, and adding or subtracting a percentage from a number. All calculations happen instantly in your browser.</p></section>
      <FAQ items={faqItems} /><RelatedTools currentSlug="percentage-calculator" />
    </div>
  )
}
