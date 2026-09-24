import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SEOHead from '../../components/SEOHead'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import ToolVisualBadge from '../../components/ToolVisualBadge'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { downloadBlob } from '../../utils/fileUtils'
import { trackToolUsage } from '../../utils/telemetry'

const tool = getToolBySlug('emi-calculator') || {
  slug: 'emi-calculator',
  name: 'Loan EMI Calculator — Home, Car & Personal Loan Estimator',
  shortName: 'EMI Calculator',
  description: 'Calculate monthly loan EMI, total interest, and total payable amount with dynamic sliders, currency selector, and annual amortization schedule.',
  metaTitle: 'Loan EMI Calculator Online Free — Monthly EMI & Amortization Schedule',
  metaDescription: 'Accurately calculate monthly EMI for home loans, car loans, or personal loans. Includes interest breakdown, visual ratio bars, and downloadable amortization schedule.',
  category: 'calculator',
  categoryLabel: 'Calculators',
  keywords: ['emi calculator', 'loan calculator online', 'home loan emi', 'car loan emi', 'amortization schedule'],
  icon: '💰',
}

const faqItems = [
  {
    question: 'How is loan EMI calculated?',
    answer: 'EMI is calculated using the standard reducing balance formula: EMI = [P × r × (1 + r)^n] / [(1 + r)^n - 1], where P is the principal loan amount, r is the periodic monthly interest rate (annual rate ÷ 12 ÷ 100), and n is the total number of monthly installments.',
  },
  {
    question: 'What is the reducing balance method?',
    answer: 'In the reducing balance method, interest is calculated only on the remaining unpaid principal at the beginning of each month. Over time, as principal is paid down, the monthly interest portion decreases while the principal portion increases.',
  },
  {
    question: 'Can I export the amortization schedule?',
    answer: 'Yes! You can download the complete yearly amortization breakdown as a CSV spreadsheet with a single click.',
  },
  {
    question: 'Is my financial loan data stored or recorded?',
    answer: 'No! All calculations run 100% inside your web browser. No loan amounts, interest rates, or financial inputs are ever sent to any remote server.',
  },
]

type Currency = {
  symbol: string
  code: string
  locale: string
}

const currencies: Currency[] = [
  { symbol: '₹', code: 'INR', locale: 'en-IN' },
  { symbol: '$', code: 'USD', locale: 'en-US' },
  { symbol: '€', code: 'EUR', locale: 'de-DE' },
  { symbol: '£', code: 'GBP', locale: 'en-GB' },
]

