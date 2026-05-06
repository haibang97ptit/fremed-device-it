import { useEffect, useState, useCallback } from 'react'
import { getTaiKhoan, createTaiKhoan, updateTaiKhoan, deleteTaiKhoan, importTaiKhoan } from '../api'
import Modal from '../components/Modal'

const EMPTY = { thiet_bi: '', tai_khoan: '', mat_khau: '', ghi_chu: '' }

export default function TaiKhoanIT() {
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [showPw, setShowPw] = useState({})
  const [importing, setImporting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { setRows((await getTaiKhoan({ search })).data) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [search])

  useEffect(() => { load() }, [load])

  async function handleSave() {
    setSaving(true)
    try {
      if (modal === 'add') await createTaiKhoan(form)
      else await updateTaiKhoan(form.id, form)
      setModal(null); load()
    } catch (e) { alert(e.response?.data?.message || 'Lỗi lưu') }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('Xác nhận xoá?')) return
    await deleteTaiKhoan(id); load()
  }

  async function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    setImporting(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await importTaiKhoan(fd)
      alert(res.data.message)
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi import')
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  function togglePw(id) { setShowPw(p => ({ ...p, [id]: !p[id] })) }

  function maskPw(pw) {
    if (!pw) return '—'
    return '•'.repeat(Math.min(pw.length, 12))
  }

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[18px] font-bold text-[#172b4d]">Tài khoản IT</h1>
          <p className="text-[12px] text-[#6b778c] mt-0.5">{rows.length} tài khoản thiết bị</p>
        </div>
        <div className="flex items-center gap-2">
          <label className={`btn-secondary text-[11.5px] py-[5px] cursor-pointer ${importing ? 'opacity-60' : ''}`}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 12V2M4 6l4-4 4 4"/><line x1="2" y1="14" x2="14" y2="14"/></svg>
            {importing ? 'Đang import...' : 'Import file'}
            <input type="file" accept=".csv,.xlsx,.xls" onChange={handleImport} className="hidden" disabled={importing} />
          </label>
          <button onClick={() => { setForm(EMPTY); setModal('add') }} className="btn-primary text-[11.5px] py-[5px]">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg>
            Thêm mới
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-3">
        <div className="relative max-w-md">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#97a0af]" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6.5" cy="6.5" r="4.5"/><line x1="10.5" y1="10.5" x2="14" y2="14"/></svg>
          <input className="input-field pl-7 py-[6px] text-[12.5px]" placeholder="Tìm thiết bị, tài khoản..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#ebecf0] bg-[#fafbfc]">
          <span className="text-[12px] font-semibold text-[#172b4d]">DEVICE ACCOUNTS ({rows.length})</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th className="th w-8">#</th>
              <th className="th">Thiết bị</th>
              <th className="th">Tài khoản</th>
              <th className="th">Mật khẩu</th>
              <th className="th">Ghi chú</th>
              <th className="th w-16"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-[12px] text-[#97a0af]">
                <div className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-[#0052cc] border-t-transparent rounded-full animate-spin"/>Đang tải...</div>
              </td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-[13px] text-[#97a0af]">Không có dữ liệu</td></tr>
            ) : rows.map((row, i) => (
              <tr key={row.id} className="tr-hover group">
                <td className="td text-[#97a0af] text-[11px]">{i+1}</td>
                <td className="td font-medium text-[12.5px]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#f4f5f7] border border-[#dfe1e6] flex items-center justify-center flex-shrink-0">
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#6b778c" strokeWidth="1.6"><rect x="1.5" y="2.5" width="13" height="9" rx="1.5"/><line x1="5" y1="13.5" x2="11" y2="13.5" strokeLinecap="round"/></svg>
                    </div>
                    {row.thiet_bi}
                  </div>
                </td>
                <td className="td font-mono text-[12px] text-[#344563]">{row.tai_khoan || '—'}</td>
                <td className="td">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[12px] text-[#344563] select-all">
                      {showPw[row.id] ? row.mat_khau : maskPw(row.mat_khau)}
                    </span>
                    {row.mat_khau && (
                      <button onClick={() => togglePw(row.id)} className="btn-icon" title={showPw[row.id] ? 'Ẩn' : 'Hiện'}>
                        {showPw[row.id] ? (
                          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 8s2.5-4.5 6-4.5S14 8 14 8s-2.5 4.5-6 4.5S2 8 2 8z"/><circle cx="8" cy="8" r="2"/><line x1="3" y1="13" x2="13" y2="3"/></svg>
                        ) : (
                          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 8s2.5-4.5 6-4.5S14 8 14 8s-2.5 4.5-6 4.5S2 8 2 8z"/><circle cx="8" cy="8" r="2"/></svg>
                        )}
                      </button>
                    )}
                  </div>
                </td>
                <td className="td text-[12px] text-[#6b778c]">{row.ghi_chu || '—'}</td>
                <td className="td">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setForm(row); setModal('edit') }} className="btn-icon" title="Sửa">
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 2.5L13.5 5L6 12.5H3.5V10L11 2.5z"/></svg>
                    </button>
                    <button onClick={() => handleDelete(row.id)} className="btn-icon text-[#97a0af] hover:text-[#ff5630] hover:bg-[#ffebe6]" title="Xoá">
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 4.5h10M6 4.5V3h4v1.5M5 4.5v8h6v-8"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Import hint */}
      <p className="text-[11px] text-[#97a0af] mt-2">
        💡 File import hỗ trợ CSV/Excel với các cột: <code className="text-[#6b778c]">thiet_bi, tai_khoan, mat_khau, ghi_chu</code>
      </p>

      {/* Modal */}
      {modal && (
        <Modal title={modal === 'add' ? 'Thêm tài khoản' : 'Chỉnh sửa tài khoản'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            {[['thiet_bi','Tên thiết bị'],['tai_khoan','Tài khoản'],['mat_khau','Mật khẩu'],['ghi_chu','Ghi chú']].map(([key, label]) => (
              <div key={key}>
                <label className="block text-[11.5px] font-semibold text-[#5e6c84] mb-1.5 uppercase tracking-wider">{label}</label>
                <input className="input-field" value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-[#dfe1e6]">
            <button onClick={() => setModal(null)} className="btn-secondary">Hủy</button>
            <button onClick={handleSave} disabled={saving || !form.thiet_bi} className="btn-primary disabled:opacity-60">
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
