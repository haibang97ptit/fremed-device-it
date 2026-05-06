import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { doLogin } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login(form)
      doLogin(res.data.token, res.data.username)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Tên đăng nhập hoặc mật khẩu không đúng')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f5f7]">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[280px]" style={{background:'linear-gradient(135deg, #1c2b41 0%, #253346 100%)'}} />
      </div>

      <div className="relative z-10 w-full max-w-[380px] px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{background:'linear-gradient(135deg,#0052cc,#0079bf)'}}>
            <svg width="28" height="28" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="5.5" height="5.5" rx="1" fill="white" fillOpacity="0.95"/>
              <rect x="8.5" y="2" width="5.5" height="5.5" rx="1" fill="white" fillOpacity="0.65"/>
              <rect x="2" y="8.5" width="5.5" height="5.5" rx="1" fill="white" fillOpacity="0.65"/>
              <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" fill="white" fillOpacity="0.4"/>
            </svg>
          </div>
          <h1 className="text-[20px] font-bold text-white">FREMED IT Manager</h1>
          <p className="text-[13px] text-[#8c9baf] mt-1">Quản lý thiết bị & tài sản IT</p>
        </div>

        {/* Card */}
        <div className="panel p-6">
          <h2 className="text-[15px] font-semibold text-[#172b4d] mb-5">Đăng nhập</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-[#ffebe6] border border-[#ff8f73] rounded text-[12px] text-[#bf2600]">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="8" r="6"/><line x1="8" y1="5" x2="8" y2="8.5"/><circle cx="8" cy="11" r="0.5" fill="currentColor"/></svg>
                {error}
              </div>
            )}
            <div>
              <label className="block text-[11.5px] font-semibold text-[#5e6c84] mb-1.5 uppercase tracking-wider">Tên đăng nhập</label>
              <input className="input-field" placeholder="admin"
                value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required autoFocus />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-[#5e6c84] mb-1.5 uppercase tracking-wider">Mật khẩu</label>
              <input type="password" className="input-field" placeholder="••••••••"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-2 text-[13px] disabled:opacity-60">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang đăng nhập...
                </span>
              ) : 'Đăng nhập'}
            </button>
          </form>
        </div>
        <p className="text-center text-[11px] text-[#97a0af] mt-4">© 2025 Fremed — IT Asset Management</p>
      </div>
    </div>
  )
}
