import React, { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-toastify'
import { createPortal } from 'react-dom'
import { Plus, X, Edit2, Trash2, Eye, EyeOff } from 'lucide-react'
import { getUsers, createUser, updateUser, deleteUser, getAvailablePermissions, getRoles, getDoctors, getTreatmentTypes, setUserRestrictions, resetUserTotp } from '../services/api'
import { toPersianDigits } from '../utils/jalali'
import type { User, Role } from '../types'
import { useAuth } from '../contexts/AuthContext'

interface PermissionItem {
  codename: string
  name: string
  group: string
}

interface UserForm {
  username: string
  password: string
  first_name: string
  last_name: string
  email: string
  phone: string
  role: string
  commission_percentage: number
  is_active: boolean
  specialization: string
  medical_council_number: string
  page_permissions: string[]
  two_factor_enabled: boolean
  restrictions: { doctor_ids: number[]; treatment_ids: number[] }
}

const roleLabels: Record<string, string> = { admin: 'مدیر کلینیک', reception: 'پذیرش', doctor: 'درمانگر', psychologist: 'روانشناس / درمانگر', rtms: 'کاربر ویژه', support: 'پشتیبانی', super_support: 'پشتیبانی ارشد' }

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['dashboard', 'dashboard_income', 'special_access',
    'patients', 'patient_create', 'patient_view', 'patient_edit', 'patient_delete',
    'patient_info', 'patient_appointments', 'patient_records', 'patient_billing',
    'patient_tags', 'patient_import', 'patient_export', 'patient_ocr',
    'patient_deleted_view', 'patient_restore', 'patient_permanent_delete',
    'patient_identity_view', 'patient_identity_edit', 'patient_identity_verify',
    'appointments', 'appointment_create', 'appointment_edit',
    'appointment_cancel', 'appointment_complete', 'appointment_reschedule',
    'appointment_delete', 'appointment_deleted_view', 'appointment_restore',
    'appointment_permanent_delete', 'appointments_calendar', 'waiting_list',
    'appointment_sms_confirm', 'appointment_sms_reminder',
    'appointment_public_booking', 'appointment_online_import', 'appointment_export',
    'calendar_view',
    'medical_records', 'medical_record_create', 'medical_record_edit',
    'medical_record_delete', 'medical_record_deleted_view', 'medical_record_restore',
    'medical_record_permanent_delete', 'medical_record_file_upload',
    'medical_record_voice', 'medical_record_templates',
    'visit_templates', 'visit_templates_apply', 'medical_record_export',
    'tms_forms', 'tms_form_create', 'tms_form_edit',
    'dicom_viewer', 'prescription_print',
    'doctor_finance', 'diagnosis_drugs', 'referral_letters', 'referral_letter_create',
    'common_diagnosis_manage', 'common_drug_manage', 'common_treatment_manage',
    'doctor_treatments', 'doctor_treatments_create', 'doctor_treatments_edit', 'doctor_treatments_delete',
    'billing', 'billing_create', 'billing_edit', 'billing_delete',
    'billing_deleted_view', 'billing_restore', 'billing_permanent_delete',
    'billing_payment', 'billing_export',
    'settlements', 'settlement_create', 'doctor_balance',
    'billing_receipt_print', 'billing_online_payment', 'billing_sms_payment_notice',
    'appointments_report', 'diagnosis_report', 'billing_report',
    'billing_report_pdf', 'billing_periodic_report', 'periodic_billing_generate',
    'users', 'user_create', 'user_edit', 'user_delete', 'roles_manage',
    'backup', 'backup_create', 'backup_download', 'backup_restore',
    'backup_delete', 'backup_schedule', 'backup_cloud', 'backup_email',
    'settings', 'clinic_settings', 'treatment_types',
    'treatment_types_create', 'treatment_types_edit', 'treatment_types_delete',
    'activity_log', 'activity_log_export', 'deleted_items', 'health_check',
    'notifications', 'notification_create',
    'sms_templates', 'sms_templates_manage', 'sms_history', 'sms_bulk',
    'sms_settings', 'messenger_settings', 'sms_credit', 'messenger_bale',
    'support_inbox', 'support_message_create', 'support_message_reply',
    'patient_portal', 'patient_online_booking', 'patient_online_payment',
    'patient_consent', 'patient_rating',
    'show_appointments_menu', 'show_medical_menu', 'show_financial_menu',
    'show_reports_menu', 'show_clinic_menu', 'show_system_menu'],
  super_support: ['dashboard', 'dashboard_income', 'special_access',
    'patients', 'patient_create', 'patient_view', 'patient_edit', 'patient_delete',
    'patient_info', 'patient_appointments', 'patient_records', 'patient_billing',
    'patient_tags', 'patient_import', 'patient_export', 'patient_ocr',
    'patient_deleted_view', 'patient_restore', 'patient_permanent_delete',
    'patient_identity_view', 'patient_identity_edit', 'patient_identity_verify',
    'appointments', 'appointment_create', 'appointment_edit',
    'appointment_cancel', 'appointment_complete', 'appointment_reschedule',
    'appointment_delete', 'appointment_deleted_view', 'appointment_restore',
    'appointment_permanent_delete', 'appointments_calendar', 'waiting_list',
    'appointment_sms_confirm', 'appointment_sms_reminder',
    'appointment_public_booking', 'appointment_online_import', 'appointment_export',
    'calendar_view',
    'medical_records', 'medical_record_create', 'medical_record_edit',
    'medical_record_delete', 'medical_record_deleted_view', 'medical_record_restore',
    'medical_record_permanent_delete', 'medical_record_file_upload',
    'medical_record_voice', 'medical_record_templates',
    'visit_templates', 'visit_templates_apply', 'medical_record_export',
    'tms_forms', 'tms_form_create', 'tms_form_edit',
    'dicom_viewer', 'prescription_print',
    'doctor_finance', 'diagnosis_drugs', 'referral_letters', 'referral_letter_create',
    'common_diagnosis_manage', 'common_drug_manage', 'common_treatment_manage',
    'doctor_treatments', 'doctor_treatments_create', 'doctor_treatments_edit', 'doctor_treatments_delete',
    'billing', 'billing_create', 'billing_edit', 'billing_delete',
    'billing_deleted_view', 'billing_restore', 'billing_permanent_delete',
    'billing_payment', 'billing_export',
    'settlements', 'settlement_create', 'doctor_balance',
    'billing_receipt_print', 'billing_online_payment', 'billing_sms_payment_notice',
    'appointments_report', 'diagnosis_report', 'billing_report',
    'billing_report_pdf', 'billing_periodic_report', 'periodic_billing_generate',
    'users', 'user_create', 'user_edit', 'user_delete', 'roles_manage',
    'backup', 'backup_create', 'backup_download', 'backup_restore',
    'backup_delete', 'backup_schedule', 'backup_cloud', 'backup_email',
    'settings', 'clinic_settings', 'treatment_types',
    'treatment_types_create', 'treatment_types_edit', 'treatment_types_delete',
    'activity_log', 'activity_log_export', 'deleted_items', 'health_check',
    'notifications', 'notification_create',
    'sms_templates', 'sms_templates_manage', 'sms_history', 'sms_bulk',
    'sms_settings', 'messenger_settings', 'sms_credit', 'messenger_bale',
    'support_inbox', 'support_message_create', 'support_message_reply',
    'patient_portal', 'patient_online_booking', 'patient_online_payment',
    'patient_consent', 'patient_rating',
    'show_appointments_menu', 'show_medical_menu', 'show_financial_menu',
    'show_reports_menu', 'show_clinic_menu', 'show_system_menu'],
  support: ['dashboard', 'dashboard_income',
    'patients', 'patient_create', 'patient_view', 'patient_edit', 'patient_delete',
    'patient_info', 'patient_appointments', 'patient_records', 'patient_billing',
    'patient_tags', 'patient_import', 'patient_export',
    'patient_deleted_view', 'patient_restore', 'patient_permanent_delete',
    'patient_identity_view', 'patient_identity_edit', 'patient_identity_verify',
    'appointments', 'appointment_create', 'appointment_edit',
    'appointment_cancel', 'appointment_complete', 'appointment_reschedule',
    'appointment_delete', 'appointments_calendar', 'waiting_list',
    'appointment_sms_confirm', 'appointment_sms_reminder',
    'appointment_online_import', 'appointment_export', 'calendar_view',
    'medical_records', 'medical_record_create', 'medical_record_edit',
    'medical_record_delete', 'medical_record_deleted_view', 'medical_record_restore',
    'medical_record_permanent_delete', 'medical_record_file_upload',
    'medical_record_voice', 'medical_record_templates',
    'visit_templates', 'visit_templates_apply', 'medical_record_export',
    'tms_forms', 'tms_form_create', 'tms_form_edit',
    'dicom_viewer', 'prescription_print',
    'doctor_finance', 'diagnosis_drugs', 'referral_letters', 'referral_letter_create',
    'common_diagnosis_manage', 'common_drug_manage', 'common_treatment_manage',
    'doctor_treatments', 'doctor_treatments_create', 'doctor_treatments_edit', 'doctor_treatments_delete',
    'billing', 'billing_create', 'billing_edit', 'billing_delete',
    'billing_deleted_view', 'billing_restore', 'billing_permanent_delete',
    'billing_payment', 'billing_export',
    'settlements', 'settlement_create', 'doctor_balance',
    'billing_receipt_print', 'billing_online_payment', 'billing_sms_payment_notice',
    'appointments_report', 'diagnosis_report', 'billing_report',
    'billing_report_pdf', 'billing_periodic_report', 'periodic_billing_generate',
    'users', 'user_create', 'user_edit', 'user_delete', 'roles_manage',
    'backup', 'backup_create', 'backup_download', 'backup_restore',
    'backup_delete', 'backup_schedule', 'backup_cloud', 'backup_email',
    'settings', 'clinic_settings', 'treatment_types',
    'treatment_types_create', 'treatment_types_edit', 'treatment_types_delete',
    'activity_log', 'activity_log_export', 'deleted_items', 'health_check',
    'notifications', 'notification_create',
    'sms_templates', 'sms_templates_manage', 'sms_history', 'sms_bulk',
    'sms_settings', 'messenger_settings', 'sms_credit', 'messenger_bale',
    'support_inbox', 'support_message_create', 'support_message_reply',
    'patient_portal', 'patient_online_booking', 'patient_online_payment',
    'patient_consent', 'patient_rating',
    'show_appointments_menu', 'show_medical_menu', 'show_financial_menu',
    'show_reports_menu', 'show_clinic_menu', 'show_system_menu'],
  reception: ['dashboard',
    'patients', 'patient_create', 'patient_view', 'patient_edit',
    'patient_info', 'patient_appointments', 'patient_billing', 'patient_tags',
    'appointments', 'appointment_create', 'appointment_edit',
    'appointment_cancel', 'appointment_complete',
    'appointments_calendar', 'waiting_list',
    'appointment_sms_confirm', 'appointment_sms_reminder',
    'doctor_finance',
    'billing', 'billing_create', 'billing_payment',
    'settlements', 'settlement_create',
    'billing_sms_payment_notice',
    'notifications',
    'show_appointments_menu', 'show_financial_menu'],
  doctor: ['dashboard', 'dashboard_income',
    'patients', 'patient_info', 'patient_appointments', 'patient_records',
    'patient_billing', 'patient_create', 'patient_view', 'patient_edit',
    'patient_tags',
    'appointments', 'appointment_create', 'appointment_edit',
    'appointments_calendar', 'waiting_list',
    'medical_records', 'medical_record_create', 'medical_record_edit',
    'medical_record_file_upload', 'medical_record_templates',
    'visit_templates', 'visit_templates_apply', 'medical_record_export',
    'tms_forms', 'tms_form_create', 'tms_form_edit',
    'dicom_viewer', 'prescription_print',
    'doctor_finance', 'diagnosis_drugs', 'referral_letters', 'referral_letter_create',
    'common_diagnosis_manage', 'common_drug_manage', 'common_treatment_manage',
    'diagnosis_report',
    'billing', 'billing_payment', 'billing_sms_payment_notice',
    'notifications',
    'show_appointments_menu', 'show_medical_menu',
    'show_financial_menu', 'show_reports_menu', 'show_clinic_menu'],
  psychologist: ['dashboard', 'dashboard_income',
    'patients', 'patient_info', 'patient_appointments', 'patient_records',
    'patient_billing', 'patient_create', 'patient_view', 'patient_edit',
    'patient_tags',
    'appointments', 'appointment_create', 'appointment_edit',
    'appointments_calendar', 'waiting_list',
    'medical_records', 'medical_record_create', 'medical_record_edit',
    'medical_record_file_upload', 'medical_record_templates',
    'visit_templates', 'visit_templates_apply',
    'doctor_finance', 'referral_letters', 'referral_letter_create',
    'diagnosis_report', 'diagnosis_drugs',
    'prescription_print',
    'notifications',
    'show_appointments_menu', 'show_medical_menu', 'show_financial_menu'],
  rtms: ['dashboard',
    'patients', 'patient_info', 'patient_appointments', 'patient_billing',
    'patient_create', 'patient_view', 'patient_edit',
    'appointments', 'appointment_create', 'appointment_edit', 'appointment_cancel',
    'appointments_calendar', 'waiting_list',
    'medical_records', 'medical_record_create', 'medical_record_edit',
    'tms_forms', 'tms_form_create', 'tms_form_edit',
    'doctor_finance', 'referral_letters',
    'diagnosis_report', 'diagnosis_drugs',
    'billing', 'billing_create', 'billing_payment',
    'notifications',
    'show_appointments_menu', 'show_medical_menu', 'show_reports_menu', 'show_clinic_menu'],
}

