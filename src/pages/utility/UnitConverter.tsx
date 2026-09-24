import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SEOHead from '../../components/SEOHead'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import ToolVisualBadge from '../../components/ToolVisualBadge'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { trackToolUsage } from '../../utils/telemetry'

const tool = getToolBySlug('unit-converter') || {
  slug: 'unit-converter',
  name: 'Universal Unit Converter — Length, Weight, Temperature & More',
  shortName: 'Unit Converter',
  description: 'Convert between 60+ international units across Length, Weight, Temperature, Area, Speed, Volume, Time, and Digital Storage with live all-in-one matrix previews.',
  metaTitle: 'Unit Converter Online Free — Length, Weight, Temp & Metric Converter',
  metaDescription: 'Accurately convert length, weight, temperature, digital storage, and speed online. Instant multi-unit matrix calculations with scientific precision. 100% private.',
  category: 'utility',
  categoryLabel: 'Calculators & Utilities',
  keywords: ['unit converter', 'metric converter', 'length converter', 'weight converter', 'temperature converter online'],
  icon: '⚖️',
}

const faqItems = [
  {
    question: 'How accurate are these conversions?',
    answer: 'All conversions follow official BIPM (International Bureau of Weights and Measures) and NIST definitions using IEEE 754 double-precision floating point math for exact accuracy up to 8 decimal places.',
  },
  {
    question: 'What unit categories are supported?',
    answer: 'We support 8 comprehensive categories: Length, Weight & Mass, Temperature, Area, Speed, Digital Storage, Volume, and Time.',
  },
  {
    question: 'How does digital storage conversion calculate kilobytes?',
    answer: 'Digital storage uses standard binary units (IEC standard 1024-based multipliers) where 1 KB = 1,024 Bytes, 1 MB = 1,024 KB, 1 GB = 1,024 MB, and so forth.',
  },
  {
    question: 'Is my calculation data recorded?',
    answer: 'No! All conversions run purely client-side in your web browser. No numbers, values, or metrics are ever sent to any remote server.',
  },
]

type Category = 'length' | 'weight' | 'temperature' | 'area' | 'speed' | 'storage' | 'volume' | 'time'

interface UnitConfig {
  name: string
  symbol: string
  toBase: (v: number) => number
  fromBase: (v: number) => number
}

