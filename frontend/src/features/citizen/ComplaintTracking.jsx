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

  steps.push({ label: 'Submitted', icon: 'check_circle', state: 'done', date: complaint.created_at })

  const statuses = complaint.timeline || []
  const hasAI = complaint.category !== null || complaint.ai_category !== null
  steps.push({ label: 'AI Analyzed & Triage', icon: 'check_circle', state: hasAI ? 'done' : 'active', date: hasAI ? complaint.created_at : null })

  const isLinked = complaint.duplicate_state === 'linked' || complaint.issue_id
  steps.push({ label: 'Assigned to Municipal Issue', icon: isLinked ? 'check_circle' : 'radio_button_unchecked', state: isLinked ? 'done' : 'pending', date: isLinked ? complaint.created_at : null })

  const inProgress = complaint.status === 'in_progress' || complaint.status === 'resolved'
  steps.push({ label: 'Action in Progress', icon: inProgress ? (complaint.status === 'resolved' ? 'check_circle' : 'hourglass_top') : 'radio_button_unchecked', state: inProgress ? (complaint.status === 'resolved' ? 'done' : 'active') : 'pending', date: statuses.find(s => s.status === 'in_progress')?.created_at || null })

  const resolved = complaint.status === 'resolved'
  steps.push({ label: 'Resolved & Closed', icon: resolved ? 'check_circle' : 'radio_button_unchecked', state: resolved ? 'done' : 'pending', date: statuses.find(s => s.status === 'resolved')?.created_at || null })

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
        particleCount: 70,
        spread: 70,
        origin: { y: 0.7 },
      })
      toast.success('Thank you! Your satisfaction rating has been recorded.')
    } catch (err) {
      toast.error('Failed to submit rating. Please try again.')
    } finally {
      setIsSubmittingRating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans pb-12">
        <CitizenAppBar />
        <main className="max-w-3xl mx-auto px-4 md:px-8 py-10 space-y-6 animate-pulse">
          <div className="h-10 bg-slate-200 rounded-2xl w-48" />
          <div className="h-44 bg-slate-200 rounded-3xl" />
          <div className="h-64 bg-slate-200 rounded-3xl" />
        </main>
      </div>
    )
  }

  if (error || !complaint) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans pb-12">
        <CitizenAppBar />
        <main className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-4xl">search_off</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Complaint Not Found</h1>
          <p className="text-sm text-slate-500 font-mono">Ticket ID: #{id}</p>
          <button
            onClick={() => navigate('/citizen')}
            className="mt-4 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md"
          >
            Back to My Grievances
          </button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      <CitizenAppBar />
      <main className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
          {/* Action Row */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/citizen')}
              className="flex items-center gap-1 text-xs md:text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
              Back to Dashboard
            </button>

            <button
              onClick={() => {
                downloadComplaintReceiptPDF(complaint)
                toast.success('Downloading Official Complaint Receipt (PDF)...')
              }}
              className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-all hover:shadow"
            >
              <span className="material-symbols-outlined text-indigo-600" style={{ fontSize: '18px' }}>download</span>
              Official Receipt (PDF)
            </button>
          </div>

          {/* Ticket Header Card */}
          <div className="glass-card rounded-3xl p-6 md:p-8 space-y-4 border border-slate-200/80 bg-white/90 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                  TICKET #{complaint.id?.slice(0, 8).toUpperCase()}
                </span>
                <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 mt-2 line-clamp-2">
                  {complaint.text}
                </h1>
              </div>
              <StatusBadge status={complaint.status?.replace(/_/g, ' ')} className="shrink-0 text-sm px-3 py-1" />
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              {complaint.category && <CategoryBadge category={complaint.category.replace(/_/g, ' ')} />}
              <PriorityBadge priority={complaint.priority?.charAt(0).toUpperCase() + complaint.priority?.slice(1)} />
              {complaint.department && <AiTag label={complaint.department} confidence={null} />}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 font-medium gap-2 pt-1">
              <span>Submitted: {new Date(complaint.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              {complaint.address && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>location_on</span>
                  {complaint.address}
                </span>
              )}
            </div>
          </div>

          {/* Attached Photo Evidence Card */}
          {complaint.image_url && (
            <div className="glass-card rounded-3xl p-6 space-y-3 border border-slate-200/80 bg-white/90 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <span className="material-symbols-outlined text-indigo-600" style={{ fontSize: '20px' }}>photo_camera</span>
                  Citizen Photo Evidence
                </div>
                <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-bold border border-indigo-200">
                  AI Vision Analyzed
                </span>
              </div>
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center p-2">
                <img
                  src={complaint.image_url}
                  alt="Citizen complaint"
                  className="max-h-80 w-full object-contain rounded-xl"
                />
              </div>
              {complaint.extracted_text_from_image && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <p className="text-xs md:text-sm text-slate-700 font-medium">
                    <span className="font-bold text-indigo-700">AI Visual Recognition: </span>
                    "{complaint.extracted_text_from_image}"
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Stepper Timeline */}
          <div className="glass-card rounded-3xl p-6 md:p-8 space-y-6 border border-slate-200/80 bg-white/90 shadow-sm">
            <h2 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-600" style={{ fontSize: '22px' }}>timeline</span>
              Live Resolution Stepper
            </h2>

            <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {timeline.map((step, idx) => {
                const isDone = step.state === 'done'
                const isActive = step.state === 'active'
                return (
                  <div key={idx} className="relative flex items-start gap-4">
                    <div className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center text-white ${
                      isDone ? 'bg-emerald-500 shadow-sm' : isActive ? 'bg-indigo-600 animate-pulse ring-4 ring-indigo-100' : 'bg-slate-300'
                    }`}>
                      <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                        {isDone ? 'check' : isActive ? 'hourglass_top' : 'circle'}
                      </span>
                    </div>
                    <div>
                      <h3 className={`text-sm md:text-base font-bold ${isDone ? 'text-slate-900' : isActive ? 'text-indigo-700' : 'text-slate-400'}`}>
                        {step.label}
                      </h3>
                      {step.date && (
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {new Date(step.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Satisfaction Rating Section */}
          {complaint.status === 'resolved' && (
            <div className="glass-card rounded-3xl p-6 md:p-8 border border-amber-200 bg-gradient-to-br from-amber-50/60 via-orange-50/30 to-white shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600" style={{ fontSize: '24px', fontVariationSettings: "'FILL' 1" }}>
                  stars
                </span>
                <h2 className="text-base md:text-lg font-bold text-amber-950">Resolution Quality Feedback</h2>
              </div>

              {complaint.satisfaction_rating ? (
                <div className="bg-white/90 border border-amber-200 rounded-2xl p-5 space-y-2">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`material-symbols-outlined text-2xl ${
                          star <= complaint.satisfaction_rating ? 'text-amber-500' : 'text-slate-200'
                        }`}
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                    ))}
                    <span className="text-sm font-bold text-amber-950 ml-2">
                      {complaint.satisfaction_rating} / 5 Stars
                    </span>
                  </div>
                  {complaint.satisfaction_feedback && (
                    <p className="text-xs md:text-sm text-slate-700 italic font-medium">"{complaint.satisfaction_feedback}"</p>
                  )}
                </div>
              ) : (
                <form onSubmit={handleRateSubmit} className="space-y-4">
                  <p className="text-xs md:text-sm text-amber-900 font-medium">
                    This issue was marked resolved by the municipal authority. How was your experience?
                  </p>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="text-3xl text-amber-400 hover:scale-125 transition-transform focus:outline-none"
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: star <= (hoverRating || rating) ? "'FILL' 1" : "'FILL' 0" }}
                        >
                          star
                        </span>
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Optional feedback (e.g. Prompt action, well resolved!)..."
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    className="w-full rounded-2xl border border-amber-200 bg-white p-3 text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingRating}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs md:text-sm px-6 py-2.5 rounded-xl shadow-md transition-all disabled:opacity-50"
                  >
                    {isSubmittingRating ? 'Recording…' : 'Submit Feedback'}
                  </button>
                </form>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}
