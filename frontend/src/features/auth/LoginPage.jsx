import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useLogin, useRegister, useDemoUsers } from '../../hooks/useApi'
import { useAuthStore } from '../../store/authStore'

const ROLE_ICONS = {
  super_admin: 'shield',
  department_admin: 'manage_accounts',
  citizen: 'person',
}

const ROLE_COLORS = {
  super_admin: 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200/80 text-purple-800 hover:border-purple-300 hover:shadow-purple-500/10',
  department_admin: 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200/80 text-blue-800 hover:border-blue-300 hover:shadow-blue-500/10',
  citizen: 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200/80 text-emerald-800 hover:border-emerald-300 hover:shadow-emerald-500/10',
}

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('login')
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const navigate = useNavigate()
  const login = useAuthStore(s => s.login)

  const loginMutation = useLogin()
  const registerMutation = useRegister()
  const { data: demoUsers } = useDemoUsers()

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const data = await loginMutation.mutateAsync(loginForm)
      login(data)
      toast.success(`Welcome back, ${data.name}!`)
      if (data.role === 'citizen') navigate('/citizen')
      else navigate('/authority')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid credentials. Try again.')
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (registerForm.password !== registerForm.confirm) {
      toast.error('Passwords do not match')
      return
    }
    try {
      const data = await registerMutation.mutateAsync({
        name: registerForm.name,
        email: registerForm.email,
        phone: registerForm.phone,
        password: registerForm.password,
      })
      login(data)
      toast.success('Account created! Welcome to CivicIssue AI.')
      navigate('/citizen')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed. Please try again.')
    }
  }

  const quickLogin = async (user) => {
    setLoginForm({ email: user.email, password: user.password })
    try {
      const data = await loginMutation.mutateAsync({ email: user.email, password: user.password })
      login(data)
      toast.success(`Logged in as ${data.name}`)
      if (data.role === 'citizen') navigate('/citizen')
      else navigate('/authority')
    } catch {
      toast.error('Quick login failed')
    }
  }

  const inputCls = 'w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm text-slate-800 transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-400'
  const loading = loginMutation.isPending || registerMutation.isPending

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-6 items-stretch justify-center">
        {/* Demo Accounts Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full lg:w-80 shrink-0 bg-white/80 backdrop-blur-md rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-200/80 p-5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>key</span>
              </span>
              <h3 className="text-sm font-bold text-slate-800">1-Click Demo Logins</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">Click any pre-configured role to test immediately:</p>
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {(demoUsers || []).map((user) => (
                <button
                  key={user.email}
                  onClick={() => quickLogin(user)}
                  disabled={loading}
                  className={`w-full text-left p-3 rounded-2xl border transition-all hover:scale-[1.02] hover:shadow-md flex items-center gap-3 ${ROLE_COLORS[user.role] || 'bg-slate-50 border-slate-200 text-slate-700'} disabled:opacity-50`}
                >
                  <div className="w-8 h-8 rounded-xl bg-white/90 shadow-xs flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>
                      {ROLE_ICONS[user.role] || 'person'}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold truncate">{user.name}</p>
                      {user.department_key && (
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">
                          {user.department_key.slice(0, 5)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] opacity-75 truncate">{user.email}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Powered by Neon DB</span>
            <span className="font-bold text-indigo-600">SIH 2026</span>
          </div>
        </motion.div>

        {/* Main Login / Register Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex-1 bg-white/90 backdrop-blur-md rounded-3xl shadow-xl shadow-indigo-500/5 border border-slate-200/80 overflow-hidden flex flex-col justify-between"
        >
          {/* Card Header */}
          <div className="p-8 text-center pb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-2xl shadow-lg shadow-indigo-500/25 mb-4">
              <span className="material-symbols-outlined" style={{ fontSize: '32px', fontVariationSettings: "'FILL' 1" }}>account_balance</span>
            </div>
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent">
              CivicIssue AI Portal
            </h1>
            <p className="text-xs text-slate-500 mt-1">Autonomous Civic Grievance Triage & Multimodal AI</p>
          </div>

          {/* Tab Switcher */}
          <div className="flex border-b border-slate-100 px-8">
            {['login', 'register'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 pb-3 text-xs font-bold border-b-2 transition-all duration-200 uppercase tracking-wider ${
                  activeTab === tab
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab === 'login' ? 'Citizen & Staff Log In' : 'New Citizen Registration'}
              </button>
            ))}
          </div>

          <div className="p-8 pt-6">
            <AnimatePresence mode="wait">
              {/* Log In Form */}
              {activeTab === 'login' && (
                <motion.form
                  key="login"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleLogin}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="login-email">Email Address</label>
                    <input
                      id="login-email"
                      type="email"
                      placeholder="e.g. water@civic.in or citizen@civic.in"
                      required
                      className={inputCls}
                      value={loginForm.email}
                      onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="login-password">Password</label>
                    <input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      required
                      className={inputCls}
                      value={loginForm.password}
                      onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs py-3.5 rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? <span className="animate-spin material-symbols-outlined" style={{ fontSize: '18px' }}>progress_activity</span> : null}
                    Access Portal
                  </button>
                </motion.form>
              )}

              {/* Register Form */}
              {activeTab === 'register' && (
                <motion.form
                  key="register"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleRegister}
                  className="space-y-3.5"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="reg-name">Full Name</label>
                    <input
                      id="reg-name"
                      type="text"
                      placeholder="Arjun Mehta"
                      required
                      className={inputCls}
                      value={registerForm.name}
                      onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="reg-email">Email Address</label>
                    <input
                      id="reg-email"
                      type="email"
                      placeholder="citizen@example.com"
                      required
                      className={inputCls}
                      value={registerForm.email}
                      onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="reg-phone">Phone (Optional)</label>
                    <input
                      id="reg-phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      className={inputCls}
                      value={registerForm.phone}
                      onChange={e => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="reg-pass">Password</label>
                      <input
                        id="reg-pass"
                        type="password"
                        placeholder="••••••••"
                        required
                        className={inputCls}
                        value={registerForm.password}
                        onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="reg-confirm">Confirm</label>
                      <input
                        id="reg-confirm"
                        type="password"
                        placeholder="••••••••"
                        required
                        className={inputCls}
                        value={registerForm.confirm}
                        onChange={e => setRegisterForm({ ...registerForm, confirm: e.target.value })}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs py-3.5 rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? <span className="animate-spin material-symbols-outlined" style={{ fontSize: '18px' }}>progress_activity</span> : null}
                    Create Citizen Account
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
