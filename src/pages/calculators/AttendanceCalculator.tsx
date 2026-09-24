import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import SEOHead from '../../components/SEOHead'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import ToolVisualBadge from '../../components/ToolVisualBadge'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { trackToolUsage } from '../../utils/telemetry'

const tool = getToolBySlug('attendance-calculator') || {
  slug: 'attendance-calculator',
  name: 'Attendance Calculator — 75% Rule & Safe Bunk Planner',
  shortName: 'Attendance Calculator',
  description: 'Calculate your college attendance percentage, find out how many classes you can safely skip, or calculate how many consecutive lectures you must attend to hit 75%.',
  metaTitle: 'Attendance Calculator Online Free — 75% Attendance & Bunk Predictor',
  metaDescription: 'Calculate college attendance percentage and find out how many classes you can skip or need to attend to maintain 75% or 85% attendance. 100% free and private.',
  category: 'calculator',
  categoryLabel: 'Calculators',
  keywords: ['attendance calculator', '75 percent attendance calculator', 'bunk calculator', 'college attendance planner', 'how many classes can i skip'],
  icon: '📋',
}

const faqItems = [
  {
    question: 'How is attendance percentage calculated?',
    answer: 'Attendance Percentage = (Classes Attended ÷ Total Classes Conducted) × 100.',
  },
  {
    question: 'How is the safe skip (bunk) count calculated?',
    answer: 'If your current attendance is above your target percentage T, the number of future classes you can miss is given by: Safe Skips = Math.floor([Attended ÷ (T / 100)] - Total Classes).',
  },
  {
    question: 'How many classes do I need to attend if I am below 75%?',
    answer: 'If your attendance is below your target T%, the number of consecutive upcoming classes you must attend without missing is: Needed = Math.ceil([(T × Total Classes) - (100 × Attended)] ÷ (100 - T)).',
  },
  {
    question: 'Is my student attendance record kept private?',
    answer: 'Yes, 100%! All calculations run locally in your web browser. No attendance figures or student details are ever sent to any remote server.',
  },
]

