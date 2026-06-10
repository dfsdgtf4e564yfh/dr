import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Image, Upload, ZoomIn, ZoomOut, Download, Info, Trash2, ChevronLeft, ChevronRight, X, Maximize2, Sun, Moon } from 'lucide-react'
import { getDicomFiles, uploadDicomFile, deleteDicomFile, getPatients } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { toPersianDigits } from '../utils/jalali'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Modal from '../components/Modal'

export default function DicomViewer() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { hasRole, hasPermission } = useAuth()
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<any>(null)
  const [zoom, setZoom] = useState(100)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [showInfo, setShowInfo] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadPatient, setUploadPatient] = useState('')
  const [uploadPatientId, setUploadPatientId] = useState<number | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [patients, setPatients] = useState<any[]>([])
  const [patientSearch, setPatientSearch] = useState('')

  const patientFilter = searchParams.get('patient')

  useEffect(() => {
    const params: any = {}
    if (patientFilter) params.patient = patientFilter
    getDicomFiles(params).then(({ data }: any) => {
      setFiles(Array.isArray(data) ? data : data.results || [])
    }).catch(() => toast.error('خطا در دریافت فایل‌های DICOM'))
      .finally(() => setLoading(false))
  }, [patientFilter])

  const searchPatients = async (q: string) => {
    if (q.length < 2) return
    try {
      const { data } = await getPatients({ search: q, page_size: 10 })
      setPatients(Array.isArray(data) ? data : data.results || [])
    } catch { /* ignore */ }
  }

  const handleUpload = async () => {
    if (!uploadFile || !uploadPatientId) {
      toast.error('بیمار و فایل را انتخاب کنید')
      return
    }
    const formData = new FormData()
    formData.append('file', uploadFile)
    formData.append('patient', String(uploadPatientId))
    try {
      await uploadDicomFile(formData)
      toast.success('فایل DICOM با موفقیت آپلود شد')
      setShowUpload(false)
      setUploadFile(null)
      setUploadPatientId(null)
      setUploadPatient('')
      const { data } = await getDicomFiles(patientFilter ? { patient: patientFilter } : {})
      setFiles(Array.isArray(data) ? data : data.results || [])
    } catch { toast.error('خطا در آپلود فایل') }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteDicomFile(id)
      setFiles(files.filter(f => f.id !== id))
      if (selectedFile?.id === id) setSelectedFile(null)
      toast.success('فایل حذف شد')
    } catch { toast.error('خطا در حذف فایل') }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="نمایشگر DICOM">
        {hasPermission('dicom_viewer') && (
          <Button onClick={() => setShowUpload(true)} variant="gradient" icon={Upload}>آپلود DICOM</Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1 space-y-3">
          <h3 className="font-bold text-surface-700 text-sm">فایل‌های DICOM</h3>
          {loading ? (
            <div className="text-center py-8 text-surface-400">در حال بارگذاری...</div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-surface-400">فایلی یافت نشد</div>
          ) : (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto">
              {files.map(f => (
                <div key={f.id}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedFile?.id === f.id
                      ? 'border-brand-500 bg-brand-50/50'
                      : 'border-surface-200 hover:border-surface-300 bg-white'
                  }`}
                  onClick={() => { setSelectedFile(f); setZoom(100); setBrightness(100); setContrast(100); setShowInfo(false) }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Image size={14} className="text-brand-500 shrink-0" />
                    <span className="text-xs font-medium text-surface-700 truncate">{f.description || 'بدون توضیحات'}</span>
                  </div>
                  <div className="text-[10px] text-surface-400 space-y-0.5">
                    <div>{f.patient_name}</div>
                    {f.modality && <div>مودالیته: {f.modality}</div>}
                    <div>{new Date(f.created_at).toLocaleDateString('fa-IR')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          {selectedFile ? (
            <div className="card p-0 overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-surface-100 bg-surface-50/50">
                <div className="flex items-center gap-2">
                  <button onClick={() => setZoom(z => Math.max(25, z - 25))} className="action-btn" title="کوچک‌نمایی"><ZoomOut size={16} /></button>
                  <span className="text-xs font-bold text-surface-600 min-w-[50px] text-center">{toPersianDigits(zoom)}%</span>
                  <button onClick={() => setZoom(z => Math.min(400, z + 25))} className="action-btn" title="بزرگ‌نمایی"><ZoomIn size={16} /></button>
                  <div className="w-px h-5 bg-surface-200 mx-2" />
                  <Sun size={13} className="text-surface-400" />
                  <input type="range" min="25" max="200" value={brightness} onChange={e => setBrightness(Number(e.target.value))}
                    className="w-20 h-1 accent-brand-500" />
                  <Moon size={13} className="text-surface-400" />
                  <div className="w-px h-5 bg-surface-200 mx-2" />
                  <button onClick={() => setShowInfo(!showInfo)} className={`action-btn ${showInfo ? 'text-brand-500' : ''}`} title="اطلاعات"><Info size={16} /></button>
                </div>
                <div className="flex items-center gap-2">
                  <a href={`${process.env.REACT_APP_API_URL || ''}/api/medical-records/dicom-files/${selectedFile.id}/download/`}
                    target="_blank" rel="noopener noreferrer" className="action-btn" title="دانلود"><Download size={16} /></a>
                  {hasPermission('dicom_viewer') && (
                    <button onClick={() => handleDelete(selectedFile.id)} className="action-btn danger" title="حذف"><Trash2 size={16} /></button>
                  )}
                </div>
              </div>

              <div className="flex relative" style={{ minHeight: '60vh' }}>
                <div className="flex-1 flex items-center justify-center bg-surface-900/5 overflow-hidden p-4">
                  <img src={`${process.env.REACT_APP_API_URL || ''}/api/medical-records/dicom-files/${selectedFile.id}/view_image/`}
                    alt="DICOM"
                    className="max-w-full max-h-[70vh] transition-all duration-200"
                    style={{
                      transform: `scale(${zoom / 100})`,
                      filter: `brightness(${brightness / 100}) contrast(${contrast / 100})`,
                    }} />
                </div>

                {showInfo && (
                  <div className="w-64 border-r border-surface-200 p-4 bg-surface-50/50 overflow-y-auto text-xs space-y-2 shrink-0">
                    <h4 className="font-bold text-surface-700 mb-2">متادیتا</h4>
                    {selectedFile.metadata && Object.entries(selectedFile.metadata).map(([key, val]: any) => (
                      <div key={key} className="flex justify-between gap-2">
                        <span className="text-surface-400 font-medium">{key}:</span>
                        <span className="text-surface-700 text-left" dir="ltr">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card flex items-center justify-center" style={{ minHeight: '60vh' }}>
              <div className="text-center text-surface-400 space-y-2">
                <Image size={48} className="mx-auto opacity-40" />
                <p>یک فایل را از لیست انتخاب کنید</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal open={showUpload} onClose={() => setShowUpload(false)} title="آپلود فایل DICOM">
        <div className="space-y-4">
          <div>
            <label className="label">بیمار</label>
            <input type="text" className="input-field" placeholder="جستجوی بیمار..." value={uploadPatient}
              onChange={e => { setUploadPatient(e.target.value); searchPatients(e.target.value) }} />
            {patients.length > 0 && (
              <div className="mt-1 border border-surface-200 rounded-xl overflow-hidden">
                {patients.map(p => (
                  <div key={p.id} onClick={() => { setUploadPatientId(p.id); setUploadPatient(`${p.first_name} ${p.last_name}`); setPatients([]) }}
                    className="px-3 py-2 text-sm hover:bg-surface-50 cursor-pointer border-b border-surface-100 last:border-0">
                    {p.first_name} {p.last_name} - {toPersianDigits(p.national_id)}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="label">فایل DICOM</label>
            <input type="file" accept=".dcm,.DCM" onChange={e => setUploadFile(e.target.files?.[0] || null)}
              className="input-field" />
            {uploadFile && <p className="text-xs text-surface-400 mt-1">{uploadFile.name} ({Math.round(uploadFile.size / 1024)} KB)</p>}
          </div>
          <Button onClick={handleUpload} variant="gradient" className="w-full" icon={Upload}>آپلود</Button>
        </div>
      </Modal>
    </div>
  )
}
