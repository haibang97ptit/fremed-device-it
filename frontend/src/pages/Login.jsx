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
  const [focusField, setFocusField] = useState(null)

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
    <div className="min-h-screen flex items-center justify-center overflow-hidden relative" style={{ background: '#0a0f1e' }}>
      <style>{`
        @keyframes float1 { 0%,100% { transform: translate(0,0) rotate(0deg); } 33% { transform: translate(30px,-50px) rotate(120deg); } 66% { transform: translate(-20px,20px) rotate(240deg); } }
        @keyframes float2 { 0%,100% { transform: translate(0,0) rotate(0deg); } 33% { transform: translate(-40px,30px) rotate(-120deg); } 66% { transform: translate(25px,-35px) rotate(-240deg); } }
        @keyframes float3 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(15px,-40px); } }
        @keyframes slideUp { from { opacity:0; transform: translateY(40px); } to { opacity:1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes glow { 0%,100% { box-shadow: 0 0 20px rgba(56,142,255,0.3); } 50% { box-shadow: 0 0 40px rgba(56,142,255,0.6), 0 0 80px rgba(56,142,255,0.2); } }
        @keyframes gradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes shake { 0%,100% { transform: translateX(0); } 10%,30%,50%,70%,90% { transform: translateX(-4px); } 20%,40%,60%,80% { transform: translateX(4px); } }
        @keyframes pulseRing { 0% { transform: scale(0.8); opacity:1; } 100% { transform: scale(2.2); opacity:0; } }
        .login-bg { background: linear-gradient(135deg, #0a0f1e 0%, #0d1b3e 30%, #0f2248 50%, #0b1832 70%, #0a0f1e 100%); background-size: 400% 400%; animation: gradientMove 15s ease infinite; }
        .float-shape { position:absolute; border-radius:50%; filter: blur(60px); opacity: 0.12; }
        .card-enter { animation: slideUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards; }
        .logo-enter { animation: slideUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s both; }
        .field-enter-1 { animation: slideUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.25s both; }
        .field-enter-2 { animation: slideUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.35s both; }
        .btn-enter { animation: slideUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.45s both; }
        .footer-enter { animation: fadeIn 1s ease 0.8s both; }
        .logo-glow { animation: glow 3s ease-in-out infinite; }
        .error-shake { animation: shake 0.5s ease; }
        .input-glow:focus { box-shadow: 0 0 0 3px rgba(56,142,255,0.15), 0 0 20px rgba(56,142,255,0.1); border-color: #388eff; }
        .grid-bg { background-image: 
          linear-gradient(rgba(56,142,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(56,142,255,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
        }
      `}</style>

      {/* Animated background */}
      <div className="absolute inset-0 login-bg" />
      <div className="absolute inset-0 grid-bg" />

      {/* Floating shapes */}
      <div className="float-shape" style={{ width:500, height:500, top:'-10%', left:'-5%', background:'#388eff', animation:'float1 20s ease-in-out infinite' }} />
      <div className="float-shape" style={{ width:400, height:400, bottom:'-10%', right:'-5%', background:'#7c3aed', animation:'float2 25s ease-in-out infinite' }} />
      <div className="float-shape" style={{ width:300, height:300, top:'50%', left:'50%', background:'#06b6d4', animation:'float3 18s ease-in-out infinite' }} />

      {/* Particle dots */}
      {[...Array(20)].map((_, i) => (
        <div key={i} className="absolute rounded-full" style={{
          width: Math.random() * 3 + 1,
          height: Math.random() * 3 + 1,
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          background: `rgba(${100 + Math.random()*155}, ${150 + Math.random()*105}, 255, ${0.15 + Math.random()*0.25})`,
          animation: `float${(i % 3) + 1} ${15 + Math.random()*20}s ease-in-out infinite`,
          animationDelay: `${Math.random() * -20}s`,
        }} />
      ))}

      {/* Content */}
      <div className="relative z-10 w-full max-w-[420px] px-5">
        {/* Logo */}
        <div className="text-center mb-8 logo-enter">
          <div className="relative inline-block mb-5">
            <div className="absolute inset-0 rounded-2xl bg-blue-500/20" style={{ animation: 'pulseRing 3s ease-out infinite' }} />
            <div className="absolute inset-0 rounded-2xl bg-blue-500/15" style={{ animation: 'pulseRing 3s ease-out infinite 1s' }} />
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center logo-glow relative" style={{ background: 'linear-gradient(135deg, #1d4ed8, #388eff, #06b6d4)' }}>
              <svg width="30" height="30" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="5.2" height="5.2" rx="1.2" fill="white" fillOpacity="0.95" />
                <rect x="8.8" y="2" width="5.2" height="5.2" rx="1.2" fill="white" fillOpacity="0.6" />
                <rect x="2" y="8.8" width="5.2" height="5.2" rx="1.2" fill="white" fillOpacity="0.6" />
                <rect x="8.8" y="8.8" width="5.2" height="5.2" rx="1.2" fill="white" fillOpacity="0.35" />
              </svg>
            </div>
          </div>
          <h1 className="text-[22px] font-bold text-white tracking-tight">FREMED IT Manager</h1>
          <p className="text-[13px] mt-1.5" style={{ color: 'rgba(148,175,215,0.7)' }}>Quản lý thiết bị & tài sản IT</p>
        </div>

        {/* Login card */}
        <div className="card-enter rounded-2xl p-7 relative overflow-hidden" style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
        }}>
          <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(56,142,255,0.4), transparent)' }} />

          <h2 className="text-[16px] font-semibold text-white mb-6">Đăng nhập</h2>

          {error && (
            <div className="error-shake flex items-center gap-2 p-3 mb-4 rounded-lg text-[12px]" style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5'
            }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="8" r="6"/><line x1="8" y1="5" x2="8" y2="8.5"/><circle cx="8" cy="11" r="0.5" fill="currentColor"/></svg>
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div className="field-enter-1">
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(148,175,215,0.6)' }}>Tên đăng nhập</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: focusField === 'user' ? '#388eff' : 'rgba(148,175,215,0.35)', transition: 'color 0.3s' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="5.5" r="3"/><path d="M2.5 14c0-3 2.2-5 5.5-5s5.5 2 5.5 5"/></svg>
                </div>
                <input className="input-glow w-full pl-10 pr-4 py-3 rounded-xl text-[13px] text-white placeholder:text-[rgba(148,175,215,0.3)] outline-none transition-all duration-300"
                  style={{ background: focusField === 'user' ? 'rgba(56,142,255,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${focusField === 'user' ? 'rgba(56,142,255,0.4)' : 'rgba(255,255,255,0.08)'}` }}
                  placeholder="Nhập tên đăng nhập" value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  onFocus={() => setFocusField('user')} onBlur={() => setFocusField(null)} required autoFocus />
              </div>
            </div>

            <div className="field-enter-2">
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(148,175,215,0.6)' }}>Mật khẩu</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: focusField === 'pass' ? '#388eff' : 'rgba(148,175,215,0.35)', transition: 'color 0.3s' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="7" width="10" height="7" rx="2"/><path d="M5 7V5a3 3 0 016 0v2"/></svg>
                </div>
                <input type="password" className="input-glow w-full pl-10 pr-4 py-3 rounded-xl text-[13px] text-white placeholder:text-[rgba(148,175,215,0.3)] outline-none transition-all duration-300"
                  style={{ background: focusField === 'pass' ? 'rgba(56,142,255,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${focusField === 'pass' ? 'rgba(56,142,255,0.4)' : 'rgba(255,255,255,0.08)'}` }}
                  placeholder="Nhập mật khẩu" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  onFocus={() => setFocusField('pass')} onBlur={() => setFocusField(null)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit(e)} required />
              </div>
            </div>

            <div className="btn-enter pt-1">
              <button type="button" onClick={handleSubmit} disabled={loading}
                className="w-full py-3 rounded-xl text-[13px] font-semibold text-white transition-all duration-300 relative overflow-hidden group disabled:opacity-60 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #388eff)', boxShadow: '0 4px 20px rgba(56,142,255,0.3)' }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(135deg, #388eff, #06b6d4)', boxShadow: '0 8px 30px rgba(56,142,255,0.5)' }} />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Đang đăng nhập...</>
                  ) : (
                    <>Đăng nhập<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform group-hover:translate-x-1"><path d="M3 8h10M9 4l4 4-4 4"/></svg></>
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>

        <p className="footer-enter text-center text-[11px] mt-6" style={{ color: 'rgba(148,175,215,0.3)' }}>© 2025 Fremed — IT Asset Management</p>
      </div>
    </div>
  )
}
