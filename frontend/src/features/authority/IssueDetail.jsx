import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AuthorityLayout } from '../../components/layout'
import { PriorityBadge, StatusBadge, CategoryBadge, AiTag } from '../../components/ui'
import { useIssueDetail, useUpdateIssue, useResolveIssue } from '../../hooks/useApi'
import { toast } from 'sonner'

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
]

export default function IssueDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: issue, isLoading, error } = useIssueDetail(id)
  const updateIssue = useUpdateIssue()
  const resolveIssue = useResolveIssue()

  const [pendingStatus, setPendingStatus] = useState(null)
  const [note, setNote] = useState('')
  const [resolving, setResolving] = useState(false)

  const handleStatusUpdate = async () => {
    if (!pendingStatus) return
    try {
      await updateIssue.mutateAsync({ id, status: pendingStatus, note: note || undefined })
      toast.success(`Issue status updated to "${pendingStatus.replace('_', ' ')}"`)
      setNote('')
      setPendingStatus(null)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update status')
    }
  }

  const handleResolve = async () => {
    setResolving(true)
    try {
      const result = await resolveIssue.mutateAsync({ id, note: note || undefined })
      toast.success(`Issue resolved! ${result.linked_complaints_resolved_count} complaints auto-resolved.`)
      navigate('/authority/issues')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to resolve issue')
    } finally {
      setResolving(false)
    }
  }

  if (isLoading) {
    return (
      <AuthorityLayout>
        <div className="space-y-6 animate-pulse max-w-6xl">
          <div className="h-8 bg-slate-200 rounded-xl w-48" />
          <div className="h-20 bg-slate-200 rounded-3xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-36 bg-slate-200 rounded-3xl" />
              <div className="h-64 bg-slate-200 rounded-3xl" />
            </div>
            <div className="h-80 bg-slate-200 rounded-3xl" />
          </div>
        </div>
      </AuthorityLayout>
    )
  }

  if (error || !issue) {
    return (
      <AuthorityLayout>
        <div className="text-center py-16">
          <span className="material-symbols-outlined block mx-auto text-slate-400 text-4xl mb-2">error</span>
          <p className="text-lg font-bold text-slate-800">Issue not found or failed to load.</p>
          <button onClick={() => navigate('/authority/issues')} className="mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold">
            ← Back to Queue
          </button>
        </div>
      </AuthorityLayout>
    )
  }

  const currentStatus = pendingStatus || issue.status
  const formattedStatus = (s) => s?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  return (
    <AuthorityLayout>
      <div className="space-y-6 max-w-6xl font-sans">
        {/* Back Button */}
        <button
          onClick={() => navigate('/authority/issues')}
          className="flex items-center gap-1.5 text-xs md:text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
          Back to Issue Queue
        </button>

        {/* Title & Action Header Card */}
        <div className="glass-card rounded-3xl p-6 md:p-8 border border-slate-200/80 bg-white/90 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                  ISSUE #{issue.id?.slice(0, 8).toUpperCase()}
                </span>
                <PriorityBadge priority={formattedStatus(issue.priority)} />
                <StatusBadge status={formattedStatus(currentStatus)} />
              </div>
              <h1 className="text-xl md:text-3xl font-extrabold text-slate-900 leading-tight">
                {issue.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {issue.category && <CategoryBadge category={issue.category.replace(/_/g, ' ')} />}
                {issue.department_name && <AiTag label={issue.department_name} confidence={null} />}
                {issue.address && (
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full">
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>location_on</span>
                    {issue.address}
                  </span>
                )}
              </div>
            </div>

            {/* Status Workflow Controls */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 shrink-0">
              <select
                value={pendingStatus || issue.status}
                onChange={e => setPendingStatus(e.target.value)}
                className="border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              {pendingStatus && pendingStatus !== issue.status && (
                <button
                  onClick={handleStatusUpdate}
                  disabled={updateIssue.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {updateIssue.isPending ? 'Saving…' : 'Save Status'}
                </button>
              )}

              {issue.status !== 'resolved' && (
                <button
                  onClick={handleResolve}
                  disabled={resolving}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                  {resolving ? 'Resolving…' : 'Resolve Issue'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Metrics & Complaints */}
          <div className="lg:col-span-2 space-y-6">
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="glass-card rounded-2xl p-4 text-center border border-slate-200 bg-white">
                <p className="text-3xl font-extrabold text-indigo-600">{issue.complaint_count}</p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Citizen Reports</p>
              </div>
              <div className="glass-card rounded-2xl p-4 text-center border border-slate-200 bg-white">
                <p className="text-3xl font-extrabold text-rose-600">{issue.priority_score}</p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Severity Score</p>
              </div>
              <div className="glass-card rounded-2xl p-4 text-center border border-slate-200 bg-white">
                <p className="text-2xl font-extrabold text-emerald-700 capitalize">{issue.status?.replace(/_/g, ' ')}</p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Current State</p>
              </div>
            </div>

            {/* Linked Complaints List */}
            <div className="glass-card rounded-3xl p-6 space-y-4 border border-slate-200/80 bg-white/90 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base md:text-lg font-bold text-slate-900">
                  Cluster-Linked Citizen Grievances
                </h2>
                <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full border border-indigo-200">
                  {issue.linked_complaints?.length || 0} Reports
                </span>
              </div>
              <div className="space-y-3">
                {(issue.linked_complaints || []).map(c => (
                  <div key={c.id} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 hover:bg-slate-100/80 transition-colors">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-indigo-700">#{c.id?.slice(0, 8).toUpperCase()}</span>
                      <div className="flex items-center gap-1.5">
                        <PriorityBadge priority={formattedStatus(c.priority)} />
                        <StatusBadge status={formattedStatus(c.status)} />
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 italic">"{c.text}"</p>
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium mt-2 pt-2 border-t border-slate-200/60">
                      <span>{c.address ? `📍 ${c.address}` : 'GPS coordinates'}</span>
                      <span>{new Date(c.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                ))}
                {(!issue.linked_complaints || issue.linked_complaints.length === 0) && (
                  <p className="text-xs text-slate-400 text-center py-6">No linked citizen reports</p>
                )}
              </div>
            </div>

            {/* Add Internal Audit Note */}
            <div className="glass-card rounded-3xl p-6 space-y-3 border border-slate-200/80 bg-white/90 shadow-sm">
              <h2 className="text-base font-bold text-slate-900">Add Internal Action / Audit Note</h2>
              <textarea
                rows={3}
                placeholder="Log internal updates, dispatched team notes, or completion remarks..."
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 p-4 text-xs md:text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium"
              />
            </div>
          </div>

          {/* Right Column: Timeline & Spatial GIS Details */}
          <div className="space-y-6">
            {/* Timeline Stepper */}
            <div className="glass-card rounded-3xl p-6 border border-slate-200/80 bg-white/90 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600" style={{ fontSize: '20px' }}>history</span>
                Audit Timeline
              </h3>
              <div className="space-y-4 pl-4 border-l-2 border-slate-200 relative">
                {(issue.timeline || []).map((t, idx) => (
                  <div key={idx} className="relative pl-3">
                    <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-indigo-600 border-2 border-white" />
                    <span className="text-xs font-bold text-slate-800 capitalize block">{t.status?.replace(/_/g, ' ')}</span>
                    {t.note && <p className="text-xs text-slate-600 font-medium mt-0.5">{t.note}</p>}
                    <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                      {new Date(t.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Spatial Location Info */}
            <div className="glass-card rounded-3xl p-6 border border-slate-200/80 bg-white/90 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600" style={{ fontSize: '20px' }}>pin_drop</span>
                Spatial GIS Geolocation
              </h3>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Latitude:</span>
                  <span className="font-mono font-bold text-slate-800">{issue.latitude || '19.2087'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Longitude:</span>
                  <span className="font-mono font-bold text-slate-800">{issue.longitude || '72.9716'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Hotspot Key:</span>
                  <span className="font-mono text-indigo-600 font-bold">{issue.hotspot_key || 'cluster-auto'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthorityLayout>
  )
}
