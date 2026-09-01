import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AuthorityLayout } from '../../components/layout'
import { PriorityBadge, StatusBadge, CategoryBadge } from '../../components/ui'
import { useIssues, useComplaints, useDepartments } from '../../hooks/useApi'
import { useAuthStore } from '../../store/authStore'

const PRIORITIES = ['All', 'Critical', 'High', 'Medium', 'Low']
const STATUSES = ['All', 'Open', 'In Progress', 'Resolved']
const PAGE_SIZE = 12

export default function IssueQueue() {
  const navigate = useNavigate()
  const { role, departmentKey } = useAuthStore()
  const isSuperAdmin = role === 'super_admin'

  const [activeTab, setActiveTab] = useState('issues')
  const [filterPriority, setFilterPriority] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterDept, setFilterDept] = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data: departments } = useDepartments()

  // Dept scoping: super_admin can pick any dept; dept_admin is locked to theirs
  const effectiveDept = isSuperAdmin
    ? (filterDept !== 'All' ? filterDept : null)
    : departmentKey

  const { data: issues, isLoading } = useIssues({
    priority: filterPriority !== 'All' ? filterPriority.toLowerCase() : null,
    status: filterStatus !== 'All' ? filterStatus.toLowerCase().replace(' ', '_') : null,
    category: effectiveDept,
    skip: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
  })

  const { data: complaints, isLoading: complaintsLoading } = useComplaints({
    priority: filterPriority !== 'All' ? filterPriority.toLowerCase() : null,
    status: filterStatus !== 'All' ? filterStatus.toLowerCase().replace(' ', '_') : null,
    category: effectiveDept,
    skip: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
  })

  // Client-side search filter on title/id
  const rawList = activeTab === 'issues' ? (issues || []) : (complaints || [])
  const filtered = rawList.filter(item => {
    if (!search) return true
    const q = search.toLowerCase()
    return (item.title || item.text || '').toLowerCase().includes(q) || item.id?.toLowerCase().includes(q) || (item.address || '').toLowerCase().includes(q)
  })

  const selectCls = 'text-xs font-bold border border-slate-200 rounded-xl bg-white px-3.5 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-xs'

  return (
    <AuthorityLayout>
      <div className="space-y-6 font-sans">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>format_list_bulleted</span>
              </span>
              <h1 className="text-2xl font-extrabold bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent">
                Authority Issue Queue
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {isLoading ? 'Fetching triage queue…' : `Showing ${filtered.length} active items matching filters`}
            </p>
          </div>

          {/* Tab Pill Selector */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start md:self-auto">
            {['issues', 'complaints'].map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setPage(1) }}
                className={`px-4 py-2 text-xs font-bold rounded-xl capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab === 'issues' ? 'Clustered Issues' : 'Individual Complaints'}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Toolbar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl p-4 flex flex-wrap gap-3 items-center border border-slate-200/80 bg-white/80">
          <div className="relative flex-1 min-w-[240px]">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400" style={{ fontSize: '20px' }}>search</span>
            <input
              type="text"
              placeholder={activeTab === 'issues' ? 'Search by title, location, or ticket ID...' : 'Search complaint text, location...'}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs md:text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-400"
            />
          </div>

          <select className={selectCls} value={filterPriority} onChange={e => { setFilterPriority(e.target.value); setPage(1) }}>
            {PRIORITIES.map(p => <option key={p} value={p}>{p === 'All' ? 'All Priorities' : `${p} Priority`}</option>)}
          </select>

          <select className={selectCls} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}>
            {STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : `${s} Status`}</option>)}
          </select>

          {isSuperAdmin && (
            <select className={selectCls} value={filterDept} onChange={e => { setFilterDept(e.target.value); setPage(1) }}>
              <option value="All">All Municipal Departments</option>
              {(departments || []).map(d => (
                <option key={d.category_key} value={d.category_key}>{d.name}</option>
              ))}
            </select>
          )}
        </motion.div>

        {/* Data Table */}
        <div className="glass-card rounded-3xl overflow-hidden border border-slate-200/80 bg-white/90 shadow-sm">
          <div className="overflow-x-auto">
            {activeTab === 'issues' ? (
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Issue Title & ID</th>
                    <th>Priority</th>
                    <th className="hidden md:table-cell">Complaints</th>
                    <th className="hidden lg:table-cell">Location Landmark</th>
                    <th>Status</th>
                    <th className="hidden xl:table-cell">Department</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={7}><div className="animate-pulse h-10 bg-slate-100 rounded my-1" /></td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-slate-400">
                        <span className="material-symbols-outlined block mx-auto mb-2 text-4xl">search_off</span>
                        <p className="text-sm font-semibold text-slate-600">No issues matching your filters</p>
                        <p className="text-xs text-slate-400 mt-1">Try resetting the priority or search query</p>
                      </td>
                    </tr>
                  ) : filtered.map(issue => (
                    <tr
                      key={issue.id}
                      className="cursor-pointer hover:bg-slate-50 transition-colors group"
                      onClick={() => navigate(`/authority/issues/${issue.id}`)}
                    >
                      <td>
                        <div className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors max-w-[280px] truncate">
                          {issue.title}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">#{issue.id.slice(0, 8).toUpperCase()}</div>
                      </td>
                      <td><PriorityBadge priority={issue.priority?.charAt(0).toUpperCase() + issue.priority?.slice(1)} /></td>
                      <td className="hidden md:table-cell">
                        <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full border border-indigo-200/60">
                          <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>hub</span>
                          {issue.complaint_count}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell text-slate-600 text-xs font-medium max-w-[200px] truncate">
                        {issue.address ? `📍 ${issue.address}` : 'GPS Point'}
                      </td>
                      <td><StatusBadge status={issue.status?.replace(/_/g, ' ')} /></td>
                      <td className="hidden xl:table-cell"><CategoryBadge category={issue.category} /></td>
                      <td>
                        <button className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition-colors">
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Complaint Description</th>
                    <th>Priority</th>
                    <th>Category</th>
                    <th className="hidden md:table-cell">Location</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {complaintsLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={6}><div className="animate-pulse h-10 bg-slate-100 rounded my-1" /></td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-slate-400">
                        <span className="material-symbols-outlined block mx-auto mb-2 text-4xl">inbox</span>
                        <p className="text-sm font-semibold text-slate-600">No individual complaints found</p>
                      </td>
                    </tr>
                  ) : filtered.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td>
                        <div className="font-bold text-slate-900 text-sm max-w-[320px] truncate">{c.text}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">#{c.id.slice(0, 8).toUpperCase()}</div>
                      </td>
                      <td><PriorityBadge priority={c.priority?.charAt(0).toUpperCase() + c.priority?.slice(1)} /></td>
                      <td><CategoryBadge category={c.ai_category || c.category} /></td>
                      <td className="hidden md:table-cell text-slate-600 text-xs font-medium max-w-[180px] truncate">
                        {c.address || 'GPS Coordinates'}
                      </td>
                      <td><StatusBadge status={c.status?.replace(/_/g, ' ')} /></td>
                      <td className="text-xs text-slate-500 font-medium">
                        {new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-bold text-slate-500">
              Page {page} · Showing up to {PAGE_SIZE} per page
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-all shadow-xs"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={filtered.length < PAGE_SIZE}
                className="px-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-all shadow-xs"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </AuthorityLayout>
  )
}
