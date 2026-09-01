import { motion } from 'framer-motion'
import { Sparkles, Compass, ShieldCheck, Zap, ArrowRight, Layers, Database } from 'lucide-react'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'

export default function App() {
  const triggerCelebration = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    })
    toast.success('Environment configured & ready to build!', {
      description: 'React, Framer Motion, Tailwind, and router utilities are fully integrated.'
    })
  }

  const features = [
    {
      title: 'Framer Motion',
      desc: 'Silky smooth gestures, fluid entrance transitions, and layout animations.',
      icon: Sparkles,
      color: 'from-pink-500 to-rose-500',
    },
    {
      title: 'React Router',
      desc: 'Seamless client-side navigation with multi-route support and layouts.',
      icon: Compass,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'TanStack Query & Axios',
      desc: 'Effortless server state synchronization, cache control, and RESTful calls.',
      icon: Database,
      color: 'from-amber-500 to-orange-500',
    },
    {
      title: 'Lucide & Tailwind CSS',
      desc: 'Modern SVG iconography combined with rapid utility-first styling.',
      icon: Layers,
      color: 'from-emerald-500 to-teal-500',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/20 blur-[130px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="max-w-4xl w-full text-center z-10 space-y-8"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-medium">
          <Zap className="w-4 h-4 text-indigo-400" />
          <span>Frontend Scaffold Initialized</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
          Ready for Innovation
        </h1>

        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
          Your React ecosystem is loaded with all primary libraries: animation, state management, routing, and modern UI utilities.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          {features.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * idx }}
                whileHover={{ scale: 1.02 }}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl hover:border-slate-700 transition-all group"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 shadow-lg shadow-black/40`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-slate-200 text-lg group-hover:text-white transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            )
          })}
        </div>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            onClick={triggerCelebration}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <span>Test Toast & Effects</span>
            <Sparkles className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
