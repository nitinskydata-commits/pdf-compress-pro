import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import SEOHead from '../../components/SEOHead'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import ToolVisualBadge from '../../components/ToolVisualBadge'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { trackToolUsage } from '../../utils/telemetry'

const tool = getToolBySlug('date-difference-calculator') || {
  slug: 'date-difference-calculator',
  name: 'Date Difference Calculator — Days, Weeks & Business Days Between Dates',
  shortName: 'Date Difference',
  description: 'Calculate the exact number of days, months, years, and business days between any two dates with leap-year accuracy and weekend exclusion options.',
  metaTitle: 'Date Difference Calculator Online Free — Days & Business Days Between Dates',
  metaDescription: 'Calculate the exact duration between two dates. Get total days, business days, weeks, months, and hours with leap-year precision. 100% free and private.',
  category: 'calculator',
  categoryLabel: 'Calculators',
  keywords: ['date difference calculator', 'days between dates', 'business days calculator', 'calculate days between two dates', 'work days calculator'],
  icon: '📅',
}

const faqItems = [
  {
    question: 'How are business days calculated?',
    answer: 'Business days count only weekdays (Monday through Friday) while excluding Saturdays and Sundays between your chosen start and end dates.',
  },
  {
    question: 'Does the calculator account for leap years?',
    answer: 'Yes! All calculations use JavaScript Date objects and Gregorian calendar algorithms that accurately account for leap years (including century leap year exceptions) and varying month lengths.',
  },
  {
    question: 'What does "Include end date" do?',
    answer: 'By default, date difference calculations measure elapsed full days from start date to end date (e.g., Monday to Tuesday is 1 day). Checking "Include end date" treats the range as inclusive of both boundary dates (counting 2 days).',
  },
  {
    question: 'Is my date information private?',
    answer: 'Yes, 100%! All calendar math runs completely in your web browser. No dates or logs are ever transmitted to any server.',
  },
]

