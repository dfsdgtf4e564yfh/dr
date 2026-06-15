// ==================== User & Auth ====================
export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: 'admin' | 'doctor' | 'psychologist' | 'reception' | 'rtms' | 'support' | 'super_support'
  phone: string
  specialization?: string
  medical_council_number?: string
  page_permissions?: string[]
  avatar?: string
  signature?: string
  profile_completed?: boolean
  is_active?: boolean
  created_at?: string
  commission_percentage?: number
  two_factor_enabled?: boolean
  totp_secret?: string
  totp_enabled?: boolean
}

export interface LoginResponse {
  access: string
  refresh: string
  requires_2fa?: boolean
  method?: 'totp' | 'sms'
  phone?: string
  message?: string
}

export interface TotpSetupResponse {
  enabled: boolean
  secret?: string
  provisioning_uri?: string
  qr_code?: string
  message?: string
}

export interface LoginPayload {
  username: string
  password: string
  otp_step?: 'verify'
  code?: string
}

export interface ChangePasswordPayload {
  old_password: string
  new_password: string
}

// ==================== Patient ====================
export interface PatientTag {
  id: number
  name: string
  color: string
  is_active?: boolean
}

export interface Patient {
  id: number
  first_name: string
  last_name: string
  father_name?: string
  national_id: string
  gender: 'male' | 'female'
  phone: string
  emergency_phone?: string
  birth_date?: string
  education?: string
  job?: string
  address?: string
  medical_history?: string
  routine_medications?: string
  insurance_booklet: string
  old_file_number?: string
  file_number?: string
  first_visit_date?: string
  created_at?: string
  age?: { years: number; months: number; days: number }
  tags?: PatientTag[]
}

export interface PatientFormData {
  first_name: string
  last_name: string
  gender: string
  father_name: string
  national_id: string
  old_file_number: string
  insurance_booklet: string
  education: string
  job: string
  phone: string
  emergency_phone: string
  birth_date?: string
  first_visit_date?: string
  routine_medications: string
  address: string
  medical_history: string
  [key: string]: any
}

// ==================== Appointment ====================
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'

export interface Appointment {
  id: number
  patient: number
  patient_name: string
  doctor: number
  doctor_name: string
  date: string
  time: string
  status: AppointmentStatus
  treatment_type?: number
  treatment_name?: string
  cost?: number
  notes?: string
  created_at?: string
}

export interface AppointmentPayload {
  patient: number
  doctor: number
  date: string
  time: string
  treatment_type?: number
  cost?: number
  notes?: string
}

// ==================== Medical Record ====================
export interface MedicalRecord {
  id: number
  patient: number
  patient_name: string
  doctor: number
  doctor_name: string
  date: string
  session_number: number
  diagnosis?: string
  treatment_plan?: string
  prescription?: string
  notes?: string
  voice_note?: string
  voice_transcription?: string
  files?: RecordFile[]
  created_at?: string
  patient_national_id?: string
  patient_file_number?: string
}

export interface RecordFile {
  id: number
  file: string
  description?: string
  uploaded_at?: string
}

export interface CommonDiagnosis {
  id: number
  name: string
  title?: string
  code?: string
  category?: string
}

export interface CommonDrug {
  id: number
  name: string
  dosage?: string
  category?: string
  default_dosage?: string
  dosage_unit?: string
}

// ==================== TMS Form ====================
export interface TmsForm {
  id: number
  patient: number
  patient_name?: string
  doctor: number
  date: string
  responses: Record<string, any>
  notes?: string
}

// ==================== Billing ====================
export type BillingStatus = 'paid' | 'partial' | 'unpaid'
export type PaymentMethod = 'cash' | 'card' | 'insurance' | 'card_to_card'

export interface Billing {
  id: number
  patient: number
  patient_name: string
  appointment?: number
  total_amount: number
  paid_amount: number
  remaining?: number
  status: BillingStatus
  payment_method?: PaymentMethod
  cost_type?: string
  doctor_share?: number
  description?: string
  payment_url?: string
  authority?: string
  ref_id?: string
  created_at?: string
}

export interface BillingPayload {
  patient: number
  total_amount: number
  paid_amount?: number
  payment_method?: PaymentMethod
  cost_type?: string
  description?: string
  doctor?: number
  appointment?: number
  status?: string
}

// ==================== Settlement ====================
export interface Settlement {
  id: number
  doctor: number
  doctor_name?: string
  amount: number
  status: string
  date: string
  description?: string
}

// ==================== Dashboard ====================
export interface DashboardStats {
  patients_this_month: number
  monthly_income: number
  pending_billings: number
  yearly_income: number
}

export interface MonthlyIncomeItem {
  month: number
  total: number
  paid: number
}

export interface DoctorIncomeItem {
  name: string
  value: number
}

export interface PatientsTrendItem {
  date: string
  count: number
}

export interface AlertItem {
  id: number
  patient_name: string
  doctor_name?: string
  amount?: number
  time?: string
}

