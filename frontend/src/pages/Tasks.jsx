import { useEffect, useState, useCallback } from 'react'
import api from '../api'
import Modal from '../components/Modal'

const COLUMNS = [
  { key: 'todo',  label: 'Todo',  dot: '#888780', countBg: '#ebecf0', countColor: '#344563' },
  { key: 'doing', label: 'Doing', dot: '#EF9F27', countBg: '#FAEEDA', countColor: '#854F0B' },
  { key: 'done',  label: 'Done',  dot: '#1D9E75', countBg: '#E1F5EE', countColor: '#085041' },
]

const TYPES = [
  {
    value: 'daily',
    label: 'Daily',
    headerBg: 'linear-gradient(135deg, #E6F1FB, #F0F7FE)',
    accent: '#0052cc',
    accentLight: '#deebff',
    icon: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="3" width="12" height="11" rx="1.5"/><path d="M2 6h12M6 1.5v2.5M10 1.5v2.5"/><path d="M5 9h6M5 11h4" strokeLinecap="round"/></svg>,
    description: 'Công việc hằng ngày',
  },
  {
    value: 'qa',
    label: 'SOP',
    headerBg: 'linear-gradient(135deg, #FAECE7, #FDF4F0)',
    accent: '#D85A30',
    accentLight: '#FAECE7',
    icon: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M8 1l6 3v4c0 4-3 7-6 7s-6-3-6-7V4l6-3z"/><path d="M5.5 8l2 2 3.5-3.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    description: 'Đảm bảo chất lượng',
  },
]

const EMPTY_TASK = {
  title: '',
  description: '',
  task_type: 'daily',
  status: 'todo',
  task_date: new Date().toISOString().slice(0, 10),
  deadline: '',
}

