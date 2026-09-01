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
  visible: i => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.32, ease: 'easeOut' } }),
}

const PRIORITY_COLORS = {
  critical: '#ba1a1a',
  high: '#e65100',
  medium: '#1565c0',
  low: '#2e7d32',
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

  // Check for resolved complaints that citizen can rate
  const unratedResolved = (complaints || []).filter(c => c.status === 'resolved' && !c.satisfaction_rating)

  const statusChips = [
    ...(pending > 0 ? [{ label: `${pending} Pending`, color: 'bg-blue-50 text-blue-700 border-blue-200', icon: 'pending_actions' }] : []),
    ...(inProgress > 0 ? [{ label: `${inProgress} In Progress`, color: 'bg-orange-50 text-orange-700 border-orange-200', icon: 'hourglass_top' }] : []),
    ...(resolved > 0 ? [{ label: `${resolved} Resolved`, color: 'bg-green-50 text-green-700 border-green-200', icon: 'check_circle' }] : []),
  ]

  // Top 3 active issues in the city for "Trending Issues"
  const trendingIssues = (nearbyIssues || [])
    .filter(iss => iss.status !== 'resolved')
    .slice(0, 3)

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <CitizenAppBar />
      <main className="max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop py-lg space-y-lg">
        {/* Welcome section */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm">
            <div>
              <h1 className="text-headline-lg text-on-surface font-semibold">Welcome back, {name || 'Citizen'} 👋</h1>
              <p className="text-body-md text-on-surface-variant mt-xs">Track your complaints and view live civic reports across your area.</p>
            </div>
            <button
              onClick={() => navigate('/citizen/submit')}
              className="bg-primary-container text-on-primary text-label-md font-semibold px-md py-sm rounded-xl hover:shadow-md hover:-translate-y-px transition-all flex items-center gap-xs self-start sm:self-auto"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
              New Complaint
            </button>
          </div>

          {/* Unrated Resolved Alert Banner */}
          {unratedResolved.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 border border-emerald-200 rounded-xl p-md flex items-center justify-between gap-md shadow-sm"
            >
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-emerald-600" style={{ fontSize: '24px', fontVariationSettings: "'FILL' 1" }}>
                  task_alt
                </span>
                <div>
                  <p className="text-body-md font-semibold text-emerald-950">
                    Good news! {unratedResolved.length === 1 ? 'One of your complaints has been resolved' : `${unratedResolved.length} complaints have been resolved`}
                  </p>
                  <p className="text-body-sm text-emerald-800">
                    Please share your satisfaction feedback or download your official resolution receipt.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/citizen/track/${unratedResolved[0].id}`)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-label-md font-semibold px-md py-xs rounded-lg transition-colors whitespace-nowrap"
              >
                Rate & View
              </button>
            </motion.div>
          )}

          {statusChips.length > 0 && (
            <div className="flex flex-wrap gap-sm">
              {statusChips.map(chip => (
                <div key={chip.label} className={`flex items-center gap-xs px-md py-sm rounded-full text-label-md font-semibold border ${chip.color} shadow-sm`}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>{chip.icon}</span>
                  {chip.label}
                </div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Live City Map & Trending Issues Widget */}
        <section className="glass-card rounded-xl p-md space-y-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary-container" style={{ fontSize: '22px', fontVariationSettings: "'FILL' 1" }}>
                explore
              </span>
              <div>
                <h2 className="text-headline-md text-on-surface font-semibold">Civic Issues Near You</h2>
                <p className="text-body-sm text-on-surface-variant">Live anonymized map of community-reported civic issues</p>
              </div>
            </div>
            <button
              onClick={() => setShowMap(!showMap)}
              className="text-label-md text-primary-container font-semibold hover:underline flex items-center gap-xs"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                {showMap ? 'expand_less' : 'expand_more'}
              </span>
              {showMap ? 'Hide Map' : 'Show Map'}
            </button>
          </div>

          {showMap && (
            <div className="h-64 w-full rounded-lg overflow-hidden border border-outline-variant/30 relative">
              {isMapLoading ? (
                <div className="h-full w-full bg-slate-100 flex items-center justify-center text-body-sm text-slate-500">
                  Loading map...
                </div>
              ) : (
                <MapContainer
                  center={[28.6139, 77.209]}
                  zoom={12}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {(nearbyIssues || []).map((iss) => (
                    <CircleMarker
                      key={iss.id}
                      center={[iss.latitude || 28.6139, iss.longitude || 77.209]}
                      radius={iss.complaint_count > 1 ? 9 : 6}
                      pathOptions={{
                        color: PRIORITY_COLORS[iss.priority] || '#1565c0',
                        fillColor: PRIORITY_COLORS[iss.priority] || '#1565c0',
                        fillOpacity: 0.6,
                        weight: 2,
                      }}
                    >
                      <Popup>
                        <div className="p-1 space-y-1 text-xs max-w-[200px]">
                          <p className="font-bold text-slate-800 leading-tight">{iss.title}</p>
                          <div className="flex items-center justify-between text-slate-500">
                            <span className="capitalize font-semibold">{iss.category?.replace(/_/g, ' ')}</span>
                            <span className="capitalize">{iss.status?.replace(/_/g, ' ')}</span>
                          </div>
                          {iss.complaint_count > 1 && (
                            <p className="text-blue-700 font-semibold">{iss.complaint_count} citizens reported this</p>
                          )}
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              )}
            </div>
          )}

          {/* Trending Issues Near Me List */}
          {trendingIssues.length > 0 && (
            <div className="space-y-sm pt-xs">
              <h3 className="text-body-sm font-semibold text-on-surface-variant flex items-center gap-xs">
                <span className="material-symbols-outlined text-orange-500" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>
                  trending_up
                </span>
                Trending Issues in Your City
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-sm">
                {trendingIssues.map((iss) => (
                  <div key={iss.id} className="bg-slate-50 border border-outline-variant/30 rounded-lg p-sm space-y-xs">
                    <div className="flex items-center justify-between">
                      <CategoryBadge category={iss.category?.replace(/_/g, ' ')} />
                      <span className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-xs py-[1px] rounded">
                        {iss.complaint_count} reports
                      </span>
                    </div>
                    <p className="text-body-sm font-medium text-on-surface line-clamp-2">{iss.title}</p>
                    <p className="text-[11px] text-on-surface-variant truncate">
                      {iss.address || 'GPS verified location'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Complaints list */}
        <section className="space-y-md">
          <h2 className="text-headline-md text-on-surface font-semibold">Your Submitted Complaints</h2>

          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-card rounded-xl p-md animate-pulse h-28" />
            ))
          ) : (complaints || []).length === 0 ? (
            <div className="glass-card rounded-xl p-xl text-center">
              <span className="material-symbols-outlined block mx-auto text-on-surface-variant mb-sm" style={{ fontSize: '48px' }}>inbox</span>
              <h3 className="text-headline-md text-on-surface font-semibold">No complaints yet</h3>
              <p className="text-body-md text-on-surface-variant mt-xs">Submit your first civic complaint and our AI will handle the rest.</p>
              <button
                onClick={() => navigate('/citizen/submit')}
                className="mt-md bg-primary-container text-on-primary text-label-md font-semibold px-lg py-sm rounded-xl hover:shadow-md transition-all"
              >
                Submit a Complaint
              </button>
            </div>
          ) : (complaints || []).map((c, i) => (
            <motion.div
              key={c.id}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className={`glass-card rounded-xl p-md group cursor-pointer ${c.status === 'resolved' ? 'border-l-4 border-l-green-500' : ''}`}
              onClick={() => navigate(`/citizen/track/${c.id}`)}
            >
              <div className="flex flex-col gap-sm w-full">
                <div className="flex justify-between items-start gap-sm">
                  <div>
                    <span className="text-body-sm text-on-surface-variant font-medium mr-sm font-mono">#{c.id?.slice(0, 8)}</span>
                    <h3 className="text-headline-md text-on-surface font-semibold mt-[2px] line-clamp-2">{c.text}</h3>
                  </div>
                  <StatusBadge status={c.status?.replace(/_/g, ' ')} className="shrink-0" />
                </div>

                <div className="flex flex-wrap items-center gap-sm">
                  {c.category && <CategoryBadge category={c.category.replace(/_/g, ' ')} />}
                  <PriorityBadge priority={c.priority?.charAt(0).toUpperCase() + c.priority?.slice(1)} />
                  {c.department && <AiTag label={c.department} confidence={null} />}
                  {c.image_url && (
                    <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 font-semibold px-sm py-[2px] rounded-full flex items-center gap-[2px]">
                      <span className="material-symbols-outlined text-[14px]">image</span>
                      Photo Attached
                    </span>
                  )}
                  {c.satisfaction_rating && (
                    <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 font-semibold px-sm py-[2px] rounded-full flex items-center gap-[2px]">
                      <span className="material-symbols-outlined text-[14px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      {c.satisfaction_rating}/5 Rated
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-sm border-t border-outline-variant/30">
                  <div className="flex items-center gap-xs text-on-surface-variant text-body-sm">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>calendar_today</span>
                    {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {c.address && (
                      <span className="flex items-center gap-[2px]">
                        · <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>location_on</span>
                        <span className="max-w-[140px] truncate">{c.address}</span>
                      </span>
                    )}
                  </div>
                  <button className="text-primary-container text-label-md font-semibold hover:underline flex items-center gap-[3px] transition-all">
                    View & Track
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform" style={{ fontSize: '16px' }}>arrow_forward</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </section>
      </main>
    </div>
  )
}

