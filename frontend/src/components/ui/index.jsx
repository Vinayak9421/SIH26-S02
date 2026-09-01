// Shared design-system utility components for CivicIssue AI with rich, vibrant styling
import clsx from 'clsx'

// --- Status Badge ---
export function StatusBadge({ status, className }) {
  const map = {
    pending:     'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs',
    'in progress': 'bg-amber-50 text-amber-700 border border-amber-200/80 shadow-xs',
    'in_progress': 'bg-amber-50 text-amber-700 border border-amber-200/80 shadow-xs',
    resolved:    'bg-teal-50 text-teal-700 border border-teal-200/80 shadow-xs',
    open:        'bg-rose-50 text-rose-700 border border-rose-200/80 shadow-xs',
    closed:      'bg-slate-100 text-slate-700 border border-slate-200/80',
    suspended:   'bg-red-50 text-red-700 border border-red-200',
    active:      'bg-emerald-50 text-emerald-700 border border-emerald-200',
    inactive:    'bg-gray-100 text-gray-500 border border-gray-200',
  }
  const key = status?.toLowerCase()
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap', map[key] || 'badge-low', className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      {status}
    </span>
  )
}

// --- Priority Badge ---
export function PriorityBadge({ priority, className }) {
  const map = {
    critical: 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200 shadow-xs font-bold',
    high:     'bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 border border-orange-200 shadow-xs font-semibold',
    medium:   'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-200 shadow-xs font-medium',
    low:      'bg-slate-100 text-slate-600 border border-slate-200 font-medium',
  }
  const key = priority?.toLowerCase()
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs whitespace-nowrap', map[key] || 'badge-low', className)}>
      {key === 'critical' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />}
      {priority}
    </span>
  )
}

// --- Category Badge with Department Theme Colors ---
export function CategoryBadge({ category, className }) {
  const cat = String(category || '').toLowerCase()
  let style = 'bg-slate-100 text-slate-700 border-slate-200'
  
  if (cat.includes('water')) {
    style = 'bg-cyan-50 text-cyan-700 border-cyan-200'
  } else if (cat.includes('sanitation') || cat.includes('waste')) {
    style = 'bg-emerald-50 text-emerald-700 border-emerald-200'
  } else if (cat.includes('road')) {
    style = 'bg-amber-50 text-amber-800 border-amber-200'
  } else if (cat.includes('light') || cat.includes('electr')) {
    style = 'bg-yellow-50 text-yellow-800 border-yellow-200'
  } else if (cat.includes('health')) {
    style = 'bg-rose-50 text-rose-700 border-rose-200'
  } else if (cat.includes('traffic')) {
    style = 'bg-purple-50 text-purple-700 border-purple-200'
  }

  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border capitalize whitespace-nowrap shadow-2xs', style, className)}>
      {category}
    </span>
  )
}

// --- AI Suggested Tag ---
export function AiTag({ label, confidence, className }) {
  return (
    <span className={clsx('ai-tag inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap', className)}>
      <span className="material-symbols-outlined" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
      <span>{label}</span>
      {confidence ? <span className="opacity-75 font-mono text-[11px]">({confidence}%)</span> : null}
    </span>
  )
}

// --- KPI Card with Vibrant Gradients ---
export function KpiCard({ title, value, trend, trendUp, icon, color = 'blue' }) {
  const colors = {
    blue: {
      bg: 'from-blue-50/80 to-indigo-50/40',
      border: 'border-blue-200/60',
      iconBg: 'bg-blue-100 text-blue-600',
      val: 'from-blue-700 to-indigo-800'
    },
    red: {
      bg: 'from-red-50/80 to-rose-50/40',
      border: 'border-red-200/60',
      iconBg: 'bg-red-100 text-red-600',
      val: 'from-red-700 to-rose-800'
    },
    orange: {
      bg: 'from-amber-50/80 to-orange-50/40',
      border: 'border-orange-200/60',
      iconBg: 'bg-orange-100 text-orange-600',
      val: 'from-amber-700 to-orange-800'
    },
    green: {
      bg: 'from-emerald-50/80 to-teal-50/40',
      border: 'border-emerald-200/60',
      iconBg: 'bg-emerald-100 text-emerald-600',
      val: 'from-emerald-700 to-teal-800'
    },
    purple: {
      bg: 'from-purple-50/80 to-fuchsia-50/40',
      border: 'border-purple-200/60',
      iconBg: 'bg-purple-100 text-purple-600',
      val: 'from-purple-700 to-fuchsia-800'
    },
  }
  const c = colors[color] || colors.blue

  return (
    <div className={clsx('glass-card rounded-2xl p-4 flex flex-col justify-between border bg-gradient-to-br transition-all duration-300 hover:shadow-lg', c.bg, c.border)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{title}</span>
        {icon && (
          <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center shadow-xs', c.iconBg)}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{icon}</span>
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <span className={clsx('text-2xl md:text-3xl font-extrabold bg-gradient-to-r bg-clip-text text-transparent tracking-tight', c.val)}>
          {value}
        </span>
        {trend && (
          <span className={clsx('text-xs font-semibold flex items-center gap-0.5 px-2 py-0.5 rounded-full', trendUp ? 'bg-emerald-100/80 text-emerald-800' : 'bg-rose-100/80 text-rose-800')}>
            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
              {trendUp ? 'trending_up' : 'trending_down'}
            </span>
            {trend}
          </span>
        )}
      </div>
    </div>
  )
}

// --- Section Header ---
export function SectionHeader({ title, action, children }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      {action || children}
    </div>
  )
}

// --- Empty State ---
export function EmptyState({ icon = 'inbox', title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center shadow-inner">
        <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>{icon}</span>
      </div>
      <p className="text-base text-slate-800 font-semibold mt-2">{title}</p>
      {description && <p className="text-xs text-slate-500 max-w-sm">{description}</p>}
    </div>
  )
}

// --- Spinner ---
export function Spinner({ size = 24 }) {
  return (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" style={{ width: size, height: size }} />
    </div>
  )
}