export default function EmiCalculator() {
  const [currency, setCurrency] = useState<Currency>(currencies[0])
  const [principal, setPrincipal] = useState(2500000)
  const [rate, setRate] = useState(8.5)
  const [years, setYears] = useState(20)
  const [tenureUnit, setTenureUnit] = useState<'years' | 'months'>('years')
  const [showAmortization, setShowAmortization] = useState(false)

  const months = tenureUnit === 'years' ? years * 12 : years

  const calculation = useMemo(() => {
    const P = principal
    const R = rate
    const n = months

    if (!P || P <= 0 || !R || R <= 0 || !n || n <= 0) return null

    const r = R / 12 / 100
    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    const totalPayment = emi * n
    const totalInterest = totalPayment - P
    const principalPct = ((P / totalPayment) * 100).toFixed(1)
    const interestPct = ((totalInterest / totalPayment) * 100).toFixed(1)

    // Generate yearly amortization table
    const yearlySchedule: Array<{
      year: number
      openingBalance: number
      emiPaid: number
      principalPaid: number
      interestPaid: number
      closingBalance: number
    }> = []

    let balance = P
    const totalYears = Math.ceil(n / 12)

    for (let y = 1; y <= totalYears; y++) {
      const yearOpening = balance
      let yearPrincipal = 0
      let yearInterest = 0
      let yearEmi = 0

      for (let m = 1; m <= 12; m++) {
        if (balance <= 0) break
        const monthlyInterest = balance * r
        let monthlyPrincipal = emi - monthlyInterest
        if (balance < monthlyPrincipal) {
          monthlyPrincipal = balance
        }
        balance -= monthlyPrincipal
        yearPrincipal += monthlyPrincipal
        yearInterest += monthlyInterest
        yearEmi += monthlyPrincipal + monthlyInterest
      }

      yearlySchedule.push({
        year: y,
        openingBalance: yearOpening,
        emiPaid: yearEmi,
        principalPaid: yearPrincipal,
        interestPaid: yearInterest,
        closingBalance: Math.max(0, balance),
      })

      if (balance <= 0) break
    }

    return {
      emi,
      totalPayment,
      totalInterest,
      principalPct,
      interestPct,
      yearlySchedule,
    }
  }, [principal, rate, months])

  const formatMoney = (amount: number) => {
    return (
      currency.symbol +
      amount.toLocaleString(currency.locale, {
        maximumFractionDigits: 0,
      })
    )
  }

  useEffect(() => {
    if (calculation) {
      const timer = setTimeout(() => {
        trackToolUsage({
          toolId: 'emi-calculator',
          toolName: 'EMI Calculator',
          category: 'calculator',
          action: `Calculated EMI: ${formatMoney(calculation.emi)}/mo`,
          details: `Principal: ${currency.symbol}${principal}, Rate: ${rate}%, Tenure: ${years} ${tenureUnit}`,
          method: 'Client JS',
        })
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [principal, rate, years, tenureUnit, currency])

  const exportAmortizationCSV = () => {
    if (!calculation) return
    const headers = 'Year,Opening Balance,Total Payment (EMI),Principal Paid,Interest Paid,Closing Balance\n'
    const rows = calculation.yearlySchedule
      .map(
        (row) =>
          `${row.year},${row.openingBalance.toFixed(2)},${row.emiPaid.toFixed(2)},${row.principalPaid.toFixed(2)},${row.interestPaid.toFixed(2)},${row.closingBalance.toFixed(2)}`
      )
      .join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8' })
    downloadBlob(blob, `loan-amortization-${principal}-${rate}pct-${years}yrs.csv`)
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
          applicationCategory: 'FinanceApplication',
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
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-transparent p-6 rounded-2xl border border-amber-500/20">
        <ToolVisualBadge category="calculator" slug={tool.slug} name={tool.name} size="xl" />
        <div className="flex-1">
          <h1 className="text-3xl sm:text-4xl font-black text-surface-900 tracking-tight mb-2">
            {tool.name}
          </h1>
          <p className="text-surface-600 text-base max-w-2xl mb-4 leading-relaxed">
            {tool.description}
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              📊 Reducing Balance Method
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              📅 Amortization Schedule
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              💱 Multi-Currency Support
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              🔒 100% In-Browser Privacy
            </span>
          </div>
        </div>
      </div>

      {/* Calculator Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Controls Column */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-surface-200 shadow-sm p-6 space-y-6">
          {/* Currency Switcher */}
          <div className="flex items-center justify-between pb-4 border-b border-surface-100">
            <span className="text-xs font-bold uppercase tracking-wider text-surface-500">Currency</span>
            <div className="flex gap-1.5">
              {currencies.map((curr) => (
                <button
                  key={curr.code}
                  onClick={() => setCurrency(curr)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    currency.code === curr.code
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                  }`}
                >
                  {curr.symbol} {curr.code}
                </button>
              ))}
            </div>
          </div>

          {/* Loan Amount */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-surface-800">Loan Amount</label>
              <div className="flex items-center bg-surface-50 border border-surface-300 rounded-lg px-3 py-1">
                <span className="text-surface-500 font-bold mr-1">{currency.symbol}</span>
                <input
                  type="number"
                  value={principal}
                  onChange={(e) => setPrincipal(Math.max(0, Number(e.target.value)))}
                  className="w-32 bg-transparent text-right font-black text-surface-900 outline-none"
                />
              </div>
            </div>
            <input
              type="range"
              min={10000}
              max={10000000}
              step={10000}
              value={principal}
              onChange={(e) => setPrincipal(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-surface-400 mt-1">
              <span>{currency.symbol}10,000</span>
              <span>{currency.symbol}50,00,000</span>
              <span>{currency.symbol}1,00,00,000</span>
            </div>
          </div>

          {/* Interest Rate */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-surface-800">Interest Rate (% p.a.)</label>
              <div className="flex items-center bg-surface-50 border border-surface-300 rounded-lg px-3 py-1">
                <input
                  type="number"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(Math.max(0.1, Number(e.target.value)))}
                  className="w-20 bg-transparent text-right font-black text-surface-900 outline-none"
                />
                <span className="text-surface-500 font-bold ml-1">%</span>
              </div>
            </div>
            <input
              type="range"
              min={1}
              max={25}
              step={0.1}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-surface-400 mt-1">
              <span>1%</span>
              <span>8.5%</span>
              <span>15%</span>
              <span>25%</span>
            </div>
          </div>

          {/* Loan Tenure */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-surface-800">Loan Tenure</label>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-surface-50 border border-surface-300 rounded-lg px-3 py-1">
                  <input
                    type="number"
                    value={years}
                    onChange={(e) => setYears(Math.max(1, Number(e.target.value)))}
                    className="w-16 bg-transparent text-right font-black text-surface-900 outline-none"
                  />
                  <span className="text-surface-500 text-xs font-bold ml-1">{tenureUnit}</span>
                </div>
                <div className="flex bg-surface-100 p-0.5 rounded-lg border border-surface-200">
                  <button
                    onClick={() => {
                      if (tenureUnit === 'months') {
                        setYears(Math.max(1, Math.round(years / 12)))
                        setTenureUnit('years')
                      }
                    }}
                    className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      tenureUnit === 'years' ? 'bg-white shadow text-surface-900' : 'text-surface-500'
                    }`}
                  >
                    Yr
                  </button>
                  <button
                    onClick={() => {
                      if (tenureUnit === 'years') {
                        setYears(years * 12)
                        setTenureUnit('months')
                      }
                    }}
                    className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      tenureUnit === 'months' ? 'bg-white shadow text-surface-900' : 'text-surface-500'
                    }`}
                  >
                    Mo
                  </button>
                </div>
              </div>
            </div>
            <input
              type="range"
              min={1}
              max={tenureUnit === 'years' ? 30 : 360}
              step={1}
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-surface-400 mt-1">
              <span>{tenureUnit === 'years' ? '1 Year' : '12 Mos'}</span>
              <span>{tenureUnit === 'years' ? '15 Years' : '180 Mos'}</span>
              <span>{tenureUnit === 'years' ? '30 Years' : '360 Mos'}</span>
            </div>
          </div>
        </div>

        {/* Results & Ratio Card Column */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          {calculation ? (
            <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6 flex flex-col justify-between h-full">
              <div>
                <div className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-1">
                  Monthly Payment (EMI)
                </div>
                <div className="text-3xl sm:text-4xl font-black text-surface-900 tracking-tight mb-4">
                  {formatMoney(calculation.emi)}
                  <span className="text-xs font-semibold text-surface-500 ml-1">/ month</span>
                </div>

                <div className="space-y-3 pt-4 border-t border-surface-100">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-surface-600 font-medium">Principal Amount</span>
                    <span className="font-bold text-surface-900">{formatMoney(principal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-surface-600 font-medium">Total Interest Payable</span>
                    <span className="font-bold text-amber-600">{formatMoney(calculation.totalInterest)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-surface-100">
                    <span className="text-surface-800 font-bold">Total Payment (P + I)</span>
                    <span className="font-black text-surface-900">{formatMoney(calculation.totalPayment)}</span>
                  </div>
                </div>

                {/* Progress bar visual ratio */}
                <div className="mt-6">
                  <div className="flex justify-between text-xs font-bold text-surface-600 mb-1.5">
                    <span>Principal: {calculation.principalPct}%</span>
                    <span>Interest: {calculation.interestPct}%</span>
                  </div>
                  <div className="w-full h-3 bg-amber-100 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${calculation.principalPct}%` }}
                      title={`Principal: ${calculation.principalPct}%`}
                    />
                    <div
                      className="bg-amber-500 h-full transition-all duration-300"
                      style={{ width: `${calculation.interestPct}%` }}
                      title={`Interest: ${calculation.interestPct}%`}
                    />
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-[11px] text-surface-500">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Principal
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Total Interest
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-surface-100 flex gap-2">
                <button
                  onClick={() => setShowAmortization(!showAmortization)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-surface-100 hover:bg-surface-200 text-surface-700 transition flex items-center justify-center gap-1.5"
                >
                  {showAmortization ? '▲ Hide Schedule' : '▼ View Amortization'}
                </button>
                <button
                  onClick={exportAmortizationCSV}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition flex items-center gap-1.5"
                >
                  📥 Export CSV
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Amortization Schedule Table */}
      {showAmortization && calculation && (
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6 mb-8 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-bold text-surface-900">Yearly Amortization Schedule</h3>
              <p className="text-xs text-surface-500">Annual breakdown of principal repayment and interest charges</p>
            </div>
            <button
              onClick={exportAmortizationCSV}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-200 text-surface-700 transition inline-flex items-center gap-1"
            >
              📥 Download CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-50 text-surface-600 text-xs uppercase font-bold border-b border-surface-200">
                <tr>
                  <th className="py-3 px-4">Year</th>
                  <th className="py-3 px-4">Opening Balance</th>
                  <th className="py-3 px-4">EMI Paid</th>
                  <th className="py-3 px-4 text-emerald-700">Principal Paid</th>
                  <th className="py-3 px-4 text-amber-700">Interest Paid</th>
                  <th className="py-3 px-4">Closing Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 text-surface-700">
                {calculation.yearlySchedule.map((row) => (
                  <tr key={row.year} className="hover:bg-surface-50 transition">
                    <td className="py-3 px-4 font-bold text-surface-900">Year {row.year}</td>
                    <td className="py-3 px-4">{formatMoney(row.openingBalance)}</td>
                    <td className="py-3 px-4 font-medium">{formatMoney(row.emiPaid)}</td>
                    <td className="py-3 px-4 font-semibold text-emerald-700">{formatMoney(row.principalPaid)}</td>
                    <td className="py-3 px-4 font-semibold text-amber-700">{formatMoney(row.interestPaid)}</td>
                    <td className="py-3 px-4 font-bold">{formatMoney(row.closingBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Educational Guide */}
      <section className="content-section mt-10">
        <h2>Understanding Loan EMI & Reducing Balance Interest</h2>
        <p>
          An Equated Monthly Installment (EMI) is a fixed payment amount made by a borrower to a lender at a specified calendar date each month.
          EMIs apply to home mortgages, vehicle loans, education loans, and personal credit lines.
        </p>

        <h3>How EMI Amortization Works</h3>
        <p>
          Each EMI payment consists of two distinct components: the <strong>principal</strong> (the original loan amount borrowed) and the <strong>interest</strong> (the cost of borrowing).
          In early loan stages, interest forms the largest chunk of your monthly installment. As the outstanding loan balance decreases, the interest burden drops and an increasing share goes directly toward clearing the principal balance.
        </p>

        <h3>Tips for Lowering Your Loan Burden</h3>
        <ul>
          <li><strong>Pre-payments:</strong> Making periodic partial pre-payments directly slashes the principal balance, drastically cutting total interest.</li>
          <li><strong>Tenure Optimization:</strong> Shorter tenures involve higher monthly installments but result in massive interest savings overall.</li>
          <li><strong>Interest Rate Negotiation:</strong> Even a 0.5% rate reduction can save thousands of dollars over a 20-year mortgage.</li>
        </ul>
      </section>

      <FAQ items={faqItems} />
      <RelatedTools currentSlug="emi-calculator" />
    </div>
  )
}
