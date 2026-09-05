import { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import SEOHead from '../../components/SEOHead'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { trackToolUsage } from '../../utils/telemetry'

const tool = getToolBySlug('qr-code-generator')!

const faqItems = [
  { question: 'Do these QR codes ever expire?', answer: 'No! The QR codes generated here are static QR codes containing your direct data. They never expire and do not depend on external redirect servers.' },
  { question: 'What error correction level should I choose?', answer: 'Medium (M) is best for general use. Use High (H) if you plan on printing the QR code on merchandise or in outdoor spaces where dirt or damage might obscure parts of it.' },
  { question: 'Can I use these QR codes for commercial projects?', answer: 'Yes, 100% free with no restrictions for both personal and commercial projects.' },
]

type QrType = 'url' | 'text' | 'wifi' | 'email' | 'phone'

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

  // Phone
  const [phone, setPhone] = useState('')

  // Styling options
  const [darkColor, setDarkColor] = useState('#000000')
  const [lightColor, setLightColor] = useState('#ffffff')
  const [size, setSize] = useState(280)
  const [errorCorrection, setErrorCorrection] = useState<'L' | 'M' | 'Q' | 'H'>('M')

  const [dataUrl, setDataUrl] = useState<string>('')
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
      .then((url) => {
        setDataUrl(url)
      })
      .catch((err) => {
        console.error('QR code generation error:', err)
      })
  }, [qrType, content, wifiSsid, wifiPass, wifiType, emailTo, emailSub, emailBody, phone, darkColor, lightColor, size, errorCorrection])

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
    a.download = 'qrcode.png'
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
        width: size,
        margin: 2,
        color: {
          dark: darkColor,
          light: lightColor,
        },
        errorCorrectionLevel: errorCorrection,
      })
      const blob = new Blob([svgString], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'qrcode.svg'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to generate SVG:', err)
    }
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

      <nav className="breadcrumb">
        <a href="/">Home</a>
        <span className="separator">›</span>
        <span>{tool.shortName}</span>
      </nav>

      <h1 className="text-2xl md:text-3xl font-extrabold text-surface-800 mb-2">{tool.name}</h1>
      <p className="text-surface-500 mb-6">{tool.description}</p>

      {/* Type Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'url', label: '🔗 Website URL' },
          { id: 'text', label: '📝 Plain Text' },
          { id: 'wifi', label: '📶 WiFi Network' },
          { id: 'email', label: '✉️ Email Address' },
          { id: 'phone', label: '📞 Phone Call' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setQrType(t.id as QrType)}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
              qrType === t.id
                ? 'bg-primary-600 text-white shadow-md shadow-primary-200'
                : 'bg-white border border-surface-200 text-surface-700 hover:bg-surface-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Configuration Inputs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="card-premium p-6 space-y-4">
            <h2 className="text-base font-bold text-surface-800 border-b border-surface-100 pb-2">
              1. Enter Content
            </h2>

            {qrType === 'url' && (
              <div>
                <label className="block text-xs font-semibold text-surface-600 mb-1">Target URL</label>
                <input
                  type="url"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="w-full px-4 py-3 border border-surface-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                />
              </div>
            )}

            {qrType === 'text' && (
              <div>
                <label className="block text-xs font-semibold text-surface-600 mb-1">Custom Text or Note</label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type any message, serial number, address..."
                  className="w-full px-4 py-3 border border-surface-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                />
              </div>
            )}

            {qrType === 'wifi' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-surface-600 mb-1">Network Name (SSID)</label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    placeholder="MyHomeWiFi"
                    className="w-full px-4 py-2.5 border border-surface-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-600 mb-1">Password</label>
                  <input
                    type="password"
                    value={wifiPass}
                    onChange={(e) => setWifiPass(e.target.value)}
                    placeholder="WiFi Password"
                    className="w-full px-4 py-2.5 border border-surface-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-600 mb-1">Encryption</label>
                  <select
                    value={wifiType}
                    onChange={(e) => setWifiType(e.target.value)}
                    className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm bg-white"
                  >
                    <option value="WPA">WPA / WPA2 / WPA3</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">None (Open Network)</option>
                  </select>
                </div>
              </div>
            )}

            {qrType === 'email' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-surface-600 mb-1">Recipient Email</label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="contact@example.com"
                    className="w-full px-4 py-2.5 border border-surface-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-600 mb-1">Subject</label>
                  <input
                    type="text"
                    value={emailSub}
                    onChange={(e) => setEmailSub(e.target.value)}
                    placeholder="Inquiry"
                    className="w-full px-4 py-2.5 border border-surface-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-600 mb-1">Message Body</label>
                  <textarea
                    rows={3}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Hello..."
                    className="w-full px-4 py-2.5 border border-surface-300 rounded-xl text-sm"
                  />
                </div>
              </div>
            )}

            {qrType === 'phone' && (
              <div>
                <label className="block text-xs font-semibold text-surface-600 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-3 border border-surface-300 rounded-xl text-sm"
                />
              </div>
            )}
          </div>

          {/* Style Customizer */}
          <div className="card-premium p-6 space-y-4">
            <h2 className="text-base font-bold text-surface-800 border-b border-surface-100 pb-2">
              2. Customize Design
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-surface-600 mb-1">Foreground Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={darkColor}
                    onChange={(e) => setDarkColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-surface-200 cursor-pointer p-0.5"
                  />
                  <span className="text-xs font-mono text-surface-700 uppercase">{darkColor}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-600 mb-1">Background Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={lightColor}
                    onChange={(e) => setLightColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-surface-200 cursor-pointer p-0.5"
                  />
                  <span className="text-xs font-mono text-surface-700 uppercase">{lightColor}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-surface-600 mb-1">
                <span>Resolution</span>
                <span>{size} x {size} px</span>
              </div>
              <input
                type="range"
                min={180}
                max={500}
                step={20}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full accent-primary-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1">Error Correction Level</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'L', label: 'L (7%)' },
                  { id: 'M', label: 'M (15%)' },
                  { id: 'Q', label: 'Q (25%)' },
                  { id: 'H', label: 'H (30%)' },
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    onClick={() => setErrorCorrection(lvl.id as 'L' | 'M' | 'Q' | 'H')}
                    className={`py-1.5 rounded-lg text-xs font-semibold border transition ${
                      errorCorrection === lvl.id
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-surface-200 text-surface-600 hover:bg-surface-50'
                    }`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Preview & Download */}
        <div className="lg:col-span-5">
          <div className="card-premium p-6 flex flex-col items-center text-center sticky top-24">
            <h3 className="text-sm font-bold text-surface-700 mb-4 uppercase tracking-wider">Live Preview</h3>

            <div className="p-4 bg-white rounded-2xl shadow-inner border border-surface-200 flex items-center justify-center max-w-[280px] aspect-square">
              {dataUrl ? (
                <img src={dataUrl} alt="Generated QR Code" className="w-full h-full object-contain" />
              ) : (
                <div className="text-surface-400 text-xs">Generating QR...</div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="w-full mt-6 space-y-2">
              <button
                onClick={downloadPNG}
                disabled={!dataUrl}
                className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
              >
                <span>💾 Download PNG</span>
              </button>
              <button
                onClick={downloadSVG}
                disabled={!dataUrl}
                className="px-4 py-2.5 w-full rounded-xl border border-surface-200 bg-white hover:bg-surface-50 text-surface-700 font-semibold text-xs transition shadow-xs flex items-center justify-center gap-2"
              >
                <span>📐 Download Vector SVG</span>
              </button>
            </div>
            <p className="text-xs text-surface-400 mt-3">Static QR code • Never expires • Unlimited scans</p>
          </div>
        </div>
      </div>

      <section className="content-section mt-12">
        <h2>About Free Online QR Code Generator</h2>
        <p>
          Generate crisp, high-resolution QR codes in seconds. Whether linking customers to restaurant menus, creating WiFi logins for guests, or printing business cards with custom branding, our client-side generator provides instant PNG and vector SVG downloads with 100% data privacy.
        </p>
      </section>

      <FAQ items={faqItems} />
      <RelatedTools currentSlug="qr-code-generator" />
    </div>
  )
}
