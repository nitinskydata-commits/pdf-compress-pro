import { useState } from 'react'
import SEOHead from '../../components/SEOHead'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import { getToolBySlug, SITE_URL } from '../../data/tools'

const tool = getToolBySlug('age-calculator')!
const faqItems = [
  { question: 'How accurate is this calculator?', answer: 'It calculates your exact age down to the day, accounting for leap years and varying month lengths.' },
  { question: 'Can I calculate age for any date?', answer: 'Yes! Enter any past or future date to calculate the difference from today.' },
]

function calcAge(birth: Date, today: Date) {
  let years = today.getFullYear() - birth.getFullYear()
  let months = today.getMonth() - birth.getMonth()
  let days = today.getDate() - birth.getDate()
  if (days < 0) { months--; const prev = new Date(today.getFullYear(), today.getMonth(), 0); days += prev.getDate() }
  if (months < 0) { years--; months += 12 }
  const totalDays = Math.floor((today.getTime() - birth.getTime()) / 86400000)
  const totalWeeks = Math.floor(totalDays / 7)
  const totalHours = totalDays * 24
  const nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate())
  if (nextBirthday <= today) nextBirthday.setFullYear(nextBirthday.getFullYear() + 1)
  const daysUntilBirthday = Math.ceil((nextBirthday.getTime() - today.getTime()) / 86400000)
  return { years, months, days, totalDays, totalWeeks, totalHours, daysUntilBirthday }
}

export default function AgeCalculator() {
  const [dob, setDob] = useState('')
  const [result, setResult] = useState<ReturnType<typeof calcAge> | null>(null)

  const calculate = () => {
    if (!dob) return
    const birth = new Date(dob); const today = new Date()
    if (birth > today) { alert('Date of birth cannot be in the future.'); return }
    setResult(calcAge(birth, today))
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <SEOHead title={tool.metaTitle} description={tool.metaDescription} canonical={`/${tool.slug}`} keywords={tool.keywords}
        structuredData={{ '@context': 'https://schema.org', '@type': 'WebApplication', name: tool.name, url: `${SITE_URL}/${tool.slug}`, description: tool.metaDescription, applicationCategory: 'UtilityApplication', operatingSystem: 'All', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }}
        faqData={faqItems} />
      <nav className="breadcrumb"><a href="/">Home</a><span className="separator">›</span><span>{tool.shortName}</span></nav>
      <h1 className="text-2xl md:text-3xl font-extrabold text-surface-800 mb-2">{tool.name}</h1>
      <p className="text-surface-500 mb-6">{tool.description}</p>

      <div className="card-premium p-6 space-y-4">
        <div><label className="block text-sm font-medium text-surface-700 mb-1">Date of Birth</label>
          <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full px-4 py-3 border border-surface-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" /></div>
        <button onClick={calculate} className="btn-primary w-full py-4">🎂 Calculate Age</button>
      </div>

      {result && (
        <div className="card-premium p-6 mt-6">
          <h3 className="text-xl font-bold text-surface-800 mb-4 text-center">Your Age</h3>
          <div className="text-center mb-6">
            <div className="text-4xl font-extrabold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">{result.years} years, {result.months} months, {result.days} days</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="result-card"><div className="text-xs text-surface-500">Total Days</div><div className="font-bold text-lg">{result.totalDays.toLocaleString()}</div></div>
            <div className="result-card"><div className="text-xs text-surface-500">Total Weeks</div><div className="font-bold text-lg">{result.totalWeeks.toLocaleString()}</div></div>
            <div className="result-card"><div className="text-xs text-surface-500">Total Hours</div><div className="font-bold text-lg">{result.totalHours.toLocaleString()}</div></div>
            <div className="result-card highlight"><div className="text-xs text-surface-500">Next Birthday</div><div className="font-bold text-lg">{result.daysUntilBirthday} days</div></div>
          </div>
        </div>
      )}

      <section className="content-section mt-8"><h2>How the Age Calculator Works</h2><p>Enter your date of birth and the calculator determines your exact age in years, months, and days. It accounts for leap years and varying month lengths. You'll also see your age in total days, weeks, hours, and a countdown to your next birthday.</p></section>
      <FAQ items={faqItems} /><RelatedTools currentSlug="age-calculator" />
    </div>
  )
}
