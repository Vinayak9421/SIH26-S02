import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CitizenAppBar } from '../../components/layout'
import { toast } from 'sonner'
import { useSubmitComplaint } from '../../hooks/useApi'
import { useAuthStore } from '../../store/authStore'

const categories = ['Roads & Infrastructure', 'Solid Waste & Sanitation', 'Water Supply', 'Electrical & Street Lighting', 'Public Health', 'Traffic & Transport', 'Other']
const languages = ['English', 'Hindi (हिंदी)', 'Hinglish', 'Marathi (मराठी)', 'Tamil', 'Telugu', 'Bengali']

export default function SubmitComplaint() {
  const navigate = useNavigate()
  const { name } = useAuthStore()
  const submitMutation = useSubmitComplaint()

  const [formData, setFormData] = useState({
    description: '',
    address: '',
    latitude: null,
    longitude: null,
    category: '',
    language: 'English',
  })
  
  // Image Upload state
  const [imagePreview, setImagePreview] = useState(null)
  const [imageB64, setImageB64] = useState(null)
  const [imageName, setImageName] = useState('')

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [locating, setLocating] = useState(false)
  const [result, setResult] = useState(null)

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, JPEG)')
      return
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error('Image size must be less than 15MB')
      return
    }

    setImageName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const rawB64 = event.target.result
      const img = new Image()
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          const MAX_WIDTH = 1200
          const MAX_HEIGHT = 1200
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height
              height = MAX_HEIGHT
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          const compressedB64 = canvas.toDataURL('image/jpeg', 0.85)
          setImagePreview(compressedB64)
          setImageB64(compressedB64)
          toast.success('Photo attached! Ready for AI Vision analysis.')
        } catch (err) {
          setImagePreview(rawB64)
          setImageB64(rawB64)
          toast.success('Photo attached!')
        }
      }
      img.onerror = () => {
        setImagePreview(rawB64)
        setImageB64(rawB64)
        toast.success('Photo attached!')
      }
      img.src = rawB64
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setImagePreview(null)
    setImageB64(null)
    setImageName('')
  }

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          address: prev.address || `${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E`,
        }))
        toast.success('GPS coordinates pinned!')
        setLocating(false)
      },
      (err) => {
        toast.error('Could not retrieve GPS coordinates. Please type your address.')
        setLocating(false)
      }
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const hasText = formData.description.trim().length >= 5
    const hasImage = !!imageB64

    if (!hasText && !hasImage) {
      toast.error('Please write a short description or upload a photo evidence.')
      return
    }

    try {
      const payload = {
        text: formData.description.trim() || undefined,
        image_b64: imageB64 || undefined,
        address: formData.address || undefined,
        latitude: formData.latitude || undefined,
        longitude: formData.longitude || undefined,
      }
      const data = await submitMutation.mutateAsync(payload)
      setResult(data)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit complaint. Make sure backend is running.')
    }
  }

  const canSubmit = (formData.description.trim().length >= 5 || !!imageB64) && !submitMutation.isPending

  if (result) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans pb-12">
        <CitizenAppBar />
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-12 flex flex-col items-center justify-center text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xl shadow-emerald-500/25"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '48px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="w-full space-y-4">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Grievance Submitted Successfully!</h1>
            <p className="text-sm md:text-base text-slate-600 font-medium">
              Tracking Ticket ID: <strong className="text-indigo-600 font-mono font-bold text-lg">#{result.complaint_id?.slice(0, 8).toUpperCase()}</strong>
            </p>

            {/* AI Results Card */}
            <div className="text-left mt-6 space-y-4">
              <div className="glass-card rounded-3xl p-6 border border-slate-200 bg-white/90 shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <span className="p-1.5 rounded-xl bg-purple-50 text-purple-600">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  </span>
                  <h2 className="text-base font-bold text-slate-900">Instant AI Triage Diagnostics</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-xs md:text-sm">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-slate-500 font-medium block">Classified Category</span>
                    <span className="font-bold text-slate-900 capitalize text-base">{result.classification?.category?.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-slate-500 font-medium block">Assigned Department</span>
                    <span className="font-bold text-slate-900 text-base">{result.classification?.department}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-slate-500 font-medium block">AI Confidence Score</span>
                    <span className="font-bold text-purple-700 text-base">{(result.classification?.confidence * 100).toFixed(0)}% Match</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-slate-500 font-medium block">Calculated Urgency</span>
                    <span className="font-bold capitalize text-slate-900 text-base">{result.priority?.level} ({result.priority?.score}/100)</span>
                  </div>
                </div>

                {result.duplicate?.state !== 'none' && (
                  <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-4 mt-4">
                    <p className="text-xs md:text-sm text-indigo-900 font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-indigo-600" style={{ fontSize: '18px' }}>hub</span>
                      {result.duplicate?.state === 'linked' ? 'Auto-linked to existing neighborhood issue cluster' : 'Possible existing issue cluster detected'}:
                    </p>
                    <p className="text-xs text-indigo-700 mt-1 font-medium italic">"{result.duplicate?.matched_issue_title}"</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center pt-2">
              <button
                onClick={() => navigate(`/citizen/track/${result.complaint_id}`)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-lg shadow-indigo-500/25 transition-all"
              >
                Track Live Resolution
              </button>
              <button
                onClick={() => navigate('/citizen')}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-sm px-6 py-3 rounded-2xl shadow-xs transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      <CitizenAppBar />
      <main className="max-w-3xl mx-auto px-4 md:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/citizen')}
              className="flex items-center gap-1 text-xs md:text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors mb-2"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
              Back to Dashboard
            </button>
            <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent">
              Submit a Civic Grievance
            </h1>
            <p className="text-sm md:text-base text-slate-600 mt-1 font-medium">
              Upload a photo or describe the problem. Our Multimodal AI classifies, geocodes, and assigns it instantly.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo Upload Zone */}
            <div className="glass-card rounded-3xl p-6 space-y-3 border border-slate-200/80 bg-white/90">
              <label className="block text-sm font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-600" style={{ fontSize: '20px' }}>photo_camera</span>
                  Photo Evidence <span className="text-xs text-slate-500 font-medium">(AI Vision Analyzed)</span>
                </span>
              </label>

              {imagePreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex flex-col items-center p-3">
                  <img src={imagePreview} alt="Complaint preview" className="max-h-64 rounded-xl object-contain mb-2 shadow-sm" />
                  <div className="w-full flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-800 truncate max-w-[280px]">{imageName}</span>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-rose-600 hover:bg-rose-50 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/20 transition-all text-center group">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
                    <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>add_a_photo</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800">Click or tap to upload photo evidence</p>
                  <p className="text-xs text-slate-500 font-medium mt-1">PNG, JPG or JPEG from mobile camera or gallery</p>
                  <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                </label>
              )}
            </div>

            {/* Description */}
            <div className="glass-card rounded-3xl p-6 space-y-3 border border-slate-200/80 bg-white/90">
              <label className="block text-sm font-bold text-slate-800" htmlFor="complaint-desc">
                Describe the issue <span className="text-xs text-slate-500 font-medium">(In your own words)</span>
              </label>
              <textarea
                id="complaint-desc"
                rows={4}
                placeholder="e.g. Broken water pipeline leaking near Teen Hath Naka signal since morning..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm md:text-base text-slate-800 resize-none focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-400 font-medium transition-all"
              />
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1 text-indigo-600">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>translate</span>
                  Multilingual AI supports English, Hindi, Hinglish & Marathi
                </span>
                <span>{formData.description.length} characters</span>
              </div>
            </div>

            {/* Location Section */}
            <div className="glass-card rounded-3xl p-6 space-y-4 border border-slate-200/80 bg-white/90">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600" style={{ fontSize: '22px' }}>location_on</span>
                Location & Address Details
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="address">Address / Area / Landmark</label>
                  <input
                    id="address"
                    type="text"
                    placeholder="e.g. Viviana Mall, Eastern Express Highway, Thane, Maharashtra"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={locating}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 border border-indigo-200/60 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>my_location</span>
                    {locating ? 'Capturing GPS…' : 'Use Current Device GPS'}
                  </button>

                  {formData.latitude && (
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
                      GPS: {formData.latitude.toFixed(4)}°N, {formData.longitude.toFixed(4)}°E
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Collapsible: Optional Manual Overrides */}
            <div className="glass-card rounded-3xl overflow-hidden border border-slate-200/80 bg-white/90">
              <button
                type="button"
                onClick={() => setDetailsOpen(!detailsOpen)}
                className="w-full flex items-center justify-between px-6 py-4 text-sm font-bold text-slate-800 hover:bg-slate-50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-600" style={{ fontSize: '20px' }}>tune</span>
                  Optional Category / Language Override
                </span>
                <span className="material-symbols-outlined text-slate-400">
                  {detailsOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              <AnimatePresence>
                {detailsOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-6 pb-6 pt-2 space-y-4 border-t border-slate-100"
                  >
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="category">Category (AI will auto-classify if empty)</label>
                      <select
                        id="category"
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                      >
                        <option value="">-- AI Automatic Detection --</option>
                        {categories.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base py-4 rounded-2xl shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/35 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitMutation.isPending ? (
                <>
                  <span className="animate-spin material-symbols-outlined" style={{ fontSize: '22px' }}>progress_activity</span>
                  Analyzing Photo, Text & Geocoding with AI…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>send</span>
                  Submit Grievance to Civic Authority
                </>
              )}
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  )
}
