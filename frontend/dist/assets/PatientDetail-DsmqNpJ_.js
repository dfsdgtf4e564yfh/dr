import{d3 as ae,d1 as te,d0 as ie,cc as u,b5 as ne,bt as D,aY as le,bo as re,b1 as de,B,bW as e,k as R,e as M,cC as p,o as T,cE as l,cw as N,C as ce,aP as F,I as oe,aR as g,cQ as pe,i as xe,aH as J}from"./index-DnqYjpHt.js";import{J as me}from"./JalaliDateInput-DyxKvo1R.js";import{F as fe}from"./FilePreviewModal-CsdfiDLL.js";import{S as O}from"./StatusBadge-BmtzIKkL.js";import{A as he}from"./arrow-right-BzBokaqt.js";import{P as q}from"./printer-D-l9Qu1S.js";import{P as ue}from"./pen-D6zjvuOg.js";import{P as be}from"./phone-QaD_gwZA.js";import{M as ge}from"./map-pin-DhS_You8.js";import"./calendar-days-DlbXYl41.js";const I="مطب تخصصی دکتر محمد طاهری";function H(r){return r.id?`نسخه ${l(r.id)}`:""}function ve(r,c,d){var z;const h=b=>J(b),y=(d==null?void 0:d.phone)||"",a=(d==null?void 0:d.phone2)||"",w=(d==null?void 0:d.phone3)||"",v=(d==null?void 0:d.address)||"",k=(d==null?void 0:d.clinic_name)||I,j=c!=null&&c.signature?`<img src="${h(c.signature)}" alt="امضای پزشک" style="height:56px;width:auto;" />`:"",$=p(new Date().toISOString().split("T")[0]),f=((z=r.files)==null?void 0:z.length)||0;return`<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
<meta charset="UTF-8">
<title>نسخه پزشکی | ${h(r.patient_name)}</title>
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
  .doctor-bar {
    display: flex; align-items: baseline; gap: 10px; margin: 12px 0;
    padding: 8px 14px; background: linear-gradient(135deg, #f0fdfa, #f8fafc);
    border-right: 4px solid #2ab3b8; border-radius: 8px;
  }
  .doctor-bar .doc-name { font-size: 15px; font-weight: 700; color: #0f766e; }
  .doctor-bar .doc-spec { font-size: 10px; color: #64748b; }
  .doctor-bar .doc-council { font-size: 9px; color: #94a3b8; margin-right: 8px; }
  .info-wrap {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 6px; margin-bottom: 14px;
    background: #faf7f2; border: 1px solid #e8e0d3;
    border-radius: 10px; padding: 10px 12px;
  }
  .info-wrap .item { display: flex; gap: 4px; font-size: 10px; }
  .info-wrap .item .lbl { color: #7d7160; font-weight: 500; }
  .info-wrap .item .val { color: #27221b; font-weight: 700; }
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
        <div class="clinic-name">${h(k)}</div>
        <div class="clinic-sub">کلینیک تخصصی مغز و اعصاب و روان</div>
      </div>
      <div class="header-left">
        <div class="date-box">
          <span class="lbl">تاریخ نسخه</span>
          <span class="val">${p(r.date)||$}</span>
        </div>
      </div>
    </div>
    <div class="doctor-bar">
      <span class="doc-name">${h(r.doctor_name||(c==null?void 0:c.first_name)+" "+(c==null?void 0:c.last_name))}</span>
      <span class="doc-spec">${h((c==null?void 0:c.specialization)||"متخصص اعصاب و روان")}</span>
      ${c!=null&&c.medical_council_number?`<span class="doc-council">نظام پزشکی: ${l(c.medical_council_number)}</span>`:""}
    </div>
  </div>

  <div class="info-wrap">
    <div class="item"><span class="lbl">بیمار:</span><span class="val">${h(r.patient_name)}</span></div>
    <div class="item"><span class="lbl">شماره نسخه:</span><span class="val">${H(r)}</span></div>
    <div class="item"><span class="lbl">شماره جلسه:</span><span class="val">${l(r.session_number)}</span></div>
    ${f>0?`<div class="item"><span class="lbl">پیوست:</span><span class="val">${l(f)} فایل</span></div>`:""}
  </div>

  ${r.diagnosis?`
  <div class="section">
    <div class="section-title">تشخیص پزشکی</div>
    <div class="section-body">${h(r.diagnosis)}</div>
  </div>`:""}

  ${r.treatment_plan?`
  <div class="section">
    <div class="section-title">طرح درمان</div>
    <div class="section-body">${h(r.treatment_plan)}</div>
  </div>`:""}

  ${r.prescription?`
  <div class="rx-box">
    <div class="rx-title">نسخه دارویی</div>
    ${r.prescription.split(`
`).filter(b=>b.trim()).map(b=>`<div class="rx-item">${h(b)}</div>`).join("")}
  </div>`:""}

  ${r.notes?`
  <div class="section">
    <div class="section-title">یادداشت‌های پزشکی</div>
    <div class="section-body">${h(r.notes)}</div>
  </div>`:""}

  <div class="sig-wrap">
    <div style="font-size:9px;color:#7d7160;font-weight:500;">
      <div>شماره نسخه: <strong>${H(r)}</strong></div>
      <div style="margin-top:2px;">تاریخ: ${p(r.date)||$}</div>
    </div>
    <div class="sig-area">
      <div class="sig-img">${j||'<span style="color:#b8ab96;font-size:10px;">—</span>'}</div>
      <div class="sig-line">امضا و مهر پزشک معالج</div>
    </div>
  </div>

  <div class="footer">
    <div class="footer-grid">
      <div>
        ${v?`<div><span class="lbl">آدرس کلینیک:</span> ${h(v)}</div>`:""}
        <div><span class="lbl">تلفن تماس:</span> ${l(y)}${a?` / ${l(a)}`:""}${w?` / ${l(w)}`:""}</div>
      </div>
      <div style="text-align:left;">
        <div style="font-size:8px;color:#9c8e7a;">این برگه به صورت الکترونیکی صادر شده است</div>
      </div>
    </div>
  </div>
</div>
</body>
</html>`}function Ae(){const{id:r}=ae(),c=te(),{user:d,hasRole:h,hasPermission:y}=ie(),[a,w]=u.useState(null),[v,k]=u.useState([]),[j,$]=u.useState([]),[f,z]=u.useState([]),[b,W]=u.useState("info"),[_,E]=u.useState(!1),[Y,U]=u.useState(!0),[P,V]=u.useState(""),[C,L]=u.useState(null),[o,Q]=u.useState(null),X=u.useRef(null);u.useEffect(()=>{ne().then(({data:t})=>{Q(Array.isArray(t)?t[0]:t)}).catch(()=>{});const s=Number(r);Promise.all([D(s),le({patient:s}),re({patient:s}),de({patient:s})]).then(([t,i,x,m])=>{w(t.data),V(t.data.birth_date||""),k(Array.isArray(i.data)?i.data:i.data.results||[]),$(Array.isArray(x.data)?x.data:x.data.results||[]),z(Array.isArray(m.data)?m.data:m.data.results||[])}).catch(()=>B.error("متأسفانه در دریافت اطلاعات بیمار خطایی رخ داد",{icon:e.jsx(R,{size:20})})).finally(()=>U(!1))},[r]);const G=async s=>{s.preventDefault();const t=s.target;try{await pe(Number(r),{first_name:t.first_name.value,last_name:t.last_name.value,father_name:t.father_name.value,national_id:t.national_id.value,old_file_number:t.old_file_number.value,education:t.education.value,job:t.job.value,phone:t.phone.value,emergency_phone:t.emergency_phone.value,...P?{birth_date:P}:{},address:t.address.value}),B.success("اطلاعات بیمار با موفقیت به‌روز شد",{icon:e.jsx(xe,{size:20})}),E(!1);const{data:i}=await D(Number(r));w(i),V(i.birth_date||"")}catch{B.error("متأسفانه در ویرایش اطلاعات بیمار خطایی رخ داد",{icon:e.jsx(R,{size:20})})}},K=()=>{const s=n=>J(n),t=a,i=window.open("","","width=1000,height=720"),x={completed:"انجام شده",cancelled:"لغو شده",scheduled:"نوبت‌گذاری شده",rescheduled:"تغییر یافته"},m={completed:"background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;",cancelled:"background:#fff1f2;color:#be123c;border:1px solid #fecdd3;",scheduled:"background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;",rescheduled:"background:#fffbeb;color:#b45309;border:1px solid #fde68a;"},S={cash:"نقدی",card:"کارت",insurance:"بیمه",card_to_card:"کارت به کارت"},ee={paid:"پرداخت شده",partial:"پرداخت جزئی",unpaid:"پرداخت نشده"},se={paid:"background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;",partial:"background:#fffbeb;color:#b45309;border:1px solid #fde68a;",unpaid:"background:#fff1f2;color:#be123c;border:1px solid #fecdd3;"};i.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
<meta charset="UTF-8">
<title>پرونده پزشکی | ${s(t.first_name)} ${s(t.last_name)}</title>
<style>
  @page { margin: 10mm; size: A4 landscape; }
  @font-face { font-family: 'Vazirmatn'; font-weight: 300; src: url('/fonts/webfonts/Vazirmatn-Light.woff2') format('woff2'); }
  @font-face { font-family: 'Vazirmatn'; font-weight: 400; src: url('/fonts/webfonts/Vazirmatn-Regular.woff2') format('woff2'); }
  @font-face { font-family: 'Vazirmatn'; font-weight: 500; src: url('/fonts/webfonts/Vazirmatn-Medium.woff2') format('woff2'); }
  @font-face { font-family: 'Vazirmatn'; font-weight: 700; src: url('/fonts/webfonts/Vazirmatn-Bold.woff2') format('woff2'); }
  @font-face { font-family: 'Vazirmatn'; font-weight: 800; src: url('/fonts/webfonts/Vazirmatn-ExtraBold.woff2') format('woff2'); }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Vazirmatn', Tahoma, Arial, sans-serif;
    font-size: 10px; color: #27221b; line-height: 1.7;
    background: #fff; padding: 0;
  }
  .paper { width: 100%; padding: 8px 10px; }

  /* Header */
  .header {
    position: relative; padding-bottom: 12px; margin-bottom: 12px;
    border-bottom: 2px solid #1a4a8a;
  }
  .header::before {
    content: ''; position: absolute; top: 0; right: 0; left: 0; height: 3px;
    background: linear-gradient(90deg, #1a4a8a 0%, #2ab3b8 40%, #e67e22 70%, #1a4a8a 100%);
    border-radius: 2px;
  }
  .header-inner {
    display: flex; justify-content: space-between; align-items: flex-start;
    padding-top: 12px;
  }
  .header-right { text-align: right; }
  .clinic-name { font-size: 16px; font-weight: 800; color: #0c2647; letter-spacing: 0.3px; }
  .clinic-sub { font-size: 10px; color: #5f5547; margin-top: 3px; font-weight: 500; }
  .clinic-spec { font-size: 9px; color: #7d7160; margin-top: 2px; }
  .header-left { text-align: left; }
  .badge-box {
    display: inline-block; background: linear-gradient(135deg, #f0fdfa, #eff6ff);
    border: 1px solid rgba(26,74,138,0.12); border-radius: 10px;
    padding: 6px 14px;
  }
  .badge-box .lbl { font-size: 9px; color: #64748b; display: block; }
  .badge-box .val { font-size: 11px; font-weight: 700; color: #1a4a8a; }

  /* Title bar */
  .title-bar {
    background: linear-gradient(135deg, #0c2647, #1a4a8a);
    color: #fff; padding: 8px 18px; font-size: 10px; font-weight: 700;
    margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;
    border-radius: 8px;
  }
  .title-bar .badge {
    background: rgba(255,255,255,0.12); padding: 3px 12px;
    border-radius: 20px; font-size: 9px; font-weight: 500;
    border: 1px solid rgba(255,255,255,0.15);
  }

  /* Sections */
  .section { margin-bottom: 14px; }
  .section-title {
    font-size: 10px; font-weight: 800; color: #1a4a8a;
    border-bottom: 1.5px solid #1a4a8a; padding-bottom: 4px; margin-bottom: 8px;
    display: flex; align-items: center; gap: 6px; letter-spacing: 0.2px;
  }
  .section-title .num {
    display: inline-flex; align-items: center; justify-content: center;
    width: 20px; height: 20px; background: linear-gradient(135deg, #1a4a8a, #2563eb);
    color: #fff; border-radius: 6px; font-size: 9px; font-weight: 800;
  }
  .section-title .count {
    font-size: 9px; color: #7d7160; font-weight: 500; margin-right: auto;
    background: #faf7f2; padding: 2px 10px; border-radius: 12px; border: 1px solid #e8e0d3;
  }

  /* Info grid */
  .info-grid {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 0; border: 1px solid #e8e0d3; border-radius: 10px; overflow: hidden;
  }
  .info-item {
    padding: 5px 8px; border-bottom: 1px solid #f5f0e8;
    font-size: 9px; background: #fff;
  }
  .info-item:nth-child(even) { background: #faf7f2; }
  .info-item .label { color: #7d7160; font-weight: 500; }
  .info-item .value { color: #27221b; font-weight: 700; margin-right: 3px; }
  .info-item.full { grid-column: 1 / -1; }

  /* Tables */
  table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 6px; }
  thead th {
    background: linear-gradient(135deg, #f0fdfa, #eff6ff);
    color: #1a4a8a; font-weight: 700; padding: 5px 8px;
    text-align: center; font-size: 8px;
    border-bottom: 2px solid #1a4a8a; border-top: 1px solid #e2e8f0;
  }
  thead th:first-child { border-radius: 0 8px 0 0; border-right: 1px solid #e2e8f0; }
  thead th:last-child { border-radius: 8px 0 0 0; border-left: 1px solid #e2e8f0; }
  td {
    padding: 4px 8px; text-align: center; font-size: 9px;
    border-bottom: 1px solid #f5f0e8; color: #27221b;
  }
  tr:nth-child(even) td { background: #faf7f2; }
  tr:last-child td:first-child { border-radius: 0 0 8px 0; }
  tr:last-child td:last-child { border-radius: 0 0 0 8px; }

  /* Status badges */
  .status-pill {
    display: inline-block; padding: 2px 10px; border-radius: 12px;
    font-size: 8px; font-weight: 700;
  }

  /* Record cards */
  .record-card {
    border: 1px solid #e8e0d3; border-radius: 8px; padding: 8px 10px;
    margin-bottom: 6px; background: #fff;
  }
  .record-card:last-child { margin-bottom: 0; }
  .rc-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 4px; padding-bottom: 4px; border-bottom: 1px dashed #e8e0d3;
  }
  .rc-header .rc-title { font-weight: 700; font-size: 10px; color: #0c2647; }
  .rc-header .rc-meta { font-size: 8px; color: #7d7160; background: #f5f0e8; padding: 1px 8px; border-radius: 8px; }
  .rc-field { font-size: 9px; color: #27221b; padding: 2px 0; }
  .rc-field .rcl { color: #1a4a8a; font-weight: 700; }

  /* Empty state */
  .empty-state {
    color: #9c8e7a; font-size: 9px; padding: 10px 0;
    text-align: center; background: #faf7f2; border-radius: 8px;
    border: 1px dashed #e8e0d3;
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
  .footer-inner {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 8px; color: #7d7160;
  }
  .footer-note { text-align: center; font-size: 8px; color: #9c8e7a; margin-top: 6px; font-weight: 500; }

  @media print {
    body { background: #fff; margin: 0; }
    .paper { padding: 4px 6px; }
  }
</style>
</head>
<body>
<div class="paper">
  <div class="header">
    <div class="header-inner">
      <div class="header-right">
        <div class="clinic-name">${s((o==null?void 0:o.clinic_name)||I)}</div>
        <div class="clinic-sub">کلینیک تخصصی مغز و اعصاب و روان</div>
        <div class="clinic-spec">${s((d==null?void 0:d.specialization)||"متخصص اعصاب و روان")}${d!=null&&d.medical_council_number?` — نظام پزشکی: ${l(d.medical_council_number)}`:""}</div>
      </div>
      <div class="header-left">
        <div class="badge-box">
          <span class="lbl">شماره پرونده</span>
          <span class="val">${N(t.file_number||"—")}</span>
        </div>
      </div>
    </div>
  </div>

  <div class="title-bar">
    <span>گزارش جامع پرونده پزشکی</span>
    <span class="badge">${s(t.first_name)} ${s(t.last_name)} — ${l(t.national_id)}</span>
  </div>

  <div class="section">
    <div class="section-title"><span class="num">۱</span> اطلاعات فردی بیمار</div>
    <div class="info-grid">
      <div class="info-item"><span class="label">نام:</span><span class="value">${s(t.first_name)}</span></div>
      <div class="info-item"><span class="label">نام خانوادگی:</span><span class="value">${s(t.last_name)}</span></div>
      <div class="info-item"><span class="label">نام پدر:</span><span class="value">${s(t.father_name)||"—"}</span></div>
      <div class="info-item"><span class="label">کد ملی:</span><span class="value">${l(t.national_id)}</span></div>
      <div class="info-item"><span class="label">تاریخ تولد:</span><span class="value">${p(t.birth_date)||"—"}</span></div>
      <div class="info-item"><span class="label">شماره تماس:</span><span class="value">${l(t.phone)||"—"}</span></div>
      <div class="info-item"><span class="label">تلفن اضطراری:</span><span class="value">${l(t.emergency_phone)||"—"}</span></div>
      <div class="info-item"><span class="label">تاریخ ثبت:</span><span class="value">${p(t.created_at)}</span></div>
      <div class="info-item full"><span class="label">آدرس:</span><span class="value">${s(t.address)||"—"}</span></div>
      <div class="info-item full"><span class="label">تاریخچه پزشکی:</span><span class="value">${s(t.medical_history)||"—"}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title"><span class="num">۲</span> پرونده پزشکی <span class="count">${l(j.length)} جلسه</span></div>
    ${j.length>0?j.map(n=>`
    <div class="record-card">
      <div class="rc-header">
        <span class="rc-title">جلسه ${l(n.session_number)} — ${p(n.date)}</span>
        <span class="rc-meta">${s(n.doctor_name||"")}</span>
      </div>
      ${n.diagnosis?`<div class="rc-field"><span class="rcl">تشخیص:</span> ${s(n.diagnosis)}</div>`:""}
      ${n.treatment_plan?`<div class="rc-field"><span class="rcl">طرح درمان:</span> ${s(n.treatment_plan)}</div>`:""}
      ${n.notes?`<div class="rc-field"><span class="rcl">یادداشت:</span> ${s(n.notes)}</div>`:""}
      ${n.prescription?`<div class="rc-field"><span class="rcl">نسخه:</span> ${s(n.prescription)}</div>`:""}
    </div>`).join(""):'<div class="empty-state">جلسه درمانی ثبت نشده</div>'}
  </div>

  <div class="section">
    <div class="section-title"><span class="num">۳</span> نوبت‌ها <span class="count">${l(v.length)} نوبت</span></div>
    ${v.length>0?`
    <table>
      <thead>
        <tr>
          <th>ردیف</th><th>تاریخ</th><th>ساعت</th><th>نوع درمان</th><th>پزشک</th><th>وضعیت</th>
        </tr>
      </thead>
      <tbody>
        ${v.map((n,A)=>`<tr>
          <td>${l(A+1)}</td>
          <td>${p(n.date)}</td>
          <td>${l(n.time)}</td>
          <td>${s(n.treatment_name)||"—"}</td>
          <td>${s(n.doctor_name)||"—"}</td>
          <td><span class="status-pill" style="${m[n.status]||""}">${x[n.status]||s(n.status)}</span></td>
        </tr>`).join("")}
      </tbody>
    </table>`:'<div class="empty-state">نوبتی ثبت نشده</div>'}
  </div>

  <div class="section">
    <div class="section-title"><span class="num">۴</span> صورتحساب‌ها <span class="count">${l(f.length)} فقره</span></div>
    ${f.length>0?`
    <table>
      <thead>
        <tr>
          <th>ردیف</th><th>تاریخ</th><th>مبلغ کل</th><th>پرداختی</th><th>مانده</th><th>روش پرداخت</th><th>وضعیت</th>
        </tr>
      </thead>
      <tbody>
        ${f.map((n,A)=>`<tr>
          <td>${l(A+1)}</td>
          <td>${p(n.created_at)}</td>
          <td style="font-weight:700">${g(n.total_amount)}</td>
          <td>${g(n.paid_amount)}</td>
          <td style="font-weight:700;color:${n.status==="unpaid"?"#be123c":"#15803d"}">${g((n.total_amount||0)-(n.paid_amount||0))}</td>
          <td>${S[n.payment_method]||"—"}</td>
          <td><span class="status-pill" style="${se[n.status]||""}">${ee[n.status]||s(n.status)}</span></td>
        </tr>`).join("")}
      </tbody>
    </table>`:'<div class="empty-state">صورتحسابی ثبت نشده</div>'}
  </div>

  <div class="footer">
    <div class="footer-inner">
      <div>
        <strong style="color:#1a4a8a;">${s((o==null?void 0:o.clinic_name)||I)}</strong>
        ${o!=null&&o.phone?`<span> — تلفن: ${l(o.phone)}${o!=null&&o.phone2?` / ${l(o.phone2)}`:""}${o!=null&&o.phone3?` / ${l(o.phone3)}`:""}</span>`:""}
      </div>
      <div>تاریخ گزارش: ${p(new Date().toISOString().split("T")[0])}</div>
    </div>
    <div class="footer-note">این برگه به صورت الکترونیکی صادر شده و دارای اعتبار قانونی می‌باشد</div>
  </div>
</div>
</body>
</html>`),i.document.close(),i.print()};if(Y)return e.jsx("div",{className:"flex justify-center py-20",children:e.jsx("div",{className:"animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"})});if(!a)return e.jsx("div",{className:"text-center py-20 text-gray-500",children:"بیمار یافت نشد"});const Z=[{id:"info",label:"اطلاعات فردی",permission:"patient_info"},{id:"appointments",label:"نوبت‌ها",permission:"patient_appointments"},{id:"records",label:"پرونده پزشکی",permission:"patient_records"},{id:"billing",label:"صورتحساب",permission:"patient_billing"}].filter(s=>y(s.permission));return e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("button",{onClick:()=>c("/panel/patients"),className:"flex items-center gap-1 text-gray-600 hover:text-blue-600",children:[e.jsx(he,{size:18})," بازگشت"]}),e.jsxs("div",{className:"flex gap-2",children:[e.jsx(M,{onClick:K,variant:"outline",icon:q,children:"چاپ پرونده"}),y("patient_edit")&&e.jsx(M,{onClick:()=>E(!_),variant:_?"secondary":"gradient",icon:_?void 0:ue,children:_?"لغو ویرایش":"ویرایش اطلاعات"})]})]}),e.jsx("div",{ref:X,children:_?e.jsxs("div",{className:"card p-6",children:[e.jsx("h2",{className:"text-lg font-bold mb-5 text-surface-800",children:"ویرایش اطلاعات بیمار"}),e.jsxs("form",{onSubmit:G,className:"grid grid-cols-1 md:grid-cols-2 gap-5",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"label",children:["نام ",e.jsx("span",{className:"text-rose-500",children:"*"})]}),e.jsx("input",{name:"first_name",defaultValue:a.first_name,className:"input-field",required:!0})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"label",children:["نام خانوادگی ",e.jsx("span",{className:"text-rose-500",children:"*"})]}),e.jsx("input",{name:"last_name",defaultValue:a.last_name,className:"input-field",required:!0})]}),e.jsxs("div",{children:[e.jsx("label",{className:"label",children:"نام پدر"}),e.jsx("input",{name:"father_name",defaultValue:a.father_name||"",className:"input-field"})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"label",children:["کد ملی ",e.jsx("span",{className:"text-rose-500",children:"*"})]}),e.jsx("input",{name:"national_id",defaultValue:a.national_id,className:"input-field",required:!0})]}),e.jsxs("div",{children:[e.jsx("label",{className:"label",children:"شماره پرونده قدیمی"}),e.jsx("input",{name:"old_file_number",defaultValue:a.old_file_number||"",className:"input-field",placeholder:"برای بیماران قدیمی"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"label",children:"تحصیلات"}),e.jsxs("select",{name:"education",defaultValue:a.education||"",className:"input-field",children:[e.jsx("option",{value:"",children:"انتخاب کنید"}),e.jsx("option",{value:"ciclu",children:"سیکل"}),e.jsx("option",{value:"diplom",children:"دیپلم"}),e.jsx("option",{value:"super_diplom",children:"فوق دیپلم"}),e.jsx("option",{value:"licence",children:"لیسانس"}),e.jsx("option",{value:"master",children:"فوق لیسانس"}),e.jsx("option",{value:"doctora",children:"دکترا"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"label",children:"شغل"}),e.jsxs("select",{name:"job",defaultValue:a.job||"",className:"input-field",children:[e.jsx("option",{value:"",children:"انتخاب کنید"}),e.jsx("option",{value:"doctor",children:"پزشک"}),e.jsx("option",{value:"midwife",children:"ماما"}),e.jsx("option",{value:"engineer",children:"مهندس"}),e.jsx("option",{value:"nurse",children:"پرستار"}),e.jsx("option",{value:"employee",children:"کارمند"}),e.jsx("option",{value:"worker",children:"کارگر"}),e.jsx("option",{value:"housewife",children:"خانه دار"}),e.jsx("option",{value:"freelance",children:"آزاد"})]})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"label",children:["تلفن همراه ",e.jsx("span",{className:"text-rose-500",children:"*"})]}),e.jsx("input",{name:"phone",className:"input-field",type:"tel",defaultValue:a.phone,required:!0,placeholder:"۰۹۱۲۳۴۵۶۷۸۹"})]}),e.jsx("div",{children:e.jsx(me,{label:"تاریخ تولد",value:P,onChange:s=>V(s)})}),e.jsxs("div",{children:[e.jsx("label",{className:"label",children:"تلفن اضطراری"}),e.jsx("input",{name:"emergency_phone",className:"input-field",type:"tel",defaultValue:a.emergency_phone,placeholder:"۰۹۱۲۳۴۵۶۷۸۹"})]}),a.first_visit_date&&e.jsxs("div",{children:[e.jsx("label",{className:"label",children:"اولین مراجعه"}),e.jsx("input",{className:"input-field text-surface-400",value:p(a.first_visit_date),readOnly:!0})]}),e.jsxs("div",{className:"md:col-span-2",children:[e.jsx("label",{className:"label",children:"آدرس"}),e.jsx("textarea",{name:"address",defaultValue:a.address,className:"input-field",rows:2})]}),e.jsx("div",{className:"md:col-span-2",children:e.jsx(M,{type:"submit",variant:"gradient",className:"w-full",icon:T,children:"ذخیره تغییرات"})})]})]}):e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"card p-5",children:[e.jsxs("div",{className:"flex items-center gap-4 mb-5 pb-4 border-b border-surface-100",children:[e.jsx("div",{className:"w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center shrink-0",children:a.gender==="female"?e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",className:"w-8 h-8 text-pink-500",children:[e.jsx("circle",{cx:"12",cy:"8",r:"4",strokeLinecap:"round",strokeLinejoin:"round"}),e.jsx("path",{d:"M12 12v6M9 15h6",strokeLinecap:"round",strokeLinejoin:"round"})]}):e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",className:"w-8 h-8 text-blue-500",children:[e.jsx("circle",{cx:"12",cy:"8",r:"4",strokeLinecap:"round",strokeLinejoin:"round"}),e.jsx("path",{d:"M12 12v4M9 14h6",strokeLinecap:"round",strokeLinejoin:"round"})]})}),e.jsxs("div",{className:"min-w-0",children:[e.jsxs("h2",{className:"text-xl font-bold text-surface-800 truncate",children:[a.first_name," ",a.last_name]}),e.jsxs("p",{className:"text-sm text-surface-400",children:["کد ملی: ",l(a.national_id)]}),a.file_number&&e.jsxs("p",{className:"text-sm text-brand-500 font-bold",children:["شماره پرونده: ",N(a.file_number),a.old_file_number?e.jsxs("span",{className:"text-surface-400 font-normal mr-3",children:["قدیمی: ",N(a.old_file_number)]}):""]})]})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-y-3 gap-x-6 text-sm",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(be,{size:15,className:"text-surface-400 shrink-0"}),e.jsx("span",{className:"truncate",children:l(a.phone)})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(ce,{size:15,className:"text-surface-400 shrink-0"}),e.jsxs("span",{className:"truncate",children:[p(a.birth_date)||"—",a.age?e.jsxs("span",{className:"text-brand-600 font-bold mr-1",children:["(",F(a.age),")"]}):""]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(ge,{size:15,className:"text-surface-400 shrink-0"}),e.jsx("span",{className:"truncate",children:a.address||"—"})]}),a.father_name&&e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"text-surface-400 font-medium shrink-0",children:"نام پدر:"})," ",e.jsx("span",{className:"truncate",children:a.father_name})]}),a.emergency_phone&&e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"text-surface-400 font-medium shrink-0",children:"تلفن اضطراری:"})," ",e.jsx("span",{className:"truncate",children:l(a.emergency_phone)})]}),a.first_visit_date&&e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"text-surface-400 font-medium shrink-0",children:"اولین مراجعه:"})," ",e.jsx("span",{className:"truncate",children:p(a.first_visit_date)})]}),a.education&&e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"text-surface-400 font-medium shrink-0",children:"تحصیلات:"})," ",e.jsx("span",{className:"truncate",children:{ciclu:"سیکل",diplom:"دیپلم",super_diplom:"فوق دیپلم",licence:"لیسانس",master:"فوق لیسانس",doctora:"دکترا"}[a.education]||a.education})]}),a.job&&e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"text-surface-400 font-medium shrink-0",children:"شغل:"})," ",e.jsx("span",{className:"truncate",children:{doctor:"پزشک",midwife:"ماما",engineer:"مهندس",nurse:"پرستار",employee:"کارمند",worker:"کارگر",housewife:"خانه دار",freelance:"آزاد"}[a.job]||a.job})]}),a.old_file_number&&e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"text-surface-400 font-medium shrink-0",children:"شماره پرونده قدیمی:"})," ",e.jsx("span",{className:"truncate",children:N(a.old_file_number)})]}),a.medical_history&&e.jsxs("div",{className:"md:col-span-3 flex items-start gap-2 pt-2 border-t border-surface-50",children:[e.jsx(T,{size:15,className:"text-surface-400 mt-0.5 shrink-0"}),e.jsx("span",{className:"text-surface-700",children:a.medical_history})]})]})]}),e.jsxs("div",{className:"card p-5",children:[e.jsx("div",{className:"flex border-b border-surface-100 mb-5 -mx-5 px-5 overflow-x-auto",children:Z.map(s=>e.jsx("button",{onClick:()=>W(s.id),className:`px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap -mb-px ${b===s.id?"border-brand-500 text-brand-500":"border-transparent text-surface-400 hover:text-surface-600"}`,children:s.label},s.id))}),b==="appointments"&&e.jsx("div",{className:"-mx-5 -mb-5",children:e.jsx("div",{className:"table-wrap",children:e.jsxs("table",{children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-center",children:"تاریخ"}),e.jsx("th",{className:"text-center",children:"ساعت"}),e.jsx("th",{className:"text-center",children:"نوع درمان"}),e.jsx("th",{className:"text-center",children:"پزشک / درمانگر"}),e.jsx("th",{className:"text-center",children:"وضعیت"})]})}),e.jsx("tbody",{children:v.length===0?e.jsx("tr",{children:e.jsx("td",{colSpan:5,className:"text-center py-10 text-surface-400",children:"نوبتی ثبت نشده"})}):v.map(s=>e.jsxs("tr",{children:[e.jsx("td",{className:"text-center",children:p(s.date)}),e.jsx("td",{className:"text-center",children:l(s.time)}),e.jsx("td",{className:"text-center",children:s.treatment_name}),e.jsx("td",{className:"text-center",children:s.doctor_name}),e.jsx("td",{className:"text-center",children:e.jsx(O,{status:s.status,label:s.status==="completed"?"انجام شده":s.status==="cancelled"?"لغو شده":s.status==="rescheduled"?"تغییر یافته":"نوبت‌گذاری شده"})})]},s.id))})]})})}),b==="records"&&e.jsx("div",{className:"space-y-3",children:j.length===0?e.jsx("p",{className:"text-center py-10 text-surface-400",children:"پرونده پزشکی ثبت نشده"}):j.map(s=>{var t;return e.jsxs("div",{className:"border border-surface-100 rounded-2xl p-4 bg-surface-50/30",children:[e.jsxs("div",{className:"flex justify-between items-center mb-3 pb-2 border-b border-surface-100",children:[e.jsxs("span",{className:"font-bold text-surface-700",children:["جلسه ",l(s.session_number)," - ",p(s.date)]}),e.jsx("span",{className:"text-sm text-surface-400",children:s.doctor_name})]}),s.diagnosis&&e.jsxs("p",{className:"text-sm mb-2",children:[e.jsx("span",{className:"font-semibold text-surface-600",children:"تشخیص:"})," ",e.jsx("span",{className:"text-surface-700",children:s.diagnosis})]}),s.treatment_plan&&e.jsxs("p",{className:"text-sm mb-2",children:[e.jsx("span",{className:"font-semibold text-surface-600",children:"طرح درمان:"})," ",e.jsx("span",{className:"text-surface-700",children:s.treatment_plan})]}),s.notes&&e.jsxs("p",{className:"text-sm mb-2",children:[e.jsx("span",{className:"font-semibold text-surface-600",children:"یادداشت:"})," ",e.jsx("span",{className:"text-surface-700",children:s.notes})]}),s.prescription&&e.jsxs("div",{className:"flex items-start gap-2",children:[e.jsxs("p",{className:"text-sm flex-1",children:[e.jsx("span",{className:"font-semibold text-surface-600",children:"نسخه:"})," ",e.jsx("span",{className:"text-surface-700",children:s.prescription})]}),e.jsx("button",{onClick:()=>{const i=window.open("","","width=600,height=800");i.document.write(ve(s,d,o)),i.document.close()},className:"action-btn shrink-0 mt-0.5",title:"چاپ نسخه",children:e.jsx(q,{size:14})})]}),((t=s.files)==null?void 0:t.length)>0&&e.jsx("div",{className:"mt-3 flex gap-2 flex-wrap",children:s.files.map((i,x)=>{const m=/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(i.file);return e.jsxs("button",{onClick:()=>L({files:s.files,index:x}),className:"text-xs bg-surface-100 text-surface-600 px-3 py-1.5 rounded-xl flex items-center gap-1.5 hover:bg-brand-50 hover:text-brand-600 transition-all",children:[m?e.jsx(oe,{size:12}):e.jsx(T,{size:12})," ",i.description||"فایل"]},i.id)})})]},s.id)})}),b==="billing"&&e.jsxs("div",{children:[f.length>0&&e.jsx("div",{className:"grid grid-cols-3 gap-3 mb-5",children:(()=>{const s=f.reduce((x,m)=>x+Number(m.total_amount||0),0),t=f.reduce((x,m)=>x+Number(m.paid_amount||0),0),i=s-t;return e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"stat-card card-corner-ornament justify-center text-center p-4",children:e.jsxs("div",{children:[e.jsx("div",{className:"text-xs text-brand-500 font-medium mb-1",children:"جمع صورت‌حساب"}),e.jsx("div",{className:"text-lg font-extrabold text-surface-800",children:g(s)}),e.jsx("div",{className:"text-[10px] text-surface-400",children:"تومان"})]})}),e.jsx("div",{className:"stat-card card-corner-ornament justify-center text-center p-4",children:e.jsxs("div",{children:[e.jsx("div",{className:"text-xs text-success-500 font-medium mb-1",children:"پرداخت شده"}),e.jsx("div",{className:"text-lg font-extrabold text-surface-800",children:g(t)}),e.jsx("div",{className:"text-[10px] text-surface-400",children:"تومان"})]})}),e.jsx("div",{className:`stat-card justify-center text-center p-4 ${i>0?"border-rose-200":"border-success-200"}`,children:e.jsxs("div",{children:[e.jsx("div",{className:`text-xs font-medium mb-1 ${i>0?"text-rose-500":"text-success-500"}`,children:"مانده حساب"}),e.jsx("div",{className:`text-lg font-extrabold ${i>0?"text-rose-700":"text-success-700"}`,children:i>0?g(i):"تسویه"}),e.jsx("div",{className:`text-[10px] ${i>0?"text-rose-400":"text-success-400"}`,children:i>0?"تومان":"کامل"})]})})]})})()}),e.jsx("div",{className:"-mx-5 -mb-5",children:e.jsx("div",{className:"table-wrap",children:e.jsxs("table",{children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-center",children:"تاریخ"}),e.jsx("th",{className:"text-center",children:"نوع"}),e.jsx("th",{className:"text-center",children:"مبلغ کل"}),e.jsx("th",{className:"text-center",children:"پرداختی"}),e.jsx("th",{className:"text-center",children:"روش پرداخت"}),e.jsx("th",{className:"text-center",children:"وضعیت"})]})}),e.jsx("tbody",{children:f.length===0?e.jsx("tr",{children:e.jsx("td",{colSpan:6,className:"text-center py-10 text-surface-400",children:"صورتحسابی ثبت نشده"})}):f.map(s=>e.jsxs("tr",{children:[e.jsx("td",{className:"text-center",children:p(s.created_at)}),e.jsx("td",{className:"text-center",children:s.cost_type==="visit"?"ویزیت":s.cost_type==="service"?"خدمات":"—"}),e.jsx("td",{className:"text-center font-bold",children:g(s.total_amount)}),e.jsx("td",{className:"text-center",children:g(s.paid_amount)}),e.jsx("td",{className:"text-center",children:s.payment_method==="cash"?"نقدی":s.payment_method==="card"?"کارت":s.payment_method==="insurance"?"بیمه":"کارت به کارت"}),e.jsx("td",{className:"text-center",children:e.jsx(O,{status:s.status})})]},s.id))})]})})})]}),b==="info"&&e.jsxs("div",{className:"space-y-5",children:[e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"text-surface-400 font-medium min-w-[90px]",children:"شماره پرونده:"}),e.jsx("span",{className:"font-semibold text-surface-700",children:a.file_number?N(a.file_number):"—"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"text-surface-400 font-medium min-w-[90px]",children:"پرونده قدیمی:"}),e.jsx("span",{className:"font-semibold text-surface-700",children:a.old_file_number?N(a.old_file_number):"—"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"text-surface-400 font-medium min-w-[90px]",children:"تاریخ ثبت:"}),e.jsx("span",{className:"font-semibold text-surface-700",children:p(a.created_at)})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"text-surface-400 font-medium min-w-[90px]",children:"نام پدر:"}),e.jsx("span",{className:"font-semibold text-surface-700",children:a.father_name||"—"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"text-surface-400 font-medium min-w-[90px]",children:"تحصیلات:"}),e.jsx("span",{className:"font-semibold text-surface-700",children:{ciclu:"سیکل",diplom:"دیپلم",super_diplom:"فوق دیپلم",licence:"لیسانس",master:"فوق لیسانس",doctora:"دکترا"}[a.education]||"—"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"text-surface-400 font-medium min-w-[90px]",children:"شغل:"}),e.jsx("span",{className:"font-semibold text-surface-700",children:{doctor:"پزشک",midwife:"ماما",engineer:"مهندس",nurse:"پرستار",employee:"کارمند",worker:"کارگر",housewife:"خانه دار",freelance:"آزاد"}[a.job]||"—"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"text-surface-400 font-medium min-w-[90px]",children:"سن:"}),e.jsx("span",{className:"font-semibold text-surface-700",children:a.age?F(a.age):"—"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"text-surface-400 font-medium min-w-[90px]",children:"اولین مراجعه:"}),e.jsx("span",{className:"font-semibold text-surface-700",children:a.first_visit_date?p(a.first_visit_date):"—"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"text-surface-400 font-medium min-w-[90px]",children:"تعداد نوبت‌ها:"}),e.jsx("span",{className:"font-semibold text-surface-700",children:l(v.length)})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"text-surface-400 font-medium min-w-[90px]",children:"جلسات درمانی:"}),e.jsx("span",{className:"font-semibold text-surface-700",children:l(j.length)})]})]}),f.length>0&&(()=>{const s=f.reduce((x,m)=>x+parseInt(m.total_amount||0),0),t=f.reduce((x,m)=>x+parseInt(m.paid_amount||0),0),i=s-t;return e.jsxs("div",{className:"border-t border-surface-100 pt-4",children:[e.jsx("h4",{className:"font-bold text-surface-700 mb-3 text-sm",children:"خلاصه مالی"}),e.jsxs("div",{className:"grid grid-cols-3 gap-3",children:[e.jsx("div",{className:"stat-card card-corner-ornament justify-center text-center p-3",children:e.jsxs("div",{children:[e.jsx("div",{className:"text-xs text-brand-500 font-medium",children:"جمع صورت‌حساب"}),e.jsx("div",{className:"text-base font-extrabold text-surface-800",children:g(s)}),e.jsx("div",{className:"text-[10px] text-surface-400",children:"تومان"})]})}),e.jsx("div",{className:"stat-card card-corner-ornament justify-center text-center p-3",children:e.jsxs("div",{children:[e.jsx("div",{className:"text-xs text-success-500 font-medium",children:"پرداخت شده"}),e.jsx("div",{className:"text-base font-extrabold text-surface-800",children:g(t)}),e.jsx("div",{className:"text-[10px] text-surface-400",children:"تومان"})]})}),e.jsx("div",{className:`stat-card justify-center text-center p-3 ${i>0?"border-rose-200":"border-success-200"}`,children:e.jsxs("div",{children:[e.jsx("div",{className:`text-xs font-medium ${i>0?"text-rose-500":"text-success-500"}`,children:"مانده حساب"}),e.jsx("div",{className:`text-base font-extrabold ${i>0?"text-rose-700":"text-success-700"}`,children:i>0?g(i):"تسویه"}),e.jsx("div",{className:`text-[10px] ${i>0?"text-rose-400":"text-success-400"}`,children:i>0?"تومان":"کامل"})]})})]})]})})()]})]})]})}),C&&e.jsx(fe,{files:C.files,initialIndex:C.index,onClose:()=>L(null)})]})}export{Ae as default};
