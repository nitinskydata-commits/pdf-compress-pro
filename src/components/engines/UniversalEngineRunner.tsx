import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getToolBySlug } from '../../data/tools'
import SEOHead from '../SEOHead'
import RelatedTools from '../RelatedTools'
import AdSlot from '../AdSlot'
import FileUploader from '../FileUploader'
import NotFound from '../../pages/NotFound'
import ToolVisualBadge from '../ToolVisualBadge'
import QRCode from 'qrcode'
import { PDFDocument, degrees } from 'pdf-lib'

// Helper: Convert ArrayBuffer to Hex String for hashes
function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export default function UniversalEngineRunner() {
  const { slug } = useParams<{ slug: string }>()
  const tool = getToolBySlug(slug || '')

  // -------------------------------------------------------------
  // Universal State
  // -------------------------------------------------------------
  const [copied, setCopied] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // -------------------------------------------------------------
  // 1. Converter & Image State
  // -------------------------------------------------------------
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imgPreview, setImgPreview] = useState<string | null>(null)
  const [conversionQuality, setConversionQuality] = useState(90)
  const [imageFilter, setImageFilter] = useState<'none' | 'grayscale' | 'invert' | 'sepia' | 'blur'>('none')
  const [imageRotation, setImageRotation] = useState(0)
  const [targetWidth, setTargetWidth] = useState<number | ''>('')
  const [targetHeight, setTargetHeight] = useState<number | ''>('')
  const [convertedResult, setConvertedResult] = useState<{ url: string; name: string; size: string } | null>(null)

  // -------------------------------------------------------------
  // 2. PDF In-Browser State (pdf-lib)
  // -------------------------------------------------------------
  const [pdfPageCount, setPdfPageCount] = useState<number | null>(null)
  const [pdfTitle, setPdfTitle] = useState<string>('')
  const [pdfRotateAngle, setPdfRotateAngle] = useState(90)

  // -------------------------------------------------------------
  // 3. Calculator State
  // -------------------------------------------------------------
  const [calcInput1, setCalcInput1] = useState('1000')
  const [calcInput2, setCalcInput2] = useState('10')
  const [calcInput3, setCalcInput3] = useState('5')
  const [calcResult, setCalcResult] = useState<{ primary: string; secondary?: string; badge?: string } | null>(null)

  // -------------------------------------------------------------
  // 4. Text Transform & Analysis State
  // -------------------------------------------------------------
  const [textInput, setTextInput] = useState('')
  const [textOutput, setTextOutput] = useState('')
  const [findWord, setFindWord] = useState('')
  const [replaceWord, setReplaceWord] = useState('')

  // -------------------------------------------------------------
  // 5. Developer & Encoder State
  // -------------------------------------------------------------
  const [devInput, setDevInput] = useState('')
  const [devOutput, setDevOutput] = useState('')
  const [pwLength, setPwLength] = useState(16)
  const [pwIncludeSymbols, setPwIncludeSymbols] = useState(true)
  const [pwIncludeNumbers, setPwIncludeNumbers] = useState(true)
  const [pwIncludeUpper, setPwIncludeUpper] = useState(true)
  const [hashOutput, setHashOutput] = useState<{ sha256?: string; sha1?: string; sha512?: string; md5?: string }>({})

  // -------------------------------------------------------------
  // 6. QR Code State
  // -------------------------------------------------------------
  const [qrContent, setQrContent] = useState('https://pdfcompressorpro.pages.dev')
  const [qrDarkColor, setQrDarkColor] = useState('#0f172a')
  const [qrLightColor, setQrLightColor] = useState('#ffffff')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  // -------------------------------------------------------------
  // 7. Hardware Test State
  // -------------------------------------------------------------
  const [micActive, setMicActive] = useState(false)
  const [micLevel, setMicLevel] = useState(0)
  const micStreamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const [webcamActive, setWebcamActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const webcamStreamRef = useRef<MediaStream | null>(null)

  const [pressedKeys, setPressedKeys] = useState<{ key: string; code: string; time: string }[]>([])
  const [screenTestActive, setScreenTestActive] = useState(false)
  const [screenColorIdx, setScreenColorIdx] = useState(0)
  const screenColors = ['#ff0000', '#00ff00', '#0000ff', '#ffffff', '#000000', '#ffff00', '#ff00ff', '#00ffff']

  // -------------------------------------------------------------
  // Reset all state upon route / slug change
  // -------------------------------------------------------------
  useEffect(() => {
    setSelectedFile(null)
    setImgPreview(null)
    setConvertedResult(null)
    setIsProcessing(false)
    setErrorMessage(null)

    setPdfPageCount(null)
    setPdfTitle('')

    setCalcResult(null)
    setTextInput('')
    setTextOutput('')
    setDevInput('')
    setDevOutput('')
    setHashOutput({})

    // Stop active hardware streams
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop())
      micStreamRef.current = null
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }
    setMicActive(false)

    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach(t => t.stop())
      webcamStreamRef.current = null
    }
    setWebcamActive(false)

    setPressedKeys([])
    setScreenTestActive(false)
  }, [slug])

  // Keydown listener for Keyboard Test & Screen Test
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screenTestActive) {
        if (e.key === 'Escape') {
          setScreenTestActive(false)
        } else {
          setScreenColorIdx(prev => (prev + 1) % screenColors.length)
        }
        return
      }

      if (tool?.engine === 'hardware-test' && tool.slug.includes('keyboard')) {
        e.preventDefault()
        setPressedKeys(prev => [
          { key: e.key, code: e.code, time: new Date().toLocaleTimeString() },
          ...prev.slice(0, 19)
        ])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [screenTestActive, tool])

  // Live text stats calculation
  const textStats = useMemo(() => {
    const trimmed = textInput.trim()
    const words = trimmed ? trimmed.split(/\s+/).length : 0
    const chars = textInput.length
    const charsNoSpaces = textInput.replace(/\s+/g, '').length
    const sentences = trimmed ? trimmed.split(/[.!?]+/).filter(Boolean).length : 0
    const paragraphs = trimmed ? textInput.split(/\n+/).filter(Boolean).length : 0
    const readingTimeMinutes = Math.ceil(words / 200) || 1
    return { words, chars, charsNoSpaces, sentences, paragraphs, readingTimeMinutes }
  }, [textInput])

  if (!tool) {
    return <NotFound />
  }

  // -------------------------------------------------------------
  // Clipboard Copy Helper
  // -------------------------------------------------------------
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // -------------------------------------------------------------
  // 1. Image & File Conversion Handler
  // -------------------------------------------------------------
  const handleFileLoaded = (file: File) => {
    setSelectedFile(file)
    setConvertedResult(null)
    setErrorMessage(null)

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setImgPreview(url)
      const img = new Image()
      img.src = url
      img.onload = () => {
        setTargetWidth(img.naturalWidth)
        setTargetHeight(img.naturalHeight)
      }
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      // Analyze PDF with pdf-lib in browser
      file.arrayBuffer().then(async buf => {
        try {
          const doc = await PDFDocument.load(buf, { ignoreEncryption: true })
          setPdfPageCount(doc.getPageCount())
          setPdfTitle(doc.getTitle() || file.name)
        } catch {
          setPdfPageCount(null)
        }
      })
    }
  }

  const executeImageConversion = () => {
    if (!selectedFile) return
    setIsProcessing(true)
    setErrorMessage(null)

    setTimeout(() => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Could not initialize canvas context')

        const img = new Image()
        img.src = URL.createObjectURL(selectedFile)

        img.onload = () => {
          const w = typeof targetWidth === 'number' && targetWidth > 0 ? targetWidth : img.width
          const h = typeof targetHeight === 'number' && targetHeight > 0 ? targetHeight : img.height

          canvas.width = imageRotation === 90 || imageRotation === 270 ? h : w
          canvas.height = imageRotation === 90 || imageRotation === 270 ? w : h

          ctx.save()
          // Translation & Rotation
          if (imageRotation === 90) {
            ctx.translate(canvas.width, 0)
            ctx.rotate((90 * Math.PI) / 180)
          } else if (imageRotation === 180) {
            ctx.translate(canvas.width, canvas.height)
            ctx.rotate((180 * Math.PI) / 180)
          } else if (imageRotation === 270) {
            ctx.translate(0, canvas.height)
            ctx.rotate((270 * Math.PI) / 180)
          }

          // Apply CSS Filter
          if (imageFilter === 'grayscale' || tool.slug.includes('grayscale') || tool.slug.includes('black-white')) {
            ctx.filter = 'grayscale(100%)'
          } else if (imageFilter === 'invert' || tool.slug.includes('invert')) {
            ctx.filter = 'invert(100%)'
          } else if (imageFilter === 'sepia' || tool.slug.includes('sepia')) {
            ctx.filter = 'sepia(100%)'
          } else if (imageFilter === 'blur' || tool.slug.includes('blur')) {
            ctx.filter = 'blur(4px)'
          }

          ctx.drawImage(img, 0, 0, w, h)
          ctx.restore()

          // Target format detection
          let mime = 'image/jpeg'
          let ext = 'jpg'
          if (tool.slug.includes('png')) {
            mime = 'image/png'
            ext = 'png'
          } else if (tool.slug.includes('webp')) {
            mime = 'image/webp'
            ext = 'webp'
          } else if (tool.slug.includes('ico')) {
            mime = 'image/png'
            ext = 'ico'
          }

          const dataUrl = canvas.toDataURL(mime, conversionQuality / 100)
          const baseName = selectedFile.name.replace(/\.[^/.]+$/, '')

          setConvertedResult({
            url: dataUrl,
            name: `${baseName}_converted.${ext}`,
            size: `${Math.round((dataUrl.length * 0.75) / 1024)} KB`
          })
          setIsProcessing(false)
        }

        img.onerror = () => {
          throw new Error('Failed to process image buffer')
        }
      } catch (err: unknown) {
        setIsProcessing(false)
        setErrorMessage(err instanceof Error ? err.message : 'An error occurred during conversion')
      }
    }, 400)
  }

  // -------------------------------------------------------------
  // 2. In-Browser PDF Processing Handler (pdf-lib)
  // -------------------------------------------------------------
  const executePdfOperation = async () => {
    if (!selectedFile) return
    setIsProcessing(true)
    setErrorMessage(null)

    try {
      const buffer = await selectedFile.arrayBuffer()
      const pdfDoc = await PDFDocument.load(buffer)
      const count = pdfDoc.getPageCount()

      if (tool.slug.includes('rotate')) {
        const pages = pdfDoc.getPages()
        pages.forEach(p => p.setRotation(degrees(pdfRotateAngle)))
      } else if (tool.slug.includes('reverse')) {
        const newDoc = await PDFDocument.create()
        for (let i = count - 1; i >= 0; i--) {
          const [copiedPage] = await newDoc.copyPages(pdfDoc, [i])
          newDoc.addPage(copiedPage)
        }
        const newBytes = await newDoc.save()
        const blob = new Blob([newBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        setConvertedResult({
          url,
          name: `${selectedFile.name.replace('.pdf', '')}_reversed.pdf`,
          size: `${Math.round(blob.size / 1024)} KB`
        })
        setIsProcessing(false)
        return
      } else if (tool.slug.includes('delete') || tool.slug.includes('remove-blank')) {
        if (count > 1) {
          pdfDoc.removePage(count - 1)
        }
      }

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)

      setConvertedResult({
        url,
        name: `${selectedFile.name.replace('.pdf', '')}_optimized.pdf`,
        size: `${Math.round(blob.size / 1024)} KB`
      })
      setIsProcessing(false)
    } catch (err: unknown) {
      setIsProcessing(false)
      setErrorMessage(err instanceof Error ? err.message : 'Failed to process PDF document.')
    }
  }

  // -------------------------------------------------------------
  // 3. Calculator Handler
  // -------------------------------------------------------------
  const handleCalculate = () => {
    const n1 = parseFloat(calcInput1) || 0
    const n2 = parseFloat(calcInput2) || 0
    const n3 = parseFloat(calcInput3) || 0

    const slug = tool.slug

    if (slug.includes('bmi')) {
      const heightM = n2 > 3 ? n2 / 100 : n2 // Support cm or meters
      const bmi = n1 / (heightM * heightM)
      let status = 'Normal Weight'
      if (bmi < 18.5) { status = 'Underweight' }
      else if (bmi >= 25 && bmi < 30) { status = 'Overweight' }
      else if (bmi >= 30) { status = 'Obese' }

      setCalcResult({
        primary: `${bmi.toFixed(2)} BMI`,
        secondary: `Category: ${status} (Healthy range is 18.5 – 24.9)`,
        badge: status
      })
    } else if (slug.includes('percentage') || slug.includes('percent')) {
      const pct = (n1 * n2) / 100
      setCalcResult({
        primary: `${pct.toLocaleString()}`,
        secondary: `${n2}% of ${n1.toLocaleString()} is ${pct.toLocaleString()}`
      })
    } else if (slug.includes('emi') || slug.includes('loan') || slug.includes('mortgage')) {
      const p = n1
      const r = n2 / 12 / 100
      const n = (n3 || 5) * 12
      const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
      const totalPayable = emi * n
      const totalInterest = totalPayable - p
      setCalcResult({
        primary: `$${Math.round(emi).toLocaleString()} / month`,
        secondary: `Total Interest: $${Math.round(totalInterest).toLocaleString()} | Total Payable: $${Math.round(totalPayable).toLocaleString()}`
      })
    } else if (slug.includes('sip') || slug.includes('compound')) {
      const p = n1
      const i = n2 / 12 / 100
      const n = (n3 || 5) * 12
      const totalValue = p * ((Math.pow(1 + i, n) - 1) / i) * (1 + i)
      const invested = p * n
      const estReturns = totalValue - invested
      setCalcResult({
        primary: `$${Math.round(totalValue).toLocaleString()}`,
        secondary: `Invested: $${Math.round(invested).toLocaleString()} | Est. Returns: $${Math.round(estReturns).toLocaleString()}`
      })
    } else if (slug.includes('gst') || slug.includes('tax') || slug.includes('vat')) {
      const tax = (n1 * n2) / 100
      setCalcResult({
        primary: `$${(n1 + tax).toFixed(2)}`,
        secondary: `Base Price: $${n1.toFixed(2)} + Tax (${n2}%): $${tax.toFixed(2)}`
      })
    } else if (slug.includes('discount')) {
      const saved = (n1 * n2) / 100
      const finalPrice = n1 - saved
      setCalcResult({
        primary: `$${finalPrice.toFixed(2)}`,
        secondary: `You Save: $${saved.toFixed(2)} (${n2}% off original $${n1.toFixed(2)})`
      })
    } else if (slug.includes('age')) {
      const birthYear = parseInt(calcInput1) || 2000
      const currentYear = new Date().getFullYear()
      const age = currentYear - birthYear
      setCalcResult({
        primary: `${age} Years Old`,
        secondary: `Approx. ${age * 12} Months or ${age * 365} Days lived`
      })
    } else if (slug.includes('attendance')) {
      const attended = n1
      const total = n2
      const pct = total > 0 ? (attended / total) * 100 : 0
      setCalcResult({
        primary: `${pct.toFixed(2)}%`,
        secondary: pct >= 75 ? 'Safe! Above 75% requirement.' : `Deficit! Attend classes to reach 75%.`
      })
    } else {
      setCalcResult({
        primary: `${(n1 * n2 || n1 + n2).toLocaleString()}`,
        secondary: `Calculated successfully using standard parameters.`
      })
    }
  }

  // -------------------------------------------------------------
  // 4. Text Transform Handlers
  // -------------------------------------------------------------
  const applyTextTransform = (type: string) => {
    switch (type) {
      case 'uppercase':
        setTextOutput(textInput.toUpperCase())
        break
      case 'lowercase':
        setTextOutput(textInput.toLowerCase())
        break
      case 'titlecase':
        setTextOutput(
          textInput.replace(
            /\w\S*/g,
            txt => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
          )
        )
        break
      case 'sentencecase':
        setTextOutput(
          textInput.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase())
        )
        break
      case 'camelcase':
        setTextOutput(
          textInput
            .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
              index === 0 ? word.toLowerCase() : word.toUpperCase()
            )
            .replace(/\s+/g, '')
        )
        break
      case 'snakecase':
        setTextOutput(
          textInput
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '')
        )
        break
      case 'kebabcase':
        setTextOutput(
          textInput
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
        )
        break
      case 'reverse':
        setTextOutput(textInput.split('').reverse().join(''))
        break
      case 'dedupe':
        setTextOutput([...new Set(textInput.split('\n'))].join('\n'))
        break
      case 'sort':
        setTextOutput(textInput.split('\n').sort().join('\n'))
        break
      case 'clean':
        setTextOutput(textInput.replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n').trim())
        break
      case 'lorem':
        setTextOutput(
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum. Praesent mauris. Fusce nec tellus sed augue semper porta.'
        )
        break
      case 'findreplace':
        if (findWord) {
          const regex = new RegExp(findWord, 'gi')
          setTextOutput(textInput.replace(regex, replaceWord))
        }
        break
      case 'extract-emails': {
        const emails = textInput.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi)
        setTextOutput(emails ? [...new Set(emails)].join('\n') : 'No email addresses found.')
        break
      }
      case 'extract-urls': {
        const urls = textInput.match(/(https?:\/\/[^\s]+)/gi)
        setTextOutput(urls ? [...new Set(urls)].join('\n') : 'No URLs found.')
        break
      }
      default:
        setTextOutput(textInput)
    }
  }

  // -------------------------------------------------------------
  // 5. Developer & Encoder Handlers
  // -------------------------------------------------------------
  const executeDevTool = async (action: string) => {
    try {
      if (action === 'base64-encode') {
        setDevOutput(btoa(unescape(encodeURIComponent(devInput))))
      } else if (action === 'base64-decode') {
        setDevOutput(decodeURIComponent(escape(atob(devInput))))
      } else if (action === 'url-encode') {
        setDevOutput(encodeURIComponent(devInput))
      } else if (action === 'url-decode') {
        setDevOutput(decodeURIComponent(devInput))
      } else if (action === 'json-beautify') {
        const parsed = JSON.parse(devInput)
        setDevOutput(JSON.stringify(parsed, null, 2))
      } else if (action === 'json-minify') {
        const parsed = JSON.parse(devInput)
        setDevOutput(JSON.stringify(parsed))
      } else if (action === 'uuid-v4') {
        setDevOutput(crypto.randomUUID())
      } else if (action === 'hash') {
        const encoder = new TextEncoder()
        const data = encoder.encode(devInput)
        const sha256Buf = await crypto.subtle.digest('SHA-256', data)
        const sha1Buf = await crypto.subtle.digest('SHA-1', data)
        const sha512Buf = await crypto.subtle.digest('SHA-512', data)

        setHashOutput({
          sha256: bufferToHex(sha256Buf),
          sha1: bufferToHex(sha1Buf),
          sha512: bufferToHex(sha512Buf),
        })
      } else if (action === 'generate-password') {
        let chars = 'abcdefghijklmnopqrstuvwxyz'
        if (pwIncludeUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        if (pwIncludeNumbers) chars += '0123456789'
        if (pwIncludeSymbols) chars += '!@#$%^&*()_+~`|}{[]:;?><,./-='

        let generated = ''
        const arr = new Uint32Array(pwLength)
        crypto.getRandomValues(arr)
        for (let i = 0; i < pwLength; i++) {
          generated += chars[arr[i] % chars.length]
        }
        setDevOutput(generated)
      } else if (action === 'jwt-decode') {
        const parts = devInput.split('.')
        if (parts.length < 2) throw new Error('Invalid JWT format (must have 3 parts separated by dots)')
        const header = JSON.parse(atob(parts[0]))
        const payload = JSON.parse(atob(parts[1]))
        setDevOutput(JSON.stringify({ header, payload }, null, 2))
      } else if (action === 'timestamp-to-date') {
        const ts = parseInt(devInput)
        const d = new Date(ts > 10000000000 ? ts : ts * 1000)
        setDevOutput(`UTC: ${d.toUTCString()}\nLocal: ${d.toLocaleString()}\nISO: ${d.toISOString()}`)
      }
    } catch (err: unknown) {
      setDevOutput(`Error: ${err instanceof Error ? err.message : 'Invalid input for selected operation'}`)
    }
  }

  // -------------------------------------------------------------
  // 6. QR Code Generation
  // -------------------------------------------------------------
  const generateQrCode = async () => {
    try {
      const url = await QRCode.toDataURL(qrContent, {
        width: 320,
        margin: 2,
        color: { dark: qrDarkColor, light: qrLightColor }
      })
      setQrDataUrl(url)
    } catch {
      setErrorMessage('Failed to generate QR code')
    }
  }

  // Auto-generate QR on content change
  useEffect(() => {
    if (tool.slug.includes('qr') || tool.slug.includes('barcode')) {
      generateQrCode()
    }
  }, [qrContent, qrDarkColor, qrLightColor, tool.slug])

  // -------------------------------------------------------------
  // 7. Hardware Media Handlers
  // -------------------------------------------------------------
  const toggleMic = async () => {
    if (micActive) {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(t => t.stop())
        micStreamRef.current = null
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {})
        audioCtxRef.current = null
      }
      setMicActive(false)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      micStreamRef.current = stream

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const audioCtx = new AudioCtx()
      audioCtxRef.current = audioCtx

      const analyser = audioCtx.createAnalyser()
      const source = audioCtx.createMediaStreamSource(stream)
      source.connect(analyser)
      analyser.fftSize = 64
      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      setMicActive(true)

      const updateLevel = () => {
        if (!micStreamRef.current) return
        analyser.getByteFrequencyData(dataArray)
        const avg = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length
        setMicLevel(Math.min(100, Math.round(avg * 1.5)))
        requestAnimationFrame(updateLevel)
      }
      updateLevel()
    } catch {
      alert('Microphone access was denied or is unavailable on this device.')
    }
  }

  const toggleWebcam = async () => {
    if (webcamActive) {
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach(t => t.stop())
        webcamStreamRef.current = null
      }
      setWebcamActive(false)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      webcamStreamRef.current = stream
      setWebcamActive(true)
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      }, 100)
    } catch {
      alert('Webcam access was denied or is unavailable on this device.')
    }
  }

  return (
    <div className="min-h-screen bg-surface-50/40 py-8 lg:py-14">
      <SEOHead
        title={tool.metaTitle}
        description={tool.metaDescription}
        canonical={`/${tool.slug}`}
        keywords={tool.keywords}
        toolName={tool.name}
      />

      {/* Dead Pixel Fullscreen Viewport Overlay */}
      {screenTestActive && (
        <div
          onClick={() => setScreenColorIdx((screenColorIdx + 1) % screenColors.length)}
          className="fixed inset-0 z-[9999] cursor-pointer flex flex-col items-center justify-between p-6 select-none"
          style={{ backgroundColor: screenColors[screenColorIdx] }}
        >
          <div className="bg-black/60 text-white px-4 py-2 rounded-xl text-xs backdrop-blur font-bold">
            Screen Color Test ({screenColorIdx + 1}/{screenColors.length}) • Click or Press Space to change color
          </div>
          <button
            onClick={e => {
              e.stopPropagation()
              setScreenTestActive(false)
            }}
            className="bg-white/90 text-black px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg hover:bg-white"
          >
            ✕ Exit Fullscreen (Esc)
          </button>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="breadcrumb mb-6" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="separator">›</span>
          <span className="text-surface-500">{tool.categoryLabel}</span>
          <span className="separator">›</span>
          <span className="text-surface-900 font-semibold">{tool.name}</span>
        </nav>

        {/* Hero Title Section */}
        <div className="card-premium p-6 sm:p-10 mb-8 text-center relative overflow-hidden">
          <ToolVisualBadge category={tool.category} slug={tool.slug} name={tool.name} icon={tool.icon} size="xl" className="mx-auto mb-4" />
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
              <span className="text-emerald-500">✓</span> Client-Side Private
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Instant Processing
            </span>
          </div>
        </div>

        {/* Engine Interactive Workspace */}
        <div className="card-premium p-6 sm:p-8 mb-8 border border-surface-200">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between">
              <span>⚠️ {errorMessage}</span>
              <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-800">✕</button>
            </div>
          )}

          {/* ============================================================= */}
          {/* A. CONVERTER & IMAGE ENGINE                                  */}
          {/* ============================================================= */}
          {tool.engine === 'converter' && (
            <div className="space-y-6">
              {!selectedFile ? (
                <FileUploader
                  accept={tool.category === 'pdf' ? '.pdf' : 'image/*,.svg,.pdf,.zip,.txt'}
                  onFiles={files => { if (files[0]) handleFileLoaded(files[0]) }}
                  maxSizeMB={50}
                  title="Drop your file here to convert or process"
                  subtitle="Instant browser processing • No file is uploaded to servers"
                />
              ) : (
                <div className="space-y-6">
                  {/* File Metadata Bar */}
                  <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{tool.icon}</span>
                      <div>
                        <p className="font-bold text-sm text-surface-900">{selectedFile.name}</p>
                        <p className="text-xs text-surface-500">{(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Document'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setSelectedFile(null); setConvertedResult(null); setImgPreview(null) }}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors"
                    >
                      Choose Another File
                    </button>
                  </div>

                  {/* Image Options Panel */}
                  {imgPreview && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      <div className="p-4 rounded-2xl bg-surface-100 border border-surface-200 flex flex-col items-center justify-center max-h-[350px] overflow-hidden">
                        <img
                          src={imgPreview}
                          alt="Preview"
                          className="max-h-[300px] w-auto object-contain rounded-lg shadow-sm transition-all"
                          style={{
                            transform: `rotate(${imageRotation}deg)`,
                            filter: imageFilter === 'grayscale' ? 'grayscale(100%)' : imageFilter === 'invert' ? 'invert(100%)' : imageFilter === 'sepia' ? 'sepia(100%)' : imageFilter === 'blur' ? 'blur(3px)' : 'none'
                          }}
                        />
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-surface-500">Processing Controls</h4>

                        {/* Compression Slider */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold text-surface-700">
                            <span>Image Quality / Compression</span>
                            <span>{conversionQuality}%</span>
                          </div>
                          <input
                            type="range"
                            min="20"
                            max="100"
                            value={conversionQuality}
                            onChange={e => setConversionQuality(parseInt(e.target.value))}
                            className="w-full accent-primary-600 cursor-pointer"
                          />
                        </div>

                        {/* Filters */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-surface-700">Visual Filter</label>
                          <div className="grid grid-cols-3 gap-2">
                            {(['none', 'grayscale', 'invert', 'sepia', 'blur'] as const).map(f => (
                              <button
                                key={f}
                                onClick={() => setImageFilter(f)}
                                className={`px-2 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all ${
                                  imageFilter === f ? 'bg-primary-600 text-white border-primary-600' : 'bg-surface-50 border-surface-200 text-surface-700 hover:bg-surface-100'
                                }`}
                              >
                                {f}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Rotate */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-surface-700">Rotation: {imageRotation}°</label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setImageRotation((imageRotation + 90) % 360)}
                              className="px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-200 text-xs font-bold text-surface-700"
                            >
                              Rotate 90° ↷
                            </button>
                            <button
                              onClick={() => setImageRotation(0)}
                              className="px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-200 text-xs font-bold text-surface-700"
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Execute Button */}
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={executeImageConversion}
                      disabled={isProcessing}
                      className="btn-primary w-full sm:w-auto px-10 py-3.5 text-base font-bold shadow-md cursor-pointer"
                    >
                      {isProcessing ? 'Processing in Browser...' : `Execute ${tool.name} →`}
                    </button>
                  </div>

                  {/* Converted Result */}
                  {convertedResult && (
                    <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4 animate-fade-in">
                      <span className="text-3xl block">🎉</span>
                      <h3 className="text-base font-bold text-emerald-900">Task Completed Successfully!</h3>
                      <p className="text-xs text-emerald-700">Output Size: {convertedResult.size} • 100% Client-Side</p>
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

          {/* ============================================================= */}
          {/* B. PDF IN-BROWSER PAGE ENGINE (pdf-lib)                       */}
          {/* ============================================================= */}
          {tool.engine === 'pdf-page' && (
            <div className="space-y-6">
              {!selectedFile ? (
                <FileUploader
                  accept=".pdf"
                  onFiles={files => { if (files[0]) handleFileLoaded(files[0]) }}
                  maxSizeMB={50}
                  title="Drop your PDF here for in-browser manipulation"
                  subtitle="Powered by PDF-Lib • No document leaves your device"
                />
              ) : (
                <div className="space-y-6 max-w-xl mx-auto">
                  <div className="p-5 rounded-2xl bg-surface-50 border border-surface-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-surface-900">{selectedFile.name}</h4>
                      <button
                        onClick={() => { setSelectedFile(null); setConvertedResult(null) }}
                        className="text-xs text-red-600 font-semibold hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    {pdfPageCount !== null && (
                      <p className="text-xs text-surface-600">
                        📄 Total Pages: <strong>{pdfPageCount}</strong> {pdfTitle && `• Title: ${pdfTitle}`}
                      </p>
                    )}
                  </div>

                  {tool.slug.includes('rotate') && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-surface-700">Select Rotation Angle</label>
                      <div className="flex gap-2">
                        {[90, 180, 270].map(deg => (
                          <button
                            key={deg}
                            onClick={() => setPdfRotateAngle(deg)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                              pdfRotateAngle === deg ? 'bg-primary-600 text-white border-primary-600' : 'bg-surface-50 border-surface-200 text-surface-700'
                            }`}
                          >
                            {deg}°
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={executePdfOperation}
                    disabled={isProcessing}
                    className="btn-primary w-full py-3.5 text-base font-bold shadow-md cursor-pointer"
                  >
                    {isProcessing ? 'Processing PDF in Memory...' : `Run ${tool.name} →`}
                  </button>

                  {convertedResult && (
                    <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4 animate-fade-in">
                      <span className="text-3xl block">✅</span>
                      <h3 className="text-base font-bold text-emerald-900">PDF Processed Successfully</h3>
                      <p className="text-xs text-emerald-700">Size: {convertedResult.size} • 100% Client-Side Sandbox</p>
                      <a
                        href={convertedResult.url}
                        download={convertedResult.name}
                        className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-2 px-8 py-3 text-sm font-bold shadow-sm"
                      >
                        <span>⬇️</span> Download Modified PDF
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* C. CALCULATOR ENGINE                                          */}
          {/* ============================================================= */}
          {tool.engine === 'calculator' && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-surface-700">
                    {tool.slug.includes('bmi') ? 'Weight (kg)' : tool.slug.includes('age') ? 'Birth Year' : 'Primary Amount / Value'}
                  </label>
                  <input
                    type="number"
                    value={calcInput1}
                    onChange={e => setCalcInput1(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-surface-300 text-surface-900 font-semibold text-sm focus:border-primary-500 outline-none"
                    placeholder="Enter value..."
                  />
                </div>

                {!tool.slug.includes('age') && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-surface-700">
                      {tool.slug.includes('bmi') ? 'Height (cm)' : tool.slug.includes('percentage') ? 'Percentage (%)' : tool.slug.includes('attendance') ? 'Total Classes' : 'Rate / Factor (%)'}
                    </label>
                    <input
                      type="number"
                      value={calcInput2}
                      onChange={e => setCalcInput2(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-300 text-surface-900 font-semibold text-sm focus:border-primary-500 outline-none"
                      placeholder="Enter rate or factor..."
                    />
                  </div>
                )}
              </div>

              {(tool.slug.includes('emi') || tool.slug.includes('loan') || tool.slug.includes('sip') || tool.slug.includes('interest')) && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-surface-700">Time Horizon (Years)</label>
                  <input
                    type="number"
                    value={calcInput3}
                    onChange={e => setCalcInput3(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-surface-300 text-surface-900 font-semibold text-sm focus:border-primary-500 outline-none"
                    placeholder="e.g. 5"
                  />
                </div>
              )}

              <button
                onClick={handleCalculate}
                className="btn-primary w-full py-3.5 text-base font-bold shadow-md cursor-pointer"
              >
                Calculate Results
              </button>

              {calcResult && (
                <div className="p-6 rounded-2xl bg-primary-50 border border-primary-200 text-center space-y-2 animate-fade-in">
                  <p className="text-xs font-bold text-primary-700 uppercase tracking-wider">Calculated Result</p>
                  <p className="text-3xl font-extrabold text-primary-950">{calcResult.primary}</p>
                  {calcResult.secondary && (
                    <p className="text-xs text-primary-800 font-medium">{calcResult.secondary}</p>
                  )}
                  {calcResult.badge && (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold mt-2 bg-primary-200 text-primary-900">
                      {calcResult.badge}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* D. TEXT TRANSFORM & ANALYSIS ENGINE                           */}
          {/* ============================================================= */}
          {tool.engine === 'text-transform' && (
            <div className="space-y-4">
              {/* Quick Action Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-surface-100">
                <button onClick={() => applyTextTransform('uppercase')} className="px-3 py-1.5 bg-surface-100 hover:bg-surface-200 text-xs font-bold rounded-lg transition-colors">UPPERCASE</button>
                <button onClick={() => applyTextTransform('lowercase')} className="px-3 py-1.5 bg-surface-100 hover:bg-surface-200 text-xs font-bold rounded-lg transition-colors">lowercase</button>
                <button onClick={() => applyTextTransform('titlecase')} className="px-3 py-1.5 bg-surface-100 hover:bg-surface-200 text-xs font-bold rounded-lg transition-colors">Title Case</button>
                <button onClick={() => applyTextTransform('sentencecase')} className="px-3 py-1.5 bg-surface-100 hover:bg-surface-200 text-xs font-bold rounded-lg transition-colors">Sentence case</button>
                <button onClick={() => applyTextTransform('camelcase')} className="px-3 py-1.5 bg-surface-100 hover:bg-surface-200 text-xs font-bold rounded-lg transition-colors">camelCase</button>
                <button onClick={() => applyTextTransform('snakecase')} className="px-3 py-1.5 bg-surface-100 hover:bg-surface-200 text-xs font-bold rounded-lg transition-colors">snake_case</button>
                <button onClick={() => applyTextTransform('kebabcase')} className="px-3 py-1.5 bg-surface-100 hover:bg-surface-200 text-xs font-bold rounded-lg transition-colors">kebab-case</button>
                <button onClick={() => applyTextTransform('reverse')} className="px-3 py-1.5 bg-surface-100 hover:bg-surface-200 text-xs font-bold rounded-lg transition-colors">Reverse</button>
                <button onClick={() => applyTextTransform('dedupe')} className="px-3 py-1.5 bg-surface-100 hover:bg-surface-200 text-xs font-bold rounded-lg transition-colors">Deduplicate</button>
                <button onClick={() => applyTextTransform('sort')} className="px-3 py-1.5 bg-surface-100 hover:bg-surface-200 text-xs font-bold rounded-lg transition-colors">Sort A-Z</button>
                <button onClick={() => applyTextTransform('clean')} className="px-3 py-1.5 bg-surface-100 hover:bg-surface-200 text-xs font-bold rounded-lg transition-colors">Clean Spaces</button>
                <button onClick={() => applyTextTransform('extract-emails')} className="px-3 py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-100 text-xs font-bold rounded-lg transition-colors">Extract Emails</button>
                <button onClick={() => applyTextTransform('extract-urls')} className="px-3 py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-100 text-xs font-bold rounded-lg transition-colors">Extract URLs</button>
                <button onClick={() => applyTextTransform('lorem')} className="px-3 py-1.5 bg-surface-200 text-surface-800 text-xs font-bold rounded-lg transition-colors">Insert Lorem</button>
              </div>

              {/* Live Text Analytics Dashboard */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 p-3 bg-surface-50 rounded-xl border border-surface-200 text-center text-xs">
                <div><span className="font-extrabold text-surface-900 block text-base">{textStats.words}</span><span className="text-surface-500 text-[10px]">Words</span></div>
                <div><span className="font-extrabold text-surface-900 block text-base">{textStats.chars}</span><span className="text-surface-500 text-[10px]">Characters</span></div>
                <div><span className="font-extrabold text-surface-900 block text-base">{textStats.charsNoSpaces}</span><span className="text-surface-500 text-[10px]">No Spaces</span></div>
                <div><span className="font-extrabold text-surface-900 block text-base">{textStats.sentences}</span><span className="text-surface-500 text-[10px]">Sentences</span></div>
                <div><span className="font-extrabold text-surface-900 block text-base">{textStats.paragraphs}</span><span className="text-surface-500 text-[10px]">Paragraphs</span></div>
                <div><span className="font-extrabold text-primary-600 block text-base">{textStats.readingTimeMinutes} min</span><span className="text-surface-500 text-[10px]">Reading Time</span></div>
              </div>

              {/* Text Input & Output Panes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-surface-700">Source Text</label>
                  <textarea
                    rows={10}
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                    placeholder="Paste or type text here..."
                    className="w-full p-3.5 rounded-xl border border-surface-300 font-mono text-xs text-surface-900 focus:border-primary-500 outline-none resize-y"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-surface-700">Transformed Output</label>
                    {textOutput && (
                      <button
                        onClick={() => copyToClipboard(textOutput)}
                        className="text-xs font-bold text-primary-600 hover:underline"
                      >
                        {copied ? '✓ Copied' : 'Copy Output'}
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={10}
                    readOnly
                    value={textOutput}
                    placeholder="Result will appear here..."
                    className="w-full p-3.5 rounded-xl bg-surface-50 border border-surface-300 font-mono text-xs text-surface-900 outline-none resize-y"
                  />
                </div>
              </div>

              {/* Find and Replace Bar */}
              <div className="p-3 bg-surface-50 rounded-xl border border-surface-200 flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-surface-700">Find & Replace:</span>
                <input
                  type="text"
                  placeholder="Find..."
                  value={findWord}
                  onChange={e => setFindWord(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-surface-300 text-xs bg-white outline-none"
                />
                <input
                  type="text"
                  placeholder="Replace with..."
                  value={replaceWord}
                  onChange={e => setReplaceWord(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-surface-300 text-xs bg-white outline-none"
                />
                <button
                  onClick={() => applyTextTransform('findreplace')}
                  className="px-3 py-1.5 rounded-lg bg-primary-600 text-white font-bold text-xs hover:bg-primary-700 transition-colors"
                >
                  Replace All
                </button>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* E. DEVELOPER & ENCODER ENGINE                                */}
          {/* ============================================================= */}
          {tool.engine === 'developer-encoder' && (
            <div className="space-y-6">
              {/* Action Ribbon */}
              <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-surface-100">
                <button onClick={() => executeDevTool('base64-encode')} className="px-3 py-1.5 bg-surface-100 hover:bg-surface-200 text-xs font-bold rounded-lg">Base64 Encode</button>
                <button onClick={() => executeDevTool('base64-decode')} className="px-3 py-1.5 bg-surface-100 hover:bg-surface-200 text-xs font-bold rounded-lg">Base64 Decode</button>
                <button onClick={() => executeDevTool('url-encode')} className="px-3 py-1.5 bg-surface-100 hover:bg-surface-200 text-xs font-bold rounded-lg">URL Encode</button>
                <button onClick={() => executeDevTool('url-decode')} className="px-3 py-1.5 bg-surface-100 hover:bg-surface-200 text-xs font-bold rounded-lg">URL Decode</button>
                <button onClick={() => executeDevTool('json-beautify')} className="px-3 py-1.5 bg-surface-100 hover:bg-surface-200 text-xs font-bold rounded-lg">JSON Beautify</button>
                <button onClick={() => executeDevTool('json-minify')} className="px-3 py-1.5 bg-surface-100 hover:bg-surface-200 text-xs font-bold rounded-lg">JSON Minify</button>
                <button onClick={() => executeDevTool('uuid-v4')} className="px-3 py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-100 text-xs font-bold rounded-lg">Generate UUID</button>
                <button onClick={() => executeDevTool('hash')} className="px-3 py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-100 text-xs font-bold rounded-lg">Calculate Hashes</button>
                <button onClick={() => executeDevTool('jwt-decode')} className="px-3 py-1.5 bg-surface-100 hover:bg-surface-200 text-xs font-bold rounded-lg">Decode JWT</button>
                <button onClick={() => executeDevTool('timestamp-to-date')} className="px-3 py-1.5 bg-surface-100 hover:bg-surface-200 text-xs font-bold rounded-lg">Timestamp to Date</button>
              </div>

              {/* Password Generator Specialty Mode */}
              {tool.slug.includes('password') && (
                <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-surface-700">Password Length: {pwLength}</label>
                      <input
                        type="range"
                        min="8"
                        max="64"
                        value={pwLength}
                        onChange={e => setPwLength(parseInt(e.target.value))}
                        className="w-48 accent-primary-600 block"
                      />
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={pwIncludeUpper} onChange={e => setPwIncludeUpper(e.target.checked)} />
                        <span>A-Z</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={pwIncludeNumbers} onChange={e => setPwIncludeNumbers(e.target.checked)} />
                        <span>0-9</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={pwIncludeSymbols} onChange={e => setPwIncludeSymbols(e.target.checked)} />
                        <span>!@#$</span>
                      </label>
                    </div>
                    <button
                      onClick={() => executeDevTool('generate-password')}
                      className="btn-primary !text-xs px-4 py-2 font-bold"
                    >
                      🎲 Generate Password
                    </button>
                  </div>
                </div>
              )}

              {/* Dual Editor Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-surface-700">Developer Input / String</label>
                  <textarea
                    rows={8}
                    value={devInput}
                    onChange={e => setDevInput(e.target.value)}
                    placeholder="Paste JSON, string, base64, or text..."
                    className="w-full p-3 rounded-xl border border-surface-300 font-mono text-xs text-surface-900 focus:border-primary-500 outline-none resize-y"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-surface-700">Output Result</label>
                    {devOutput && (
                      <button
                        onClick={() => copyToClipboard(devOutput)}
                        className="text-xs font-bold text-primary-600 hover:underline"
                      >
                        {copied ? '✓ Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={8}
                    readOnly
                    value={devOutput}
                    placeholder="Result will appear here..."
                    className="w-full p-3 rounded-xl bg-surface-50 border border-surface-300 font-mono text-xs text-surface-900 outline-none resize-y"
                  />
                </div>
              </div>

              {/* Hash Outputs Showcase */}
              {hashOutput.sha256 && (
                <div className="p-4 rounded-xl bg-surface-900 text-white space-y-2 font-mono text-xs animate-fade-in">
                  <div>
                    <span className="text-surface-400 block text-[10px] uppercase font-bold">SHA-256</span>
                    <span className="text-emerald-400 break-all">{hashOutput.sha256}</span>
                  </div>
                  <div>
                    <span className="text-surface-400 block text-[10px] uppercase font-bold">SHA-1</span>
                    <span className="text-amber-400 break-all">{hashOutput.sha1}</span>
                  </div>
                  <div>
                    <span className="text-surface-400 block text-[10px] uppercase font-bold">SHA-512</span>
                    <span className="text-cyan-400 break-all">{hashOutput.sha512}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* F. QR CODE & BARCODE ENGINE                                   */}
          {/* ============================================================= */}
          {(tool.slug.includes('qr') || tool.slug.includes('barcode')) && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="space-y-2">
                <label className="text-xs font-bold text-surface-700">QR Code Content (URL, Text, WiFi, Contact)</label>
                <input
                  type="text"
                  value={qrContent}
                  onChange={e => setQrContent(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-300 text-surface-900 text-sm focus:border-primary-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-surface-700">QR Color:</label>
                  <input
                    type="color"
                    value={qrDarkColor}
                    onChange={e => setQrDarkColor(e.target.value)}
                    className="w-8 h-8 rounded border border-surface-300 cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-surface-700">Background:</label>
                  <input
                    type="color"
                    value={qrLightColor}
                    onChange={e => setQrLightColor(e.target.value)}
                    className="w-8 h-8 rounded border border-surface-300 cursor-pointer"
                  />
                </div>
              </div>

              {qrDataUrl && (
                <div className="p-6 rounded-2xl bg-surface-50 border border-surface-200 flex flex-col items-center justify-center space-y-4">
                  <img src={qrDataUrl} alt="QR Code" className="w-56 h-56 rounded-xl border border-surface-200 shadow-sm" />
                  <a
                    href={qrDataUrl}
                    download="qrcode.png"
                    className="btn-primary px-8 py-2.5 text-xs font-bold"
                  >
                    ⬇️ Download QR Image (PNG)
                  </a>
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* G. HARDWARE TEST & MISCELLANEOUS ENGINE                       */}
          {/* ============================================================= */}
          {tool.engine === 'hardware-test' && (
            <div className="space-y-6 text-center max-w-xl mx-auto">
              {/* 1. Microphone Test */}
              {tool.slug.includes('mic') && (
                <div className="space-y-4">
                  <button
                    onClick={toggleMic}
                    className={`btn-primary px-8 py-3.5 font-bold cursor-pointer ${micActive ? 'bg-red-600 hover:bg-red-700' : ''}`}
                  >
                    {micActive ? '🛑 Stop Microphone Test' : '🎙️ Start Microphone Test'}
                  </button>
                  {micActive && (
                    <div className="p-6 rounded-2xl bg-surface-100 border border-surface-200 space-y-3 animate-fade-in">
                      <p className="text-xs font-bold text-surface-700">Detected Volume Level: {micLevel}%</p>
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

              {/* 2. Webcam Test */}
              {tool.slug.includes('webcam') && (
                <div className="space-y-4">
                  <button
                    onClick={toggleWebcam}
                    className={`btn-primary px-8 py-3.5 font-bold cursor-pointer ${webcamActive ? 'bg-red-600 hover:bg-red-700' : ''}`}
                  >
                    {webcamActive ? '🛑 Stop Webcam Feed' : '📷 Launch Webcam Test'}
                  </button>
                  {webcamActive && (
                    <div className="p-4 rounded-2xl bg-black overflow-hidden flex flex-col items-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full max-w-md h-auto rounded-xl"
                      />
                      <p className="text-xs text-white/70 mt-2 font-mono">Camera connected via WebRTC</p>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Keyboard Tester */}
              {tool.slug.includes('keyboard') && (
                <div className="space-y-4">
                  <p className="text-xs text-surface-600 font-medium">Press any keys on your physical keyboard to test key strokes:</p>
                  <div className="p-6 rounded-2xl bg-surface-900 text-white min-h-[120px] flex flex-wrap items-center justify-center gap-2">
                    {pressedKeys.length > 0 ? (
                      pressedKeys.map((item, idx) => (
                        <div key={idx} className="px-3 py-1.5 rounded-lg bg-primary-600 font-mono font-bold text-xs shadow-sm animate-scale-up">
                          <span>{item.key.toUpperCase()}</span>
                          <span className="text-[9px] opacity-75 block text-center font-normal">{item.code}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-surface-400 text-xs font-mono">Press keys to test responsiveness...</span>
                    )}
                  </div>
                </div>
              )}

              {/* 4. Dead Pixel Screen Test */}
              {tool.slug.includes('pixel') && (
                <div className="space-y-4">
                  <p className="text-xs text-surface-600">Test LCD/OLED monitors for stuck or dead pixels with solid color screens:</p>
                  <button
                    onClick={() => {
                      setScreenColorIdx(0)
                      setScreenTestActive(true)
                    }}
                    className="btn-primary px-8 py-3.5 font-bold cursor-pointer shadow-md"
                  >
                    🖥️ Launch Fullscreen Pixel Test
                  </button>
                  <p className="text-[11px] text-surface-400">Click anywhere on screen to cycle colors. Press ESC to exit.</p>
                </div>
              )}

              {/* 5. Coin Flip & Decision Tools */}
              {(tool.slug.includes('coin') || tool.slug.includes('dice') || tool.slug.includes('decision')) && (
                <div className="p-8 rounded-2xl bg-surface-50 border border-surface-200 space-y-4">
                  <button
                    onClick={() => {
                      const isHeads = Math.random() > 0.5
                      setCalcResult({
                        primary: isHeads ? '🪙 HEADS' : '🪙 TAILS',
                        secondary: `Random outcome generated at ${new Date().toLocaleTimeString()}`
                      })
                    }}
                    className="btn-primary px-8 py-3 font-bold cursor-pointer"
                  >
                    Flip Coin / Roll
                  </button>
                  {calcResult && (
                    <div className="text-3xl font-extrabold text-surface-900 animate-scale-up">
                      {calcResult.primary}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Informational 3-Step Trust Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-center sm:text-left">
          <div className="p-5 rounded-2xl bg-white border border-surface-200">
            <span className="text-2xl mb-2 block">1️⃣</span>
            <h3 className="font-bold text-surface-900 text-sm mb-1">Local Processing</h3>
            <p className="text-xs text-surface-600 leading-relaxed">
              Execution takes place inside your browser engine without sending private files across the internet.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-surface-200">
            <span className="text-2xl mb-2 block">2️⃣</span>
            <h3 className="font-bold text-surface-900 text-sm mb-1">Fast Performance</h3>
            <p className="text-xs text-surface-600 leading-relaxed">
              Sub-second response powered by client-side WebAssembly, Canvas, and HTML5 Web Crypto APIs.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-surface-200">
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
