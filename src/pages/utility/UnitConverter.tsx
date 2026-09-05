import { useState, useMemo } from 'react'
import SEOHead from '../../components/SEOHead'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import { getToolBySlug, SITE_URL } from '../../data/tools'

const tool = getToolBySlug('unit-converter')!

const faqItems = [
  { question: 'How accurate are these conversions?', answer: 'Conversions use standard international scientific conversion ratios with up to 6 decimal points of precision.' },
  { question: 'What categories are supported?', answer: 'Length, Weight/Mass, Temperature, Area, Speed, and Digital Storage.' },
  { question: 'How do digital storage conversions work?', answer: 'Digital storage uses standard binary units where 1 KB = 1,024 Bytes, 1 MB = 1,024 KB, and so on.' },
]

type Category = 'length' | 'weight' | 'temperature' | 'area' | 'speed' | 'storage'

interface UnitConfig {
  name: string
  toBase: (v: number) => number
  fromBase: (v: number) => number
}

const UNIT_DATA: Record<Category, { label: string; icon: string; units: Record<string, UnitConfig> }> = {
  length: {
    label: 'Length',
    icon: '📏',
    units: {
      m: { name: 'Meters (m)', toBase: v => v, fromBase: v => v },
      km: { name: 'Kilometers (km)', toBase: v => v * 1000, fromBase: v => v / 1000 },
      cm: { name: 'Centimeters (cm)', toBase: v => v * 0.01, fromBase: v => v / 0.01 },
      mm: { name: 'Millimeters (mm)', toBase: v => v * 0.001, fromBase: v => v / 0.001 },
      mi: { name: 'Miles (mi)', toBase: v => v * 1609.344, fromBase: v => v / 1609.344 },
      yd: { name: 'Yards (yd)', toBase: v => v * 0.9144, fromBase: v => v / 0.9144 },
      ft: { name: 'Feet (ft)', toBase: v => v * 0.3048, fromBase: v => v / 0.3048 },
      in: { name: 'Inches (in)', toBase: v => v * 0.0254, fromBase: v => v / 0.0254 },
    },
  },
  weight: {
    label: 'Weight & Mass',
    icon: '⚖️',
    units: {
      kg: { name: 'Kilograms (kg)', toBase: v => v, fromBase: v => v },
      g: { name: 'Grams (g)', toBase: v => v * 0.001, fromBase: v => v / 0.001 },
      mg: { name: 'Milligrams (mg)', toBase: v => v * 0.000001, fromBase: v => v / 0.000001 },
      lb: { name: 'Pounds (lb)', toBase: v => v * 0.45359237, fromBase: v => v / 0.45359237 },
      oz: { name: 'Ounces (oz)', toBase: v => v * 0.028349523, fromBase: v => v / 0.028349523 },
      ton: { name: 'Metric Tons (t)', toBase: v => v * 1000, fromBase: v => v / 1000 },
    },
  },
  temperature: {
    label: 'Temperature',
    icon: '🌡️',
    units: {
      c: { name: 'Celsius (°C)', toBase: v => v, fromBase: v => v },
      f: { name: 'Fahrenheit (°F)', toBase: v => ((v - 32) * 5) / 9, fromBase: v => (v * 9) / 5 + 32 },
      k: { name: 'Kelvin (K)', toBase: v => v - 273.15, fromBase: v => v + 273.15 },
    },
  },
  area: {
    label: 'Area',
    icon: '🗺️',
    units: {
      sqm: { name: 'Square Meters (m²)', toBase: v => v, fromBase: v => v },
      sqkm: { name: 'Square Kilometers (km²)', toBase: v => v * 1e6, fromBase: v => v / 1e6 },
      sqft: { name: 'Square Feet (ft²)', toBase: v => v * 0.092903, fromBase: v => v / 0.092903 },
      acre: { name: 'Acres (ac)', toBase: v => v * 4046.8564, fromBase: v => v / 4046.8564 },
      hectare: { name: 'Hectares (ha)', toBase: v => v * 10000, fromBase: v => v / 10000 },
    },
  },
  speed: {
    label: 'Speed',
    icon: '🚀',
    units: {
      kmh: { name: 'Kilometers per Hour (km/h)', toBase: v => v, fromBase: v => v },
      mph: { name: 'Miles per Hour (mph)', toBase: v => v * 1.609344, fromBase: v => v / 1.609344 },
      ms: { name: 'Meters per Second (m/s)', toBase: v => v * 3.6, fromBase: v => v / 3.6 },
      knot: { name: 'Knots (kn)', toBase: v => v * 1.852, fromBase: v => v / 1.852 },
    },
  },
  storage: {
    label: 'Digital Storage',
    icon: '💾',
    units: {
      b: { name: 'Bytes (B)', toBase: v => v, fromBase: v => v },
      kb: { name: 'Kilobytes (KB)', toBase: v => v * 1024, fromBase: v => v / 1024 },
      mb: { name: 'Megabytes (MB)', toBase: v => v * 1048576, fromBase: v => v / 1048576 },
      gb: { name: 'Gigabytes (GB)', toBase: v => v * 1073741824, fromBase: v => v / 1073741824 },
      tb: { name: 'Terabytes (TB)', toBase: v => v * 1099511627776, fromBase: v => v / 1099511627776 },
    },
  },
}