export default function Users() {
  const { hasRole } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [editing, setEditing] = useState<number | null>(null)
  const [allPermissions, setAllPermissions] = useState<PermissionItem[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [allDoctors, setAllDoctors] = useState<any[]>([])
  const [allTreatments, setAllTreatments] = useState<any[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState<UserForm>({
    username: '', password: '', first_name: '', last_name: '', email: '',
    phone: '', role: 'reception', commission_percentage: 0, is_active: true,
    specialization: '', medical_council_number: '',
    page_permissions: [],
    two_factor_enabled: false,
    restrictions: { doctor_ids: [], treatment_ids: [] },
  })

  useEffect(() => {
    Promise.all([
      getUsers(),
      getAvailablePermissions().catch(() => ({ data: [] })),
      getRoles().catch(() => ({ data: [] })),
      getDoctors().catch(() => ({ data: [] })),
      getTreatmentTypes().catch(() => ({ data: [] })),
    ]).then(([userRes, permRes, roleRes, docRes, treatRes]) => {
      const d = userRes.data as any
      setUsers(d.results || d)
      const permData = permRes.data as any
      setAllPermissions(Array.isArray(permData) ? permData : permData.results || [])
      const roleData = roleRes.data as any
      setRoles(Array.isArray(roleData) ? roleData : roleData.results || [])
      const docData = docRes.data as any
      setAllDoctors(Array.isArray(docData) ? docData : docData.results || [])
      const treatData = treatRes.data as any
      setAllTreatments(Array.isArray(treatData) ? treatData : treatData.results || [])
    }).catch(() => toast.error('متأسفانه در دریافت اطلاعات خطایی رخ داد '))
      .finally(() => setLoading(false))
  }, [])

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, PermissionItem[]> = {}
    for (const p of allPermissions) {
      if (!groups[p.group]) groups[p.group] = []
      groups[p.group].push(p)
    }
    return groups
  }, [allPermissions])

  const getRolePermissions = (roleName: string): string[] => {
    const found = roles.find(r => r.name === roleName)
    if (found && found.permissions && found.permissions.length > 0) return found.permissions
    return DEFAULT_ROLE_PERMISSIONS[roleName] || []
  }

  const openNew = () => {
    setEditing(null)
    const defaultRole = roles.find(r => r.name === 'reception') ? 'reception'
      : (roles.length > 0 ? roles[0].name : 'reception')
    setForm({
      username: '', password: '', first_name: '', last_name: '', email: '',
      phone: '', role: defaultRole, commission_percentage: 0, is_active: true,
      specialization: '', medical_council_number: '',
      page_permissions: [...getRolePermissions(defaultRole)],
      two_factor_enabled: false,
      restrictions: { doctor_ids: [], treatment_ids: [] },
    })
    setShowModal(true)
  }

  const openEdit = (u: User) => {
    setEditing(u.id)
    const userData = u as any
    setForm({
      username: u.username, password: '', first_name: u.first_name, last_name: u.last_name,
      email: u.email || '', phone: u.phone || '', role: u.role,
      commission_percentage: u.commission_percentage || 0, is_active: u.is_active ?? true,
      specialization: u.specialization || '', medical_council_number: u.medical_council_number || '',
      page_permissions: u.page_permissions || [...getRolePermissions(u.role)],
      two_factor_enabled: userData.two_factor_enabled || false,
      restrictions: { doctor_ids: [], treatment_ids: [], ...(userData.restrictions || {}) },
    })
    setShowModal(true)
  }

  const handleRoleChange = (role: string) => {
    setForm(prev => ({
      ...prev,
      role,
      page_permissions: prev.page_permissions.length === 0 || !editing
        ? [...getRolePermissions(role)]
        : prev.page_permissions,
    }))
  }

  const togglePermission = (codename: string) => {
    setForm(prev => ({
      ...prev,
      page_permissions: prev.page_permissions.includes(codename)
        ? prev.page_permissions.filter(c => c !== codename)
        : [...prev.page_permissions, codename],
    }))
  }

  const selectAll = () => {
    setForm(prev => ({ ...prev, page_permissions: allPermissions.map(p => p.codename) }))
  }

  const deselectAll = () => {
    setForm(prev => ({ ...prev, page_permissions: [] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let userId: number
      if (editing) {
        const payload = { ...form } as any
        if (!payload.password) delete payload.password
        delete payload.restrictions
        await updateUser(editing, payload)
        await setUserRestrictions(editing, form.restrictions)
        userId = editing
        toast.success(`کاربر ${form.first_name} ${form.last_name} با موفقیت ویرایش شد `)
      } else {
        const { restrictions, ...createPayload } = form
        const res = await createUser(createPayload as any)
        userId = (res.data as any).id
        await setUserRestrictions(userId, restrictions)
        toast.success(`کاربر ${form.first_name} ${form.last_name} با موفقیت ایجاد شد `)
      }
      setShowModal(false)
      const res2 = await getUsers()
      const d2 = res2.data as any
      setUsers(d2.results || d2)
    } catch (err: any) {
      const resp = err.response?.data
      if (resp && typeof resp === 'object') {
        const msgs = Object.entries(resp).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
        toast.error(msgs || 'متأسفانه خطایی رخ داد ')
      } else {
        toast.error(resp?.detail || 'متأسفانه خطایی رخ داد ')
      }
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('حذف شود؟')) return
    try { await deleteUser(id); toast.success('کاربر مورد نظر با موفقیت حذف شد '); setUsers(users.filter(u => u.id !== id)) }
    catch { toast.error('متأسفانه در حذف کاربر خطایی رخ داد ') }
  }

  const resetTotp = async (id: number) => {
    if (!window.confirm('آیا از ریست Google Authenticator این کاربر مطمئن هستید؟')) return
    try { await resetUserTotp(id); toast.success('Google Authenticator کاربر با موفقیت ریست شد') }
    catch { toast.error('خطا در ریست Google Authenticator') }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-slate-800">مدیریت کاربران</h1>
        <button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={18} /> کاربر جدید</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-500 border-t-transparent" /></div>
      ) : (
        <div className="panel card-iranian">
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th className="text-center">نام کاربری</th>
                <th className="text-center">نام</th>
                <th className="text-center">نام خانوادگی</th>
                <th className="text-center">نقش</th>
                <th className="text-center">تخصص</th>
                <th className="text-center">نظام پزشکی</th>
                <th className="text-center">تلفن</th>
                <th className="text-center">درصد</th>
                <th className="text-center">وضعیت</th>
                <th className="text-center">عملیات</th>
              </tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="text-center">{u.username}</td>
                    <td className="text-center">{u.first_name}</td>
                    <td className="text-center">{u.last_name}</td>
                    <td className="text-center">{roles.find(r => r.name === u.role)?.description || roleLabels[u.role] || u.role}</td>
                    <td className="text-center">{u.specialization || '—'}</td>
                    <td className="text-center">{u.medical_council_number ? toPersianDigits(u.medical_council_number) : '—'}</td>
                    <td dir="ltr" className="text-center">{u.phone || '—'}</td>
                    <td className="text-center">{toPersianDigits(u.commission_percentage || 0)}%</td>
                    <td className="text-center">
                      <span className={`status-badge ${u.is_active ? 'active' : 'inactive'}`}>
                        <span className="dot"></span>
                        {u.is_active ? 'فعال' : 'غیرفعال'}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => openEdit(u)} className="action-btn" title="ویرایش"><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete(u.id)} className="action-btn danger" title="حذف"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-card-view stagger-children">
            {users.map(u => (
              <div key={u.id} className="table-card-item">
                <div className="table-card-row">
                  <span className="table-card-label">نام کاربری</span>
                  <span className="table-card-value">{u.username}</span>
                </div>
                <div className="table-card-row">
                  <span className="table-card-label">نام</span>
                  <span className="table-card-value">{u.first_name}</span>
                </div>
                <div className="table-card-row">
                  <span className="table-card-label">نام خانوادگی</span>
                  <span className="table-card-value">{u.last_name}</span>
                </div>
                <div className="table-card-row">
                  <span className="table-card-label">نقش</span>
                  <span className="table-card-value">{roles.find(r => r.name === u.role)?.description || roleLabels[u.role] || u.role}</span>
                </div>
                <div className="table-card-row">
                  <span className="table-card-label">تخصص</span>
                  <span className="table-card-value">{u.specialization || '—'}</span>
                </div>
                <div className="table-card-row">
                  <span className="table-card-label">نظام پزشکی</span>
                  <span className="table-card-value">{u.medical_council_number ? toPersianDigits(u.medical_council_number) : '—'}</span>
                </div>
                <div className="table-card-row">
                  <span className="table-card-label">تلفن</span>
                  <span className="table-card-value">{u.phone || '—'}</span>
                </div>
                <div className="table-card-row">
                  <span className="table-card-label">درصد</span>
                  <span className="table-card-value">{toPersianDigits(u.commission_percentage || 0)}%</span>
                </div>
                <div className="table-card-row">
                  <span className="table-card-label">وضعیت</span>
                  <span className="table-card-value">
                    <span className={`status-badge ${u.is_active ? 'active' : 'inactive'}`}>
                      <span className="dot"></span>
                      {u.is_active ? 'فعال' : 'غیرفعال'}
                    </span>
                  </span>
                </div>
                <div className="table-card-actions">
                  <button onClick={() => openEdit(u)} className="btn-ghost text-xs"><Edit2 size={14} /> ویرایش</button>
                  <button onClick={() => handleDelete(u.id)} className="btn-ghost text-xs text-rose-500 hover:text-rose-600"><Trash2 size={14} /> حذف</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && createPortal(
        <div className="fixed inset-0 bg-black/30 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-800">{editing ? 'ویرایش کاربر' : 'کاربر جدید'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="label">نام کاربری</label><input className="input-field" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="label">نام</label><input className="input-field" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} /></div>
                <div><label className="label">نام خانوادگی</label><input className="input-field" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="label">رمز عبور {editing && '(خالی = عدم تغییر)'}</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} className="input-field w-full" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editing} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-slate-400 hover:text-slate-600 cursor-pointer p-1 transition-colors" tabIndex={-1}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div></div>
                <div><label className="label">نقش</label>
                    <select className="input-field" value={form.role} onChange={e => handleRoleChange(e.target.value)}>
                      {roles.map(r => (
                        <option key={r.id} value={r.name}>{r.description || r.name}</option>
                      ))}
                    </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="label">تلفن</label><input className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                <div><label className="label">ایمیل</label><input type="email" className="input-field" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              {(form.role === 'doctor' || form.role === 'psychologist') && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><label className="label">تخصص</label><input className="input-field" value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} placeholder="متخصص اعصاب و روان" /></div>
                    <div><label className="label">شماره نظام پزشکی</label><input className="input-field" value={form.medical_council_number} onChange={e => setForm({ ...form, medical_council_number: e.target.value })} placeholder="۱۲۳۴۵" /></div>
                  </div>
                  <div><label className="label">درصد سهم پزشک / درمانگر</label><input type="number" className="input-field" value={form.commission_percentage} onChange={e => setForm({ ...form, commission_percentage: Number(e.target.value) })} /></div>
                </>
              )}
              {form.role === 'rtms' && (
                <>
                  <hr className="border-slate-200" />
                  <div>
                    <label className="label">محدودیت پزشکان (فقط این پزشکان را ببیند)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                      {allDoctors.filter((d: any) => d.role === 'doctor' || d.role === 'psychologist').map((d: any) => (
                        <label key={d.id} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                          <input type="checkbox" checked={(form.restrictions?.doctor_ids || []).includes(d.id)}
                            onChange={() => {
                              const ids = form.restrictions?.doctor_ids || []
                              const next = ids.includes(d.id) ? ids.filter((id: number) => id !== d.id) : [...ids, d.id]
                              setForm({ ...form, restrictions: { ...form.restrictions, doctor_ids: next } })
                            }}
                            className="rounded border-slate-300 text-brand-600" />
                          {d.first_name} {d.last_name}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="label">محدودیت درمان‌ها (فقط این درمان‌ها را ببیند)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                      {allTreatments.map((t: any) => (
                        <label key={t.id} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                          <input type="checkbox" checked={(form.restrictions?.treatment_ids || []).includes(t.id)}
                            onChange={() => {
                              const ids = form.restrictions?.treatment_ids || []
                              const next = ids.includes(t.id) ? ids.filter((id: number) => id !== t.id) : [...ids, t.id]
                              setForm({ ...form, restrictions: { ...form.restrictions, treatment_ids: next } })
                            }}
                            className="rounded border-slate-300 text-brand-600" />
                          {t.name}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="rounded border-slate-300" />
                <label htmlFor="is_active" className="text-sm text-slate-700">فعال</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="two_factor" checked={form.two_factor_enabled}
                  onChange={e => setForm({ ...form, two_factor_enabled: e.target.checked })}
                  className="rounded border-slate-300" />
                <label htmlFor="two_factor" className="text-sm text-slate-700">فعالسازی تایید دو مرحله‌ای با پیامک</label>
              </div>

              <hr className="border-slate-200" />
              <div className="flex items-center justify-between">
                <label className="label mb-0">دسترسی صفحات</label>
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
                      {perms.map(p => (
                        <label key={p.codename} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer hover:text-brand-700">
                          <input type="checkbox" checked={form.page_permissions.includes(p.codename)}
                            onChange={() => togglePermission(p.codename)}
                            className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                          {p.name}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <button type="submit" className="btn-primary w-full">{editing ? 'ذخیره' : 'ایجاد کاربر'}</button>
                {editing && hasRole('admin') && (users.find(u => u.id === editing) as any)?.totp_enabled && (
                  <button type="button" onClick={() => resetTotp(editing)} className="btn-danger w-full text-sm flex items-center justify-center gap-2">
                    <EyeOff size={16} /> ریست Google Authenticator
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