export interface AlertsData {
  unpaid_billings: AlertItem[]
  today_appointments: AlertItem[]
}

export interface WorkYearInfo {
  jalali_year: number
  patients_count: number
  appointments_count: number
  total_income?: number
  total_paid?: number
}

// ==================== Notification ====================
export interface NotificationItem {
  id: number
  title: string
  message?: string
  is_read: boolean
  created_at?: string
}

export interface NotificationsData {
  today_appointments?: Appointment[]
  unpaid_billings?: Billing[]
  reminders?: any[]
  stored_notifications?: NotificationItem[]
}

// ==================== SMS ====================
export interface SmsTemplate {
  id: number
  name: string
  content: string
  type?: string
}

export interface SmsSettings {
  sms_api_key?: string
  sms_line_number?: string
  sms_provider?: string
  send_confirm?: boolean
  send_reminder?: boolean
}

export interface SmsLog {
  id: number
  recipient: string
  message: string
  status: string
  created_at?: string
}

// ==================== Referral ====================
// ==================== Patient Identity ====================
export interface PatientIdentity {
  id: number
  patient: number
  patient_name: string
  id_card_number: string
  id_card_serial: string
  birth_place: string
  nationality: string
  religion: string
  blood_type: string
  emergency_contact_name: string
  emergency_contact_relation: string
  emergency_contact_phone: string
  fingerprint_hash?: string
  fingerprint_data?: string
  notes: string
  verified_at?: string
  verified_by?: number
  verified_by_name?: string
  created_at: string
  updated_at: string
}

export interface ReferralLetter {
  id: number
  patient: number
  patient_name?: string
  from_doctor: number
  to_doctor: string
  to_doctor_name?: string
  description: string
  file?: string
  created_at?: string
  patient_gender?: string
  to_user_name?: string
  date?: string
  status?: string
  from_doctor_name?: string
  from_doctor_signature?: string
}

// ==================== Support Message ====================
export interface SupportMessage {
  id: number
  user: number
  user_name?: string
  message: string
  reply?: string
  is_read: boolean
  created_at?: string
  attachment?: string
  attachment_url?: string
  attachment_name?: string
}

// ==================== Clinic Settings ====================
export interface ClinicSettings {
  id?: number
  name?: string
  phone?: string
  phone2?: string
  phone3?: string
  address?: string
  logo?: string
  primary_color?: string
  secondary_color?: string
  clinic_name?: string
}

// ==================== Backup ====================
export interface BackupItem {
  filename: string
  size: number
  created_at: string
}

export interface BackupSchedule {
  enabled: boolean
  interval_hours: number
  time?: string
}

export interface EmailConfig {
  host?: string
  port?: number
  username?: string
  password?: string
  use_tls?: boolean
  recipient?: string
  smtp_host?: string
  smtp_port?: number
  sender_email?: string
  recipient_email?: string
  auto_send?: boolean
  has_password?: boolean
  last_sent_at?: string
}

export interface GitHubConfig {
  repo: string
  has_token: boolean
  oauth_connected: boolean
  github_user: string
  has_client_id: boolean
  auto_upload: boolean
  keep_last_n: number
  last_upload_at?: string
  last_upload_file?: string
  last_upload_status?: string
}

export interface GitHubRepo {
  full_name: string
  name: string
  private: boolean
  description: string
  html_url: string
  default_branch: string
}

export interface GitHubReposResponse {
  repos: GitHubRepo[]
  github_user: string
  connected: boolean
}

// ==================== API ====================
export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ApiError {
  response?: {
    data?: Record<string, string | string[]>
    status?: number
  }
}

// ==================== App Config ====================
export interface AppConfig {
  API_BASE_URL?: string
  app_title?: string
  favicon?: string
  primary_color?: string
  secondary_color?: string
}

// ==================== WebSocket ====================
export interface WebSocketMessage {
  type: string
  [key: string]: any
}

// ==================== Role ====================
export interface Role {
  id: number
  name: string
  description?: string
  permissions: string[]
  is_system_role: boolean
  is_active: boolean
  created_at?: string
  updated_at?: string
  user_count?: number
}

// ==================== Visit Templates ====================
// ==================== Messenger ====================
export interface MessengerSetting {
  messenger_type: 'bale'
  name: string
  bot_token: string
  chat_id: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface MessengerLog {
  id: number
  messenger_type: string
  recipient: string
  message: string
  status: string
  message_id: string
  error_message: string
  created_at?: string
}

export interface VisitTemplate {
  id: number
  title: string
  category: 'neurology' | 'psychiatry' | 'general'
  diagnosis_template: string
  treatment_plan_template: string
  notes_template: string
  prescription_template: string
  is_active: boolean
  created_by: number
  created_by_name?: string
  created_at: string
  updated_at: string
}

// ==================== Navigation ====================
export interface NavItem {
  to: string
  label: string
  icon?: React.ComponentType<any>
  permission?: string
  end?: boolean
}
