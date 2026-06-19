import React from 'react'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Plus, Search, Eye, Edit, Trash2, X, ChevronLeft, ChevronRight, Filter, User, Phone, FileText, CreditCard, Users as UsersIcon, Stethoscope, MapPin, UserCircle, IdCard, CalendarDays, BookOpen, Briefcase, HeartPulse, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { getPatients, createPatient, updatePatient, deletePatient, searchPatients, togglePatientRtmsVisibility } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { toPersianDigits, smartPersianDigits, formatAge, formatPhone, formatNationalId, formatGender } from '../utils/jalali'
import JalaliDateInput from '../components/JalaliDateInput'
import { getCityFromNationalId } from '../utils/cityCodes'
import { SkeletonTable } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import ConfirmDialog from '../components/ConfirmDialog'
import Button from '../components/Button'

export default function Patients() {
  const [patients, setPatients] = useState<any[]>([])
  const [search, setSearch] = useState<string>('')
  const [searchField, setSearchField] = useState<string>('all')
  const [loading, setLoading] = useState<boolean>(true)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [editing, setEditing] = useState<any>(null)
  const [age, setAge] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [showFilters, setShowFilters] = useState<boolean>(false)
  const [filterGender, setFilterGender] = useState<string>('')
  const [filterInsurance, setFilterInsurance] = useState<string>('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState<number>(-1)
  const [saving, setSaving] = useState<boolean>(false)
  const [confirmDelete, setConfirmDelete] = useState<any>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const suggestionRef = useRef<HTMLDivElement>(null)
  const pageSize = 18
  const { hasRole, hasPermission } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<any>({
    first_name: '', last_name: '', gender: 'male', father_name: '', national_id: '',
    old_file_number: '', insurance_booklet: 'none', education: '', job: '',
    phone: '', emergency_phone: '',
    birth_date: '', first_visit_date: '',
    routine_medications: '', address: '', medical_history: '',
  })
  const [errors, setErrors] = useState<any>({})

  const calculateAge = (gregDate: any) => {
    if (!gregDate) { setAge(''); return }
    const today = new Date()
    const birth = new Date(gregDate)
    if (isNaN(birth.getTime())) { setAge(''); return }
    let years = today.getFullYear() - birth.getFullYear()
    let months = today.getMonth() - birth.getMonth()
    let days = today.getDate() - birth.getDate()
    if (days < 0) {
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0)
      days += prevMonth.getDate()
      months--
    }
    if (months < 0) { months += 12; years-- }
    setAge(years >= 0 ? formatAge({ years, months, days }) : '')
  }

  const loadPatients = async (q = '', p = 1, field = '') => {
    setLoading(true)
    try {
      if (q && field && field !== 'all') {
        const res = await searchPatients(q, field)
        const data = res.data as any
        setPatients(Array.isArray(data) ? data : data.results || [])
        setTotalCount(data.count || (Array.isArray(data) ? data.length : 0))
      } else {
        const params: any = { page: p }
        if (q) params.search = q
        const res = await getPatients(params)
        const data = res.data as any
        setPatients(Array.isArray(data) ? data : data.results || [])
        setTotalCount(data.count || (Array.isArray(data) ? data.length : 0))
      }
      setPage(p)
    } catch { toast.error('متأسفانه در دریافت اطلاعات بیماران مشکلی پیش اومد', { icon: <XCircle size={20} /> }) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    loadPatients()
  }, [])

  // بستن لیست پیشنهادها با کلیک بیرون از باکس جستجو یا کلید Escape
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false)
    }
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowSuggestions(false) }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadPatients(search, 1, searchField) }
  const totalPages = Math.ceil(totalCount / pageSize)

  const openNew = () => {
    setEditing(null); setAge('')
    setForm({ first_name: '', last_name: '', gender: 'male', father_name: '', national_id: '', old_file_number: '', insurance_booklet: 'none', education: '', job: '', phone: '', emergency_phone: '', birth_date: '', first_visit_date: '', routine_medications: '', address: '', medical_history: '' })
    setErrors({}); setShowModal(true)
  }

  const openEdit = (p: any) => {
    setEditing(p.id); calculateAge(p.birth_date)
    setForm({
      first_name: p.first_name, last_name: p.last_name, gender: p.gender || 'male', father_name: p.father_name || '',
      national_id: p.national_id, file_number: p.file_number || '', old_file_number: p.old_file_number || '',
      insurance_booklet: p.insurance_booklet || 'none', education: p.education || '', job: p.job || '',
      phone: p.phone || '', emergency_phone: p.emergency_phone || '',
      birth_date: p.birth_date || '', first_visit_date: p.first_visit_date ? toPersianDigits(new Date(p.first_visit_date.split('T')[0]).toLocaleDateString('fa-IR')) : '', routine_medications: p.routine_medications || '',
      address: p.address || '', medical_history: p.medical_history || '',
    })
    setErrors({}); setShowModal(true)
  }

  const updateField = (field: any, value: any) => {
    setForm((f: any) => ({ ...f, [field]: value }))
    setErrors((e: any) => ({ ...e, [field]: null }))
    if (field === 'birth_date') calculateAge(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({}); setSaving(true)
    const payload: any = { ...form }
    delete payload.file_number
    if (!payload.old_file_number) payload.old_file_number = ''
    if (!payload.education) payload.education = ''
    if (!payload.job) payload.job = ''
    if (!payload.birth_date) delete payload.birth_date
    if (!payload.first_visit_date || editing) delete payload.first_visit_date
    try {
      if (editing) { await updatePatient(editing, payload); toast.success(`اطلاعات بیمار ${form.first_name} ${form.last_name} با موفقیت ویرایش شد`, { icon: <CheckCircle size={20} /> }); setShowModal(false); loadPatients(search) }
      else {
        await createPatient(payload)
        toast.success(`بیمار ${form.first_name} ${form.last_name} با موفقیت به سیستم اضافه شد`, { icon: <CheckCircle size={20} /> })
        setShowModal(false)
        loadPatients(search)
      }
    } catch (err: any) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const fieldErrors: any = {}
        let hasFieldError = false
        for (const [key, msgs] of Object.entries(data)) {
          if (key === 'detail' && typeof msgs === 'string') { fieldErrors.non_field_errors = msgs; hasFieldError = true }
          else if (Array.isArray(msgs) && msgs.length > 0) { fieldErrors[key] = msgs[0]; hasFieldError = true }
          else if (typeof msgs === 'string') { fieldErrors[key] = msgs; hasFieldError = true }
        }
        if (hasFieldError) setErrors(fieldErrors)
        else toast.error(data.detail || 'متأسفانه خطایی در ثبت بیمار رخ داد. لطفاً مجدد تلاش کنید', { icon: <XCircle size={20} /> })
      } else toast.error('متأسفانه خطایی در ثبت بیمار رخ داد. لطفاً مجدد تلاش کنید', { icon: <XCircle size={20} /> })
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: any) => {
    try { await deletePatient(id); toast.success('بیمار مورد نظر با موفقیت حذف شد', { icon: <CheckCircle size={20} /> }); loadPatients(search) }
    catch { toast.error('متأسفانه در حذف بیمار مشکلی پیش اومد', { icon: <XCircle size={20} /> }) }
    finally { setConfirmDelete(null) }
  }

  const handleToggleRtms = async (p: any) => {
    try {
      const res = await togglePatientRtmsVisibility(p.id)
      const newVal = res.data.visible_to_rtms
      setPatients(prev => prev.map(pt => pt.id === p.id ? { ...pt, visible_to_rtms: newVal } : pt))
      toast.success(newVal ? 'بیمار برای کاربران ویژه قابل مشاهده شد' : 'بیمار از دید کاربران ویژه خارج شد', { icon: <CheckCircle size={20} /> })
    } catch { toast.error('خطا در تغییر وضعیت نمایش', { icon: <XCircle size={20} /> }) }
  }

  const renderFormSection = (title: any, icon: any, fields: any) => (
    <div className="bg-surface-50/50 rounded-2xl p-5 border border-surface-100">
      <h4 className="section-title">
        <span className="icon-wrap">{icon}</span>
        {title}
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-3 gap-y-3 items-start">
        {fields}
      </div>
    </div>
  )

  const SelectField = ({ label, name, options, required, placeholder }: any) => {
    const hasError = errors[name]
    return (
      <div>
        <label className="label">
          {label}
          {required && <span className="text-rose-500 mr-0.5">*</span>}
        </label>
        <select
          className={`input-field ${hasError ? 'error' : ''}`}
          value={form[name]} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateField(name, e.target.value)}
        >
          {(placeholder ? [{ value: '', label: placeholder }] : []).concat(options).map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {hasError && <p className="text-xs text-rose-500 mt-1.5 pr-1 font-medium">{hasError}</p>}
      </div>
    )
  }

  // تعریف یکجای ستون‌های جدول: هدر و سلول‌ها از همین آرایه ساخته می‌شوند
  // تا تعداد و ترتیب‌شان هیچ‌وقت از هم جدا نشود
  const patientColumns: { key: string; label: string; tdClass?: string; render: (p: any, idx: number) => React.ReactNode }[] = [
    { key: 'row', label: 'ردیف', tdClass: 'font-bold text-surface-400', render: (_p, idx) => toPersianDigits((page - 1) * pageSize + idx + 1) },
    { key: 'first_name', label: 'نام', tdClass: 'font-medium', render: (p) => p.first_name },
    { key: 'last_name', label: 'نام خانوادگی', tdClass: 'font-medium', render: (p) => p.last_name },
    { key: 'father_name', label: 'نام پدر', render: (p) => p.father_name || '—' },
    { key: 'national_id', label: 'کد ملی', render: (p) => toPersianDigits(p.national_id) },
    { key: 'phone', label: 'شماره تماس', render: (p) => toPersianDigits(p.phone) },
    {
      key: 'file_number', label: 'شماره پرونده', tdClass: 'font-bold text-brand-500',
      // dir=ltr: شماره پرونده‌هایی مثل K-T-001 ترکیب حرف و عدد هستند و در متن RTL ممکن است برعکس چیده شوند
      render: (p) => <span dir="ltr" className="inline-block">{smartPersianDigits(p.file_number || p.id)}</span>,
    },
    {
      key: 'actions', label: 'عملیات‌ها',
      render: (p) => (
        <div className="flex items-center justify-center gap-1">
          {hasPermission('patient_view') && (
            <button onClick={() => navigate(`/panel/patients/${p.id}`)} className="action-btn" title="مشاهده"><Eye size={16} /></button>
          )}
          {hasPermission('patient_edit') && (
            <button onClick={() => openEdit(p)} className="action-btn" title="ویرایش"><Edit size={16} /></button>
          )}
          {hasRole('admin', 'support', 'super_support', 'reception') && (
            <button onClick={() => handleToggleRtms(p)} className={`action-btn ${p.visible_to_rtms ? 'text-emerald-500' : ''}`} title={p.visible_to_rtms ? 'عدم نمایش به کاربران ویژه' : 'نمایش به کاربران ویژه'}><UsersIcon size={16} /></button>
          )}
          {hasPermission('patient_delete') && (
            <button onClick={() => setConfirmDelete(p.id)} className="action-btn danger" title="حذف"><Trash2 size={16} /></button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="مدیریت بیماران">
        {hasPermission('patient_create') && (
          <Button onClick={openNew} variant="gradient" icon={Plus}>بیمار جدید</Button>
        )}
      </PageHeader>

      <form onSubmit={handleSearch} className="flex gap-3 items-start max-w-xl">
        <div className="flex-1 flex gap-3">
          <div className="relative flex-1" ref={searchRef}>
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" size={18} />
            <input type="text"
              placeholder={searchField === 'national_id' ? 'جستجوی کد ملی...' : searchField === 'phone' ? 'جستجوی شماره تماس...' : searchField === 'file_number' ? 'جستجوی شماره پرونده...' : 'جستجوی نام، کد ملی یا تلفن...'}
              className="input-field pr-12"
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setSearch(e.target.value)
                if (e.target.value.length >= 2) {
                  searchPatients(e.target.value, searchField !== 'all' ? searchField : undefined)
                    .then(({ data }: any) => { setSuggestions(Array.isArray(data) ? data : []); setShowSuggestions(true); setSelectedSuggestion(-1) })
                    .catch(() => {})
                } else { setSuggestions([]); setShowSuggestions(false) }
              }}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'ArrowDown') { setSelectedSuggestion((prev: number) => Math.min(prev + 1, suggestions.length - 1)); e.preventDefault() }
                else if (e.key === 'ArrowUp') { setSelectedSuggestion((prev: number) => Math.max(prev - 1, 0)); e.preventDefault() }
                else if (e.key === 'Enter' && selectedSuggestion >= 0 && suggestions[selectedSuggestion]) {
                  navigate(`/panel/patients/${suggestions[selectedSuggestion].id}`); setShowSuggestions(false)
                }
              }}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div ref={suggestionRef} className="absolute top-full right-0 left-0 mt-1.5 bg-white border border-surface-200 rounded-2xl shadow-soft-lg z-50 max-h-60 overflow-y-auto">
                {suggestions.map((p: any, i: number) => (
                  <div key={p.id}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer text-sm hover:bg-surface-50 border-b border-surface-100 last:border-0 transition-all ${i === selectedSuggestion ? 'bg-brand-50' : ''}`}
                    onClick={() => { navigate(`/panel/patients/${p.id}`); setShowSuggestions(false) }}
                    onMouseEnter={() => setSelectedSuggestion(i)}
                  >
                    <User size={16} className="text-surface-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-surface-800">{p.first_name} {p.last_name}</span>
                      <span className="text-xs text-surface-400 mr-2">کد ملی: {toPersianDigits(p.national_id)}</span>
                    </div>
                    <div className="text-xs text-surface-400 shrink-0">{p.file_number && smartPersianDigits(p.file_number)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <select className="input-field flex-1" value={searchField} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSearchField(e.target.value)}>
            <option value="all">همه فیلدها</option>
            <option value="national_id">کد ملی</option>
            <option value="phone">شماره تماس</option>
            <option value="file_number">شماره پرونده</option>
          </select>
        </div>
        <Button type="submit" variant="primary" icon={Search}>جستجو</Button>
        <Button type="button" variant={showFilters ? 'primary' : 'secondary'} icon={Filter} onClick={() => setShowFilters(!showFilters)} />
        {search && <Button type="button" variant="ghost" onClick={() => { setSearch(''); loadPatients('', 1) }}>لغو</Button>}
      </form>

      {showFilters && (
        <div className="card p-5 bg-surface-50/50">
          <div className="flex gap-4 items-end flex-wrap">
            <div className="min-w-[160px]">
              <label className="label">جنسیت</label>
              <select className="input-field" value={filterGender} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterGender(e.target.value)}>
                <option value="">همه</option>
                <option value="male">مرد</option>
                <option value="female">زن</option>
              </select>
            </div>
            <div className="min-w-[160px]">
              <label className="label">نوع بیمه</label>
              <select className="input-field" value={filterInsurance} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterInsurance(e.target.value)}>
                <option value="">همه</option>
                <option value="none">ندارد</option>
                <option value="social_security">تأمین اجتماعی</option>
                <option value="health_services">خدمات درمانی</option>
                <option value="military">نیروهای مسلح</option>
                <option value="other">سایر</option>
              </select>
            </div>
            <Button size="sm" onClick={() => { loadPatients(search); setShowFilters(false) }}>اعمال فیلتر</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="panel card-iranian"><SkeletonTable rows={8} cols={9} /></div>
      ) : patients.length === 0 ? (
        <EmptyState icon={UsersIcon} title="بیماری یافت نشد" description={search ? 'بیماری با این مشخصات در سیستم ثبت نشده' : 'هنوز بیماری ثبت نشده. برای شروع اولین بیمار را اضافه کنید.'} action={!search ? <Button onClick={openNew} variant="gradient" icon={Plus}>ثبت اولین بیمار</Button> : null} />
      ) : (
        <>
          <div className="panel card-iranian">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {patientColumns.map((col) => (
                      <th key={col.key} scope="col" className="text-center whitespace-nowrap">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p: any, idx: number) => (
                    <tr key={p.id}>
                      {patientColumns.map((col) => (
                        <td key={col.key} className={`text-center ${col.tdClass || ''}`}>{col.render(p, idx)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-card-view stagger-children">
              {patients.map((p: any, idx: number) => (
                <div key={p.id} className="table-card-item">
                  <div className="table-card-row">
                    <span className="table-card-label">ردیف</span>
                    <span className="table-card-value font-bold text-surface-400">{toPersianDigits(idx + 1)}</span>
                  </div>
                  <div className="table-card-row">
                    <span className="table-card-label">نام</span>
                    <span className="table-card-value">{p.first_name}</span>
                  </div>
                  <div className="table-card-row">
                    <span className="table-card-label">نام خانوادگی</span>
                    <span className="table-card-value">{p.last_name}</span>
                  </div>
                  <div className="table-card-row">
                    <span className="table-card-label">نام پدر</span>
                    <span className="table-card-value">{p.father_name || '—'}</span>
                  </div>
                  <div className="table-card-row">
                    <span className="table-card-label">کد ملی</span>
                    <span className="table-card-value">{toPersianDigits(p.national_id)}</span>
                  </div>
                  <div className="table-card-row">
                    <span className="table-card-label">شماره تماس</span>
                    <span className="table-card-value">{toPersianDigits(p.phone)}</span>
                  </div>
                  <div className="table-card-row">
                    <span className="table-card-label">شماره پرونده</span>
                    <span className="table-card-value text-brand-500 font-bold">{smartPersianDigits(p.file_number || p.id)}</span>
                  </div>
                  <div className="table-card-actions">
                    {hasPermission('patient_view') && <button onClick={() => navigate(`/panel/patients/${p.id}`)} className="btn-ghost text-xs"><Eye size={14} /> مشاهده</button>}
                    {hasPermission('patient_edit') && <button onClick={() => openEdit(p)} className="btn-ghost text-xs"><Edit size={14} /> ویرایش</button>}
                    {hasRole('admin', 'support', 'super_support', 'reception') && <button onClick={() => handleToggleRtms(p)} className={`btn-ghost text-xs ${p.visible_to_rtms ? 'text-emerald-500' : ''}`}><UsersIcon size={14} /> کاربر ویژه</button>}
                    {hasPermission('patient_delete') && <button onClick={() => setConfirmDelete(p.id)} className="btn-ghost text-xs text-rose-500 hover:text-rose-600"><Trash2 size={14} /> حذف</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-surface-500 font-medium">مجموع: {toPersianDigits(totalCount)} بیمار</span>
              <div className="flex items-center gap-1">
                <button onClick={() => loadPatients(search, page - 1)} disabled={page <= 1}
                  className="p-2 rounded-xl border-2 border-surface-200 hover:bg-surface-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <ChevronRight size={18} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => loadPatients(search, p)}
                    className={`min-w-[38px] h-10 rounded-xl text-sm font-bold transition-all ${p === page ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/20' : 'text-surface-600 hover:bg-surface-100'}`}>
                    {toPersianDigits(p)}
                  </button>
                ))}
                <button onClick={() => loadPatients(search, page + 1)} disabled={page >= totalPages}
                  className="p-2 rounded-xl border-2 border-surface-200 hover:bg-surface-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <ChevronLeft size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => handleDelete(confirmDelete)}
        title="حذف بیمار"
        message="آیا از حذف این بیمار اطمینان دارید؟ این عملیات قابل بازگشت نیست."
        confirmLabel="حذف شود"
        variant="danger"
      />

      <Modal open={showModal} onClose={() => setShowModal(false)} size="xl" title={editing ? 'ویرایش بیمار' : 'بیمار جدید'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {renderFormSection('اطلاعات پزشکی', <Stethoscope size={16} />, [
            <div key="first-visit">
              <label className="label">تاریخ اولین مراجعه</label>
              <input className="input-field text-surface-400" value={form.first_visit_date || 'پس از ثبت اولین پرونده'} readOnly />
            </div>,
            <div key="file-number">
              <label className="label">شماره پرونده <span className="text-success-500 text-[10px]">(خودکار)</span></label>
              <input className="input-field text-surface-400" value={editing ? form.file_number : 'به صورت خودکار درج می‌شود'} readOnly />
            </div>,
            <div key="old-file">
              <label className="label">شماره پرونده قدیمی</label>
              <input className="input-field" name="old_file_number" placeholder="در صورت داشتن شماره پرونده قبلی" value={form.old_file_number} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('old_file_number', e.target.value)} />
              {errors.old_file_number && <p className="text-xs text-rose-500 mt-1.5 pr-1 font-medium">{errors.old_file_number}</p>}
            </div>,
            <SelectField key="insurance" label="نوع بیمه" name="insurance_booklet" options={[{ value: 'none', label: 'ندارد' }, { value: 'social_security', label: 'تأمین اجتماعی' }, { value: 'health_services', label: 'خدمات درمانی' }, { value: 'military', label: 'نیروهای مسلح' }, { value: 'other', label: 'سایر' }]} />,
          ])}

          {renderFormSection('اطلاعات شخصی', <UserCircle size={16} />, [
            <SelectField key="gender" label="جنسیت" name="gender" options={[{ value: 'male', label: 'آقا' }, { value: 'female', label: 'خانم' }]} />,
            <div key="fn">
              <label className="label">نام <span className="text-rose-500">*</span></label>
              <input className={`input-field ${errors.first_name ? 'error' : ''}`} name="first_name" value={form.first_name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('first_name', e.target.value)} required />
              {errors.first_name && <p className="text-xs text-rose-500 mt-1.5 pr-1 font-medium">{errors.first_name}</p>}
            </div>,
            <div key="ln">
              <label className="label">نام خانوادگی <span className="text-rose-500">*</span></label>
              <input className={`input-field ${errors.last_name ? 'error' : ''}`} name="last_name" value={form.last_name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('last_name', e.target.value)} required />
              {errors.last_name && <p className="text-xs text-rose-500 mt-1.5 pr-1 font-medium">{errors.last_name}</p>}
            </div>,
            <div key="fn2">
              <label className="label">نام پدر</label>
              <input className={`input-field ${errors.father_name ? 'error' : ''}`} name="father_name" value={form.father_name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('father_name', e.target.value)} />
              {errors.father_name && <p className="text-xs text-rose-500 mt-1.5 pr-1 font-medium">{errors.father_name}</p>}
            </div>,
            <div key="nid">
              <label className="label">کد ملی <span className="text-rose-500">*</span></label>
              <input className={`input-field ${errors.national_id ? 'error' : ''}`} name="national_id" value={form.national_id} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('national_id', e.target.value)} required maxLength={10} />
              {errors.national_id && <p className="text-xs text-rose-500 mt-1.5 pr-1 font-medium">{errors.national_id}</p>}
              {form.national_id && form.national_id.length >= 3 && !errors.national_id && getCityFromNationalId(form.national_id) && (
                <div className="flex items-center gap-1.5 text-success-600 text-xs mt-2">
                  <MapPin size={12} />
                  <span>محل صدور: {getCityFromNationalId(form.national_id)}</span>
                </div>
              )}
            </div>,
            <div key="birth">
              <JalaliDateInput label="تاریخ تولد" value={form.birth_date} onChange={v => updateField('birth_date', v)} error={errors.birth_date} />
              {age && <p className="text-brand-500 text-xs mt-1.5 font-semibold">سن: {age}</p>}
            </div>,
            <SelectField key="edu" label="تحصیلات" name="education" placeholder="انتخاب کنید" options={[{ value: 'ciclu', label: 'سیکل' }, { value: 'diplom', label: 'دیپلم' }, { value: 'super_diplom', label: 'فوق دیپلم' }, { value: 'licence', label: 'لیسانس' }, { value: 'master', label: 'فوق لیسانس' }, { value: 'doctora', label: 'دکترا' }]} />,
            <SelectField key="job" label="شغل" name="job" placeholder="انتخاب کنید" options={[{ value: 'doctor', label: 'پزشک' }, { value: 'midwife', label: 'ماما' }, { value: 'engineer', label: 'مهندس' }, { value: 'nurse', label: 'پرستار' }, { value: 'employee', label: 'کارمند' }, { value: 'worker', label: 'کارگر' }, { value: 'housewife', label: 'خانه دار' }, { value: 'freelance', label: 'آزاد' }]} />,
          ])}

          {renderFormSection('اطلاعات تماس', <Phone size={16} />, [
            <div key="phone">
              <label className="label">شماره تماس <span className="text-rose-500">*</span></label>
              <input className={`input-field ${errors.phone ? 'error' : ''}`} name="phone" value={form.phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('phone', e.target.value)} required placeholder="۰۹۱۲۳۴۵۶۷۸۹" />
              {errors.phone && <p className="text-xs text-rose-500 mt-1.5 pr-1 font-medium">{errors.phone}</p>}
            </div>,
            <div key="emergency">
              <label className="label">شماره اضطراری</label>
              <input className={`input-field ${errors.emergency_phone ? 'error' : ''}`} name="emergency_phone" value={form.emergency_phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('emergency_phone', e.target.value)} placeholder="۰۹۱۲۳۴۵۶۷۸۹" />
              {errors.emergency_phone && <p className="text-xs text-rose-500 mt-1.5 pr-1 font-medium">{errors.emergency_phone}</p>}
            </div>,
            <div key="address" className="md:col-span-3 lg:col-span-5">
              <label className="label">آدرس</label>
              <textarea className={`input-field ${errors.address ? 'error' : ''}`} rows={2}
                value={form.address} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateField('address', e.target.value)} />
              {errors.address && <p className="text-xs text-rose-500 mt-1.5 pr-1 font-medium">{errors.address}</p>}
            </div>,
          ])}

          {errors.non_field_errors && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl px-5 py-3 text-rose-600 text-sm text-center font-medium">{errors.non_field_errors}</div>
          )}

          <Button type="submit" variant="gradient" className="w-full" size="lg" loading={saving} icon={editing ? Edit : Plus}>
            {editing ? 'ذخیره تغییرات' : 'ثبت بیمار'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
