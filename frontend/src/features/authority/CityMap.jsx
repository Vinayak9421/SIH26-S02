import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthorityLayout } from '../../components/layout'
import { PriorityBadge, CategoryBadge } from '../../components/ui'
import { useMapIssues, useMapHotspots, useDepartments } from '../../hooks/useApi'
import { useAuthStore } from '../../store/authStore'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const PRIORITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#3b82f6',
  low: '#10b981',
}

const PRIORITY_FILL_OPACITY = {
  critical: 0.65,
  high: 0.55,
  medium: 0.45,
  low: 0.35,
}

function FitBounds({ markers }) {
  const map = useMap()
  useEffect(() => {
    if (markers && markers.length > 0) {
      const validMarkers = markers.filter(m => m.latitude && m.longitude)
      const bounds = validMarkers.map(m => [m.latitude, m.longitude])
      if (bounds.length > 0) {
        try {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 })
        } catch (_) {}
      }
    }
  }, [markers, map])
  return null
}

const FILTERS = {
  priorities: ['All', 'Critical', 'High', 'Medium', 'Low'],
}

export default function CityMap() {
  const navigate = useNavigate()
  const { role, departmentKey } = useAuthStore()
  const isSuperAdmin = role === 'super_admin'

  const [filterDept, setFilterDept] = useState('All')
  const [filterPriority, setFilterPriority] = useState('All')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const { data: departments } = useDepartments()

  const effectiveDept = isSuperAdmin
    ? (filterDept !== 'All' ? filterDept : null)
    : departmentKey

  const { data: mapIssues, isLoading } = useMapIssues(effectiveDept)
  const { data: hotspots } = useMapHotspots(effectiveDept)

  // Client-side priority filter
  const filtered = (mapIssues || []).filter(m => {
    if (filterPriority === 'All') return true
    return m.priority?.toLowerCase() === filterPriority.toLowerCase()
  })

  const severityColor = (priority) => PRIORITY_COLORS[priority?.toLowerCase()] || '#3b82f6'
  const markerRadius = (count) => Math.max(10, Math.min(36, 8 + count * 3))

  return (
    <AuthorityLayout>
      <div className="space-y-4 font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>map</span>
              </span>
              <h1 className="text-2xl font-extrabold bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent">
                GIS Spatial Intelligence Map
              </h1>
            </div>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              {isLoading ? 'Geocoding active points…' : `${filtered.length} geo-pinned active issue clusters`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              OpenCage Geocoded
            </span>
          </div>
        </div>

        <div className="flex gap-4" style={{ height: 'calc(100vh - 210px)' }}>
          {/* Sidebar filters */}
          {sidebarOpen && (
            <div className="w-72 shrink-0 glass-card rounded-3xl p-5 space-y-4 overflow-y-auto border border-slate-200/80 bg-white/90 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-indigo-600" style={{ fontSize: '18px' }}>tune</span>
                  GIS Map Filters
                </h3>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                </button>
              </div>

              {/* Department filter (super admin only) */}
              {isSuperAdmin && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Filter Department</label>
                  <select
                    value={filterDept}
                    onChange={e => setFilterDept(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="All">All Municipal Departments</option>
                    {(departments || []).map(d => (
                      <option key={d.category_key} value={d.category_key}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Priority filter */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Filter Severity Level</label>
                <select
                  value={filterPriority}
                  onChange={e => setFilterPriority(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {FILTERS.priorities.map(p => <option key={p} value={p}>{p === 'All' ? 'All Severity Levels' : `${p} Priority`}</option>)}
                </select>
              </div>

              {/* Priority Legend */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <p className="text-xs font-bold text-slate-700">Severity Heat Legend</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(PRIORITY_COLORS).map(([sev, color]) => (
                    <div key={sev} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs" style={{ background: color }} />
                      <span className="text-xs font-bold text-slate-700 capitalize">{sev}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hotspot Summary */}
              {hotspots && hotspots.length > 0 && (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <p className="text-xs font-bold text-slate-700">Top Geographic Hotspots</p>
                  <div className="space-y-2">
                    {hotspots.slice(0, 4).map((h) => (
                      <div key={h.hotspot_key} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-900 capitalize">{h.dominant_category?.replace(/_/g, ' ')}</p>
                          <p className="text-[11px] text-indigo-600 font-semibold">{h.count} citizen complaints</p>
                        </div>
                        <PriorityBadge priority={h.highest_priority?.charAt(0).toUpperCase() + h.highest_priority?.slice(1)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Map Container */}
          <div className="flex-1 glass-card rounded-3xl overflow-hidden relative border border-slate-200/80 bg-white/90 shadow-sm z-0">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="absolute top-4 left-4 z-[1000] bg-white rounded-2xl p-2.5 shadow-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all"
                title="Open Filters"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>tune</span>
              </button>
            )}

            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-slate-50">
                <div className="text-center space-y-2">
                  <span className="material-symbols-outlined animate-spin text-indigo-600 text-4xl">progress_activity</span>
                  <p className="text-sm font-bold text-slate-700">Loading spatial GIS markers from NeonDB…</p>
                </div>
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
                <FitBounds markers={filtered} />
                {filtered.map(issue => (
                  <CircleMarker
                    key={issue.id}
                    center={[issue.latitude || 19.2087, issue.longitude || 72.9716]}
                    radius={markerRadius(issue.complaint_count)}
                    pathOptions={{
                      color: severityColor(issue.priority),
                      fillColor: severityColor(issue.priority),
                      fillOpacity: PRIORITY_FILL_OPACITY[issue.priority?.toLowerCase()] || 0.45,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="p-3 min-w-[220px] font-sans space-y-2">
                        <span className="text-[11px] font-bold text-slate-400 block">{issue.address || 'Reported Point'}</span>
                        <h4 className="font-bold text-sm text-slate-900 leading-snug">{issue.title}</h4>
                        <div className="flex items-center gap-1.5">
                          <CategoryBadge category={issue.category} />
                          <PriorityBadge priority={issue.priority} />
                        </div>
                        <p className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md">
                          {issue.complaint_count} citizen report{issue.complaint_count !== 1 ? 's' : ''} in cluster
                        </p>
                        <button
                          onClick={() => navigate(`/authority/issues/${issue.id}`)}
                          className="w-full mt-2 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                        >
                          Open Issue Details →
                        </button>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            )}
          </div>
        </div>
      </div>
    </AuthorityLayout>
  )
}
