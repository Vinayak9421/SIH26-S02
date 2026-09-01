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
        <div className="space-y-md animate-pulse max-w-5xl">
          <div className="h-8 bg-surface-container rounded-lg w-48" />
          <div className="h-12 bg-surface-container rounded-lg" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
            <div className="lg:col-span-2 space-y-md">
              <div className="h-48 bg-surface-container rounded-xl" />
              <div className="h-64 bg-surface-container rounded-xl" />
            </div>
            <div className="h-64 bg-surface-container rounded-xl" />
          </div>
        </div>
      </AuthorityLayout>
    )
  }

  if (error || !issue) {
    return (
      <AuthorityLayout>
        <div className="text-center py-xl">
          <span className="material-symbols-outlined block mx-auto text-on-surface-variant" style={{ fontSize: '48px' }}>error</span>
          <p className="text-body-lg text-on-surface-variant mt-sm">Issue not found or failed to load.</p>
          <button onClick={() => navigate('/authority/issues')} className="mt-md text-primary-container hover:underline">← Back to Queue</button>
        </div>
      </AuthorityLayout>
    )
  }

  const currentStatus = pendingStatus || issue.status
  const formattedStatus = (s) => s?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  return (
    <AuthorityLayout>
      <div className="space-y-lg max-w-5xl">
        {/* Back + Title */}
        <div>
          <button onClick={() => navigate('/authority/issues')} className="flex items-center gap-xs text-body-md text-on-surface-variant hover:text-on-surface mb-sm transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
            Back to Issue Queue
          </button>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-md">
            <div>
              <div className="flex items-center gap-sm mb-xs">
                <span className="font-mono text-label-md text-on-surface-variant font-semibold">#{issue.id?.slice(0, 8)}</span>
                <PriorityBadge priority={formattedStatus(issue.priority)} />
              </div>
              <h1 className="text-headline-lg text-on-surface font-semibold">{issue.title}</h1>
              <div className="flex flex-wrap gap-sm mt-sm">
                {issue.category && <CategoryBadge category={issue.category.replace(/_/g, ' ')} />}
                {issue.department_name && <AiTag label={issue.department_name} confidence={null} />}
                {issue.address && (
                  <span className="text-body-sm text-on-surface-variant flex items-center gap-xs">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>location_on</span>
                    {issue.address}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-start md:items-end gap-sm shrink-0">
              <StatusBadge status={formattedStatus(currentStatus)} />
              <div className="flex items-center gap-sm">
                <select
                  value={pendingStatus || issue.status}
                  onChange={e => setPendingStatus(e.target.value)}
                  className="border border-primary-container text-primary-container rounded-md px-sm py-[6px] text-label-md font-semibold bg-white focus:outline-none"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {pendingStatus && pendingStatus !== issue.status && (
                  <button
                    onClick={handleStatusUpdate}
                    disabled={updateIssue.isPending}
                    className="bg-primary-container text-on-primary text-label-md font-semibold px-sm py-[6px] rounded-md hover:shadow-md transition-all disabled:opacity-50"
                  >
                    {updateIssue.isPending ? '…' : 'Save'}
                  </button>
                )}
              </div>
              {issue.status !== 'resolved' && (
                <button
                  onClick={handleResolve}
                  disabled={resolving}
                  className="bg-green-600 text-white text-label-md font-semibold px-md py-sm rounded-md hover:bg-green-700 transition-all disabled:opacity-50 flex items-center gap-xs"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                  {resolving ? 'Resolving…' : 'Resolve Issue'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 2-column */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
          {/* Left col */}
          <div className="lg:col-span-2 space-y-md">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-sm">
              <div className="glass-card rounded-xl p-sm text-center">
                <p className="text-headline-xl font-bold text-primary-container">{issue.complaint_count}</p>
                <p className="text-body-sm text-on-surface-variant">Linked Complaints</p>
              </div>
              <div className="glass-card rounded-xl p-sm text-center">
                <p className="text-headline-xl font-bold text-on-surface">{issue.priority_score}</p>
                <p className="text-body-sm text-on-surface-variant">Priority Score</p>
              </div>
              <div className="glass-card rounded-xl p-sm text-center">
                <p className="text-headline-xl font-bold text-on-surface capitalize">{issue.status?.replace(/_/g, ' ')}</p>
                <p className="text-body-sm text-on-surface-variant">Status</p>
              </div>
            </div>

            {/* Linked Complaints */}
            <div className="glass-card rounded-xl p-md space-y-sm">
              <h2 className="text-headline-md text-on-surface font-semibold">
                Linked Complaints
                <span className="ml-sm bg-primary/10 text-primary text-label-md font-bold px-sm py-[2px] rounded-full">{issue.linked_complaints?.length || 0}</span>
              </h2>
              <div className="space-y-sm">
                {(issue.linked_complaints || []).map(c => (
                  <div key={c.id} className="flex items-start gap-sm p-sm bg-surface-container-low rounded-lg border border-outline-variant/20">
                    <span className="font-mono text-label-md text-primary-container font-semibold shrink-0">#{c.id?.slice(0, 8)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-sm">
                        <PriorityBadge priority={formattedStatus(c.priority)} />
                        <StatusBadge status={formattedStatus(c.status)} />
                        <span className="text-body-sm text-on-surface-variant">{new Date(c.created_at).toLocaleDateString('en-IN')}</span>
                      </div>
                      <p className="text-body-md text-on-surface italic mt-xs">"{c.text?.slice(0, 120)}{c.text?.length > 120 ? '…' : ''}"</p>
                      {c.address && <p className="text-body-sm text-on-surface-variant mt-xs">📍 {c.address}</p>}
                    </div>
                  </div>
                ))}
                {(!issue.linked_complaints || issue.linked_complaints.length === 0) && (
                  <p className="text-body-sm text-on-surface-variant">No linked complaints yet.</p>
                )}
              </div>
            </div>

            {/* Add note / update */}
            <div className="glass-card rounded-xl p-md space-y-sm">
              <h2 className="text-headline-md text-on-surface font-semibold">Add Internal Note</h2>
              <textarea
                rows={3}
                placeholder="Add an internal update or action note..."
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full rounded-md border border-outline-variant bg-white px-md py-sm text-body-md text-on-surface resize-none focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 placeholder:text-outline"
              />
              <button
                onClick={handleStatusUpdate}
                disabled={!note || updateIssue.isPending}
                className="bg-primary-container text-on-primary text-label-md font-semibold px-md py-sm rounded-md hover:shadow-md transition-all disabled:opacity-50"
              >
                {updateIssue.isPending ? 'Saving…' : 'Post Note & Save'}
              </button>
            </div>
          </div>

          {/* Right col */}
          <div className="space-y-md">
            {/* Issue summary */}
            {issue.summary && (
              <div className="glass-card rounded-xl p-md">
                <h3 className="text-headline-md text-on-surface font-semibold mb-sm flex items-center gap-sm">
                  <span className="material-symbols-outlined text-[#7c4dff]" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  AI Summary
                </h3>
                <p className="text-body-md text-on-surface">{issue.summary}</p>
              </div>
            )}

            {/* Activity / Status Timeline */}
            <div className="glass-card rounded-xl p-md">
              <h3 className="text-headline-md text-on-surface font-semibold mb-md">Status Timeline</h3>
              <div className="space-y-sm">
                {(issue.timeline || []).map((t, i) => (
                  <div key={i} className="flex items-start gap-sm border-b border-outline-variant/20 pb-sm last:border-0">
                    <span className="material-symbols-outlined text-primary-container shrink-0" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>
                      history
                    </span>
                    <div>
                      <p className="text-body-sm text-on-surface font-medium capitalize">{t.status?.replace(/_/g, ' ')}</p>
                      {t.note && <p className="text-body-sm text-on-surface-variant">{t.note}</p>}
                      <p className="text-body-sm text-on-surface-variant">{new Date(t.created_at).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
                {(!issue.timeline || issue.timeline.length === 0) && (
                  <p className="text-body-sm text-on-surface-variant">No status changes yet.</p>
                )}
              </div>
            </div>

            {/* Location */}
            {issue.address && (
              <div className="glass-card rounded-xl p-md">
                <h3 className="text-headline-md text-on-surface font-semibold mb-sm">Location</h3>
                <p className="text-body-md text-on-surface flex items-center gap-xs">
                  <span className="material-symbols-outlined text-primary-container" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>location_on</span>
                  {issue.address}
                </p>
                {issue.latitude && issue.longitude && (
                  <p className="text-body-sm text-on-surface-variant mt-xs">
                    {issue.latitude.toFixed(4)}°N, {issue.longitude.toFixed(4)}°E
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthorityLayout>
  )
}
