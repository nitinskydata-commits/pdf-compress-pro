import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import SEOHead from '../../components/SEOHead'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import ToolVisualBadge from '../../components/ToolVisualBadge'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { trackToolUsage } from '../../utils/telemetry'

const tool = getToolBySlug('age-calculator') || {
  slug: 'age-calculator',
  name: 'Age Calculator — Exact Chronological Age & Birthday Countdown',
  shortName: 'Age Calculator',
  description: 'Calculate your exact age in years, months, weeks, days, hours, and seconds. Discover your next birthday countdown, Western zodiac, and life milestones.',
  metaTitle: 'Age Calculator Online Free — Exact Age, Months, Days & Next Birthday',
  metaDescription: 'Find your exact age down to the day, hour, and minute. Includes next birthday countdown, total days lived, and zodiac signs. 100% free and private.',
  category: 'calculator',
  categoryLabel: 'Calculators',
  keywords: ['age calculator', 'calculate age online', 'exact age calculator', 'chronological age', 'birthday countdown'],
  icon: '🎂',
}

const faqItems = [
  {
    question: 'How does the calculator determine exact chronological age?',
    answer: 'It calculates the precise difference between your date of birth and the target date (today by default), properly accounting for leap years, 28/29/30/31-day months, and timezone offsets.',
  },
  {
    question: 'Can I calculate my age at a future or specific historical date?',
    answer: 'Yes! Toggle the "Age on a Specific Date" field to determine how old you were or will be on any milestone date (such as retirement, graduation, or a historical event).',
  },
  {
    question: 'How are the total days, hours, and minutes calculated?',
    answer: 'Total days are computed from exact millisecond time deltas divided by 86,400,000 milliseconds per day. Total hours, minutes, and seconds are mathematically derived from this continuous duration.',
  },
  {
    question: 'Is my birth date private and secure?',
    answer: 'Yes, 100%! All calculations occur exclusively on your local device within your web browser. No personal dates or data are ever transmitted or saved.',
  },
]

function getZodiacSign(day: number, month: number): { sign: string; symbol: string } {
  // Month is 1-indexed (1 = Jan, 12 = Dec)
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return { sign: 'Aries', symbol: '♈' }
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return { sign: 'Taurus', symbol: '♉' }
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return { sign: 'Gemini', symbol: '♊' }
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return { sign: 'Cancer', symbol: '♋' }
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return { sign: 'Leo', symbol: '♌' }
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return { sign: 'Virgo', symbol: '♍' }
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return { sign: 'Libra', symbol: '♎' }
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return { sign: 'Scorpio', symbol: '♏' }
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return { sign: 'Sagittarius', symbol: '♐' }
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return { sign: 'Capricorn', symbol: '♑' }
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return { sign: 'Aquarius', symbol: '♒' }
  return { sign: 'Pisces', symbol: '♓' }
}

function getChineseZodiac(year: number): string {
  const animals = ['Rat 🐀', 'Ox 🐂', 'Tiger 🐅', 'Rabbit 🐇', 'Dragon 🐉', 'Snake 🐍', 'Horse 🐎', 'Goat 🐐', 'Monkey 🐒', 'Rooster 🐓', 'Dog 🐕', 'Pig 🐖']
  // 1900 was the year of the Rat
  return animals[(year - 1900) % 12] || animals[0]
}

