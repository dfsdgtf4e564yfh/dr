import { useState, useEffect, useCallback } from 'react'
import { X, ChevronRight, ChevronLeft, Download } from 'lucide-react'

interface FileItem {
  id: number
  file: string
  description?: string
}

interface FilePreviewModalProps {
  files: FileItem[]
  initialIndex?: number
  onClose: () => void
}

export default function FilePreviewModal({ files, initialIndex = 0, onClose }: FilePreviewModalProps) {
  const [index, setIndex] = useState(initialIndex)
  const current = files[index]

  const isImage = current?.file && /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(current.file)
  const isPDF = current?.file && /\.pdf$/i.test(current.file)

  const prev = useCallback(() => setIndex(i => (i > 0 ? i - 1 : files.length - 1)), [files.length])
  const next = useCallback(() => setIndex(i => (i < files.length - 1 ? i + 1 : 0)), [files.length])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') prev()
      if (e.key === 'ArrowLeft') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, prev, next])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="relative w-full h-full flex flex-col max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-between mb-3 shrink-0" dir="rtl">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-white/80 hover:text-white p-1">
              <X size={24} />
            </button>
            <span className="text-white text-sm">
              {current?.description || 'فایل'} — {index + 1} از {files.length}
            </span>
          </div>
          <a href={current?.file} target="_blank" rel="noreferrer"
            className="text-white/80 hover:text-white p-1" title="دانلود">
            <Download size={20} />
          </a>
        </div>

        <div className="flex-1 flex items-center justify-center relative min-h-0">
          {files.length > 1 && (
            <button onClick={prev}
              className="absolute right-2 z-10 text-white/70 hover:text-white bg-black/30 hover:bg-black/50 rounded-full p-2 transition-all">
              <ChevronRight size={28} />
            </button>
          )}

          <div className="w-full h-full flex items-center justify-center">
            {isImage ? (
              <img src={current.file} alt={current.description || ''}
                className="max-w-full max-h-full object-contain rounded-lg"
                style={{ maxHeight: 'calc(100vh - 120px)' }} />
            ) : isPDF ? (
              <iframe src={current.file} title={current.description || 'PDF'}
                className="w-full h-full rounded-lg" style={{ minHeight: '70vh' }} />
            ) : (
              <div className="text-white text-center">
                <p className="text-lg mb-4">پیش‌نمایش برای این فایل در دسترس نیست</p>
                <a href={current?.file} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition">
                  <Download size={18} /> دانلود فایل
                </a>
              </div>
            )}
          </div>

          {files.length > 1 && (
            <button onClick={next}
              className="absolute left-2 z-10 text-white/70 hover:text-white bg-black/30 hover:bg-black/50 rounded-full p-2 transition-all">
              <ChevronLeft size={28} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
