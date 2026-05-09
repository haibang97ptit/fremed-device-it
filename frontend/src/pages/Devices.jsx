import { useEffect, useState, useCallback } from 'react'
import { getDevices, createDevice, updateDevice, deleteDevice, getPhongban, getLoaimay } from '../api'
import api from '../api'
import Modal from '../components/Modal'

const EMPTY = { idmay: '', idban: '', name: '', service_tag: '', express_code: '', mac_address: '', ngay_mua: '', details: '', tinh_trang: '' }

function PingCell({ row, pingResults, handlePing }) {
  const r = pingResults[row.id]
  if (!row.service_tag) return <span className="text-[#c1c7d0]">—</span>
  if (!r) return (
    <button onClick={() => handlePing(row)}
      className="text-[11px] font-semibold text-[#0052cc] hover:text-[#0747a6] hover:underline transition-colors">
      Ping
    </button>
  )
  if (r.loading) return <span className="text-[11px] text-[#97a0af] animate-pulse">Pinging...</span>
  if (r.status === 'error') return <span className="text-[11px] text-[#ff5630]">{r.message}</span>
  if (r.status === 'online') return (
    <div className="flex items-center gap-1.5">
      <span className="badge badge-green">
        <span className="w-1.5 h-1.5 rounded-full bg-[#36b37e]" />
        {r.resolved_ip || 'Online'}
      </span>
      <button onClick={() => handlePing(row)} className="text-[#97a0af] hover:text-[#0052cc] transition-colors">
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 8a7 7 0 0112.9-3.8M15 8a7 7 0 01-12.9 3.8"/><path d="M14 1v3.2h-3.2M2 15v-3.2h3.2"/></svg>
      </button>
    </div>
  )
  return (
    <div className="flex items-center gap-1.5">
      <span className="badge badge-red">
        <span className="w-1.5 h-1.5 rounded-full bg-[#ff5630]" />
        Unknown
      </span>
      <button onClick={() => handlePing(row)} className="text-[#97a0af] hover:text-[#0052cc] transition-colors">
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 8a7 7 0 0112.9-3.8M15 8a7 7 0 01-12.9 3.8"/><path d="M14 1v3.2h-3.2M2 15v-3.2h3.2"/></svg>
      </button>
    </div>
  )
}

