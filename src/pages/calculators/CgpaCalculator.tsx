import { useState, useEffect } from 'react'
import SEOHead from '../../components/SEOHead'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { trackToolUsage } from '../../utils/telemetry'

const tool = getToolBySlug('cgpa-calculator')!
const faqItems = [{ question: 'How is CGPA calculated?', answer: 'CGPA = Sum of (Grade Point × Credit Hours) / Total Credit Hours. Enter your courses, select grades, and the calculator does the rest.' }]

const gradeOptions = [
  { label: 'O / A+ (10)', value: 10 }, { label: 'A (9)', value: 9 }, { label: 'B+ (8)', value: 8 },
  { label: 'B (7)', value: 7 }, { label: 'C+ (6)', value: 6 }, { label: 'C (5)', value: 5 },
  { label: 'D (4)', value: 4 }, { label: 'F (0)', value: 0 },
]

export default function CgpaCalculator() {
  const [courses, setCourses] = useState([{ name: '', grade: 10, credits: 3 }, { name: '', grade: 9, credits: 3 }])

  const addCourse = () => setCourses(prev => [...prev, { name: '', grade: 10, credits: 3 }])
  const removeCourse = (i: number) => setCourses(prev => prev.filter((_, idx) => idx !== i))
  const updateCourse = (i: number, field: string, value: string | number) => {
    setCourses(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c))
  }

  const totalCredits = courses.reduce((s, c) => s + c.credits, 0)
  const weightedSum = courses.reduce((s, c) => s + c.grade * c.credits, 0)
  const cgpa = totalCredits > 0 ? (weightedSum / totalCredits) : 0

  useEffect(() => {
    if (totalCredits > 0) {
      trackToolUsage({
        toolId: 'cgpa-calculator',
        toolName: 'CGPA Calculator',
        category: 'calculator',
        action: `Calculated CGPA: ${cgpa.toFixed(2)}`,
        details: `${courses.length} courses (${totalCredits} credits)`,
        method: 'Client JS',
      })
    }
  }, [cgpa, totalCredits])

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <SEOHead title={tool.metaTitle} description={tool.metaDescription} canonical={`/${tool.slug}`} keywords={tool.keywords}
        structuredData={{ '@context': 'https://schema.org', '@type': 'WebApplication', name: tool.name, url: `${SITE_URL}/${tool.slug}`, description: tool.metaDescription, applicationCategory: 'UtilityApplication', operatingSystem: 'All', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }}
        faqData={faqItems} />
      <nav className="breadcrumb"><a href="/">Home</a><span className="separator">›</span><span>{tool.shortName}</span></nav>
      <h1 className="text-2xl md:text-3xl font-extrabold text-surface-800 mb-2">{tool.name}</h1>
      <p className="text-surface-500 mb-6">{tool.description}</p>

      <div className="card-premium p-6 space-y-3">
        {courses.map((c, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-4"><input placeholder={`Course ${i + 1}`} value={c.name} onChange={e => updateCourse(i, 'name', e.target.value)} className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm" /></div>
            <div className="col-span-4"><select value={c.grade} onChange={e => updateCourse(i, 'grade', Number(e.target.value))} className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm">{gradeOptions.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}</select></div>
            <div className="col-span-3"><input type="number" value={c.credits} onChange={e => updateCourse(i, 'credits', Number(e.target.value))} className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm" placeholder="Credits" /></div>
            <div className="col-span-1"><button onClick={() => removeCourse(i)} className="text-danger-500 text-sm">✕</button></div>
          </div>
        ))}
        <button onClick={addCourse} className="btn-secondary w-full">+ Add Course</button>
      </div>

      <div className="card-premium p-6 mt-6 text-center">
        <div className="text-xs text-surface-500 mb-1">Your CGPA</div>
        <div className="text-5xl font-extrabold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">{cgpa.toFixed(2)}</div>
        <p className="text-sm text-surface-500 mt-2">Total Credits: {totalCredits} | Weighted Sum: {weightedSum}</p>
      </div>

      <FAQ items={faqItems} /><RelatedTools currentSlug="cgpa-calculator" />
    </div>
  )
}
