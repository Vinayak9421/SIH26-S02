import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { CitizenAppBar } from '../../components/layout'
import { StatusBadge, PriorityBadge, CategoryBadge, AiTag } from '../../components/ui'
import { useMyComplaints, useNearbyIssues } from '../../hooks/useApi'
import { useAuthStore } from '../../store/authStore'

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: i => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.3, ease: 'easeOut' } }),
}

const PRIORITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#3b82f6',
  low: '#10b981',
}

export default function CitizenDashboard() {
  const navigate = useNavigate()
  const { name } = useAuthStore()
  const { data: complaints, isLoading } = useMyComplaints()
  const { data: nearbyIssues, isLoading: isMapLoading } = useNearbyIssues()
  const [showMap, setShowMap] = useState(true)

  const pending = (complaints || []).filter(c => c.status === 'pending').length
  const inProgress = (complaints || []).filter(c => c.status === 'in_progress').length
  const resolved = (complaints || []).filter(c => c.status === 'resolved').length

  const unratedResolved = (complaints || []).filter(c => c.status === 'resolved' && !c.satisfaction_rating)

  const statusChips = [
    ...(pending > 0 ? [{ label: `${pending} Pending Triage`, color: 'bg-indigo-50 text-indigo-700 border-indigo-200/80', icon: 'pending_actions' }] : []),
    ...(inProgress > 0 ? [{ label: `${inProgress} In Progress`, color: 'bg-amber-50 text-amber-800 border-amber-200/80', icon: 'hourglass_top' }] : []),
    ...(resolved > 0 ? [{ label: `${resolved} Resolved`, color: 'bg-emerald-50 text-emerald-800 border-emerald-200/80', icon: 'check_circle' }] : []),
  ]

  const trendingIssues = (nearbyIssues || [])
    .filter(iss => iss.status !== 'resolved')
    .slice(0, 3)

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      <CitizenAppBar />
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Welcome Section */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent">
                Welcome back, {name || 'Citizen'} 👋
              </h1>
              <p className="text-sm md:text-base text-slate-600 mt-1 font-medium">
                Track your submitted grievances and monitor live civic resolution status across your neighborhood.
              </p>
            </div>
            <button
              onClick={() => navigate('/citizen/submit')}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 transition-all flex items-center gap-2 self-start sm:self-auto shrink-0"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add_circle</span>
              New Complaint
            </button>
          </div>

          {/* Unrated Resolved Alert Banner */}
          {unratedResolved.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs shrink-0">
                  <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>task_alt</span>
                </div>
                <div>
                  <p className="text-sm md:text-base font-bold text-emerald-950">
                    Good news! {unratedResolved.length === 1 ? 'One of your complaints has been resolved' : `${unratedResolved.length} complaints have been resolved`}
                  </p>
                  <p className="text-xs md:text-sm text-emerald-700 font-medium">
                    Rate the resolution quality or download your official digital receipt.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/citizen/track/${unratedResolved[0].id}`)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-xs shrink-0"
              >
                Rate & View
              </button>
            </motion.div>
          )}

          {statusChips.length > 0 && (
            <div className="flex flex-wrap gap-2.5">
              {statusChips.map(chip => (
                <div key={chip.label} className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border ${chip.color} shadow-xs`}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{chip.icon}</span>
                  {chip.label}
                </div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Live City Map & Nearby Issues Widget */}
        <section className="glass-card rounded-3xl p-6 space-y-4 border border-slate-200/80 bg-white/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>explore</span>
              </div>
              <div>
                <h2 className="text-base md:text-lg font-bold text-slate-900">Community Civic Map</h2>
                <p className="text-xs text-slate-500 font-medium">Live anonymized spatial reports in your surrounding area</p>
              </div>
            </div>
            <button
              onClick={() => setShowMap(!showMap)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-all"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                {showMap ? 'expand_less' : 'expand_more'}
              </span>
              {showMap ? 'Hide Map' : 'Show Map'}
            </button>
          </div>

          {showMap && (
            <div className="h-72 w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative z-0">
              {isMapLoading ? (
                <div className="h-full w-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-500">
                  Loading map markers...
                </div>
              ) : (
                <MapContainer
                  center={[19.2087, 72.9716]}
                  zoom={12}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {(nearbyIssues || []).map((iss) => (
                    <CircleMarker
                      key={iss.id}
                      center={[iss.latitude || 19.2087, iss.longitude || 72.9716]}
                      radius={iss.priority === 'critical' ? 10 : 7}
                      pathOptions={{
                        color: PRIORITY_COLORS[iss.priority] || '#3b82f6',
                        fillColor: PRIORITY_COLORS[iss.priority] || '#3b82f6',
                        fillOpacity: 0.8,
                        weight: 2,
                      }}
                    >
                      <Popup>
                        <div className="p-2 space-y-1.5 font-sans min-w-[180px]">
                          <div className="font-bold text-sm text-slate-800">{iss.title}</div>
                          <div className="flex items-center gap-1.5">
                            <CategoryBadge category={iss.category} />
                            <PriorityBadge priority={iss.priority} />
                          </div>
                          <p className="text-xs text-slate-500 font-medium">📍 {iss.address || 'Reported Location'}</p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              )}
            </div>
          )}
        </section>

        {/* My Complaints List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-bold text-slate-900">My Submitted Complaints</h2>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {(complaints || []).length} Total
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="glass-card rounded-2xl p-5 animate-pulse h-32 bg-slate-100" />
              ))}
            </div>
          ) : (complaints || []).length > 0 ? (
            <div className="space-y-3.5">
              {(complaints || []).map((c, i) => (
                <motion.div
                  key={c.id}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  onClick={() => navigate(`/citizen/track/${c.id}`)}
                  className="glass-card rounded-2xl p-5 hover:shadow-lg transition-all cursor-pointer border border-slate-200/80 bg-white/90 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                        #{c.id.slice(-6).toUpperCase()}
                      </span>
                      <CategoryBadge category={c.ai_category || c.category} />
                      <PriorityBadge priority={c.priority} />
                      <StatusBadge status={c.status?.replace(/_/g, ' ')} />
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {c.text}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                      <span>📍 {c.address || 'Location on map'}</span>
                      <span>•</span>
                      <span>{new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                    <button className="flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                      Track Live <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-3xl p-12 text-center space-y-3 bg-white/80 border border-slate-200/80">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
                <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>post_add</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">No Complaints Submitted Yet</h3>
              <p className="text-xs md:text-sm text-slate-500 max-w-md mx-auto font-medium">
                Notice a broken streetlight, pothole, or garbage pile? Report it and our AI will immediately route it to the right department.
              </p>
              <button
                onClick={() => navigate('/citizen/submit')}
                className="mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs md:text-sm px-5 py-2.5 rounded-xl shadow-md transition-all"
              >
                Submit First Complaint
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
