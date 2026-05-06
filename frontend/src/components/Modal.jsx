import { useEffect } from 'react'

export default function Modal({ title, children, onClose, size = 'md' }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-3xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#172b4d]/40 backdrop-blur-[2px]" onClick={onClose} />
      {/* Dialog */}
      <div className={`relative bg-white rounded-[4px] shadow-xl w-full ${widths[size]} border border-[#dfe1e6] flex flex-col max-h-[90vh]`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#dfe1e6] bg-[#fafbfc] rounded-t-[4px]">
          <h2 className="text-[14px] font-semibold text-[#172b4d]">{title}</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded text-[#6b778c] hover:bg-[#ebecf0] hover:text-[#172b4d] transition-colors">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg>
          </button>
        </div>
        {/* Body */}
        <div className="px-5 py-4 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
