import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CitizenAppBar } from '../../components/layout'
import { toast } from 'sonner'
import { useSubmitComplaint } from '../../hooks/useApi'
import { useAuthStore } from '../../store/authStore'

const categories = ['Roads', 'Sanitation', 'Water Supply', 'Electricity', 'Public Lighting', 'Drainage', 'Parks', 'Other']
const languages = ['English', 'Hindi', 'Hinglish', 'Tamil', 'Telugu', 'Bengali', 'Marathi']

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
        toast.success('Location captured!')
        setLocating(false)
      },
      (err) => {
        toast.error('Could not get your location. Please type the address.')
        setLocating(false)
      }
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const hasText = formData.description.trim().length >= 5
    const hasImage = !!imageB64

    if (!hasText && !hasImage) {
      toast.error('Please provide a description or upload a photo of the complaint.')
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
      <div className="min-h-screen bg-[#f7f8fa]">
        <CitizenAppBar />
        <div className="max-w-xl mx-auto px-margin-mobile py-xl flex flex-col items-center justify-center text-center space-y-lg">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
            className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-green-600" style={{ fontSize: '48px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h1 className="text-headline-lg text-on-surface font-semibold">Complaint Submitted!</h1>
            <p className="text-body-lg text-on-surface-variant mt-sm">
              Complaint ID: <strong className="text-primary-container font-mono">#{result.complaint_id?.slice(0, 8)}</strong>
            </p>

            {/* AI Results */}
            <div className="text-left mt-lg space-y-sm">
              <div className="glass-card rounded-xl p-md">
                <div className="flex items-center gap-sm mb-sm">
                  <span className="material-symbols-outlined text-[#7c4dff]" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  <h2 className="text-headline-md font-semibold text-on-surface">AI Vision & Text Analysis Complete</h2>
                </div>
                <div className="space-y-xs">
                  <div className="flex justify-between text-body-md">
                    <span className="text-on-surface-variant">Category</span>
                    <span className="font-semibold text-on-surface capitalize">{result.classification?.category?.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between text-body-md">
                    <span className="text-on-surface-variant">Department</span>
                    <span className="font-semibold text-on-surface">{result.classification?.department}</span>
                  </div>
                  <div className="flex justify-between text-body-md">
                    <span className="text-on-surface-variant">AI Confidence</span>
                    <span className="font-semibold text-[#7c4dff]">{(result.classification?.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between text-body-md">
                    <span className="text-on-surface-variant">Priority</span>
                    <span className="font-semibold capitalize text-on-surface">{result.priority?.level} ({result.priority?.score}/100)</span>
                  </div>
                  {result.duplicate?.state !== 'none' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-sm mt-sm">
                      <p className="text-body-sm text-blue-800 font-medium">
                        🔗 {result.duplicate?.state === 'linked' ? 'Linked to existing issue' : 'Possible duplicate detected'}:
                        "{result.duplicate?.matched_issue_title}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-sm mt-lg justify-center">
              <button
                onClick={() => navigate(`/citizen/track/${result.complaint_id}`)}
                className="bg-primary-container text-on-primary font-semibold px-lg py-sm rounded-xl hover:shadow-md transition-all"
              >
                Track Complaint
              </button>
              <button
                onClick={() => navigate('/citizen')}
                className="border border-outline-variant text-on-surface-variant font-semibold px-lg py-sm rounded-xl hover:bg-surface-container transition-all"
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
    <div className="min-h-screen bg-[#f7f8fa]">
      <CitizenAppBar />
      <main className="max-w-2xl mx-auto px-margin-mobile md:px-margin-desktop py-lg">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          {/* Header */}
          <div className="mb-lg">
            <button onClick={() => navigate('/citizen')} className="flex items-center gap-xs text-body-md text-on-surface-variant hover:text-on-surface transition-colors mb-sm">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
              Back to Dashboard
            </button>
            <h1 className="text-headline-lg text-on-surface font-semibold">Submit a Complaint</h1>
            <p className="text-body-md text-on-surface-variant mt-xs">Upload a photo of the civic issue or write a description. AI Vision will analyze & route it automatically.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-lg">
            
            {/* Image Upload Box */}
            <div className="glass-card rounded-xl p-md space-y-sm">
              <label className="block text-label-md text-on-surface-variant flex items-center justify-between">
                <span className="flex items-center gap-xs font-semibold text-on-surface">
                  <span className="material-symbols-outlined text-primary-container" style={{ fontSize: '20px' }}>photo_camera</span>
                  Upload Complaint Photo <span className="text-xs text-on-surface-variant font-normal">(Optional if text provided)</span>
                </span>
              </label>

              {imagePreview ? (
                <div className="relative rounded-lg overflow-hidden border border-outline-variant bg-surface-container flex flex-col items-center p-sm">
                  <img src={imagePreview} alt="Complaint preview" className="max-h-56 rounded-md object-contain mb-xs" />
                  <div className="w-full flex items-center justify-between px-sm py-xs bg-white/80 rounded-md">
                    <span className="text-body-sm text-on-surface font-medium truncate max-w-[250px]">{imageName}</span>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-error hover:bg-error-container/20 px-sm py-xs rounded text-body-sm font-semibold flex items-center gap-xs transition-colors"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-outline-variant hover:border-primary-container rounded-xl p-md flex flex-col items-center justify-center cursor-pointer bg-white hover:bg-primary-container/5 transition-all text-center group">
                  <span className="material-symbols-outlined text-outline group-hover:text-primary-container mb-xs" style={{ fontSize: '36px' }}>add_a_photo</span>
                  <p className="text-body-md font-medium text-on-surface">Click to upload photo evidence</p>
                  <p className="text-body-sm text-on-surface-variant">PNG, JPG or JPEG (Max 10MB)</p>
                  <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                </label>
              )}
            </div>

            {/* Description */}
            <div className="glass-card rounded-xl p-md space-y-sm">
              <label className="block text-label-md text-on-surface-variant font-semibold text-on-surface" htmlFor="complaint-desc">
                Describe your complaint <span className="text-xs text-on-surface-variant font-normal">(Optional if photo uploaded)</span>
              </label>
              <textarea
                id="complaint-desc"
                rows={4}
                placeholder="Ward 12 mein school ke paas teen din se kachra nahi uthaya gaya..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-md border border-outline-variant bg-white px-md py-sm text-body-lg text-on-surface resize-none focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 placeholder:text-outline transition-all"
              />
              <div className="flex items-center justify-between">
                <p className="text-body-sm text-on-surface-variant flex items-center gap-xs">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>translate</span>
                  Supports English, Hindi, or Hinglish.
                </p>
                <span className="text-body-sm text-on-surface-variant">
                  {formData.description.length} chars
                </span>
              </div>
            </div>

            {/* Location Section */}
            <div className="glass-card rounded-xl p-md space-y-md">
              <h2 className="text-headline-md text-on-surface font-semibold flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary-container" style={{ fontSize: '22px' }}>location_on</span>
                Location
              </h2>
              <div className="space-y-sm">
                <div>
                  <label className="block text-label-md text-on-surface-variant mb-xs" htmlFor="address">Address / Landmark</label>
                  <input id="address" type="text"
                    placeholder="e.g. Ward 12, Near City School, Delhi"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full rounded-md border border-outline-variant bg-white px-md py-[10px] text-body-md text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={locating}
                  className="border border-primary-container text-primary-container text-label-md font-semibold px-md py-sm rounded-md hover:bg-primary-container/5 transition-all flex items-center gap-sm disabled:opacity-50"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>my_location</span>
                  {locating ? 'Getting location…' : 'Use my current location'}
                </button>
                {formData.latitude && (
                  <div className="bg-green-50 border border-green-200 rounded-md px-sm py-xs text-body-sm text-green-700 flex items-center gap-xs">
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
                    GPS: {formData.latitude.toFixed(4)}°N, {formData.longitude.toFixed(4)}°E
                  </div>
                )}
              </div>
            </div>

            {/* Collapsible: Add more details */}
            <div className="glass-card rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setDetailsOpen(!detailsOpen)}
                className="w-full flex items-center justify-between px-md py-sm text-body-md text-on-surface font-medium hover:bg-surface-container-low transition-colors"
              >
                <span className="flex items-center gap-sm">
                  <span className="material-symbols-outlined text-primary-container" style={{ fontSize: '20px' }}>tune</span>
                  Add more details (optional)
                </span>
                <motion.span
                  className="material-symbols-outlined text-on-surface-variant"
                  animate={{ rotate: detailsOpen ? 180 : 0 }}
                  style={{ fontSize: '20px' }}
                >
                  keyboard_arrow_down
                </motion.span>
              </button>
              <AnimatePresence>
                {detailsOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden border-t border-outline-variant/20"
                  >
                    <div className="px-md pb-md pt-sm space-y-md">
                      {/* Category */}
                      <div>
                        <label className="block text-label-md text-on-surface-variant mb-xs" htmlFor="category">Category (AI will auto-detect)</label>
                        <select id="category" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                          className="w-full rounded-md border border-outline-variant bg-white px-md py-[10px] text-body-md text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20"
                        >
                          <option value="">-- AI Auto Detect --</option>
                          {categories.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      {/* Language */}
                      <div>
                        <label className="block text-label-md text-on-surface-variant mb-xs" htmlFor="lang">Language of complaint</label>
                        <select id="lang" value={formData.language} onChange={e => setFormData({ ...formData, language: e.target.value })}
                          className="w-full rounded-md border border-outline-variant bg-white px-md py-[10px] text-body-md text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20"
                        >
                          {languages.map(l => <option key={l}>{l}</option>)}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-primary-container text-on-primary font-semibold text-body-lg py-md rounded-xl hover:shadow-md hover:-translate-y-px transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-sm"
            >
              {submitMutation.isPending
                ? <><span className="animate-spin material-symbols-outlined" style={{ fontSize: '22px' }}>progress_activity</span> Analyzing Photo & Text with AI…</>
                : <><span className="material-symbols-outlined" style={{ fontSize: '22px' }}>send</span> Submit Complaint</>
              }
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  )
}
