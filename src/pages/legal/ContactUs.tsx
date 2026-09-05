import { useState } from 'react'
import SEOHead from '../../components/SEOHead'
import { SITE_NAME } from '../../data/tools'

export default function ContactUs() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Local demo submission
    setSubmitted(true)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <SEOHead
        title={`Contact Us — ${SITE_NAME}`}
        description={`Get in touch with the ${SITE_NAME} support and engineering team for feature requests, feedback, or inquiries.`}
        canonical="/contact"
      />

      <nav className="breadcrumb mb-6">
        <a href="/">Home</a>
        <span className="separator">›</span>
        <span>Contact Us</span>
      </nav>

      <div className="card-premium p-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 mb-2">Get in Touch</h1>
        <p className="text-surface-500 text-sm mb-6">
          Have an idea for a new tool? Found a bug? Or have questions regarding our privacy practices? Send us a message!
        </p>

        {submitted ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
            <div className="text-3xl">🎉</div>
            <h3 className="text-lg font-bold text-emerald-800">Message Received!</h3>
            <p className="text-xs text-emerald-700">Thank you for reaching out. We appreciate your feedback and will respond if necessary.</p>
            <button
              onClick={() => { setSubmitted(false); setMessage(''); }}
              className="mt-4 text-xs font-semibold text-primary-600 underline"
            >
              Send another note
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">Your Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full px-4 py-2.5 border border-surface-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full px-4 py-2.5 border border-surface-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">Message</label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what you think or what tool you would love to see next..."
                className="w-full px-4 py-2.5 border border-surface-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm resize-y"
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2"
            >
              <span>✉️ Send Message</span>
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