export default function Devices() {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterBan, setFilterBan] = useState('')
  const [filterMay, setFilterMay] = useState('')
  const [phongban, setPhongban] = useState([])
  const [loaimay, setLoaimay] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [pingResults, setPingResults] = useState({})
  const [addingLoaimay, setAddingLoaimay] = useState(false)
  const [newLoaimay, setNewLoaimay] = useState('')

  // Reset inline input khi mở/đóng modal
  useEffect(() => { setAddingLoaimay(false); setNewLoaimay('') }, [modal])
  const LIMIT = 50

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getDevices({ search, idban: filterBan, idmay: filterMay, page, limit: LIMIT })
      setRows(res.data.data); setTotal(res.data.total)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [search, filterBan, filterMay, page])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    getPhongban().then(r => setPhongban(r.data))
    getLoaimay().then(r => setLoaimay(r.data))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      let finalForm = { ...form }

      // Nếu đang nhập loại máy mới → tạo trước
      if (addingLoaimay && newLoaimay.trim()) {
        const res = await api.post('/lookup/loaimay', { name: newLoaimay.trim() })
        const updated = await api.get('/lookup/loaimay')
        setLoaimay(updated.data)
        finalForm.idmay = String(res.data.id)
        setAddingLoaimay(false)
        setNewLoaimay('')
      }

      if (modal === 'add') await createDevice(finalForm)
      else await updateDevice(finalForm.id, finalForm)
      setModal(null); load()
    } catch (e) { alert(e.response?.data?.message || 'Lỗi lưu') }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('Xác nhận xoá thiết bị này?')) return
    await deleteDevice(id); load()
  }

  async function handlePing(row) {
    if (!row.service_tag) return
    setPingResults(prev => ({ ...prev, [row.id]: { loading: true } }))
    try {
      const res = await api.post('/ping/ip/check', { ip: `${row.service_tag}.fremed.com` })
      setPingResults(prev => ({ ...prev, [row.id]: { ...res.data, loading: false } }))
    } catch (e) {
      setPingResults(prev => ({ ...prev, [row.id]: { status: 'error', message: 'Lỗi ping', loading: false } }))
    }
  }

  const totalPages = Math.ceil(total / LIMIT)
  const perPage = `${(page-1)*LIMIT+1}–${Math.min(page*LIMIT, total)}`

  return (
    <div className="p-5">
      {/* Page header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[18px] font-bold text-[#172b4d]">Thiết bị</h1>
          <p className="text-[12px] text-[#6b778c] mt-0.5">{total} thiết bị được quản lý</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary text-[11.5px] py-[5px]">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v10M4 8l4 4 4-4"/><line x1="2" y1="14" x2="14" y2="14"/></svg>
            Xuất Excel
          </button>
          <button onClick={() => { setForm(EMPTY); setModal('add') }} className="btn-primary text-[11.5px] py-[5px]">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg>
            Thêm thiết bị
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[220px]">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#97a0af]" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6.5" cy="6.5" r="4.5"/><line x1="10.5" y1="10.5" x2="14" y2="14"/></svg>
          <input className="input-field pl-7 py-[6px] text-[12.5px]" placeholder="Tìm tên, service tag, MAC, IP..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <select className="input-field w-44 py-[6px] text-[12.5px]" value={filterBan} onChange={e => { setFilterBan(e.target.value); setPage(1) }}>
          <option value="">Tất cả phòng ban</option>
          {phongban.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="input-field w-40 py-[6px] text-[12.5px]" value={filterMay} onChange={e => { setFilterMay(e.target.value); setPage(1) }}>
          <option value="">Tất cả loại máy</option>
          {loaimay.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        {(filterBan || filterMay || search) && (
          <button onClick={() => { setSearch(''); setFilterBan(''); setFilterMay(''); setPage(1) }}
            className="text-[12px] text-[#6b778c] hover:text-[#0052cc] transition-colors flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg>
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Table */}
      <div className="panel overflow-hidden">
        {/* Table top bar */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#ebecf0] bg-[#fafbfc]">
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-semibold text-[#172b4d]">
              DEVICES ({total})
            </span>
            {total > 0 && <span className="text-[11px] text-[#97a0af]">{perPage} of {total}</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#6b778c]">Per Page</span>
            <select className="text-[11px] border border-[#dfe1e6] rounded px-1.5 py-[3px] text-[#344563] bg-white focus:outline-none">
              <option>50</option><option>25</option><option>100</option>
            </select>
            <button className="btn-icon text-[11px]">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 8a7 7 0 0112.9-3.8M15 8a7 7 0 01-12.9 3.8"/><path d="M14 1v3.2h-3.2M2 15v-3.2h3.2"/></svg>
            </button>
            <span className="text-[11px] text-[#6b778c] ml-1">Columns View: Default</span>
            <button className="btn-icon">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="4" height="12" rx="1"/><rect x="10" y="2" width="4" height="12" rx="1"/></svg>
            </button>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th className="th w-8 pl-4">
                <input type="checkbox" className="rounded border-[#dfe1e6]" />
              </th>
              <th className="th w-8">#</th>
              <th className="th">Device Name</th>
              {/* <th className="th">Manufacturer</th> */}
              <th className="th">Loại máy</th>
              <th className="th">Ping</th>
              <th className="th">Tình trạng</th>
              <th className="th">Phòng ban</th>
              <th className="th w-16"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={12} className="text-center py-14">
                  <div className="flex items-center justify-center gap-2 text-[#6b778c]">
                    <div className="w-4 h-4 border-2 border-[#0052cc] border-t-transparent rounded-full animate-spin" />
                    <span className="text-[12px]">Đang tải dữ liệu...</span>
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={12} className="text-center py-14">
                  <div className="flex flex-col items-center gap-2 text-[#97a0af]">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="6" width="24" height="18" rx="2"/><line x1="4" y1="12" x2="28" y2="12"/><line x1="10" y1="19" x2="16" y2="19"/></svg>
                    <span className="text-[13px]">Không có dữ liệu</span>
                  </div>
                </td>
              </tr>
            ) : rows.map((row, i) => {
              const batteryPct = row.battery_percentage ? parseInt(row.battery_percentage) : null
              const batteryColor = batteryPct >= 60 ? '#36b37e' : batteryPct >= 30 ? '#ffab00' : '#ff5630'
              return (
                <tr key={row.id} className="tr-hover border-b border-[#ebecf0] group">
                  <td className="td pl-4">
                    <input type="checkbox" className="rounded border-[#dfe1e6]" />
                  </td>
                  <td className="td text-[#97a0af] text-[11px]">{(page-1)*LIMIT + i + 1}</td>
                  <td className="td">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-[3px] bg-[#f4f5f7] border border-[#dfe1e6] flex items-center justify-center flex-shrink-0">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#6b778c" strokeWidth="1.6"><rect x="1.5" y="2.5" width="13" height="9" rx="1.5"/><line x1="5" y1="13.5" x2="11" y2="13.5" strokeLinecap="round"/></svg>
                      </div>
                      <button onClick={() => { setForm({ ...row, ngay_mua: row.ngay_mua?.slice(0,10) || '' }); setModal('edit') }}
                        className="text-[#0052cc] hover:underline font-medium text-[12.5px]">
                        {row.name || row.loaimay_name || '—'}
                      </button>
                    </div>
                  </td>
                  {/* <td className="td text-[#344563] text-[12px]">{row.manufacturer || '—'}</td> */}
                  <td className="td text-[12px]">{row.loaimay_name || '—'}</td>
                  <td className="td"><PingCell row={row} pingResults={pingResults} handlePing={handlePing} /></td>
                  <td className="td">
                    {row.tinh_trang ? (
                      <span className={`badge ${row.tinh_trang.toLowerCase().includes('tốt') || row.tinh_trang.toLowerCase().includes('ok') ? 'badge-green' : 'badge-gray'}`}>
                        {row.tinh_trang}
                      </span>
                    ) : <span className="text-[#c1c7d0]">—</span>}
                  </td>
                  <td className="td">
                    {row.phongban_name ? <span className="badge badge-blue">{row.phongban_name}</span> : <span className="text-[#c1c7d0]">—</span>}
                  </td>
                  <td className="td">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setForm({ ...row, ngay_mua: row.ngay_mua?.slice(0,10) || '' }); setModal('edit') }}
                        className="btn-icon text-[#97a0af]" title="Chỉnh sửa">
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 2.5L13.5 5L6 12.5H3.5V10L11 2.5z"/></svg>
                      </button>
                      <button onClick={() => handleDelete(row.id)}
                        className="btn-icon text-[#97a0af] hover:text-[#ff5630] hover:bg-[#ffebe6]" title="Xoá">
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 4.5h10M6 4.5V3h4v1.5M5 4.5v8h6v-8"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#ebecf0] bg-[#fafbfc]">
            <span className="text-[12px] text-[#6b778c]">
              Trang {page} / {totalPages} — {total} bản ghi
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={page === 1}
                className="btn-secondary py-[4px] px-2 text-[11px] disabled:opacity-40">«</button>
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                className="btn-secondary py-[4px] px-2.5 text-[11px] disabled:opacity-40">‹ Trước</button>
              <div className="flex gap-0.5">
                {Array.from({ length: Math.min(5, totalPages) }, (_, ii) => {
                  const pg = page <= 3 ? ii + 1 : page + ii - 2
                  if (pg < 1 || pg > totalPages) return null
                  return (
                    <button key={pg} onClick={() => setPage(pg)}
                      className={`w-7 h-7 text-[11px] rounded font-medium transition-colors ${pg === page ? 'bg-[#0052cc] text-white' : 'text-[#344563] hover:bg-[#ebecf0]'}`}>
                      {pg}
                    </button>
                  )
                })}
              </div>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                className="btn-secondary py-[4px] px-2.5 text-[11px] disabled:opacity-40">Sau ›</button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                className="btn-secondary py-[4px] px-2 text-[11px] disabled:opacity-40">»</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <Modal title={modal === 'add' ? 'Thêm thiết bị mới' : 'Chỉnh sửa thiết bị'} onClose={() => setModal(null)} size="lg">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11.5px] font-semibold text-[#5e6c84] mb-1.5 uppercase tracking-wider">Loại máy</label>
              {addingLoaimay ? (
                <div className="flex gap-1.5">
                  <input className="input-field flex-1" placeholder="Nhập tên loại máy mới..." autoFocus
                    value={newLoaimay} onChange={e => setNewLoaimay(e.target.value)}
                    onKeyDown={async e => {
                      if (e.key === 'Enter' && newLoaimay.trim()) {
                        try {
                          const res = await api.post('/lookup/loaimay', { name: newLoaimay.trim() })
                          const updated = await api.get('/lookup/loaimay')
                          setLoaimay(updated.data)
                          setForm(f => ({ ...f, idmay: String(res.data.id) }))
                          setAddingLoaimay(false); setNewLoaimay('')
                        } catch { alert('Lỗi tạo loại máy') }
                      }
                      if (e.key === 'Escape') { setAddingLoaimay(false); setNewLoaimay('') }
                    }} />
                  <button type="button" onClick={() => { setAddingLoaimay(false); setNewLoaimay('') }}
                    className="btn-secondary px-2 flex-shrink-0" title="Hủy">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg>
                  </button>
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <select className="input-field flex-1" value={form.idmay} onChange={e => setForm(f => ({ ...f, idmay: e.target.value }))}>
                    <option value="">Chọn loại máy</option>
                    {loaimay.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                  <button type="button" onClick={() => setAddingLoaimay(true)}
                    className="btn-secondary px-2 flex-shrink-0" title="Thêm loại máy mới">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg>
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-[#5e6c84] mb-1.5 uppercase tracking-wider">Phòng ban</label>
              <select className="input-field" value={form.idban} onChange={e => setForm(f => ({ ...f, idban: e.target.value }))}>
                <option value="">Chọn phòng ban</option>
                {phongban.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {[['name','Tên nhân viên'],['service_tag','Service Tag'],['express_code','Express Code'],['mac_address','MAC Address'],['tinh_trang','Tình trạng']].map(([key, label]) => (
              <div key={key}>
                <label className="block text-[11.5px] font-semibold text-[#5e6c84] mb-1.5 uppercase tracking-wider">{label}</label>
                <input className="input-field" value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            <div>
              <label className="block text-[11.5px] font-semibold text-[#5e6c84] mb-1.5 uppercase tracking-wider">Ngày mua</label>
              <input type="date" className="input-field" value={form.ngay_mua || ''} onChange={e => setForm(f => ({ ...f, ngay_mua: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="block text-[11.5px] font-semibold text-[#5e6c84] mb-1.5 uppercase tracking-wider">Ghi chú</label>
              <input className="input-field" value={form.details || ''} onChange={e => setForm(f => ({ ...f, details: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-[#dfe1e6]">
            <button onClick={() => setModal(null)} className="btn-secondary">Hủy</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
              {saving ? 'Đang lưu...' : modal === 'add' ? 'Tạo thiết bị' : 'Lưu thay đổi'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
