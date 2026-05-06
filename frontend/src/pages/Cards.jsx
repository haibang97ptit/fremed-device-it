import { useEffect, useState, useCallback } from 'react'
import { getCards, createCard, updateCard, deleteCard, getPhongban } from '../api'
import Modal from '../components/Modal'
const EMPTY = { idban: '', card: '', name: '' }
export default function Cards() {
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [filterBan, setFilterBan] = useState('')
  const [phongban, setPhongban] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const load = useCallback(async () => {
    setLoading(true)
    try { setRows((await getCards({ search, idban: filterBan })).data) }
    catch (e) { console.error(e) } finally { setLoading(false) }
  }, [search, filterBan])
  useEffect(() => { load() }, [load])
  useEffect(() => { getPhongban().then(r => setPhongban(r.data)) }, [])
  async function handleSave() {
    setSaving(true)
    try { if (modal === 'add') await createCard(form); else await updateCard(form.id, form); setModal(null); load() }
    catch { alert('Lỗi lưu') } finally { setSaving(false) }
  }
  async function handleDelete(id) { if (!confirm('Xác nhận xoá?')) return; await deleteCard(id); load() }
  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[18px] font-bold text-[#172b4d]">Thẻ từ</h1>
          <p className="text-[12px] text-[#6b778c] mt-0.5">{rows.length} thẻ đang hoạt động</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setModal('add') }} className="btn-primary text-[11.5px] py-[5px]">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg>
          Thêm thẻ
        </button>
      </div>
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1 min-w-[220px]">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#97a0af]" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6.5" cy="6.5" r="4.5"/><line x1="10.5" y1="10.5" x2="14" y2="14"/></svg>
          <input className="input-field pl-7 py-[6px] text-[12.5px]" placeholder="Tìm tên nhân viên, ID card..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-44 py-[6px] text-[12.5px]" value={filterBan} onChange={e => setFilterBan(e.target.value)}>
          <option value="">Tất cả phòng ban</option>
          {phongban.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#ebecf0] bg-[#fafbfc]">
          <span className="text-[12px] font-semibold text-[#172b4d]">ACCESS CARDS ({rows.length})</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th className="th w-8 pl-4"><input type="checkbox" className="rounded border-[#dfe1e6]" /></th>
              <th className="th w-8">#</th>
              <th className="th">ID Card</th>
              <th className="th">Nhân viên</th>
              <th className="th">Phòng ban</th>
              <th className="th w-16"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-[12px] text-[#97a0af]">
                <div className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-[#0052cc] border-t-transparent rounded-full animate-spin" />Đang tải...</div>
              </td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-[13px] text-[#97a0af]">Không có dữ liệu</td></tr>
            ) : rows.map((row, i) => (
              <tr key={row.id} className="tr-hover group">
                <td className="td pl-4"><input type="checkbox" className="rounded border-[#dfe1e6]" /></td>
                <td className="td text-[#97a0af] text-[11px]">{i+1}</td>
                <td className="td font-mono text-[12px] text-[#344563]">{row.card || '—'}</td>
                <td className="td font-medium text-[12.5px]">{row.name || '—'}</td>
                <td className="td">{row.phongban_name ? <span className="badge badge-blue">{row.phongban_name}</span> : '—'}</td>
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
      {modal && (
        <Modal title={modal === 'add' ? 'Thêm thẻ từ mới' : 'Chỉnh sửa thẻ từ'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            {[['name','Họ và tên'],['card','ID Card']].map(([key, label]) => (
              <div key={key}>
                <label className="block text-[11.5px] font-semibold text-[#5e6c84] mb-1.5 uppercase tracking-wider">{label}</label>
                <input className="input-field" value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            <div>
              <label className="block text-[11.5px] font-semibold text-[#5e6c84] mb-1.5 uppercase tracking-wider">Phòng ban</label>
              <select className="input-field" value={form.idban || ''} onChange={e => setForm(f => ({ ...f, idban: e.target.value }))}>
                <option value="">Chọn phòng ban</option>
                {phongban.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-[#dfe1e6]">
            <button onClick={() => setModal(null)} className="btn-secondary">Hủy</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">{saving ? 'Đang lưu...' : 'Lưu lại'}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
