import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SEOHead from '../../components/SEOHead'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import ToolVisualBadge from '../../components/ToolVisualBadge'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { trackToolUsage } from '../../utils/telemetry'

const tool = getToolBySlug('cgpa-calculator') || {
  slug: 'cgpa-calculator',
  name: 'CGPA & GPA Calculator — Semester & Cumulative Grade Point Solver',
  shortName: 'CGPA Calculator',
  description: 'Calculate semester GPA and cumulative CGPA across 10.0 and 4.0 grading scales with weighted credit hours, academic honors, and percentage conversion formulas.',
  metaTitle: 'CGPA & GPA Calculator Online Free — 10.0 & 4.0 Grade Point Average',
  metaDescription: 'Calculate your college CGPA and semester GPA online. Supports 10.0 and 4.0 scales with weighted credits, percentage conversions, and academic classification.',
  category: 'calculator',
  categoryLabel: 'Calculators',
  keywords: ['cgpa calculator', 'gpa calculator online', 'calculate cgpa to percentage', 'college gpa solver', 'semester grade point calculator'],
  icon: '🎓',
}

const faqItems = [
  {
    question: 'How is CGPA calculated?',
    answer: 'CGPA (Cumulative Grade Point Average) is calculated as the sum of (Grade Point × Course Credit Hours) divided by the Total Credit Hours: CGPA = Σ(GP × Credits) ÷ Σ(Credits).',
  },
  {
    question: 'How do you convert CGPA to percentage?',
    answer: 'Under standard university conventions (such as CBSE/AICTE/VTU in India), CGPA on a 10.0 scale is converted to percentage using the formula: Percentage = CGPA × 9.5 (or in some universities: (CGPA - 0.75) × 10). On a 4.0 scale, Percentage = (GPA ÷ 4.0) × 100.',
  },
  {
    question: 'What is the difference between GPA and CGPA?',
    answer: 'GPA typically refers to performance in a single academic term or semester (SGPA), while CGPA reflects the cumulative, overall performance across all completed semesters in your degree.',
  },
  {
    question: 'Is my student grade data private and confidential?',
    answer: 'Yes, 100%! All calculations run locally in your web browser. No course titles, grades, or transcripts are ever stored or transmitted.',
  },
]

type ScaleType = '10' | '4'

interface CourseItem {
  id: string
  name: string
  grade: number
  credits: number
}

const scale10Grades = [
  { label: 'O / A+ (Outstanding - 10)', value: 10 },
  { label: 'A (Excellent - 9)', value: 9 },
  { label: 'B+ (Very Good - 8)', value: 8 },
  { label: 'B (Good - 7)', value: 7 },
  { label: 'C+ (Above Average - 6)', value: 6 },
  { label: 'C (Average - 5)', value: 5 },
  { label: 'D / P (Pass - 4)', value: 4 },
  { label: 'F (Fail - 0)', value: 0 },
]

const scale4Grades = [
  { label: 'A (4.0)', value: 4.0 },
  { label: 'A- (3.7)', value: 3.7 },
  { label: 'B+ (3.3)', value: 3.3 },
  { label: 'B (3.0)', value: 3.0 },
  { label: 'B- (2.7)', value: 2.7 },
  { label: 'C+ (2.3)', value: 2.3 },
  { label: 'C (2.0)', value: 2.0 },
  { label: 'C- (1.7)', value: 1.7 },
  { label: 'D+ (1.3)', value: 1.3 },
  { label: 'D (1.0)', value: 1.0 },
  { label: 'F (0.0)', value: 0.0 },
]

const initialCourses10: CourseItem[] = [
  { id: '1', name: 'Data Structures & Algorithms', grade: 10, credits: 4 },
  { id: '2', name: 'Database Management Systems', grade: 9, credits: 4 },
  { id: '3', name: 'Computer Networks', grade: 8, credits: 3 },
  { id: '4', name: 'Operating Systems', grade: 9, credits: 3 },
  { id: '5', name: 'Software Engineering Lab', grade: 10, credits: 2 },
]

