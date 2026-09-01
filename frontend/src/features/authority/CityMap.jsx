import { useState } from 'react'
import { AuthorityLayout } from '../../components/layout'
import { PriorityBadge } from '../../components/ui'

const markers = [
  { id: 1, x: '25%', y: '40%', size: 60, severity: 'critical', label: 'Ward 12', count: 24, title: 'Missed Garbage Collection' },
  { id: 2, x: '55%', y: '35%', size: 44, severity: 'critical', label: 'Sector 7', count: 18, title: 'Broken Sewer Line' },
  { id: 3, x: '70%', y: '55%', size: 52, severity: 'high', label: 'MG Road', count: 31, title: 'Multiple Potholes' },
  { id: 4, x: '40%', y: '65%', size: 36, severity: 'high', label: 'Ward 5', count: 15, title: 'Street Lights Outage' },
  { id: 5, x: '60%', y: '20%', size: 28, severity: 'medium', label: 'Central Park', count: 9, title: 'Overflowing Drain' },
  { id: 6, x: '20%', y: '70%', size: 24, severity: 'low', label: 'Zone B', count: 5, title: 'Broken Bench' },
]

const severityColor = {
  critical: 'rgba(186,26,26,',
  high:     'rgba(230,81,0,',
  medium:   'rgba(0,77,153,',
  low:      'rgba(46,125,50,',
}

const severityPinColor = {
  critical: '#ba1a1a',
  high:     '#e65100',
  medium:   '#004d99',
  low:      '#2e7d32',
}

const filters = [
  { label: 'All Categories', key: 'category', options: ['All', 'Sanitation', 'Roads', 'Water', 'Electricity', 'Drainage'] },
  { label: 'All Priorities', key: 'priority', options: ['All', 'Critical', 'High', 'Medium', 'Low'] },
  { label: 'All Statuses', key: 'status', options: ['All', 'Open', 'In Progress', 'Resolved'] },
]