export default function UnitConverter() {
  const [category, setCategory] = useState<Category>('length')
  const [val, setVal] = useState<number | string>(1)
  const currentUnits = UNIT_DATA[category].units
  const unitKeys = Object.keys(currentUnits)

  const [fromUnit, setFromUnit] = useState<string>(unitKeys[0])
  const [toUnit, setToUnit] = useState<string>(unitKeys[1] || unitKeys[0])

  const handleCategoryChange = (cat: Category) => {
    setCategory(cat)
    const keys = Object.keys(UNIT_DATA[cat].units)
    setFromUnit(keys[0])
    setToUnit(keys[1] || keys[0])
  }

  const result = useMemo(() => {
    const num = typeof val === 'string' ? parseFloat(val) : val
    if (isNaN(num)) return ''
    const fromConfig = currentUnits[fromUnit]
    const toConfig = currentUnits[toUnit]
    if (!fromConfig || !toConfig) return ''

    const baseVal = fromConfig.toBase(num)
    const converted = toConfig.fromBase(baseVal)

    // Formatter
    return parseFloat(converted.toFixed(6)).toString()
  }, [val, fromUnit, toUnit, currentUnits])

  const swapUnits = () => {
    const temp = fromUnit
    setFromUnit(toUnit)
    setToUnit(temp)
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

      <nav className="breadcrumb">
        <a href="/">Home</a>
        <span className="separator">›</span>
        <span>{tool.shortName}</span>
      </nav>

      <h1 className="text-2xl md:text-3xl font-extrabold text-surface-800 mb-2">{tool.name}</h1>
      <p className="text-surface-500 mb-6">{tool.description}</p>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(Object.keys(UNIT_DATA) as Category[]).map((catKey) => {
          const cat = UNIT_DATA[catKey]
          const isSelected = category === catKey
          return (
            <button
              key={catKey}
              onClick={() => handleCategoryChange(catKey)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shadow-xs ${
                isSelected
                  ? 'bg-primary-600 text-white shadow-primary-200'
                  : 'bg-white border border-surface-200 text-surface-700 hover:bg-surface-50'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          )
        })}
      </div>

      {/* Conversion Interface */}
      <div className="card-premium p-6">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
          {/* From Unit */}
          <div className="md:col-span-3 space-y-2">
            <label className="text-xs font-semibold text-surface-500 uppercase tracking-wider">From</label>
            <input
              type="number"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder="Value"
              className="w-full px-4 py-3 border border-surface-300 rounded-xl focus:ring-2 focus:ring-primary-500 font-bold text-lg text-surface-800 outline-none"
            />
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="w-full px-3 py-2.5 border border-surface-200 rounded-xl bg-surface-50 text-sm font-medium text-surface-700 outline-none"
            >
              {Object.entries(currentUnits).map(([key, u]) => (
                <option key={key} value={key}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div className="md:col-span-1 flex justify-center py-2">
            <button
              onClick={swapUnits}
              className="w-10 h-10 rounded-full border border-surface-200 bg-white hover:bg-surface-100 flex items-center justify-center text-surface-700 transition shadow-xs hover:rotate-180 duration-300"
              title="Swap units"
            >
              ⇄
            </button>
          </div>

          {/* To Unit */}
          <div className="md:col-span-3 space-y-2">
            <label className="text-xs font-semibold text-surface-500 uppercase tracking-wider">To</label>
            <input
              type="text"
              readOnly
              value={result}
              placeholder="Result"
              className="w-full px-4 py-3 border border-surface-200 rounded-xl bg-surface-50 font-bold text-lg text-primary-600 outline-none"
            />
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="w-full px-3 py-2.5 border border-surface-200 rounded-xl bg-surface-50 text-sm font-medium text-surface-700 outline-none"
            >
              {Object.entries(currentUnits).map(([key, u]) => (
                <option key={key} value={key}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Live summary phrase */}
        {result !== '' && (
          <div className="mt-6 p-4 bg-primary-50 rounded-xl text-center border border-primary-100">
            <span className="text-sm font-semibold text-primary-900">
              {val} {currentUnits[fromUnit]?.name} = <strong className="text-primary-600 text-lg">{result}</strong> {currentUnits[toUnit]?.name}
            </span>
          </div>
        )}
      </div>

      <section className="content-section mt-10">
        <h2>About Free Online Multi-Unit Converter</h2>
        <p>
          Need fast, reliable measurements for engineering, homework, cooking, or international travel?
          This multi-unit converter handles length, mass, temperature, area, speed, and digital memory storage with instant two-way conversions.
        </p>
      </section>

      <FAQ items={faqItems} />
      <RelatedTools currentSlug="unit-converter" />
    </div>
  )
}
