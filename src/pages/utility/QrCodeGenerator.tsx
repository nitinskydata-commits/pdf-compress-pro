import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import QRCode from 'qrcode'
import SEOHead from '../../components/SEOHead'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import ToolVisualBadge from '../../components/ToolVisualBadge'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { trackToolUsage } from '../../utils/telemetry'

const tool = getToolBySlug('qr-code-generator') || {
  slug: 'qr-code-generator',
  name: 'QR Code Generator',
  shortName: 'QR Generator',
  description: 'Generate customizable, high-resolution QR codes for websites, WiFi networks, text, emails, and phone numbers. 100% free, static, and never expires.',
  metaTitle: 'Free QR Code Generator Online — Custom Colors, PNG & Vector SVG',
  metaDescription: 'Create custom QR codes online for free. Support for URLs, WiFi logins, vCard, email, and phone. Download in high-resolution PNG or vector SVG with zero expiration.',
  category: 'utility',
  categoryLabel: 'Utility Tools',
  keywords: ['qr code generator', 'make qr code', 'free qr code maker', 'custom qr code', 'wifi qr code generator', 'svg qr code'],
  icon: '⚡',
}

const COLOR_PRESETS = [
  { name: 'Classic Black', dark: '#000000', light: '#FFFFFF' },
  { name: 'Midnight Indigo', dark: '#1E1B4B', light: '#EEF2FF' },
  { name: 'Emerald Business', dark: '#064E3B', light: '#ECFDF5' },
  { name: 'Crimson Bold', dark: '#881337', light: '#FFF1F2' },
  { name: 'Dark Charcoal', dark: '#FFFFFF', light: '#0F172A' },
]

const faqItems = [
  {
    question: 'Do these QR codes ever expire or stop working?',
    answer: 'No! The QR codes created here are 100% static. They encode your data directly into the pixel matrix without relying on external redirect servers or subscription services, so they work forever.',
  },
  {
    question: 'Can I download the QR code in vector SVG format?',
    answer: 'Yes! Vector SVG files can be scaled to any size (from small business cards to huge billboards) without any blurriness or pixelation.',
  },
  {
    question: 'What error correction level should I choose?',
    answer: 'Medium (M, 15%) is ideal for most screens and print materials. If you plan to print outdoors or where the code might get scratched or slightly smudged, choose High (H, 30%).',
  },
  {
    question: 'Can I generate a WiFi QR code for instant guest connection?',
    answer: 'Yes! Select the "WiFi Network" tab, enter your network name (SSID) and password. When guests scan it with their phone camera, their phone connects to your WiFi network automatically without typing the password.',
  },
]

type QrType = 'url' | 'text' | 'wifi' | 'email' | 'phone' | 'sms'

