import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { navigateTo } from './navigation'
import type {
  User, LoginResponse, LoginPayload, Patient, PatientFormData,
  Appointment, AppointmentPayload, MedicalRecord, CommonDiagnosis,
  CommonDrug, TmsForm, Billing, BillingPayload, Settlement,
  DashboardStats, MonthlyIncomeItem, DoctorIncomeItem,
  PatientsTrendItem, AlertsData, WorkYearInfo,
  NotificationItem, NotificationsData,
  SmsTemplate, SmsSettings, SmsLog,
  ReferralLetter, SupportMessage,
  ClinicSettings, BackupItem, BackupSchedule, EmailConfig, GitHubConfig,
  PaginatedResponse, AppConfig, Role, PatientTag, TotpSetupResponse,
  VisitTemplate, PatientIdentity,
  MessengerSetting, MessengerLog,
} from '../types'

const BASE_URL: string = (window as any).APP_CONFIG?.API_BASE_URL || '/api'

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = sessionStorage.getItem('access_token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = sessionStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh/`, { refresh })
          sessionStorage.setItem('access_token', data.access)
          original.headers.Authorization = `Bearer ${data.access}`
          return api(original)
        } catch {
          sessionStorage.clear()
          navigateTo('/panel')
        }
      } else {
        sessionStorage.clear()
        navigateTo('/panel')
      }
    }
    return Promise.reject(error)
  }
)

export default api

// Auth
export const login = (username: string, password: string, otpCode?: string) =>
  api.post<LoginResponse>('/auth/login/', { username, password, ...(otpCode ? { otp_step: 'verify', code: otpCode } : {}) })

export const getMe = () => api.get<User>('/auth/users/me/')
export const updateMe = (data: Partial<User>) => api.patch<User>('/auth/users/me/', data)
export const getUsers = () => api.get<User[]>('/auth/users/')
export const getUser = (id: number) => api.get<User>(`/auth/users/${id}/`)
export const getDoctors = () => api.get<User[]>('/auth/users/doctors/')
export const getReferralRecipients = () => api.get<User[]>('/auth/users/referral_recipients/')
export const createUser = (data: Partial<User>) => api.post<User>('/auth/users/', data)
export const updateUser = (id: number, data: Partial<User>) => api.patch<User>(`/auth/users/${id}/`, data)
export const deleteUser = (id: number) => api.delete(`/auth/users/${id}/`)
export const changePassword = (data: { old_password: string; new_password: string }) => api.post('/auth/users/change_password/', data)
export const totpSetup = () => api.get<TotpSetupResponse>('/auth/users/totp_setup/')
export const totpSetupConfirm = () => api.post<TotpSetupResponse>('/auth/users/totp_setup/')
export const totpVerify = (code: string) => api.post('/auth/users/totp_verify/', { code })
export const totpDisable = () => api.post('/auth/users/totp_disable/')
export const getAvailablePermissions = () => api.get<string[]>('/auth/users/available_permissions/')
export const getTreatmentTypes = () => api.get<any[]>('/auth/treatment-types/')
export const createTreatmentType = (data: any) => api.post('/auth/treatment-types/', data)
export const updateTreatmentType = (id: number, data: any) => api.patch(`/auth/treatment-types/${id}/`, data)
export const deleteTreatmentType = (id: number) => api.delete(`/auth/treatment-types/${id}/`)
export const getDoctorTreatments = () => api.get<any[]>('/auth/doctor-treatments/')
export const createDoctorTreatment = (data: any) => api.post('/auth/doctor-treatments/', data)