function getTypeStyle(type) {
  return TYPES.find(t => t.value === type) || TYPES[0]
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

// Tính số ngày còn lại + style badge
function getDeadlineBadge(deadline) {
  if (!deadline) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(deadline)
  d.setHours(0, 0, 0, 0)
  const diffDays = Math.round((d - today) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { text: `Trễ ${Math.abs(diffDays)} ngày`, bg: '#FFEBE6', color: '#BF2600', border: '#FF8F73' }
  }
  if (diffDays === 0) {
    return { text: 'Hôm nay', bg: '#FFF4E6', color: '#974F0C', border: '#FFAB00' }
  }
  if (diffDays === 1) {
    return { text: 'Ngày mai', bg: '#FFF4E6', color: '#974F0C', border: '#FFAB00' }
  }
  if (diffDays <= 3) {
    return { text: `Còn ${diffDays} ngày`, bg: '#FFFAE6', color: '#7F5F01', border: '#FFC400' }
  }
  if (diffDays <= 7) {
    return { text: `Còn ${diffDays} ngày`, bg: '#E6F1FB', color: '#0C447C', border: '#4C9AFF' }
  }
  return { text: `Còn ${diffDays} ngày`, bg: '#E1F5EE', color: '#085041', border: '#57D9A3' }
}

function TaskCard({ task, onClick }) {
  const t = getTypeStyle(task.task_type)
  const isDone = task.status === 'done'
  const deadlineBadge = !isDone ? getDeadlineBadge(task.deadline) : null

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-card, #ffffff)',
        border: '1px solid var(--border, #dfe1e6)',
        borderLeft: `3px solid ${t.accent}`,
        borderRadius: 6,
        padding: '10px 12px',
        marginBottom: 8,
        cursor: 'pointer',
        opacity: isDone ? 0.7 : 1,
        transition: 'all 0.15s',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 3px 8px rgba(0,0,0,0.1)'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <p style={{
        fontSize: 13,
        fontWeight: 500,
        margin: '0 0 8px 0',
        color: 'var(--text-primary, #172b4d)',
        textDecoration: isDone ? 'line-through' : 'none',
        lineHeight: 1.4,
      }}>
        {task.title}
      </p>
      {task.description && (
        <p style={{
          fontSize: 11.5,
          color: 'var(--text-muted, #6b778c)',
          margin: '0 0 8px 0',
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {task.description}
        </p>
      )}

      {deadlineBadge && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: deadlineBadge.bg,
          color: deadlineBadge.color,
          border: `1px solid ${deadlineBadge.border}`,
          padding: '2px 8px',
          borderRadius: 10,
          fontSize: 10.5,
          fontWeight: 600,
          marginBottom: 8,
        }}>
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 1.5"/></svg>
          {deadlineBadge.text}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted, #6b778c)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {isDone ? (
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="#1D9E75" strokeWidth="2"><path d="M3 8l3 3 7-7"/></svg>
          ) : (
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="3" width="12" height="11" rx="1.5"/><path d="M2 6h12M6 1.5v2.5M10 1.5v2.5"/></svg>
          )}
          <span>{formatDate(task.task_date)}</span>
          {task.deadline && (
            <>
              <span style={{ margin: '0 2px' }}>→</span>
              <span style={{ fontWeight: 500 }}>{formatDate(task.deadline)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function KanbanBoard({ type, tasks, onEdit }) {
  const grouped = {
    todo:  tasks.filter(t => t.status === 'todo'),
    doing: tasks.filter(t => t.status === 'doing'),
    done:  tasks.filter(t => t.status === 'done'),
  }

  return (
    <div style={{
      background: 'var(--bg-card, #ffffff)',
      border: '1px solid var(--border, #dfe1e6)',
      borderRadius: 10,
      overflow: 'hidden',
      marginBottom: 20,
    }}>
      <div style={{
        background: type.headerBg,
        padding: '14px 18px',
        borderBottom: '1px solid var(--border, #dfe1e6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: type.accent,
          }}>
            {type.icon}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: type.accent }}>{type.label} Tasks</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted, #6b778c)' }}>{type.description}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11.5 }}>
          <span style={{ color: 'var(--text-muted, #6b778c)' }}>
            <strong style={{ color: type.accent, fontSize: 13 }}>{tasks.length}</strong> tổng
          </span>
          <span style={{ color: 'var(--text-muted, #6b778c)' }}>
            <strong style={{ color: '#EF9F27', fontSize: 13 }}>{grouped.doing.length}</strong> đang làm
          </span>
          <span style={{ color: 'var(--text-muted, #6b778c)' }}>
            <strong style={{ color: '#1D9E75', fontSize: 13 }}>{grouped.done.length}</strong> xong
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 0 }}>
        {COLUMNS.map((col, i) => (
          <div key={col.key} style={{
            padding: 12,
            borderRight: i < 2 ? '1px solid var(--border-light, #ebecf0)' : 'none',
            minHeight: 200,
            background: col.key === 'done' ? 'rgba(225, 245, 238, 0.15)' : 'transparent',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '0 2px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.dot }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary, #172b4d)' }}>{col.label}</span>
              <span style={{
                fontSize: 10.5,
                padding: '1px 7px',
                borderRadius: 10,
                fontWeight: 600,
                background: col.countBg,
                color: col.countColor,
              }}>{grouped[col.key].length}</span>
            </div>
            <div>
              {grouped[col.key].length === 0 ? (
                <div style={{
                  fontSize: 11,
                  textAlign: 'center',
                  padding: '20px 0',
                  color: 'var(--text-placeholder, #c1c7d0)',
                  border: '1px dashed var(--border-light, #ebecf0)',
                  borderRadius: 6,
                }}>—</div>
              ) : (
                grouped[col.key].map(task => (
                  <TaskCard key={task.id} task={task} onClick={() => onEdit(task)} />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY_TASK)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/tasks')
      setTasks(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function handleAdd() { setForm(EMPTY_TASK); setModal('add') }

  function handleEdit(task) {
    setForm({
      id: task.id,
      title: task.title,
      description: task.description || '',
      task_type: task.task_type,
      status: task.status,
      task_date: task.task_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      deadline: task.deadline?.slice(0, 10) || '',
    })
    setModal('edit')
  }

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const payload = { ...form, deadline: form.deadline || null }
      if (modal === 'add') await api.post('/tasks', payload)
      else await api.put(`/tasks/${form.id}`, payload)
      setModal(null); load()
    } catch (e) { alert(e.response?.data?.message || 'Lỗi lưu') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!form.id || !confirm('Xác nhận xoá task?')) return
    setSaving(true)
    try {
      await api.delete(`/tasks/${form.id}`)
      setModal(null); load()
    } catch (e) { alert('Lỗi xoá') }
    finally { setSaving(false) }
  }

  const dailyTasks = tasks.filter(t => t.task_type === 'daily')
  const qaTasks = tasks.filter(t => t.task_type === 'qa')
  const showDaily = filter === 'all' || filter === 'daily'
  const showQA = filter === 'all' || filter === 'qa'

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary, #172b4d)', margin: 0 }}>Tasks</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted, #6b778c)', margin: '4px 0 0 0' }}>
            <span style={{ color: '#0052cc', fontWeight: 600 }}>{dailyTasks.length}</span> Daily · <span style={{ color: '#D85A30', fontWeight: 600 }}>{qaTasks.length}</span> SOP
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            display: 'inline-flex',
            padding: 3,
            borderRadius: 6,
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border, #dfe1e6)',
          }}>
            {[
              { key: 'all', label: 'Tất cả', color: '#0052cc' },
              { key: 'daily', label: 'Daily', color: '#0052cc' },
              { key: 'qa', label: 'SOP', color: '#D85A30' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: '5px 14px',
                  borderRadius: 4,
                  fontSize: 11.5,
                  fontWeight: 600,
                  background: filter === f.key ? (f.color === '#D85A30' ? '#FAECE7' : 'rgba(56,142,255,0.12)') : 'transparent',
                  color: filter === f.key ? f.color : 'var(--text-muted, #6b778c)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >{f.label}</button>
            ))}
          </div>
          <button onClick={handleAdd} className="btn-primary text-[11.5px] py-[5px]">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg>
            Thêm task
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
          <div className="w-5 h-5 border-2 border-[#0052cc] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {showDaily && <KanbanBoard type={TYPES[0]} tasks={dailyTasks} onEdit={handleEdit} />}
          {showQA && <KanbanBoard type={TYPES[1]} tasks={qaTasks} onEdit={handleEdit} />}
          {tasks.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--text-muted, #6b778c)',
              fontSize: 13,
            }}>
              Chưa có task nào. Bấm "Thêm task" để bắt đầu.
            </div>
          )}
        </>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Thêm task mới' : 'Chỉnh sửa task'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div>
              <label className="block text-[11.5px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Tiêu đề *</label>
              <input
                className="input-field"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Nhập tiêu đề task..."
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[11.5px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Mô tả</label>
              <textarea
                className="input-field"
                rows={3}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Mô tả chi tiết (không bắt buộc)..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11.5px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Loại</label>
                <div className="flex gap-1.5">
                  {TYPES.map(t => (
                    <button key={t.value}
                      onClick={() => setForm(f => ({ ...f, task_type: t.value }))}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        border: '1.5px solid',
                        borderColor: form.task_type === t.value ? t.accent : 'var(--border, #dfe1e6)',
                        background: form.task_type === t.value ? t.accentLight : 'transparent',
                        color: form.task_type === t.value ? t.accent : 'var(--text-muted, #6b778c)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <span style={{ display: 'flex', width: 14, height: 14 }}>{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Trạng thái</label>
                <div className="flex gap-1.5">
                  {COLUMNS.map(c => (
                    <button key={c.key}
                      onClick={() => setForm(f => ({ ...f, status: c.key }))}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: 4,
                        fontSize: 11.5,
                        fontWeight: 500,
                        border: '1.5px solid',
                        borderColor: form.status === c.key ? c.dot : 'var(--border, #dfe1e6)',
                        background: form.status === c.key ? c.countBg : 'transparent',
                        color: form.status === c.key ? c.countColor : 'var(--text-muted, #6b778c)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot }} />
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11.5px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Ngày bắt đầu</label>
                <input
                  type="date"
                  className="input-field"
                  value={form.task_date}
                  onChange={e => setForm(f => ({ ...f, task_date: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Deadline</label>
                <input
                  type="date"
                  className="input-field"
                  value={form.deadline}
                  onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                  min={form.task_date}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center gap-2 mt-5 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <div>
              {modal === 'edit' && (
                <button onClick={handleDelete} disabled={saving} style={{
                  fontSize: 12,
                  padding: '6px 12px',
                  borderRadius: 4,
                  color: '#bf2600',
                  background: 'transparent',
                  border: '1px solid #ffebe6',
                  cursor: 'pointer',
                }}>
                  Xóa
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setModal(null)} className="btn-secondary">Hủy</button>
              <button onClick={handleSave} disabled={saving || !form.title.trim()} className="btn-primary disabled:opacity-60">
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
