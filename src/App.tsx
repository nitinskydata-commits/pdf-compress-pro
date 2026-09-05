import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ScrollToTop from './components/ScrollToTop'

// Lazy load all pages for optimal code splitting
const Home = lazy(() => import('./pages/Home'))
const PdfCompressor = lazy(() => import('./pages/pdf/PdfCompressor'))
const CompressPdfTo200kb = lazy(() => import('./pages/pdf/CompressPdfTo200kb'))
const PdfMerger = lazy(() => import('./pages/pdf/PdfMerger'))
const PdfSplitter = lazy(() => import('./pages/pdf/PdfSplitter'))
const PdfToJpg = lazy(() => import('./pages/pdf/PdfToJpg'))
const JpgToPdf = lazy(() => import('./pages/pdf/JpgToPdf'))
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
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy'))
const TermsOfService = lazy(() => import('./pages/legal/TermsOfService'))
const ContactUs = lazy(() => import('./pages/legal/ContactUs'))
const NotFound = lazy(() => import('./pages/NotFound'))

// Admin lazy components
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminAds = lazy(() => import('./pages/admin/AdminAds'))
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'))
const AdminCompressions = lazy(() => import('./pages/admin/AdminCompressions'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))

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

        {/* Public Website Layout */}
        <Route element={<Layout />}>
          <Route path="/" element={
            <Suspense fallback={<LoadingSpinner />}><Home /></Suspense>
          } />
          
          {/* PDF Tools */}
          <Route path="/pdf-compressor" element={
            <Suspense fallback={<LoadingSpinner />}><PdfCompressor /></Suspense>
          } />
          <Route path="/compress" element={<Navigate to="/pdf-compressor" replace />} />
          <Route path="/compress-pdf-to-200kb" element={
            <Suspense fallback={<LoadingSpinner />}><CompressPdfTo200kb /></Suspense>
          } />
          <Route path="/pdf-merger" element={
            <Suspense fallback={<LoadingSpinner />}><PdfMerger /></Suspense>
          } />
          <Route path="/pdf-splitter" element={
            <Suspense fallback={<LoadingSpinner />}><PdfSplitter /></Suspense>
          } />
          <Route path="/pdf-to-jpg" element={
            <Suspense fallback={<LoadingSpinner />}><PdfToJpg /></Suspense>
          } />
          <Route path="/jpg-to-pdf" element={
            <Suspense fallback={<LoadingSpinner />}><JpgToPdf /></Suspense>
          } />

          {/* Image Tools */}
          <Route path="/image-compressor" element={
            <Suspense fallback={<LoadingSpinner />}><ImageCompressor /></Suspense>
          } />
          <Route path="/image-resizer" element={
            <Suspense fallback={<LoadingSpinner />}><ImageResizer /></Suspense>
          } />
          <Route path="/image-cropper" element={
            <Suspense fallback={<LoadingSpinner />}><ImageCropper /></Suspense>
          } />

          {/* Calculators */}
          <Route path="/age-calculator" element={
            <Suspense fallback={<LoadingSpinner />}><AgeCalculator /></Suspense>
          } />
          <Route path="/percentage-calculator" element={
            <Suspense fallback={<LoadingSpinner />}><PercentageCalculator /></Suspense>
          } />
          <Route path="/emi-calculator" element={
            <Suspense fallback={<LoadingSpinner />}><EmiCalculator /></Suspense>
          } />
          <Route path="/attendance-calculator" element={
            <Suspense fallback={<LoadingSpinner />}><AttendanceCalculator /></Suspense>
          } />
          <Route path="/cgpa-calculator" element={
            <Suspense fallback={<LoadingSpinner />}><CgpaCalculator /></Suspense>
          } />
          <Route path="/date-difference-calculator" element={
            <Suspense fallback={<LoadingSpinner />}><DateDifference /></Suspense>
          } />

          {/* Text Tools */}
          <Route path="/word-counter" element={
            <Suspense fallback={<LoadingSpinner />}><WordCounter /></Suspense>
          } />
          <Route path="/case-converter" element={
            <Suspense fallback={<LoadingSpinner />}><CaseConverter /></Suspense>
          } />

          {/* Developer Tools */}
          <Route path="/json-formatter" element={
            <Suspense fallback={<LoadingSpinner />}><JsonFormatter /></Suspense>
          } />
          <Route path="/base64-encoder-decoder" element={
            <Suspense fallback={<LoadingSpinner />}><Base64Tool /></Suspense>
          } />
          <Route path="/url-encoder-decoder" element={
            <Suspense fallback={<LoadingSpinner />}><UrlEncoder /></Suspense>
          } />

          {/* Utility Tools */}
          <Route path="/unit-converter" element={
            <Suspense fallback={<LoadingSpinner />}><UnitConverter /></Suspense>
          } />
          <Route path="/qr-code-generator" element={
            <Suspense fallback={<LoadingSpinner />}><QrCodeGenerator /></Suspense>
          } />

          {/* Legal Pages */}
          <Route path="/privacy" element={
            <Suspense fallback={<LoadingSpinner />}><PrivacyPolicy /></Suspense>
          } />
          <Route path="/terms" element={
            <Suspense fallback={<LoadingSpinner />}><TermsOfService /></Suspense>
          } />
          <Route path="/contact" element={
            <Suspense fallback={<LoadingSpinner />}><ContactUs /></Suspense>
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
