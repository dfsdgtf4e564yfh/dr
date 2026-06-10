import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import ErrorBoundary from './components/ErrorBoundary'
import { setNavigate } from './services/navigation'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import PatientDetail from './pages/PatientDetail'
import Appointments from './pages/Appointments'
import AppointmentsCalendar from './pages/AppointmentsCalendar'
import MedicalRecords from './pages/MedicalRecords'
import Billing from './pages/Billing'
import BillingReport from './pages/BillingReport'
import DoctorFinance from './pages/DoctorFinance'
import Settlement from './pages/Settlement'
import Users from './pages/Users'
import Backup from './pages/Backup'
import DiagnosisDrugs from './pages/DiagnosisDrugs'
import TmsForm from './pages/TmsForm'
import VisitTemplates from './pages/VisitTemplates'
import DicomViewer from './pages/DicomViewer'
import PersianCalendarPage from './pages/PersianCalendarPage'
import Settings from './pages/Settings'
import WaitingList from './pages/WaitingList'
import Notifications from './pages/Notifications'
import AppointmentReport from './pages/AppointmentReport'
import ReferralLetters from './pages/ReferralLetters'
import DiagnosisReport from './pages/DiagnosisReport'
import SmsTemplates from './pages/SmsTemplates'
import SmsHistory from './pages/SmsHistory'
import BulkSms from './pages/BulkSms'
import PublicBooking from './pages/PublicBooking'
import RoleManagement from './pages/RoleManagement'
import SupportInbox from './pages/SupportInbox'
import DeletedItems from './pages/DeletedItems'
import ActivityLog from './pages/ActivityLog'
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts'
import type { ReactNode } from 'react'

function PrivateRoute({ children, permission }: { children: ReactNode; permission?: string }) {
  const { user, loading, hasPermission } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen bg-surface-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div></div>
  if (!user) return <Navigate to="/" />
  if (permission && !hasPermission(permission)) return <Navigate to="/dashboard" />
  return <>{children}</>
}

function LayoutWithShortcuts() {
  useKeyboardShortcuts()
  return <Layout />
}

function SupportInboxWrapper() {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen bg-surface-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div></div>
  if (!user || (user.role !== 'support' && user.role !== 'rtms')) return <Navigate to="/dashboard" />
  return <SupportInbox />
}

function RootHandler() {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen bg-surface-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div></div>
  if (user) return <Navigate to="/dashboard" />
  return <Login />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootHandler />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/public-book" element={<PublicBooking />} />
      <Route path="*" element={<Navigate to="/" replace />} />
      <Route element={<PrivateRoute><ErrorBoundary><LayoutWithShortcuts /></ErrorBoundary></PrivateRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/patients" element={<PrivateRoute permission="patients"><Patients /></PrivateRoute>} />
        <Route path="/patients/:id" element={<PrivateRoute permission="patients"><PatientDetail /></PrivateRoute>} />
        <Route path="/appointments" element={<PrivateRoute permission="appointments"><Appointments /></PrivateRoute>} />
        <Route path="/appointments/calendar" element={<PrivateRoute permission="appointments_calendar"><AppointmentsCalendar /></PrivateRoute>} />
        <Route path="/medical-records" element={<PrivateRoute permission="medical_records"><MedicalRecords /></PrivateRoute>} />
        <Route path="/billing" element={<PrivateRoute permission="billing"><Billing /></PrivateRoute>} />
        <Route path="/billing/report" element={<PrivateRoute permission="billing_report"><BillingReport /></PrivateRoute>} />
        <Route path="/doctor-finance" element={<PrivateRoute permission="doctor_finance"><DoctorFinance /></PrivateRoute>} />
        <Route path="/settlements" element={<PrivateRoute permission="settlements"><Settlement /></PrivateRoute>} />
        <Route path="/waiting-list" element={<PrivateRoute permission="waiting_list"><WaitingList /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute permission="notifications"><Notifications /></PrivateRoute>} />
        <Route path="/appointments/report" element={<PrivateRoute permission="appointments_report"><AppointmentReport /></PrivateRoute>} />
        <Route path="/referral-letters" element={<PrivateRoute permission="referral_letters"><ReferralLetters /></PrivateRoute>} />
        <Route path="/deleted-items" element={<PrivateRoute permission="patients"><DeletedItems /></PrivateRoute>} />
        <Route path="/activity-log" element={<PrivateRoute permission="settings"><ActivityLog /></PrivateRoute>} />
        <Route path="/diagnosis-report" element={<PrivateRoute permission="diagnosis_report"><DiagnosisReport /></PrivateRoute>} />
        <Route path="/users" element={<PrivateRoute permission="users"><Users /></PrivateRoute>} />
        <Route path="/roles" element={<PrivateRoute permission="roles_manage"><RoleManagement /></PrivateRoute>} />
        <Route path="/backup" element={<PrivateRoute permission="backup"><Backup /></PrivateRoute>} />
        <Route path="/diagnosis-drugs" element={<PrivateRoute permission="diagnosis_drugs"><DiagnosisDrugs /></PrivateRoute>} />
        <Route path="/tms-forms" element={<PrivateRoute permission="medical_records"><TmsForm /></PrivateRoute>} />
        <Route path="/tms-forms/new" element={<PrivateRoute permission="medical_records"><TmsForm /></PrivateRoute>} />
        <Route path="/visit-templates" element={<PrivateRoute permission="medical_record_templates"><VisitTemplates /></PrivateRoute>} />
        <Route path="/dicom-viewer" element={<PrivateRoute permission="dicom_viewer"><DicomViewer /></PrivateRoute>} />
        <Route path="/dicom-viewer/:patientId" element={<PrivateRoute permission="dicom_viewer"><DicomViewer /></PrivateRoute>} />
        <Route path="/calendar" element={<PrivateRoute permission="calendar_view"><PersianCalendarPage /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute permission="settings"><Settings /></PrivateRoute>} />
        <Route path="/sms-templates" element={<PrivateRoute permission="settings"><SmsTemplates /></PrivateRoute>} />
        <Route path="/sms-history" element={<PrivateRoute permission="settings"><SmsHistory /></PrivateRoute>} />
        <Route path="/bulk-sms" element={<PrivateRoute permission="settings"><BulkSms /></PrivateRoute>} />
        <Route path="/support-inbox" element={<PrivateRoute permission="support_inbox"><SupportInboxWrapper /></PrivateRoute>} />
      </Route>
    </Routes>
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
