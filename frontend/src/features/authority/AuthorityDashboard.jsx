import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AuthorityLayout } from '../../components/layout'
import { KpiCard, AiTag, PriorityBadge, StatusBadge } from '../../components/ui'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const kpis = [
  { title: 'Open Issues',      value: '142', trend: '+8 today',  trendUp: false, icon: 'folder_open',     color: 'blue'   },
  { title: 'Critical',         value: '12',  trend: '-2 today',  trendUp: true,  icon: 'priority_high',   color: 'red'    },
  { title: 'High Priority',    value: '48',  trend: '+3 today',  trendUp: false, icon: 'report',          color: 'orange' },
  { title: 'Resolved Today',   value: '24',  trend: '+6 today',  trendUp: true,  icon: 'check_circle',    color: 'green'  },
]

const criticalIssues = [
  { id: 'ISS-441', title: 'Missed Garbage Collection Ward 12', complaints: 24, priority: 'Critical', dept: 'Waste Management', location: 'Ward 12, Delhi', status: 'Open' },
  { id: 'ISS-389', title: 'Broken Sewer Line Sector 7', complaints: 18, priority: 'Critical', dept: 'Water Supply', location: 'Sector 7, Delhi', status: 'Open' },
  { id: 'ISS-402', title: 'Multiple Potholes on MG Road', complaints: 31, priority: 'High', dept: 'Roads', location: 'MG Road, Delhi', status: 'In Progress' },
  { id: 'ISS-417', title: 'Street Lights Outage Ward 5', complaints: 15, priority: 'High', dept: 'Electricity', location: 'Ward 5, Delhi', status: 'Open' },
  { id: 'ISS-455', title: 'Overflowing Drain near Park', complaints: 9, priority: 'Medium', dept: 'Drainage', location: 'Central Park', status: 'In Progress' },
]

const deptData = [
  { name: 'Waste', issues: 34 },
  { name: 'Roads', issues: 28 },
  { name: 'Water', issues: 22 },
  { name: 'Electricity', issues: 18 },
  { name: 'Drainage', issues: 14 },
]

const statusData = [
  { name: 'Open', value: 58, color: '#ba1a1a' },
  { name: 'In Progress', value: 29, color: '#e65100' },
  { name: 'Resolved', value: 13, color: '#2e7d32' },
]

const recentAIDecisions = [
  { id: '#4521', text: "auto-linked to Issue 'Missed collection, Ward 12'", time: '2 min ago' },
  { id: '#4498', text: "prioritized as Critical due to health risk near school", time: '15 min ago' },
  { id: '#4476', text: "merged with Issue 'Pothole cluster, MG Road'", time: '1 hr ago' },
  { id: '#4451', text: "routed to Water Supply Dept (confidence: 97%)", time: '2 hr ago' },
]

