// Shared design-system utility components for CivicIssue AI
import clsx from 'clsx'

// --- Status Badge ---
export function StatusBadge({ status, className }) {
  const map = {
    pending:     'badge-pending',
    'in progress': 'badge-in-progress',
    resolved:    'badge-resolved',
    open:        'badge-open',
    closed:      'badge-resolved',
    suspended:   'bg-red-50 text-red-700 border border-red-200',
    active:      'badge-resolved',
    inactive:    'bg-gray-100 text-gray-500 border border-gray-200',
  }
  const key = status?.toLowerCase()
  return (
    <span className={clsx('inline-flex items-center px-sm py-[2px] rounded-full text-label-md font-semibold whitespace-nowrap', map[key] || 'badge-low', className)}>
      {status}
    </span>
  )
}

// --- Priority Badge ---
export function PriorityBadge({ priority, className }) {
  const map = {
    critical: 'badge-critical',
    high:     'badge-high',
    medium:   'badge-medium',
    low:      'badge-low',
  }
  const key = priority?.toLowerCase()
  return (
    <span className={clsx('inline-flex items-center px-sm py-[2px] rounded-full text-label-md font-semibold whitespace-nowrap', map[key] || 'badge-low', className)}>
      {priority}
    </span>
  )
}

// --- Category Badge ---
export function CategoryBadge({ category, className }) {
  return (
    <span className={clsx('inline-flex items-center px-sm py-[2px] rounded-md text-label-md bg-surface-variant text-on-surface-variant whitespace-nowrap', className)}>
      {category}
    </span>
  )
}

// --- AI Suggested Tag ---
export function AiTag({ label, confidence, className }) {
  return (
    <span className={clsx('ai-tag inline-flex items-center gap-[3px] px-sm py-[2px] rounded-md text-label-md whitespace-nowrap', className)}>
      <span className="material-symbols-outlined" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
      {label}{confidence ? ` • ${confidence}%` : ''}
    </span>
  )
}

// --- KPI Card ---
export function KpiCard({ title, value, trend, trendUp, icon, color = 'blue' }) {
  const colors = {
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   val: 'text-blue-700' },
    red:    { bg: 'bg-red-50',    icon: 'text-red-600',    val: 'text-red-700' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', val: 'text-orange-700' },
    green:  { bg: 'bg-green-50',  icon: 'text-green-600',  val: 'text-green-700' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', val: 'text-purple-700' },
  }
  const c = colors[color] || colors.blue
  return (
    <div className="glass-card rounded-xl p-md flex flex-col gap-sm">
      <div className="flex items-center justify-between">
        <span className="text-body-sm text-on-surface-variant font-medium">{title}</span>
        {icon && (
          <span className={clsx('material-symbols-outlined', c.icon)} style={{ fontSize: '20px' }}>{icon}</span>
        )}
      </div>
      <div className="flex items-end justify-between">
        <span className={clsx('text-headline-xl font-bold', c.val)}>{value}</span>
        {trend && (
          <span className={clsx('text-body-sm flex items-center gap-[2px]', trendUp ? 'text-green-600' : 'text-red-600')}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
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
    <div className="flex items-center justify-between mb-md">
      <h2 className="text-headline-md text-on-surface font-semibold">{title}</h2>
      {action || children}
    </div>
  )
}

// --- Empty State ---
export function EmptyState({ icon = 'inbox', title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-xl text-center gap-sm">
      <span className="material-symbols-outlined text-outline" style={{ fontSize: '48px' }}>{icon}</span>
      <p className="text-body-lg text-on-surface font-medium">{title}</p>
      {description && <p className="text-body-md text-on-surface-variant max-w-xs">{description}</p>}
    </div>
  )
}

// --- Spinner ---
export function Spinner({ size = 24 }) {
  return (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full border-2 border-outline-variant border-t-primary-container" style={{ width: size, height: size }} />
    </div>
  )
}