export default function DateDifference() {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])
  const [date1, setDate1] = useState(todayStr)
  const [date2, setDate2] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().split('T')[0]
  })
  const [includeEndDate, setIncludeEndDate] = useState(false)
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => {
    if (!date1 || !date2) return null
    const d1 = new Date(date1 + 'T00:00:00')
    const d2 = new Date(date2 + 'T00:00:00')

    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null

    const isReversed = d1 > d2
    const start = isReversed ? d2 : d1
    const end = isReversed ? d1 : d2

    let diffMs = end.getTime() - start.getTime()
    if (includeEndDate) {
      diffMs += 86400000
    }

    const totalDays = Math.max(0, Math.floor(diffMs / 86400000))
    const totalWeeks = Math.floor(totalDays / 7)
    const remainingDays = totalDays % 7

    // Breakdown into Years, Months, Days
    let years = end.getFullYear() - start.getFullYear()
    let months = end.getMonth() - start.getMonth()
    let days = end.getDate() - start.getDate()
    if (includeEndDate) days += 1

    if (days < 0) {
      months--
      const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0)
      days += prevMonth.getDate()
    }
    if (months < 0) {
      years--
      months += 12
    }

    // Business days vs weekend days
    let businessDays = 0
    let weekendDays = 0
    const cur = new Date(start)
    const targetEnd = new Date(end)
    if (includeEndDate) {
      targetEnd.setDate(targetEnd.getDate() + 1)
    }

    while (cur < targetEnd) {
      const dayOfWeek = cur.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendDays++
      } else {
        businessDays++
      }
      cur.setDate(cur.getDate() + 1)
    }

    const hours = totalDays * 24
    const minutes = hours * 60
    const seconds = minutes * 60

    return {
      years,
      months,
      days,
      totalDays,
      totalWeeks,
      remainingDays,
      businessDays,
      weekendDays,
      hours,
      minutes,
      seconds,
      isReversed,
      formattedStart: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      formattedEnd: end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }
  }, [date1, date2, includeEndDate])

  const copySummary = () => {
    if (!result) return
    const text = `Date Difference: ${result.totalDays.toLocaleString()} days (${result.years} years, ${result.months} months, ${result.days} days). Business days: ${result.businessDays}, Weekends: ${result.weekendDays}.`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const applyPreset = (daysAhead: number) => {
    const d = new Date()
    setDate1(d.toISOString().split('T')[0])
    d.setDate(d.getDate() + daysAhead)
    setDate2(d.toISOString().split('T')[0])
  }

  const setYearEnd = () => {
    const d1 = new Date()
    const d2 = new Date(d1.getFullYear(), 11, 31)
    setDate1(d1.toISOString().split('T')[0])
    setDate2(d2.toISOString().split('T')[0])
  }

  const handleCalculateUsage = () => {
    if (result) {
      trackToolUsage({
        toolId: 'date-difference-calculator',
        toolName: 'Date Difference Calculator',
        category: 'calculator',
        action: `Calculated date difference: ${result.totalDays} days`,
        details: `From ${date1} to ${date2} (business days: ${result.businessDays})`,
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
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8 bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-transparent p-6 rounded-2xl border border-sky-500/20">
        <ToolVisualBadge category="calculator" slug={tool.slug} name={tool.name} size="xl" />
        <div className="flex-1">
          <h1 className="text-3xl sm:text-4xl font-black text-surface-900 tracking-tight mb-2">
            {tool.name}
          </h1>
          <p className="text-surface-600 text-base max-w-2xl mb-4 leading-relaxed">
            {tool.description}
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
              📅 Total & Working Days
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              ⚡ Gregorian Leap Precision
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              🔒 100% In-Browser Privacy
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              💼 Weekend Isolation
            </span>
          </div>
        </div>
      </div>

      {/* Main Inputs Card */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-surface-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={date1}
              onChange={(e) => setDate1(e.target.value)}
              className="w-full px-4 py-3 bg-surface-50 border border-surface-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-surface-900 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-surface-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={date2}
              onChange={(e) => setDate2(e.target.value)}
              className="w-full px-4 py-3 bg-surface-50 border border-surface-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-surface-900 font-bold"
            />
          </div>
        </div>

        {/* Options & Presets */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-surface-100">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-surface-700 select-none">
            <input
              type="checkbox"
              checked={includeEndDate}
              onChange={(e) => setIncludeEndDate(e.target.checked)}
              className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
            />
            <span>Include end date in calculation (+1 day)</span>
          </label>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-surface-400 font-medium mr-1">Quick:</span>
            <button
              onClick={() => applyPreset(30)}
              className="text-xs px-2.5 py-1 rounded-lg bg-surface-100 hover:bg-surface-200 text-surface-600 transition"
            >
              +30 Days
            </button>
            <button
              onClick={() => applyPreset(90)}
              className="text-xs px-2.5 py-1 rounded-lg bg-surface-100 hover:bg-surface-200 text-surface-600 transition"
            >
              +90 Days
            </button>
            <button
              onClick={() => applyPreset(180)}
              className="text-xs px-2.5 py-1 rounded-lg bg-surface-100 hover:bg-surface-200 text-surface-600 transition"
            >
              +6 Months
            </button>
            <button
              onClick={setYearEnd}
              className="text-xs px-2.5 py-1 rounded-lg bg-surface-100 hover:bg-surface-200 text-surface-600 transition"
            >
              To Year End
            </button>
          </div>
        </div>
      </div>

      {/* Results Display */}
      {result && (
        <div className="space-y-6 mb-8">
          {/* Highlight Banner */}
          <div className="bg-gradient-to-br from-sky-500 via-indigo-600 to-blue-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg text-center relative overflow-hidden">
            <div className="text-xs font-bold uppercase tracking-widest text-sky-100 mb-2">
              Time Elapsed Between {result.formattedStart} and {result.formattedEnd}
            </div>
            <div className="text-4xl sm:text-5xl font-black mb-3 tracking-tight">
              {result.totalDays.toLocaleString()} <span className="text-2xl sm:text-3xl font-medium text-sky-100">Days</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-sky-100 mb-4">
              Equivalent to {result.years} years, {result.months} months, {result.days} days
            </div>
            <button
              onClick={() => {
                copySummary()
                handleCalculateUsage()
              }}
              className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl backdrop-blur-sm transition inline-flex items-center gap-2 text-sm border border-white/30"
            >
              {copied ? '✓ Copied Summary!' : '📋 Copy Results'}
            </button>
          </div>

          {/* Business vs Weekend Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-surface-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-bold">
                💼
              </div>
              <div>
                <div className="text-xs font-bold text-surface-500 uppercase">Working Days (Mon - Fri)</div>
                <div className="text-2xl font-black text-surface-900">{result.businessDays.toLocaleString()} days</div>
                <div className="text-xs text-surface-500">Excludes standard weekend days</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-surface-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl font-bold">
                🏖️
              </div>
              <div>
                <div className="text-xs font-bold text-surface-500 uppercase">Weekend Days (Sat & Sun)</div>
                <div className="text-2xl font-black text-surface-900">{result.weekendDays.toLocaleString()} days</div>
                <div className="text-xs text-surface-500">Saturdays and Sundays in range</div>
              </div>
            </div>
          </div>

          {/* Alternative Units Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl p-4 border border-surface-200 shadow-sm text-center">
              <div className="text-[11px] font-bold text-surface-500 uppercase tracking-wider">Total Weeks</div>
              <div className="text-xl sm:text-2xl font-black text-surface-900 mt-1">
                {result.totalWeeks.toLocaleString()} <span className="text-xs font-medium text-surface-400">wks + {result.remainingDays}d</span>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-surface-200 shadow-sm text-center">
              <div className="text-[11px] font-bold text-surface-500 uppercase tracking-wider">Total Hours</div>
              <div className="text-xl sm:text-2xl font-black text-surface-900 mt-1">{result.hours.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-surface-200 shadow-sm text-center">
              <div className="text-[11px] font-bold text-surface-500 uppercase tracking-wider">Total Minutes</div>
              <div className="text-xl sm:text-2xl font-black text-surface-900 mt-1">{result.minutes.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-surface-200 shadow-sm text-center">
              <div className="text-[11px] font-bold text-surface-500 uppercase tracking-wider">Total Seconds</div>
              <div className="text-xl sm:text-2xl font-black text-surface-900 mt-1">{result.seconds.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* SEO Explanatory Guide */}
      <section className="content-section mt-10">
        <h2>How to Calculate Days Between Two Dates</h2>
        <p>
          Determining the exact interval between two calendar dates is essential for contract deadlines, project milestone tracking, interest computation, visa stay compliance, and vacation planning.
        </p>

        <h3>Features & Mathematical Precision</h3>
        <ul>
          <li><strong>Leap Year Handling:</strong> Accounts for February 29th across all leap years without date drifting.</li>
          <li><strong>Working Days vs Weekends:</strong> Accurately isolates business days (Monday to Friday) from weekends.</li>
          <li><strong>Boundary Control:</strong> Toggle whether the end date itself is counted in the total duration.</li>
          <li><strong>Multi-Unit Outputs:</strong> Inspect elapsed time in total days, weeks, months, hours, and minutes.</li>
        </ul>
      </section>

      <FAQ items={faqItems} />
      <RelatedTools currentSlug="date-difference-calculator" />
    </div>
  )
}