export default function AttendanceCalculator() {
  const [attended, setAttended] = useState('38')
  const [total, setTotal] = useState('45')
  const [target, setTarget] = useState('75')
  const [copied, setCopied] = useState(false)

  // What-if simulator state
  const [simulateAttend, setSimulateAttend] = useState('5')
  const [simulateMiss, setSimulateMiss] = useState('1')

  const result = useMemo(() => {
    const a = parseInt(attended, 10)
    const t = parseInt(total, 10)
    const tgt = parseFloat(target)

    if (isNaN(a) || isNaN(t) || isNaN(tgt) || t <= 0 || a < 0 || a > t) return null

    const currentPct = (a / t) * 100
    const meetsTarget = currentPct >= tgt

    // Safe skips if above target
    const canSkip = meetsTarget
      ? Math.max(0, Math.floor(a / (tgt / 100) - t))
      : 0

    // Consecutive classes needed to attend if below target
    const needAttend = !meetsTarget && tgt < 100
      ? Math.max(0, Math.ceil((tgt * t - 100 * a) / (100 - tgt)))
      : 0

    // Simulated outcome
    const simA = parseInt(simulateAttend, 10) || 0
    const simM = parseInt(simulateMiss, 10) || 0
    const projectedAttended = a + simA
    const projectedTotal = t + simA + simM
    const projectedPct = projectedTotal > 0 ? (projectedAttended / projectedTotal) * 100 : currentPct

    return {
      currentPct,
      meetsTarget,
      canSkip,
      needAttend,
      projectedPct,
      projectedAttended,
      projectedTotal,
    }
  }, [attended, total, target, simulateAttend, simulateMiss])

  const copySummary = () => {
    if (!result) return
    const statusText = result.meetsTarget
      ? `Current Attendance: ${result.currentPct.toFixed(1)}% (Target: ${target}%). You can safely skip ${result.canSkip} more classes.`
      : `Current Attendance: ${result.currentPct.toFixed(1)}% (Target: ${target}%). You must attend ${result.needAttend} consecutive classes to reach ${target}%.`
    navigator.clipboard.writeText(statusText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCalculateUsage = () => {
    if (result) {
      trackToolUsage({
        toolId: 'attendance-calculator',
        toolName: 'Attendance Calculator',
        category: 'calculator',
        action: `Calculated attendance: ${result.currentPct.toFixed(1)}%`,
        details: `${attended}/${total} classes (target: ${target}%)`,
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
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent p-6 rounded-2xl border border-emerald-500/20">
        <ToolVisualBadge category="calculator" slug={tool.slug} name={tool.name} size="xl" />
        <div className="flex-1">
          <h1 className="text-3xl sm:text-4xl font-black text-surface-900 tracking-tight mb-2">
            {tool.name}
          </h1>
          <p className="text-surface-600 text-base max-w-2xl mb-4 leading-relaxed">
            {tool.description}
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              📊 75% & 85% Rule Planning
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              🛌 Safe Skip (Bunk) Predictor
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              🚀 Recovery Catch-Up Tracker
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              🔒 100% In-Browser Privacy
            </span>
          </div>
        </div>
      </div>

      {/* Main Inputs Card */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-surface-700 mb-2">
              Classes Attended <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              value={attended}
              onChange={(e) => setAttended(e.target.value)}
              className="w-full px-4 py-3 bg-surface-50 border border-surface-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-surface-900 font-bold text-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-surface-700 mb-2">
              Total Classes Conducted <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              className="w-full px-4 py-3 bg-surface-50 border border-surface-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-surface-900 font-bold text-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-surface-700 mb-2">
              Target Attendance Requirement (%)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full px-4 py-3 bg-surface-50 border border-surface-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-surface-900 font-bold text-lg"
            />
          </div>
        </div>

        {/* Target Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-surface-100">
          <span className="text-xs text-surface-400 font-medium mr-1">Target Presets:</span>
          {['70', '75', '80', '85', '90'].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setTarget(preset)}
              className={`text-xs px-3 py-1 rounded-lg border font-semibold transition ${
                target === preset
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                  : 'bg-surface-50 text-surface-600 border-surface-200 hover:bg-surface-100'
              }`}
            >
              {preset}%
            </button>
          ))}
        </div>
      </div>

      {/* Results Workspace */}
      {result ? (
        <div className="space-y-6 mb-8">
          {/* Primary Status Card */}
          <div
            className={`rounded-2xl p-6 sm:p-8 text-white shadow-lg text-center relative overflow-hidden ${
              result.meetsTarget
                ? 'bg-gradient-to-br from-emerald-500 via-teal-600 to-green-700'
                : 'bg-gradient-to-br from-amber-500 via-rose-600 to-red-600'
            }`}
          >
            <div className="text-xs font-bold uppercase tracking-widest text-white/80 mb-2">
              Current Attendance Rate
            </div>
            <div className="text-5xl sm:text-6xl font-black mb-3 tracking-tight">
              {result.currentPct.toFixed(1)}%
            </div>
            <div className="text-lg font-bold text-white/95 mb-4">
              {result.meetsTarget
                ? `✅ You are safely above your ${target}% requirement!`
                : `⚠️ You are currently below your ${target}% threshold.`}
            </div>

            {/* Strategic Advice */}
            <div className="max-w-xl mx-auto bg-black/15 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-sm leading-relaxed mb-6 font-medium">
              {result.meetsTarget ? (
                result.canSkip > 0 ? (
                  <span>
                    🎉 You can safely miss <strong>{result.canSkip} more {result.canSkip === 1 ? 'class' : 'classes'}</strong> and your attendance will still stay at or above <strong>{target}%</strong>!
                  </span>
                ) : (
                  <span>
                    ⚡ You are currently exactly on target. If you miss your next class, your attendance will drop below <strong>{target}%</strong>.
                  </span>
                )
              ) : (
                <span>
                  🚨 You must attend the next <strong>{result.needAttend} consecutive {result.needAttend === 1 ? 'class' : 'classes'}</strong> without missing any to restore your attendance to <strong>{target}%</strong>.
                </span>
              )}
            </div>

            <button
              onClick={() => {
                copySummary()
                handleCalculateUsage()
              }}
              className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl backdrop-blur-sm transition inline-flex items-center gap-2 text-sm border border-white/30"
            >
              {copied ? '✓ Copied Summary!' : '📋 Copy Attendance Report'}
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-surface-200 shadow-sm text-center">
              <div className="text-[11px] font-bold text-surface-500 uppercase tracking-wider">Attended</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{attended}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-surface-200 shadow-sm text-center">
              <div className="text-[11px] font-bold text-surface-500 uppercase tracking-wider">Conducted</div>
              <div className="text-2xl font-black text-surface-900 mt-1">{total}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-surface-200 shadow-sm text-center">
              <div className="text-[11px] font-bold text-surface-500 uppercase tracking-wider">Safe Skips</div>
              <div className="text-2xl font-black text-teal-600 mt-1">{result.canSkip}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-surface-200 shadow-sm text-center">
              <div className="text-[11px] font-bold text-surface-500 uppercase tracking-wider">Classes Needed</div>
              <div className="text-2xl font-black text-amber-600 mt-1">{result.needAttend}</div>
            </div>
          </div>

          {/* What-If Simulator */}
          <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-surface-900 mb-1">Interactive "What-If" Projection Simulator</h3>
            <p className="text-xs text-surface-500 mb-4">See how attending or missing future lectures affects your overall percentage</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div>
                <label className="block text-xs font-bold text-surface-600 uppercase mb-1">If I attend next</label>
                <input
                  type="number"
                  min="0"
                  value={simulateAttend}
                  onChange={(e) => setSimulateAttend(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-50 border border-surface-300 rounded-lg text-sm font-bold text-surface-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-surface-600 uppercase mb-1">And miss next</label>
                <input
                  type="number"
                  min="0"
                  value={simulateMiss}
                  onChange={(e) => setSimulateMiss(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-50 border border-surface-300 rounded-lg text-sm font-bold text-surface-900"
                />
              </div>

              <div className="p-3 bg-surface-50 rounded-xl border border-surface-200 text-center">
                <div className="text-xs font-bold text-surface-500 uppercase">Projected Attendance</div>
                <div className="text-2xl font-black text-surface-900 mt-0.5">
                  {result.projectedPct.toFixed(1)}%
                </div>
                <div className="text-[11px] text-surface-500">
                  ({result.projectedAttended} of {result.projectedTotal} classes)
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* SEO Explanatory Guide */}
      <section className="content-section mt-10">
        <h2>About College Attendance & The 75% Rule</h2>
        <p>
          Most universities, engineering colleges, and medical faculties enforce mandatory minimum attendance thresholds (commonly 75% or 80%) as an eligibility criterion for semester end-term examinations.
          Falling below this requirement can lead to detentions, hall ticket debarment, or costly supplementary coursework.
        </p>

        <h3>Why Active Attendance Planning Saves Your Semester</h3>
        <ul>
          <li><strong>Prevent Detentions:</strong> Know your safety buffer well before exam registration deadlines.</li>
          <li><strong>Recovery Planning:</strong> Exactly determine how many uninterrupted lectures you must attend to return to good standing.</li>
          <li><strong>Interactive What-If Testing:</strong> Anticipate medical leaves, family functions, or exam prep weeks before taking time off.</li>
        </ul>
      </section>

      <FAQ items={faqItems} />
      <RelatedTools currentSlug="attendance-calculator" />
    </div>
  )
}
