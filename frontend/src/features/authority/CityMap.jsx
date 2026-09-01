import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthorityLayout } from '../../components/layout'
import { PriorityBadge } from '../../components/ui'
import { useMapIssues, useMapHotspots, useDepartments } from '../../hooks/useApi'
import { useAuthStore } from '../../store/authStore'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const PRIORITY_COLORS = {
  critical: '#ba1a1a',
  high: '#e65100',
  medium: '#1565c0',
  low: '#2e7d32',
}

const PRIORITY_FILL_OPACITY = {
  critical: 0.55,
  high: 0.45,
  medium: 0.35,
  low: 0.25,
}

function FitBounds({ markers }) {
  const map = useMap()
  useEffect(() => {
    if (markers && markers.length > 0) {
      const bounds = markers.map(m => [m.latitude, m.longitude])
      if (bounds.length > 0) {
        try {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 })
        } catch (_) {}
      }
    }
  }, [markers, map])
  return null
}

const FILTERS = {
  priorities: ['All', 'Critical', 'High', 'Medium', 'Low'],
  statuses: ['All', 'Open', 'In Progress'],
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

  const severityColor = (priority) => PRIORITY_COLORS[priority?.toLowerCase()] || '#888'

  const markerRadius = (count) => Math.max(10, Math.min(40, count * 2))

  return (
    <AuthorityLayout>
      <div className="space-y-md">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-headline-lg text-on-surface font-semibold">Live City Heatmap</h1>
            <p className="text-body-md text-on-surface-variant mt-xs">
              {isLoading ? 'Loading map data…' : `${filtered.length} active issue${filtered.length !== 1 ? 's' : ''} on map`}
            </p>
          </div>
          <div className="flex items-center gap-sm">
            <span className="text-body-sm text-on-surface-variant">Powered by OpenStreetMap · Nominatim</span>
          </div>
        </div>

        <div className="flex gap-md" style={{ height: 'calc(100vh - 220px)' }}>
          {/* Sidebar filters */}
          {sidebarOpen && (
            <div className="w-60 shrink-0 glass-card rounded-xl p-md space-y-md overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-body-md text-on-surface font-semibold">Filters</h3>
                <button onClick={() => setSidebarOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                </button>
              </div>

              {/* Department filter (super admin only) */}
              {isSuperAdmin && (
                <div className="space-y-xs">
                  <label className="text-label-md text-on-surface-variant">Department</label>
                  <select
                    value={filterDept}
                    onChange={e => setFilterDept(e.target.value)}
                    className="w-full border border-outline-variant rounded-md bg-white px-sm py-[7px] text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
                  >
                    <option value="All">All Departments</option>
                    {(departments || []).map(d => (
                      <option key={d.category_key} value={d.category_key}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Priority filter */}
              <div className="space-y-xs">
                <label className="text-label-md text-on-surface-variant">Priority</label>
                <select
                  value={filterPriority}
                  onChange={e => setFilterPriority(e.target.value)}
                  className="w-full border border-outline-variant rounded-md bg-white px-sm py-[7px] text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
                >
                  {FILTERS.priorities.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>

              {/* Legend */}
              <div className="space-y-xs border-t border-outline-variant/20 pt-sm">
                <p className="text-label-md text-on-surface-variant">Legend</p>
                {Object.entries(PRIORITY_COLORS).map(([sev, color]) => (
                  <div key={sev} className="flex items-center gap-sm">
                    <div className="w-4 h-4 rounded-full" style={{ background: color }} />
                    <span className="text-body-sm text-on-surface capitalize">{sev}</span>
                  </div>
                ))}
                <p className="text-body-sm text-on-surface-variant mt-xs">Circle size = complaint count</p>
              </div>

              {/* Hotspot summary */}
              {hotspots && hotspots.length > 0 && (
                <div className="space-y-xs border-t border-outline-variant/20 pt-sm">
                  <p className="text-label-md text-on-surface-variant">Top Hotspots</p>
                  {hotspots.slice(0, 5).map((h, i) => (
                    <div key={h.hotspot_key} className="flex items-center justify-between py-xs">
                      <div>
                        <p className="text-body-sm font-medium text-on-surface capitalize">{h.dominant_category?.replace(/_/g, ' ')}</p>
                        <p className="text-body-sm text-on-surface-variant">{h.count} reports</p>
                      </div>
                      <PriorityBadge priority={h.highest_priority?.charAt(0).toUpperCase() + h.highest_priority?.slice(1)} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Map container */}
          <div className="flex-1 glass-card rounded-xl overflow-hidden relative">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)}
                className="absolute top-md left-md z-[1000] bg-white rounded-md p-sm shadow-card border border-outline-variant hover:shadow-card-hover transition-all">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>tune</span>
              </button>
            )}

            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-surface-container-low">
                <div className="text-center">
                  <span className="material-symbols-outlined animate-spin block mx-auto text-primary-container" style={{ fontSize: '40px' }}>progress_activity</span>
                  <p className="text-body-md text-on-surface-variant mt-sm">Loading map data from NeonDB…</p>
                </div>
              </div>
            ) : (
              <MapContainer
                center={[28.6139, 77.2090]}
                zoom={11}
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
                    center={[issue.latitude, issue.longitude]}
                    radius={markerRadius(issue.complaint_count)}
                    pathOptions={{
                      color: severityColor(issue.priority),
                      fillColor: severityColor(issue.priority),
                      fillOpacity: PRIORITY_FILL_OPACITY[issue.priority?.toLowerCase()] || 0.35,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="min-w-[180px]">
                        <p className="text-xs text-gray-500 mb-1">{issue.address || 'Location'}</p>
                        <p className="font-semibold text-sm mb-1">{issue.title}</p>
                        <p className="text-xs text-gray-600">{issue.complaint_count} complaint{issue.complaint_count !== 1 ? 's' : ''}</p>
                        <p className="text-xs capitalize mt-1">
                          <span className="font-medium">Priority:</span> {issue.priority}
                        </p>
                        <button
                          onClick={() => navigate(`/authority/issues/${issue.id}`)}
                          className="mt-2 text-xs text-blue-600 hover:underline font-semibold"
                        >
                          Open Issue →
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
