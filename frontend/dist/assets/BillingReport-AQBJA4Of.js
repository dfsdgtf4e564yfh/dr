import{cc as n,b5 as P,bj as S,bq as B,B as b,bW as t,cE as V,bk as E,aR as i,c0 as A}from"./index-DnqYjpHt.js";import{R as D,a as F,C as I,X as L,Y as M,f as T,B as u}from"./BarChart-B04ImU1a.js";function U(){var m,p;const[e,y]=n.useState(null),[v,w]=n.useState([]),[o,j]=n.useState("monthly"),[N,c]=n.useState(!0),[r,z]=n.useState(parseInt(localStorage.getItem("billingPrintCount")||"0")),[k,C]=n.useState(""),x=n.useRef(null);n.useEffect(()=>{P().then(({data:a})=>{const s=Array.isArray(a)?a[0]:a;s&&s.clinic_name&&C(s.clinic_name)}).catch(()=>{})},[]),n.useEffect(()=>{c(!0),Promise.all([S({period:o}),B()]).then(([a,s])=>{var l;y(a.data),w(Array.isArray(s.data)?s.data:((l=s.data)==null?void 0:l.results)||[])}).catch(()=>b.error("متأسفانه در دریافت گزارش خطایی رخ داد ")).finally(()=>c(!1))},[o]);const _=()=>{var g;if(!x.current)return;const s=window.open("","","width=1000,height=700"),l=A(),f=k||"کلینیک";s.document.write('<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>گزارش مالی</title>'),s.document.write(`
<style>
  @page { margin: 1.5cm 1.2cm; size: A4; }
  @font-face { font-family: 'Vazirmatn'; font-weight: 300; src: url('/fonts/webfonts/Vazirmatn-Light.woff2') format('woff2'); }
  @font-face { font-family: 'Vazirmatn'; font-weight: 400; src: url('/fonts/webfonts/Vazirmatn-Medium.woff2') format('woff2'); }
  @font-face { font-family: 'Vazirmatn'; font-weight: 700; src: url('/fonts/webfonts/Vazirmatn-Bold.woff2') format('woff2'); }
  @font-face { font-family: 'Vazirmatn'; font-weight: 900; src: url('/fonts/webfonts/Vazirmatn-ExtraBold.woff2') format('woff2'); }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Vazirmatn', Tahoma, sans-serif; background: #fff; color: #1e293b; font-size: 11px; line-height: 1.7; }
  .print-frame { border: 2px solid #000; padding: 24px; }

  .brand { text-align: center; padding-bottom: 14px; margin-bottom: 16px; position: relative; }
  .brand::after { content: ''; position: absolute; bottom: 0; right: 30%; left: 30%; height: 1px; background: linear-gradient(90deg, transparent, #94a3b8, transparent); }
  .brand h1 { font-size: 18px; font-weight: 700; color: #1e3a5f; letter-spacing: 1px; }
  .brand .sub { font-size: 9px; color: #64748b; font-weight: 300; }

  .meta-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; }
  .meta-row .period-label { background: #f1f5f9; color: #475569; padding: 3px 12px; border-radius: 12px; font-weight: 700; font-size: 8px; }

  .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
  .stat-card { border: 1px solid #e2e8f0; border-radius: 2px; padding: 14px 16px; text-align: center; }
  .stat-card .sc-label { font-size: 8px; color: #94a3b8; font-weight: 400; text-transform: uppercase; letter-spacing: 1px; }
  .stat-card .sc-value { font-size: 18px; font-weight: 900; margin-top: 4px; }
  .stat-card .sc-unit { font-size: 8px; color: #94a3b8; margin-top: 2px; }
  .stat-card.sc-income .sc-value { color: #1e3a5f; }
  .stat-card.sc-paid .sc-value { color: #0f766e; }
  .stat-card.sc-pending .sc-value { color: #991b1b; }

  .section-title { font-size: 10px; font-weight: 700; color: #1e3a5f; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; display: flex; align-items: center; gap: 6px; }
  .section-title .num { display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; background: #1e3a5f; color: #fff; border-radius: 50%; font-size: 7px; font-weight: 700; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  thead th { background: #f8fafc; color: #475569; font-size: 8px; font-weight: 700; padding: 7px 10px; text-align: right; border-bottom: 1px solid #e2e8f0; }
  tbody td { padding: 6px 10px; font-size: 10px; color: #334155; border-bottom: 1px solid #f1f5f9; }
  tbody tr:last-child td { border-bottom: none; }

  .text-center { text-align: center; }
  .empty-state { padding: 24px; text-align: center; color: #cbd5e1; font-size: 10px; }

  .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 8px; color: #cbd5e1; }
  .footer .sig-row { display: flex; justify-content: space-between; margin-top: 16px; padding-top: 12px; border-top: 1px dashed #d1d5db; }
  .footer .sig-item { text-align: center; min-width: 120px; }
  .footer .sig-item .line { width: 100px; border-top: 1px solid #94a3b8; margin: 0 auto 6px; }
  .footer .sig-item .label { font-size: 8px; color: #94a3b8; }

  @media print { body { padding: 0; } }
</style></head><body>
`),s.document.write(`<div class="print-frame">
<div class="brand">
  <h1>${f}</h1>
  <div class="sub">گزارش مالی — صورت‌های مالی و درآمدی</div>
</div>`);const R=o==="daily"?"روزانه":o==="weekly"?"هفتگی":o==="monthly"?"ماهانه":"سالانه";s.document.write(`<div class="meta-row">
  <span>تاریخ چاپ: ${l}</span>
  <span class="period-label">دوره: ${R}</span>
</div>`),s.document.write(`<div class="stats-grid">
  <div class="stat-card sc-income">
    <div class="sc-label">درآمد کل</div>
    <div class="sc-value">${i(e==null?void 0:e.total_income)}</div>
    <div class="sc-unit">تومان</div>
  </div>
  <div class="stat-card sc-paid">
    <div class="sc-label">دریافت شده</div>
    <div class="sc-value">${i(e==null?void 0:e.total_paid)}</div>
    <div class="sc-unit">تومان</div>
  </div>
  <div class="stat-card sc-pending">
    <div class="sc-label">مانده حساب</div>
    <div class="sc-value">${i(e==null?void 0:e.total_pending)}</div>
    <div class="sc-unit">تومان</div>
  </div>
</div>`),((g=e==null?void 0:e.doctor_incomes)==null?void 0:g.length)>0?(s.document.write(`<div class="section-title"><span class="num">۱</span> درآمد پزشکان</div>
  <table>
    <thead><tr>
      <th>پزشک / درمانگر</th>
      <th>درآمد کل</th>
      <th>دریافت شده</th>
      <th>سهم پزشک / درمانگر</th>
    </tr></thead>
    <tbody>
`),e.doctor_incomes.forEach(d=>{s.document.write(`      <tr>
        <td style="font-weight:700">${d.doctor_name}</td>
        <td>${i(d.total)} تومان</td>
        <td>${i(d.paid)} تومان</td>
        <td>${i(d.share)} تومان</td>
      </tr>
`)}),s.document.write(`    </tbody>
  </table>`)):s.document.write('<div class="empty-state">اطلاعاتی برای نمایش وجود ندارد</div>'),s.document.write(`<div class="footer">
  <div>این گزارش توسط سیستم مدیریت کلینیک ${f} تهیه شده است</div>
  <div class="sig-row">
    <div class="sig-item"><div class="line"></div><div class="label">امضا و مهر</div></div>
    <div class="sig-item"><div class="line"></div><div class="label">امضا و مهر</div></div>
  </div>
</div>`),s.document.write("</div></body></html>"),s.document.close(),setTimeout(()=>{s.print()},500);const h=r+1;z(h),localStorage.setItem("billingPrintCount",h.toString())},$=["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];return N?t.jsx("div",{className:"flex justify-center py-20",children:t.jsx("div",{className:"animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"})}):t.jsxs("div",{className:"space-y-4",children:[t.jsxs("div",{className:"flex items-center justify-between",children:[t.jsx("h1",{className:"text-2xl font-bold text-gray-800",children:"گزارش مالی"}),t.jsxs("div",{className:"flex items-center gap-2",children:[t.jsxs("button",{onClick:_,className:"btn-secondary",children:["چاپ گزارش ",r>0&&`(${V(r)})`]}),t.jsx("button",{onClick:()=>{E({period:o}).then(({data:a})=>{const s=URL.createObjectURL(new Blob([a],{type:"application/pdf"}));window.open(s)}).catch(()=>b.error("خطا در دریافت PDF"))},className:"btn-secondary",children:"دریافت PDF"})]})]}),t.jsx("div",{className:"card",children:t.jsxs("div",{className:"flex items-center gap-3 flex-wrap",children:[t.jsx("span",{className:"text-sm font-medium",children:"دوره:"}),["daily","weekly","monthly","yearly"].map(a=>t.jsx("button",{onClick:()=>j(a),className:`px-3 py-1.5 rounded-lg text-sm ${o===a?"bg-brand-500 text-white":"bg-gray-100 text-gray-600 hover:bg-gray-200"}`,children:a==="daily"?"روزانه":a==="weekly"?"هفتگی":a==="monthly"?"ماهانه":"سالانه"},a))]})}),t.jsxs("div",{ref:x,children:[t.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4",children:[t.jsxs("div",{className:"card text-center",children:[t.jsx("p",{className:"text-sm text-gray-500",children:"درآمد کل"}),t.jsx("p",{className:"text-2xl font-bold text-blue-600",children:i(e==null?void 0:e.total_income)}),t.jsx("p",{className:"text-xs text-gray-400",children:"تومان"})]}),t.jsxs("div",{className:"card text-center",children:[t.jsx("p",{className:"text-sm text-gray-500",children:"دریافت شده"}),t.jsx("p",{className:"text-2xl font-bold text-green-600",children:i(e==null?void 0:e.total_paid)}),t.jsx("p",{className:"text-xs text-gray-400",children:"تومان"})]}),t.jsxs("div",{className:"card text-center",children:[t.jsx("p",{className:"text-sm text-gray-500",children:"مانده"}),t.jsx("p",{className:`text-2xl font-bold ${(e==null?void 0:e.total_pending)>0?"text-red-600":"text-gray-600"}`,children:i(e==null?void 0:e.total_pending)}),t.jsx("p",{className:"text-xs text-gray-400",children:"تومان"})]})]}),t.jsxs("div",{className:"card",children:[t.jsx("h3",{className:"font-bold mb-4",children:"درآمد ماهانه"}),t.jsx(D,{width:"100%",height:300,children:t.jsxs(F,{data:v,children:[t.jsx(I,{strokeDasharray:"3 3"}),t.jsx(L,{dataKey:"month",tickFormatter:a=>$[a-1]}),t.jsx(M,{tickFormatter:a=>i(a)}),t.jsx(T,{formatter:a=>`${i(a)} تومان`}),t.jsx(u,{dataKey:"total",name:"درآمد کل",fill:"#3B82F6",radius:[4,4,0,0]}),t.jsx(u,{dataKey:"paid",name:"دریافت شده",fill:"#10B981",radius:[4,4,0,0]})]})})]}),t.jsxs("div",{className:"card",children:[t.jsx("h3",{className:"font-bold mb-4",children:"درآمد پزشکان"}),t.jsx("div",{className:"overflow-x-auto",children:t.jsxs("table",{className:"w-full text-sm",children:[t.jsx("thead",{children:t.jsxs("tr",{className:"border-b text-gray-600",children:[t.jsx("th",{className:"text-center py-2 px-2",children:"پزشک / درمانگر"}),t.jsx("th",{className:"text-center py-2 px-2",children:"درآمد کل"}),t.jsx("th",{className:"text-center py-2 px-2",children:"دریافت شده"}),t.jsx("th",{className:"text-center py-2 px-2",children:"سهم پزشک / درمانگر"})]})}),t.jsx("tbody",{children:((m=e==null?void 0:e.doctor_incomes)==null?void 0:m.length)===0?t.jsx("tr",{children:t.jsx("td",{colSpan:4,className:"text-center py-6 text-gray-400",children:"اطلاعاتی موجود نیست"})}):(p=e==null?void 0:e.doctor_incomes)==null?void 0:p.map((a,s)=>t.jsxs("tr",{className:"border-b hover:bg-gray-50",children:[t.jsx("td",{className:"py-2 px-2",children:a.doctor_name}),t.jsx("td",{className:"py-2 px-2",children:i(a.total)}),t.jsx("td",{className:"py-2 px-2",children:i(a.paid)}),t.jsx("td",{className:"py-2 px-2",children:i(a.share)})]},s))})]})})]})]})]})}export{U as default};
