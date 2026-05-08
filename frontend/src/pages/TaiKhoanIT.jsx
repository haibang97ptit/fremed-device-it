import { useEffect, useState, useCallback } from 'react'
import api from '../api'
import Modal from '../components/Modal'

const SYSTEM_TYPES = [
  { value: 'server', label: 'Server', icon: '🖥️', color: '#0052cc' },
  { value: 'software', label: 'Phần mềm', icon: '💻', color: '#6554c0' },
  { value: 'device', label: 'Thiết bị', icon: '📡', color: '#00875a' },
  { value: 'other', label: 'Khác', icon: '📦', color: '#6b778c' },
]

const ROLES = ['admin', 'user', 'viewer', 'service']

function getTypeInfo(type) {
  return SYSTEM_TYPES.find(t => t.value === type) || SYSTEM_TYPES[3]
}

function maskPw(pw) {
  if (!pw) return '—'
  return '•'.repeat(Math.min(pw.length, 12))
}

function EyeIcon({ open }) {
  return open ? (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 8s2.5-4.5 6-4.5S14 8 14 8s-2.5 4.5-6 4.5S2 8 2 8z"/><circle cx="8" cy="8" r="2"/><line x1="3" y1="13" x2="13" y2="3"/></svg>
  ) : (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 8s2.5-4.5 6-4.5S14 8 14 8s-2.5 4.5-6 4.5S2 8 2 8z"/><circle cx="8" cy="8" r="2"/></svg>
  )
}

// ========== ACCOUNT ROW ==========
function AccountRow({ acc, onEdit, onDelete }) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded hover:bg-[#f4f5f7] group transition-colors">
      <div className="w-6 h-6 rounded-full bg-[#ebecf0] flex items-center justify-center flex-shrink-0">
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="#6b778c" strokeWidth="2"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3 2.5-5 6-5s6 2 6 5"/></svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[12px] text-[#172b4d] font-medium">{acc.tai_khoan}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f4f5f7] text-[#6b778c] uppercase font-medium">{acc.role || 'admin'}</span>
        </div>
        {acc.ghi_chu && <p className="text-[10.5px] text-[#97a0af] mt-0.5 truncate">{acc.ghi_chu}</p>}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[11.5px] text-[#344563] min-w-[80px]">
          {show ? acc.mat_khau || '—' : maskPw(acc.mat_khau)}
        </span>
        {acc.mat_khau && (
          <button onClick={() => setShow(!show)} className="btn-icon p-1" title={show ? 'Ẩn' : 'Hiện'}>
            <EyeIcon open={show} />
          </button>
        )}
        {acc.mat_khau && (
          <button onClick={() => { navigator.clipboard.writeText(acc.mat_khau) }} className="btn-icon p-1" title="Copy mật khẩu">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="5" y="5" width="8" height="8" rx="1"/><path d="M3 11V3h8"/></svg>
          </button>
        )}
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(acc)} className="btn-icon p-1" title="Sửa">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 2.5L13.5 5L6 12.5H3.5V10L11 2.5z"/></svg>
        </button>
        <button onClick={() => onDelete(acc.id)} className="btn-icon p-1 text-[#97a0af] hover:text-[#ff5630] hover:bg-[#ffebe6]" title="Xoá">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 4.5h10M6 4.5V3h4v1.5M5 4.5v8h6v-8"/></svg>
        </button>
      </div>
    </div>
  )
}