// Patients
export const getPatients = (params?: any) => api.get<PaginatedResponse<Patient>>('/patients/', { params })
export const getPatient = (id: number) => api.get<Patient>(`/patients/${id}/`)
export const createPatient = (data: PatientFormData) => api.post<Patient>('/patients/', data)
export const updatePatient = (id: number, data: Partial<Patient>) => api.patch<Patient>(`/patients/${id}/`, data)
export const deletePatient = (id: number) => api.delete(`/patients/${id}/`)
export const getPatientFullProfile = (id: number) => api.get<Patient>(`/patients/${id}/full_profile/`)
export const searchPatients = (q: string, field?: string) => api.get<Patient[]>('/patients/search/', { params: { q, field } })
export const lookupPatients = (q: string) => api.get<Patient[]>('/patients/lookup/', { params: { q } })
export const getDeletedPatients = () => api.get<Patient[]>('/patients/deleted/')
export const restorePatient = (id: number) => api.post(`/patients/${id}/restore/`)
export const permanentDeletePatient = (id: number) => api.delete(`/patients/${id}/permanent_delete/`)
export const restoreAllPatients = () => api.post('/patients/restore_all/')
export const permanentDeleteAllPatients = () => api.delete('/patients/permanent_delete_all/')
export const getAllDeleted = () => api.get<any[]>('/patients/all_deleted/')
export const restoreAppointment = (id: number) => api.post(`/appointments/${id}/restore/`)
export const permanentDeleteAppointment = (id: number) => api.delete(`/appointments/${id}/permanent_delete/`)
export const restoreAllAppointments = () => api.post('/appointments/restore_all/')
export const permanentDeleteAllAppointments = () => api.delete('/appointments/permanent_delete_all/')
export const getDeletedAppointments = () => api.get('/appointments/deleted/')
export const restoreMedicalRecord = (id: number) => api.post(`/medical-records/${id}/restore/`)
export const permanentDeleteMedicalRecord = (id: number) => api.delete(`/medical-records/${id}/permanent_delete/`)
export const restoreAllMedicalRecords = () => api.post('/medical-records/restore_all/')
export const permanentDeleteAllMedicalRecords = () => api.delete('/medical-records/permanent_delete_all/')
export const getDeletedMedicalRecords = () => api.get('/medical-records/deleted/')
export const restoreBilling = (id: number) => api.post(`/billing/billings/${id}/restore/`)
export const permanentDeleteBilling = (id: number) => api.delete(`/billing/billings/${id}/permanent_delete/`)
export const restoreAllBillings = () => api.post('/billing/billings/restore_all/')
export const permanentDeleteAllBillings = () => api.delete('/billing/billings/permanent_delete_all/')
export const getDeletedBillings = () => api.get('/billing/billings/deleted/')

// Appointments
export const getAppointments = (params?: any) => api.get<PaginatedResponse<Appointment>>('/appointments/', { params })
export const getAppointmentsByPatient = (patientId: number) => api.get<Appointment[]>('/appointments/', { params: { patient: patientId } })
export const getAppointment = (id: number) => api.get<Appointment>(`/appointments/${id}/`)
export const createAppointment = (data: AppointmentPayload) => api.post<Appointment>('/appointments/', data)
export const updateAppointment = (id: number, data: Partial<Appointment>) => api.patch<Appointment>(`/appointments/${id}/`, data)
export const deleteAppointment = (id: number) => api.delete(`/appointments/${id}/`)
export const cancelAppointment = (id: number) => api.post(`/appointments/${id}/cancel/`)
export const completeAppointment = (id: number) => api.post(`/appointments/${id}/complete/`)
export const rescheduleAppointment = (id: number, data: any) => api.post(`/appointments/${id}/reschedule/`, data)
export const payAppointment = (id: number, data: any) => api.post(`/appointments/${id}/pay/`, data)
export const getTodayAppointments = () => api.get<Appointment[]>('/appointments/today/')
export const getCalendarAppointments = (date: string) => api.get<Appointment[]>('/appointments/calendar/', { params: { date } })

