import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { toast } from 'sonner'
import { CitizenAppBar } from '../../components/layout'
import { StatusBadge, PriorityBadge, CategoryBadge, AiTag } from '../../components/ui'
import { useComplaintDetail, useRateComplaint } from '../../hooks/useApi'
import { downloadComplaintReceiptPDF } from '../../lib/pdfExport'

function buildTimeline(complaint) {
  const steps = []
  if (!complaint) return steps

  const isAfter = (a, b) => new Date(a) >= new Date(b)

  steps.push({ label: 'Submitted', icon: 'check_circle', state: 'done', date: complaint.created_at })

  const statuses = complaint.timeline || []
  const hasAI = complaint.category !== null
  steps.push({ label: 'AI Analyzed', icon: 'check_circle', state: hasAI ? 'done' : 'active', date: hasAI ? complaint.created_at : null })

  const isLinked = complaint.duplicate_state === 'linked' || complaint.issue_id
  steps.push({ label: 'Issue Linked', icon: isLinked ? 'check_circle' : 'radio_button_unchecked', state: isLinked ? 'done' : 'pending', date: isLinked ? complaint.created_at : null })

  const inProgress = complaint.status === 'in_progress' || complaint.status === 'resolved'
  steps.push({ label: 'In Progress', icon: inProgress ? (complaint.status === 'resolved' ? 'check_circle' : 'hourglass_top') : 'radio_button_unchecked', state: inProgress ? (complaint.status === 'resolved' ? 'done' : 'active') : 'pending', date: statuses.find(s => s.status === 'in_progress')?.created_at || null })

  const resolved = complaint.status === 'resolved'
  steps.push({ label: 'Resolved', icon: resolved ? 'check_circle' : 'radio_button_unchecked', state: resolved ? 'done' : 'pending', date: statuses.find(s => s.status === 'resolved')?.created_at || null })

  return steps
}

