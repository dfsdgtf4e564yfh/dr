import{cc as i,bh as A,bW as t,cE as n,F as j,cC as r,aX as I,B as D}from"./index-DnqYjpHt.js";import{J as v}from"./JalaliDateInput-DyxKvo1R.js";import{P as E}from"./printer-D-l9Qu1S.js";import"./calendar-days-DlbXYl41.js";function L(){var p,f,m,h;const[s,y]=i.useState(null),[N,c]=i.useState(!1),[x,w]=i.useState(()=>parseInt(localStorage.getItem("printCount")||"0")),[z,_]=i.useState([]),[a,o]=i.useState({date_from:"",date_to:"",doctor:"",status:""}),C=i.useRef(null);i.useEffect(()=>{A().then(({data:e})=>_(Array.isArray(e)?e:e.results||[])).catch(()=>{})},[]);const $=async()=>{c(!0);try{const e={};a.date_from&&(e.date_from=a.date_from),a.date_to&&(e.date_to=a.date_to),a.doctor&&(e.doctor=a.doctor),a.status&&(e.status=a.status);const{data:d}=await I(e);y(d)}catch{D.error("متأسفانه در دریافت گزارش خطایی رخ داد ")}finally{c(!1)}},S=()=>{var b,g,u;const e=x+1;w(e),localStorage.setItem("printCount",e.toString());const d=window.open("","","width=1000,height=700"),V={completed:"انجام شده",cancelled:"لغو شده",scheduled:"نوبت‌گذاری شده",rescheduled:"تغییر یافته"},k=((s==null?void 0:s.appointments)||[]).map(l=>`
      <tr>
        <td style="padding:7px 10px;border:1px solid #e2e8f0;text-align:right;font-size:11px;color:#1e293b">${l.patient_name}</td>
        <td style="padding:7px 10px;border:1px solid #e2e8f0;text-align:right;font-size:11px;color:#1e293b">${l.doctor_name}</td>
        <td style="padding:7px 10px;border:1px solid #e2e8f0;text-align:center;font-size:11px;color:#1e293b;font-weight:700">${r(l.date)}</td>
        <td style="padding:7px 10px;border:1px solid #e2e8f0;text-align:center;font-size:11px;color:#1e293b">${l.time}</td>
        <td style="padding:7px 10px;border:1px solid #e2e8f0;text-align:center;font-size:11px">
          <span style="display:inline-block;padding:2px 8px;font-size:8px;font-weight:700;${l.status==="completed"?"color:#0f766e":l.status==="cancelled"?"color:#991b1b":l.status==="scheduled"?"color:#1e3a5f":"color:#92400e"}">${V[l.status]}</span>
        </td>
      </tr>
    `).join(""),R=r(new Date().toISOString().split("T")[0]);d.document.write(`<html dir="rtl"><head><title>گزارش نوبت‌ها</title>
    <style>
      @page { size: A4; margin: 1cm; }
      @font-face { font-family: 'Vazirmatn'; font-weight: 300; src: url('/fonts/webfonts/Vazirmatn-Light.woff2') format('woff2'); }
      @font-face { font-family: 'Vazirmatn'; font-weight: 400; src: url('/fonts/webfonts/Vazirmatn-Medium.woff2') format('woff2'); }
      @font-face { font-family: 'Vazirmatn'; font-weight: 700; src: url('/fonts/webfonts/Vazirmatn-Bold.woff2') format('woff2'); }
      @font-face { font-family: 'Vazirmatn'; font-weight: 900; src: url('/fonts/webfonts/Vazirmatn-ExtraBold.woff2') format('woff2'); }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Vazirmatn', Tahoma, Arial, sans-serif; font-size: 10px; color: #1e293b; line-height: 1.8; }
      .print-frame { border: 2px solid #000; padding: 20px; min-height: 100%; }
      .brand { text-align: center; padding-bottom: 12px; margin-bottom: 16px; position: relative; }
      .brand::after { content: ''; position: absolute; bottom: 0; right: 30%; left: 30%; height: 1px; background: linear-gradient(90deg, transparent, #94a3b8, transparent); }
      .brand h1 { font-size: 16px; font-weight: 700; color: #1e3a5f; letter-spacing: 1px; }
      .brand .sub { font-size: 9px; color: #64748b; font-weight: 300; }
      .brand .date-badge { display: inline-block; margin-top: 4px; padding: 2px 12px; background: #f1f5f9; color: #475569; font-size: 8px; font-weight: 700; border-radius: 10px; }
      .stats-row { display: flex; gap: 10px; margin-bottom: 18px; }
      .stat-box { flex: 1; border: 1px solid #e2e8f0; padding: 10px; text-align: center; background: #fafafa; }
      .stat-box .num { font-size: 20px; font-weight: 900; line-height: 1.2; }
      .stat-box .lbl { font-size: 8px; color: #94a3b8; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
      table { width: 100%; border-collapse: collapse; }
      thead th { background: #f8fafc; color: #475569; padding: 6px 8px; font-size: 8px; font-weight: 700; text-align: right; border-bottom: 1px solid #e2e8f0; }
      tbody td { padding: 5px 8px; border-bottom: 1px solid #f1f5f9; font-size: 9px; color: #334155; }
      tbody tr:last-child td { border-bottom: none; }
      .footer { margin-top: 20px; padding-top: 8px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 8px; color: #cbd5e1; }
      @media print { body { margin: 0; padding: 0; } .print-frame { border: 2px solid #000; padding: 20px; } }
    </style></head>
    <body>
      <div class="print-frame">
        <div class="brand">
          <h1>مطب تخصصی دکتر محمد طاهری</h1>
          <div class="sub">کلینیک تخصصی مغز و اعصاب و روان — گزارش نوبت‌ها</div>
          <div class="date-badge">تاریخ گزارش: ${R}</div>
        </div>
        <div class="stats-row">
          <div class="stat-box">
            <div class="num" style="color:#1e3a5f">${n((s==null?void 0:s.total)||0)}</div>
            <div class="lbl">کل نوبت‌ها</div>
          </div>
          <div class="stat-box">
            <div class="num" style="color:#0f766e">${n(((b=s==null?void 0:s.by_status)==null?void 0:b.completed)||0)}</div>
            <div class="lbl">انجام شده</div>
          </div>
          <div class="stat-box">
            <div class="num" style="color:#991b1b">${n(((g=s==null?void 0:s.by_status)==null?void 0:g.cancelled)||0)}</div>
            <div class="lbl">لغو شده</div>
          </div>
          <div class="stat-box">
            <div class="num" style="color:#1e3a5f">${n(((u=s==null?void 0:s.by_status)==null?void 0:u.scheduled)||0)}</div>
            <div class="lbl">نوبت‌گذاری شده</div>
          </div>
        </div>
        <table>
          <thead><tr>
            <th style="text-align:right">بیمار</th>
            <th style="text-align:right">پزشک / درمانگر</th>
            <th style="text-align:center">تاریخ</th>
            <th style="text-align:center">ساعت</th>
            <th style="text-align:center">وضعیت</th>
          </tr></thead>
          <tbody>
            ${k||'<tr><td colspan="5" style="text-align:center;padding:16px;color:#cbd5e1;font-size:9px">نوبتی یافت نشد</td></tr>'}
          </tbody>
        </table>
        <div class="footer">این گزارش توسط سامانه مدیریت کلینیک دکتر طاهری تهیه شده است</div>
      </div>
    </body></html>`),d.document.close(),d.print()};return t.jsxs("div",{className:"space-y-5",children:[t.jsxs("div",{className:"flex items-center justify-between",children:[t.jsx("h1",{className:"text-xl font-extrabold text-slate-800",children:"گزارش نوبت‌ها"}),t.jsxs("button",{onClick:S,className:"btn-secondary flex items-center gap-2",disabled:!s,children:[t.jsx(E,{size:16})," چاپ گزارش ",t.jsxs("span",{className:"text-xs text-slate-400",children:["(",n(x),")"]})]})]}),t.jsx("div",{className:"panel card-iranian",children:t.jsx("div",{className:"panel-body",children:t.jsxs("div",{className:"flex flex-wrap gap-3 items-end",children:[t.jsxs("div",{className:"flex-1 min-w-[160px]",children:[t.jsx("label",{className:"label",children:"از تاریخ"}),t.jsx(v,{value:a.date_from,onChange:e=>o({...a,date_from:e})})]}),t.jsxs("div",{className:"flex-1 min-w-[160px]",children:[t.jsx("label",{className:"label",children:"تا تاریخ"}),t.jsx(v,{value:a.date_to,onChange:e=>o({...a,date_to:e})})]}),t.jsxs("div",{className:"flex-1 min-w-[160px]",children:[t.jsx("label",{className:"label",children:"پزشک / درمانگر"}),t.jsxs("select",{className:"input-field w-full",value:a.doctor,onChange:e=>o({...a,doctor:e.target.value}),children:[t.jsx("option",{value:"",children:"همه پزشکان"}),z.map(e=>t.jsxs("option",{value:e.id,children:[e.first_name," ",e.last_name]},e.id))]})]}),t.jsxs("div",{className:"flex-1 min-w-[160px]",children:[t.jsx("label",{className:"label",children:"وضعیت"}),t.jsxs("select",{className:"input-field w-full",value:a.status,onChange:e=>o({...a,status:e.target.value}),children:[t.jsx("option",{value:"",children:"همه"}),t.jsx("option",{value:"scheduled",children:"نوبت‌گذاری شده"}),t.jsx("option",{value:"completed",children:"انجام شده"}),t.jsx("option",{value:"cancelled",children:"لغو شده"})]})]}),t.jsxs("button",{onClick:$,className:"btn-primary flex items-center gap-2 self-end py-2.5",children:[t.jsx(j,{size:16})," نمایش گزارش"]})]})})}),N?t.jsx("div",{className:"flex justify-center py-10",children:t.jsx("div",{className:"animate-spin rounded-full h-10 w-10 border-2 border-brand-500 border-t-transparent"})}):s?t.jsxs("div",{ref:C,className:"max-w-5xl mx-auto space-y-5",children:[t.jsxs("div",{className:"grid grid-cols-3 gap-4",children:[t.jsxs("div",{className:"card text-center",children:[t.jsx("p",{className:"text-xs text-slate-400",children:"کل نوبت‌ها"}),t.jsx("p",{className:"text-2xl font-extrabold text-brand-500",children:n(s.total)})]}),t.jsxs("div",{className:"card text-center",children:[t.jsx("p",{className:"text-xs text-slate-400",children:"انجام شده"}),t.jsx("p",{className:"text-2xl font-extrabold text-green-500",children:n(((p=s.by_status)==null?void 0:p.completed)||0)})]}),t.jsxs("div",{className:"card text-center",children:[t.jsx("p",{className:"text-xs text-slate-400",children:"لغو شده"}),t.jsx("p",{className:"text-2xl font-extrabold text-red-500",children:n(((f=s.by_status)==null?void 0:f.cancelled)||0)})]})]}),t.jsx("div",{className:"panel card-iranian",children:t.jsx("div",{className:"table-wrap",children:t.jsxs("table",{children:[t.jsx("thead",{children:t.jsxs("tr",{children:[t.jsx("th",{className:"text-center",children:"بیمار"}),t.jsx("th",{className:"text-center",children:"پزشک / درمانگر"}),t.jsx("th",{className:"text-center",children:"تاریخ"}),t.jsx("th",{className:"text-center",children:"ساعت"}),t.jsx("th",{className:"text-center",children:"وضعیت"})]})}),t.jsx("tbody",{children:((m=s.appointments)==null?void 0:m.length)===0?t.jsx("tr",{children:t.jsx("td",{colSpan:5,className:"text-center py-8 text-slate-400",children:"نوبتی یافت نشد"})}):(h=s.appointments)==null?void 0:h.map(e=>t.jsxs("tr",{children:[t.jsx("td",{className:"text-center",children:e.patient_name}),t.jsx("td",{className:"text-center",children:e.doctor_name}),t.jsx("td",{className:"text-center font-bold",children:r(e.date)}),t.jsx("td",{className:"text-center",children:e.time}),t.jsx("td",{className:"text-center",children:t.jsx("span",{className:`px-2 py-1 rounded-full text-xs font-medium ${e.status==="completed"?"bg-green-100 text-green-700":e.status==="cancelled"?"bg-red-100 text-red-700":e.status==="scheduled"?"bg-blue-100 text-blue-700":"bg-amber-100 text-amber-700"}`,children:e.status==="completed"?"انجام شده":e.status==="cancelled"?"لغو شده":e.status==="rescheduled"?"تغییر یافته":"نوبت‌گذاری شده"})})]},e.id))})]})})})]}):t.jsxs("div",{className:"card text-center py-12 text-slate-400",children:[t.jsx(j,{size:48,className:"mx-auto text-slate-200 mb-3"}),"پارامترهای گزارش را وارد کنید"]})]})}export{L as default};
