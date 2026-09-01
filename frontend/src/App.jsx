import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from './store/authStore'

// Auth
import LoginPage from './features/auth/LoginPage'

// Citizen
import CitizenDashboard from './features/citizen/CitizenDashboard'
import SubmitComplaint from './features/citizen/SubmitComplaint'
import ComplaintTracking from './features/citizen/ComplaintTracking'

// Authority
import AuthorityDashboard from './features/authority/AuthorityDashboard'
import IssueQueue from './features/authority/IssueQueue'
import IssueDetail from './features/authority/IssueDetail'
import CityMap from './features/authority/CityMap'
import CityAnalytics from './features/authority/CityAnalytics'
import AdminSettings from './features/authority/AdminSettings'

// Protected route wrapper
function ProtectedRoute({ children, allowedRoles }) {
  const { token, role } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={role === 'citizen' ? '/citizen' : '/authority'} replace />
  }
  return children
}

// Landing page component
function LandingPage() {
  const { token, role } = useAuthStore()

  // Auto-redirect if already logged in
  if (token) {
    return <Navigate to={role === 'citizen' ? '/citizen' : '/authority'} replace />
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex flex-col">
      <header className="bg-white border-b border-outline-variant/30 px-margin-desktop py-sm flex items-center justify-between">
        <div className="flex items-center gap-xs">
          <span className="material-symbols-outlined text-primary-container" style={{ fontSize: '28px', fontVariationSettings: "'FILL' 1" }}>account_balance</span>
          <span className="text-headline-md font-bold text-primary-container">CivicIssue AI</span>
        </div>
        <Link to="/login" className="bg-primary-container text-on-primary text-label-md font-semibold px-md py-sm rounded-md hover:shadow-md transition-all">
          Get Started
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-margin-mobile md:px-margin-desktop py-xl text-center gap-xl">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-3xl space-y-lg">
          <div className="inline-flex items-center gap-xs bg-purple-50 text-purple-700 border border-purple-200 px-md py-sm rounded-full text-label-md font-semibold">
            <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            Powered by AI · SIH 2026
          </div>

          <h1 className="text-headline-xl text-on-surface font-bold">
            Smart Civic Grievance<br />
            <span className="text-primary-container">Management Platform</span>
          </h1>

          <p className="text-body-lg text-on-surface-variant max-w-xl mx-auto">
            AI-powered complaint routing, duplicate detection, and real-time tracking for citizens and civic authorities.
          </p>

          <div className="flex flex-wrap gap-md justify-center">
            <Link to="/login" className="bg-primary-container text-on-primary text-body-lg font-semibold px-lg py-md rounded-xl hover:shadow-md hover:-translate-y-px transition-all flex items-center gap-sm">
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>login</span>
              Get Started
            </Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-md max-w-4xl w-full">
          {[
            { icon: 'translate', title: 'Multilingual AI', desc: 'Submit complaints in Hindi, English, or Hinglish. AI understands all.', color: 'text-blue-600 bg-blue-50' },
            { icon: 'hub', title: 'Smart Deduplication', desc: 'AI automatically links similar complaints, reducing duplicate processing by 70%.', color: 'text-purple-600 bg-purple-50' },
            { icon: 'map', title: 'Geospatial Hotspots', desc: 'Real-time city map with complaint density heatmaps and priority clustering.', color: 'text-green-600 bg-green-50' },
          ].map(f => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-xl p-md text-left space-y-sm"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${f.color}`}>
                <span className="material-symbols-outlined" style={{ fontSize: '22px', fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
              </div>
              <h3 className="text-headline-md text-on-surface font-semibold">{f.title}</h3>
              <p className="text-body-md text-on-surface-variant">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="text-center text-body-sm text-on-surface-variant py-md border-t border-outline-variant/20">
        CivicIssue AI · SIH 2026 · Built for smarter cities
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />

        {/* Citizen routes */}
        <Route path="/citizen" element={<ProtectedRoute allowedRoles={['citizen']}><CitizenDashboard /></ProtectedRoute>} />
        <Route path="/citizen/submit" element={<ProtectedRoute allowedRoles={['citizen']}><SubmitComplaint /></ProtectedRoute>} />
        <Route path="/citizen/track/:id" element={<ProtectedRoute allowedRoles={['citizen']}><ComplaintTracking /></ProtectedRoute>} />
        <Route path="/citizen/track" element={<ProtectedRoute allowedRoles={['citizen']}><ComplaintTracking /></ProtectedRoute>} />

        {/* Authority routes */}
        <Route path="/authority" element={<ProtectedRoute allowedRoles={['department_admin', 'super_admin']}><AuthorityDashboard /></ProtectedRoute>} />
        <Route path="/authority/issues" element={<ProtectedRoute allowedRoles={['department_admin', 'super_admin']}><IssueQueue /></ProtectedRoute>} />
        <Route path="/authority/issues/:id" element={<ProtectedRoute allowedRoles={['department_admin', 'super_admin']}><IssueDetail /></ProtectedRoute>} />
        <Route path="/authority/map" element={<ProtectedRoute allowedRoles={['department_admin', 'super_admin']}><CityMap /></ProtectedRoute>} />
        <Route path="/authority/analytics" element={<ProtectedRoute allowedRoles={['department_admin', 'super_admin']}><CityAnalytics /></ProtectedRoute>} />
        <Route path="/authority/settings" element={<ProtectedRoute allowedRoles={['department_admin', 'super_admin']}><AdminSettings /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
