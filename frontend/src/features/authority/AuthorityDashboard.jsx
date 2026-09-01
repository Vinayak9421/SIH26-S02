import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AuthorityLayout } from '../../components/layout'
import { KpiCard, PriorityBadge, StatusBadge } from '../../components/ui'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { useAnalyticsSummary, useIssues, useComplaints } from '../../hooks/useApi'
import { useAuthStore } from '../../store/authStore'

const PRIORITY_COLORS = {
  critical: '#ba1a1a',
  high: '#e65100',
  medium: '#1565c0',
  low: '#5c5f60',
}

const STATUS_COLORS = {
  open: '#ba1a1a',
  in_progress: '#e65100',
  resolved: '#2e7d32',
}

function LoadingSkeleton({ rows = 4 }) {
  return (
    <div className="animate-pulse space-y-sm">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-surface-container rounded-lg" />
      ))}
    </div>
  )
}

export default function AuthorityDashboard() {
  const navigate = useNavigate()
  const { departmentKey, role } = useAuthStore()
  const scopedDept = role === 'department_admin' ? departmentKey : null

  const { data: analytics, isLoading: analyticsLoading } = useAnalyticsSummary(scopedDept)
  const { data: criticalIssues, isLoading: issuesLoading } = useIssues({
    priority: 'critical', limit: 5, category: scopedDept
  })
  const { data: recentComplaints } = useComplaints({ limit: 4, category: scopedDept })

  // KPI cards derived from live analytics
  const kpis = analytics ? [
    { title: 'Open Issues', value: String(analytics.open_issues), trend: 'Active', trendUp: false, icon: 'folder_open', color: 'blue' },
    { title: 'Critical', value: String(analytics.critical_issues), trend: 'Urgent', trendUp: false, icon: 'priority_high', color: 'red' },
    { title: 'High Priority', value: String(analytics.high_priority_issues), trend: 'Important', trendUp: false, icon: 'report', color: 'orange' },
    { title: 'Resolved', value: String(analytics.resolved_issues), trend: 'Completed', trendUp: true, icon: 'check_circle', color: 'green' },
  ] : []

  // Chart data derived from API
  const deptData = analytics?.department_breakdown?.map(d => ({
    name: d.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    issues: d.count,
  })) || []

  const priorityData = analytics?.priority_breakdown?.map(p => ({
    name: p.priority.charAt(0).toUpperCase() + p.priority.slice(1),
    value: p.count,
    color: PRIORITY_COLORS[p.priority] || '#888',
  })) || []

  return (
    <AuthorityLayout>
      <div className="space-y-lg">
        {/* Page title */}
        <div>
          <h1 className="text-headline-lg text-on-surface font-semibold">
            {role === 'super_admin' ? 'Super Admin Dashboard' : 'Authority Dashboard'}
          </h1>
          <p className="text-body-md text-on-surface-variant mt-xs">
            {role === 'super_admin' ? 'City-wide civic issue management' : `${departmentKey?.replace(/_/g, ' ')} department management`}
          </p>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
          {analyticsLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass-card rounded-xl p-md animate-pulse h-24" />
              ))
            : kpis.map(kpi => <KpiCard key={kpi.title} {...kpi} />)
          }
        </div>

        {/* Main 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
          {/* Left: Critical Issue Queue */}
          <div className="lg:col-span-2 glass-card rounded-xl overflow-hidden">
            <div className="px-md py-sm border-b border-outline-variant/20 flex items-center justify-between">
              <h2 className="text-headline-md text-on-surface font-semibold">Critical Priority Issue Queue</h2>
              <button onClick={() => navigate('/authority/issues')} className="text-primary-container text-label-md font-semibold hover:underline flex items-center gap-xs">
                View All <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              {issuesLoading ? (
                <div className="p-md"><LoadingSkeleton rows={5} /></div>
              ) : (
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
                    {(criticalIssues || []).map(issue => (
                      <tr key={issue.id} className="row-critical cursor-pointer" onClick={() => navigate(`/authority/issues/${issue.id}`)}>
                        <td>
                          <div className="font-medium text-on-surface truncate max-w-[200px]">{issue.title}</div>
                          <div className="text-body-sm text-on-surface-variant">{issue.complaint_count} complaints · {issue.address || 'No location'}</div>
                        </td>
                        <td><PriorityBadge priority={issue.priority?.charAt(0).toUpperCase() + issue.priority?.slice(1)} /></td>
                        <td className="hidden md:table-cell text-on-surface-variant text-body-sm">{issue.department_name || issue.category}</td>
                        <td><StatusBadge status={issue.status?.replace(/_/g, ' ')} /></td>
                        <td>
                          <button className="text-primary-container hover:underline text-label-md font-semibold whitespace-nowrap">Open</button>
                        </td>
                      </tr>
                    ))}
                    {!issuesLoading && (!criticalIssues || criticalIssues.length === 0) && (
                      <tr>
                        <td colSpan={5} className="text-center text-on-surface-variant py-lg">
                          <span className="material-symbols-outlined block mx-auto mb-xs" style={{ fontSize: '32px' }}>check_circle</span>
                          No critical issues! 🎉
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Right: Quick stats */}
          <div className="glass-card rounded-xl overflow-hidden flex flex-col">
            <div className="px-md py-sm border-b border-outline-variant/20">
              <h2 className="text-headline-md text-on-surface font-semibold">Priority Distribution</h2>
            </div>
            <div className="flex-1 p-md">
              {analyticsLoading ? (
                <div className="animate-pulse h-40 bg-surface-container rounded-lg" />
              ) : priorityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={priorityData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                      {priorityData.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 11, color: '#424752' }}>{v}</span>} />
                    <Tooltip formatter={v => [`${v} issues`]} contentStyle={{ borderRadius: '8px', fontSize: '13px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-40 flex items-center justify-center text-on-surface-variant text-body-sm">No data yet</div>
              )}
            </div>
            <div className="px-md py-sm border-t border-outline-variant/20">
              <button onClick={() => navigate('/authority/map')} className="text-primary-container text-label-md font-semibold hover:underline flex items-center gap-xs">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>map</span>
                View Heatmap
              </button>
            </div>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {/* Dept Breakdown Bar */}
          <div className="glass-card rounded-xl p-md">
            <h3 className="text-headline-md text-on-surface font-semibold mb-md">Department Breakdown</h3>
            {analyticsLoading ? (
              <div className="animate-pulse h-44 bg-surface-container rounded-lg" />
            ) : deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={deptData} barSize={20}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#424752' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#424752' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '13px' }} />
                  <Bar dataKey="issues" fill="#1565c0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-44 flex items-center justify-center text-on-surface-variant text-body-sm">No department data yet</div>
            )}
          </div>

          {/* Recent AI Decisions from live complaints */}
          <div className="glass-card rounded-xl p-md">
            <h3 className="text-headline-md text-on-surface font-semibold mb-md flex items-center gap-sm">
              <span className="material-symbols-outlined text-[#7c4dff]" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              Recent AI Decisions
            </h3>
            <div className="space-y-sm">
              {(recentComplaints || []).map(c => (
                <div key={c.id} className="flex items-start gap-sm py-sm border-b border-outline-variant/20 last:border-0">
                  <span className="bg-purple-100 text-purple-700 text-label-md font-semibold px-sm py-[2px] rounded-md shrink-0">#{c.id.slice(-4)}</span>
                  <p className="text-body-sm text-on-surface flex-1">
                    <span className="font-semibold capitalize">{c.duplicate_state === 'linked' ? 'linked to existing issue' : `routed to ${c.department || c.category}`}</span>
                    {c.duplicate_state === 'linked' && ' (AI duplicate detection)'}
                  </p>
                  <PriorityBadge priority={c.priority?.charAt(0).toUpperCase() + c.priority?.slice(1)} />
                </div>
              ))}
              {(!recentComplaints || recentComplaints.length === 0) && (
                <p className="text-body-sm text-on-surface-variant text-center py-md">No complaints yet. Submit one to see AI decisions!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthorityLayout>
  )
}
