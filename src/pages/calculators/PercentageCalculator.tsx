import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import SEOHead from '../../components/SEOHead'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import ToolVisualBadge from '../../components/ToolVisualBadge'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { trackToolUsage } from '../../utils/telemetry'

const tool = getToolBySlug('percentage-calculator') || {
  slug: 'percentage-calculator',
  name: 'Percentage Calculator — 4-in-1 Online Percentage Solver',
  shortName: 'Percentage Calculator',
  description: 'Calculate percentages instantly: X% of Y, find what percent X is of Y, percentage increase or decrease, and add/subtract percentages with step-by-step formulas.',
  metaTitle: 'Percentage Calculator Online Free — 4-in-1 Math & Discount Solver',
  metaDescription: 'Free online percentage calculator. Solve percentage of numbers, percent change, increase/decrease, and tips with step-by-step mathematical formulas.',
  category: 'calculator',
  categoryLabel: 'Calculators',
  keywords: ['percentage calculator', 'percent calculator online', 'percentage change calculator', 'calculate percent discount', 'what percent of'],
  icon: '📊',
}

const faqItems = [
  {
    question: 'How do you calculate a percentage of a number?',
    answer: 'To find X% of Y, convert the percentage into a decimal by dividing by 100, then multiply by the total number: (X ÷ 100) × Y. For example, 15% of 80 is 0.15 × 80 = 12.',
  },
  {
    question: 'How is percentage increase or decrease calculated?',
    answer: 'Percentage change is calculated using the formula: [ (New Value - Original Value) ÷ |Original Value| ] × 100. A positive result denotes a percentage increase, while a negative result denotes a percentage decrease.',
  },
  {
    question: 'Can this tool calculate retail discounts and sales tax?',
    answer: 'Yes! Use the "Add / Subtract %" tab to easily add sales tax (e.g. Price + 8.5% tax) or compute store discount markdowns (e.g. Price - 30% discount).',
  },
  {
    question: 'Is any of my calculation data logged or saved?',
    answer: 'No! All calculations run purely inside your web browser. Nothing is ever sent to or stored on our servers.',
  },
]

type CalcMode = 'of' | 'is' | 'change' | 'addrem'

