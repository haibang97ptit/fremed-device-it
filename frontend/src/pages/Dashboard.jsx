import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts'
import { getDashboard, getDongHoStatus } from '../api'

const COLORS = ['#0052cc','#36b37e','#ff5630','#ffab00','#6554c0','#00b8d9','#ff7452']

function StatCard({ label, value, icon, color, sub }) {
  return (
    <div className="panel p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-[3px] flex items-center justify-center flex-shrink-0" style={{ background: color + '1a' }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-[26px] font-bold leading-tight" style={{ color: '#172b4d' }}>{value ?? '—'}</p>
        <p className="text-[12px] text-[#6b778c] mt-0.5">{label}</p>
        {sub && <p className="text-[11px] text-[#97a0af] mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function SectionHeader({ title }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-[13px] font-semibold text-[#172b4d]">{title}</h2>
      <button className="text-[11px] text-[#0052cc] hover:underline">Xem tất cả</button>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dongho, setDongho] = useState(null)
  const [donghoLoading, setDonghoLoading] = useState(false)
  const [donghoFilter, setDonghoFilter] = useState('all') // all | online | offline

  useEffect(() => { getDashboard().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false)) }, [])

  // Fetch đồng hồ status
  const fetchDongho = () => {
    setDonghoLoading(true)
    getDongHoStatus()
      .then(r => setDongho(r.data))
      .catch(console.error)
      .finally(() => setDonghoLoading(false))
  }
  useEffect(() => {
    fetchDongho()
    const interval = setInterval(fetchDongho, 60000) // auto refresh mỗi 60s
    return () => clearInterval(interval)
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-5 h-5 border-2 border-[#0052cc] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-5">
      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[18px] font-bold text-[#172b4d]">Dashboard</h1>
          <p className="text-[12px] text-[#6b778c] mt-0.5">Tổng quan hệ thống thiết bị IT — Fremed</p>
        </div>
        {/* <div className="flex items-center gap-2">
          <button className="btn-secondary text-[11.5px] py-[5px] gap-1.5">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="12" height="12" rx="1.5"/><line x1="5" y1="8" x2="11" y2="8"/><line x1="8" y1="5" x2="8" y2="11"/></svg>
            Xuất báo cáo
          </button>
          <button className="btn-primary text-[11.5px] py-[5px]">Làm mới</button>
        </div> */}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <StatCard
          label="Tổng thiết bị" value={data?.total.devices}
          icon={<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1.5" y="2.5" width="13" height="9" rx="1.5"/><line x1="5" y1="13.5" x2="11" y2="13.5" strokeLinecap="round"/><line x1="8" y1="11.5" x2="8" y2="13.5"/></svg>}
          color="#0052cc" sub="Đang được quản lý"
        />
        <StatCard
          label="Thẻ từ" value={data?.total.cards}
          icon={<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1.5" y="3" width="13" height="10" rx="1.5"/><line x1="1.5" y1="6.5" x2="14.5" y2="6.5"/><line x1="4" y1="10" x2="7" y2="10" strokeLinecap="round"/></svg>}
          color="#36b37e" sub="Access cards"
        />
        <StatCard
          label="IP tĩnh" value={data?.total.ips}
          icon={<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="8" cy="8" r="6"/><line x1="8" y1="2" x2="8" y2="14"/><path d="M2 8c1.5-2 3-3 6-3s4.5 1 6 3"/><path d="M2 8c1.5 2 3 3 6 3s4.5-1 6-3"/></svg>}
          color="#6554c0" sub="Static IPs assigned"
        />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Bar chart: by phong ban */}
        <div className="panel p-4">
          <SectionHeader title="Thiết bị theo phòng ban" />
          {data?.byPhongban?.length ? (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={data.byPhongban} layout="vertical" margin={{ left: 0, right: 10 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: '#97a0af' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b778c' }} width={90} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 4, border: '1px solid #dfe1e6', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: '#f4f5f7' }}
                />
                <Bar dataKey="count" fill="#0052cc" radius={[0, 3, 3, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-[13px] text-[#97a0af] text-center py-10">Chưa có dữ liệu</p>}
        </div>

        {/* Bar chart: by loai may */}
        <div className="panel p-4">
          <SectionHeader title="Thiết bị theo loại máy" />
          {data?.byLoaimay?.length ? (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={data.byLoaimay} layout="vertical" margin={{ left: 0, right: 10 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: '#97a0af' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b778c' }} width={90} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4, border: '1px solid #dfe1e6' }} cursor={{ fill: '#f4f5f7' }} />
                <Bar dataKey="count" radius={[0, 3, 3, 0]} barSize={12}>
                  {data.byLoaimay.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-[13px] text-[#97a0af] text-center py-10">Chưa có dữ liệu</p>}
        </div>
      </div>

      {/* ===== ĐỒNG HỒ MONITORING ===== */}
      <div className="panel p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-[13px] font-semibold text-[#172b4d]">Theo dõi Đồng hồ</h2>
            {dongho && (
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-green-50 text-green-700 font-medium">{dongho.online} online</span>
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 font-medium">{dongho.offline} offline</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Filter buttons */}
            <div className="flex text-[11px] border border-[#dfe1e6] rounded overflow-hidden">
              {[
                { key: 'all', label: 'Tất cả' },
                { key: 'online', label: 'Online' },
                { key: 'offline', label: 'Offline' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setDonghoFilter(f.key)}
                  className={`px-2.5 py-1 transition-colors ${
                    donghoFilter === f.key
                      ? 'bg-[#0052cc] text-white'
                      : 'text-[#6b778c] hover:bg-[#f4f5f7]'
                  }`}
                >{f.label}</button>
              ))}
            </div>
            <button
              onClick={fetchDongho}
              disabled={donghoLoading}
              className="btn-secondary text-[11px] py-[4px] px-2.5 gap-1"
            >
              <svg className={`w-3 h-3 ${donghoLoading ? 'animate-spin' : ''}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 8A6 6 0 1 1 8 2" strokeLinecap="round"/>
                <path d="M14 2v4h-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Ping lại
            </button>
          </div>
        </div>

        {donghoLoading && !dongho ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-4 h-4 border-2 border-[#0052cc] border-t-transparent rounded-full animate-spin" />
            <span className="text-[12px] text-[#6b778c] ml-2">Đang ping các đồng hồ...</span>
          </div>
        ) : dongho?.devices?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[#dfe1e6]">
                  <th className="text-left py-2 px-2 text-[11px] font-semibold text-[#6b778c] uppercase tracking-wide">Tên</th>
                  <th className="text-left py-2 px-2 text-[11px] font-semibold text-[#6b778c] uppercase tracking-wide">IP</th>
                  <th className="text-left py-2 px-2 text-[11px] font-semibold text-[#6b778c] uppercase tracking-wide">VLAN</th>
                  <th className="text-left py-2 px-2 text-[11px] font-semibold text-[#6b778c] uppercase tracking-wide">Phòng ban</th>
                  <th className="text-center py-2 px-2 text-[11px] font-semibold text-[#6b778c] uppercase tracking-wide">Trạng thái</th>
                  <th className="text-right py-2 px-2 text-[11px] font-semibold text-[#6b778c] uppercase tracking-wide">Latency</th>
                </tr>
              </thead>
              <tbody>
                {dongho.devices
                  .filter(d => donghoFilter === 'all' || d.status === donghoFilter)
                  .map(d => (
                  <tr key={d.id} className="border-b border-[#f4f5f7] hover:bg-[#fafbfc] transition-colors">
                    <td className="py-2 px-2 text-[#172b4d] font-medium">{d.name}</td>
                    <td className="py-2 px-2 text-[#344563] font-mono text-[11px]">{d.ip || '—'}</td>
                    <td className="py-2 px-2 text-[#6b778c]">{d.vlan || '—'}</td>
                    <td className="py-2 px-2 text-[#6b778c]">{d.phongban_name || '—'}</td>
                    <td className="py-2 px-2 text-center">
                      {d.status === 'online' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[11px] font-medium">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                          </span>
                          Online
                        </span>
                      ) : d.status === 'offline' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[11px] font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block"></span>
                          Offline
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[11px]">
                          Không rõ
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-right text-[#6b778c] font-mono text-[11px]">
                      {d.latency ? `${Math.round(d.latency)}ms` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {dongho.devices.filter(d => donghoFilter === 'all' || d.status === donghoFilter).length === 0 && (
              <p className="text-[12px] text-[#97a0af] text-center py-6">Không có đồng hồ nào {donghoFilter === 'online' ? 'online' : 'offline'}</p>
            )}
          </div>
        ) : (
          <p className="text-[13px] text-[#97a0af] text-center py-6">Không tìm thấy đồng hồ nào trong bảng IP</p>
        )}

        {/* Auto-refresh indicator */}
        {dongho && (
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#f4f5f7]">
            <p className="text-[10px] text-[#97a0af]">Tự động làm mới mỗi 60 giây</p>
            <p className="text-[10px] text-[#97a0af]">Tổng: {dongho.total} đồng hồ</p>
          </div>
        )}
      </div>
    </div>
  )
}
