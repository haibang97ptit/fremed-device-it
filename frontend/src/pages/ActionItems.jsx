import { useEffect, useState, useCallback } from 'react'
import api from '../api'

function getDaysUntil(dateStr) {
  if (!dateStr) return null
  const target = new Date(dateStr)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24))
}

function DeadlineBadge({ days, isOpen }) {
  if (!isOpen) return <span className="badge badge-green">Đã hoàn thành</span>
  if (days === null) return <span className="badge badge-gray">N/A</span>
  if (days < 0) return <span className="badge badge-red">Quá hạn {Math.abs(days)} ngày</span>
  if (days === 0) return <span className="badge badge-red">Hôm nay!</span>
  if (days <= 7) return <span className="badge badge-yellow">Còn {days} ngày</span>
  if (days <= 30) return <span className="badge badge-blue">Còn {days} ngày</span>
  return <span className="badge badge-gray">Còn {days} ngày</span>
}

export default function ActionItems() {
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [itemsRes, sumRes] = await Promise.all([
        api.get('/qualzen/action-items'),
        api.get('/qualzen/action-items/summary')
      ])
      setRows(itemsRes.data)
      setSummary(sumRes.data)
    } catch (e) {
      console.error(e)
      setError(e.response?.data?.message || 'Không thể kết nối tới Qualzen SQL Server')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = rows.filter(row => {
    const days = getDaysUntil(row.TargetDate)
    const isOpen = row.CurrentStatus === 3
    const isClosed = !isOpen

    if (filter === 'open' && !isOpen) return false
    if (filter === 'overdue' && !(isOpen && days !== null && days < 0)) return false
    if (filter === 'dueSoon' && !(isOpen && days !== null && days >= 0 && days <= 7)) return false
    if (filter === 'onTrack' && !(isOpen && days !== null && days > 7)) return false
    if (filter === 'closed' && !isClosed) return false

    if (search) {
      const s = search.toLowerCase()
      return (
        (row.ActionPlanNumber || '').toLowerCase().includes(s) ||
        (row.ActionPlanDescription || '').toLowerCase().includes(s) ||
        (row.ResponsiblePersonName || '').toLowerCase().includes(s)
      )
    }
    return true
  })

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[18px] font-bold text-[#172b4d]">Action Items — Qualzen</h1>
          <p className="text-[12px] text-[#6b778c] mt-0.5">Phòng IT • Dữ liệu từ hệ thống Qualzen</p>
        </div>
        <button onClick={load} className="btn-secondary text-[11.5px] py-[5px]">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 8a7 7 0 0112.9-3.8M15 8a7 7 0 01-12.9 3.8"/>
            <path d="M14 1v3.2h-3.2M2 15v-3.2h3.2"/>
          </svg>
          Làm mới
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-[#ffebe6] border border-[#ff8f73] rounded text-[12px] text-[#bf2600]">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="8" r="6"/><line x1="8" y1="5" x2="8" y2="8.5"/><circle cx="8" cy="11" r="0.5" fill="currentColor"/></svg>
          {error}
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-5 gap-3 mb-4">
          {[
            { label: 'Tổng', value: summary.total, color: '#0052cc', filterKey: 'all' },
            { label: 'Đang mở', value: summary.openCount, color: '#bf2600', filterKey: 'open' },
            { label: 'Quá hạn', value: summary.overdue, color: '#bf2600', filterKey: 'overdue' },
            { label: 'Sắp hết hạn (7 ngày)', value: summary.dueSoon, color: '#974f0c', filterKey: 'dueSoon' },
            { label: 'Đã hoàn thành', value: summary.closed, color: '#006644', filterKey: 'closed' },
          ].map(card => (
            <div
              key={card.filterKey}
              onClick={() => setFilter(card.filterKey)}
              className={`panel p-3 cursor-pointer transition-all hover:shadow-md ${filter === card.filterKey ? 'ring-2 ring-[#4c9aff]' : ''}`}
            >
              <p className="text-[24px] font-bold" style={{ color: card.color }}>{card.value ?? '—'}</p>
              <p className="text-[11.5px] text-[#6b778c] mt-0.5">{card.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mb-3">
        <div className="relative max-w-md">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#97a0af]" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6.5" cy="6.5" r="4.5"/><line x1="10.5" y1="10.5" x2="14" y2="14"/></svg>
          <input className="input-field pl-7 py-[6px] text-[12.5px]" placeholder="Tìm Action Item, mô tả, người phụ trách..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#ebecf0] bg-[#fafbfc]">
          <span className="text-[12px] font-semibold text-[#172b4d]">ACTION ITEMS ({filtered.length})</span>
          {filter !== 'all' && (
            <button onClick={() => setFilter('all')} className="text-[11px] text-[#0052cc] hover:underline">
              Xóa bộ lọc
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="th w-8">#</th>
                <th className="th">Action Item No.</th>
                <th className="th" style={{ minWidth: 250 }}>Mô tả</th>
                <th className="th">Người phụ trách</th>
                <th className="th">HOD</th>
                <th className="th">QA</th>
                <th className="th">Ngày tạo</th>
                <th className="th">Target Date</th>
                <th className="th">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-14">
                  <div className="flex items-center justify-center gap-2 text-[#6b778c]">
                    <div className="w-4 h-4 border-2 border-[#0052cc] border-t-transparent rounded-full animate-spin" />
                    <span className="text-[12px]">Đang tải từ Qualzen...</span>
                  </div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-14 text-[13px] text-[#97a0af]">
                  {error ? 'Không thể tải dữ liệu' : 'Không có action item nào'}
                </td></tr>
              ) : filtered.map((row, i) => {
                const days = getDaysUntil(row.TargetDate)
                const isOpen = row.CurrentStatus === 3
                const isOverdue = isOpen && days !== null && days < 0
                const isDueSoon = isOpen && days !== null && days >= 0 && days <= 7

                return (
                  <tr key={row.ActionPlanMasterID}
                    className={`group transition-colors ${
                      isOverdue ? 'bg-[#fff0ee] hover:bg-[#ffebe6]' :
                      isDueSoon ? 'bg-[#fffcf0] hover:bg-[#fffae6]' :
                      !isOpen ? 'opacity-60 hover:opacity-80' :
                      'hover:bg-[#f4f5f7]'
                    }`}>
                    <td className="td text-[#97a0af] text-[11px]">{i + 1}</td>
                    <td className="td">
                      <span className="font-mono text-[12px] font-semibold text-[#0052cc]">{row.ActionPlanNumber}</span>
                    </td>
                    <td className="td text-[12px] text-[#344563]" style={{ maxWidth: 350 }}>
                      <span className="line-clamp-2">{row.ActionPlanDescription}</span>
                    </td>
                    <td className="td text-[12px] font-medium">{row.ResponsiblePersonName || '—'}</td>
                    <td className="td text-[12px] text-[#6b778c]">{row.DeptHODName || '—'}</td>
                    <td className="td text-[12px] text-[#6b778c]">{row.QAName || '—'}</td>
                    <td className="td text-[11.5px] text-[#6b778c]">
                      {row.CreatedDate ? new Date(row.CreatedDate).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="td text-[12px] font-medium">
                      {row.TargetDate ? new Date(row.TargetDate).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="td">
                      <DeadlineBadge days={days} isOpen={isOpen} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
