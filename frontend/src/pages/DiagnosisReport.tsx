import React from 'react'
import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getDiagnosisReport, getDiagnosisReportPdf, getDoctors } from '../services/api'
import { toPersianDigits, formatMoney } from '../utils/jalali'
import JalaliDateInput from '../components/JalaliDateInput'

export default function DiagnosisReport() {
  const navigate = useNavigate()
  const [report, setReport] = useState<any>(null)
  const [doctors, setDoctors] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [filters, setFilters] = useState<any>({ date_from: '', date_to: '', doctor: '' })

  const load = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (filters.date_from) params.date_from = filters.date_from
      if (filters.date_to) params.date_to = filters.date_to
      if (filters.doctor) params.doctor = filters.doctor
      const { data } = await getDiagnosisReport(params)
      setReport(data)
    } catch { toast.error('متأسفانه در دریافت گزارش خطایی رخ داد ') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filters])
  useEffect(() => {
    getDoctors().then(({ data }: any) => setDoctors(Array.isArray(data) ? data : data.results || [])).catch(() => {})
  }, [])

  const chartData = report?.diagnoses?.map((d: any) => ({
    name: d.diagnosis.length > 20 ? d.diagnosis.substring(0, 20) + '...' : d.diagnosis,
    count: d.count,
    full: d.diagnosis,
  })) || []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-slate-800">گزارش تشخیص‌ها</h1>
      </div>

      <div className="panel">
        <div className="panel-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <select className="input-field" value={filters.doctor} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters({ ...filters, doctor: e.target.value })}>
              <option value="">همه پزشکان</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
            </select>
            <JalaliDateInput value={filters.date_from} onChange={v => setFilters({ ...filters, date_from: v })} />
            <JalaliDateInput value={filters.date_to} onChange={v => setFilters({ ...filters, date_to: v })} />
            <button onClick={load} className="btn-primary">نمایش گزارش</button>
            <button onClick={() => {
              const params: any = {}
              if (filters.date_from) params.date_from = filters.date_from
              if (filters.date_to) params.date_to = filters.date_to
              if (filters.doctor) params.doctor = filters.doctor
              getDiagnosisReportPdf(params).then(({ data }: any) => {
                const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
                window.open(url)
              }).catch(() => toast.error('خطا در دریافت PDF'))
            }} className="btn-secondary flex items-center gap-1.5">
              PDF
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-500 border-t-transparent" /></div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card text-center">
              <p className="text-sm text-slate-500">کل پرونده‌ها</p>
              <p className="text-2xl font-bold text-brand-600">{formatMoney(report?.total_records || 0)}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-slate-500">تشخیص‌های ثبت شده</p>
              <p className="text-2xl font-bold text-green-600">{formatMoney(report?.total_with_diagnosis || 0)}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-slate-500">تشخیص‌های منحصربفرد</p>
              <p className="text-2xl font-bold text-amber-600">{formatMoney(report?.diagnoses?.length || 0)}</p>
            </div>
          </div>

          {chartData.length > 0 && (
            <div className="card">
              <h3 className="font-bold mb-4">پراکندگی تشخیص‌ها</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v: number) => formatMoney(v)} />
                  <YAxis type="category" dataKey="name" width={150} />
                  <Tooltip formatter={(v: number, n: string, p: any) => [`${toPersianDigits(v)} بار`, p.payload.full]} />
                  <Bar dataKey="count" name="تعداد" fill="#2563eb" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="panel">
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th className="text-center">تشخیص</th>
                  <th className="text-center">تعداد</th>
                </tr></thead>
                <tbody>
                  {report?.diagnoses?.length === 0 ? (
                    <tr><td colSpan={2} className="text-center py-10 text-slate-400">تشخیصی ثبت نشده</td></tr>
                  ) : report?.diagnoses?.map((d: any, idx: number) => (
                    <tr key={idx}>
                      <td className="text-center">{d.diagnosis}</td>
                      <td className="text-center"><span className="badge badge-active">{toPersianDigits(d.count)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {report?.records?.length > 0 && (
            <div className="panel">
              <div className="panel-header">
                <h3>لیست بیماران با تشخیص</h3>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr>
                    <th className="text-center">نام بیمار</th>
                    <th className="text-center">تشخیص</th>
                    <th className="text-center">پرونده</th>
                  </tr></thead>
                  <tbody>
                    {report.records.map((r: any, idx: number) => (
                      <tr key={r.id || idx}>
                        <td className="text-center font-medium">{r.patient__first_name} {r.patient__last_name}</td>
                        <td className="text-center">{r.diagnosis}</td>
                        <td className="text-center">
                          <button onClick={() => navigate(`/medical-records?patient=${r.patient_id}`)}
                            className="text-brand-600 hover:underline text-xs font-bold bg-transparent border-none cursor-pointer">
                            مشاهده پرونده
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
