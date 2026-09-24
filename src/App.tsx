import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ScrollToTop from './components/ScrollToTop'
import ToolRoute from './components/ToolRoute'

import Home from './pages/Home'

// Lazy load other tool pages for optimal code splitting
const PdfCompressor = lazy(() => import('./pages/pdf/PdfCompressor'))
const CompressPdfTo200kb = lazy(() => import('./pages/pdf/CompressPdfTo200kb'))
const PdfMerger = lazy(() => import('./pages/pdf/PdfMerger'))
const PdfSplitter = lazy(() => import('./pages/pdf/PdfSplitter'))
const PdfRotator = lazy(() => import('./pages/pdf/PdfRotator'))
const PdfPageExtractor = lazy(() => import('./pages/pdf/PdfPageExtractor'))
const PdfToWord = lazy(() => import('./pages/pdf/PdfToWord'))
const AddWatermark = lazy(() => import('./pages/pdf/AddWatermark'))
const PdfPageNumberer = lazy(() => import('./pages/pdf/PdfPageNumberer'))
const UnlockPdf = lazy(() => import('./pages/pdf/UnlockPdf'))
const PdfToJpg = lazy(() => import('./pages/pdf/PdfToJpg'))
const JpgToPdf = lazy(() => import('./pages/pdf/JpgToPdf'))
const JpgToPng = lazy(() => import('./pages/image/JpgToPng'))
const PngToJpg = lazy(() => import('./pages/image/PngToJpg'))
const ImageToWebp = lazy(() => import('./pages/image/ImageToWebp'))
const CompressImageToKb = lazy(() => import('./pages/image/CompressImageToKb'))
const ImageCompressor = lazy(() => import('./pages/image/ImageCompressor'))
const ImageResizer = lazy(() => import('./pages/image/ImageResizer'))
const ImageCropper = lazy(() => import('./pages/image/ImageCropper'))
const AgeCalculator = lazy(() => import('./pages/calculators/AgeCalculator'))
const PercentageCalculator = lazy(() => import('./pages/calculators/PercentageCalculator'))
const EmiCalculator = lazy(() => import('./pages/calculators/EmiCalculator'))
const AttendanceCalculator = lazy(() => import('./pages/calculators/AttendanceCalculator'))
const CgpaCalculator = lazy(() => import('./pages/calculators/CgpaCalculator'))
const DateDifference = lazy(() => import('./pages/calculators/DateDifference'))
const WordCounter = lazy(() => import('./pages/text/WordCounter'))
const CaseConverter = lazy(() => import('./pages/text/CaseConverter'))
const JsonFormatter = lazy(() => import('./pages/developer/JsonFormatter'))
const Base64Tool = lazy(() => import('./pages/developer/Base64Tool'))
const UrlEncoder = lazy(() => import('./pages/developer/UrlEncoder'))
const UnitConverter = lazy(() => import('./pages/utility/UnitConverter'))
const QrCodeGenerator = lazy(() => import('./pages/utility/QrCodeGenerator'))
const GuidesHub = lazy(() => import('./pages/guides/GuidesHub'))
const GuideDetail = lazy(() => import('./pages/guides/GuideDetail'))
const AboutUs = lazy(() => import('./pages/legal/AboutUs'))
const HelpCenter = lazy(() => import('./pages/help/HelpCenter'))
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy'))
const TermsOfService = lazy(() => import('./pages/legal/TermsOfService'))
const ContactUs = lazy(() => import('./pages/legal/ContactUs'))
const NotFound = lazy(() => import('./pages/NotFound'))
const UniversalEngineRunner = lazy(() => import('./components/engines/UniversalEngineRunner'))