// Medical Records
export const getMedicalRecords = (params?: any) => api.get<PaginatedResponse<MedicalRecord>>('/medical-records/', { params })
export const getMedicalRecord = (id: number) => api.get<MedicalRecord>(`/medical-records/${id}/`)
export const createMedicalRecord = (data: any) => {
  const formData = new FormData()
  Object.entries(data).forEach(([k, v]) => {
    if (k === 'uploaded_files' && Array.isArray(v)) {
      v.forEach((f: File) => formData.append('uploaded_files', f))
    } else {
      formData.append(k, v as any)
    }
  })
  return api.post<MedicalRecord>('/medical-records/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
export const updateMedicalRecord = (id: number, data: any) => {
  const formData = new FormData()
  Object.entries(data).forEach(([k, v]) => {
    if (k === 'uploaded_files' && Array.isArray(v)) {
      v.forEach((f: File) => formData.append('uploaded_files', f))
    } else {
      formData.append(k, v as any)
    }
  })
  return api.patch<MedicalRecord>(`/medical-records/${id}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
export const deleteMedicalRecord = (id: number) => api.delete(`/medical-records/${id}/`)
export const getAuditLogs = (params?: any) => api.get('/medical-records/logs/', { params })
export const getCommonDiagnoses = () => api.get<CommonDiagnosis[]>('/medical-records/common-diagnoses/')
export const createCommonDiagnosis = (data: Partial<CommonDiagnosis>) => api.post<CommonDiagnosis>('/medical-records/common-diagnoses/', data)
export const updateCommonDiagnosis = (id: number, data: Partial<CommonDiagnosis>) => api.patch<CommonDiagnosis>(`/medical-records/common-diagnoses/${id}/`, data)
export const deleteCommonDiagnosis = (id: number) => api.delete(`/medical-records/common-diagnoses/${id}/`)
export const getCommonDrugs = () => api.get<CommonDrug[]>('/medical-records/common-drugs/')
export const createCommonDrug = (data: Partial<CommonDrug>) => api.post<CommonDrug>('/medical-records/common-drugs/', data)
export const updateCommonDrug = (id: number, data: Partial<CommonDrug>) => api.patch<CommonDrug>(`/medical-records/common-drugs/${id}/`, data)
export const deleteCommonDrug = (id: number) => api.delete(`/medical-records/common-drugs/${id}/`)
export const getCommonTreatmentPlans = () => api.get<any[]>('/medical-records/common-treatment-plans/')
export const createCommonTreatmentPlan = (data: any) => api.post('/medical-records/common-treatment-plans/', data)
export const updateCommonTreatmentPlan = (id: number, data: any) => api.patch(`/medical-records/common-treatment-plans/${id}/`, data)
export const deleteCommonTreatmentPlan = (id: number) => api.delete(`/medical-records/common-treatment-plans/${id}/`)
export const exportMedicalRecordsCsv = () => api.get('/medical-records/export_csv/', { responseType: 'blob' })
export const getDiagnosisReport = (params?: any) => api.get('/medical-records/diagnosis_report/', { params })
export const getDiagnosisReportPdf = (params?: any) => api.get('/medical-records/diagnosis_report_pdf/', { params, responseType: 'blob' })
export const getPatientRecords = (params?: any) => api.get('/medical-records/patient_records/', { params })
export const uploadVoiceNote = (recordId: number, audioBlob: Blob) => {
  const formData = new FormData()
  formData.append('file', audioBlob, 'voice.webm')
  return api.post<{ voice_note: string; voice_transcription: string }>(`/medical-records/${recordId}/upload_voice/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// TMS Forms
export const getTmsForms = (params?: any) => api.get<PaginatedResponse<TmsForm>>('/medical-records/tms-forms/', { params })
export const getTmsForm = (id: number) => api.get<TmsForm>(`/medical-records/tms-forms/${id}/`)
export const createTmsForm = (data: Partial<TmsForm>) => api.post<TmsForm>('/medical-records/tms-forms/', data)
export const updateTmsForm = (id: number, data: Partial<TmsForm>) => api.patch<TmsForm>(`/medical-records/tms-forms/${id}/`, data)
export const deleteTmsForm = (id: number) => api.delete(`/medical-records/tms-forms/${id}/`)

// Billing
export const getBillings = (params?: any) => api.get<PaginatedResponse<Billing>>('/billing/billings/', { params })
export const getBilling = (id: number) => api.get<Billing>(`/billing/billings/${id}/`)
export const createBilling = (data: BillingPayload) => api.post<Billing>('/billing/billings/', data)
export const updateBilling = (id: number, data: Partial<Billing>) => api.patch<Billing>(`/billing/billings/${id}/`, data)
export const deleteBilling = (id: number) => api.delete(`/billing/billings/${id}/`)
export const getFinancialReport = (params?: any) => api.get('/billing/billings/report/', { params })
export const getFinancialReportPdf = (params?: any) => api.get('/billing/billings/report_pdf/', { params, responseType: 'blob' })
export const getDoctorBalances = () => api.get('/billing/billings/doctor_balance/')
export const getSettlements = (params?: any) => api.get<PaginatedResponse<Settlement>>('/billing/settlements/', { params })
export const createSettlement = (data: Partial<Settlement>) => api.post<Settlement>('/billing/settlements/', data)
export const updateSettlement = (id: number, data: Partial<Settlement>) => api.patch<Settlement>(`/billing/settlements/${id}/`, data)
export const deleteSettlement = (id: number) => api.delete(`/billing/settlements/${id}/`)
export const getSettlementHistory = (params?: any) => api.get('/billing/settlements/history/', { params })
export const getDoctorBalance = (doctorId: number) => api.get(`/billing/settlements/doctor_balance/?doctor=${doctorId}`)
export const payBalance = (data: any) => api.post('/billing/billings/pay_balance/', data)
export const requestOnlinePayment = (billingId: number) => api.post(`/billing/billings/${billingId}/pay_online/`)
export const exportBillingsCsv = () => api.get('/billing/billings/export_csv/', { responseType: 'blob' })

// Dashboard
export const getDashboardStats = () => api.get<DashboardStats>('/dashboard/stats/')
export const getMonthlyIncome = (year?: number) => api.get<MonthlyIncomeItem[]>('/dashboard/monthly-income/', { params: { year } })
export const getDoctorIncomePie = () => api.get<DoctorIncomeItem[]>('/dashboard/doctor-income/')
export const getPatientsTrend = (days: number) => api.get<PatientsTrendItem[]>('/dashboard/patients-trend/', { params: { days } })
export const getAlerts = () => api.get<AlertsData>('/dashboard/alerts/')

// SMS
export const getSmsConfirmPreview = (appointmentId: number) =>
  api.get('/sms/send-confirm/', { params: { appointment_id: appointmentId } })
export const getSmsReminderPreview = (appointmentId: number) =>
  api.get('/sms/send-reminder/', { params: { appointment_id: appointmentId } })
export const getSmsPaymentPreview = (patientId: number, amount: number, appointmentId?: number) =>
  api.get('/sms/send-payment-notice/', { params: { patient_id: patientId, amount, ...(appointmentId ? { appointment_id: appointmentId } : {}) } })

export const sendSmsConfirm = (appointmentId: number, messageText?: string | null, lineNumber?: string | null, usePattern?: boolean | null) => {
  const payload: any = { appointment_id: appointmentId }
  if (messageText) payload.message_text = messageText
  if (lineNumber) payload.line_number = lineNumber
  if (usePattern !== null) payload.use_pattern = usePattern
  return api.post('/sms/send-confirm/', payload)
}

export const sendSmsReminder = (appointmentId: number, messageText?: string | null, lineNumber?: string | null, usePattern?: boolean | null) => {
  const payload: any = { appointment_id: appointmentId }
  if (messageText) payload.message_text = messageText
  if (lineNumber) payload.line_number = lineNumber
  if (usePattern !== null) payload.use_pattern = usePattern
  return api.post('/sms/send-reminder/', payload)
}

export const sendSmsPayment = (patientId: number, amount: number, messageText?: string | null, lineNumber?: string | null, usePattern?: boolean | null, appointmentId?: number | null) => {
  const payload: any = { patient_id: patientId, amount }
  if (messageText) payload.message_text = messageText
  if (lineNumber) payload.line_number = lineNumber
  if (usePattern !== null) payload.use_pattern = usePattern
  if (appointmentId) payload.appointment_id = appointmentId
  return api.post('/sms/send-payment-notice/', payload)
}

export const getSmsSettings = () => api.get<SmsSettings>('/sms/settings/')
export const updateSmsSettings = (data: SmsSettings) => api.put<SmsSettings>('/sms/settings/', data)
export const testSmsConnection = (apiKey: string) => api.post('/sms/test/', { sms_api_key: apiKey })
export const getSmsCredit = () => api.get('/sms/credit/')
export const getSmsMethodInfo = (type: string) => api.get('/sms/method-info/', { params: { type } })

export const getSmsTemplates = () => api.get<SmsTemplate[]>('/sms/templates/')
export const createSmsTemplate = (data: Partial<SmsTemplate>) => api.post<SmsTemplate>('/sms/templates/', data)
export const updateSmsTemplate = (id: number, data: Partial<SmsTemplate>) => api.put<SmsTemplate>(`/sms/templates/${id}/`, data)
export const deleteSmsTemplate = (id: number) => api.delete(`/sms/templates/${id}/`)

export const getSmsLogs = (params?: any) => api.get<PaginatedResponse<SmsLog>>('/sms/logs/', { params })
export const getSmsDelivery = (recIds: number[]) => api.post('/sms/delivery/', { recIds })
export const sendSmsOtp = (to: string) => api.post('/sms/otp/', { to })
export const checkPendingDeliveries = () => api.post('/sms/check-pending/')

// Messenger (ایتا، بله، روبیکا)
export const getMessengerSettings = () => api.get<MessengerSetting[]>('/sms/messenger-settings/')
export const updateMessengerSettings = (data: Partial<MessengerSetting>) => api.post('/sms/messenger-settings/', data)
export const sendMessengerMessage = (data: { messenger_type: string; recipient: string; message: string }) => api.post('/sms/send-messenger/', data)
export const testMessenger = (data: { messenger_type: string; bot_token: string }) => api.post('/sms/test-messenger/', data)

export const forgotPasswordSendOtp = (phone: string) => api.post('/auth/forgot-password/send-otp/', { phone })
export const forgotPasswordVerifyOtp = (phone: string, code: string) => api.post('/auth/forgot-password/verify-otp/', { phone, code })
export const forgotPasswordReset = (phone: string, resetToken: string, newPassword: string) => api.post('/auth/forgot-password/reset/', { phone, reset_token: resetToken, new_password: newPassword })

// Patients - export + referral + duplicate check
export const exportPatientsCsv = () => api.get('/patients/export_csv/', { responseType: 'blob' })
export const importPatientsExcel = (formData: FormData) => api.post('/patients/import_excel/', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
export const checkDuplicatePatient = (params: any) => api.get('/patients/check_duplicate/', { params })
export const getReferralLetters = (params?: any) => api.get<PaginatedResponse<ReferralLetter>>('/patients/referrals/', { params })
export const getReferralLetter = (id: number) => api.get<ReferralLetter>(`/patients/referrals/${id}/`)
export const createReferralLetter = (data: any) => {
  const hasFile = data.file instanceof File
  if (hasFile) {
    const formData = new FormData()
    Object.entries(data).forEach(([k, v]) => {
      formData.append(k, v as any)
    })
    return api.post<ReferralLetter>('/patients/referrals/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  }
  return api.post<ReferralLetter>('/patients/referrals/', data)
}
export const deleteReferralLetter = (id: number) => api.delete(`/patients/referrals/${id}/`)

// Support Messages
export const getSupportMessages = (params?: any) => api.get<PaginatedResponse<SupportMessage>>('/patients/support-messages/', { params })
export const createSupportMessage = (data: Partial<SupportMessage>) => {
  const formData = new FormData()
  Object.entries(data).forEach(([k, v]) => {
    if (k === 'attachment' && v instanceof File) {
      formData.append('attachment', v)
    } else if (v !== undefined && v !== null) {
      formData.append(k, v as any)
    }
  })
  return api.post<SupportMessage>('/patients/support-messages/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
export const replySupportMessage = (id: number, reply: string) => api.post(`/patients/support-messages/${id}/reply/`, { reply })
export const downloadSupportAttachment = (id: number) =>
  api.get(`/patients/support-messages/${id}/download_attachment/`, { responseType: 'blob' })

// Appointments - waiting list + report + export
export const getWaitingList = () => api.get('/appointments/waiting_list/')
export const onlineImportAppointment = (data: any) => api.post('/appointments/online_import/', data)
export const getRecordInfo = (id: number) => api.get(`/appointments/${id}/record_info/`)
export const getAppointmentReport = (params?: any) => api.get('/appointments/report/', { params })
export const getPatientGroupedAppointments = (params?: any) => api.get('/appointments/patient_grouped/', { params })
export const exportAppointmentsCsv = () => api.get('/appointments/export_csv/', { responseType: 'blob' })
export const publicBookAppointment = (data: any) => api.post('/appointments/public_book/', data)

// Dashboard - work year & notifications
export const getWorkYearInfo = () => api.get<WorkYearInfo>('/dashboard/work-year/')
export const getNotifications = () => api.get<NotificationsData>('/dashboard/notifications/')
export const createNotification = (data: Partial<NotificationItem>) => api.post('/dashboard/notifications/create/', data)

// Signature
export const uploadSignature = (formData: FormData) =>
  api.patch<User>('/auth/users/upload_signature/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
export const clearSignature = () =>
  api.post('/auth/users/clear_signature/')

// Avatar
export const uploadAvatar = (formData: FormData) =>
  api.patch<User>('/auth/users/upload_avatar/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
export const clearAvatar = () =>
  api.post('/auth/users/clear_avatar/')

// Clinic Settings
export const getClinicSettings = () => api.get<ClinicSettings[]>('/auth/clinic-settings/')
export const updateClinicSettings = (id: number, data: Partial<ClinicSettings>) => api.patch<ClinicSettings>(`/auth/clinic-settings/${id}/`, data)

// Backup
export const getBackups = () => api.get<BackupItem[]>('/backup/')
export const createBackup = () => api.post('/backup/')
export const downloadDatabase = () =>
  api.get('/backup/download-database/', { responseType: 'blob' })
export const fullExportBackup = () =>
  api.get('/backup/full-export/', { responseType: 'blob' })
export const downloadBackup = (filename: string) =>
  api.get(`/backup/download/${filename}/`, { responseType: 'blob' })
export const deleteBackup = (filename: string) => api.delete(`/backup/delete/${filename}/`)
export const restoreBackup = (formData: FormData) =>
  api.post('/backup/restore/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
export const getBackupSchedule = () => api.get<BackupSchedule>('/backup/schedule/')
export const updateBackupSchedule = (data: BackupSchedule) => api.put('/backup/schedule/', data)
export const getBackupLogs = () => api.get('/backup/logs/')

// Email Backup
export const getEmailConfig = () => api.get<EmailConfig>('/backup/email/config/')
export const updateEmailConfig = (data: EmailConfig) => api.put('/backup/email/config/', data)
export const testEmailConnection = () => api.post('/backup/email/test/')
export const sendBackupViaEmail = () => api.post('/backup/email/send/')

// GitHub Backup
export const getGitHubConfig = () => api.get<GitHubConfig>('/backup/github/config/')
export const updateGitHubConfig = (data: Partial<GitHubConfig> & { token?: string }) => api.put('/backup/github/config/', data)
export const testGitHubConnection = (repo?: string, token?: string) => api.post('/backup/github/test/', { repo, token })
export const uploadBackupToGitHub = () => api.post('/backup/github/upload/')

// Roles
export const getRoles = () => api.get<Role[]>('/auth/roles/')
export const getRole = (id: number) => api.get<Role>(`/auth/roles/${id}/`)
export const createRole = (data: Partial<Role>) => api.post<Role>('/auth/roles/', data)
export const updateRole = (id: number, data: Partial<Role>) => api.patch<Role>(`/auth/roles/${id}/`, data)
export const deleteRole = (id: number) => api.delete(`/auth/roles/${id}/`)
export const getAllPermissionsDef = () => api.get<any[]>('/auth/roles/all_permissions/')
export const getDefaultRolePermissions = () => api.get<Record<string, string[]>>('/auth/roles/default_permissions/')

// Patient Tags
export const getPatientTags = () => api.get<PatientTag[]>('/patients/tags/')
export const createPatientTag = (data: { name: string; color: string }) => api.post<PatientTag>('/patients/tags/', data)
export const updatePatientTag = (id: number, data: Partial<PatientTag>) => api.patch<PatientTag>(`/patients/tags/${id}/`, data)
export const deletePatientTag = (id: number) => api.delete(`/patients/tags/${id}/`)

// Patient Tag Assignments
export const getPatientTagAssignments = (patientId?: number) =>
  api.get<any[]>(`/patients/tag-assignments/${patientId ? `?patient=${patientId}` : ''}`)
export const bulkAssignTags = (patientId: number, tagIds: number[]) =>
  api.post('/patients/tag-assignments/bulk_assign/', { patient_id: patientId, tag_ids: tagIds })

// Visit Templates
export const getVisitTemplates = (params?: any) => api.get<VisitTemplate[]>('/medical-records/visit-templates/', { params })
export const createVisitTemplate = (data: Partial<VisitTemplate>) => api.post<VisitTemplate>('/medical-records/visit-templates/', data)
export const updateVisitTemplate = (id: number, data: Partial<VisitTemplate>) => api.patch<VisitTemplate>(`/medical-records/visit-templates/${id}/`, data)
export const deleteVisitTemplate = (id: number) => api.delete(`/medical-records/visit-templates/${id}/`)
export const applyVisitTemplate = (id: number, data: { patient_id: number; appointment_id?: number }) =>
  api.post<MedicalRecord>(`/medical-records/visit-templates/${id}/apply/`, data)

// Health Check
export const getHealthCheck = () => api.get('/health/')

// Patient Identity
export const getPatientIdentity = (patientId: number) =>
  api.get<PatientIdentity[]>('/patient-identity/identities/', { params: { patient: patientId } })
export const createPatientIdentity = (data: any) =>
  api.post<PatientIdentity>('/patient-identity/identities/', data)
export const updatePatientIdentity = (id: number, data: any) =>
  api.patch<PatientIdentity>(`/patient-identity/identities/${id}/`, data)
export const verifyPatientIdentity = (id: number) =>
  api.post<PatientIdentity>(`/patient-identity/identities/${id}/verify/`, { verified: true })
export const registerFingerprint = (id: number, fingerprintData: string) =>
  api.post<PatientIdentity>(`/patient-identity/identities/${id}/register_fingerprint/`, { fingerprint_data: fingerprintData })

// DICOM
export const getDicomFiles = (params?: any) => api.get('/medical-records/dicom-files/', { params })
export const getDicomFile = (id: number) => api.get(`/medical-records/dicom-files/${id}/`)
export const uploadDicomFile = (formData: FormData) =>
  api.post('/medical-records/dicom-files/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
export const deleteDicomFile = (id: number) => api.delete(`/medical-records/dicom-files/${id}/`)
export const downloadDicomFile = (id: number) =>
  api.get(`/medical-records/dicom-files/${id}/download/`, { responseType: 'blob' })
export const viewDicomImage = (id: number) =>
  api.get(`/medical-records/dicom-files/${id}/view_image/`, { responseType: 'blob' })

// ── Online Booking ──
export const getClinicInfo = () => api.get('/online-booking/clinic-info/')
export const getBookingServices = () => api.get('/online-booking/services/')
export const patientLookup = (nationalId: string) =>
  api.get(`/online-booking/patient-lookup/?national_id=${nationalId}`)
export const getAvailableTimes = (serviceId: number, date: string) =>
  api.get(`/online-booking/available-times/?service_id=${serviceId}&date=${date}`)
export const createBooking = (data: any) =>
  api.post('/online-booking/create-booking/', data)
export const myAppointments = (nationalId: string) =>
  api.get(`/online-booking/my-appointments/?national_id=${nationalId}`)
export const getHolidays = () => api.get('/online-booking/public-holidays/')
export const createHoliday = (data: any) => api.post('/online-booking/holidays/', data)
export const updateHoliday = (id: number, data: any) =>
  api.put(`/online-booking/holidays/${id}/`, data)
export const deleteHoliday = (id: number) =>
  api.delete(`/online-booking/holidays/${id}/`)
export const getOnlineBookingSettings = () => api.get('/online-booking/settings/')
export const updateOnlineBookingSettings = (data: any) =>
  api.put('/online-booking/settings/', data)


