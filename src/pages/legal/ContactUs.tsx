import { useState } from 'react'
import SEOHead from '../../components/SEOHead'
import { SITE_NAME } from '../../data/tools'
import { apiUrl } from '../../utils/api'

export default function ContactUs() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSubmission, setLastSubmission] = useState<{
    name: string
    email: string
    subject: string
    emailDispatched?: boolean
  } | null>(null)

  const officialEmail = 'support.pdfcompresspro@gmail.com'

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(officialEmail)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in all required fields.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(apiUrl('/api/contact'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim()
        })
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok && data.success) {
        setSubmitted(true)
        setLastSubmission({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim() || 'General Inquiry',
          emailDispatched: data.emailDispatched
        })
      } else {
        // If API returns an error message, show it
        setError(data.message || 'Unable to submit your message right now. Please email us directly.')
      }
    } catch (err: any) {
      setError('Connection to server failed. You can also contact us directly at ' + officialEmail)
    } finally {
      setLoading(false)
    }
  }

  const handleFallbackMailto = () => {
    const mailtoUrl = `mailto:${officialEmail}?subject=${encodeURIComponent(subject || 'Support Request')}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`)}`
    window.location.href = mailtoUrl
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <SEOHead
        title={`Contact Us — Official Support | ${SITE_NAME}`}
        description={`Contact the official ${SITE_NAME} support team at ${officialEmail} for technical assistance, questions, or partnership inquiries.`}
        canonical="/contact"
        keywords={['contact PDFCompress Pro', 'PDF compressor support', 'customer service', 'official email']}
      />

      {/* Breadcrumb */}
      <nav className="breadcrumb mb-6" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span className="separator">›</span>
        <span>Contact Us</span>
      </nav>

      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-surface-900 tracking-tight mb-3">
          Contact Our Team
        </h1>
        <p className="text-surface-600 text-base leading-relaxed">
          Have questions regarding PDF optimization, feedback on performance, or feature requests? We are here to help you 24/7.
        </p>
      </div>

      {/* Official Email Highlight Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-primary-500/10 mb-10">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-primary-100 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Official Direct Support
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Need Immediate Assistance?</h2>
            <p className="text-primary-100 text-sm max-w-md">
              Reach out directly to our engineering and support desk. We typically respond within 24 to 48 hours.
            </p>
            <div className="pt-2 font-mono text-lg sm:text-xl font-bold tracking-wide text-white break-all">
              {officialEmail}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={handleCopyEmail}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 font-semibold text-sm transition-all shadow-sm active:scale-95"
            >
              {copied ? '✅ Copied to Clipboard!' : '📋 Copy Email'}
            </button>
            <a
              href={`mailto:${officialEmail}?subject=Support%20Request%20-%20PDFCompress%20Pro`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-primary-700 hover:bg-primary-50 font-bold text-sm transition-all shadow-md active:scale-95"
            >
              ✉️ Send Email Now
            </a>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Grid: Fast FAQs & Contact Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Contact Form */}
        <div className="lg:col-span-7 card-premium p-6 sm:p-8">
          <h2 className="text-xl font-bold text-surface-900 mb-2">Send a Message</h2>
          <p className="text-surface-500 text-xs sm:text-sm mb-6">
            Fill out the form below and we will route your inquiry directly to our engineering and support team.
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex flex-col gap-2">
              <div className="flex items-center gap-2 font-semibold">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={handleFallbackMailto}
                className="self-start text-xs font-bold text-rose-800 underline hover:text-rose-900"
              >
                Click here to send via your local email app instead &rarr;
              </button>
            </div>
          )}

          {submitted && lastSubmission ? (
            <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl font-bold shadow-inner">
                ✓
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-emerald-900">Message Dispatched!</h3>
                <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                  Thank you, <strong>{lastSubmission.name}</strong>. Your inquiry has been securely stored and sent to our support desk.
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm border border-emerald-200/80 rounded-xl p-4 text-left text-xs text-surface-700 space-y-1.5 shadow-sm">
                <div><span className="font-semibold text-surface-900">Topic:</span> {lastSubmission.subject}</div>
                <div><span className="font-semibold text-surface-900">Confirmation Sent To:</span> {lastSubmission.email}</div>
                <div><span className="font-semibold text-surface-900">Notification:</span> {lastSubmission.emailDispatched ? '✅ Admin email notification delivered' : '📬 Logged to support queue'}</div>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => {
                    setSubmitted(false)
                    setMessage('')
                    setSubject('')
                    setError(null)
                  }}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-md transition-all active:scale-95"
                >
                  Send Another Inquiry
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">
                    Your Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    disabled={loading}
                    className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none text-sm transition-all disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">
                    Your Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    disabled={loading}
                    className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none text-sm transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">Topic / Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. PDF Compression Quality question or Feature Request"
                  disabled={loading}
                  className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none text-sm transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">
                  Message Details <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your question, bug report, or suggestion in detail..."
                  disabled={loading}
                  className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none text-sm resize-y transition-all disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Sending Inquiry &amp; Notifying Admin...</span>
                  </>
                ) : (
                  <>
                    <span>✉️ Send Message Directly</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Quick Information Cards */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card-premium p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center text-xl">
                ⚡
              </div>
              <div>
                <h3 className="font-bold text-surface-900 text-sm">Fast Help &amp; FAQs</h3>
                <p className="text-xs text-surface-500">Instant answers to common questions</p>
              </div>
            </div>
            <p className="text-xs text-surface-600 leading-relaxed mb-4">
              Need answers right now? Read our frequently asked questions about file security, compression limits, and supported formats.
            </p>
            <a
              href="/#faq"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700 hover:underline"
            >
              Browse FAQs &rarr;
            </a>
          </div>

          <div className="card-premium p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl">
                🔒
              </div>
              <div>
                <h3 className="font-bold text-surface-900 text-sm">Privacy &amp; Data Deletion</h3>
                <p className="text-xs text-surface-500">Your documents remain 100% confidential</p>
              </div>
            </div>
            <p className="text-xs text-surface-600 leading-relaxed mb-4">
              Files uploaded to PDFCompress Pro are held in transient memory and automatically erased immediately after optimization completes.
            </p>
            <a
              href="/privacy"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700 hover:underline"
            >
              Read Privacy Policy &rarr;
            </a>
          </div>

          <div className="card-premium p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
                🚀
              </div>
              <div>
                <h3 className="font-bold text-surface-900 text-sm">Feature Requests</h3>
                <p className="text-xs text-surface-500">Help shape the future of our tool suite</p>
              </div>
            </div>
            <p className="text-xs text-surface-600 leading-relaxed">
              Looking for a custom tool or specialized format converter? Drop us a line at <span className="font-semibold text-surface-800">{officialEmail}</span> and our developers will evaluate it.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
