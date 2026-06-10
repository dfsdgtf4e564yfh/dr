import { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-toastify'
import { Plus, X, Edit2, Trash2, Shield } from 'lucide-react'
import { getRoles, createRole, updateRole, deleteRole, getAllPermissionsDef, getDefaultRolePermissions } from '../services/api'
import ALL_PAGES from '../utils/permissionDefs'
import type { Role } from '../types'

export default function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', description: '', permissions: [] as string[], is_active: true })
  const [allPerms, setAllPerms] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      getRoles(),
      getAllPermissionsDef().catch(() => ({ data: ALL_PAGES }))
    ]).then(([res, permRes]) => {
      const d = res.data as any
      setRoles(Array.isArray(d) ? d : d.results || [])
      setAllPerms(Array.isArray(permRes.data) ? permRes.data : ALL_PAGES)
    }).catch(() => {
      toast.error('خطا در دریافت اطلاعات نقش‌ها')
    }).finally(() => setLoading(false))
  }, [])

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, any[]> = {}
    for (const p of allPerms) {
      if (!groups[p.group]) groups[p.group] = []
      groups[p.group].push(p)
    }
    return groups
  }, [allPerms])

  const openNew = () => {
    setEditing(null)
    setForm({ name: '', description: '', permissions: [], is_active: true })
    setShowModal(true)
  }

  const openEdit = (r: Role) => {
    setEditing(r.id)
    setForm({
      name: r.name,
      description: r.description || '',
      permissions: [...r.permissions],
      is_active: r.is_active,
    })
    setShowModal(true)
  }

  const togglePermission = (codename: string) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(codename)
        ? prev.permissions.filter(c => c !== codename)
        : [...prev.permissions, codename],
    }))
  }

  const selectAll = () => {
    setForm(prev => ({ ...prev, permissions: allPerms.map(p => p.codename) }))
  }

  const deselectAll = () => {
    setForm(prev => ({ ...prev, permissions: [] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('نام نقش را وارد کنید')
      return
    }
    try {
      if (editing) {
        await updateRole(editing, form)
        toast.success(`نقش "${form.name}" با موفقیت ویرایش شد`)
      } else {
        await createRole(form)
        toast.success(`نقش "${form.name}" با موفقیت ایجاد شد`)
      }
      setShowModal(false)
      const res = await getRoles()
      const d = res.data as any
      setRoles(Array.isArray(d) ? d : d.results || [])
    } catch (err: any) {
      const resp = err.response?.data
      if (resp && typeof resp === 'object') {
        const msgs = Object.entries(resp).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
        toast.error(msgs || 'خطا در ذخیره نقش')
      } else {
        toast.error('خطا در ذخیره نقش')
      }
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`آیا از حذف نقش "${name}" اطمینان دارید؟`)) return
    try {
      await deleteRole(id)
      toast.success(`نقش "${name}" حذف شد`)
      setRoles(roles.filter(r => r.id !== id))
    } catch {
      toast.error('خطا در حذف نقش')
    }
  }

  const getPermissionCount = (perms: string[]) => {
    if (!perms || perms.length === 0) return 'بدون دسترسی'
    return `${perms.length} دسترسی`
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-slate-800">مدیریت نقش‌ها</h1>
        <button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={18} /> نقش جدید</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-500 border-t-transparent" /></div>
      ) : (
        <div className="panel card-iranian">
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>نام نقش</th>
                <th>توضیحات</th>
                <th>تعداد دسترسی‌ها</th>
                <th>نوع</th>
                <th className="text-center">وضعیت</th>
                <th className="text-center">عملیات</th>
              </tr></thead>
              <tbody>
                {roles.map(r => (
                  <tr key={r.id}>
                    <td className="font-semibold text-slate-800">
                      <span className="flex items-center gap-2">
                        <Shield size={16} className="text-brand-500" />
                        {r.name}
                      </span>
                    </td>
                    <td className="text-slate-500 text-sm max-w-xs truncate">{r.description || '—'}</td>
                    <td>{getPermissionCount(r.permissions)}</td>
                    <td>
                      <span className={`text-xs px-2 py-1 rounded-lg ${r.is_system_role ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                        {r.is_system_role ? 'سیستمی' : 'سفارشی'}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`status-badge ${r.is_active ? 'active' : 'inactive'}`}>
                        <span className="dot"></span>
                        {r.is_active ? 'فعال' : 'غیرفعال'}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => openEdit(r)} className="action-btn" title="ویرایش"><Edit2 size={14} /></button>
                        {!r.is_system_role && (
                          <button onClick={() => handleDelete(r.id, r.name)} className="action-btn danger" title="حذف"><Trash2 size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-card-view stagger-children">
            {roles.map(r => (
              <div key={r.id} className="table-card-item">
                <div className="table-card-row">
                  <span className="table-card-label">نام نقش</span>
                  <span className="table-card-value font-semibold">{r.name}</span>
                </div>
                <div className="table-card-row">
                  <span className="table-card-label">توضیحات</span>
                  <span className="table-card-value">{r.description || '—'}</span>
                </div>
                <div className="table-card-row">
                  <span className="table-card-label">دسترسی‌ها</span>
                  <span className="table-card-value">{getPermissionCount(r.permissions)}</span>
                </div>
                <div className="table-card-row">
                  <span className="table-card-label">نوع</span>
                  <span className="table-card-value">
                    <span className={`text-xs px-2 py-1 rounded-lg ${r.is_system_role ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {r.is_system_role ? 'سیستمی' : 'سفارشی'}
                    </span>
                  </span>
                </div>
                <div className="table-card-row">
                  <span className="table-card-label">وضعیت</span>
                  <span className="table-card-value">
                    <span className={`status-badge ${r.is_active ? 'active' : 'inactive'}`}>
                      <span className="dot"></span>
                      {r.is_active ? 'فعال' : 'غیرفعال'}
                    </span>
                  </span>
                </div>
                <div className="table-card-actions">
                  <button onClick={() => openEdit(r)} className="btn-ghost text-xs"><Edit2 size={14} /> ویرایش</button>
                  {!r.is_system_role && (
                    <button onClick={() => handleDelete(r.id, r.name)} className="btn-ghost text-xs text-rose-500"><Trash2 size={14} /> حذف</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-800">{editing ? 'ویرایش نقش' : 'نقش جدید'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">نام نقش</label>
                <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="مثلاً: منشی، کاربر رزرو" />
              </div>
              <div>
                <label className="label">توضیحات</label>
                <textarea className="input-field" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="توضیح مختصری درباره این نقش" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="role_active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="rounded border-slate-300" />
                <label htmlFor="role_active" className="text-sm text-slate-700">فعال</label>
              </div>

              <hr className="border-slate-200" />
              <div className="flex items-center justify-between">
                <label className="label mb-0">دسترسی‌های این نقش</label>
                <div className="flex gap-2">
                  <button type="button" onClick={selectAll} className="text-xs text-brand-600 hover:underline">انتخاب همه</button>
                  <span className="text-xs text-slate-300">|</span>
                  <button type="button" onClick={deselectAll} className="text-xs text-slate-500 hover:underline">لغو همه</button>
                </div>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                {Object.entries(groupedPermissions).map(([group, perms]) => (
                  <div key={group}>
                    <h4 className="text-xs font-bold text-slate-500 mb-2">{group}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {perms.map((p: any) => (
                        <label key={p.codename} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer hover:text-brand-700">
                          <input type="checkbox" checked={form.permissions.includes(p.codename)}
                            onChange={() => togglePermission(p.codename)}
                            className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                          {p.name}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button type="submit" className="btn-primary w-full">{editing ? 'ذخیره نقش' : 'ایجاد نقش'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}