export default function PercentageCalculator() {
  const [mode, setMode] = useState<CalcMode>('of')
  const [valA, setValA] = useState('20')
  const [valB, setValB] = useState('150')
  const [copied, setCopied] = useState(false)

  const calculation = useMemo(() => {
    const a = parseFloat(valA)
    const b = parseFloat(valB)

    if (isNaN(a) || isNaN(b)) return null

    switch (mode) {
      case 'of': {
        const result = (a / 100) * b
        return {
          title: `What is ${a}% of ${b}?`,
          mainResult: result.toLocaleString(undefined, { maximumFractionDigits: 4 }),
          rawNumber: result,
          formula: `(${a} ÷ 100) × ${b} = ${result}`,
          explanation: `${a}% of ${b} equals exactly ${result}.`,
          percentage: Math.min(100, Math.max(0, a)),
        }
      }
      case 'is': {
        if (b === 0) return { error: 'Division by zero is undefined.' }
        const result = (a / b) * 100
        return {
          title: `${a} is what percent of ${b}?`,
          mainResult: `${result.toLocaleString(undefined, { maximumFractionDigits: 4 })}%`,
          rawNumber: result,
          formula: `(${a} ÷ ${b}) × 100 = ${result.toFixed(4)}%`,
          explanation: `${a} represents ${result.toFixed(2)}% of the total value ${b}.`,
          percentage: Math.min(100, Math.max(0, result)),
        }
      }
      case 'change': {
        if (a === 0) return { error: 'Original value cannot be zero for percent change.' }
        const diff = b - a
        const pctChange = (diff / Math.abs(a)) * 100
        const isIncrease = pctChange >= 0
        return {
          title: `Percent change from ${a} to ${b}`,
          mainResult: `${isIncrease ? '+' : ''}${pctChange.toLocaleString(undefined, { maximumFractionDigits: 4 })}%`,
          rawNumber: pctChange,
          formula: `((${b} - ${a}) ÷ |${a}|) × 100 = ${pctChange.toFixed(4)}%`,
          explanation: `The value ${isIncrease ? 'increased' : 'decreased'} by ${Math.abs(pctChange).toFixed(2)}% (an absolute difference of ${diff >= 0 ? '+' : ''}${diff}).`,
          isIncrease,
        }
      }
      case 'addrem': {
        const added = b * (1 + a / 100)
        const subtracted = b * (1 - a / 100)
        return {
          title: `Add or Subtract ${a}% with ${b}`,
          mainResult: `${b} + ${a}% = ${added.toLocaleString(undefined, { maximumFractionDigits: 4 })}`,
          secondaryResult: `${b} − ${a}% = ${subtracted.toLocaleString(undefined, { maximumFractionDigits: 4 })}`,
          rawNumber: added,
          formula: `Add: ${b} × (1 + ${a}/100) = ${added}\nSubtract: ${b} × (1 - ${a}/100) = ${subtracted}`,
          explanation: `Adding ${a}% gives ${added}. Subtracting ${a}% gives ${subtracted}.`,
        }
      }
    }
  }, [mode, valA, valB])

  const copyResult = () => {
    if (!calculation || 'error' in calculation) return
    const text = `${calculation.title} => ${calculation.mainResult} [Formula: ${calculation.formula}]`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const modes = [
    {
      id: 'of' as const,
      label: 'X% of Y',
      desc: 'Find a percentage of a number',
      placeholders: ['Percentage (%)', 'Total Value (Y)'],
      labels: ['Percentage (X)', 'Of Value (Y)'],
    },
    {
      id: 'is' as const,
      label: 'X is what % of Y',
      desc: 'Calculate proportion / score',
      placeholders: ['Part (X)', 'Whole (Y)'],
      labels: ['Part (X)', 'Whole (Y)'],
    },
    {
      id: 'change' as const,
      label: '% Change',
      desc: 'Increase or decrease percentage',
      placeholders: ['Initial Value', 'Final Value'],
      labels: ['From Value (Initial)', 'To Value (Final)'],
    },
    {
      id: 'addrem' as const,
      label: 'Add / Subtract %',
      desc: 'Sales tax or discounts',
      placeholders: ['Percentage (%)', 'Base Amount'],
      labels: ['Percentage (X)', 'Base Amount (Y)'],
    },
  ]

  const curMode = modes.find((m) => m.id === mode)!

  const applyPreset = (presetMode: CalcMode, a: string, b: string) => {
    setMode(presetMode)
    setValA(a)
    setValB(b)
  }

  const handleCalculateUsage = () => {
    if (calculation && !('error' in calculation)) {
      trackToolUsage({
        toolId: 'percentage-calculator',
        toolName: 'Percentage Calculator',
        category: 'calculator',
        action: `Calculated ${mode}: ${calculation.mainResult}`,
        details: `Inputs: ${valA} and ${valB}`,
        method: 'Client JS',
      })
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <SEOHead
        title={tool.metaTitle}
        description={tool.metaDescription}
        canonical={`/${tool.slug}`}
        keywords={tool.keywords}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: tool.name,
          url: `${SITE_URL}/${tool.slug}`,
          description: tool.metaDescription,
          applicationCategory: 'UtilityApplication',
          operatingSystem: 'All',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        }}
        faqData={faqItems}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-surface-500 mb-6">
        <Link to="/" className="hover:text-primary-600 transition">Home</Link>
        <span>/</span>
        <span className="text-surface-700 font-medium">{tool.shortName}</span>
      </nav>

      {/* Hero Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent p-6 rounded-2xl border border-blue-500/20">
        <ToolVisualBadge category="calculator" slug={tool.slug} name={tool.name} size="xl" />
        <div className="flex-1">
          <h1 className="text-3xl sm:text-4xl font-black text-surface-900 tracking-tight mb-2">
            {tool.name}
          </h1>
          <p className="text-surface-600 text-base max-w-2xl mb-4 leading-relaxed">
            {tool.description}
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              ⚡ Real-Time Instant Math
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              🔢 4 Calculation Modes
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              📝 Step-by-Step Formulas
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              🔒 100% In-Browser Privacy
            </span>
          </div>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`p-3 rounded-xl border text-left transition-all ${
              mode === m.id
                ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-sm font-bold ring-2 ring-blue-500/20'
                : 'border-surface-200 bg-white text-surface-600 hover:bg-surface-50'
            }`}
          >
            <div className="text-sm font-bold">{m.label}</div>
            <div className="text-[11px] text-surface-400 mt-0.5 line-clamp-1">{m.desc}</div>
          </button>
        ))}
      </div>

      {/* Main Calculation Card */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-surface-600 mb-1.5">
              {curMode.labels[0]}
            </label>
            <input
              type="number"
              value={valA}
              onChange={(e) => setValA(e.target.value)}
              placeholder={curMode.placeholders[0]}
              className="w-full px-4 py-3 bg-surface-50 border border-surface-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-surface-900 font-bold text-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-surface-600 mb-1.5">
              {curMode.labels[1]}
            </label>
            <input
              type="number"
              value={valB}
              onChange={(e) => setValB(e.target.value)}
              placeholder={curMode.placeholders[1]}
              className="w-full px-4 py-3 bg-surface-50 border border-surface-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-surface-900 font-bold text-lg"
            />
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 mb-6 pt-2 border-t border-surface-100">
          <span className="text-xs text-surface-400 font-medium">Quick Examples:</span>
          <button
            type="button"
            onClick={() => applyPreset('of', '15', '80')}
            className="text-xs px-2.5 py-1 rounded-lg bg-surface-100 hover:bg-surface-200 text-surface-700 transition"
          >
            15% tip on $80
          </button>
          <button
            type="button"
            onClick={() => applyPreset('is', '45', '60')}
            className="text-xs px-2.5 py-1 rounded-lg bg-surface-100 hover:bg-surface-200 text-surface-700 transition"
          >
            45 out of 60 score
          </button>
          <button
            type="button"
            onClick={() => applyPreset('change', '50', '75')}
            className="text-xs px-2.5 py-1 rounded-lg bg-surface-100 hover:bg-surface-200 text-surface-700 transition"
          >
            $50 to $75 growth
          </button>
          <button
            type="button"
            onClick={() => applyPreset('addrem', '20', '100')}
            className="text-xs px-2.5 py-1 rounded-lg bg-surface-100 hover:bg-surface-200 text-surface-700 transition"
          >
            ±20% on $100
          </button>
        </div>

        {/* Live Result Box */}
        {calculation && 'error' in calculation ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 font-semibold text-center">
            ⚠️ {calculation.error}
          </div>
        ) : calculation ? (
          <div className="bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-2xl p-6 border border-blue-500/20">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">
                {calculation.title}
              </span>
              <button
                onClick={() => {
                  copyResult()
                  handleCalculateUsage()
                }}
                className="text-xs px-3 py-1 rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 font-semibold shadow-sm transition inline-flex items-center gap-1"
              >
                {copied ? '✓ Copied!' : '📋 Copy Result'}
              </button>
            </div>

            <div className="text-3xl sm:text-4xl font-black text-surface-900 tracking-tight my-2">
              {calculation.mainResult}
            </div>

            {'secondaryResult' in calculation && (
              <div className="text-xl sm:text-2xl font-black text-surface-700 tracking-tight mb-2">
                {calculation.secondaryResult}
              </div>
            )}

            <p className="text-surface-600 text-sm mb-4">
              {calculation.explanation}
            </p>

            {/* Formula Step */}
            <div className="p-3 bg-white/80 rounded-xl border border-blue-200/50 text-xs font-mono text-blue-900 whitespace-pre-line">
              <span className="font-bold text-surface-500 font-sans block mb-1">Step-by-Step Formula:</span>
              {calculation.formula}
            </div>

            {/* Visual Bar representation if percentage exists */}
            {'percentage' in calculation && typeof calculation.percentage === 'number' && (
              <div className="mt-4">
                <div className="flex justify-between text-[11px] font-bold text-surface-500 mb-1">
                  <span>0%</span>
                  <span>{calculation.percentage.toFixed(1)}%</span>
                  <span>100%</span>
                </div>
                <div className="w-full h-2.5 bg-surface-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, calculation.percentage))}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* SEO Explanatory Guide */}
      <section className="content-section mt-10">
        <h2>How to Calculate Percentages Accurately</h2>
        <p>
          A percentage represents a number or ratio expressed as a fraction of 100 (from the Latin <em>per centum</em> meaning "by the hundred").
          Whether calculating discounts on retail purchases, tipping at restaurants, analyzing investment yield, or grading exams, mastering percentage formulas is essential.
        </p>

        <h3>The 4 Essential Percentage Formulas</h3>
        <ul>
          <li><strong>Find Percentage of a Value:</strong> <code>Result = (X ÷ 100) × Y</code></li>
          <li><strong>Find What Percent X is of Y:</strong> <code>Percentage = (X ÷ Y) × 100</code></li>
          <li><strong>Percentage Increase or Decrease:</strong> <code>% Change = [ (New - Old) ÷ |Old| ] × 100</code></li>
          <li><strong>Add or Deduct Percentage:</strong> <code>New Value = Base × (1 ± Percentage ÷ 100)</code></li>
        </ul>
      </section>

      <FAQ items={faqItems} />
      <RelatedTools currentSlug="percentage-calculator" />
    </div>
  )
}