// Admin lazy components
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminAds = lazy(() => import('./pages/admin/AdminAds'))
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'))
const AdminCompressions = lazy(() => import('./pages/admin/AdminCompressions'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))
const AdminMessages = lazy(() => import('./pages/admin/AdminMessages'))

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
        <p className="text-surface-500 text-sm font-medium">Loading...</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Admin Portal Authentication */}
        <Route
          path="/admin/login"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AdminLogin />
            </Suspense>
          }
        />

        {/* Admin Workspace */}
        <Route
          path="/admin"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AdminLayout />
            </Suspense>
          }
        >
          <Route
            index
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminDashboard />
              </Suspense>
            }
          />
          <Route
            path="dashboard"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminDashboard />
              </Suspense>
            }
          />
          <Route
            path="messages"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminMessages />
              </Suspense>
            }
          />
          <Route
            path="ads"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminAds />
              </Suspense>
            }
          />
          <Route
            path="analytics"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminAnalytics />
              </Suspense>
            }
          />
          <Route
            path="compressions"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminCompressions />
              </Suspense>
            }
          />
          <Route
            path="settings"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminSettings />
              </Suspense>
            }
          />
        </Route>

        {/* Backwards Compatibility / Direct Admin Redirects */}
        <Route path="/login" element={<Navigate to="/admin/login" replace />} />
        <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/ads" element={<Navigate to="/admin/ads" replace />} />
        <Route path="/analytics" element={<Navigate to="/admin/analytics" replace />} />
        <Route path="/compressions" element={<Navigate to="/admin/compressions" replace />} />
        <Route path="/settings" element={<Navigate to="/admin/settings" replace />} />
        <Route path="/messages" element={<Navigate to="/admin/messages" replace />} />

        {/* Public Website Layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          
          {/* PDF Tools */}
          <Route path="/pdf-compressor" element={
            <ToolRoute slug="pdf-compressor"><Suspense fallback={<LoadingSpinner />}><PdfCompressor /></Suspense></ToolRoute>
          } />
          <Route path="/compress" element={<Navigate to="/pdf-compressor" replace />} />
          <Route path="/compress-pdf-to-200kb" element={
            <ToolRoute slug="compress-pdf-to-200kb"><Suspense fallback={<LoadingSpinner />}><CompressPdfTo200kb /></Suspense></ToolRoute>
          } />
          <Route path="/pdf-merger" element={
            <ToolRoute slug="pdf-merger"><Suspense fallback={<LoadingSpinner />}><PdfMerger /></Suspense></ToolRoute>
          } />
          <Route path="/pdf-splitter" element={
            <ToolRoute slug="pdf-splitter"><Suspense fallback={<LoadingSpinner />}><PdfSplitter /></Suspense></ToolRoute>
          } />
          <Route path="/rotate-pdf" element={
            <ToolRoute slug="rotate-pdf"><Suspense fallback={<LoadingSpinner />}><PdfRotator /></Suspense></ToolRoute>
          } />
          <Route path="/extract-pdf-pages" element={
            <ToolRoute slug="extract-pdf-pages"><Suspense fallback={<LoadingSpinner />}><PdfPageExtractor /></Suspense></ToolRoute>
          } />
          <Route path="/pdf-to-word" element={
            <ToolRoute slug="pdf-to-word"><Suspense fallback={<LoadingSpinner />}><PdfToWord /></Suspense></ToolRoute>
          } />
          <Route path="/pdf-to-docx" element={<Navigate to="/pdf-to-word" replace />} />
          <Route path="/add-watermark" element={
            <ToolRoute slug="add-watermark"><Suspense fallback={<LoadingSpinner />}><AddWatermark /></Suspense></ToolRoute>
          } />
          <Route path="/pdf-page-numbering" element={
            <ToolRoute slug="pdf-page-numbering"><Suspense fallback={<LoadingSpinner />}><PdfPageNumberer /></Suspense></ToolRoute>
          } />
          <Route path="/unlock-pdf" element={
            <ToolRoute slug="unlock-pdf"><Suspense fallback={<LoadingSpinner />}><UnlockPdf /></Suspense></ToolRoute>
          } />
          <Route path="/pdf-to-jpg" element={
            <ToolRoute slug="pdf-to-jpg"><Suspense fallback={<LoadingSpinner />}><PdfToJpg /></Suspense></ToolRoute>
          } />
          <Route path="/jpg-to-pdf" element={
            <ToolRoute slug="jpg-to-pdf"><Suspense fallback={<LoadingSpinner />}><JpgToPdf /></Suspense></ToolRoute>
          } />
          <Route path="/png-to-pdf" element={
            <ToolRoute slug="png-to-pdf"><Suspense fallback={<LoadingSpinner />}><JpgToPdf /></Suspense></ToolRoute>
          } />

          {/* Image Tools */}
          <Route path="/image-compressor" element={
            <ToolRoute slug="image-compressor"><Suspense fallback={<LoadingSpinner />}><ImageCompressor /></Suspense></ToolRoute>
          } />
          <Route path="/compress-image-to-kb" element={
            <ToolRoute slug="compress-image-to-kb"><Suspense fallback={<LoadingSpinner />}><CompressImageToKb /></Suspense></ToolRoute>
          } />
          <Route path="/image-resizer" element={
            <ToolRoute slug="image-resizer"><Suspense fallback={<LoadingSpinner />}><ImageResizer /></Suspense></ToolRoute>
          } />
          <Route path="/image-cropper" element={
            <ToolRoute slug="image-cropper"><Suspense fallback={<LoadingSpinner />}><ImageCropper /></Suspense></ToolRoute>
          } />
          <Route path="/jpg-to-png" element={
            <ToolRoute slug="jpg-to-png"><Suspense fallback={<LoadingSpinner />}><JpgToPng /></Suspense></ToolRoute>
          } />
          <Route path="/png-to-jpg" element={
            <ToolRoute slug="png-to-jpg"><Suspense fallback={<LoadingSpinner />}><PngToJpg /></Suspense></ToolRoute>
          } />
          <Route path="/png-to-webp" element={
            <ToolRoute slug="png-to-webp"><Suspense fallback={<LoadingSpinner />}><ImageToWebp initialSourceFormat="png" /></Suspense></ToolRoute>
          } />
          <Route path="/jpg-to-webp" element={
            <ToolRoute slug="jpg-to-webp"><Suspense fallback={<LoadingSpinner />}><ImageToWebp initialSourceFormat="jpg" /></Suspense></ToolRoute>
          } />

          {/* Calculators */}
          <Route path="/age-calculator" element={
            <ToolRoute slug="age-calculator"><Suspense fallback={<LoadingSpinner />}><AgeCalculator /></Suspense></ToolRoute>
          } />
          <Route path="/percentage-calculator" element={
            <ToolRoute slug="percentage-calculator"><Suspense fallback={<LoadingSpinner />}><PercentageCalculator /></Suspense></ToolRoute>
          } />
          <Route path="/emi-calculator" element={
            <ToolRoute slug="emi-calculator"><Suspense fallback={<LoadingSpinner />}><EmiCalculator /></Suspense></ToolRoute>
          } />
          <Route path="/attendance-calculator" element={
            <ToolRoute slug="attendance-calculator"><Suspense fallback={<LoadingSpinner />}><AttendanceCalculator /></Suspense></ToolRoute>
          } />
          <Route path="/cgpa-calculator" element={
            <ToolRoute slug="cgpa-calculator"><Suspense fallback={<LoadingSpinner />}><CgpaCalculator /></Suspense></ToolRoute>
          } />
          <Route path="/date-difference-calculator" element={
            <ToolRoute slug="date-difference-calculator"><Suspense fallback={<LoadingSpinner />}><DateDifference /></Suspense></ToolRoute>
          } />

          {/* Text Tools */}
          <Route path="/word-counter" element={
            <ToolRoute slug="word-counter"><Suspense fallback={<LoadingSpinner />}><WordCounter /></Suspense></ToolRoute>
          } />
          <Route path="/case-converter" element={
            <ToolRoute slug="case-converter"><Suspense fallback={<LoadingSpinner />}><CaseConverter /></Suspense></ToolRoute>
          } />

          {/* Developer Tools */}
          <Route path="/json-formatter" element={
            <ToolRoute slug="json-formatter"><Suspense fallback={<LoadingSpinner />}><JsonFormatter /></Suspense></ToolRoute>
          } />
          <Route path="/base64-encoder-decoder" element={
            <ToolRoute slug="base64-encoder-decoder"><Suspense fallback={<LoadingSpinner />}><Base64Tool /></Suspense></ToolRoute>
          } />
          <Route path="/url-encoder-decoder" element={
            <ToolRoute slug="url-encoder-decoder"><Suspense fallback={<LoadingSpinner />}><UrlEncoder /></Suspense></ToolRoute>
          } />

          {/* Utility Tools */}
          <Route path="/unit-converter" element={
            <ToolRoute slug="unit-converter"><Suspense fallback={<LoadingSpinner />}><UnitConverter /></Suspense></ToolRoute>
          } />
          <Route path="/qr-code-generator" element={
            <ToolRoute slug="qr-code-generator"><Suspense fallback={<LoadingSpinner />}><QrCodeGenerator /></Suspense></ToolRoute>
          } />

          {/* PDF Guides & Learning Center */}
          <Route path="/guides" element={
            <Suspense fallback={<LoadingSpinner />}><GuidesHub /></Suspense>
          } />
          <Route path="/guides/:slug" element={
            <Suspense fallback={<LoadingSpinner />}><GuideDetail /></Suspense>
          } />

          {/* Trust & Support Pages */}
          <Route path="/about" element={
            <Suspense fallback={<LoadingSpinner />}><AboutUs /></Suspense>
          } />
          <Route path="/help" element={
            <Suspense fallback={<LoadingSpinner />}><HelpCenter /></Suspense>
          } />

          {/* Legal Pages */}
          <Route path="/privacy" element={
            <Suspense fallback={<LoadingSpinner />}><PrivacyPolicy /></Suspense>
          } />
          <Route path="/privacy-policy" element={<Navigate to="/privacy" replace />} />
          <Route path="/terms" element={
            <Suspense fallback={<LoadingSpinner />}><TermsOfService /></Suspense>
          } />
          <Route path="/terms-of-service" element={<Navigate to="/terms" replace />} />
          <Route path="/contact" element={
            <Suspense fallback={<LoadingSpinner />}><ContactUs /></Suspense>
          } />

          {/* Dynamic Master Catalog Runner (1,000+ Tools) */}
          <Route path="/:slug" element={
            <Suspense fallback={<LoadingSpinner />}><UniversalEngineRunner /></Suspense>
          } />

          {/* 404 */}
          <Route path="*" element={
            <Suspense fallback={<LoadingSpinner />}><NotFound /></Suspense>
          } />
        </Route>
      </Routes>
    </>
  )
}