export default function CityMap() {
  const [activeTab, setActiveTab] = useState('map')
  const [selectedMarker, setSelectedMarker] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <AuthorityLayout>
      <div className="space-y-md">
        {/* Header with tabs */}
        <div className="flex items-center justify-between">
          <h1 className="text-headline-lg text-on-surface font-semibold">Map & Analytics</h1>
          <div className="flex border border-outline-variant rounded-lg overflow-hidden">
            {['map', 'analytics'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-md py-sm text-label-md font-semibold capitalize transition-colors ${activeTab === tab ? 'bg-primary-container text-on-primary' : 'bg-white text-on-surface-variant hover:bg-surface-container'}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'map' && (
          <div className="flex gap-md h-[calc(100vh-220px)]">
            {/* Sidebar filters */}
            {sidebarOpen && (
              <div className="w-56 shrink-0 glass-card rounded-xl p-md space-y-md overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h3 className="text-body-md text-on-surface font-semibold">Filters</h3>
                  <button onClick={() => setSidebarOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                  </button>
                </div>
                {filters.map(f => (
                  <div key={f.key} className="space-y-xs">
                    <label className="text-label-md text-on-surface-variant">{f.label}</label>
                    <select className="w-full border border-outline-variant rounded-md bg-white px-sm py-[7px] text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container">
                      {f.options.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
                <div className="space-y-xs">
                  <label className="text-label-md text-on-surface-variant">Date Range</label>
                  <select className="w-full border border-outline-variant rounded-md bg-white px-sm py-[7px] text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container">
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 3 months</option>
                  </select>
                </div>
                {/* Legend */}
                <div className="space-y-xs border-t border-outline-variant/20 pt-sm">
                  <p className="text-label-md text-on-surface-variant">Legend</p>
                  {Object.entries(severityColor).map(([sev, color]) => (
                    <div key={sev} className="flex items-center gap-sm">
                      <div className="w-4 h-4 rounded-full" style={{ background: color + '0.7)' }} />
                      <span className="text-body-sm text-on-surface capitalize">{sev}</span>
                    </div>
                  ))}
                  <p className="text-body-sm text-on-surface-variant mt-xs">Circle size = complaint count</p>
                </div>
              </div>
            )}

            {/* Map area */}
            <div className="flex-1 glass-card rounded-xl overflow-hidden relative">
              {!sidebarOpen && (
                <button onClick={() => setSidebarOpen(true)} className="absolute top-md left-md z-10 bg-white rounded-md p-sm shadow-card border border-outline-variant hover:shadow-card-hover transition-all">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>tune</span>
                </button>
              )}
              {/* Map background */}
              <div className="w-full h-full bg-gradient-to-br from-blue-50 via-blue-100 to-green-50 relative overflow-hidden">
                {/* Grid */}
                <div className="absolute inset-0 opacity-25" style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, #93c5fd 0, #93c5fd 1px, transparent 0, transparent 40px), repeating-linear-gradient(90deg, #93c5fd 0, #93c5fd 1px, transparent 0, transparent 40px)',
                  backgroundSize: '40px 40px'
                }} />
                {/* Roads */}
                <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.2 }}>
                  <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#93c5fd" strokeWidth="3" />
                  <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#93c5fd" strokeWidth="3" />
                  <line x1="0" y1="30%" x2="100%" y2="70%" stroke="#93c5fd" strokeWidth="1.5" />
                  <line x1="0" y1="70%" x2="100%" y2="30%" stroke="#93c5fd" strokeWidth="1.5" />
                </svg>

                {/* Hotspot markers */}
                {markers.map(m => (
                  <div key={m.id} className="absolute" style={{ left: m.x, top: m.y, transform: 'translate(-50%,-50%)' }}>
                    {/* Pulsing circle */}
                    <div className="absolute rounded-full animate-ping" style={{
                      width: m.size, height: m.size, left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
                      background: severityColor[m.severity] + '0.2)',
                    }} />
                    <div className="relative rounded-full cursor-pointer transition-all hover:scale-110"
                      style={{ width: m.size, height: m.size, background: severityColor[m.severity] + '0.35)' }}
                      onClick={() => setSelectedMarker(m)}
                    >
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-body-sm font-bold" style={{ color: severityPinColor[m.severity] }}>{m.count}</span>
                      </div>
                    </div>
                    <p className="text-center text-body-sm font-semibold" style={{ color: severityPinColor[m.severity], whiteSpace: 'nowrap', marginTop: '2px' }}>{m.label}</p>
                  </div>
                ))}

                {/* Popup */}
                {selectedMarker && (
                  <div className="absolute z-20 bg-white rounded-xl shadow-modal border border-outline-variant/20 p-md w-56"
                    style={{ left: selectedMarker.x, top: selectedMarker.y, transform: 'translate(-50%, calc(-100% - 16px))' }}
                  >
                    <button onClick={() => setSelectedMarker(null)} className="absolute top-sm right-sm text-on-surface-variant hover:text-on-surface">
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                    </button>
                    <p className="text-body-sm text-on-surface-variant font-medium">{selectedMarker.label}</p>
                    <p className="text-body-md text-on-surface font-semibold mt-xs">{selectedMarker.title}</p>
                    <p className="text-body-sm text-on-surface-variant mt-xs">{selectedMarker.count} linked complaints</p>
                    <PriorityBadge priority={selectedMarker.severity.charAt(0).toUpperCase() + selectedMarker.severity.slice(1)} className="mt-sm" />
                    <button className="text-primary-container text-label-md font-semibold hover:underline mt-sm block">Open Issue →</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="text-center py-xl text-on-surface-variant">
            <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>bar_chart</span>
            <p className="text-body-lg mt-sm">Switch to Analytics tab from the Analytics page.</p>
          </div>
        )}
      </div>
    </AuthorityLayout>
  )
}