export default function ComplaintTracking() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: complaint, isLoading, error } = useComplaintDetail(id)
  const rateMutation = useRateComplaint()

  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [isSubmittingRating, setIsSubmittingRating] = useState(false)

  const timeline = buildTimeline(complaint)

  const handleRateSubmit = async (e) => {
    e.preventDefault()
    if (!complaint) return
    setIsSubmittingRating(true)
    try {
      await rateMutation.mutateAsync({
        id: complaint.id,
        rating,
        feedback: feedback.trim() || undefined,
      })
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
      })
      toast.success('Thank you! Your satisfaction feedback has been recorded.')
    } catch (err) {
      toast.error('Failed to submit rating. Please try again.')
    } finally {
      setIsSubmittingRating(false)
    }
  }

  if (!id) {
    return (
      <div className="min-h-screen bg-[#f7f8fa]">
        <CitizenAppBar />
        <main className="max-w-2xl mx-auto px-margin-mobile py-xl text-center">
          <span className="material-symbols-outlined block mx-auto text-on-surface-variant mb-sm" style={{ fontSize: '48px' }}>search</span>
          <h1 className="text-headline-lg text-on-surface font-semibold">Track a Complaint</h1>
          <p className="text-body-md text-on-surface-variant mt-sm">Enter your complaint ID from your submission confirmation.</p>
          <p className="text-body-sm text-on-surface-variant mt-lg">Use the URL: <code className="bg-surface-container px-sm py-xs rounded">/citizen/track/YOUR-COMPLAINT-ID</code></p>
        </main>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f7f8fa]">
        <CitizenAppBar />
        <main className="max-w-2xl mx-auto px-margin-mobile py-lg space-y-md animate-pulse">
          <div className="h-8 bg-surface-container rounded-lg w-48" />
          <div className="h-32 bg-surface-container rounded-xl" />
          <div className="h-48 bg-surface-container rounded-xl" />
          <div className="h-40 bg-surface-container rounded-xl" />
        </main>
      </div>
    )
  }

  if (error || !complaint) {
    return (
      <div className="min-h-screen bg-[#f7f8fa]">
        <CitizenAppBar />
        <main className="max-w-2xl mx-auto px-margin-mobile py-xl text-center">
          <span className="material-symbols-outlined block mx-auto text-on-surface-variant mb-sm" style={{ fontSize: '48px' }}>search_off</span>
          <h1 className="text-headline-lg text-on-surface font-semibold">Complaint Not Found</h1>
          <p className="text-body-md text-on-surface-variant mt-sm">ID: <code className="font-mono">{id}</code></p>
          <button onClick={() => navigate('/citizen')} className="mt-lg text-primary-container hover:underline">← Back to Dashboard</button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <CitizenAppBar />
      <main className="max-w-2xl mx-auto px-margin-mobile md:px-margin-desktop py-lg space-y-lg">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          {/* Top Navigation & Action Row */}
          <div className="flex items-center justify-between mb-md">
            <button onClick={() => navigate('/citizen')} className="flex items-center gap-xs text-body-md text-on-surface-variant hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
              Back to Dashboard
            </button>

            <button
              onClick={() => {
                downloadComplaintReceiptPDF(complaint)
                toast.success('Downloading Official Receipt PDF...')
              }}
              className="inline-flex items-center gap-xs bg-white border border-outline-variant/40 hover:bg-slate-50 text-primary-container text-label-md font-semibold px-md py-xs rounded-lg shadow-sm transition-all hover:shadow"
            >
              <span className="material-symbols-outlined text-primary-container" style={{ fontSize: '18px' }}>download</span>
              Download Receipt (PDF)
            </button>
          </div>

          {/* Complaint Header */}
          <div className="glass-card rounded-xl p-md space-y-sm mb-lg">
            <div className="flex items-start justify-between gap-sm">
              <div>
                <span className="text-label-md text-on-surface-variant font-medium font-mono">#{complaint.id?.slice(0, 8)}</span>
                <h1 className="text-headline-lg text-on-surface font-semibold mt-[2px] line-clamp-2">{complaint.text}</h1>
              </div>
              <StatusBadge status={complaint.status?.replace(/_/g, ' ')} className="shrink-0" />
            </div>
            <div className="flex flex-wrap gap-sm pt-sm border-t border-outline-variant/20">
              {complaint.category && <CategoryBadge category={complaint.category.replace(/_/g, ' ')} />}
              <PriorityBadge priority={complaint.priority?.charAt(0).toUpperCase() + complaint.priority?.slice(1)} />
              {complaint.department && <AiTag label={complaint.department} confidence={null} />}
            </div>
            <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
              <span>Submitted: {new Date(complaint.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              {complaint.address && (
                <span className="flex items-center gap-xs">
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>location_on</span>
                  {complaint.address}
                </span>
              )}
            </div>
          </div>

          {/* Citizen Satisfaction Rating Section (Visible when Resolved) */}
          {complaint.status === 'resolved' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-amber-50 to-orange-50/60 border border-amber-200 rounded-xl p-md mb-lg shadow-sm"
            >
              <div className="flex items-center gap-sm mb-xs">
                <span className="material-symbols-outlined text-amber-600" style={{ fontSize: '24px', fontVariationSettings: "'FILL' 1" }}>
                  stars
                </span>
                <h2 className="text-headline-md text-amber-950 font-semibold">Grievance Resolution Feedback</h2>
              </div>
              <p className="text-body-sm text-amber-900/80 mb-md">
                Civic authorities marked this complaint resolved. How satisfied are you with the resolution?
              </p>

              {complaint.satisfaction_rating ? (
                <div className="bg-white/80 border border-amber-200/80 rounded-lg p-md">
                  <div className="flex items-center gap-xs mb-xs">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`material-symbols-outlined text-xl ${
                          star <= complaint.satisfaction_rating ? 'text-amber-500' : 'text-slate-300'
                        }`}
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                    ))}
                    <span className="text-body-md font-bold text-amber-950 ml-sm">
                      {complaint.satisfaction_rating} / 5 Stars
                    </span>
                    <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-sm py-[2px] rounded-full ml-auto">
                      Feedback Submitted
                    </span>
                  </div>
                  {complaint.satisfaction_feedback && (
                    <p className="text-body-sm text-slate-700 italic mt-xs">
                      "{complaint.satisfaction_feedback}"
                    </p>
                  )}
                  {complaint.rated_at && (
                    <p className="text-[11px] text-slate-400 mt-xs">
                      Recorded on {new Date(complaint.rated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
              ) : (
                <form onSubmit={handleRateSubmit} className="space-y-md">
                  <div className="flex items-center gap-sm">
                    <span className="text-body-sm text-amber-950 font-medium">Your Rating:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 text-amber-500 hover:scale-110 transition-transform focus:outline-none"
                        >
                          <span
                            className="material-symbols-outlined text-2xl"
                            style={{ fontVariationSettings: (hoverRating || rating) >= star ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            star
                          </span>
                        </button>
                      ))}
                    </div>
                    <span className="text-body-sm font-semibold text-amber-900 ml-xs">
                      {rating === 5 ? 'Excellent' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Poor' : 'Very Poor'}
                    </span>
                  </div>

                  <textarea
                    rows={2}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Optional feedback for the department (e.g. prompt service, cleanly resolved)..."
                    className="w-full bg-white border border-amber-200 rounded-lg p-sm text-body-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-slate-400"
                  />

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingRating}
                      className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-label-md font-semibold px-lg py-xs rounded-lg shadow-sm transition-all"
                    >
                      {isSubmittingRating ? 'Saving...' : 'Submit Satisfaction Rating'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          )}

          {/* Duplicate / Issue Link */}
          {complaint.issue_id && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-md mb-lg">
              <div className="flex items-start gap-sm">
                <span className="material-symbols-outlined text-blue-600 shrink-0" style={{ fontSize: '22px', fontVariationSettings: "'FILL' 1" }}>link</span>
                <div>
                  <p className="text-body-md text-blue-800 font-medium">
                    {complaint.duplicate_state === 'linked' ? 'Linked to a similar active issue' : 'Connected to civic issue'}
                  </p>
                  {complaint.issue_title && (
                    <p className="text-body-sm text-blue-700 mt-xs font-semibold">"{complaint.issue_title}"</p>
                  )}
                  {complaint.issue_status && (
                    <p className="text-body-sm text-blue-600 mt-xs capitalize">Issue status: {complaint.issue_status.replace(/_/g, ' ')}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI Analysis */}
          {complaint.department && (
            <div className="glass-card rounded-xl p-md mb-lg space-y-sm">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-[#7c4dff]" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <h2 className="text-headline-md text-on-surface font-semibold">AI Routing Decision</h2>
              </div>
              <div className="bg-purple-50 border border-purple-100 rounded-lg p-sm">
                <p className="text-body-sm text-on-surface-variant">Routed to Department</p>
                <p className="text-body-lg text-on-surface font-bold">{complaint.department}</p>
              </div>
              {complaint.priority_reasons && complaint.priority_reasons.length > 0 && (
                <details className="mt-sm">
                  <summary className="text-label-md text-primary-container font-semibold cursor-pointer hover:underline flex items-center gap-xs">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>expand_more</span>
                    Why this priority?
                  </summary>
                  <ul className="mt-sm space-y-[6px] pl-sm">
                    {complaint.priority_reasons.map(reason => (
                      <li key={reason} className="flex items-start gap-sm text-body-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-orange-500 shrink-0" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>error</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}

          {/* Tracking Timeline */}
          <div className="glass-card rounded-xl p-md mb-lg">
            <h2 className="text-headline-md text-on-surface font-semibold mb-md">Tracking Timeline</h2>
            <div className="space-y-0">
              {timeline.map((step, i) => (
                <div key={step.label} className="flex gap-md">
                  <div className="flex flex-col items-center">
                    <span
                      className={`material-symbols-outlined ${
                        step.state === 'done' ? 'text-green-600' :
                        step.state === 'active' ? 'text-orange-500 animate-pulse' :
                        'text-outline'
                      }`}
                      style={{ fontSize: '24px', fontVariationSettings: step.state !== 'pending' ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      {step.icon}
                    </span>
                    {i < timeline.length - 1 && (
                      <div className={`w-0.5 h-8 mt-[2px] ${step.state === 'done' ? 'bg-green-300' : 'bg-outline-variant'}`} />
                    )}
                  </div>
                  <div className="pb-md">
                    <p className={`text-body-md font-medium ${step.state === 'pending' ? 'text-on-surface-variant' : 'text-on-surface'}`}>{step.label}</p>
                    {step.date && <p className="text-body-sm text-on-surface-variant">{new Date(step.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
