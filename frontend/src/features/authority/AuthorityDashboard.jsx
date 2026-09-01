import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AuthorityLayout } from '../../components/layout'
import { KpiCard, PriorityBadge, StatusBadge, CategoryBadge } from '../../components/ui'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { useAnalyticsSummary, useIssues, useComplaints } from '../../hooks/useApi'
import { useAuthStore } from '../../store/authStore'

const PRIORITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#3b82f6',
  low: '#64748b',
}

function LoadingSkeleton({ rows = 4 }) {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-slate-100 rounded-xl" />
      ))}
    </div>
  )
}

export default function AuthorityDashboard() {
  const navigate = useNavigate()
  const { departmentKey, role, name } = useAuthStore()
  const scopedDept = role === 'department_admin' ? departmentKey : null

  const { data: analytics, isLoading: analyticsLoading } = useAnalyticsSummary(scopedDept)
  const { data: criticalIssues, isLoading: issuesLoading } = useIssues({
    priority: 'critical', limit: 5, category: scopedDept
  })
  const { data: recentComplaints } = useComplaints({ limit: 4, category: scopedDept })

  const kpis = analytics ? [
    { title: 'Open Issues', value: String(analytics.open_issues), trend: 'Active', trendUp: false, icon: 'folder_open', color: 'blue' },
    { title: 'Critical Urgency', value: String(analytics.critical_issues), trend: 'Urgent', trendUp: false, icon: 'priority_high', color: 'red' },
    { title: 'High Priority', value: String(analytics.high_priority_issues), trend: 'Elevated', trendUp: false, icon: 'report', color: 'orange' },
    { title: 'Resolved', value: String(analytics.resolved_issues), trend: 'Completed', trendUp: true, icon: 'check_circle', color: 'green' },
  ] : []

  const deptData = analytics?.department_breakdown?.map(d => ({
    name: d.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    issues: d.count,
  })) || []

  const priorityData = analytics?.priority_breakdown?.map(p => ({
    name: p.priority.charAt(0).toUpperCase() + p.priority.slice(1),
    value: p.count,
    color: PRIORITY_COLORS[p.priority] || '#888',
  })) || []

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs shadow-xl border border-slate-700">
          <p className="font-bold text-slate-200">{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ color: entry.color || entry.fill }}>
              {entry.name}: <span className="font-mono font-bold">{entry.value}</span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <AuthorityLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>space_dashboard</span>
              </span>
              <h1 className="text-2xl font-extrabold bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent">
                {role === 'super_admin' ? 'Command Center Overview' : `${departmentKey?.replace(/_/g, ' ').toUpperCase()} Operations`}
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Welcome back, <span className="font-semibold text-slate-700">{name || 'Administrator'}</span>. Real-time civic intake and triage queue.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/authority/issues')}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all hover:shadow-lg"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>format_list_bulleted</span>
              Issue Queue
            </button>
            <button
              onClick={() => navigate('/authority/map')}
              className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-xs transition-all"
            >
              <span className="material-symbols-outlined text-indigo-600" style={{ fontSize: '16px' }}>map</span>
              City Map
            </button>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {analyticsLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass-card rounded-2xl p-4 animate-pulse h-28 bg-slate-100" />
              ))
            : kpis.map(kpi => <KpiCard key={kpi.title} {...kpi} />)
          }
        </div>

        {/* Main 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Critical Issue Queue */}
          <div className="lg:col-span-2 glass-card rounded-3xl overflow-hidden border border-slate-200/80 bg-white/80">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <h2 className="text-base font-bold text-slate-800">Critical Priority Triage Queue</h2>
              </div>
              <button
                onClick={() => navigate('/authority/issues')}
                className="text-indigo-600 hover:text-indigo-700 text-xs font-bold flex items-center gap-1 hover:underline"
              >
                View Full Queue <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_forward</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              {issuesLoading ? (
                <div className="p-6"><LoadingSkeleton rows={5} /></div>
              ) : (
                <table className="w-full data-table">
                  <thead>
                    <tr>
                      <th>Issue & Location</th>
                      <th>Priority</th>
                      <th className="hidden md:table-cell">Dept</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(criticalIssues || []).map(issue => (
                      <tr
                        key={issue.id}
                        className="cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => navigate(`/authority/issues/${issue.id}`)}
                      >
                        <td>
                          <div className="font-bold text-slate-800 truncate max-w-[240px]">{issue.title}</div>
                          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-0.5 text-indigo-600 font-semibold">
                              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>hub</span>
                              {issue.complaint_count} reports
                            </span>
                            <span>•</span>
                            <span className="truncate max-w-[180px]">{issue.address || 'GPS Coordinates'}</span>
                          </div>
                        </td>
                        <td><PriorityBadge priority={issue.priority?.charAt(0).toUpperCase() + issue.priority?.slice(1)} /></td>
                        <td className="hidden md:table-cell"><CategoryBadge category={issue.category} /></td>
                        <td><StatusBadge status={issue.status?.replace(/_/g, ' ')} /></td>
                        <td>
                          <button className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition-colors">
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!issuesLoading && (!criticalIssues || criticalIssues.length === 0) && (
                      <tr>
                        <td colSpan={5} className="text-center text-slate-400 py-12">
                          <span className="material-symbols-outlined text-4xl block text-emerald-500 mb-1">verified</span>
                          No critical issues requiring immediate action!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Right: Quick stats & Heatmap Widget */}
          <div className="glass-card rounded-3xl overflow-hidden flex flex-col border border-slate-200/80 bg-white/80">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-800">Priority Severity Index</h2>
            </div>
            <div className="flex-1 p-5 flex items-center justify-center">
              {analyticsLoading ? (
                <div className="animate-pulse h-44 w-full bg-slate-100 rounded-2xl" />
              ) : priorityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={priorityData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                      {priorityData.map(entry => <Cell key={entry.name} fill={entry.color} stroke="#ffffff" strokeWidth={2} />)}
                    </Pie>
                    <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-xs font-semibold text-slate-700 mr-2">{v}</span>} />
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-44 flex items-center justify-center text-slate-400 text-xs">No priority data yet</div>
              )}
            </div>
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">GIS spatial clusters active</span>
              <button
                onClick={() => navigate('/authority/map')}
                className="text-indigo-600 hover:text-indigo-700 text-xs font-bold flex items-center gap-1 hover:underline"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>map</span>
                Open Map
              </button>
            </div>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Dept Breakdown Bar */}
          <div className="glass-card rounded-3xl p-5 border border-slate-200/80 bg-white/80">
            <h3 className="text-base font-bold text-slate-800 mb-4">Department Workload Overview</h3>
            {analyticsLoading ? (
              <div className="animate-pulse h-48 bg-slate-100 rounded-2xl" />
            ) : deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={deptData} barSize={22}>
                  <defs>
                    <linearGradient id="dashBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity={1} />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="issues" fill="url(#dashBarGrad)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400 text-xs">No department data yet</div>
            )}
          </div>

          {/* Recent AI Routing & Duplicate Decisions */}
          <div className="glass-card rounded-3xl p-5 border border-slate-200/80 bg-white/80">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-600" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              Real-time AI Pipeline Activity
            </h3>
            <div className="space-y-2.5">
              {(recentComplaints || []).map(c => (
                <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                  <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-xs font-mono font-bold">
                    #{c.id.slice(-4)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {c.duplicate_state === 'linked' ? 'Auto-linked to existing issue' : `Classified as ${c.department || c.category}`}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{c.text || 'Photo submission'}</p>
                  </div>
                  <PriorityBadge priority={c.priority?.charAt(0).toUpperCase() + c.priority?.slice(1)} />
                </div>
              ))}
              {(!recentComplaints || recentComplaints.length === 0) && (
                <p className="text-xs text-slate-400 text-center py-8">No recent AI reports</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthorityLayout>
  )
}
