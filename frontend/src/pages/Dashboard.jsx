import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts'
import { getDashboard } from '../api'

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
  useEffect(() => { getDashboard().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false)) }, [])

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
        <div className="flex items-center gap-2">
          <button className="btn-secondary text-[11.5px] py-[5px] gap-1.5">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="12" height="12" rx="1.5"/><line x1="5" y1="8" x2="11" y2="8"/><line x1="8" y1="5" x2="8" y2="11"/></svg>
            Xuất báo cáo
          </button>
          <button className="btn-primary text-[11.5px] py-[5px]">Làm mới</button>
        </div>
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

      {/* Status bar */}
      <div className="panel p-4">
        <SectionHeader title="Tình trạng thiết bị" />
        {data?.byStatus?.length ? (
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            {data.byStatus.map((s, i) => {
              const max = Math.max(...data.byStatus.map(x => parseInt(x.count)))
              const pct = Math.round((parseInt(s.count) / max) * 100)
              const colors = [COLORS[1], COLORS[0], COLORS[2], COLORS[3], COLORS[4]]
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: colors[i % colors.length] }} />
                  <span className="text-[12px] text-[#344563] w-28 truncate">{s.tinh_trang || 'Không rõ'}</span>
                  <div className="flex-1 bg-[#ebecf0] rounded-full h-[5px]">
                    <div className="h-[5px] rounded-full transition-all" style={{ width: `${pct}%`, background: colors[i % colors.length] }} />
                  </div>
                  <span className="text-[12px] font-semibold text-[#172b4d] w-8 text-right">{s.count}</span>
                </div>
              )
            })}
          </div>
        ) : <p className="text-[13px] text-[#97a0af] text-center py-6">Chưa có dữ liệu</p>}
      </div>
    </div>
  )
}
