import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AuthorityLayout } from '../../components/layout'
import { PriorityBadge, StatusBadge, CategoryBadge, AiTag } from '../../components/ui'
import { useIssues, useComplaints, useDepartments } from '../../hooks/useApi'
import { useAuthStore } from '../../store/authStore'

const PRIORITIES = ['All', 'Critical', 'High', 'Medium', 'Low']
const STATUSES = ['All', 'Open', 'In Progress', 'Resolved']
const PAGE_SIZE = 10

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
  const filtered = (activeTab === 'issues' ? (issues || []) : (complaints || [])).filter(item => {
    if (!search) return true
    const q = search.toLowerCase()
    return (item.title || item.text || '').toLowerCase().includes(q) || item.id?.toLowerCase().includes(q)
  })

  const selectCls = 'border border-outline-variant rounded-md bg-white px-sm py-[7px] text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container'

  return (
    <AuthorityLayout>
      <div className="space-y-lg">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
          <div>
            <h1 className="text-headline-lg text-on-surface font-semibold">Issue Queue</h1>
            <p className="text-body-md text-on-surface-variant mt-xs">{isLoading ? '…' : `${filtered.length} items match your filters`}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-outline-variant/30 gap-sm">
          {['issues', 'complaints'].map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPage(1) }}
              className={`pb-sm px-sm text-label-md font-semibold border-b-2 transition-all capitalize ${
                activeTab === tab ? 'border-primary-container text-primary-container' : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab === 'issues' ? 'Issue View' : 'Individual Complaints'}
            </button>
          ))}
        </div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-md flex flex-wrap gap-sm items-center">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-sm top-1/2 -translate-y-1/2 material-symbols-outlined text-outline" style={{ fontSize: '18px' }}>search</span>
            <input
              type="text"
              placeholder={activeTab === 'issues' ? 'Search issues, IDs...' : 'Search complaints...'}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-[36px] pr-md py-[7px] border border-outline-variant rounded-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary-container"
            />
          </div>
          <select className={selectCls} value={filterPriority} onChange={e => { setFilterPriority(e.target.value); setPage(1) }}>
            {PRIORITIES.map(p => <option key={p}>{p === 'All' ? 'All Priorities' : p}</option>)}
          </select>
          <select className={selectCls} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}>
            {STATUSES.map(s => <option key={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
          </select>
          {/* Dept filter: only super_admin can change */}
          {isSuperAdmin && (
            <select className={selectCls} value={filterDept} onChange={e => { setFilterDept(e.target.value); setPage(1) }}>
              <option value="All">All Departments</option>
              {(departments || []).map(d => (
                <option key={d.category_key} value={d.category_key}>{d.name}</option>
              ))}
            </select>
          )}
        </motion.div>

        {/* Table */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            {activeTab === 'issues' ? (
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Issue Title</th>
                    <th>Priority</th>
                    <th className="hidden md:table-cell">Complaints</th>
                    <th className="hidden lg:table-cell">Location</th>
                    <th>Status</th>
                    <th className="hidden xl:table-cell">Department</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={7}><div className="animate-pulse h-10 bg-surface-container rounded my-xs" /></td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-xl text-on-surface-variant">
                        <span className="material-symbols-outlined block mx-auto mb-sm" style={{ fontSize: '40px' }}>search_off</span>
                        No issues match your filters
                      </td>
                    </tr>
                  ) : filtered.map(issue => (
                    <tr key={issue.id}
                      className={`cursor-pointer ${issue.priority === 'critical' ? 'row-critical' : issue.priority === 'high' ? 'row-high' : ''}`}
                      onClick={() => navigate(`/authority/issues/${issue.id}`)}
                    >
                      <td>
                        <div className="font-medium text-on-surface max-w-[250px] truncate">{issue.title}</div>
                        <div className="text-body-sm text-on-surface-variant">{issue.id.slice(0, 8)}…</div>
                        {issue.category && <CategoryBadge category={issue.category.replace(/_/g, ' ')} className="mt-[2px]" />}
                      </td>
                      <td><PriorityBadge priority={issue.priority?.charAt(0).toUpperCase() + issue.priority?.slice(1)} /></td>
                      <td className="hidden md:table-cell">
                        <span className="bg-primary/10 text-primary text-label-md font-bold px-sm py-[2px] rounded-full">{issue.complaint_count}</span>
                      </td>
                      <td className="hidden lg:table-cell text-on-surface-variant text-body-sm">{issue.address || '—'}</td>
                      <td><StatusBadge status={issue.status?.replace(/_/g, ' ')} /></td>
                      <td className="hidden xl:table-cell text-on-surface-variant text-body-sm">{issue.department_name || issue.category || '—'}</td>
                      <td>
                        <button className="text-primary-container text-label-md font-semibold hover:underline">Open</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              /* Complaints view */
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Complaint</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th className="hidden md:table-cell">Category</th>
                    <th className="hidden lg:table-cell">Location</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {complaintsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}><td colSpan={6}><div className="animate-pulse h-10 bg-surface-container rounded my-xs" /></td></tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-xl text-on-surface-variant">No complaints match filters</td>
                    </tr>
                  ) : filtered.map(c => (
                    <tr key={c.id} className={`cursor-pointer ${c.priority === 'critical' ? 'row-critical' : c.priority === 'high' ? 'row-high' : ''}`}
                      onClick={() => navigate(`/authority/issues/${c.issue_id || ''}`)}
                    >
                      <td>
                        <div className="font-medium text-on-surface max-w-[250px] truncate">{c.text}</div>
                        <div className="text-body-sm text-on-surface-variant font-mono">#{c.id.slice(0, 8)}</div>
                      </td>
                      <td><PriorityBadge priority={c.priority?.charAt(0).toUpperCase() + c.priority?.slice(1)} /></td>
                      <td><StatusBadge status={c.status?.replace(/_/g, ' ')} /></td>
                      <td className="hidden md:table-cell">
                        {c.category && <CategoryBadge category={c.category.replace(/_/g, ' ')} />}
                      </td>
                      <td className="hidden lg:table-cell text-on-surface-variant text-body-sm">{c.address || '—'}</td>
                      <td>
                        {c.issue_id && (
                          <button className="text-primary-container text-label-md font-semibold hover:underline whitespace-nowrap">View Issue</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="px-md py-sm border-t border-outline-variant/20 flex items-center justify-between">
            <span className="text-body-sm text-on-surface-variant">
              Page {page}
            </span>
            <div className="flex items-center gap-xs">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-[6px] rounded-md border border-outline-variant hover:bg-surface-container disabled:opacity-40 transition-colors">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_left</span>
              </button>
              <span className="px-sm text-body-md font-medium">{page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={(issues || []).length < PAGE_SIZE}
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
