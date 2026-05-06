import { useEffect, useState, useCallback } from 'react'
import { getQuyTrinh, createQuyTrinh, updateQuyTrinh, deleteQuyTrinh } from '../api'
import api from '../api'
import Modal from '../components/Modal'

export default function QuyTrinhIT() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ title: '', description: '' })
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { setRows((await getQuyTrinh()).data) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSave() {
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('description', form.description)
      if (file) fd.append('file', file)
      if (modal === 'add') await createQuyTrinh(fd)
      else await updateQuyTrinh(selected.id, fd)
      setModal(null); setFile(null); load()
    } catch (e) { alert(e.response?.data?.message || 'Lỗi lưu') }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('Xác nhận xoá quy trình này?')) return
    await deleteQuyTrinh(id); load()
  }

  async function openView(row) {
    setSelected(row)
    setPreviewHtml('')
    setModal('view')

    if (!row.file_path) return

    setPreviewLoading(true)
    try {
      // Fetch preview qua axios (tự gửi token)
      const res = await api.get(`/quy-trinh/preview/${row.file_path}`, { responseType: 'text' })
      setPreviewHtml(res.data)
    } catch (e) {
      console.error(e)
      setPreviewHtml('<p style="color:#97a0af;text-align:center;padding:40px">Không thể hiển thị file. Vui lòng tải về để xem.</p>')
    } finally {
      setPreviewLoading(false)
    }
  }

  function openEdit(row) { setSelected(row); setForm({ title: row.title, description: row.description || '' }); setFile(null); setModal('edit') }
  function openAdd() { setForm({ title: '', description: '' }); setFile(null); setModal('add') }

  function handleDownload(filePath) {
    api.get(`/quy-trinh/download/${filePath}`, { responseType: 'blob' })
      .then(res => {
        const url = window.URL.createObjectURL(new Blob([res.data]))
        const a = document.createElement('a')
        a.href = url
        a.download = selected?.file_name || filePath
        a.click()
        window.URL.revokeObjectURL(url)
      })
      .catch(e => alert('Lỗi tải file'))
  }

  const fileIcon = (type) => {
    if (!type) return '📄'
    if (type.includes('pdf')) return '📕'
    if (type.includes('word') || type.includes('document')) return '📘'
    if (type.includes('image')) return '🖼️'
    if (type.includes('sheet') || type.includes('excel')) return '📗'
    return '📄'
  }

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[18px] font-bold text-[#172b4d]">Quy trình IT</h1>
          <p className="text-[12px] text-[#6b778c] mt-0.5">{rows.length} quy trình đã đăng</p>
        </div>
        <button onClick={openAdd} className="btn-primary text-[11.5px] py-[5px]">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg>
          Thêm quy trình
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-[#0052cc] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="panel p-10 text-center text-[#97a0af]">
          <p className="text-[14px]">Chưa có quy trình nào</p>
          <p className="text-[12px] mt-1">Nhấn "Thêm quy trình" để upload file</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {rows.map(row => (
            <div key={row.id} className="panel p-4 hover:shadow-md transition-shadow cursor-pointer group"
                 onClick={() => openView(row)}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded bg-[#deebff] flex items-center justify-center text-lg flex-shrink-0">
                    {fileIcon(row.file_type)}
                  </div>
                  <div>
                    <h3 className="text-[13px] font-semibold text-[#172b4d] line-clamp-2">{row.title}</h3>
                    {row.description && <p className="text-[11.5px] text-[#6b778c] mt-1 line-clamp-2">{row.description}</p>}
                    <p className="text-[10.5px] text-[#97a0af] mt-1.5">
                      {new Date(row.created_at).toLocaleDateString('vi-VN')}
                      {row.file_name && <span className="ml-2">• {row.file_name}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEdit(row)} className="btn-icon" title="Sửa">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 2.5L13.5 5L6 12.5H3.5V10L11 2.5z"/></svg>
                  </button>
                  <button onClick={() => handleDelete(row.id)} className="btn-icon text-[#97a0af] hover:text-[#ff5630] hover:bg-[#ffebe6]" title="Xoá">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 4.5h10M6 4.5V3h4v1.5M5 4.5v8h6v-8"/></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View modal — render HTML trực tiếp (không dùng iframe) */}
      {modal === 'view' && selected && (
        <Modal title={selected.title} onClose={() => setModal(null)} size="xl">
          {selected.description && <p className="text-[13px] text-[#344563] mb-4">{selected.description}</p>}
          {selected.file_path ? (
            <div>
              {previewLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="flex items-center gap-2 text-[#6b778c]">
                    <div className="w-4 h-4 border-2 border-[#0052cc] border-t-transparent rounded-full animate-spin" />
                    <span className="text-[12px]">Đang tải nội dung...</span>
                  </div>
                </div>
              ) : (
                <div
                  className="border border-[#dfe1e6] rounded p-5 bg-white overflow-auto"
                  style={{ maxHeight: '70vh' }}
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#dfe1e6]">
                <span className="text-[11px] text-[#97a0af]">📎 {selected.file_name}</span>
                <button onClick={() => handleDownload(selected.file_path)}
                   className="btn-secondary text-[11.5px] py-[4px]">
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

      {/* Add/Edit modal */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Thêm quy trình mới' : 'Chỉnh sửa quy trình'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div>
              <label className="block text-[11.5px] font-semibold text-[#5e6c84] mb-1.5 uppercase tracking-wider">Tiêu đề</label>
              <input className="input-field" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="VD: Quy trình cấp phát laptop" />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-[#5e6c84] mb-1.5 uppercase tracking-wider">Mô tả</label>
              <textarea className="input-field h-20 resize-none" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Mô tả ngắn về quy trình..." />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-[#5e6c84] mb-1.5 uppercase tracking-wider">File đính kèm</label>
              <input type="file" onChange={e => setFile(e.target.files[0])}
                className="block w-full text-[12px] text-[#6b778c] file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-[12px] file:font-semibold file:bg-[#deebff] file:text-[#0052cc] hover:file:bg-[#b3d4ff]" />
              {modal === 'edit' && selected?.file_name && !file && (
                <p className="text-[11px] text-[#97a0af] mt-1">File hiện tại: {selected.file_name}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-[#dfe1e6]">
            <button onClick={() => setModal(null)} className="btn-secondary">Hủy</button>
            <button onClick={handleSave} disabled={saving || !form.title} className="btn-primary disabled:opacity-60">
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
