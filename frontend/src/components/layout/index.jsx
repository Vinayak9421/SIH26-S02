import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useAuthStore } from '../../store/authStore'

// Citizen TopAppBar
export function CitizenAppBar({ user = 'Arjun Mehta', onNewComplaint }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const { logout, name, email } = useAuthStore()

  const displayName = name || user || 'Citizen'

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      <div className="flex justify-between items-center px-4 md:px-8 py-3 max-w-6xl mx-auto w-full">
        <Link to="/citizen" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined" style={{ fontSize: '22px', fontVariationSettings: "'FILL' 1" }}>account_balance</span>
          </div>
          <div>
            <span className="text-lg font-extrabold bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent">CivicIssue</span>
            <span className="ml-1.5 px-2 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">AI</span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/80 border border-slate-200/60">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-slate-700">{displayName}</span>
          </div>

          <button
            onClick={onNewComplaint || (() => navigate('/citizen/submit'))}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
            <span className="hidden sm:inline">New Complaint</span>
          </button>

          <button
            onClick={handleLogout}
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors rounded-full border border-transparent hover:border-rose-200"
            title="Log Out"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 text-slate-700 hover:bg-slate-100 transition-colors rounded-full border border-slate-200"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                {displayName.charAt(0).toUpperCase()}
              </div>
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 w-52 z-50 overflow-hidden"
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <div className="font-semibold text-slate-800 text-sm">{displayName}</div>
                    <div className="text-xs text-slate-500 truncate">{email || 'Citizen Account'}</div>
                  </div>
                  <button
                    onClick={() => { setMenuOpen(false); navigate('/citizen') }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '16px' }}>dashboard</span>
                    My Grievances
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>logout</span>
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}

// Authority sidebar navigation items
const authorityNavItems = [
  { label: 'Dashboard', icon: 'dashboard', path: '/authority', gradient: 'from-blue-500 to-indigo-600' },
  { label: 'Issue Queue', icon: 'format_list_bulleted', path: '/authority/issues', gradient: 'from-purple-500 to-pink-600' },
  { label: 'City Map', icon: 'map', path: '/authority/map', gradient: 'from-emerald-500 to-teal-600' },
  { label: 'Analytics', icon: 'bar_chart', path: '/authority/analytics', gradient: 'from-amber-500 to-orange-600' },
  { label: 'Admin Settings', icon: 'settings', path: '/authority/settings', gradient: 'from-slate-600 to-slate-800' },
]

// Authority Layout with sidebar
export function AuthorityLayout({ children, department = 'All Departments', role = 'Super Admin' }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { logout, name, role: userRole, email, departmentKey } = useAuthStore()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login', { replace: true })
  }

  const roleLabel = userRole === 'super_admin' ? 'Super Admin' : (departmentKey ? `${departmentKey.replace(/_/g, ' ').toUpperCase()} ADMIN` : 'Dept. Admin')

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between px-4 md:px-6 py-2.5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>menu</span>
            </button>
            <Link to="/authority" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>account_balance</span>
              </div>
              <span className="text-base font-extrabold bg-gradient-to-r from-slate-900 to-indigo-950 bg-clip-text text-transparent">CivicIssue Portal</span>
            </Link>
            <span className="hidden md:inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full border border-indigo-200/60 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              {roleLabel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/80 rounded-full transition-all shadow-xs"
              title="Sign Out"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>logout</span>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 230, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white border-r border-slate-200/80 flex flex-col py-4 overflow-hidden shrink-0 shadow-sm"
            >
              <nav className="flex flex-col gap-1 px-3">
                {authorityNavItems.map(item => {
                  const active = location.pathname === item.path || (item.path !== '/authority' && location.pathname.startsWith(item.path))
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={clsx('nav-item', active && 'active')}
                    >
                      <span className="material-symbols-outlined shrink-0" style={{ fontSize: '20px', fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
                      <span className="whitespace-nowrap font-medium">{item.label}</span>
                    </Link>
                  )
                })}
              </nav>

              <div className="mt-auto px-4 pt-4 border-t border-slate-100 mx-2">
                <div className="bg-gradient-to-br from-slate-50 to-indigo-50/40 p-3 rounded-xl border border-indigo-100/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                      {(name || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-slate-800 truncate">{name || 'Authority User'}</div>
                      <div className="text-[10px] text-indigo-600 font-medium truncate">{email || roleLabel}</div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full mt-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-100/50 rounded-lg transition-colors flex items-center justify-center gap-1 border border-rose-200/50"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>logout</span>
                    Log out
                  </button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
