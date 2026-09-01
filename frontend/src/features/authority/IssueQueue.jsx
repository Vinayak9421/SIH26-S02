import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AuthorityLayout } from '../../components/layout'
import { PriorityBadge, StatusBadge, CategoryBadge, AiTag } from '../../components/ui'

const allIssues = [
  { id: 'ISS-441', title: 'Missed Garbage Collection Ward 12', category: 'Sanitation', priority: 'Critical', complaints: 24, location: 'Ward 12, Delhi', dept: 'Waste Management', status: 'Open', aiConf: 96, lastUpdated: '10 min ago' },
  { id: 'ISS-389', title: 'Broken Sewer Line Sector 7', category: 'Water Supply', priority: 'Critical', complaints: 18, location: 'Sector 7', dept: 'Water Supply', status: 'Open', aiConf: 91, lastUpdated: '1 hr ago', aiReview: true },
  { id: 'ISS-402', title: 'Multiple Potholes on MG Road', category: 'Roads', priority: 'High', complaints: 31, location: 'MG Road', dept: 'Roads', status: 'In Progress', aiConf: 88, lastUpdated: '2 hr ago' },
  { id: 'ISS-417', title: 'Street Lights Outage Ward 5', category: 'Electricity', priority: 'High', complaints: 15, location: 'Ward 5', dept: 'Electricity', status: 'Open', aiConf: 93, lastUpdated: '3 hr ago' },
  { id: 'ISS-455', title: 'Overflowing Drain near Central Park', category: 'Drainage', priority: 'Medium', complaints: 9, location: 'Central Park', dept: 'Drainage', status: 'In Progress', aiConf: 79, lastUpdated: '5 hr ago' },
  { id: 'ISS-462', title: 'Broken Public Bench at Bus Stop', category: 'Public Amenities', priority: 'Low', complaints: 5, location: 'Bus Stop 14', dept: 'Maintenance', status: 'Open', aiConf: 85, lastUpdated: '1 day ago' },
  { id: 'ISS-471', title: 'Noise Pollution Near Residential Zone', category: 'Environment', priority: 'Medium', complaints: 11, location: 'Zone B, Sector 4', dept: 'Environment', status: 'Resolved', aiConf: 72, lastUpdated: '2 days ago' },
  { id: 'ISS-478', title: 'Stray Animal Menace Ward 9', category: 'Animal Control', priority: 'High', complaints: 20, location: 'Ward 9', dept: 'Animal Control', status: 'In Progress', aiConf: 84, lastUpdated: '6 hr ago', aiReview: true },
]

const priorities = ['All', 'Critical', 'High', 'Medium', 'Low']
const statuses = ['All', 'Open', 'In Progress', 'Resolved']

export default function IssueQueue() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('issues')
  const [filterPriority, setFilterPriority] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 6

  const filtered = allIssues.filter(i => {
    const matchP = filterPriority === 'All' || i.priority === filterPriority
    const matchS = filterStatus === 'All' || i.status === filterStatus
    const matchQ = !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.id.toLowerCase().includes(search.toLowerCase())
    return matchP && matchS && matchQ
  })

  const paginated = filtered.slice((page - 1) * perPage, page * perPage)
  const totalPages = Math.ceil(filtered.length / perPage)

  const selectCls = 'border border-outline-variant rounded-md bg-white px-sm py-[7px] text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container'

  return (
    <AuthorityLayout>
      <div className="space-y-lg">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
          <div>
            <h1 className="text-headline-lg text-on-surface font-semibold">Issue Queue</h1>
            <p className="text-body-md text-on-surface-variant mt-xs">{filtered.length} issues match your filters</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-outline-variant/30 gap-sm">
          {['issues', 'complaints'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-sm px-sm text-label-md font-semibold border-b-2 transition-all capitalize ${
                activeTab === tab ? 'border-primary-container text-primary-container' : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab === 'issues' ? 'Issue View' : 'Individual Complaints View'}
            </button>
          ))}
        </div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-md flex flex-wrap gap-sm items-center">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-sm top-1/2 -translate-y-1/2 material-symbols-outlined text-outline" style={{ fontSize: '18px' }}>search</span>
            <input
              type="text"
              placeholder="Search issues, IDs..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-[36px] pr-md py-[7px] border border-outline-variant rounded-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary-container"
            />
          </div>
          <select className={selectCls} value={filterPriority} onChange={e => { setFilterPriority(e.target.value); setPage(1) }}>
            {priorities.map(p => <option key={p}>{p === 'All' ? 'All Priorities' : p}</option>)}
          </select>
          <select className={selectCls} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}>
            {statuses.map(s => <option key={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
          </select>
          <select className={selectCls}>
            <option>All Departments</option>
            <option>Waste Management</option>
            <option>Roads</option>
            <option>Water Supply</option>
          </select>
          <select className={selectCls}>
            <option>All Dates</option>
            <option>Today</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
          </select>
        </motion.div>

        {/* Table */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>Issue Title</th>
                  <th>Priority</th>
                  <th className="hidden md:table-cell">Complaints</th>
                  <th className="hidden lg:table-cell">Location</th>
                  <th>Status</th>
                  <th>AI Confidence</th>
                  <th className="hidden xl:table-cell">Last Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(issue => (
                  <tr key={issue.id}
                    className={`cursor-pointer ${issue.priority === 'Critical' ? 'row-critical' : issue.priority === 'High' ? 'row-high' : ''}`}
                    onClick={() => navigate(`/authority/issues/${issue.id}`)}
                  >
                    <td>
                      <div className="font-medium text-on-surface max-w-[250px] truncate">{issue.title}</div>
                      <div className="text-body-sm text-on-surface-variant">{issue.id}</div>
                      <CategoryBadge category={issue.category} className="mt-[2px]" />
                    </td>
                    <td><PriorityBadge priority={issue.priority} /></td>
                    <td className="hidden md:table-cell">
                      <span className="bg-primary/10 text-primary text-label-md font-bold px-sm py-[2px] rounded-full">{issue.complaints}</span>
                    </td>
                    <td className="hidden lg:table-cell text-on-surface-variant">{issue.location}</td>
                    <td><StatusBadge status={issue.status} /></td>
                    <td>
                      <div className="flex items-center gap-[4px]">
                        {issue.aiReview ? (
                          <span className="flex items-center gap-[3px] bg-red-50 text-red-700 text-label-md font-semibold px-sm py-[2px] rounded-md border border-red-200">
                            <span className="material-symbols-outlined" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1" }}>flag</span>
                            Needs Review
                          </span>
                        ) : (
                          <span className="flex items-center gap-[3px] text-label-md text-[#7c4dff] font-semibold">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                            {issue.aiConf}%
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="hidden xl:table-cell text-on-surface-variant">{issue.lastUpdated}</td>
                    <td>
                      <button className="text-primary-container text-label-md font-semibold hover:underline">Open</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-md py-sm border-t border-outline-variant/20 flex items-center justify-between">
            <span className="text-body-sm text-on-surface-variant">Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}</span>
            <div className="flex items-center gap-xs">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-[6px] rounded-md border border-outline-variant hover:bg-surface-container disabled:opacity-40 transition-colors">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_left</span>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-md text-body-md font-medium transition-colors ${p === page ? 'bg-primary-container text-on-primary' : 'hover:bg-surface-container text-on-surface'}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-[6px] rounded-md border border-outline-variant hover:bg-surface-container disabled:opacity-40 transition-colors">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AuthorityLayout>
  )
}