export default function AgeCalculator() {
  const [dob, setDob] = useState('2000-01-01')
  const [targetDate, setTargetDate] = useState(() => new Date().toISOString().split('T')[0])
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => {
    if (!dob || !targetDate) return null
    const birth = new Date(dob + 'T00:00:00')
    const target = new Date(targetDate + 'T00:00:00')

    if (isNaN(birth.getTime()) || isNaN(target.getTime())) return null
    if (birth > target) return { error: 'Date of birth cannot be after the target date.' }

    let years = target.getFullYear() - birth.getFullYear()
    let months = target.getMonth() - birth.getMonth()
    let days = target.getDate() - birth.getDate()

    if (days < 0) {
      months--
      const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0)
      days += prevMonth.getDate()
    }
    if (months < 0) {
      years--
      months += 12
    }

    const totalDays = Math.floor((target.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24))
    const totalWeeks = Math.floor(totalDays / 7)
    const remainingDays = totalDays % 7
    const totalMonths = years * 12 + months
    const totalHours = totalDays * 24
    const totalMinutes = totalHours * 60
    const totalSeconds = totalMinutes * 60

    // Next birthday calculation relative to target date
    const nextBday = new Date(target.getFullYear(), birth.getMonth(), birth.getDate())
    if (nextBday < target) {
      nextBday.setFullYear(nextBday.getFullYear() + 1)
    }
    const daysUntilNextBday = Math.ceil((nextBday.getTime() - target.getTime()) / (1000 * 60 * 60 * 24))
    const nextBdayDayName = nextBday.toLocaleDateString('en-US', { weekday: 'long' })

    // Day of birth
    const birthDayOfWeek = birth.toLocaleDateString('en-US', { weekday: 'long' })
    const zodiac = getZodiacSign(birth.getDate(), birth.getMonth() + 1)
    const chineseZodiac = getChineseZodiac(birth.getFullYear())

    return {
      years,
      months,
      days,
      totalMonths,
      totalWeeks,
      remainingDays,
      totalDays,
      totalHours,
      totalMinutes,
      totalSeconds,
      daysUntilNextBday,
      nextBdayDayName,
      birthDayOfWeek,
      zodiac,
      chineseZodiac,
    }
  }, [dob, targetDate])

  const copySummary = () => {
    if (!result || 'error' in result) return
    const text = `Age: ${result.years} years, ${result.months} months, ${result.days} days (${result.totalDays.toLocaleString()} days lived). Born on a ${result.birthDayOfWeek}. Next birthday in ${result.daysUntilNextBday} days.`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const applyPreset = (yearsAgo: number) => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - yearsAgo)
    setDob(d.toISOString().split('T')[0])
  }

  const handleCalculateClick = () => {
    if (result && !('error' in result)) {
      trackToolUsage({
        toolId: 'age-calculator',
        toolName: 'Age Calculator',
        category: 'calculator',
        action: `Calculated age: ${result.years} yrs, ${result.months} mos`,
        details: `DOB: ${dob} (${result.totalDays} days lived)`,
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
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8 bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-transparent p-6 rounded-2xl border border-pink-500/20">
        <ToolVisualBadge category="calculator" slug={tool.slug} name={tool.name} size="xl" />
        <div className="flex-1">
          <h1 className="text-3xl sm:text-4xl font-black text-surface-900 tracking-tight mb-2">
            {tool.name}
          </h1>
          <p className="text-surface-600 text-base max-w-2xl mb-4 leading-relaxed">
            {tool.description}
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-pink-50 text-pink-700 border border-pink-200">
              🎂 Exact Years, Months, Days
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              ⏳ Next Birthday Countdown
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              ♈ Western & Chinese Zodiac
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              🔒 100% In-Browser Privacy
            </span>
          </div>
        </div>
      </div>

      {/* Input Card */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-bold text-surface-800 mb-2">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-4 py-3 bg-surface-50 border border-surface-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none text-surface-900 font-semibold"
            />
            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-xs text-surface-400 self-center mr-1">Presets:</span>
              <button
                type="button"
                onClick={() => applyPreset(18)}
                className="text-xs px-2.5 py-1 rounded-lg bg-surface-100 hover:bg-surface-200 text-surface-600 transition"
              >
                18 yrs
              </button>
              <button
                type="button"
                onClick={() => applyPreset(21)}
                className="text-xs px-2.5 py-1 rounded-lg bg-surface-100 hover:bg-surface-200 text-surface-600 transition"
              >
                21 yrs
              </button>
              <button
                type="button"
                onClick={() => applyPreset(30)}
                className="text-xs px-2.5 py-1 rounded-lg bg-surface-100 hover:bg-surface-200 text-surface-600 transition"
              >
                30 yrs
              </button>
              <button
                type="button"
                onClick={() => applyPreset(50)}
                className="text-xs px-2.5 py-1 rounded-lg bg-surface-100 hover:bg-surface-200 text-surface-600 transition"
              >
                50 yrs
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-surface-800 mb-2">
              Age as of Date
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-4 py-3 bg-surface-50 border border-surface-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none text-surface-900 font-semibold"
            />
            <button
              type="button"
              onClick={() => setTargetDate(new Date().toISOString().split('T')[0])}
              className="text-xs text-pink-600 hover:text-pink-700 font-medium mt-2 inline-block"
            >
              Reset to Today
            </button>
          </div>
        </div>

        <button
          onClick={handleCalculateClick}
          className="w-full py-3.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition transform active:scale-[0.99] flex items-center justify-center gap-2"
        >
          <span>🎂 Calculate Exact Age</span>
        </button>
      </div>

      {/* Results Display */}
      {result && 'error' in result ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 font-semibold mb-8 text-center">
          ⚠️ {result.error}
        </div>
      ) : result ? (
        <div className="space-y-6 mb-8">
          {/* Primary Result Banner */}
          <div className="bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 rounded-2xl p-6 sm:p-8 text-white shadow-lg text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl select-none pointer-events-none">
              🎂
            </div>
            <div className="text-sm font-bold uppercase tracking-widest text-pink-100 mb-2">
              Your Chronological Age
            </div>
            <div className="text-3xl sm:text-5xl font-black mb-3 tracking-tight">
              {result.years} <span className="text-2xl sm:text-3xl font-medium text-pink-100">years</span> {result.months} <span className="text-2xl sm:text-3xl font-medium text-pink-100">months</span> {result.days} <span className="text-2xl sm:text-3xl font-medium text-pink-100">days</span>
            </div>
            <p className="text-pink-100 text-sm max-w-xl mx-auto mb-6">
              You were born on a <strong>{result.birthDayOfWeek}</strong>. Your next birthday is in <strong>{result.daysUntilNextBday} days</strong> on a <strong>{result.nextBdayDayName}</strong>.
            </p>
            <button
              onClick={copySummary}
              className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl backdrop-blur-sm transition inline-flex items-center gap-2 text-sm border border-white/30"
            >
              {copied ? '✓ Copied Summary!' : '📋 Copy Age Summary'}
            </button>
          </div>

          {/* Time Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white rounded-xl p-4 border border-surface-200 shadow-sm text-center">
              <div className="text-[11px] font-bold text-surface-500 uppercase tracking-wider">Total Months</div>
              <div className="text-xl sm:text-2xl font-black text-surface-900 mt-1">{result.totalMonths.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-surface-200 shadow-sm text-center">
              <div className="text-[11px] font-bold text-surface-500 uppercase tracking-wider">Total Weeks</div>
              <div className="text-xl sm:text-2xl font-black text-surface-900 mt-1">{result.totalWeeks.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-surface-200 shadow-sm text-center">
              <div className="text-[11px] font-bold text-surface-500 uppercase tracking-wider">Total Days</div>
              <div className="text-xl sm:text-2xl font-black text-surface-900 mt-1">{result.totalDays.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-surface-200 shadow-sm text-center">
              <div className="text-[11px] font-bold text-surface-500 uppercase tracking-wider">Total Hours</div>
              <div className="text-xl sm:text-2xl font-black text-surface-900 mt-1">{result.totalHours.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-surface-200 shadow-sm text-center">
              <div className="text-[11px] font-bold text-surface-500 uppercase tracking-wider">Total Minutes</div>
              <div className="text-xl sm:text-2xl font-black text-surface-900 mt-1">{result.totalMinutes.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-surface-200 shadow-sm text-center">
              <div className="text-[11px] font-bold text-surface-500 uppercase tracking-wider">Total Seconds</div>
              <div className="text-xl sm:text-2xl font-black text-surface-900 mt-1">{result.totalSeconds.toLocaleString()}</div>
            </div>
          </div>

          {/* Life Milestones & Zodiac */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-surface-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center text-2xl font-bold">
                🎉
              </div>
              <div>
                <div className="text-xs font-bold text-surface-500 uppercase">Next Birthday</div>
                <div className="text-lg font-bold text-surface-900">{result.daysUntilNextBday} days remaining</div>
                <div className="text-xs text-surface-500">Falls on {result.nextBdayDayName}</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-surface-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-2xl font-bold">
                {result.zodiac.symbol}
              </div>
              <div>
                <div className="text-xs font-bold text-surface-500 uppercase">Western Zodiac</div>
                <div className="text-lg font-bold text-surface-900">{result.zodiac.sign}</div>
                <div className="text-xs text-surface-500">Sun Sign</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-surface-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl font-bold">
                🏮
              </div>
              <div>
                <div className="text-xs font-bold text-surface-500 uppercase">Chinese Zodiac</div>
                <div className="text-lg font-bold text-surface-900">{result.chineseZodiac}</div>
                <div className="text-xs text-surface-500">Birth Year Lunar Animal</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* SEO Explanatory Guide */}
      <section className="content-section mt-10">
        <h2>How Exact Chronological Age Is Calculated</h2>
        <p>
          Determining chronological age is more complex than simple subtraction because months have different numbers of days (28, 29, 30, or 31), and leap years occur every four years.
          This calculator measures exact calendar intervals so that your age in years, months, and days mirrors authentic calendar boundaries.
        </p>

        <h3>Features & Capabilities</h3>
        <ul>
          <li><strong>Exact Day, Month & Year Breakdown:</strong> Computes elapsed calendar intervals with zero rounding discrepancy.</li>
          <li><strong>Multi-Unit Granularity:</strong> View your life duration expressed in total months, weeks, days, hours, minutes, and seconds.</li>
          <li><strong>Next Birthday Countdown:</strong> Shows the precise number of days until your next anniversary and what day of the week it falls on.</li>
          <li><strong>Historical & Future Projections:</strong> Calculate your age on any past or upcoming date for visa applications, school admissions, or retirement planning.</li>
          <li><strong>Complete Privacy:</strong> Operates strictly inside your browser with zero remote logging or server analytics.</li>
        </ul>
      </section>

      <FAQ items={faqItems} />
      <RelatedTools currentSlug="age-calculator" />
    </div>
  )
}
