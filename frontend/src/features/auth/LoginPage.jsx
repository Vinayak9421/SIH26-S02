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

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  department_admin: 'Dept. Admin',
  citizen: 'Citizen',
}

const ROLE_COLORS = {
  super_admin: 'bg-purple-50 border-purple-200 text-purple-700',
  department_admin: 'bg-blue-50 border-blue-200 text-blue-700',
  citizen: 'bg-green-50 border-green-200 text-green-700',
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

  const inputCls = 'w-full rounded-md border border-outline-variant bg-white px-md py-[10px] text-body-md text-on-surface transition-all duration-200 focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 placeholder:text-outline'
  const loading = loginMutation.isPending || registerMutation.isPending

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex items-center justify-center px-margin-mobile py-xl">
      <div className="w-full max-w-[900px] flex gap-lg items-start">
        {/* Demo users panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="hidden lg:flex flex-col gap-sm w-64 shrink-0"
        >
          <div className="bg-white rounded-2xl shadow-card border border-outline-variant/20 p-md">
            <div className="flex items-center gap-xs mb-md">
              <span className="material-symbols-outlined text-primary-container" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>info</span>
              <h3 className="text-label-md font-semibold text-on-surface">Demo Accounts</h3>
            </div>
            <p className="text-body-sm text-on-surface-variant mb-md">Click any role to instantly log in for the demo.</p>
            {(demoUsers || []).map((user) => (
              <button
                key={user.email}
                onClick={() => quickLogin(user)}
                disabled={loading}
                className={`w-full text-left p-sm rounded-lg border mb-sm transition-all hover:-translate-y-px hover:shadow-md flex items-center gap-sm ${ROLE_COLORS[user.role] || 'bg-gray-50 border-gray-200 text-gray-700'} disabled:opacity-50`}
              >
                <span className="material-symbols-outlined shrink-0" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>
                  {ROLE_ICONS[user.role] || 'person'}
                </span>
                <div className="min-w-0">
                  <p className="text-label-md font-semibold truncate">{user.name}</p>
                  <p className="text-body-sm opacity-75 truncate">{user.email}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Login card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex-1 bg-white rounded-2xl shadow-modal overflow-hidden"
        >
          {/* Card header */}
          <div className="px-lg pt-xl pb-md text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-container/10 rounded-full mb-sm">
              <span className="material-symbols-outlined text-primary-container" style={{ fontSize: '36px', fontVariationSettings: "'FILL' 1" }}>account_balance</span>
            </div>
            <h1 className="text-headline-xl text-on-surface font-bold">CivicIssue AI</h1>
            <p className="text-body-md text-on-surface-variant mt-xs">Smart Civic Grievance Management · SIH 2026</p>
          </div>

          {/* Tab Toggle */}
          <div className="flex border-b border-outline-variant/30 px-lg">
            {['login', 'register'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 pb-sm text-label-md font-semibold border-b-2 transition-all duration-200 capitalize ${
                  activeTab === tab
                    ? 'border-primary-container text-primary-container'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab === 'login' ? 'Log In' : 'Register'}
              </button>
            ))}
          </div>

          <div className="px-lg pb-xl pt-md">
            <AnimatePresence mode="wait">
              {/* Log In Form */}
              {activeTab === 'login' && (
                <motion.form
                  key="login"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleLogin}
                  className="space-y-md"
                >
                  <div className="space-y-xs">
                    <label className="block text-label-md text-on-surface-variant" htmlFor="login-email">Email</label>
                    <input id="login-email" type="email" placeholder="citizen@civic.in" required
                      className={inputCls}
                      value={loginForm.email}
                      onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-xs">
                    <label className="block text-label-md text-on-surface-variant" htmlFor="login-password">Password</label>
                    <input id="login-password" type="password" placeholder="••••••••" required
                      className={inputCls}
                      value={loginForm.password}
                      onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    />
                  </div>

                  {/* Mobile demo hint */}
                  <div className="lg:hidden bg-surface-container-low border border-outline-variant/20 rounded-md p-sm text-body-sm text-on-surface-variant">
                    <strong>Demo:</strong> superadmin@civic.in / admin123 · citizen@civic.in / citizen123
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full bg-primary-container text-on-primary font-semibold text-label-md py-md rounded-md hover:shadow-md hover:-translate-y-px transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-sm mt-md"
                  >
                    {loading ? <span className="animate-spin material-symbols-outlined" style={{ fontSize: '20px' }}>progress_activity</span> : null}
                    Log In
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
                  className="space-y-md"
                >
                  <div className="space-y-xs">
                    <label className="block text-label-md text-on-surface-variant" htmlFor="reg-name">Full Name</label>
                    <input id="reg-name" type="text" placeholder="Arjun Mehta" required
                      className={inputCls}
                      value={registerForm.name}
                      onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-xs">
                    <label className="block text-label-md text-on-surface-variant" htmlFor="reg-email">Email</label>
                    <input id="reg-email" type="email" placeholder="citizen@example.com" required
                      className={inputCls}
                      value={registerForm.email}
                      onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-xs">
                    <label className="block text-label-md text-on-surface-variant" htmlFor="reg-phone">Phone (optional)</label>
                    <input id="reg-phone" type="tel" placeholder="+91 98765 43210"
                      className={inputCls}
                      value={registerForm.phone}
                      onChange={e => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-sm">
                    <div className="space-y-xs">
                      <label className="block text-label-md text-on-surface-variant" htmlFor="reg-pass">Password</label>
                      <input id="reg-pass" type="password" placeholder="••••••••" required
                        className={inputCls}
                        value={registerForm.password}
                        onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                      />
                    </div>
                    <div className="space-y-xs">
                      <label className="block text-label-md text-on-surface-variant" htmlFor="reg-confirm">Confirm</label>
                      <input id="reg-confirm" type="password" placeholder="••••••••" required
                        className={inputCls}
                        value={registerForm.confirm}
                        onChange={e => setRegisterForm({ ...registerForm, confirm: e.target.value })}
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full bg-primary-container text-on-primary font-semibold text-label-md py-md rounded-md hover:shadow-md hover:-translate-y-px transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-sm mt-md"
                  >
                    {loading ? <span className="animate-spin material-symbols-outlined" style={{ fontSize: '20px' }}>progress_activity</span> : null}
                    Create Account
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
