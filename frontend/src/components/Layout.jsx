import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const SIDEBAR_NAV = [
  { to: '/', label: 'Dashboard', end: true,
    icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1"/><rect x="9" y="1.5" width="5.5" height="5.5" rx="1"/><rect x="1.5" y="9" width="5.5" height="5.5" rx="1"/><rect x="9" y="9" width="5.5" height="5.5" rx="1"/></svg>
  },
  { to: '/devices', label: 'Thiết bị', end: false,
    icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1.5" y="2.5" width="13" height="9" rx="1.5"/><line x1="5" y1="13.5" x2="11" y2="13.5" strokeLinecap="round"/><line x1="8" y1="11.5" x2="8" y2="13.5"/></svg>
  },
  { to: '/cards', label: 'Thẻ từ', end: false,
    icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1.5" y="3" width="13" height="10" rx="1.5"/><line x1="1.5" y1="6.5" x2="14.5" y2="6.5"/><line x1="4" y1="10" x2="7" y2="10" strokeLinecap="round"/></svg>
  },
  { to: '/ips', label: 'IP tĩnh', end: false,
    icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="8" cy="8" r="6"/><line x1="8" y1="2" x2="8" y2="14"/><path d="M2 8c1.5-2 3-3 6-3s4.5 1 6 3"/><path d="M2 8c1.5 2 3 3 6 3s4.5-1 6-3"/></svg>
  },
  { to: '/quy-trinh', label: 'Quy trình IT', end: false,
    icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 2h8l2 3-6 9-6-9 2-3z"/></svg>
  },
  { to: '/tai-khoan', label: 'Tài khoản IT', end: false,
    icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="5" width="12" height="8" rx="1.5"/><path d="M5 5V4a3 3 0 016 0v1"/><circle cx="8" cy="9.5" r="1.2"/><line x1="8" y1="10.7" x2="8" y2="11.5"/></svg>
  },
  { to: '/phieu-de-nghi', label: 'Phiếu đề nghị', end: false,
    icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 2h6l4 4v8a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M10 2v4h4"/><line x1="5" y1="9" x2="11" y2="9"/><line x1="5" y1="11.5" x2="9" y2="11.5"/></svg>
  },
  { to: '/action-items', label: 'Action Items', end: false,
    icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 3h12M2 8h12M2 13h8"/><circle cx="13" cy="13" r="2"/><path d="M12 13l1 1 2-2" strokeWidth="1.5"/></svg>
  },
  { to: '/it-sop', label: 'IT SOP', end: false,
    icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6l-4-4z"/><path d="M9 2v4h4"/><path d="M5 9h6M5 11.5h4"/></svg>
  },
]

// Chỉ hiện các tab này trên header
const HEADER_TABS = [
  { to: '/quy-trinh', label: 'Quy trình IT', end: false },
  { to: '/tai-khoan', label: 'Tài khoản IT', end: false },
  { to: '/phieu-de-nghi', label: 'Phiếu đề nghị', end: false },
  { to: '/action-items', label: 'Action Items', end: false },
  { to: '/it-sop', label: 'IT SOP', end: false },
]

export default function Layout() {
  const { username, doLogout } = useAuth()
  const navigate = useNavigate()
  const initial = username?.[0]?.toUpperCase() || '?'
  function handleLogout() { doLogout(); navigate('/login', { replace: true }) }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="flex-shrink-0 h-[48px] flex items-center px-3 gap-3 z-20" style={{background:'#1c2b41'}}>
        <button className="w-8 h-8 flex items-center justify-center text-[#8c9baf] hover:text-white transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="2" y1="4" x2="14" y2="4"/><line x1="2" y1="8" x2="14" y2="8"/><line x1="2" y1="12" x2="14" y2="12"/></svg>
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded flex items-center justify-center" style={{background:'linear-gradient(135deg,#0052cc,#0079bf)'}}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5.5" height="5.5" rx="1" fill="white" fillOpacity="0.9"/><rect x="8.5" y="2" width="5.5" height="5.5" rx="1" fill="white" fillOpacity="0.6"/><rect x="2" y="8.5" width="5.5" height="5.5" rx="1" fill="white" fillOpacity="0.6"/><rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" fill="white" fillOpacity="0.4"/></svg>
          </div>
          <span className="text-[13px] font-bold text-white tracking-wide">FREMED</span>
          <span className="text-[11px] font-medium text-[#8c9baf]">| IT Manager</span>
        </div>

        {/* Header tabs — chỉ 4 tab */}
        <nav className="flex items-center gap-0.5 ml-4">
          {HEADER_TABS.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `px-3 py-[14px] text-[12.5px] font-medium transition-all border-b-2 whitespace-nowrap ${
                  isActive ? 'text-white border-[#4c9aff]' : 'text-[#8c9baf] border-transparent hover:text-[#c8d1dc] hover:border-[#4c6a8a]'
                }`}>{label}</NavLink>
          ))}
        </nav>

        <div className="flex-1" />
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6b7c8f]" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6.5" cy="6.5" r="4.5"/><line x1="10.5" y1="10.5" x2="14" y2="14"/></svg>
          <input placeholder="Tìm kiếm..." className="rounded text-[12px] pl-7 pr-3 py-[5px] text-[#c8d1dc] placeholder:text-[#5c7087] focus:outline-none w-40 transition-all" style={{background:'#253346',border:'1px solid #2e3f54'}} />
        </div>
        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-[#2e3f54]">
          <div className="w-7 h-7 rounded-full bg-[#0052cc] flex items-center justify-center text-[11px] font-bold text-white">{initial}</div>
          <span className="text-[12px] text-[#c8d1dc] font-medium">{username}</span>
          <button onClick={handleLogout} className="text-[#6b7c8f] hover:text-[#ff5630] transition-colors ml-1" title="Đăng xuất">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 2H4a2 2 0 00-2 2v8a2 2 0 002 2h2M10.5 11.5L14 8m0 0l-3.5-3.5M14 8H6"/></svg>
          </button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — giữ đầy đủ tất cả menu */}
        <aside className="w-[210px] bg-white border-r border-[#dfe1e6] flex flex-col flex-shrink-0 overflow-y-auto">
          <div className="px-3 py-3 border-b border-[#dfe1e6]">
            <span className="text-[11px] font-bold text-[#5e6c84] uppercase tracking-wider">Menu</span>
          </div>
          <nav className="px-2 py-2 space-y-[1px]">
            {SIDEBAR_NAV.map(({ to, label, end, icon }) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
                <span>{icon}</span><span>{label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto px-3 py-3 border-t border-[#dfe1e6]">
            <p className="text-[10px] text-[#97a0af]">Fremed IT Manager v2.0</p>
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto bg-[#f4f5f7]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