export default function AuthorityDashboard() {
  const navigate = useNavigate()

  return (
    <AuthorityLayout>
      <div className="space-y-lg">
        {/* Page title */}
        <div>
          <h1 className="text-headline-lg text-on-surface font-semibold">Authority Dashboard</h1>
          <p className="text-body-md text-on-surface-variant mt-xs">Real-time city-wide civic issue management</p>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
          {kpis.map(kpi => <KpiCard key={kpi.title} {...kpi} />)}
        </div>

        {/* Main 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
          {/* Left: Critical Issue Queue */}
          <div className="lg:col-span-2 glass-card rounded-xl overflow-hidden">
            <div className="px-md py-sm border-b border-outline-variant/20 flex items-center justify-between">
              <h2 className="text-headline-md text-on-surface font-semibold">Critical / High Priority Issue Queue</h2>
              <button onClick={() => navigate('/authority/issues')} className="text-primary-container text-label-md font-semibold hover:underline flex items-center gap-xs">
                View All <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Issue</th>
                    <th>Priority</th>
                    <th className="hidden md:table-cell">Dept</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {criticalIssues.map(issue => (
                    <tr key={issue.id} className={issue.priority === 'Critical' ? 'row-critical' : issue.priority === 'High' ? 'row-high' : ''}>
                      <td>
                        <div className="font-medium text-on-surface">{issue.title}</div>
                        <div className="text-body-sm text-on-surface-variant">{issue.id} · {issue.complaints} complaints</div>
                      </td>
                      <td><PriorityBadge priority={issue.priority} /></td>
                      <td className="hidden md:table-cell text-on-surface-variant">{issue.dept}</td>
                      <td><StatusBadge status={issue.status} /></td>
                      <td>
                        <button onClick={() => navigate(`/authority/issues/${issue.id}`)} className="text-primary-container hover:underline text-label-md font-semibold whitespace-nowrap">
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Mini Map */}
          <div className="glass-card rounded-xl overflow-hidden flex flex-col">
            <div className="px-md py-sm border-b border-outline-variant/20">
              <h2 className="text-headline-md text-on-surface font-semibold">Hotspot Map</h2>
            </div>
            <div className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 relative flex items-center justify-center min-h-[200px]">
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, #93c5fd 0, #93c5fd 1px, transparent 0, transparent 30px), repeating-linear-gradient(90deg, #93c5fd 0, #93c5fd 1px, transparent 0, transparent 30px)',
                backgroundSize: '30px 30px'
              }} />
              {/* Hotspot markers */}
              {[
                { x: '30%', y: '35%', size: 48, color: 'rgba(186,26,26,0.35)', label: 'Ward 12' },
                { x: '60%', y: '55%', size: 36, color: 'rgba(230,81,0,0.3)', label: 'Sector 7' },
                { x: '50%', y: '25%', size: 28, color: 'rgba(0,77,153,0.25)', label: 'MG Rd' },
              ].map(marker => (
                <div key={marker.label} className="absolute flex flex-col items-center" style={{ left: marker.x, top: marker.y, transform: 'translate(-50%,-50%)' }}>
                  <div className="rounded-full animate-pulse" style={{ width: marker.size, height: marker.size, background: marker.color }} />
                  <span className="text-body-sm text-primary font-medium mt-[2px] bg-white/80 px-[4px] rounded">{marker.label}</span>
                </div>
              ))}
            </div>
            <div className="px-md py-sm border-t border-outline-variant/20">
              <button onClick={() => navigate('/authority/map')} className="text-primary-container text-label-md font-semibold hover:underline flex items-center gap-xs">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>map</span>
                View Full Map
              </button>
            </div>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {/* Dept Breakdown Bar */}
          <div className="glass-card rounded-xl p-md">
            <h3 className="text-headline-md text-on-surface font-semibold mb-md">Department Breakdown</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={deptData} barSize={20}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#424752' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#424752' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '13px' }} />
                <Bar dataKey="issues" fill="#1565c0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status Breakdown Donut */}
          <div className="glass-card rounded-xl p-md">
            <h3 className="text-headline-md text-on-surface font-semibold mb-md">Status Breakdown</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={statusData} cx="40%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {statusData.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" iconSize={10} formatter={v => <span style={{ fontSize: 12, color: '#424752' }}>{v}</span>} />
                <Tooltip formatter={(val) => [`${val}%`]} contentStyle={{ borderRadius: '8px', fontSize: '13px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent AI Decisions */}
        <div className="glass-card rounded-xl p-md">
          <h3 className="text-headline-md text-on-surface font-semibold mb-md flex items-center gap-sm">
            <span className="material-symbols-outlined text-[#7c4dff]" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            Recent AI Decisions
          </h3>
          <div className="space-y-sm">
            {recentAIDecisions.map(d => (
              <div key={d.id} className="flex items-start gap-sm py-sm border-b border-outline-variant/20 last:border-0">
                <span className="bg-purple-100 text-purple-700 text-label-md font-semibold px-sm py-[2px] rounded-md shrink-0">{d.id}</span>
                <p className="text-body-md text-on-surface flex-1">
                  <span className="font-semibold">Complaint {d.id}</span> {d.text}
                </p>
                <span className="text-body-sm text-on-surface-variant whitespace-nowrap shrink-0">{d.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AuthorityLayout>
  )
}
