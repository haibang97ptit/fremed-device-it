import { useEffect, useState, useCallback, useRef } from 'react'
import { getPhieuDeNghi, createPhieuDeNghi, updatePhieuDeNghi, deletePhieuDeNghi, getNextPR } from '../api'
import Modal from '../components/Modal'

const EMPTY_ITEM = { ten: '', dvt: '', nhu_cau: 1, can_mua: 1, muc_dich: '', ngay_can: '' }
const EMPTY_FORM = { nguoi_de_nghi: '', so_pr: '', items: [{ ...EMPTY_ITEM }] }

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('vi-VN')
}

// ====== PRINT CSS ======
function getPrintCSS() {
  return `
    @page { size: A4 landscape; margin: 10mm 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Times New Roman', serif; font-size: 14px; color: #000; line-height: 1.6; }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; }
    @media print { body { padding: 0; } }
  `
}

// ====== PRINT PREVIEW ======
function PrintPreview({ phieu, onClose }) {
  const printRef = useRef(null)
  const items = typeof phieu.items === 'string' ? JSON.parse(phieu.items) : phieu.items
  const now = phieu.created_at ? new Date(phieu.created_at) : new Date()
  const lan = String(phieu.lan_trong_thang || 1).padStart(2, '0')
  const thang = String(now.getMonth() + 1).padStart(2, '0')
  const nam = now.getFullYear()

  function handlePrint() {
    const content = printRef.current
    const printWindow = window.open('', '_blank', 'width=1100,height=750')
    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Phiếu đề nghị ${phieu.so_pr || ''}</title><style>${getPrintCSS()}</style></head><body>${content.innerHTML}</body></html>`)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 400)
  }

  const thS = {
    border: '1px solid #000', padding: '6px 7px', fontWeight: 'bold',
    textAlign: 'center', backgroundColor: '#f0f0f0', fontSize: '12px', lineHeight: 1.4
  }
  const tdS = {
    border: '1px solid #000', padding: '5px 7px', verticalAlign: 'top', lineHeight: 1.5, fontSize: '13px'
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#525659]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#323639] text-white shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium bg-white/10 hover:bg-white/20 transition-colors">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="10,3 5,8 10,13"/></svg>
            Quay lại
          </button>
          <span className="text-[13px] font-medium text-white/80">Xem trước: {phieu.so_pr || ''}</span>
        </div>
        <button onClick={handlePrint} className="flex items-center gap-1.5 px-4 py-1.5 rounded text-[12px] font-semibold bg-[#0052cc] hover:bg-[#0747a6] transition-colors">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="3" y="6" width="10" height="6" rx="1"/>
            <path d="M4 6V3a1 1 0 011-1h6a1 1 0 011 1v3"/>
            <path d="M5 12v2h6v-2"/>
            <circle cx="11" cy="8.5" r="0.5" fill="currentColor"/>
          </svg>
          In phiếu
        </button>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto py-6 flex justify-center">
        <div className="bg-white shadow-2xl" style={{ width: '297mm', minHeight: '210mm', padding: '12mm 15mm' }}>
          <div ref={printRef}>
            <div style={{ fontFamily: "'Times New Roman', serif", fontSize: '14px', color: '#000', lineHeight: 1.6 }}>
              {/* Top right */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4px' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '60%' }}></td>
                    <td style={{ textAlign: 'right', fontSize: '12px', fontStyle: 'italic', color: '#444' }}>
                      Mẫu : 01KTTC/PR
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Title */}
              <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '2px' }}>
                  ĐỀ NGHỊ MUA HÀNG VÀ DỊCH VỤ
                </div>
                <div style={{ fontSize: '14px', fontStyle: 'italic', color: '#555' }}>
                  PURCHASE REQUEST
                </div>
              </div>

              {/* LẦN / THÁNG / NĂM */}
              <div style={{ textAlign: 'center', fontSize: '14px', marginBottom: '2px' }}>
                LẦN &nbsp; <b>{lan}</b> &nbsp; THÁNG &nbsp; <b>{thang}</b> &nbsp; NĂM &nbsp; <b>{nam}</b>
              </div>
              <div style={{ textAlign: 'center', fontSize: '14px', marginBottom: '8px' }}>
                Số: <b>{phieu.so_pr || ''}</b>
              </div>

              {/* Người đề nghị / Phòng ban */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px', fontSize: '14px' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '2px 0' }}>Người đề nghị: <b>{phieu.nguoi_de_nghi || ''}</b></td>
                    <td style={{ padding: '2px 0', textAlign: 'right' }}>Phòng ban: <b>IT</b></td>
                  </tr>
                </tbody>
              </table>

              <div style={{ fontSize: '13px', marginBottom: '3px' }}>
                Căn cứ: Kế hoạch/Nhu cầu sử dụng NVL, máy móc, vật tư, hàng hóa, dịch vụ,….số: .......................
              </div>
              <div style={{ fontSize: '13px', marginBottom: '10px' }}>
                Đề nghị cấp phát, hoặc mua để phục vụ cho công việc của bộ phận như sau:
              </div>

              {/* Main table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', fontSize: '10px' }}>
                <thead>
                  <tr>
                    <th style={thS} rowSpan={2}>STT</th>
                    <th style={{ ...thS, minWidth: '140px' }} rowSpan={2}>TÊN SẢN PHẨM</th>
                    <th style={{ ...thS, minWidth: '90px' }} rowSpan={2}>QUY CÁCH / THÔNG SỐ KỸ THUẬT</th>
                    <th style={thS} rowSpan={2}>ĐVT</th>
                    <th style={thS} colSpan={5}>SỐ LƯỢNG</th>
                    <th style={thS} colSpan={4}>NGÂN SÁCH THEO ĐỊNH KỲ/THÁNG</th>
                    <th style={{ ...thS, minWidth: '130px' }} rowSpan={2}>MỤC ĐÍCH SỬ DỤNG</th>
                    <th style={thS} rowSpan={2}>NGÀY CẦN<br/>SỬ DỤNG</th>
                  </tr>
                  <tr>
                    <th style={thS}>ĐỊNH MỨC<br/>SỬ DỤNG</th>
                    <th style={thS}>TỒN KHO<br/>(Nếu có)</th>
                    <th style={thS}>NHU CẦU<br/>THỰC TẾ</th>
                    <th style={thS}>CÒN TỒN</th>
                    <th style={thS}>CẦN MUA<br/>THÊM</th>
                    <th style={thS}>MÃ/KHOẢN MỤC<br/>CHI PHÍ</th>
                    <th style={thS}>ĐÃ DUYỆT</th>
                    <th style={thS}>CHƯA DUYỆT</th>
                    <th style={thS}>GIÁ TRỊ</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const nhuCau = parseInt(item.nhu_cau) || parseInt(item.so_luong) || 0
                    const canMua = parseInt(item.can_mua) || parseInt(item.so_luong) || 0
                    return (
                      <tr key={idx}>
                        <td style={{ ...tdS, textAlign: 'center', width: '28px' }}>{idx + 1}</td>
                        <td style={tdS}>{item.ten || ''}</td>
                        <td style={tdS}></td>
                        <td style={{ ...tdS, textAlign: 'center', width: '35px' }}>{item.dvt || ''}</td>
                        <td style={{ ...tdS, textAlign: 'center', width: '40px' }}></td>
                        <td style={{ ...tdS, textAlign: 'center', width: '40px' }}></td>
                        <td style={{ ...tdS, textAlign: 'center', width: '40px' }}>{nhuCau}</td>
                        <td style={{ ...tdS, textAlign: 'center', width: '40px' }}></td>
                        <td style={{ ...tdS, textAlign: 'center', width: '40px' }}>{canMua}</td>
                        <td style={{ ...tdS, textAlign: 'center', width: '40px' }}></td>
                        <td style={{ ...tdS, textAlign: 'center', width: '40px' }}></td>
                        <td style={{ ...tdS, textAlign: 'center', width: '40px' }}></td>
                        <td style={{ ...tdS, textAlign: 'center', width: '40px' }}></td>
                        <td style={{ ...tdS, fontSize: '12px' }}>{item.muc_dich || ''}</td>
                        <td style={{ ...tdS, textAlign: 'center', width: '75px', fontSize: '12px' }}>
                          {(item.ngay_can) ? formatDate(item.ngay_can) : ''}
                        </td>
                      </tr>
                    )
                  })}
                  <tr>
                    <td colSpan={4} style={{ ...tdS, textAlign: 'center', fontWeight: 'bold' }}>Tổng cộng</td>
                    <td style={tdS}></td><td style={tdS}></td><td style={tdS}></td><td style={tdS}></td><td style={tdS}></td>
                    <td style={tdS}></td><td style={tdS}></td><td style={tdS}></td><td style={tdS}></td>
                    <td style={tdS} colSpan={2}></td>
                  </tr>
                </tbody>
              </table>

              {/* Signatures */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '30px', fontSize: '13px' }}>
                <tbody>
                  <tr>
                    <td style={{ textAlign: 'center', width: '33%', verticalAlign: 'top', padding: '0 10px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '1px' }}>TRƯỞNG PHÒNG ĐỀ NGHỊ</div>
                      <div style={{ fontStyle: 'italic', fontSize: '11px', color: '#666', marginBottom: '3px' }}>PROPOSED BY</div>
                      <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#999' }}>Ký/Sign:</div>
                      <div style={{ height: '50px' }}></div>
                      <div>Tên/Name: <b>Văn Tấn Bửu</b></div>
                    </td>
                    <td style={{ textAlign: 'center', width: '33%', verticalAlign: 'top', padding: '0 10px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '1px' }}>SOÁT XÉT</div>
                      <div style={{ fontStyle: 'italic', fontSize: '11px', color: '#666', marginBottom: '3px' }}>REVIEWED BY</div>
                      <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#999' }}>Ký/Sign:</div>
                      <div style={{ height: '50px' }}></div>
                      <div>Tên/Name: <b>Hoàng Thị Hà</b></div>
                    </td>
                    <td style={{ textAlign: 'center', width: '33%', verticalAlign: 'top', padding: '0 10px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '1px' }}>PHÊ DUYỆT</div>
                      <div style={{ fontStyle: 'italic', fontSize: '11px', color: '#666', marginBottom: '3px' }}>APPROVED BY</div>
                      <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#999' }}>Ký/Sign:</div>
                      <div style={{ height: '50px' }}></div>
                      <div>Tên/Name: ...................</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ====== MAIN COMPONENT ======
export default function PhieuDeNghi() {
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [previewPhieu, setPreviewPhieu] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { setRows((await getPhieuDeNghi({ search })).data) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [search])

  useEffect(() => { load() }, [load])

  function addItem() { setForm(f => ({ ...f, items: [...f.items, { ...EMPTY_ITEM }] })) }
  function removeItem(idx) { setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) })) }
  function updateItem(idx, key, val) {
    setForm(f => ({
      ...f,
      items: f.items.map((item, i) => i === idx ? { ...item, [key]: val } : item)
    }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        ...form,
        phong_ban: 'IT',
        truong_phong: 'Văn Tấn Bửu',
        soat_xet: 'Hoàng Thị Hà'
      }
      if (modal === 'add') await createPhieuDeNghi(payload)
      else await updatePhieuDeNghi(selected.id, payload)
      setModal(null); load()
    } catch (e) { alert(e.response?.data?.message || 'Lỗi lưu') }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('Xác nhận xoá phiếu này?')) return
    await deletePhieuDeNghi(id); load()
  }

  function openAdd() {
    setForm({ ...EMPTY_FORM, items: [{ ...EMPTY_ITEM }] })
    setModal('add')
    getNextPR().then(res => {
      setForm(f => ({ ...f, so_pr: res.data.next_pr }))
    }).catch(() => {})
  }
  function openEdit(row) {
    const items = typeof row.items === 'string' ? JSON.parse(row.items) : row.items
    setSelected(row)
    setForm({
      nguoi_de_nghi: row.nguoi_de_nghi || '',
      so_pr: row.so_pr || '',
      items: items.length ? items.map(it => ({
        ten: it.ten || '', dvt: it.dvt || '',
        nhu_cau: it.nhu_cau ?? it.so_luong ?? 1,
        can_mua: it.can_mua ?? it.so_luong ?? 1,
        muc_dich: it.muc_dich || '',
        ngay_can: it.ngay_can || ''
      })) : [{ ...EMPTY_ITEM }]
    })
    setModal('edit')
  }

  // Full-screen preview
  if (previewPhieu) {
    return <PrintPreview phieu={previewPhieu} onClose={() => setPreviewPhieu(null)} />
  }

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[18px] font-bold text-[#172b4d]">Phiếu đề nghị</h1>
          <p className="text-[12px] text-[#6b778c] mt-0.5">{rows.length} phiếu</p>
        </div>
        <button onClick={openAdd} className="btn-primary text-[11.5px] py-[5px]">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg>
          Tạo phiếu mới
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#97a0af]" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6.5" cy="6.5" r="4.5"/><line x1="10.5" y1="10.5" x2="14" y2="14"/></svg>
          <input className="input-field pl-7 py-[6px] text-[12.5px]" placeholder="Tìm theo người đề nghị hoặc số PR..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#ebecf0] bg-[#fafbfc]">
          <span className="text-[12px] font-semibold text-[#172b4d]">PURCHASE REQUESTS ({rows.length})</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th className="th w-8">#</th>
              <th className="th">Số PR</th>
              <th className="th">Người đề nghị</th>
              <th className="th">Phòng ban</th>
              <th className="th">Số mục</th>
              <th className="th">Lần</th>
              <th className="th">Ngày tạo</th>
              <th className="th w-32"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-12 text-[12px] text-[#97a0af]">
                <div className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-[#0052cc] border-t-transparent rounded-full animate-spin"/>Đang tải...</div>
              </td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-[13px] text-[#97a0af]">Không có phiếu nào</td></tr>
            ) : rows.map((row, i) => {
              const items = typeof row.items === 'string' ? JSON.parse(row.items) : row.items
              return (
                <tr key={row.id} className="tr-hover group">
                  <td className="td text-[#97a0af] text-[11px]">{i+1}</td>
                  <td className="td">
                    <span className="font-mono text-[12px] font-semibold text-[#0052cc]">{row.so_pr || '—'}</span>
                  </td>
                  <td className="td font-medium text-[12.5px]">{row.nguoi_de_nghi || '—'}</td>
                  <td className="td text-[12px]">{row.phong_ban || 'IT'}</td>
                  <td className="td text-[12px] text-center">{items.length}</td>
                  <td className="td text-[12px] text-center">
                    <span className="badge badge-blue">Lần {String(row.lan_trong_thang || '').padStart(2, '0')}</span>
                  </td>
                  <td className="td text-[11.5px] text-[#6b778c]">{new Date(row.created_at).toLocaleDateString('vi-VN')}</td>
                  <td className="td">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setPreviewPhieu(row)} className="btn-icon text-[#0052cc]" title="Xem trước & In">
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <rect x="2" y="2" width="12" height="12" rx="1.5"/>
                          <path d="M5 5h6M5 8h6M5 11h3"/>
                        </svg>
                      </button>
                      <button onClick={() => openEdit(row)} className="btn-icon" title="Sửa">
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 2.5L13.5 5L6 12.5H3.5V10L11 2.5z"/></svg>
                      </button>
                      <button onClick={() => handleDelete(row.id)} className="btn-icon text-[#97a0af] hover:text-[#ff5630] hover:bg-[#ffebe6]" title="Xoá">
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 4.5h10M6 4.5V3h4v1.5M5 4.5v8h6v-8"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Tạo phiếu đề nghị mới' : 'Chỉnh sửa phiếu'} onClose={() => setModal(null)} size="xl">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-[11.5px] font-semibold text-[#5e6c84] mb-1.5 uppercase tracking-wider">Người đề nghị</label>
              <input className="input-field" value={form.nguoi_de_nghi} onChange={e => setForm(f => ({ ...f, nguoi_de_nghi: e.target.value }))} />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-[#5e6c84] mb-1.5 uppercase tracking-wider">Số PR</label>
              <input className="input-field" placeholder="VD: IT/PR/26016" value={form.so_pr} onChange={e => setForm(f => ({ ...f, so_pr: e.target.value }))} />
            </div>
          </div>

          {/* Items table */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11.5px] font-semibold text-[#5e6c84] uppercase tracking-wider">Danh sách vật tư / thiết bị cần mua</label>
              <button onClick={addItem} className="text-[11.5px] text-[#0052cc] hover:underline font-medium flex items-center gap-1">
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg>
                Thêm mục
              </button>
            </div>
            <div className="border border-[#dfe1e6] rounded overflow-x-auto">
              <table className="w-full" style={{ minWidth: '700px' }}>
                <thead>
                  <tr className="bg-[#f4f5f7]">
                    <th className="th w-8">STT</th>
                    <th className="th" style={{ minWidth: '160px' }}>Tên sản phẩm</th>
                    <th className="th w-16">ĐVT</th>
                    <th className="th w-16">Nhu cầu</th>
                    <th className="th w-16">Cần mua</th>
                    <th className="th" style={{ minWidth: '160px' }}>Mục đích sử dụng</th>
                    <th className="th w-32">Ngày cần sử dụng</th>
                    <th className="th w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-[#ebecf0]">
                      <td className="td text-center text-[11px] text-[#97a0af]">{idx+1}</td>
                      <td className="td p-1">
                        <input className="input-field py-1 text-[12px]" placeholder="Tên sản phẩm..."
                          value={item.ten} onChange={e => updateItem(idx, 'ten', e.target.value)} />
                      </td>
                      <td className="td p-1">
                        <input className="input-field py-1 text-[12px] text-center" placeholder="Cái"
                          value={item.dvt || ''} onChange={e => updateItem(idx, 'dvt', e.target.value)} />
                      </td>
                      <td className="td p-1">
                        <input type="number" className="input-field py-1 text-[12px] text-center" min="1"
                          value={item.nhu_cau} onChange={e => updateItem(idx, 'nhu_cau', e.target.value)} />
                      </td>
                      <td className="td p-1">
                        <input type="number" className="input-field py-1 text-[12px] text-center" min="1"
                          value={item.can_mua} onChange={e => updateItem(idx, 'can_mua', e.target.value)} />
                      </td>
                      <td className="td p-1">
                        <input className="input-field py-1 text-[12px]" placeholder="Mục đích sử dụng..."
                          value={item.muc_dich || ''} onChange={e => updateItem(idx, 'muc_dich', e.target.value)} />
                      </td>
                      <td className="td p-1">
                        <input type="date" className="input-field py-1 text-[12px]"
                          value={item.ngay_can || ''} onChange={e => updateItem(idx, 'ngay_can', e.target.value)} />
                      </td>
                      <td className="td p-1">
                        {form.items.length > 1 && (
                          <button onClick={() => removeItem(idx)} className="btn-icon text-[#97a0af] hover:text-[#ff5630]">
                            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#dfe1e6]">
            <button onClick={() => setModal(null)} className="btn-secondary">Hủy</button>
            <button onClick={handleSave} disabled={saving || !form.nguoi_de_nghi || !form.so_pr || !form.items[0]?.ten}
              className="btn-primary disabled:opacity-60">
              {saving ? 'Đang lưu...' : modal === 'add' ? 'Tạo phiếu' : 'Lưu thay đổi'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
