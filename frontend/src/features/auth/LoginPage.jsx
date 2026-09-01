import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('login')
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    // Simulate auth - route based on email domain
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    if (loginForm.email.includes('admin') || loginForm.email.includes('authority')) {
      navigate('/authority')
    } else {
      navigate('/citizen')
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    navigate('/citizen')
  }

  const inputCls = 'w-full rounded-md border border-outline-variant bg-white px-md py-[10px] text-body-md text-on-surface transition-all duration-200 focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 placeholder:text-outline'

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex items-center justify-center px-margin-mobile py-xl">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-[420px] bg-white rounded-2xl shadow-modal overflow-hidden"
      >
        {/* Card header */}
        <div className="px-lg pt-xl pb-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-container/10 rounded-full mb-sm">
            <span className="material-symbols-outlined text-primary-container" style={{ fontSize: '36px', fontVariationSettings: "'FILL' 1" }}>account_balance</span>
          </div>
          <h1 className="text-headline-xl text-on-surface font-bold">CivicIssue AI</h1>
          <p className="text-body-md text-on-surface-variant mt-xs">Secure civic access portal</p>
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
          {/* Log In Form */}
          {activeTab === 'login' && (
            <motion.form
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleLogin}
              className="space-y-md"
            >
              <div className="space-y-xs">
                <label className="block text-label-md text-on-surface-variant" htmlFor="login-email">Email</label>
                <input id="login-email" type="email" placeholder="citizen@example.com" required
                  className={inputCls}
                  value={loginForm.email}
                  onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-xs">
                <div className="flex justify-between items-center">
                  <label className="block text-label-md text-on-surface-variant" htmlFor="login-password">Password</label>
                  <button type="button" className="text-body-sm text-primary-container hover:underline">Forgot password?</button>
                </div>
                <input id="login-password" type="password" placeholder="••••••••" required
                  className={inputCls}
                  value={loginForm.password}
                  onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                />
              </div>
              <div className="bg-surface-container-low border border-outline-variant/20 rounded-md p-sm flex gap-sm items-start text-body-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-primary-container shrink-0 mt-[1px]" style={{ fontSize: '16px' }}>info</span>
                <span>Use <strong>admin@civic.in</strong> or <strong>user@civic.in</strong> to explore different roles.</span>
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
                <label className="block text-label-md text-on-surface-variant" htmlFor="reg-phone">Phone Number</label>
                <input id="reg-phone" type="tel" placeholder="+91 98765 43210" required
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
              <div className="bg-surface-container-low border border-outline-variant/20 rounded-md p-sm flex gap-sm items-start">
                <span className="material-symbols-outlined text-primary-container shrink-0 mt-[1px]" style={{ fontSize: '16px' }}>lock</span>
                <p className="text-body-sm text-on-surface-variant">Your details are only used to update you on your complaints and are never shown publicly.</p>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-primary-container text-on-primary font-semibold text-label-md py-md rounded-md hover:shadow-md hover:-translate-y-px transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-sm mt-md"
              >
                {loading ? <span className="animate-spin material-symbols-outlined" style={{ fontSize: '20px' }}>progress_activity</span> : null}
                Create Account
              </button>
            </motion.form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
