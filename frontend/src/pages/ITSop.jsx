import { useEffect, useState, useCallback } from 'react'
import { getITSop } from '../api'
import Modal from '../components/Modal'

// URL gốc của Qualzen web server
const QUALZEN_BASE = 'http://10.1.11.35/fs'

function StatusBadge({ status }) {
  if (status === 'A') return <span className="badge badge-green">Active</span>
  if (status === '4CTR') return <span className="badge badge-blue">Controlled</span>
  return <span className="badge badge-gray">{status || '—'}</span>
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function ITSop() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getITSop()
      setRows(res.data)
    } catch (e) {
      console.error(e)
      setError(e.response?.data?.message || 'Không thể kết nối tới Qualzen SQL Server')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function getPdfUrl(row) {
    if (!row.PDFPath) return null
    return `${QUALZEN_BASE}/${row.PDFPath}`
  }

  function getViewerUrl(row) {
    const pdfUrl = getPdfUrl(row)
    if (!pdfUrl) return null
    return `${QUALZEN_BASE}/Scripts/pdf.js/web/viewer.html?d=2&file=${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`
  }

  const filtered = rows.filter(row => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      (row.DocumentNumber || '').toLowerCase().includes(s) ||
      (row.Title || '').toLowerCase().includes(s) ||
      (row.DocumentNumber_Old || '').toLowerCase().includes(s)
    )
  })

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[18px] font-bold text-[#172b4d]">IT SOP</h1>
          <p className="text-[12px] text-[#6b778c] mt-0.5">Standard Operating Procedures — Phòng IT • Dữ liệu từ Qualzen DMS</p>
        </div>
        <button onClick={load} className="btn-secondary text-[11.5px] py-[5px]">
          <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 8A6 6 0 1 1 8 2" strokeLinecap="round"/>
            <path d="M14 2v4h-4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Làm mới
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-[12px] text-red-700 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="8" cy="8" r="6"/><line x1="8" y1="5" x2="8" y2="8.5"/><circle cx="8" cy="11" r="0.5" fill="currentColor"/></svg>
          {error}
        </div>
      )}

      {/* Search + count */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#97a0af]" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6.5" cy="6.5" r="4.5"/><line x1="10.5" y1="10.5" x2="14" y2="14"/></svg>
          <input
            placeholder="Tìm theo mã, tên SOP..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-8 text-[12px] w-full"
          />
        </div>
        <span className="text-[12px] text-[#6b778c]">{filtered.length} tài liệu</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 border-2 border-[#0052cc] border-t-transparent rounded-full animate-spin" />
          <span className="text-[12px] text-[#6b778c] ml-2">Đang tải dữ liệu...</span>
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-[#f4f5f7] border-b border-[#dfe1e6]">
                  <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-[#6b778c] uppercase tracking-wide w-8">#</th>
                  <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-[#6b778c] uppercase tracking-wide">Mã tài liệu</th>
                  <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-[#6b778c] uppercase tracking-wide">Tên SOP</th>
                  <th className="text-center py-2.5 px-3 text-[11px] font-semibold text-[#6b778c] uppercase tracking-wide">Phiên bản</th>
                  <th className="text-center py-2.5 px-3 text-[11px] font-semibold text-[#6b778c] uppercase tracking-wide">Trạng thái</th>
                  <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-[#6b778c] uppercase tracking-wide">Ngày hiệu lực</th>
                  <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-[#6b778c] uppercase tracking-wide">Cập nhật</th>
                  <th className="text-center py-2.5 px-3 text-[11px] font-semibold text-[#6b778c] uppercase tracking-wide">PDF</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-10 text-[#97a0af]">Không tìm thấy tài liệu nào</td></tr>
                ) : filtered.map((row, i) => (
                  <tr key={row.VersionID || row.DocumentID + '-' + i} className="border-b border-[#f4f5f7] hover:bg-[#fafbfc] transition-colors">
                    <td className="py-2.5 px-3 text-[#97a0af]">{i + 1}</td>
                    <td className="py-2.5 px-3">
                      <div className="text-[#172b4d] font-medium">{row.DocumentNumber}</div>
                      {row.DocumentNumber_Old && (
                        <div className="text-[10px] text-[#97a0af] mt-0.5">{row.DocumentNumber_Old}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[#344563] max-w-[320px]">
                      {row.Title || <span className="text-[#97a0af] italic">Chưa có tiêu đề</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded bg-[#f4f5f7] text-[#344563] text-[11px] font-mono font-medium">
                        v{row.VersionNumber || 1}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <StatusBadge status={row.Status || row.DocumentStatus} />
                    </td>
                    <td className="py-2.5 px-3 text-[#6b778c]">{formatDate(row.EffectiveDate)}</td>
                    <td className="py-2.5 px-3 text-[#6b778c]">{formatDate(row.LastmodifiedDate)}</td>
                    <td className="py-2.5 px-3 text-center">
                      {row.PDFPath ? (
                        <button
                          onClick={() => setSelected(row)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-[#0052cc] bg-[#deebff] hover:bg-[#b3d4ff] transition-colors"
                          title="Xem PDF"
                        >
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M4 2h6l4 4v8a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/>
                            <path d="M10 2v4h4"/>
                          </svg>
                          Xem
                        </button>
                      ) : (
                        <span className="text-[#97a0af]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== MODAL XEM PDF ===== */}
      {selected && (
        <Modal title={selected.Title || selected.DocumentNumber} onClose={() => setSelected(null)} size="xl">
          {/* Info bar */}
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-[#dfe1e6]">
            <span className="text-[11px] text-[#6b778c]">{selected.DocumentNumber}</span>
            {selected.DocumentNumber_Old && (
              <span className="text-[11px] text-[#97a0af]">• {selected.DocumentNumber_Old}</span>
            )}
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#f4f5f7] font-mono">v{selected.VersionNumber || 1}</span>
            <StatusBadge status={selected.Status || selected.DocumentStatus} />
          </div>

          {/* PDF Viewer — iframe tới Qualzen server */}
          {selected.PDFPath ? (
            <div>
              <iframe
                src={getViewerUrl(selected)}
                className="w-full border border-[#dfe1e6] rounded"
                style={{ height: '70vh' }}
                title="PDF Preview"
              />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#dfe1e6]">
                <span className="text-[11px] text-[#97a0af]">📎 {selected.FileName}</span>
                <a
                  href={getPdfUrl(selected)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-[11.5px] py-[4px] inline-flex items-center gap-1"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v8M4 7l4 4 4-4"/><line x1="2" y1="13" x2="14" y2="13"/></svg>
                  Tải file gốc
                </a>
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-[#97a0af] text-center py-6">Không có file PDF</p>
          )}
        </Modal>
      )}
    </div>
  )
}
