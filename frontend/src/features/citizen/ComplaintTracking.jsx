import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CitizenAppBar } from '../../components/layout'
import { StatusBadge, PriorityBadge, CategoryBadge, AiTag } from '../../components/ui'

const timelineSteps = [
  { label: 'Submitted',      icon: 'check_circle', state: 'done',    date: 'Oct 24, 2023' },
  { label: 'AI Analyzed',    icon: 'check_circle', state: 'done',    date: 'Oct 24, 2023' },
  { label: 'Issue Linked',   icon: 'check_circle', state: 'done',    date: 'Oct 25, 2023' },
  { label: 'In Progress',    icon: 'hourglass_top',state: 'active',  date: 'Oct 26, 2023' },
  { label: 'Resolved',       icon: 'radio_button_unchecked', state: 'pending', date: null },
]

export default function ComplaintTracking() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <CitizenAppBar />
      <main className="max-w-2xl mx-auto px-margin-mobile md:px-margin-desktop py-lg space-y-lg">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          {/* Header */}
          <button onClick={() => navigate('/citizen')} className="flex items-center gap-xs text-body-md text-on-surface-variant hover:text-on-surface mb-md transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
            Back to Dashboard
          </button>

          {/* Complaint Header */}
          <div className="glass-card rounded-xl p-md space-y-sm mb-lg">
            <div className="flex items-start justify-between gap-sm">
              <div>
                <span className="text-label-md text-on-surface-variant font-medium font-mono">#CID-8821</span>
                <h1 className="text-headline-lg text-on-surface font-semibold mt-[2px]">Street light not working in Ward 12</h1>
              </div>
              <StatusBadge status="In Progress" className="shrink-0" />
            </div>
            <div className="flex flex-wrap gap-sm pt-sm border-t border-outline-variant/20">
              <CategoryBadge category="Public Lighting" />
              <PriorityBadge priority="Medium" />
              <AiTag label="Waste Management" confidence={94} />
            </div>
            <div className="text-body-sm text-on-surface-variant">Submitted: Oct 24, 2023</div>
          </div>

          {/* AI Suggested Department */}
          <div className="glass-card rounded-xl p-md mb-lg space-y-sm">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-[#7c4dff]" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <h2 className="text-headline-md text-on-surface font-semibold">AI Suggested Department</h2>
              <span className="bg-purple-50 text-purple-700 text-label-md font-semibold px-sm py-[2px] rounded-full border border-purple-200">AI Suggested</span>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-sm flex items-center justify-between">
              <span className="text-body-lg text-on-surface font-semibold">Waste Management</span>
              <span className="text-headline-md text-[#7c4dff] font-bold">94%</span>
            </div>

            {/* Why this priority? */}
            <details className="mt-sm">
              <summary className="text-label-md text-primary-container font-semibold cursor-pointer hover:underline flex items-center gap-xs">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>expand_more</span>
                Why this priority?
              </summary>
              <ul className="mt-sm space-y-[6px] pl-sm">
                {['Health risk mentioned in complaint', 'Near a school (high footfall area)', 'Reported by 12 other citizens', 'Not addressed in past 3 days'].map(reason => (
                  <li key={reason} className="flex items-start gap-sm text-body-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-orange-500 shrink-0" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>error</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </details>
          </div>

          {/* Duplicate Found */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-md mb-lg">
            <div className="flex items-start gap-sm">
              <span className="material-symbols-outlined text-blue-600 shrink-0" style={{ fontSize: '22px', fontVariationSettings: "'FILL' 1" }}>link</span>
              <div>
                <p className="text-body-md text-blue-800 font-medium">We found a similar active civic issue nearby</p>
                <p className="text-body-sm text-blue-700 mt-xs">
                  <span className="font-semibold">"Missed garbage collection in Ward 12"</span>
                  <span className="ml-sm bg-blue-100 text-blue-700 px-sm py-[1px] rounded-full text-label-md">12 other reports linked</span>
                </p>
              </div>
            </div>
          </div>

          {/* Tracking Timeline */}
          <div className="glass-card rounded-xl p-md mb-lg">
            <h2 className="text-headline-md text-on-surface font-semibold mb-md">Tracking Timeline</h2>
            <div className="space-y-0">
              {timelineSteps.map((step, i) => (
                <div key={step.label} className="flex gap-md">
                  {/* Timeline spine */}
                  <div className="flex flex-col items-center">
                    <span
                      className={`material-symbols-outlined ${
                        step.state === 'done' ? 'text-green-600' :
                        step.state === 'active' ? 'text-orange-500 animate-pulse-dot' :
                        'text-outline'
                      }`}
                      style={{ fontSize: '24px', fontVariationSettings: step.state === 'done' || step.state === 'active' ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      {step.icon}
                    </span>
                    {i < timelineSteps.length - 1 && (
                      <div className={`w-0.5 h-8 mt-[2px] ${step.state === 'done' ? 'bg-green-300' : 'bg-outline-variant'}`} />
                    )}
                  </div>
                  {/* Label */}
                  <div className="pb-md">
                    <p className={`text-body-md font-medium ${step.state === 'pending' ? 'text-on-surface-variant' : 'text-on-surface'}`}>{step.label}</p>
                    {step.date && <p className="text-body-sm text-on-surface-variant">{step.date}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mini Map */}
          <div className="glass-card rounded-xl overflow-hidden mb-lg">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 h-40 flex items-center justify-center relative">
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, #93c5fd 0, #93c5fd 1px, transparent 0, transparent 40px), repeating-linear-gradient(90deg, #93c5fd 0, #93c5fd 1px, transparent 0, transparent 40px)',
                backgroundSize: '40px 40px'
              }} />
              <div className="z-10 flex flex-col items-center">
                <span className="material-symbols-outlined text-primary-container" style={{ fontSize: '36px', fontVariationSettings: "'FILL' 1" }}>location_on</span>
                <p className="text-body-sm text-primary font-medium">Ward 12, Delhi</p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