export default function CgpaCalculator() {
  const [scale, setScale] = useState<ScaleType>('10')
  const [courses, setCourses] = useState<CourseItem[]>(initialCourses10)
  const [copied, setCopied] = useState(false)

  const gradeOptions = scale === '10' ? scale10Grades : scale4Grades

  const addCourse = () => {
    const defaultGrade = scale === '10' ? 10 : 4.0
    setCourses((prev) => [
      ...prev,
      { id: Date.now().toString(), name: '', grade: defaultGrade, credits: 3 },
    ])
  }

  const removeCourse = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id))
  }

  const updateCourse = (id: string, field: keyof CourseItem, value: string | number) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    )
  }

  const switchScale = (newScale: ScaleType) => {
    setScale(newScale)
    const defaultGrade = newScale === '10' ? 10 : 4.0
    setCourses((prev) =>
      prev.map((c) => ({
        ...c,
        grade: defaultGrade,
      }))
    )
  }

  const stats = useMemo(() => {
    const totalCredits = courses.reduce((acc, c) => acc + (Number(c.credits) || 0), 0)
    const weightedPoints = courses.reduce((acc, c) => acc + c.grade * (Number(c.credits) || 0), 0)
    const cgpa = totalCredits > 0 ? weightedPoints / totalCredits : 0

    // Equivalent percentage
    let percentage = 0
    if (scale === '10') {
      percentage = Math.min(100, Math.max(0, cgpa * 9.5))
    } else {
      percentage = Math.min(100, Math.max(0, (cgpa / 4.0) * 100))
    }

    // Academic Honor
    let classification = 'Pass'
    let badgeColor = 'bg-blue-100 text-blue-800'
    if (scale === '10') {
      if (cgpa >= 9.0) {
        classification = 'First Class with Distinction / Honors 🏆'
        badgeColor = 'bg-emerald-100 text-emerald-800'
      } else if (cgpa >= 7.5) {
        classification = 'First Class ⭐'
        badgeColor = 'bg-blue-100 text-blue-800'
      } else if (cgpa >= 6.0) {
        classification = 'Second Class'
        badgeColor = 'bg-amber-100 text-amber-800'
      } else if (cgpa < 4.0) {
        classification = 'Remedial / Academic Concern ⚠️'
        badgeColor = 'bg-red-100 text-red-800'
      }
    } else {
      if (cgpa >= 3.8) {
        classification = "Summa Cum Laude / Dean's List 🏆"
        badgeColor = 'bg-emerald-100 text-emerald-800'
      } else if (cgpa >= 3.5) {
        classification = 'Magna Cum Laude ⭐'
        badgeColor = 'bg-blue-100 text-blue-800'
      } else if (cgpa >= 3.0) {
        classification = 'Cum Laude'
        badgeColor = 'bg-amber-100 text-amber-800'
      } else if (cgpa < 2.0) {
        classification = 'Academic Probation ⚠️'
        badgeColor = 'bg-red-100 text-red-800'
      }
    }

    return {
      totalCredits,
      weightedPoints,
      cgpa,
      percentage,
      classification,
      badgeColor,
    }
  }, [courses, scale])

  useEffect(() => {
    if (stats.totalCredits > 0) {
      const timer = setTimeout(() => {
        trackToolUsage({
          toolId: 'cgpa-calculator',
          toolName: 'CGPA Calculator',
          category: 'calculator',
          action: `Calculated ${scale}.0 scale CGPA: ${stats.cgpa.toFixed(2)}`,
          details: `${courses.length} courses (${stats.totalCredits} credits)`,
          method: 'Client JS',
        })
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [stats.cgpa, stats.totalCredits, scale, courses.length])

  const copySummary = () => {
    const text = `CGPA: ${stats.cgpa.toFixed(2)} / ${scale}.0 (${stats.classification}). Approx. Percentage: ${stats.percentage.toFixed(1)}%. Total Credits: ${stats.totalCredits}.`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-transparent p-6 rounded-2xl border border-violet-500/20">
        <ToolVisualBadge category="calculator" slug={tool.slug} name={tool.name} size="xl" />
        <div className="flex-1">
          <h1 className="text-3xl sm:text-4xl font-black text-surface-900 tracking-tight mb-2">
            {tool.name}
          </h1>
          <p className="text-surface-600 text-base max-w-2xl mb-4 leading-relaxed">
            {tool.description}
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
              🎓 10.0 & 4.0 Grading Scales
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              📊 Percentage Conversion (9.5×)
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              🔒 100% In-Browser Privacy
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              🏆 Academic Honors Classification
            </span>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Course Inputs Column */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-surface-200 shadow-sm p-6">
          {/* Header & Scale Switch */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-surface-200 mb-6">
            <div>
              <h2 className="text-base font-bold text-surface-900">Semester Course Roster</h2>
              <p className="text-xs text-surface-500">Enter each course, grade, and credit weighting</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-surface-500 uppercase">Scale:</span>
              <div className="flex bg-surface-100 p-0.5 rounded-xl border border-surface-200">
                <button
                  onClick={() => switchScale('10')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    scale === '10' ? 'bg-white shadow text-violet-700' : 'text-surface-600'
                  }`}
                >
                  10.0 Point
                </button>
                <button
                  onClick={() => switchScale('4')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    scale === '4' ? 'bg-white shadow text-violet-700' : 'text-surface-600'
                  }`}
                >
                  4.0 Point
                </button>
              </div>
            </div>
          </div>

          {/* Courses List */}
          <div className="space-y-3 mb-6">
            <div className="hidden sm:grid grid-cols-12 gap-3 px-1 text-xs font-bold text-surface-500 uppercase tracking-wider">
              <div className="col-span-5">Course Title / Subject</div>
              <div className="col-span-4">Grade Achieved</div>
              <div className="col-span-2">Credits</div>
              <div className="col-span-1 text-center">Delete</div>
            </div>

            {courses.map((course, idx) => (
              <div
                key={course.id}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-center p-3 rounded-xl border border-surface-200 bg-surface-50/50 hover:bg-surface-50 transition"
              >
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    placeholder={`e.g. Course ${idx + 1}`}
                    value={course.name}
                    onChange={(e) => updateCourse(course.id, 'name', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg text-sm text-surface-900 font-medium outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div className="sm:col-span-4">
                  <select
                    value={course.grade}
                    onChange={(e) => updateCourse(course.id, 'grade', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg text-sm text-surface-800 font-semibold outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {gradeOptions.map((g) => (
                      <option key={g.label} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="Credits"
                    value={course.credits}
                    onChange={(e) => updateCourse(course.id, 'credits', Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg text-sm text-surface-900 font-bold outline-none focus:ring-2 focus:ring-violet-500 text-center"
                  />
                </div>

                <div className="sm:col-span-1 flex justify-end sm:justify-center">
                  <button
                    onClick={() => removeCourse(course.id)}
                    disabled={courses.length <= 1}
                    className="w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-30 transition flex items-center justify-center font-bold"
                    title="Remove course"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Course & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-surface-100">
            <button
              onClick={addCourse}
              className="px-4 py-2 bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 font-bold text-xs rounded-xl transition inline-flex items-center gap-1.5"
            >
              ➕ Add Another Course
            </button>
            <button
              onClick={() => setCourses(scale === '10' ? initialCourses10 : initialCourses10.map(c => ({ ...c, grade: 4.0 })))}
              className="text-xs px-3 py-1.5 rounded-lg text-surface-600 hover:bg-surface-100 transition"
            >
              Reset to Sample
            </button>
          </div>
        </div>

        {/* Results Card Column */}
        <div className="lg:col-span-4 flex flex-col justify-between">
          <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6 flex flex-col justify-between h-full">
            <div>
              <div className="text-xs font-bold text-violet-700 uppercase tracking-widest mb-1">
                Cumulative Grade Point Average
              </div>
              <div className="text-4xl sm:text-5xl font-black text-surface-900 tracking-tight my-2">
                {stats.cgpa.toFixed(2)}
                <span className="text-sm font-semibold text-surface-400 ml-1">/ {scale}.0</span>
              </div>

              {/* Classification Pill */}
              <div className="mt-3">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${stats.badgeColor}`}>
                  {stats.classification}
                </span>
              </div>

              {/* Detailed Breakdown */}
              <div className="space-y-3 pt-6 mt-6 border-t border-surface-100 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-surface-600 font-medium">Total Credit Hours</span>
                  <span className="font-bold text-surface-900">{stats.totalCredits}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-surface-600 font-medium">Quality Points (Σ GP×Cr)</span>
                  <span className="font-bold text-surface-900">{stats.weightedPoints.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-surface-100">
                  <span className="text-surface-800 font-bold">Approx. Percentage</span>
                  <span className="font-black text-violet-700 text-base">{stats.percentage.toFixed(1)}%</span>
                </div>
              </div>

              {/* Formula note */}
              <div className="mt-4 p-3 bg-surface-50 rounded-xl border border-surface-200 text-[11px] text-surface-500">
                Formula: {scale === '10' ? 'Percentage = CGPA × 9.5 (AICTE/CBSE standard)' : 'Percentage = (GPA ÷ 4.0) × 100'}
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-surface-100">
              <button
                onClick={copySummary}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                {copied ? '✓ Copied Summary!' : '📋 Copy Grade Summary'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SEO Explanatory Guide */}
      <section className="content-section mt-10">
        <h2>About College CGPA & GPA Calculation</h2>
        <p>
          Grade Point Average (GPA) is the international academic standard used to measure student performance across university courses.
          Unlike a raw average, GPA accounts for course credit weighting — meaning a 4-credit calculus course impacts your score twice as much as a 2-credit elective lab.
        </p>

        <h3>Formula for Cumulative GPA</h3>
        <p>
          <code>CGPA = [ (Grade Point₁ × Credits₁) + (Grade Point₂ × Credits₂) + ... ] ÷ Total Credits</code>
        </p>

        <h3>Global Grading Scales</h3>
        <ul>
          <li><strong>10.0 Scale:</strong> Widely used in India, Singapore, and parts of Europe (where 10 corresponds to Outstanding, 9 to Excellent, and 8 to Very Good).</li>
          <li><strong>4.0 Scale:</strong> Standard across the United States, Canada, and international business schools.</li>
        </ul>
      </section>

      <FAQ items={faqItems} />
      <RelatedTools currentSlug="cgpa-calculator" />
    </div>
  )
}
