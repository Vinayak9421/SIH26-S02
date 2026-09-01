import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CitizenAppBar } from '../../components/layout'

const categories = ['Roads', 'Sanitation', 'Water Supply', 'Electricity', 'Public Lighting', 'Drainage', 'Parks', 'Other']
const languages = ['English', 'Hindi', 'Hinglish', 'Tamil', 'Telugu', 'Bengali', 'Marathi']

export default function SubmitComplaint() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    description: '',
    address: 'Ward 12, Near City School, Delhi - 110001',
    category: '',
    language: 'English',
    files: [],
  })
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1500))
    setSubmitting(false)
    setSubmitted(true)
    setTimeout(() => navigate('/citizen'), 2500)
  }

  if (submitted) {
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
            <p className="text-body-lg text-on-surface-variant mt-sm">Your complaint ID is <strong className="text-primary-container">#CID-9071</strong>. Our AI is analyzing it now.</p>
            <p className="text-body-md text-on-surface-variant mt-sm">Redirecting to your dashboard…</p>
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
            <p className="text-body-md text-on-surface-variant mt-xs">Describe your issue and our AI will categorize and route it automatically.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-lg">
            {/* Description */}
            <div className="glass-card rounded-xl p-md space-y-sm">
              <label className="block text-label-md text-on-surface-variant" htmlFor="complaint-desc">
                Describe your complaint <span className="text-error">*</span>
              </label>
              <textarea
                id="complaint-desc"
                rows={5}
                placeholder="Ward 12 mein school ke paas teen din se kachra nahi uthaya gaya..."
                required
                minLength={10}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-md border border-outline-variant bg-white px-md py-sm text-body-lg text-on-surface resize-none focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 placeholder:text-outline transition-all"
              />
              <div className="flex items-center justify-between">
                <p className="text-body-sm text-on-surface-variant flex items-center gap-xs">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>translate</span>
                  You can write in English, Hindi, or Hinglish.
                </p>
                <span className={`text-body-sm ${formData.description.length < 10 ? 'text-error' : 'text-green-600'}`}>
                  {formData.description.length}/10 min
                </span>
              </div>
            </div>

            {/* Location Section */}
            <div className="glass-card rounded-xl p-md space-y-md">
              <h2 className="text-headline-md text-on-surface font-semibold flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary-container" style={{ fontSize: '22px' }}>location_on</span>
                Location
              </h2>
              {/* Map placeholder */}
              <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 h-48 flex flex-col items-center justify-center gap-sm relative overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, #93c5fd 0, #93c5fd 1px, transparent 0, transparent 50%), repeating-linear-gradient(90deg, #93c5fd 0, #93c5fd 1px, transparent 0, transparent 50%)',
                  backgroundSize: '30px 30px'
                }} />
                <span className="material-symbols-outlined text-primary-container z-10" style={{ fontSize: '40px', fontVariationSettings: "'FILL' 1" }}>location_on</span>
                <p className="text-body-md text-primary-container font-medium z-10">Drag pin to pinpoint location</p>
                <p className="text-body-sm text-primary z-10">Ward 12, Delhi</p>
              </div>
              <button type="button"
                className="border border-primary-container text-primary-container text-label-md font-semibold px-md py-sm rounded-md hover:bg-primary-container/5 transition-all flex items-center gap-sm"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>my_location</span>
                Use my current location
              </button>
              <div>
                <label className="block text-label-md text-on-surface-variant mb-xs" htmlFor="address">Address</label>
                <input id="address" type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-md border border-outline-variant bg-white px-md py-[10px] text-body-md text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all"
                />
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
                  <span className="material-symbols-outlined text-primary-container" style={{ fontSize: '20px' }}>expand_more</span>
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
                      {/* Photo upload */}
                      <div>
                        <label className="block text-label-md text-on-surface-variant mb-sm">Photos (optional)</label>
                        <div className="border-2 border-dashed border-outline-variant rounded-xl p-lg flex flex-col items-center justify-center gap-sm cursor-pointer hover:border-primary-container hover:bg-primary-container/5 transition-all">
                          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '36px' }}>cloud_upload</span>
                          <p className="text-body-md text-on-surface-variant">Drag & drop or <span className="text-primary-container font-medium">browse</span></p>
                          <p className="text-body-sm text-outline">JPG, PNG, HEIC up to 10MB each</p>
                        </div>
                      </div>
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
              disabled={submitting || formData.description.length < 10}
              className="w-full bg-primary-container text-on-primary font-semibold text-body-lg py-md rounded-xl hover:shadow-md hover:-translate-y-px transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-sm"
            >
              {submitting
                ? <><span className="animate-spin material-symbols-outlined" style={{ fontSize: '22px' }}>progress_activity</span> Analyzing with AI…</>
                : <><span className="material-symbols-outlined" style={{ fontSize: '22px' }}>send</span> Submit Complaint</>
              }
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  )
}