export default function QrCodeGenerator() {
  const [qrType, setQrType] = useState<QrType>('url')
  const [content, setContent] = useState('https://pdfcompressorpro.pages.dev')

  // WiFi fields
  const [wifiSsid, setWifiSsid] = useState('')
  const [wifiPass, setWifiPass] = useState('')
  const [wifiType, setWifiType] = useState('WPA')

  // Email fields
  const [emailTo, setEmailTo] = useState('')
  const [emailSub, setEmailSub] = useState('')
  const [emailBody, setEmailBody] = useState('')

  // Phone & SMS
  const [phone, setPhone] = useState('')
  const [smsPhone, setSmsPhone] = useState('')
  const [smsBody, setSmsBody] = useState('')

  // Styling options
  const [darkColor, setDarkColor] = useState('#000000')
  const [lightColor, setLightColor] = useState('#FFFFFF')
  const [size, setSize] = useState(320)
  const [errorCorrection, setErrorCorrection] = useState<'L' | 'M' | 'Q' | 'H'>('M')

  const [dataUrl, setDataUrl] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Compute actual payload string
  const getPayload = (): string => {
    switch (qrType) {
      case 'url':
      case 'text':
        return content || ' '
      case 'wifi':
        return `WIFI:T:${wifiType};S:${wifiSsid};P:${wifiPass};;`
      case 'email':
        return `mailto:${emailTo}?subject=${encodeURIComponent(emailSub)}&body=${encodeURIComponent(emailBody)}`
      case 'phone':
        return `tel:${phone}`
      case 'sms':
        return `smsto:${smsPhone}:${smsBody}`
      default:
        return content
    }
  }

  // Generate QR code whenever inputs change
  useEffect(() => {
    const payload = getPayload()
    if (!payload) return

    QRCode.toDataURL(payload, {
      width: size,
      margin: 2,
      color: {
        dark: darkColor,
        light: lightColor,
      },
      errorCorrectionLevel: errorCorrection,
    })
      .then(url => setDataUrl(url))
      .catch(err => console.error('QR code generation error:', err))
  }, [
    qrType,
    content,
    wifiSsid,
    wifiPass,
    wifiType,
    emailTo,
    emailSub,
    emailBody,
    phone,
    smsPhone,
    smsBody,
    darkColor,
    lightColor,
    size,
    errorCorrection,
  ])

  const downloadPNG = () => {
    if (!dataUrl) return
    trackToolUsage({
      toolId: 'qr-code-generator',
      toolName: 'QR Code Generator',
      category: 'utility',
      action: `Exported QR Code (${qrType.toUpperCase()})`,
      details: (content || wifiSsid || emailTo || phone || 'Custom QR').substring(0, 40),
      method: 'qrcode.js',
    })
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `qrcode_${qrType}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const downloadSVG = async () => {
    const payload = getPayload()
    if (!payload) return

    try {
      const svgString = await QRCode.toString(payload, {
        type: 'svg',
        margin: 2,
        color: {
          dark: darkColor,
          light: lightColor,
        },
        errorCorrectionLevel: errorCorrection,
      })

      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `qrcode_${qrType}.svg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to generate SVG:', err)
    }
  }

  const copyToClipboard = async () => {
    if (!dataUrl) return
    try {
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ])
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      alert('Could not copy image to clipboard. Please use the Download button instead.')
    }
  }

  const applyColorPreset = (d: string, l: string) => {
    setDarkColor(d)
    setLightColor(l)
  }

  return (
    <div className="min-h-screen bg-surface-50/40 py-8 lg:py-14">
      <SEOHead
        title={tool.metaTitle}
        description={tool.metaDescription}
        canonical="/qr-code-generator"
        keywords={tool.keywords}
        toolName={tool.name}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: tool.name,
          url: `${SITE_URL}/qr-code-generator`,
          description: tool.metaDescription,
          applicationCategory: 'UtilityApplication',
          operatingSystem: 'All',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        }}
        faqData={faqItems}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="breadcrumb mb-6" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="separator">›</span>
          <Link to="/#category-catalog">Utility Tools</Link>
          <span className="separator">›</span>
          <span className="text-surface-900 font-semibold">{tool.name}</span>
        </nav>

        {/* Hero */}
        <div className="card-premium p-6 sm:p-10 mb-8 text-center relative overflow-hidden">
          <ToolVisualBadge category="utility" slug="qr-code-generator" name="QR Generator" icon="⚡" size="xl" className="mx-auto mb-4" />
          <h1 className="text-2xl sm:text-4xl font-extrabold text-surface-900 tracking-tight mb-3">
            Free Online QR Code Generator
          </h1>
          <p className="text-sm sm:text-base text-surface-600 max-w-2xl mx-auto leading-relaxed mb-6">
            Create custom static QR codes for links, WiFi networks, plain text, emails, and phone numbers. Download high-resolution PNG or vector SVG with zero expiration.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-surface-600">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> 100% Static & Never Expires
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> High-Res PNG & Vector SVG
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> 100% Free for Commercial Use
            </span>
          </div>
        </div>

        {/* Main 2-Column Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
          {/* Left Column: Form & Configuration */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Type Selector */}
            <div className="card-premium p-6 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-surface-600 pb-2 border-b border-surface-200">
                1. Select QR Code Type
              </h2>

              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'url', label: '🔗 Website URL' },
                  { id: 'text', label: '📝 Plain Text' },
                  { id: 'wifi', label: '📶 WiFi Network' },
                  { id: 'email', label: '✉️ Email' },
                  { id: 'phone', label: '📞 Phone' },
                  { id: 'sms', label: '💬 SMS Message' },
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setQrType(t.id as QrType)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      qrType === t.id
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-surface-100 hover:bg-surface-200 text-surface-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Dynamic Inputs */}
              <div className="pt-2">
                {qrType === 'url' && (
                  <div>
                    <label className="block text-xs font-semibold text-surface-700 mb-1">
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full px-4 py-3 rounded-xl border border-surface-300 text-sm font-medium text-surface-900"
                    />
                  </div>
                )}

                {qrType === 'text' && (
                  <div>
                    <label className="block text-xs font-semibold text-surface-700 mb-1">
                      Plain Text Message
                    </label>
                    <textarea
                      rows={3}
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      placeholder="Enter any text, instructions, or notes"
                      className="w-full px-4 py-3 rounded-xl border border-surface-300 text-sm font-medium text-surface-900"
                    />
                  </div>
                )}

                {qrType === 'wifi' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-surface-700 mb-1">
                        Network Name (SSID)
                      </label>
                      <input
                        type="text"
                        value={wifiSsid}
                        onChange={e => setWifiSsid(e.target.value)}
                        placeholder="MyHomeWiFi"
                        className="w-full px-4 py-2.5 rounded-xl border border-surface-300 text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-surface-700 mb-1">
                        Password
                      </label>
                      <input
                        type="text"
                        value={wifiPass}
                        onChange={e => setWifiPass(e.target.value)}
                        placeholder="WiFi Password"
                        className="w-full px-4 py-2.5 rounded-xl border border-surface-300 text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-surface-700 mb-1">
                        Security Type
                      </label>
                      <select
                        value={wifiType}
                        onChange={e => setWifiType(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-surface-300 text-xs font-semibold bg-white"
                      >
                        <option value="WPA">WPA / WPA2 / WPA3 (Standard)</option>
                        <option value="WEP">WEP</option>
                        <option value="nopass">None (Open Network)</option>
                      </select>
                    </div>
                  </div>
                )}

                {qrType === 'email' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-surface-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={emailTo}
                        onChange={e => setEmailTo(e.target.value)}
                        placeholder="contact@company.com"
                        className="w-full px-4 py-2.5 rounded-xl border border-surface-300 text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-surface-700 mb-1">
                        Subject Line
                      </label>
                      <input
                        type="text"
                        value={emailSub}
                        onChange={e => setEmailSub(e.target.value)}
                        placeholder="Inquiry from Website"
                        className="w-full px-4 py-2.5 rounded-xl border border-surface-300 text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-surface-700 mb-1">
                        Pre-filled Body
                      </label>
                      <textarea
                        rows={2}
                        value={emailBody}
                        onChange={e => setEmailBody(e.target.value)}
                        placeholder="Hello, I would like to learn more..."
                        className="w-full px-4 py-2 rounded-xl border border-surface-300 text-sm font-medium"
                      />
                    </div>
                  </div>
                )}

                {qrType === 'phone' && (
                  <div>
                    <label className="block text-xs font-semibold text-surface-700 mb-1">
                      Phone Number (with Country Code)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+1 555 123 4567"
                      className="w-full px-4 py-3 rounded-xl border border-surface-300 text-sm font-medium"
                    />
                  </div>
                )}

                {qrType === 'sms' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-surface-700 mb-1">
                        Recipient Phone Number
                      </label>
                      <input
                        type="tel"
                        value={smsPhone}
                        onChange={e => setSmsPhone(e.target.value)}
                        placeholder="+1 555 123 4567"
                        className="w-full px-4 py-2.5 rounded-xl border border-surface-300 text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-surface-700 mb-1">
                        Pre-filled SMS Message
                      </label>
                      <textarea
                        rows={2}
                        value={smsBody}
                        onChange={e => setSmsBody(e.target.value)}
                        placeholder="RSVP YES for tomorrow's event"
                        className="w-full px-4 py-2 rounded-xl border border-surface-300 text-sm font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Customization & Color Themes */}
            <div className="card-premium p-6 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-surface-600 pb-2 border-b border-surface-200">
                2. Design & Color Themes
              </h2>

              {/* Color Presets */}
              <div>
                <label className="block text-xs font-semibold text-surface-600 mb-2">
                  Theme Presets
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map(p => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => applyColorPreset(p.dark, p.light)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-200 bg-white hover:bg-surface-50 text-xs font-semibold text-surface-700 transition-colors shadow-xs"
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: p.dark }}
                      />
                      <span>{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Color Pickers */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">
                    Modules (Foreground)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={darkColor}
                      onChange={e => setDarkColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-surface-300 cursor-pointer bg-white p-1"
                    />
                    <span className="text-xs font-mono font-bold text-surface-700">{darkColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">
                    Background
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={lightColor}
                      onChange={e => setLightColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-surface-300 cursor-pointer bg-white p-1"
                    />
                    <span className="text-xs font-mono font-bold text-surface-700">{lightColor}</span>
                  </div>
                </div>
              </div>

              {/* Size Slider & Error Correction */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-surface-700 mb-1">
                    <span>Export Size</span>
                    <span className="font-bold text-primary-600">{size} × {size} px</span>
                  </div>
                  <input
                    type="range"
                    min="180"
                    max="800"
                    step="20"
                    value={size}
                    onChange={e => setSize(Number(e.target.value))}
                    className="w-full accent-primary-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">
                    Error Correction
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['L', 'M', 'Q', 'H'] as const).map(lvl => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setErrorCorrection(lvl)}
                        className={`py-1 rounded-lg text-xs font-bold transition-all ${
                          errorCorrection === lvl
                            ? 'bg-primary-600 text-white'
                            : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Sticky Preview & Download Box */}
          <div className="lg:col-span-5">
            <div className="card-premium p-6 sm:p-8 flex flex-col items-center text-center sticky top-24 border border-surface-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-surface-500 mb-4">
                Live QR Preview
              </h3>

              <div className="p-4 bg-white rounded-2xl shadow-sm border border-surface-200 flex items-center justify-center max-w-[280px] aspect-square mb-6">
                {dataUrl ? (
                  <img
                    src={dataUrl}
                    alt="Generated QR Code"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-surface-400 text-xs">Generating Code...</div>
                )}
              </div>

              <canvas ref={canvasRef} className="hidden" />

              {/* Action Buttons */}
              <div className="w-full space-y-2.5">
                <button
                  type="button"
                  onClick={downloadPNG}
                  disabled={!dataUrl}
                  className="btn-primary w-full py-3.5 text-sm font-bold shadow-md shadow-primary-500/20 flex items-center justify-center gap-2"
                >
                  <span>💾 Download PNG ({size}px)</span>
                </button>

                <button
                  type="button"
                  onClick={downloadSVG}
                  disabled={!dataUrl}
                  className="btn-secondary w-full py-3 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <span>📐 Download Vector SVG</span>
                </button>

                <button
                  type="button"
                  onClick={copyToClipboard}
                  disabled={!dataUrl}
                  className="w-full py-2.5 rounded-xl border border-surface-200 hover:bg-surface-100 text-surface-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>{copied ? '✓ Image Copied!' : '📋 Copy Image to Clipboard'}</span>
                </button>
              </div>

              <p className="text-[11px] text-surface-400 mt-4 leading-relaxed">
                Static QR code • Never expires • Unlimited scans
              </p>
            </div>
          </div>
        </div>

        {/* SEO Explanations */}
        <section className="card-premium p-6 sm:p-8 mb-8 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-surface-900">
            About Free Online QR Code Generator
          </h2>
          <p className="text-sm text-surface-600 leading-relaxed">
            Generate crisp, high-resolution QR codes in seconds. Whether linking customers to restaurant menus, creating WiFi logins for guests, or printing business cards with custom branding, our client-side generator provides instant PNG and vector SVG downloads with 100% data privacy.
          </p>
          <p className="text-sm text-surface-600 leading-relaxed">
            Unlike other generator websites that create dynamic redirect URLs that expire after 14 days to force you into expensive subscriptions, PDFCompress Pro creates 100% static QR codes. Your codes will work forever without monthly fees.
          </p>
        </section>

        {/* FAQ & Related */}
        <FAQ items={faqItems} />
        <RelatedTools currentSlug="qr-code-generator" />
      </div>
    </div>
  )
}
