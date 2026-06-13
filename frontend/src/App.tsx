import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import { setNavigate } from './services/navigation'
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts'
import type { ReactNode } from 'react'

const Login = lazy(() => import('./pages/Login'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Patients = lazy(() => import('./pages/Patients'))
const PatientDetail = lazy(() => import('./pages/PatientDetail'))
const Appointments = lazy(() => import('./pages/Appointments'))
const AppointmentsCalendar = lazy(() => import('./pages/AppointmentsCalendar'))
const MedicalRecords = lazy(() => import('./pages/MedicalRecords'))
const Billing = lazy(() => import('./pages/Billing'))
const BillingReport = lazy(() => import('./pages/BillingReport'))
const DoctorFinance = lazy(() => import('./pages/DoctorFinance'))
const Settlement = lazy(() => import('./pages/Settlement'))
const Users = lazy(() => import('./pages/Users'))
const Backup = lazy(() => import('./pages/Backup'))
const DiagnosisDrugs = lazy(() => import('./pages/DiagnosisDrugs'))
const TmsForm = lazy(() => import('./pages/TmsForm'))
const VisitTemplates = lazy(() => import('./pages/VisitTemplates'))
const DicomViewer = lazy(() => import('./pages/DicomViewer'))
const Settings = lazy(() => import('./pages/Settings'))
const WaitingList = lazy(() => import('./pages/WaitingList'))
const Notifications = lazy(() => import('./pages/Notifications'))
const AppointmentReport = lazy(() => import('./pages/AppointmentReport'))
const ReferralLetters = lazy(() => import('./pages/ReferralLetters'))
const DiagnosisReport = lazy(() => import('./pages/DiagnosisReport'))
const SmsTemplates = lazy(() => import('./pages/SmsTemplates'))
const SmsHistory = lazy(() => import('./pages/SmsHistory'))
const BulkSms = lazy(() => import('./pages/BulkSms'))
const PublicBooking = lazy(() => import('./pages/PublicBooking'))
const BookingReceipt = lazy(() => import('./pages/BookingReceipt'))
const BookingInquiry = lazy(() => import('./pages/BookingInquiry'))

const HolidayManagement = lazy(() => import('./pages/HolidayManagement'))
const RoleManagement = lazy(() => import('./pages/RoleManagement'))
const SupportInbox = lazy(() => import('./pages/SupportInbox'))
const DeletedItems = lazy(() => import('./pages/DeletedItems'))
const ActivityLog = lazy(() => import('./pages/ActivityLog'))

function PrivateRoute({ children, permission }: { children: ReactNode; permission?: string }) {
  const { user, loading, hasPermission } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen bg-surface-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div></div>
  if (!user) return <Navigate to="/panel" />
  if (permission && !hasPermission(permission)) return <Navigate to="/panel/dashboard" />
  return <>{children}</>
}

function LayoutWithShortcuts() {
  useKeyboardShortcuts()
  return <Layout />
}

function SupportInboxWrapper() {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen bg-surface-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div></div>
  if (!user || (user.role !== 'support' && user.role !== 'rtms')) return <Navigate to="/panel/dashboard" />
  return <SupportInbox />
}

function PanelHandler() {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen bg-surface-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div></div>
  if (user) return <Navigate to="/panel/dashboard" />
  return <Login />
}

function AppRoutes() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-surface-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div></div>}>
        <Routes>
          <Route path="/" element={<PublicBooking />} />
          <Route path="/booking-result/:trackingCode" element={<BookingReceipt />} />
          <Route path="/booking-inquiry/:nationalId" element={<BookingInquiry />} />
          <Route path="/panel" element={<PanelHandler />} />
          <Route path="/panel/login" element={<Navigate to="/panel" replace />} />
          <Route path="/panel/forgot-password" element={<ForgotPassword />} />
          <Route element={<PrivateRoute><LayoutWithShortcuts /></PrivateRoute>}>
            <Route path="/panel/dashboard" element={<Dashboard />} />
            <Route path="/panel/patients" element={<PrivateRoute permission="patients"><Patients /></PrivateRoute>} />
            <Route path="/panel/patients/:id" element={<PrivateRoute permission="patients"><PatientDetail /></PrivateRoute>} />
            <Route path="/panel/appointments" element={<PrivateRoute permission="appointments"><Appointments /></PrivateRoute>} />
            <Route path="/panel/appointments/calendar" element={<PrivateRoute permission="appointments_calendar"><AppointmentsCalendar /></PrivateRoute>} />
            <Route path="/panel/medical-records" element={<PrivateRoute permission="medical_records"><MedicalRecords /></PrivateRoute>} />
            <Route path="/panel/billing" element={<PrivateRoute permission="billing"><Billing /></PrivateRoute>} />
            <Route path="/panel/billing/report" element={<PrivateRoute permission="billing_report"><BillingReport /></PrivateRoute>} />
            <Route path="/panel/doctor-finance" element={<PrivateRoute permission="doctor_finance"><DoctorFinance /></PrivateRoute>} />
            <Route path="/panel/settlements" element={<PrivateRoute permission="settlements"><Settlement /></PrivateRoute>} />
            <Route path="/panel/waiting-list" element={<PrivateRoute permission="waiting_list"><WaitingList /></PrivateRoute>} />
            <Route path="/panel/notifications" element={<PrivateRoute permission="notifications"><Notifications /></PrivateRoute>} />
            <Route path="/panel/appointments/report" element={<PrivateRoute permission="appointments_report"><AppointmentReport /></PrivateRoute>} />
            <Route path="/panel/referral-letters" element={<PrivateRoute permission="referral_letters"><ReferralLetters /></PrivateRoute>} />
            <Route path="/panel/holidays" element={<PrivateRoute permission="settings"><HolidayManagement /></PrivateRoute>} />
            <Route path="/panel/deleted-items" element={<PrivateRoute permission="patients"><DeletedItems /></PrivateRoute>} />
            <Route path="/panel/activity-log" element={<PrivateRoute permission="settings"><ActivityLog /></PrivateRoute>} />
            <Route path="/panel/diagnosis-report" element={<PrivateRoute permission="diagnosis_report"><DiagnosisReport /></PrivateRoute>} />
            <Route path="/panel/users" element={<PrivateRoute permission="users"><Users /></PrivateRoute>} />
            <Route path="/panel/roles" element={<PrivateRoute permission="roles_manage"><RoleManagement /></PrivateRoute>} />
            <Route path="/panel/backup" element={<PrivateRoute permission="backup"><Backup /></PrivateRoute>} />
            <Route path="/panel/diagnosis-drugs" element={<PrivateRoute permission="diagnosis_drugs"><DiagnosisDrugs /></PrivateRoute>} />
            <Route path="/panel/tms-forms" element={<PrivateRoute permission="medical_records"><TmsForm /></PrivateRoute>} />
            <Route path="/panel/tms-forms/new" element={<PrivateRoute permission="medical_records"><TmsForm /></PrivateRoute>} />
            <Route path="/panel/visit-templates" element={<PrivateRoute permission="medical_record_templates"><VisitTemplates /></PrivateRoute>} />
            <Route path="/panel/dicom-viewer" element={<PrivateRoute permission="dicom_viewer"><DicomViewer /></PrivateRoute>} />
            <Route path="/panel/dicom-viewer/:patientId" element={<PrivateRoute permission="dicom_viewer"><DicomViewer /></PrivateRoute>} />
            <Route path="/panel/settings" element={<PrivateRoute permission="settings"><Settings /></PrivateRoute>} />
            <Route path="/panel/sms-templates" element={<PrivateRoute permission="settings"><SmsTemplates /></PrivateRoute>} />
            <Route path="/panel/sms-history" element={<PrivateRoute permission="settings"><SmsHistory /></PrivateRoute>} />
            <Route path="/panel/bulk-sms" element={<PrivateRoute permission="settings"><BulkSms /></PrivateRoute>} />
            <Route path="/panel/support-inbox" element={<PrivateRoute permission="support_inbox"><SupportInboxWrapper /></PrivateRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

function AppContent() {
  const navigate = useNavigate()
  setNavigate(navigate)
  return (
    <AuthProvider>
      <AppRoutes />
      <ToastContainer position="top-right" rtl icon={({ type }: { type: string }) => {
        switch (type) {
          case 'success': return <CheckCircle size={20} className="text-green-500" />
          case 'error': return <XCircle size={20} className="text-red-500" />
          case 'warning': return <AlertTriangle size={20} className="text-amber-500" />
          case 'info': return <Info size={20} className="text-blue-500" />
          default: return null
        }
      }} />
    </AuthProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
