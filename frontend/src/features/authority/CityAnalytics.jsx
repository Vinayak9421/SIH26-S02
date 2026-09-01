import { AuthorityLayout } from '../../components/layout'
import { KpiCard } from '../../components/ui'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid
} from 'recharts'

const kpis = [
  { title: 'Total Complaints',    value: '1,284', trend: '+142 this month', trendUp: true,  icon: 'report',         color: 'blue'   },
  { title: 'Issues Created',      value: '248',   trend: '+24 this month',  trendUp: true,  icon: 'folder_open',    color: 'purple' },
  { title: 'Avg. Resolution Time',value: '4.2d',  trend: '-0.8d vs last',   trendUp: true,  icon: 'schedule',       color: 'green'  },
  { title: 'Duplicates Linked',   value: '892',   trend: 'AI auto-detected',trendUp: true,  icon: 'link',           color: 'orange' },
  { title: 'Resolution Rate',     value: '67%',   trend: '+4% vs last',     trendUp: true,  icon: 'check_circle',   color: 'green'  },
]

const complaintsOverTime = [
  { date: 'Oct 1', count: 38 }, { date: 'Oct 5', count: 52 }, { date: 'Oct 10', count: 47 },
  { date: 'Oct 15', count: 64 }, { date: 'Oct 20', count: 71 }, { date: 'Oct 25', count: 58 },
  { date: 'Oct 30', count: 82 }, { date: 'Nov 1', count: 76 },
]

const priorityData = [
  { name: 'Critical', value: 12, color: '#ba1a1a' },
  { name: 'High',     value: 28, color: '#e65100' },
  { name: 'Medium',   value: 38, color: '#1565c0' },
  { name: 'Low',      value: 22, color: '#5c5f60' },
]

const statusData = [
  { dept: 'Oct', Open: 40, InProgress: 22, Resolved: 18 },
  { dept: 'Nov 1', Open: 35, InProgress: 28, Resolved: 27 },
  { dept: 'Nov 7', Open: 28, InProgress: 32, Resolved: 30 },
  { dept: 'Nov 14', Open: 22, InProgress: 25, Resolved: 35 },
]

const topLocations = [
  { name: 'Ward 12, Delhi',      count: 47 },
  { name: 'MG Road',             count: 38 },
  { name: 'Sector 7',            count: 29 },
  { name: 'Central Park Area',   count: 22 },
  { name: 'Ward 5, Delhi',       count: 18 },
]

const deptComparison = [
  { dept: 'Waste Management', open: 34, critical: 5, avgDays: 5.2 },
  { dept: 'Roads & Infra',    open: 28, critical: 3, avgDays: 6.8 },
  { dept: 'Water Supply',     open: 22, critical: 4, avgDays: 3.9 },
  { dept: 'Electricity',      open: 18, critical: 2, avgDays: 2.1 },
  { dept: 'Drainage',         open: 14, critical: 1, avgDays: 4.5 },
]

export default function CityAnalytics() {
  return (
    <AuthorityLayout>
      <div className="space-y-lg">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-headline-lg text-on-surface font-semibold">City Analytics Dashboard</h1>
            <p className="text-body-md text-on-surface-variant mt-xs">Data-driven insights from AI-processed complaints</p>
          </div>
          <select className="border border-outline-variant rounded-md bg-white px-md py-[7px] text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container">
            <option>Last 30 days</option>
            <option>Last 7 days</option>
            <option>Last 3 months</option>
            <option>Custom range</option>
          </select>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-md">
          {kpis.map(kpi => <KpiCard key={kpi.title} {...kpi} />)}
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
          {/* Complaints Over Time - Line Chart */}
          <div className="glass-card rounded-xl p-md lg:col-span-2">
            <h3 className="text-headline-md text-on-surface font-semibold mb-md">Complaints Over Time</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={complaintsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#c2c6d4" opacity={0.5} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#424752' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#424752' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '13px', border: '1px solid #c2c6d4' }} />
                <Line type="monotone" dataKey="count" stroke="#1565c0" strokeWidth={2.5} dot={{ r: 4, fill: '#1565c0' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Priority Distribution - Donut */}
          <div className="glass-card rounded-xl p-md">
            <h3 className="text-headline-md text-on-surface font-semibold mb-md">Priority Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={priorityData} cx="45%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {priorityData.map(e => <Cell key={e.name} fill={e.color} />)}
                </Pie>
                <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" iconSize={8}
                  formatter={v => <span style={{ fontSize: 11, color: '#424752' }}>{v}</span>} />
                <Tooltip formatter={v => [`${v}%`]} contentStyle={{ borderRadius: '8px', fontSize: '13px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
          {/* Status Breakdown - Stacked Bar */}
          <div className="glass-card rounded-xl p-md">
            <h3 className="text-headline-md text-on-surface font-semibold mb-md">Status Breakdown Over Time</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusData} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#c2c6d4" opacity={0.3} />
                <XAxis dataKey="dept" tick={{ fontSize: 11, fill: '#424752' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#424752' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '13px' }} />
                <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 11, color: '#424752' }}>{v}</span>} />
                <Bar dataKey="Open" stackId="a" fill="#ba1a1a" radius={[0,0,0,0]} />
                <Bar dataKey="InProgress" stackId="a" fill="#e65100" />
                <Bar dataKey="Resolved" stackId="a" fill="#2e7d32" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Recurring Locations */}
          <div className="glass-card rounded-xl p-md">
            <h3 className="text-headline-md text-on-surface font-semibold mb-md">Top Recurring Locations</h3>
            <div className="space-y-sm">
              {topLocations.map((loc, i) => (
                <div key={loc.name} className="flex items-center gap-sm">
                  <span className="text-body-sm text-on-surface-variant w-4 text-right">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-[3px]">
                      <span className="text-body-md text-on-surface font-medium">{loc.name}</span>
                      <span className="text-body-sm text-on-surface-variant">{loc.count}</span>
                    </div>
                    <div className="h-[6px] bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-primary-container rounded-full" style={{ width: `${(loc.count / topLocations[0].count) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Department Comparison Table */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="px-md py-sm border-b border-outline-variant/20">
            <h3 className="text-headline-md text-on-surface font-semibold">Department Comparison (Super Admin)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Open Issues</th>
                  <th>Critical Count</th>
                  <th>Avg Resolution Time</th>
                  <th>Performance</th>
                </tr>
              </thead>
              <tbody>
                {deptComparison.map(d => (
                  <tr key={d.dept}>
                    <td className="font-medium text-on-surface">{d.dept}</td>
                    <td>{d.open}</td>
                    <td>
                      <span className={`inline-flex items-center px-sm py-[2px] rounded-full text-label-md font-semibold ${d.critical >= 4 ? 'badge-critical' : d.critical >= 2 ? 'badge-high' : 'badge-low'}`}>
                        {d.critical}
                      </span>
                    </td>
                    <td>{d.avgDays} days</td>
                    <td>
                      <div className="flex items-center gap-sm">
                        <div className="flex-1 h-[6px] bg-surface-container-highest rounded-full overflow-hidden max-w-[80px]">
                          <div className="h-full bg-primary-container rounded-full" style={{ width: `${Math.max(20, 100 - d.avgDays * 10)}%` }} />
                        </div>
                        <span className="text-body-sm text-on-surface-variant">{Math.round(Math.max(20, 100 - d.avgDays * 10))}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-body-sm text-on-surface-variant text-center">
          Metrics are calculated from your department's / city's seeded demo dataset. Updated every 15 minutes.
        </p>
      </div>
    </AuthorityLayout>
  )
}
