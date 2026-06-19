import { useState, useEffect } from 'react'
import { X, Plus, Palette, Hash, Tag } from 'lucide-react'
import { getPatientTags, createPatientTag, deletePatientTag } from '../services/api'

interface TagItem {
  id: number
  name: string
  color: string
}

interface TagSelectorProps {
  patientId?: number | null
  selectedTags?: TagItem[]
  onChange?: (tags: TagItem[]) => void
  compact?: boolean
}

const TAG_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16']

export default function TagSelector({ patientId, selectedTags = [], onChange, compact }: TagSelectorProps) {
  const [tags, setTags] = useState<TagItem[]>([])
  const [showManager, setShowManager] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#3B82F6')

  useEffect(() => { loadTags() }, [])

  const loadTags = () => {
    getPatientTags().then(({ data }: any) => {
      setTags(Array.isArray(data) ? data : data.results || [])
    }).catch(() => {})
  }

  const isSelected = (tagId: number) => selectedTags.some(t => t.id === tagId)

  const toggleTag = (tag: TagItem) => {
    if (!onChange) return
    if (isSelected(tag.id)) {
      onChange(selectedTags.filter(t => t.id !== tag.id))
    } else {
      onChange([...selectedTags, tag])
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    try {
      await createPatientTag({ name: newTagName.trim(), color: newTagColor })
      setNewTagName('')
      loadTags()
    } catch { /* ignore */ }
  }

  const handleDeleteTag = async (id: number) => {
    try {
      await deletePatientTag(id)
      if (onChange) onChange(selectedTags.filter(t => t.id !== id))
      loadTags()
    } catch { /* ignore */ }
  }

  if (compact) {
    return (
      <>
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map(tag => (
            <span key={tag.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ backgroundColor: tag.color + '20', color: tag.color, border: `1px solid ${tag.color}40` }}>
              {tag.name}
            </span>
          ))}
        </div>
        {tags.length === 0 && (
          <button onClick={() => setShowManager(true)}
            className="text-[10px] text-brand-500 hover:text-brand-600 flex items-center gap-1">
            <Plus size={12} /> برچسب
          </button>
        )}
      </>
    )
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <button key={tag.id} type="button" onClick={() => toggleTag(tag)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                isSelected(tag.id)
                  ? 'border-current shadow-sm'
                  : 'border-surface-200 hover:border-surface-300 opacity-60 hover:opacity-100'
              }`}
              style={{
                backgroundColor: isSelected(tag.id) ? tag.color + '15' : 'transparent',
                color: tag.color,
                borderColor: isSelected(tag.id) ? tag.color + '50' : undefined,
              }}>
              {tag.name}
              {isSelected(tag.id) && <X size={12} className="cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleTag(tag) }} />}
            </button>
          ))}
        </div>
        {tags.length > 0 && onChange && (
          <p className="text-[10px] text-surface-400">برای انتخاب/لغو برچسب کلیک کنید</p>
        )}
        <button type="button" onClick={() => setShowManager(true)}
          className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1">
          <Palette size={12} /> مدیریت برچسب‌ها
        </button>
      </div>

      {showManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setShowManager(false)}>
          <div className="bg-white rounded-2xl shadow-soft-xl p-5 w-[400px] max-w-[90vw] max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-surface-800 flex items-center gap-2">
                <Tag size={16} className="text-brand-500" /> مدیریت برچسب‌ها
              </h3>
              <button onClick={() => setShowManager(false)} className="p-1.5 hover:bg-surface-100 rounded-xl transition-all">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              {tags.length === 0 ? (
                <p className="text-sm text-surface-400 text-center py-4">برچسبی تعریف نشده</p>
              ) : tags.map(tag => (
                <div key={tag.id} className="flex items-center justify-between gap-2 p-2.5 bg-surface-50 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                    <span className="text-sm font-medium text-surface-700">{tag.name}</span>
                  </div>
                  <button onClick={() => handleDeleteTag(tag.id)}
                    className="p-1.5 hover:bg-rose-50 text-surface-400 hover:text-rose-500 rounded-lg transition-all">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-surface-100 pt-3">
              <label className="label text-xs mb-2">برچسب جدید</label>
              <div className="flex gap-2">
                <div className="relative">
                  <input type="color" value={newTagColor} onChange={e => setNewTagColor(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-surface-200 p-1" />
                </div>
                <input type="text" value={newTagName} onChange={e => setNewTagName(e.target.value)}
                  placeholder="نام برچسب..." className="input-field flex-1" maxLength={30}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreateTag() }} />
                <button type="button" onClick={handleCreateTag}
                  className="btn btn-primary btn-sm flex items-center gap-1">
                  <Plus size={14} /> افزودن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
