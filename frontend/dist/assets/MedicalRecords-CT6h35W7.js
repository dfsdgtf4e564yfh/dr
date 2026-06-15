import{cc as o,d0 as ge,b6 as be,b7 as ue,b8 as ve,b5 as je,bh as we,bW as e,e as h,o as U,f as ye,cE as x,cw as Ne,cC as z,I as _e,x as ze,bo as Ce,B as y,k as T,cN as $e,i as S,aa as ke,at as Pe,aH as De}from"./index-DnqYjpHt.js";import{J as Ae}from"./JalaliDateInput-DyxKvo1R.js";import{F as Ee}from"./FilePreviewModal-CsdfiDLL.js";import{P as Fe}from"./PatientSearchSelect-B1EeExZJ.js";import{E as Te}from"./EmptyState-BbeOh4Vq.js";import{P as W}from"./plus-BxmZwckX.js";import{P as Se}from"./printer-D-l9Qu1S.js";import{P as Me}from"./pen-D6zjvuOg.js";import{T as Re}from"./trash-2-DfIhaNuo.js";import"./calendar-days-DlbXYl41.js";function X(n){return n.id?x(n.id):""}function Le(n,l,r){var v;const d=j=>De(j),$=(r==null?void 0:r.phone)||"",g=(r==null?void 0:r.phone2)||"",b=(r==null?void 0:r.phone3)||"",N=(r==null?void 0:r.address)||"",k=(r==null?void 0:r.clinic_name)||"کلینیک تخصصی اعصاب و روان",_=l!=null&&l.signature?`<img src="${d(l.signature)}" alt="امضای پزشک" style="height:56px;width:auto;" />`:"",u=z(new Date().toISOString().split("T")[0]),C=((v=n.files)==null?void 0:v.length)||0;return`<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
<meta charset="UTF-8">
<title>نسخه پزشکی | ${d(n.patient_name)}</title>
<style>
  @page { size: A5 portrait; margin: 12mm; }
  @font-face { font-family: 'Vazirmatn'; src: url('/fonts/webfonts/Vazirmatn-Regular.woff2') format('woff2'); font-weight: 400; }
  @font-face { font-family: 'Vazirmatn'; src: url('/fonts/webfonts/Vazirmatn-Medium.woff2') format('woff2'); font-weight: 500; }
  @font-face { font-family: 'Vazirmatn'; src: url('/fonts/webfonts/Vazirmatn-Bold.woff2') format('woff2'); font-weight: 700; }
  @font-face { font-family: 'Vazirmatn'; src: url('/fonts/webfonts/Vazirmatn-ExtraBold.woff2') format('woff2'); font-weight: 800; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Vazirmatn', Tahoma, Arial, sans-serif;
    font-size: 11px; color: #1e293b; line-height: 1.7;
    background: #fff; padding: 0;
  }
  .paper {
    width: 100%; max-width: 148mm; margin: 0 auto;
    background: #fff; position: relative;
  }
  /* Header */
  .header {
    position: relative; padding-bottom: 14px; margin-bottom: 14px;
    border-bottom: 2px solid #1a4a8a;
  }
  .header::before {
    content: ''; position: absolute; top: 0; right: 0; left: 0; height: 4px;
    background: linear-gradient(90deg, #1a4a8a 0%, #2ab3b8 50%, #1a4a8a 100%);
    border-radius: 2px;
  }
  .header-top {
    display: flex; justify-content: space-between; align-items: flex-start;
    padding-top: 14px;
  }
  .header-right { text-align: right; }
  .clinic-name { font-size: 17px; font-weight: 800; color: #0c2647; letter-spacing: 0.3px; }
  .clinic-sub { font-size: 10px; color: #5f5547; margin-top: 3px; font-weight: 500; }
  .header-left { text-align: left; }
  .date-box {
    display: inline-block; background: linear-gradient(135deg, #f0fdfa, #eff6ff);
    border: 1px solid rgba(26,74,138,0.12); border-radius: 10px;
    padding: 6px 14px; text-align: center;
  }
  .date-box .lbl { font-size: 9px; color: #64748b; display: block; }
  .date-box .val { font-size: 12px; font-weight: 700; color: #1a4a8a; }
  /* Doctor bar */
  .doctor-bar {
    display: flex; align-items: baseline; gap: 10px; margin: 12px 0;
    padding: 8px 14px; background: linear-gradient(135deg, #f0fdfa, #f8fafc);
    border-right: 4px solid #2ab3b8; border-radius: 8px;
  }
  .doctor-bar .doc-name { font-size: 15px; font-weight: 700; color: #0f766e; }
  .doctor-bar .doc-spec { font-size: 10px; color: #64748b; }
  .doctor-bar .doc-council { font-size: 9px; color: #94a3b8; margin-right: 8px; }
  /* Info grid */
  .info-wrap {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 6px; margin-bottom: 14px;
    background: #faf7f2; border: 1px solid #e8e0d3;
    border-radius: 10px; padding: 10px 12px;
  }
  .info-wrap .item { display: flex; gap: 4px; font-size: 10px; }
  .info-wrap .item .lbl { color: #7d7160; font-weight: 500; }
  .info-wrap .item .val { color: #27221b; font-weight: 700; }
  /* Sections */
  .section { margin-bottom: 12px; }
  .section-title {
    font-size: 10px; font-weight: 800; color: #1a4a8a;
    border-bottom: 1.5px solid #1a4a8a; padding-bottom: 4px; margin-bottom: 6px;
    display: flex; align-items: center; gap: 6px; letter-spacing: 0.3px;
  }
  .section-title .line {
    flex: 1; height: 1px; background: linear-gradient(90deg, transparent, rgba(26,74,138,0.15), transparent);
  }
  .section-body {
    font-size: 11px; color: #1e293b; white-space: pre-wrap;
    padding: 2px 4px; line-height: 1.9;
  }
  /* Prescription box */
  .rx-box {
    border: 1.5px solid #1a4a8a; border-radius: 10px; padding: 14px 16px;
    margin-bottom: 14px; background: #fdfefe; position: relative;
  }
  .rx-box .rx-title {
    position: absolute; top: -10px; right: 18px;
    background: linear-gradient(135deg, #1a4a8a, #2563eb);
    color: #fff; font-size: 9px; padding: 2px 14px;
    border-radius: 20px; font-weight: 700;
  }
  .rx-item { padding: 5px 0; border-bottom: 1px dashed #e2e8f0; font-size: 11.5px; line-height: 1.8; }
  .rx-item:last-child { border-bottom: none; }
  .rx-item::before { content: '—'; color: #2ab3b8; margin-left: 8px; font-weight: 700; }
  /* Signature */
  .sig-wrap {
    display: flex; justify-content: space-between; align-items: flex-end;
    margin-top: 16px; padding-top: 14px;
    border-top: 1.5px dashed #d4c9b8;
  }
  .sig-area { text-align: center; min-width: 120px; }
  .sig-img { min-height: 44px; display: flex; align-items: center; justify-content: center; }
  .sig-line {
    border-top: 1px solid #b8ab96; width: 120px; margin: 4px auto 0;
    padding-top: 4px; font-size: 9px; color: #5f5547; font-weight: 500;
  }
  /* Footer */
  .footer {
    margin-top: 14px; padding-top: 10px;
    border-top: 2px solid #1a4a8a; position: relative;
  }
  .footer::before {
    content: ''; position: absolute; top: -2px; right: 0; left: 0; height: 2px;
    background: linear-gradient(90deg, #1a4a8a 0%, #2ab3b8 50%, #1a4a8a 100%);
  }
  .footer-grid {
    display: flex; justify-content: space-between; align-items: flex-start;
    font-size: 9px; color: #5f5547; line-height: 1.8;
  }
  .footer-grid .lbl { color: #7d7160; font-weight: 600; }
  .footer-note {
    margin-top: 8px; text-align: center; font-size: 8px; color: #9c8e7a;
    font-weight: 500;
  }
  @media print {
    body { background: #fff; margin: 0; }
    .paper { max-width: 100%; }
  }
</style>
</head>
<body>
<div class="paper">
  <div class="header">
    <div class="header-top">
      <div class="header-right">
        <div class="clinic-name">${d(k)}</div>
        <div class="clinic-sub">کلینیک تخصصی مغز و اعصاب و روان</div>
      </div>
      <div class="header-left">
        <div class="date-box">
          <span class="lbl">تاریخ نسخه</span>
          <span class="val">${z(n.date)||u}</span>
        </div>
      </div>
    </div>
    <div class="doctor-bar">
      <span class="doc-name">${d((l==null?void 0:l.first_name)||"")} ${d((l==null?void 0:l.last_name)||"")}</span>
      <span class="doc-spec">${d((l==null?void 0:l.specialization)||"متخصص اعصاب و روان")}</span>
      ${l!=null&&l.medical_council_number?`<span class="doc-council">نظام پزشکی: ${x(l.medical_council_number)}</span>`:""}
    </div>
  </div>

  <div class="info-wrap">
    <div class="item"><span class="lbl">بیمار:</span><span class="val">${d(n.patient_name)}</span></div>
    <div class="item"><span class="lbl">شماره نسخه:</span><span class="val">${X(n)}</span></div>
    ${n.session_number?`<div class="item"><span class="lbl">شماره جلسه:</span><span class="val">${x(n.session_number)}</span></div>`:""}
    ${C>0?`<div class="item"><span class="lbl">پیوست:</span><span class="val">${x(C)} فایل</span></div>`:""}
  </div>

  ${n.diagnosis?`
  <div class="section">
    <div class="section-title">تشخیص پزشکی</div>
    <div class="section-body">${d(n.diagnosis)}</div>
  </div>`:""}

  ${n.treatment_plan?`
  <div class="section">
    <div class="section-title">طرح درمان</div>
    <div class="section-body">${d(n.treatment_plan)}</div>
  </div>`:""}

  ${n.prescription?`
  <div class="rx-box">
    <div class="rx-title">نسخه دارویی</div>
    ${n.prescription.split(`
`).filter(j=>j.trim()).map(j=>`<div class="rx-item">${d(j)}</div>`).join("")}
  </div>`:""}

  ${n.notes?`
  <div class="section">
    <div class="section-title">یادداشت‌های پزشکی</div>
    <div class="section-body">${d(n.notes)}</div>
  </div>`:""}

  <div class="sig-wrap">
    <div style="font-size:9px;color:#7d7160;font-weight:500;">
      <div>شماره نسخه: <strong>${X(n)}</strong></div>
      <div style="margin-top:2px;">تاریخ: ${z(n.date)||u}</div>
    </div>
    <div class="sig-area">
      <div class="sig-img">${_||'<span style="color:#b8ab96;font-size:10px;">—</span>'}</div>
      <div class="sig-line">امضا و مهر پزشک معالج</div>
    </div>
  </div>

  <div class="footer">
    <div class="footer-grid">
      <div>
        ${N?`<div><span class="lbl">آدرس کلینیک:</span> ${d(N)}</div>`:""}
        <div><span class="lbl">تلفن تماس:</span> ${x($)}${g?` / ${x(g)}`:""}${b?` / ${x(b)}`:""}</div>
      </div>
      <div style="text-align:left;">
        <div style="font-size:8px;color:#9c8e7a;">این نسخه به صورت الکترونیکی صادر شده است</div>
      </div>
    </div>
  </div>
</div>
</body>
</html>`}function Xe(){const[n,l]=o.useState([]),[r,d]=o.useState(!0),[$,g]=o.useState(!1),[b,N]=o.useState(null),[k,_]=o.useState({}),[u,C]=o.useState(""),[v,j]=o.useState(""),[Y,P]=o.useState(""),{user:M,hasRole:D}=ge(),[i,p]=o.useState({patient:"",session_number:"",date:"",diagnosis:"",treatment_plan:"",notes:"",prescription:"",uploaded_files:[]}),[R,L]=o.useState([]),[G,Q]=o.useState([]),[Z,ee]=o.useState([]),[te,se]=o.useState([]),[V,I]=o.useState(!1),[B,O]=o.useState(!1),[H,J]=o.useState(!1),[A,q]=o.useState(null),[ae,ie]=o.useState(null),[ne,oe]=o.useState([]);o.useEffect(()=>{be().then(t=>{const s=t.data;Q(Array.isArray(s)?s:s.results||[])}).catch(()=>{}),ue().then(t=>{const s=t.data;ee(Array.isArray(s)?s:s.results||[])}).catch(()=>{}),ve().then(t=>{const s=t.data;se(Array.isArray(s)?s:s.results||[])}).catch(()=>{}),je().then(t=>{const s=t.data;ie(Array.isArray(s)?s[0]:s)}).catch(()=>{}),we().then(t=>{const s=t.data;oe(Array.isArray(s)?s:s.results||s)}).catch(()=>{})},[]);const E=async()=>{d(!0);try{const t={};u&&(t.patient=u),v&&(t.doctor=v);const{data:s}=await Ce(t);l(Array.isArray(s)?s:s.results||[])}catch{y.error("متأسفانه در دریافت پرونده‌ها مشکلی پیش اومد",{icon:e.jsx(T,{size:20})})}finally{d(!1)}};o.useEffect(()=>{E()},[u,v]);const le=n.reduce((t,s)=>{const c=s.patient;return t[c]||(t[c]={patient:c,name:s.patient_name,national_id:s.patient_national_id||"",file_number:s.patient_file_number||"",last_date:s.date,records:[]}),t[c].records.push(s),s.date>t[c].last_date&&(t[c].last_date=s.date),t},{}),F=Object.values(le).sort((t,s)=>t.name.localeCompare(s.name)),re=t=>{_(s=>({...s,[t]:!s[t]}))},de=()=>{const t={};F.forEach(s=>{t[s.patient]=!0}),_(t)},ce=()=>_({}),K=()=>{N(null),p({patient:"",session_number:"",date:"",diagnosis:"",treatment_plan:"",notes:"",prescription:"",uploaded_files:[]}),L([]),P(""),g(!0)},pe=t=>{N(t.id),p({patient:t.patient,session_number:String(t.session_number),date:t.date,diagnosis:t.diagnosis||"",treatment_plan:t.treatment_plan||"",notes:t.notes||"",prescription:t.prescription||"",uploaded_files:[]}),P(t.patient_name),g(!0)},xe=t=>{const s=Array.from(t.target.files||[]);p({...i,uploaded_files:s}),L(s.map(c=>({name:c.name,size:c.size})))},me=async t=>{var s;t.preventDefault();try{b?(await $e(b,i),y.success("پرونده پزشکی با موفقیت ویرایش شد",{icon:e.jsx(S,{size:20})})):(await ke({...i,doctor:M.id}),y.success("پرونده پزشکی جدید با موفقیت ثبت شد",{icon:e.jsx(S,{size:20})})),g(!1),E()}catch(c){const a=(s=c==null?void 0:c.response)==null?void 0:s.data;let m="متأسفانه خطایی در ثبت پرونده رخ داد";if(a){if(typeof a=="string")m=a;else if(a.error)m=a.error;else if(a.detail)m=a.detail;else if(typeof a=="object"){const f=Object.keys(a)[0],w=a[f];m=Array.isArray(w)?w[0]:typeof w=="string"?w:m}}y.error(m,{icon:e.jsx(T,{size:20})})}},fe=async t=>{if(window.confirm("آیا از حذف این پرونده اطمینان دارید؟"))try{await Pe(t),y.success("پرونده پزشکی با موفقیت حذف شد",{icon:e.jsx(S,{size:20})}),E()}catch{y.error("متأسفانه در حذف پرونده مشکلی پیش اومد",{icon:e.jsx(T,{size:20})})}};return e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex items-center justify-between flex-wrap gap-2",children:[e.jsx("h1",{className:"text-xl font-extrabold text-slate-800",children:"پرونده‌های پزشکی"}),e.jsx("div",{className:"flex gap-2 flex-wrap",children:D("admin","doctor")&&e.jsx(h,{onClick:K,icon:W,children:"پرونده جدید"})})]}),e.jsx("div",{className:"card",children:e.jsxs("div",{className:"flex items-center gap-3 flex-wrap",children:[e.jsx("span",{className:"text-sm font-medium text-slate-600",children:"فیلتر بیمار:"}),e.jsx("input",{className:"input-field max-w-xs",placeholder:"شناسه بیمار",value:u,onChange:t=>C(t.target.value)}),e.jsx("span",{className:"text-sm font-medium text-slate-600",children:"پزشک / درمانگر:"}),e.jsxs("select",{className:"input-field max-w-[180px]",value:v,onChange:t=>j(t.target.value),children:[e.jsx("option",{value:"",children:"همه پزشکان"}),ne.map(t=>e.jsxs("option",{value:t.id,children:[t.first_name," ",t.last_name]},t.id))]}),e.jsx(h,{size:"xs",variant:"ghost",onClick:de,children:"باز کردن همه"}),e.jsx(h,{size:"xs",variant:"ghost",onClick:ce,children:"بستن همه"})]})}),r?e.jsx("div",{className:"flex justify-center py-10",children:e.jsx("div",{className:"animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"})}):e.jsx("div",{className:"space-y-3",children:F.length===0?e.jsx(Te,{icon:U,title:"پرونده‌ای یافت نشد",description:"برای ثبت پرونده جدید از دکمه بالا استفاده کنید.",action:D("admin","doctor")?e.jsx(h,{onClick:K,icon:W,children:"پرونده جدید"}):null}):F.map(t=>{const s=k[t.patient],c=t.records.length;return e.jsxs("div",{className:"card p-0 overflow-hidden",children:[e.jsxs("button",{onClick:()=>re(t.patient),className:"w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-right",children:[e.jsx(ye,{size:18,className:`text-slate-400 transition-transform ${s?"":"-rotate-90"}`}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("span",{className:"font-bold text-gray-800",children:t.name}),e.jsx("span",{className:"mx-2 text-xs text-slate-400",children:"|"}),e.jsxs("span",{className:"text-sm text-slate-500",children:["کد ملی: ",x(t.national_id||"—")]}),t.file_number&&e.jsxs(e.Fragment,{children:[e.jsx("span",{className:"mx-2 text-xs text-slate-400",children:"|"}),e.jsxs("span",{className:"text-sm text-slate-500",children:["پرونده: ",Ne(t.file_number)]})]})]}),e.jsxs("div",{className:"flex items-center gap-3 text-sm shrink-0",children:[e.jsxs("span",{className:"text-slate-400",children:[x(c)," جلسه"]}),e.jsxs("span",{className:"text-slate-400",children:["آخرین: ",z(t.last_date)]})]})]}),s&&e.jsx("div",{className:"border-t border-slate-100",children:e.jsx("div",{className:"table-wrap",children:e.jsxs("table",{children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-center",children:"شماره جلسه"}),e.jsx("th",{className:"text-center",children:"تاریخ"}),e.jsx("th",{className:"text-center",children:"پزشک / درمانگر"}),e.jsx("th",{className:"text-center",children:"تشخیص"}),e.jsx("th",{className:"text-center",children:"طرح درمان"}),e.jsx("th",{className:"text-center",children:"فایل‌ها"}),e.jsx("th",{className:"text-center",children:"عملیات"})]})}),e.jsx("tbody",{children:t.records.map(a=>{var m;return e.jsxs("tr",{children:[e.jsx("td",{className:"text-center font-medium",children:x(a.session_number)}),e.jsx("td",{className:"text-center text-sm",children:z(a.date)}),e.jsx("td",{className:"text-center text-sm",children:a.doctor_name}),e.jsx("td",{className:"text-center text-sm max-w-[150px] truncate",title:a.diagnosis,children:a.diagnosis||"—"}),e.jsx("td",{className:"text-center text-sm max-w-[150px] truncate",title:a.treatment_plan,children:a.treatment_plan||"—"}),e.jsx("td",{className:"text-center",children:((m=a.files)==null?void 0:m.length)>0?e.jsx("div",{className:"flex gap-1 justify-center",children:a.files.map((f,w)=>{const he=/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(f.file);return e.jsx("button",{onClick:()=>q({files:a.files,index:w}),className:"text-xs bg-gray-100 px-1.5 py-1 rounded hover:bg-gray-200",title:f.description||"فایل",children:he?e.jsx(_e,{size:12}):e.jsx(U,{size:12})},f.id)})}):"—"}),e.jsx("td",{className:"text-center",children:e.jsxs("div",{className:"flex items-center justify-center gap-1",children:[a.prescription&&e.jsx("button",{onClick:()=>{const f=window.open("","","width=600,height=800");f.document.write(Le(a,M,ae)),f.document.close()},className:"btn-action text-teal-600",title:"چاپ نسخه",children:e.jsx(Se,{size:15})}),D("admin","doctor")&&e.jsxs(e.Fragment,{children:[e.jsx("button",{onClick:()=>pe(a),className:"btn-action text-blue-600",title:"ویرایش",children:e.jsx(Me,{size:15})}),e.jsx("button",{onClick:()=>fe(a.id),className:"btn-action btn-action-danger",title:"حذف",children:e.jsx(Re,{size:15})})]})]})})]},a.id)})})]})})})]},t.patient)})}),e.jsx(ze,{open:$,onClose:()=>g(!1),size:"lg",title:b?"ویرایش پرونده":"پرونده جدید",children:e.jsxs("form",{onSubmit:me,className:"space-y-4",children:[e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-3 gap-3",children:[e.jsxs("div",{children:[e.jsx("label",{className:"label",children:"بیمار"}),e.jsx(Fe,{value:Y,onSelect:t=>{p({...i,patient:t.id}),P(`${t.first_name} ${t.last_name}`)},minChars:2})]}),e.jsxs("div",{children:[e.jsx("label",{className:"label",children:"شماره جلسه"}),e.jsx("input",{type:"number",className:"input-field",value:i.session_number,onChange:t=>p({...i,session_number:t.target.value}),required:!0})]}),e.jsxs("div",{children:[e.jsx("label",{className:"label",children:"تاریخ جلسه"}),e.jsx(Ae,{value:i.date,onChange:t=>p({...i,date:t}),required:!0})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"label",children:"تشخیص"}),e.jsxs("div",{className:"relative mb-1",children:[e.jsx(h,{type:"button",size:"xs",variant:"ghost",onClick:()=>I(!V),children:"+ تشخیص‌های آماده"}),V&&e.jsx("div",{className:"absolute z-10 top-full right-0 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto w-full",children:G.map(t=>e.jsx("div",{className:"px-3 py-2 text-sm hover:bg-brand-50 cursor-pointer border-b border-slate-50",onClick:()=>{p({...i,diagnosis:i.diagnosis?i.diagnosis+`
`+t.title:t.title}),I(!1)},children:t.title},t.id))})]}),e.jsx("textarea",{className:"input-field",rows:2,value:i.diagnosis,onChange:t=>p({...i,diagnosis:t.target.value})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"label",children:"طرح درمان"}),e.jsxs("div",{className:"relative mb-1",children:[e.jsx(h,{type:"button",size:"xs",variant:"ghost",onClick:()=>J(!H),children:"+ طرح‌های درمان آماده"}),H&&e.jsx("div",{className:"absolute z-10 top-full right-0 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto w-full",children:te.map(t=>e.jsx("div",{className:"px-3 py-2 text-sm hover:bg-brand-50 cursor-pointer border-b border-slate-50",onClick:()=>{p({...i,treatment_plan:i.treatment_plan?i.treatment_plan+`
`+t.title:t.title}),J(!1)},children:t.title},t.id))})]}),e.jsx("textarea",{className:"input-field",rows:2,value:i.treatment_plan,onChange:t=>p({...i,treatment_plan:t.target.value})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"label",children:"یادداشت‌های پزشک"}),e.jsx("textarea",{className:"input-field",rows:3,value:i.notes,onChange:t=>p({...i,notes:t.target.value})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"label",children:"نسخه"}),e.jsxs("div",{className:"relative mb-1",children:[e.jsx(h,{type:"button",size:"xs",variant:"ghost",onClick:()=>O(!B),children:"+ داروهای آماده"}),B&&e.jsx("div",{className:"absolute z-10 top-full right-0 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto w-full",children:Z.map(t=>e.jsxs("div",{className:"px-3 py-2 text-sm hover:bg-brand-50 cursor-pointer border-b border-slate-50",onClick:()=>{p({...i,prescription:i.prescription?i.prescription+`
${t.name} - ${t.default_dosage} ${t.dosage_unit}`:`${t.name} - ${t.default_dosage} ${t.dosage_unit}`}),O(!1)},children:[t.name," - ",t.default_dosage," ",t.dosage_unit]},t.id))})]}),e.jsx("textarea",{className:"input-field",rows:2,value:i.prescription,onChange:t=>p({...i,prescription:t.target.value})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"label",children:"آپلود فایل (مدارک تصویری)"}),e.jsx("input",{type:"file",multiple:!0,className:"input-field",onChange:xe,accept:"image/*,.pdf"}),R.length>0&&e.jsxs("div",{className:"mt-2 text-sm text-slate-500",children:[x(R.length)," فایل انتخاب شد"]})]}),e.jsx(h,{type:"submit",variant:"gradient",className:"w-full",children:b?"ذخیره تغییرات":"ثبت پرونده"})]})}),A&&e.jsx(Ee,{files:A.files,initialIndex:A.index,onClose:()=>q(null)})]})}export{Xe as default};
