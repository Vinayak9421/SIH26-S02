import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CitizenAppBar } from '../../components/layout'
import { StatusBadge, PriorityBadge, CategoryBadge, AiTag } from '../../components/ui'

const complaints = [
  {
    id: 'CID-8821',
    title: 'Street light not working in Ward 12',
    category: 'Public Lighting',
    priority: 'Medium',
    status: 'In Progress',
    date: 'Oct 24, 2023',
    aiLabel: 'Medium Priority',
    aiConfidence: 92,
  },
  {
    id: 'CID-8847',
    title: 'Pothole on Main St near Central Park',
    category: 'Roads',
    priority: 'High',
    status: 'Pending',
    date: 'Oct 28, 2023',
    aiLabel: null,
    aiConfidence: null,
  },
  {
    id: 'CID-8712',
    title: 'Overflowing garbage bin at Metro Station',
    category: 'Sanitation',
    priority: 'Low',
    status: 'Resolved',
    date: 'Oct 15, 2023',
    aiLabel: 'Sanitation',
    aiConfidence: 88,
  },
  {
    id: 'CID-8904',
    title: 'Water logging issue near Ward 7 school',
    category: 'Drainage',
    priority: 'Critical',
    status: 'Open',
    date: 'Nov 01, 2023',
    aiLabel: 'High Risk',
    aiConfidence: 96,
  },
]

const statusChips = [
  { label: '3 Pending',    color: 'bg-blue-50 text-blue-700 border-blue-200',   icon: 'pending_actions' },
  { label: '1 In Progress', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: 'hourglass_top' },
  { label: '5 Resolved',   color: 'bg-green-50 text-green-700 border-green-200',  icon: 'check_circle' },
]

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: i => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.35, ease: 'easeOut' } }),
}

export default function CitizenDashboard() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <CitizenAppBar />
      <main className="max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-lg space-y-lg">
        {/* Welcome section */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-md">
          <div>
            <h1 className="text-headline-lg text-on-surface font-semibold">Welcome back, Arjun 👋</h1>
            <p className="text-body-md text-on-surface-variant mt-xs">Here is an overview of your active reports.</p>
          </div>
          <div className="flex flex-wrap gap-sm">
            {statusChips.map(chip => (
              <div key={chip.label} className={`flex items-center gap-xs px-md py-sm rounded-full text-label-md font-semibold border ${chip.color} shadow-sm`}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>{chip.icon}</span>
                {chip.label}
              </div>
            ))}
          </div>
        </motion.section>

        {/* Complaints list */}
        <section className="space-y-md">
          <h2 className="text-headline-md text-on-surface font-semibold">Your Complaints</h2>
          {complaints.map((c, i) => (
            <motion.div
              key={c.id}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className={`glass-card rounded-xl p-md group ${c.status === 'Resolved' ? 'opacity-80 hover:opacity-100' : ''}`}
            >
              <div className="flex flex-col gap-sm w-full">
                <div className="flex justify-between items-start gap-sm">
                  <div>
                    <span className="text-body-sm text-on-surface-variant font-medium mr-sm">#{c.id}</span>
                    <h3 className="text-headline-md text-on-surface font-semibold mt-[2px]">{c.title}</h3>
                  </div>
                  <StatusBadge status={c.status} className="shrink-0" />
                </div>

                <div className="flex flex-wrap items-center gap-sm">
                  <CategoryBadge category={c.category} />
                  <PriorityBadge priority={c.priority} />
                  {c.aiLabel && <AiTag label={c.aiLabel} confidence={c.aiConfidence} />}
                </div>

                <div className="flex items-center justify-between pt-sm border-t border-outline-variant/30">
                  <div className="flex items-center gap-xs text-on-surface-variant text-body-sm">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>calendar_today</span>
                    {c.date}
                  </div>
                  <button
                    onClick={() => navigate(`/citizen/track/${c.id}`)}
                    className="text-primary-container text-label-md font-semibold hover:underline flex items-center gap-[3px] transition-all"
                  >
                    View Details
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform" style={{ fontSize: '16px' }}>arrow_forward</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </section>
      </main>
    </div>
  )
}