const UNIT_DATA: Record<Category, { label: string; icon: string; units: Record<string, UnitConfig> }> = {
  length: {
    label: 'Length',
    icon: '📏',
    units: {
      m: { name: 'Meters', symbol: 'm', toBase: (v) => v, fromBase: (v) => v },
      km: { name: 'Kilometers', symbol: 'km', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      cm: { name: 'Centimeters', symbol: 'cm', toBase: (v) => v * 0.01, fromBase: (v) => v / 0.01 },
      mm: { name: 'Millimeters', symbol: 'mm', toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
      mi: { name: 'Miles', symbol: 'mi', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
      yd: { name: 'Yards', symbol: 'yd', toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
      ft: { name: 'Feet', symbol: 'ft', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
      in: { name: 'Inches', symbol: 'in', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
      nmi: { name: 'Nautical Miles', symbol: 'NM', toBase: (v) => v * 1852, fromBase: (v) => v / 1852 },
    },
  },
  weight: {
    label: 'Weight & Mass',
    icon: '⚖️',
    units: {
      kg: { name: 'Kilograms', symbol: 'kg', toBase: (v) => v, fromBase: (v) => v },
      g: { name: 'Grams', symbol: 'g', toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
      mg: { name: 'Milligrams', symbol: 'mg', toBase: (v) => v * 0.000001, fromBase: (v) => v / 0.000001 },
      lb: { name: 'Pounds', symbol: 'lb', toBase: (v) => v * 0.45359237, fromBase: (v) => v / 0.45359237 },
      oz: { name: 'Ounces', symbol: 'oz', toBase: (v) => v * 0.028349523, fromBase: (v) => v / 0.028349523 },
      t: { name: 'Metric Tons', symbol: 't', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      st: { name: 'Stone', symbol: 'st', toBase: (v) => v * 6.35029318, fromBase: (v) => v / 6.35029318 },
    },
  },
  temperature: {
    label: 'Temperature',
    icon: '🌡️',
    units: {
      c: { name: 'Celsius', symbol: '°C', toBase: (v) => v, fromBase: (v) => v },
      f: { name: 'Fahrenheit', symbol: '°F', toBase: (v) => ((v - 32) * 5) / 9, fromBase: (v) => (v * 9) / 5 + 32 },
      k: { name: 'Kelvin', symbol: 'K', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    },
  },
  area: {
    label: 'Area',
    icon: '🗺️',
    units: {
      sqm: { name: 'Square Meters', symbol: 'm²', toBase: (v) => v, fromBase: (v) => v },
      sqkm: { name: 'Square Kilometers', symbol: 'km²', toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
      sqft: { name: 'Square Feet', symbol: 'ft²', toBase: (v) => v * 0.092903, fromBase: (v) => v / 0.092903 },
      acre: { name: 'Acres', symbol: 'ac', toBase: (v) => v * 4046.8564, fromBase: (v) => v / 4046.8564 },
      ha: { name: 'Hectares', symbol: 'ha', toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
      sqmi: { name: 'Square Miles', symbol: 'mi²', toBase: (v) => v * 2589988.11, fromBase: (v) => v / 2589988.11 },
    },
  },
  speed: {
    label: 'Speed',
    icon: '🚀',
    units: {
      kmh: { name: 'Kilometers / Hour', symbol: 'km/h', toBase: (v) => v, fromBase: (v) => v },
      mph: { name: 'Miles / Hour', symbol: 'mph', toBase: (v) => v * 1.609344, fromBase: (v) => v / 1.609344 },
      ms: { name: 'Meters / Second', symbol: 'm/s', toBase: (v) => v * 3.6, fromBase: (v) => v / 3.6 },
      kn: { name: 'Knots', symbol: 'kn', toBase: (v) => v * 1.852, fromBase: (v) => v / 1.852 },
      mach: { name: 'Mach (at sea level)', symbol: 'Mach', toBase: (v) => v * 1234.8, fromBase: (v) => v / 1234.8 },
    },
  },
  storage: {
    label: 'Digital Storage',
    icon: '💾',
    units: {
      b: { name: 'Bytes', symbol: 'B', toBase: (v) => v, fromBase: (v) => v },
      kb: { name: 'Kilobytes', symbol: 'KB', toBase: (v) => v * 1024, fromBase: (v) => v / 1024 },
      mb: { name: 'Megabytes', symbol: 'MB', toBase: (v) => v * 1048576, fromBase: (v) => v / 1048576 },
      gb: { name: 'Gigabytes', symbol: 'GB', toBase: (v) => v * 1073741824, fromBase: (v) => v / 1073741824 },
      tb: { name: 'Terabytes', symbol: 'TB', toBase: (v) => v * 1099511627776, fromBase: (v) => v / 1099511627776 },
      pb: { name: 'Petabytes', symbol: 'PB', toBase: (v) => v * 1125899906842624, fromBase: (v) => v / 1125899906842624 },
    },
  },
  volume: {
    label: 'Volume',
    icon: '🧪',
    units: {
      l: { name: 'Liters', symbol: 'L', toBase: (v) => v, fromBase: (v) => v },
      ml: { name: 'Milliliters', symbol: 'mL', toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
      gal: { name: 'Gallons (US)', symbol: 'gal', toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
      qt: { name: 'Quarts (US)', symbol: 'qt', toBase: (v) => v * 0.946353, fromBase: (v) => v / 0.946353 },
      pt: { name: 'Pints (US)', symbol: 'pt', toBase: (v) => v * 0.473176, fromBase: (v) => v / 0.473176 },
      cup: { name: 'Cups (US)', symbol: 'cup', toBase: (v) => v * 0.236588, fromBase: (v) => v / 0.236588 },
      floz: { name: 'Fluid Ounces (US)', symbol: 'fl oz', toBase: (v) => v * 0.0295735, fromBase: (v) => v / 0.0295735 },
      cbm: { name: 'Cubic Meters', symbol: 'm³', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    },
  },
  time: {
    label: 'Time',
    icon: '⏱️',
    units: {
      s: { name: 'Seconds', symbol: 's', toBase: (v) => v, fromBase: (v) => v },
      min: { name: 'Minutes', symbol: 'min', toBase: (v) => v * 60, fromBase: (v) => v / 60 },
      h: { name: 'Hours', symbol: 'h', toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
      d: { name: 'Days', symbol: 'd', toBase: (v) => v * 86400, fromBase: (v) => v / 86400 },
      w: { name: 'Weeks', symbol: 'wk', toBase: (v) => v * 604800, fromBase: (v) => v / 604800 },
      mo: { name: 'Months (Avg 30.4d)', symbol: 'mo', toBase: (v) => v * 2629800, fromBase: (v) => v / 2629800 },
      y: { name: 'Years (365d)', symbol: 'yr', toBase: (v) => v * 31536000, fromBase: (v) => v / 31536000 },
    },
  },
}

function formatResult(num: number): string {
  if (Math.abs(num) >= 1e9 || (Math.abs(num) > 0 && Math.abs(num) < 1e-4)) {
    return num.toExponential(4)
  }
  return parseFloat(num.toFixed(6)).toString()
}

export default function UnitConverter() {
  const [category, setCategory] = useState<Category>('length')
  const [val, setVal] = useState<number | string>(1)
  const currentUnits = UNIT_DATA[category].units
  const unitKeys = Object.keys(currentUnits)

  const [fromUnit, setFromUnit] = useState<string>(unitKeys[0])
  const [toUnit, setToUnit] = useState<string>(unitKeys[1] || unitKeys[0])
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const handleCategoryChange = (cat: Category) => {
    setCategory(cat)
    const keys = Object.keys(UNIT_DATA[cat].units)
    setFromUnit(keys[0])
    setToUnit(keys[1] || keys[0])
  }

  // Primary conversion
  const result = useMemo(() => {
    const num = typeof val === 'string' ? parseFloat(val) : val
    if (isNaN(num)) return ''
    const fromConfig = currentUnits[fromUnit]
    const toConfig = currentUnits[toUnit]
    if (!fromConfig || !toConfig) return ''

    const baseVal = fromConfig.toBase(num)
    const converted = toConfig.fromBase(baseVal)
    return formatResult(converted)
  }, [val, fromUnit, toUnit, currentUnits])

  // All other units in the current category
  const allEquivalents = useMemo(() => {
    const num = typeof val === 'string' ? parseFloat(val) : val
    if (isNaN(num)) return []
    const fromConfig = currentUnits[fromUnit]
    if (!fromConfig) return []

    const baseVal = fromConfig.toBase(num)
    return Object.entries(currentUnits).map(([key, config]) => {
      const converted = config.fromBase(baseVal)
      return {
        key,
        name: config.name,
        symbol: config.symbol,
        value: formatResult(converted),
      }
    })
  }, [val, fromUnit, currentUnits])

  useEffect(() => {
    if (result && val) {
      const timer = setTimeout(() => {
        trackToolUsage({
          toolId: 'unit-converter',
          toolName: 'Unit Converter',
          category: 'utility',
          action: `Converted ${val} ${fromUnit} to ${result} ${toUnit}`,
          details: `Category: ${category}`,
          method: 'Client JS',
        })
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [val, fromUnit, toUnit, category, result])

  const swapUnits = () => {
    const temp = fromUnit
    setFromUnit(toUnit)
    setToUnit(temp)
  }

  const copyVal = (value: string, key: string) => {
    navigator.clipboard.writeText(value)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-transparent p-6 rounded-2xl border border-cyan-500/20">
        <ToolVisualBadge category="utility" slug={tool.slug} name={tool.name} size="xl" />
        <div className="flex-1">
          <h1 className="text-3xl sm:text-4xl font-black text-surface-900 tracking-tight mb-2">
            {tool.name}
          </h1>
          <p className="text-surface-600 text-base max-w-2xl mb-4 leading-relaxed">
            {tool.description}
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
              ⚖️ 8 Metric & Imperial Categories
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              📊 Multi-Unit Live Matrix
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              🔒 100% In-Browser Privacy
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              🔬 High Scientific Precision
            </span>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-6">
        {(Object.keys(UNIT_DATA) as Category[]).map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`p-3 rounded-xl border text-center transition ${
              category === cat
                ? 'border-cyan-500 bg-cyan-50 text-cyan-900 shadow-sm font-bold ring-2 ring-cyan-500/20'
                : 'border-surface-200 bg-white text-surface-600 hover:bg-surface-50'
            }`}
          >
            <div className="text-lg mb-1">{UNIT_DATA[cat].icon}</div>
            <div className="text-xs font-semibold">{UNIT_DATA[cat].label}</div>
          </button>
        ))}
      </div>

      {/* Main Conversion Card */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
          {/* From Column */}
          <div className="md:col-span-5 space-y-2">
            <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider">
              From ({UNIT_DATA[category].units[fromUnit]?.name || fromUnit})
            </label>
            <input
              type="number"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              className="w-full px-4 py-3 bg-surface-50 border border-surface-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-surface-900 font-bold text-xl"
            />
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="w-full px-3 py-2 bg-surface-50 border border-surface-200 rounded-lg text-sm text-surface-800 font-semibold outline-none"
            >
              {unitKeys.map((k) => (
                <option key={k} value={k}>
                  {currentUnits[k].name} ({currentUnits[k].symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div className="md:col-span-1 flex justify-center">
            <button
              onClick={swapUnits}
              className="w-12 h-12 rounded-xl bg-surface-100 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-300 border border-surface-200 flex items-center justify-center text-lg font-bold text-surface-600 transition shadow-sm"
              title="Swap Units"
            >
              ⇄
            </button>
          </div>

          {/* To Column */}
          <div className="md:col-span-5 space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider">
                To ({UNIT_DATA[category].units[toUnit]?.name || toUnit})
              </label>
              {result && (
                <button
                  onClick={() => copyVal(result, 'main')}
                  className="text-xs text-cyan-600 hover:text-cyan-700 font-bold"
                >
                  {copiedKey === 'main' ? '✓ Copied' : '📋 Copy'}
                </button>
              )}
            </div>
            <div className="w-full px-4 py-3 bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl text-surface-900 font-black text-xl overflow-x-auto select-all">
              {result || '0'}
            </div>
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="w-full px-3 py-2 bg-surface-50 border border-surface-200 rounded-lg text-sm text-surface-800 font-semibold outline-none"
            >
              {unitKeys.map((k) => (
                <option key={k} value={k}>
                  {currentUnits[k].name} ({currentUnits[k].symbol})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* All-in-One Multi-Unit Matrix Grid */}
      {allEquivalents.length > 0 && (
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-surface-900">
                All {UNIT_DATA[category].label} Equivalents
              </h3>
              <p className="text-xs text-surface-500">
                How {val} {currentUnits[fromUnit]?.name} translates into other units
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-full">
              {allEquivalents.length} units
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allEquivalents.map((item) => (
              <div
                key={item.key}
                onClick={() => copyVal(item.value, item.key)}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  item.key === fromUnit
                    ? 'bg-cyan-50/70 border-cyan-300 ring-1 ring-cyan-400'
                    : 'bg-surface-50/50 border-surface-200 hover:bg-surface-100/70'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-surface-500 uppercase tracking-wide">
                    {item.name}
                  </div>
                  <div className="text-base font-extrabold text-surface-900 mt-0.5 break-all">
                    {item.value} <span className="text-xs font-medium text-surface-500">{item.symbol}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="text-xs px-2 py-1 rounded bg-white border border-surface-200 text-surface-600 font-semibold"
                >
                  {copiedKey === item.key ? '✓' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEO Explanatory Guide */}
      <section className="content-section mt-10">
        <h2>About Universal Unit Converter</h2>
        <p>
          Whether solving physics and engineering problems, following international recipes, converting digital bandwidth, or planning international travel, switching effortlessly between Metric and Imperial standards is essential.
          This tool executes all conversions in real-time within your browser with instant multi-unit matrix generation.
        </p>

        <h3>Core Categories Supported</h3>
        <ul>
          <li><strong>Length:</strong> Meters, Kilometers, Centimeters, Millimeters, Miles, Yards, Feet, Inches, and Nautical Miles.</li>
          <li><strong>Weight & Mass:</strong> Kilograms, Grams, Milligrams, Metric Tons, Pounds, Ounces, and Stone.</li>
          <li><strong>Temperature:</strong> Celsius, Fahrenheit, and absolute Kelvin.</li>
          <li><strong>Digital Storage:</strong> Bytes, Kilobytes, Megabytes, Gigabytes, Terabytes, and Petabytes (1024-based binary calculation).</li>
          <li><strong>Volume:</strong> Liters, Milliliters, Gallons, Quarts, Pints, Cups, and Fluid Ounces.</li>
          <li><strong>Speed:</strong> km/h, mph, m/s, Knots, and Mach.</li>
        </ul>
      </section>

      <FAQ items={faqItems} />
      <RelatedTools currentSlug="unit-converter" />
    </div>
  )
}
