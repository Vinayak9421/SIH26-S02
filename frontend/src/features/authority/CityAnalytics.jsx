import { useState } from 'react'
import { AuthorityLayout } from '../../components/layout'
import { KpiCard } from '../../components/ui'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid
} from 'recharts'
import { useAnalyticsSummary, useDepartments } from '../../hooks/useApi'
import { useAuthStore } from '../../store/authStore'

const PRIORITY_COLORS = {
  critical: '#ba1a1a', high: '#e65100', medium: '#1565c0', low: '#5c5f60',
}

export default function CityAnalytics() {
  const { role, departmentKey } = useAuthStore()
  const isSuperAdmin = role === 'super_admin'
  const [filterDept, setFilterDept] = useState('All')

  const { data: departments } = useDepartments()

  const effectiveDept = isSuperAdmin
    ? (filterDept !== 'All' ? filterDept : null)
    : departmentKey

  const { data: analytics, isLoading } = useAnalyticsSummary(effectiveDept)

  const kpis = analytics ? [
    { title: 'Open Issues', value: String(analytics.open_issues), trend: 'Active', trendUp: false, icon: 'folder_open', color: 'blue' },
    { title: 'Critical Issues', value: String(analytics.critical_issues), trend: 'Urgent', trendUp: false, icon: 'priority_high', color: 'red' },
    { title: 'High Priority', value: String(analytics.high_priority_issues), trend: 'Important', trendUp: false, icon: 'report', color: 'orange' },
    { title: 'Resolved', value: String(analytics.resolved_issues), trend: 'Completed', trendUp: true, icon: 'check_circle', color: 'green' },
    { title: 'Duplicates Linked', value: String(analytics.linked_duplicate_complaints), trend: 'AI detected', trendUp: true, icon: 'link', color: 'purple' },
  ] : []

  const deptData = (analytics?.department_breakdown || []).map(d => ({
    name: d.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    issues: d.count,
  }))

  const priorityData = (analytics?.priority_breakdown || []).map(p => ({
    name: p.priority.charAt(0).toUpperCase() + p.priority.slice(1),
    value: p.count,
    color: PRIORITY_COLORS[p.priority] || '#888',
  }))

  return (
    <AuthorityLayout>
      <div className="space-y-lg">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-sm">
          <div>
            <h1 className="text-headline-lg text-on-surface font-semibold">City Analytics Dashboard</h1>
            <p className="text-body-md text-on-surface-variant mt-xs">Live data-driven insights from NeonDB</p>
          </div>
          {isSuperAdmin && (
            <select
              value={filterDept}
              onChange={e => setFilterDept(e.target.value)}
              className="border border-outline-variant rounded-md bg-white px-md py-[7px] text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
            >
              <option value="All">All Departments</option>
              {(departments || []).map(d => (
                <option key={d.category_key} value={d.category_key}>{d.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-md">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="glass-card rounded-xl p-md animate-pulse h-24" />)
            : kpis.map(kpi => <KpiCard key={kpi.title} {...kpi} />)
          }
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
          {/* Department Breakdown Bar */}
          <div className="glass-card rounded-xl p-md lg:col-span-2">
            <h3 className="text-headline-md text-on-surface font-semibold mb-md">Department Issue Breakdown</h3>
            {isLoading ? (
              <div className="animate-pulse h-48 bg-surface-container rounded-lg" />
            ) : deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={deptData} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#c2c6d4" opacity={0.4} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#424752' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#424752' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '13px' }} />
                  <Bar dataKey="issues" fill="#1565c0" radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 11, fill: '#424752' }} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-on-surface-variant">
                <p className="text-body-md">No issues data yet. Submit complaints to populate!</p>
              </div>
            )}
          </div>

          {/* Priority Distribution Donut */}
          <div className="glass-card rounded-xl p-md">
            <h3 className="text-headline-md text-on-surface font-semibold mb-md">Priority Distribution</h3>
            {isLoading ? (
              <div className="animate-pulse h-48 bg-surface-container rounded-lg" />
            ) : priorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={priorityData} cx="45%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {priorityData.map(e => <Cell key={e.name} fill={e.color} />)}
                  </Pie>
                  <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" iconSize={8}
                    formatter={v => <span style={{ fontSize: 11, color: '#424752' }}>{v}</span>} />
                  <Tooltip formatter={v => [`${v} issues`]} contentStyle={{ borderRadius: '8px', fontSize: '13px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-on-surface-variant text-body-sm">No data</div>
            )}
          </div>
        </div>

        {/* Department Comparison Table (Super Admin) */}
        {isSuperAdmin && (
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-md py-sm border-b border-outline-variant/20 flex items-center justify-between">
              <h3 className="text-headline-md text-on-surface font-semibold">Department Comparison</h3>
              <span className="bg-purple-50 text-purple-700 border border-purple-200 text-label-md px-sm py-[2px] rounded-full">Super Admin View</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Category Key</th>
                    <th>Issues</th>
                    <th>Active</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}><td colSpan={4}><div className="animate-pulse h-8 bg-surface-container rounded my-xs" /></td></tr>
                    ))
                  ) : (analytics?.department_breakdown || []).map(d => (
                    <tr key={d.category}>
                      <td className="font-medium text-on-surface capitalize">{d.category.replace(/_/g, ' ')}</td>
                      <td className="text-body-sm text-on-surface-variant font-mono">{d.category}</td>
                      <td>{d.count}</td>
                      <td>
                        <div className="flex items-center gap-sm">
                          <div className="flex-1 h-[6px] bg-surface-container-highest rounded-full overflow-hidden max-w-[80px]">
                            <div className="h-full bg-primary-container rounded-full"
                              style={{ width: `${Math.min(100, (d.count / (analytics.open_issues || 1)) * 100)}%` }} />
                          </div>
                          <span className="text-body-sm text-on-surface-variant">
                            {Math.round((d.count / (analytics.open_issues || 1)) * 100)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!isLoading && (!analytics?.department_breakdown || analytics.department_breakdown.length === 0) && (
                    <tr><td colSpan={4} className="text-center text-on-surface-variant py-lg">No department data yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-body-sm text-on-surface-variant text-center">
          All metrics are live from NeonDB · Last updated just now
        </p>
      </div>
    </AuthorityLayout>
  )
}
