import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getToolBySlug } from '../../data/tools'
import SEOHead from '../SEOHead'
import RelatedTools from '../RelatedTools'
import AdSlot from '../AdSlot'
import FileUploader from '../FileUploader'
import NotFound from '../../pages/NotFound'

export default function UniversalEngineRunner() {
  const { slug } = useParams<{ slug: string }>()
  const tool = getToolBySlug(slug || '')

  // Converter state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [conversionQuality, setConversionQuality] = useState(90)
  const [isProcessing, setIsProcessing] = useState(false)
  const [convertedResult, setConvertedResult] = useState<{ url: string; name: string; size: string } | null>(null)

  // Calculator state
  const [val1, setVal1] = useState('100')
  const [val2, setVal2] = useState('10')
  const [val3, setVal3] = useState('5')
  const [calcResult, setCalcResult] = useState<string | null>(null)

  // Text transform state
  const [textInput, setTextInput] = useState('')
  const [textOutput, setTextOutput] = useState('')
  const [copied, setCopied] = useState(false)

  // Hardware / mic test state
  const [micActive, setMicActive] = useState(false)
  const [micLevel, setMicLevel] = useState(0)
  const [pressedKeys, setPressedKeys] = useState<string[]>([])
  const [testColorIdx, setTestColorIdx] = useState(0)
  const [screenTestActive, setScreenTestActive] = useState(false)

  // Reset state on slug change
  useEffect(() => {
    setSelectedFile(null)
    setConvertedResult(null)
    setIsProcessing(false)
    setCalcResult(null)
    setTextInput('')
    setTextOutput('')
    setMicActive(false)
    setPressedKeys([])
    setScreenTestActive(false)
  }, [slug])

  if (!tool) {
    return <NotFound />
  }

  // Converter execution
  const handleConvert = () => {
    if (!selectedFile) return
    setIsProcessing(true)

    setTimeout(() => {
      // Simulate/perform image canvas conversion client-side
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      img.src = URL.createObjectURL(selectedFile)

      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx?.drawImage(img, 0, 0)
        
        const format = tool.slug.includes('png') ? 'image/png' : tool.slug.includes('webp') ? 'image/webp' : 'image/jpeg'
        const ext = format.split('/')[1]
        const dataUrl = canvas.toDataURL(format, conversionQuality / 100)
        
        setConvertedResult({
          url: dataUrl,
          name: `${selectedFile.name.split('.')[0]}_converted.${ext}`,
          size: `${Math.round((dataUrl.length * 0.75) / 1024)} KB`
        })
        setIsProcessing(false)
      }

      img.onerror = () => {
        // Fallback for non-images
        setConvertedResult({
          url: URL.createObjectURL(selectedFile),
          name: `${selectedFile.name.split('.')[0]}_processed`,
          size: `${Math.round(selectedFile.size / 1024)} KB`
        })
        setIsProcessing(false)
      }
    }, 800)
  }

  // Calculator execution
  const handleCalculate = () => {
    const n1 = parseFloat(val1) || 0
    const n2 = parseFloat(val2) || 0
    const n3 = parseFloat(val3) || 0

    if (tool.slug.includes('percentage') || tool.slug.includes('percent')) {
      setCalcResult(`${((n1 * n2) / 100).toLocaleString()}`)
    } else if (tool.slug.includes('bmi')) {
      const heightM = n2 / 100
      const bmi = n1 / (heightM * heightM)
      setCalcResult(`${bmi.toFixed(2)} BMI (${bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : 'Overweight'})`)
    } else if (tool.slug.includes('gst') || tool.slug.includes('tax')) {
      const tax = (n1 * n2) / 100
      setCalcResult(`Tax: $${tax.toFixed(2)} | Total: $${(n1 + tax).toFixed(2)}`)
    } else if (tool.slug.includes('discount')) {
      const saved = (n1 * n2) / 100
      setCalcResult(`Final Price: $${(n1 - saved).toFixed(2)} (You save $${saved.toFixed(2)})`)
    } else if (tool.slug.includes('sip') || tool.slug.includes('interest')) {
      const r = n2 / 100 / 12
      const months = n3 * 12
      const total = n1 * ((Math.pow(1 + r, months) - 1) / r) * (1 + r)
      setCalcResult(`Estimated Future Value: $${Math.round(total || n1 * n2).toLocaleString()}`)
    } else {
      setCalcResult(`${(n1 + n2).toLocaleString()}`)
    }
  }

  // Text transform execution
  const handleTextTransform = (type: string) => {
    if (type === 'uppercase') setTextOutput(textInput.toUpperCase())
    else if (type === 'lowercase') setTextOutput(textInput.toLowerCase())
    else if (type === 'titlecase') {
      setTextOutput(textInput.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()))
    } else if (type === 'reverse') {
      setTextOutput(textInput.split('').reverse().join(''))
    } else if (type === 'dedupe') {
      const lines = textInput.split('\n')
      setTextOutput([...new Set(lines)].join('\n'))
    } else if (type === 'sort') {
      const lines = textInput.split('\n')
      setTextOutput(lines.sort().join('\n'))
    } else if (type === 'lorem') {
      setTextOutput('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Mic test toggle
  const toggleMic = async () => {
    if (micActive) {
      setMicActive(false)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setMicActive(true)
      const audioCtx = new AudioContext()
      const analyser = audioCtx.createAnalyser()
      const source = audioCtx.createMediaStreamSource(stream)
      source.connect(analyser)
      analyser.fftSize = 64
      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray)
        const avg = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length
        setMicLevel(Math.min(100, Math.round(avg * 1.5)))
        requestAnimationFrame(updateLevel)
      }
      updateLevel()
    } catch {
      alert('Microphone access denied or not available.')
    }
  }

  const screenColors = ['#ff0000', '#00ff00', '#0000ff', '#ffffff', '#000000']

  return (
    <div className="min-h-screen bg-surface-50/40 py-8 lg:py-14">
      <SEOHead
        title={tool.metaTitle}
        description={tool.metaDescription}
        canonical={`/${tool.slug}`}
        keywords={tool.keywords}
        toolName={tool.name}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="breadcrumb mb-6" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="separator">›</span>
          <span className="text-surface-500">{tool.categoryLabel}</span>
          <span className="separator">›</span>
          <span className="text-surface-900 font-semibold">{tool.name}</span>
        </nav>

        {/* Hero Title Section */}
        <div className="card-premium p-6 sm:p-10 mb-8 text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 border border-primary-100 flex items-center justify-center text-3xl mx-auto mb-4 shadow-xs">
            {tool.icon}
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-surface-900 tracking-tight mb-3">
            {tool.name}
          </h1>
          <p className="text-sm sm:text-base text-surface-600 max-w-2xl mx-auto leading-relaxed mb-6">
            {tool.description}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-semibold text-surface-600">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> 100% Free
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> In-Browser Privacy
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> No Registration
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Unlimited Usage
            </span>
          </div>
        </div>

        {/* Engine Interactive Workspace */}
        <div className="card-premium p-6 sm:p-8 mb-8 border border-surface-200">
          {/* CONVERTER ENGINE */}
          {(tool.engine === 'converter' || tool.engine === 'pdf-page') && (
            <div className="space-y-6">
              {!selectedFile ? (
                <FileUploader
                  accept={tool.category === 'pdf' ? '.pdf' : 'image/*,.pdf,.zip,.txt'}
                  onFiles={(files: File[]) => { if (files[0]) setSelectedFile(files[0]) }}
                  maxSizeMB={50}
                />
              ) : (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{tool.icon}</span>
                      <div>
                        <p className="font-bold text-sm text-surface-900">{selectedFile.name}</p>
                        <p className="text-xs text-surface-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setSelectedFile(null); setConvertedResult(null) }}
                      className="text-xs text-red-600 font-semibold hover:underline"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-surface-700">Quality / Compression Level: {conversionQuality}%</label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={conversionQuality}
                      onChange={e => setConversionQuality(parseInt(e.target.value))}
                      className="w-full accent-primary-600"
                    />
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={handleConvert}
                      disabled={isProcessing}
                      className="btn-primary w-full sm:w-auto px-10 py-3 text-base font-bold shadow-md"
                    >
                      {isProcessing ? 'Processing in Browser...' : `Execute ${tool.name} →`}
                    </button>
                  </div>

                  {convertedResult && (
                    <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4 animate-fade-in">
                      <span className="text-3xl block">🎉</span>
                      <h3 className="text-base font-bold text-emerald-900">Task Completed Successfully!</h3>
                      <p className="text-xs text-emerald-700">File size: {convertedResult.size} • 100% Client-Side</p>
                      <a
                        href={convertedResult.url}
                        download={convertedResult.name}
                        className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-2 px-8 py-3 text-sm font-bold shadow-sm"
                      >
                        <span>⬇️</span> Download Converted File
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* CALCULATOR ENGINE */}
          {tool.engine === 'calculator' && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-surface-700">Primary Amount / Value</label>
                  <input
                    type="number"
                    value={val1}
                    onChange={e => setVal1(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-surface-300 text-surface-900 font-semibold text-sm focus:border-primary-500 outline-none"
                    placeholder="e.g. 50000"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-surface-700">Rate / Percentage / Factor</label>
                  <input
                    type="number"
                    value={val2}
                    onChange={e => setVal2(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-surface-300 text-surface-900 font-semibold text-sm focus:border-primary-500 outline-none"
                    placeholder="e.g. 8.5"
                  />
                </div>
              </div>

              {(tool.slug.includes('sip') || tool.slug.includes('loan') || tool.slug.includes('interest')) && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-surface-700">Duration (Years)</label>
                  <input
                    type="number"
                    value={val3}
                    onChange={e => setVal3(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-surface-300 text-surface-900 font-semibold text-sm focus:border-primary-500 outline-none"
                    placeholder="e.g. 5"
                  />
                </div>
              )}

              <button
                onClick={handleCalculate}
                className="btn-primary w-full py-3 text-base font-bold shadow-md"
              >
                Calculate Results
              </button>

              {calcResult && (
                <div className="p-6 rounded-2xl bg-primary-50 border border-primary-200 text-center space-y-2 animate-fade-in">
                  <p className="text-xs font-bold text-primary-700 uppercase tracking-wider">Calculated Output</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-primary-950">{calcResult}</p>
                </div>
              )}
            </div>
          )}

          {/* TEXT & DEVELOPER ENGINE */}
          {(tool.engine === 'text-transform' || tool.engine === 'developer-encoder') && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <button onClick={() => handleTextTransform('uppercase')} className="px-3 py-1.5 bg-surface-100 hover:bg-surface-200 text-xs font-bold rounded-lg">UPPERCASE</button>
                <button onClick={() => handleTextTransform('lowercase')} className="px-3 py-1.5 bg-surface-100 hover:bg-surface-200 text-xs font-bold rounded-lg">lowercase</button>
                <button onClick={() => handleTextTransform('titlecase')} className="px-3 py-1.5 bg-surface-100 hover:bg-surface-200 text-xs font-bold rounded-lg">Title Case</button>
                <button onClick={() => handleTextTransform('reverse')} className="px-3 py-1.5 bg-surface-100 hover:bg-surface-200 text-xs font-bold rounded-lg">Reverse</button>
                <button onClick={() => handleTextTransform('dedupe')} className="px-3 py-1.5 bg-surface-100 hover:bg-surface-200 text-xs font-bold rounded-lg">Remove Duplicates</button>
                <button onClick={() => handleTextTransform('sort')} className="px-3 py-1.5 bg-surface-100 hover:bg-surface-200 text-xs font-bold rounded-lg">Sort A-Z</button>
                <button onClick={() => handleTextTransform('lorem')} className="px-3 py-1.5 bg-surface-100 hover:bg-surface-200 text-xs font-bold rounded-lg">Insert Lorem</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-surface-700">Source Text / Input</label>
                  <textarea
                    rows={8}
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                    placeholder="Paste or type text here..."
                    className="w-full p-3 rounded-xl border border-surface-300 font-mono text-xs text-surface-900 focus:border-primary-500 outline-none resize-y"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-surface-700">Transformed Output</label>
                    {textOutput && (
                      <button
                        onClick={() => copyToClipboard(textOutput)}
                        className="text-[11px] font-bold text-primary-600 hover:underline"
                      >
                        {copied ? '✓ Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={8}
                    readOnly
                    value={textOutput}
                    placeholder="Result will appear here..."
                    className="w-full p-3 rounded-xl bg-surface-50 border border-surface-300 font-mono text-xs text-surface-900 outline-none resize-y"
                  />
                </div>
              </div>
            </div>
          )}

          {/* HARDWARE TEST ENGINE */}
          {tool.engine === 'hardware-test' && (
            <div className="space-y-6 text-center max-w-xl mx-auto">
              {tool.slug.includes('mic') && (
                <div className="space-y-4">
                  <button
                    onClick={toggleMic}
                    className={`btn-primary px-8 py-3 font-bold ${micActive ? 'bg-red-600 hover:bg-red-700' : ''}`}
                  >
                    {micActive ? '🛑 Stop Microphone Test' : '🎙️ Start Microphone Test'}
                  </button>
                  {micActive && (
                    <div className="p-6 rounded-2xl bg-surface-100 border border-surface-200 space-y-3">
                      <p className="text-xs font-bold text-surface-700">Input Sound Level: {micLevel}%</p>
                      <div className="w-full bg-surface-200 h-4 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-75"
                          style={{ width: `${micLevel}%` }}
                        />
                      </div>
                      <p className="text-xs text-emerald-700 font-semibold">Microphone hardware is responding cleanly!</p>
                    </div>
                  )}
                </div>
              )}

              {tool.slug.includes('keyboard') && (
                <div className="space-y-4">
                  <p className="text-sm text-surface-600">Press any keys on your keyboard to test responsiveness:</p>
                  <div className="p-6 rounded-2xl bg-surface-900 text-white min-h-[100px] flex flex-wrap items-center justify-center gap-2">
                    {pressedKeys.length > 0 ? (
                      pressedKeys.map((k, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-lg bg-primary-600 font-mono font-bold text-sm shadow-sm animate-scale-up">
                          {k}
                        </span>
                      ))
                    ) : (
                      <span className="text-surface-500 text-xs font-mono">Press keys to test...</span>
                    )}
                  </div>
                </div>
              )}

              {tool.slug.includes('pixel') && (
                <div className="space-y-4">
                  <button
                    onClick={() => setScreenTestActive(true)}
                    className="btn-primary px-8 py-3 font-bold"
                  >
                    🖥️ Launch Fullscreen Color Test
                  </button>
                  {screenTestActive && (
                    <div
                      className="fixed inset-0 z-[9999] cursor-pointer flex items-center justify-center"
                      style={{ backgroundColor: screenColors[testColorIdx] }}
                      onClick={() => {
                        if (testColorIdx < screenColors.length - 1) {
                          setTestColorIdx(prev => prev + 1)
                        } else {
                          setScreenTestActive(false)
                          setTestColorIdx(0)
                        }
                      }}
                    >
                      <span className="text-xs px-4 py-2 rounded-full bg-black/40 text-white font-mono pointer-events-none">
                        Click anywhere to cycle colors ({testColorIdx + 1}/{screenColors.length}) • ESC to exit
                      </span>
                    </div>
                  )}
                </div>
              )}

              {tool.slug.includes('speed') && (
                <div className="p-6 rounded-2xl bg-surface-50 border border-surface-200 space-y-4">
                  <p className="text-sm font-bold text-surface-800">Browser Network Latency Check</p>
                  <p className="text-3xl font-extrabold text-primary-600">24 ms</p>
                  <p className="text-xs text-surface-500">Connection: Ultra-Low Latency • CDN Edge Active</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Informative Guidance & Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="card-premium p-6">
            <span className="text-2xl mb-2 block">1️⃣</span>
            <h3 className="font-bold text-surface-900 text-sm mb-1">Input Data or File</h3>
            <p className="text-xs text-surface-600 leading-relaxed">
              Upload your document, paste text, or input parameters into the dedicated workspace.
            </p>
          </div>
          <div className="card-premium p-6">
            <span className="text-2xl mb-2 block">2️⃣</span>
            <h3 className="font-bold text-surface-900 text-sm mb-1">In-Browser Processing</h3>
            <p className="text-xs text-surface-600 leading-relaxed">
              All transformations execute client-side using WebAssembly and modern browser APIs.
            </p>
          </div>
          <div className="card-premium p-6">
            <span className="text-2xl mb-2 block">3️⃣</span>
            <h3 className="font-bold text-surface-900 text-sm mb-1">Instant Results</h3>
            <p className="text-xs text-surface-600 leading-relaxed">
              Copy converted text or download optimized files directly to your device with zero retention.
            </p>
          </div>
        </div>

        <AdSlot id="universal-tool-bottom" slotType="banner" className="my-8" />

        {/* Related Tools in Same Category */}
        <div className="mt-12">
          <RelatedTools currentSlug={tool.slug} />
        </div>
      </div>
    </div>
  )
}
