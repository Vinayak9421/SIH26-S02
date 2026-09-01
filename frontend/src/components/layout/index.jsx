import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

// Citizen TopAppBar
export function CitizenAppBar({ user = 'Arjun Mehta', onNewComplaint }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-outline-variant/30 shadow-sm">
      <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-sm max-w-6xl mx-auto w-full">
        <Link to="/citizen" className="flex items-center gap-xs">
          <span className="material-symbols-outlined text-primary-container" style={{ fontSize: '28px', fontVariationSettings: "'FILL' 1" }}>account_balance</span>
          <span className="text-headline-md font-bold text-primary-container">CivicIssue AI</span>
        </Link>
        <div className="flex items-center gap-md">
          <span className="hidden md:block text-body-md text-on-surface font-medium">{user}</span>
          <button
            onClick={onNewComplaint || (() => navigate('/citizen/submit'))}
            className="bg-primary-container text-on-primary text-label-md font-semibold px-md py-sm rounded-full shadow-sm hover:shadow-md transition-all flex items-center gap-xs"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            <span className="hidden sm:inline">New Complaint</span>
          </button>
          <button
            className="p-xs text-on-surface-variant hover:bg-surface-container-highest transition-colors rounded-full"
            title="Notifications"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>notifications</span>
          </button>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-xs text-on-surface-variant hover:bg-surface-container-highest transition-colors rounded-full"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>account_circle</span>
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute right-0 top-full mt-xs bg-white rounded-xl shadow-modal border border-outline-variant/20 py-sm w-48 z-50"
                >
                  <div className="px-md py-xs text-body-sm text-on-surface-variant border-b border-outline-variant/20 mb-xs">{user}</div>
                  <button onClick={() => { setMenuOpen(false); navigate('/') }} className="w-full text-left px-md py-xs text-body-md text-error hover:bg-red-50 transition-colors flex items-center gap-sm">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
                    Log out
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
  { label: 'Dashboard', icon: 'dashboard', path: '/authority' },
  { label: 'Issue Queue', icon: 'format_list_bulleted', path: '/authority/issues' },
  { label: 'City Map', icon: 'map', path: '/authority/map' },
  { label: 'Analytics', icon: 'bar_chart', path: '/authority/analytics' },
  { label: 'Admin Settings', icon: 'settings', path: '/authority/settings' },
]

// Authority Layout with sidebar
export function AuthorityLayout({ children, department = 'All Departments', role = 'Super Admin' }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [dept, setDept] = useState(department)

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex flex-col">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 bg-white border-b border-outline-variant/30 shadow-sm">
        <div className="flex items-center justify-between px-md py-sm">
          <div className="flex items-center gap-sm">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-xs text-on-surface-variant hover:bg-surface-container rounded-md transition-colors">
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>menu</span>
            </button>
            <Link to="/authority" className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary-container" style={{ fontSize: '26px', fontVariationSettings: "'FILL' 1" }}>account_balance</span>
              <span className="text-headline-md font-bold text-primary-container">CivicIssue AI</span>
            </Link>
            <span className="hidden md:inline bg-primary-container/10 text-primary-container text-label-md font-bold px-sm py-[2px] rounded-full">{role}</span>
          </div>
          <div className="flex items-center gap-sm">
            <select
              value={dept}
              onChange={e => setDept(e.target.value)}
              className="text-body-md text-on-surface border border-outline-variant rounded-md px-sm py-[6px] bg-white focus:outline-none focus:ring-1 focus:ring-primary-container"
            >
              <option>All Departments</option>
              <option>Waste Management</option>
              <option>Roads & Infrastructure</option>
              <option>Water Supply</option>
              <option>Electricity</option>
              <option>Public Lighting</option>
            </select>
            <button className="p-xs text-on-surface-variant hover:bg-surface-container-highest rounded-full">
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>notifications</span>
            </button>
            <button onClick={() => navigate('/')} className="p-xs text-on-surface-variant hover:bg-surface-container-highest rounded-full" title="Logout">
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>logout</span>
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
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-white border-r border-outline-variant/30 flex flex-col py-md overflow-hidden shrink-0"
            >
              <nav className="flex flex-col gap-xs px-sm">
                {authorityNavItems.map(item => {
                  const active = location.pathname === item.path || (item.path !== '/authority' && location.pathname.startsWith(item.path))
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={clsx('nav-item', active && 'active')}
                    >
                      <span className="material-symbols-outlined shrink-0" style={{ fontSize: '20px', fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
                      <span className="whitespace-nowrap">{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
              <div className="mt-auto px-sm pt-md border-t border-outline-variant/20 mx-sm">
                <div className="text-body-sm text-on-surface-variant">Logged in as</div>
                <div className="text-body-md text-on-surface font-medium">Admin User</div>
                <div className="text-body-sm text-primary-container">{role}</div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-lg">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