// ========== QUY TRÌNH SECTION ==========
function QuyTrinhSection({ items, systemId, onUnlink, onView, onAdd }) {
  return (
    <div className="border-t border-[#ebecf0] px-4 py-2.5 bg-[#fafbfc]">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-semibold text-[#6b778c] uppercase tracking-wide">Quy trình liên quan</span>
        <button onClick={() => onAdd(systemId)} className="text-[11px] text-[#0052cc] hover:underline flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg>
          Gắn quy trình
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-[11px] text-[#97a0af] py-1">Chưa gắn quy trình nào</p>
      ) : (
        <div className="space-y-1">
          {items.map(qt => (
            <div key={qt.link_id} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-[#ebecf0] group transition-colors">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#6554c0" strokeWidth="1.6"><path d="M9 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6l-4-4z"/><path d="M9 2v4h4"/></svg>
              <span className="flex-1 text-[12px] text-[#172b4d] cursor-pointer hover:text-[#0052cc]" onClick={() => onView(qt)}>
                {qt.title}
              </span>
              <button onClick={() => onView(qt)} className="text-[10px] px-1.5 py-0.5 rounded bg-[#deebff] text-[#0052cc] hover:bg-[#b3d4ff] transition-colors">
                Xem
              </button>
              <button onClick={() => onUnlink(qt.link_id)} className="opacity-0 group-hover:opacity-100 btn-icon p-0.5 text-[#97a0af] hover:text-[#ff5630]" title="Gỡ liên kết">
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ========== SYSTEM CARD ==========
function SystemCard({ sys, onEditSystem, onDeleteSystem, onAddAccount, onEditAccount, onDeleteAccount, onAddChildSystem, onUnlinkQT, onViewQT, onAddQT }) {
  const [expanded, setExpanded] = useState(true)
  const info = getTypeInfo(sys.type)
  const totalAccounts = sys.accounts.length + sys.children.reduce((sum, c) => sum + c.accounts.length, 0)

  return (
    <div className="panel overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#fafbfc] transition-colors" onClick={() => setExpanded(!expanded)}>
        <span className="text-[18px]">{info.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-semibold text-[#172b4d]">{sys.name}</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide" style={{ background: info.color + '15', color: info.color }}>{info.label}</span>
            {sys.quy_trinh?.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#eae6ff] text-[#6554c0] font-medium">{sys.quy_trinh.length} quy trình</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            {sys.ip_address && <span className="text-[11px] font-mono text-[#6b778c]">{sys.ip_address}</span>}
            {sys.description && <span className="text-[11px] text-[#97a0af]">{sys.description}</span>}
            <span className="text-[11px] text-[#97a0af]">{totalAccounts} tài khoản</span>
          </div>
        </div>
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button onClick={() => onAddAccount(sys.id)} className="btn-icon p-1.5" title="Thêm tài khoản">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#0052cc" strokeWidth="2"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3 2.5-5 6-5s6 2 6 5"/><line x1="13" y1="8" x2="13" y2="12"/><line x1="11" y1="10" x2="15" y2="10"/></svg>
          </button>
          <button onClick={() => onAddChildSystem(sys.id)} className="btn-icon p-1.5" title="Thêm hệ thống con">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#6b778c" strokeWidth="1.8"><rect x="2" y="2" width="12" height="12" rx="2"/><line x1="8" y1="5" x2="8" y2="11"/><line x1="5" y1="8" x2="11" y2="8"/></svg>
          </button>
          <button onClick={() => onEditSystem(sys)} className="btn-icon p-1.5" title="Sửa">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 2.5L13.5 5L6 12.5H3.5V10L11 2.5z"/></svg>
          </button>
          <button onClick={() => onDeleteSystem(sys.id)} className="btn-icon p-1.5 text-[#97a0af] hover:text-[#ff5630] hover:bg-[#ffebe6]" title="Xoá hệ thống">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 4.5h10M6 4.5V3h4v1.5M5 4.5v8h6v-8"/></svg>
          </button>
        </div>
        <svg className={`w-4 h-4 text-[#97a0af] transition-transform ${expanded ? 'rotate-180' : ''}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6l4 4 4-4"/></svg>
      </div>

      {expanded && (
        <div className="border-t border-[#ebecf0]">
          {/* Accounts */}
          {sys.accounts.length > 0 && (
            <div className="px-2 py-1">
              {sys.accounts.map(acc => (
                <AccountRow key={acc.id} acc={acc} onEdit={onEditAccount} onDelete={onDeleteAccount} />
              ))}
            </div>
          )}
          {sys.accounts.length === 0 && sys.children.length === 0 && !sys.quy_trinh?.length && (
            <p className="text-[12px] text-[#97a0af] text-center py-4">Chưa có tài khoản</p>
          )}

          {/* Children systems */}
          {sys.children.map(child => {
            const childInfo = getTypeInfo(child.type)
            return (
              <div key={child.id} className="mx-4 mb-3 mt-2 border border-[#ebecf0] rounded-lg bg-[#fafbfc]">
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <span className="text-[14px]">{childInfo.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-[#172b4d]">{child.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-medium uppercase" style={{ background: childInfo.color + '15', color: childInfo.color }}>{childInfo.label}</span>
                      {child.quy_trinh?.length > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#eae6ff] text-[#6554c0] font-medium">{child.quy_trinh.length} quy trình</span>
                      )}
                    </div>
                    {child.description && <p className="text-[10.5px] text-[#97a0af] mt-0.5">{child.description}</p>}
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => onAddAccount(child.id)} className="btn-icon p-1" title="Thêm tài khoản">
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#0052cc" strokeWidth="2"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3 2.5-5 6-5s6 2 6 5"/><line x1="13" y1="8" x2="13" y2="12"/><line x1="11" y1="10" x2="15" y2="10"/></svg>
                    </button>
                    <button onClick={() => onEditSystem(child)} className="btn-icon p-1" title="Sửa">
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 2.5L13.5 5L6 12.5H3.5V10L11 2.5z"/></svg>
                    </button>
                    <button onClick={() => onDeleteSystem(child.id)} className="btn-icon p-1 text-[#97a0af] hover:text-[#ff5630] hover:bg-[#ffebe6]" title="Xoá">
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 4.5h10M6 4.5V3h4v1.5M5 4.5v8h6v-8"/></svg>
                    </button>
                  </div>
                </div>
                {child.accounts.length > 0 && (
                  <div className="border-t border-[#ebecf0] px-1 py-1">
                    {child.accounts.map(acc => (
                      <AccountRow key={acc.id} acc={acc} onEdit={onEditAccount} onDelete={onDeleteAccount} />
                    ))}
                  </div>
                )}
                {/* Quy trình con */}
                {(child.quy_trinh?.length > 0 || true) && (
                  <QuyTrinhSection items={child.quy_trinh || []} systemId={child.id} onUnlink={onUnlinkQT} onView={onViewQT} onAdd={onAddQT} />
                )}
              </div>
            )
          })}

          {/* Quy trình chính */}
          <QuyTrinhSection items={sys.quy_trinh || []} systemId={sys.id} onUnlink={onUnlinkQT} onView={onViewQT} onAdd={onAddQT} />
        </div>
      )}
    </div>
  )
}

// ========== MAIN PAGE ==========
const EMPTY_SYS = { name: '', type: 'server', parent_id: null, description: '', ip_address: '' }
const EMPTY_ACC = { system_id: null, tai_khoan: '', mat_khau: '', role: 'admin', ghi_chu: '' }

export default function TaiKhoanIT() {
  const [systems, setSystems] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  // Modals
  const [sysModal, setSysModal] = useState(null)
  const [sysForm, setSysForm] = useState(EMPTY_SYS)
  const [accModal, setAccModal] = useState(null)
  const [accForm, setAccForm] = useState(EMPTY_ACC)
  const [saving, setSaving] = useState(false)

  // Quy trình
  const [qtModal, setQtModal] = useState(null) // 'pick' | 'view'
  const [qtPickSystemId, setQtPickSystemId] = useState(null)
  const [allQuyTrinh, setAllQuyTrinh] = useState([])
  const [qtSearch, setQtSearch] = useState('')
  const [viewingQT, setViewingQT] = useState(null)
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/tai-khoan/systems')
      setSystems(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // Filter
  const filtered = systems.filter(sys => {
    if (!search) return true
    const s = search.toLowerCase()
    const matchSys = sys.name.toLowerCase().includes(s) || (sys.ip_address || '').toLowerCase().includes(s)
    const matchAcc = sys.accounts.some(a => a.tai_khoan.toLowerCase().includes(s))
    const matchChild = sys.children?.some(c =>
      c.name.toLowerCase().includes(s) || c.accounts.some(a => a.tai_khoan.toLowerCase().includes(s))
    )
    return matchSys || matchAcc || matchChild
  })

  const totalSystems = systems.length + systems.reduce((s, sys) => s + (sys.children?.length || 0), 0)
  const totalAccounts = systems.reduce((sum, sys) =>
    sum + sys.accounts.length + (sys.children || []).reduce((s, c) => s + c.accounts.length, 0), 0)

  // ===== SYSTEM CRUD =====
  function handleAddSystem() { setSysForm(EMPTY_SYS); setSysModal('add') }
  function handleAddChildSystem(parentId) { setSysForm({ ...EMPTY_SYS, parent_id: parentId, type: 'software' }); setSysModal('add') }
  function handleEditSystem(sys) {
    setSysForm({ id: sys.id, name: sys.name, type: sys.type, parent_id: sys.parent_id, description: sys.description || '', ip_address: sys.ip_address || '' })
    setSysModal('edit')
  }
  async function handleSaveSystem() {
    setSaving(true)
    try {
      if (sysModal === 'add') await api.post('/tai-khoan/systems', sysForm)
      else await api.put(`/tai-khoan/systems/${sysForm.id}`, sysForm)
      setSysModal(null); load()
    } catch (e) { alert(e.response?.data?.message || 'Lỗi lưu') }
    finally { setSaving(false) }
  }
  async function handleDeleteSystem(id) {
    if (!confirm('Xác nhận xoá hệ thống? Tất cả tài khoản và quy trình liên kết sẽ bị xoá theo.')) return
    try { await api.delete(`/tai-khoan/systems/${id}`); load() } catch (e) { alert('Lỗi xoá') }
  }

  // ===== ACCOUNT CRUD =====
  function handleAddAccount(systemId) { setAccForm({ ...EMPTY_ACC, system_id: systemId }); setAccModal('add') }
  function handleEditAccount(acc) {
    setAccForm({ id: acc.id, system_id: acc.system_id, tai_khoan: acc.tai_khoan, mat_khau: acc.mat_khau || '', role: acc.role || 'admin', ghi_chu: acc.ghi_chu || '' })
    setAccModal('edit')
  }
  async function handleSaveAccount() {
    setSaving(true)
    try {
      if (accModal === 'add') await api.post('/tai-khoan/accounts', accForm)
      else await api.put(`/tai-khoan/accounts/${accForm.id}`, accForm)
      setAccModal(null); load()
    } catch (e) { alert(e.response?.data?.message || 'Lỗi lưu') }
    finally { setSaving(false) }
  }
  async function handleDeleteAccount(id) {
    if (!confirm('Xác nhận xoá tài khoản?')) return
    try { await api.delete(`/tai-khoan/accounts/${id}`); load() } catch (e) { alert('Lỗi xoá') }
  }

  // ===== QUY TRÌNH =====
  async function handleAddQT(systemId) {
    setQtPickSystemId(systemId)
    setQtSearch('')
    setQtModal('pick')
    try {
      const res = await api.get('/tai-khoan/quy-trinh')
      setAllQuyTrinh(res.data)
    } catch (e) { console.error(e) }
  }

  async function handleLinkQT(quyTrinhId) {
    try {
      await api.post('/tai-khoan/link-quy-trinh', { system_id: qtPickSystemId, quy_trinh_id: quyTrinhId })
      setQtModal(null)
      load()
    } catch (e) { alert('Lỗi gắn quy trình') }
  }

  async function handleUnlinkQT(linkId) {
    if (!confirm('Gỡ liên kết quy trình này?')) return
    try { await api.delete(`/tai-khoan/link-quy-trinh/${linkId}`); load() }
    catch (e) { alert('Lỗi gỡ') }
  }

  async function handleViewQT(qt) {
    setViewingQT(qt)
    setPreviewHtml('')
    setQtModal('view')
    if (!qt.file_path) return
    setPreviewLoading(true)
    try {
      const res = await api.get(`/quy-trinh/preview/${qt.file_path}`, { responseType: 'text' })
      setPreviewHtml(res.data)
    } catch (e) {
      setPreviewHtml('<p style="color:#97a0af;text-align:center;padding:40px">Không thể hiển thị. Vui lòng tải về để xem.</p>')
    } finally { setPreviewLoading(false) }
  }

  async function handleDownloadQT() {
    if (!viewingQT?.file_path) return
    try {
      const res = await api.get(`/quy-trinh/download/${viewingQT.file_path}`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = viewingQT.file_name || viewingQT.title + '.docx'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) { alert('Lỗi tải file') }
  }

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[18px] font-bold text-[#172b4d]">Tài khoản IT</h1>
          <p className="text-[12px] text-[#6b778c] mt-0.5">{totalSystems} hệ thống • {totalAccounts} tài khoản</p>
        </div>
        <button onClick={handleAddSystem} className="btn-primary text-[11.5px] py-[5px]">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg>
          Thêm hệ thống
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#97a0af]" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6.5" cy="6.5" r="4.5"/><line x1="10.5" y1="10.5" x2="14" y2="14"/></svg>
          <input className="input-field pl-8 text-[12px] w-full" placeholder="Tìm hệ thống, tài khoản..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 border-2 border-[#0052cc] border-t-transparent rounded-full animate-spin" />
          <span className="text-[12px] text-[#6b778c] ml-2">Đang tải...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[14px] text-[#97a0af] mb-2">{search ? 'Không tìm thấy kết quả' : 'Chưa có hệ thống nào'}</p>
          {!search && <button onClick={handleAddSystem} className="btn-primary text-[12px]">Thêm hệ thống đầu tiên</button>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(sys => (
            <SystemCard key={sys.id} sys={sys}
              onEditSystem={handleEditSystem} onDeleteSystem={handleDeleteSystem}
              onAddAccount={handleAddAccount} onEditAccount={handleEditAccount} onDeleteAccount={handleDeleteAccount}
              onAddChildSystem={handleAddChildSystem}
              onUnlinkQT={handleUnlinkQT} onViewQT={handleViewQT} onAddQT={handleAddQT}
            />
          ))}
        </div>
      )}

      {/* ===== MODAL HỆ THỐNG ===== */}
      {sysModal && (
        <Modal title={sysModal === 'add' ? 'Thêm hệ thống' : 'Chỉnh sửa hệ thống'} onClose={() => setSysModal(null)}>
          <div className="space-y-3">
            <div>
              <label className="block text-[11.5px] font-semibold text-[#5e6c84] mb-1.5 uppercase tracking-wider">Tên hệ thống *</label>
              <input className="input-field" value={sysForm.name} onChange={e => setSysForm(f => ({ ...f, name: e.target.value }))} placeholder="Ví dụ: Empower Server" />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-[#5e6c84] mb-1.5 uppercase tracking-wider">Loại</label>
              <div className="flex gap-2">
                {SYSTEM_TYPES.map(t => (
                  <button key={t.value} onClick={() => setSysForm(f => ({ ...f, type: t.value }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-[12px] transition-colors ${
                      sysForm.type === t.value ? 'border-[#0052cc] bg-[#deebff] text-[#0052cc] font-medium' : 'border-[#dfe1e6] text-[#6b778c] hover:bg-[#f4f5f7]'
                    }`}><span>{t.icon}</span> {t.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-[#5e6c84] mb-1.5 uppercase tracking-wider">IP Address</label>
              <input className="input-field font-mono" value={sysForm.ip_address} onChange={e => setSysForm(f => ({ ...f, ip_address: e.target.value }))} placeholder="10.1.11.xx" />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-[#5e6c84] mb-1.5 uppercase tracking-wider">Mô tả</label>
              <input className="input-field" value={sysForm.description} onChange={e => setSysForm(f => ({ ...f, description: e.target.value }))} placeholder="Mô tả ngắn" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-[#dfe1e6]">
            <button onClick={() => setSysModal(null)} className="btn-secondary">Hủy</button>
            <button onClick={handleSaveSystem} disabled={saving || !sysForm.name} className="btn-primary disabled:opacity-60">{saving ? 'Đang lưu...' : 'Lưu'}</button>
          </div>
        </Modal>
      )}

      {/* ===== MODAL TÀI KHOẢN ===== */}
      {accModal && (
        <Modal title={accModal === 'add' ? 'Thêm tài khoản' : 'Chỉnh sửa tài khoản'} onClose={() => setAccModal(null)}>
          <div className="space-y-3">
            <div>
              <label className="block text-[11.5px] font-semibold text-[#5e6c84] mb-1.5 uppercase tracking-wider">Tài khoản *</label>
              <input className="input-field font-mono" value={accForm.tai_khoan} onChange={e => setAccForm(f => ({ ...f, tai_khoan: e.target.value }))} placeholder="admin" />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-[#5e6c84] mb-1.5 uppercase tracking-wider">Mật khẩu</label>
              <input className="input-field font-mono" value={accForm.mat_khau} onChange={e => setAccForm(f => ({ ...f, mat_khau: e.target.value }))} placeholder="••••••" />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-[#5e6c84] mb-1.5 uppercase tracking-wider">Vai trò</label>
              <div className="flex gap-2">
                {ROLES.map(r => (
                  <button key={r} onClick={() => setAccForm(f => ({ ...f, role: r }))}
                    className={`px-3 py-1.5 rounded border text-[12px] transition-colors capitalize ${
                      accForm.role === r ? 'border-[#0052cc] bg-[#deebff] text-[#0052cc] font-medium' : 'border-[#dfe1e6] text-[#6b778c] hover:bg-[#f4f5f7]'
                    }`}>{r}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-[#5e6c84] mb-1.5 uppercase tracking-wider">Ghi chú</label>
              <input className="input-field" value={accForm.ghi_chu} onChange={e => setAccForm(f => ({ ...f, ghi_chu: e.target.value }))} placeholder="Ghi chú thêm..." />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-[#dfe1e6]">
            <button onClick={() => setAccModal(null)} className="btn-secondary">Hủy</button>
            <button onClick={handleSaveAccount} disabled={saving || !accForm.tai_khoan} className="btn-primary disabled:opacity-60">{saving ? 'Đang lưu...' : 'Lưu'}</button>
          </div>
        </Modal>
      )}

      {/* ===== MODAL CHỌN QUY TRÌNH ===== */}
      {qtModal === 'pick' && (
        <Modal title="Gắn quy trình" onClose={() => setQtModal(null)}>
          <div className="relative mb-3">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#97a0af]" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6.5" cy="6.5" r="4.5"/><line x1="10.5" y1="10.5" x2="14" y2="14"/></svg>
            <input className="input-field pl-8 text-[12px] w-full" placeholder="Tìm quy trình..."
              value={qtSearch} onChange={e => setQtSearch(e.target.value)} autoFocus />
          </div>
          <div className="max-h-[400px] overflow-y-auto space-y-1">
            {allQuyTrinh
              .filter(qt => !qtSearch || qt.title.toLowerCase().includes(qtSearch.toLowerCase()))
              .map(qt => (
                <button key={qt.id} onClick={() => handleLinkQT(qt.id)}
                  className="w-full text-left px-3 py-2.5 rounded hover:bg-[#f4f5f7] transition-colors flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#6554c0" strokeWidth="1.6"><path d="M9 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6l-4-4z"/><path d="M9 2v4h4"/></svg>
                  <div>
                    <div className="text-[12.5px] text-[#172b4d] font-medium">{qt.title}</div>
                    {qt.description && <div className="text-[11px] text-[#97a0af] mt-0.5 line-clamp-1">{qt.description}</div>}
                  </div>
                </button>
              ))}
            {allQuyTrinh.filter(qt => !qtSearch || qt.title.toLowerCase().includes(qtSearch.toLowerCase())).length === 0 && (
              <p className="text-[12px] text-[#97a0af] text-center py-6">Không tìm thấy quy trình nào</p>
            )}
          </div>
        </Modal>
      )}

      {/* ===== MODAL XEM QUY TRÌNH ===== */}
      {qtModal === 'view' && viewingQT && (
        <Modal title={viewingQT.title} onClose={() => setQtModal(null)} size="xl">
          {viewingQT.description && <p className="text-[13px] text-[#344563] mb-4">{viewingQT.description}</p>}
          {viewingQT.file_path ? (
            <div>
              {previewLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-4 h-4 border-2 border-[#0052cc] border-t-transparent rounded-full animate-spin" />
                  <span className="text-[12px] text-[#6b778c] ml-2">Đang tải nội dung...</span>
                </div>
              ) : (
                <div className="border border-[#dfe1e6] rounded p-5 bg-white overflow-auto" style={{ maxHeight: '70vh' }}
                  dangerouslySetInnerHTML={{ __html: previewHtml }} />
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#dfe1e6]">
                <span className="text-[11px] text-[#97a0af]">📎 {viewingQT.file_name || viewingQT.title}</span>
                <button onClick={handleDownloadQT} className="btn-secondary text-[11.5px] py-[4px]">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v8M4 7l4 4 4-4"/><line x1="2" y1="13" x2="14" y2="13"/></svg>
                  Tải file gốc
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-[#97a0af] text-center py-6">Không có file đính kèm</p>
          )}
        </Modal>
      )}
    </div>
  )
}
