import{d1 as ne,d0 as ie,d4 as le,cc as o,bM as J,B as p,bt as re,cp as ce,bW as e,cE as u,cw as E,aP as L,cC as F,cV as de,ah as oe,az as me}from"./index-DnqYjpHt.js";import{J as pe}from"./JalaliDateInput-DyxKvo1R.js";import{P as xe}from"./plus-BxmZwckX.js";import{P as he}from"./printer-D-l9Qu1S.js";import{P as ue}from"./pen-D6zjvuOg.js";import{T as ve}from"./trash-2-DfIhaNuo.js";import"./calendar-days-DlbXYl41.js";const U=30;function fe($,A){const c=A||{},n=$||{},T=n.sessions||[],z=F(new Date().toISOString().split("T")[0]),C=Array.from({length:U},(D,v)=>{const h=T[v]||{};return`<tr>
      <td style="text-align:center;font-weight:700;color:#1e3a5f;width:36px;">${u(v+1)}</td>
      <td style="text-align:center;">${h.protocol||""}</td>
      <td style="text-align:center;">${h.duration||""}</td>
      <td>${h.course||""}</td>
    </tr>`}).join("");return`<html dir="rtl"><head>
  <meta charset="UTF-8" />
  <title>فرم TMS</title>
  <style>
    @page { margin: 1.8cm 1.2cm; size: A4; }
    @font-face { font-family: 'Vazirmatn'; font-weight: 300; src: url('/fonts/webfonts/Vazirmatn-Light.woff2') format('woff2'); }
    @font-face { font-family: 'Vazirmatn'; font-weight: 400; src: url('/fonts/webfonts/Vazirmatn-Medium.woff2') format('woff2'); }
    @font-face { font-family: 'Vazirmatn'; font-weight: 700; src: url('/fonts/webfonts/Vazirmatn-Bold.woff2') format('woff2'); }
    @font-face { font-family: 'Vazirmatn'; font-weight: 900; src: url('/fonts/webfonts/Vazirmatn-ExtraBold.woff2') format('woff2'); }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Vazirmatn', Tahoma, Arial, sans-serif;
      font-size: 9px; color: #1e293b; line-height: 1.8; padding: 0;
    }
    .page { page-break-after: always; }
    .brand { position: relative; text-align: center; padding-bottom: 10px; margin-bottom: 14px; }
    .brand::after { content: ''; position: absolute; bottom: 0; right: 30%; left: 30%; height: 1px; background: linear-gradient(90deg, transparent, #94a3b8, transparent); }
    .brand h1 { font-size: 14px; font-weight: 700; color: #1e3a5f; letter-spacing: 1px; }
    .brand .sub { font-size: 8px; color: #64748b; font-weight: 300; }
    .form-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 6px 10px; background: #fafafa; border: 1px solid #e2e8f0; }
    .form-meta .code-badge { background: #1e3a5f; color: #fff; padding: 3px 10px; font-size: 8px; font-weight: 700; letter-spacing: 0.5px; }
    .form-meta .date { font-size: 8px; color: #94a3b8; }
    .patient-box {
      display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 3px 12px;
      padding: 8px 10px; border: 1px solid #e2e8f0; margin-bottom: 12px;
    }
    .patient-box .item { font-size: 8px; }
    .patient-box .item .lbl { color: #94a3b8; }
    .patient-box .item .val { color: #1e293b; font-weight: 700; margin-right: 3px; }
    .patient-box .item.full { grid-column: 1 / -1; }
    .section { margin-bottom: 10px; border: 1px solid #e2e8f0; }
    .section-title { background: #f8fafc; color: #1e3a5f; padding: 5px 10px; font-size: 9px; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
    .section-body { padding: 6px 10px; }
    .symptom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; }
    .symptom-item .lbl { font-weight: 700; color: #475569; font-size: 8px; }
    .symptom-item .val { color: #334155; font-size: 8px; padding-right: 4px; white-space: pre-wrap; }
    .symptom-item.full { grid-column: 1 / -1; }
    .protocol-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
    .protocol-box { border: 1px solid #e2e8f0; padding: 5px 6px; }
    .protocol-box .ptitle { font-weight: 700; color: #1e3a5f; font-size: 8px; margin-bottom: 2px; }
    .protocol-box .pval { font-size: 8px; white-space: pre-wrap; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f8fafc; color: #475569; font-weight: 700; padding: 4px 5px; text-align: center; font-size: 8px; border-bottom: 1px solid #e2e8f0; }
    td { padding: 3px 5px; text-align: center; font-size: 8px; border-bottom: 1px solid #f1f5f9; color: #334155; }
    tbody tr:last-child td { border-bottom: none; }
    .consent-box { margin-top: 14px; padding: 10px 12px; border: 1px solid #1e3a5f; background: #fafafa; }
    .consent-box p { font-size: 9px; line-height: 2.2; text-align: justify; }
    .consent-sign { display: flex; justify-content: space-between; margin-top: 10px; padding-top: 6px; border-top: 1px solid #e2e8f0; }
    .consent-sign .field { font-size: 9px; }
    .consent-sign .field .flbl { color: #94a3b8; }
    .consent-sign .field .fval { font-weight: 700; margin-right: 3px; }
    .note-text { text-align: center; font-size: 8px; color: #64748b; padding: 6px; background: #f1f5f9; margin-bottom: 8px; font-weight: 700; }
  </style></head><body>
  <div class="page">
    <div class="brand">
      <h1>مطب تخصصی دکتر محمد طاهری</h1>
      <div class="sub">کلینیک تخصصی مغز و اعصاب و روان — فرم ارزیابی TMS</div>
    </div>
    <div class="form-meta">
      <div class="code-badge">کد خدمت: ${E(n.service_code||"900115")}</div>
      <div class="date">تاریخ: ${F(n.date)||z}</div>
    </div>
    <div class="patient-box">
      <div class="item"><span class="lbl">نام و نام خانوادگی:</span><span class="val">${c.first_name||""} ${c.last_name||""}</span></div>
      <div class="item"><span class="lbl">شماره پرونده:</span><span class="val">${c.file_number?E(c.file_number):"—"}</span></div>
      <div class="item"><span class="lbl">سن:</span><span class="val">${c.age?L(c.age):"—"}</span></div>
      <div class="item"><span class="lbl">تحصیلات:</span><span class="val">${c.education?{ciclu:"سیکل",diplom:"دیپلم",super_diplom:"فوق دیپلم",licence:"لیسانس",master:"فوق لیسانس",doctora:"دکترا"}[c.education]||c.education:"—"}</span></div>
      <div class="item"><span class="lbl">شغل:</span><span class="val">${{doctor:"پزشک",midwife:"ماما",engineer:"مهندس",nurse:"پرستار",employee:"کارمند",worker:"کارگر",housewife:"خانه دار",freelance:"آزاد"}[c.job]||c.job||"—"}</span></div>
      <div class="item"><span class="lbl">شماره تماس:</span><span class="val">${c.phone?u(c.phone):"—"}</span></div>
      <div class="item full"><span class="lbl">آدرس:</span><span class="val">${c.address||"—"}</span></div>
    </div>

    <div class="section">
      <div class="section-title">علائم جاری بیمار</div>
      <div class="section-body">
        <div class="symptom-grid">
          <div class="symptom-item"><div class="lbl">خلقی:</div><div class="val">${n.current_mood||"—"}</div></div>
          <div class="symptom-item"><div class="lbl">سایکوتیک:</div><div class="val">${n.current_psychotic||"—"}</div></div>
          <div class="symptom-item"><div class="lbl">ناشی از مواد:</div><div class="val">${n.current_substance||"—"}</div></div>
          <div class="symptom-item"><div class="lbl">اضطرابی:</div><div class="val">${n.current_anxiety||"—"}</div></div>
          <div class="symptom-item"><div class="lbl">شناختی:</div><div class="val">${n.current_cognitive||"—"}</div></div>
          <div class="symptom-item"><div class="lbl">جسمانی:</div><div class="val">${n.current_physical||"—"}</div></div>
          <div class="symptom-item"><div class="lbl">اختلال شخصیت:</div><div class="val">${n.current_personality_disorder||"—"}</div></div>
          <div class="symptom-item"><div class="lbl">اختلال وسواسی:</div><div class="val">${n.current_ocd||"—"}</div></div>
          <div class="symptom-item full"><div class="lbl">تشخیص قبلی:</div><div class="val">${n.previous_diagnosis||"—"}</div></div>
          <div class="symptom-item full"><div class="lbl">تشخیص فعلی:</div><div class="val">${n.current_diagnosis||"—"}</div></div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">سوابق درمانی</div>
      <div class="section-body"><div style="white-space:pre-wrap;">${n.treatment_history||"—"}</div></div>
    </div>

    <div class="section">
      <div class="section-title">داروهای مورد استفاده فعلی</div>
      <div class="section-body"><div style="white-space:pre-wrap;">${n.current_medications||"—"}</div></div>
    </div>

    <div class="section">
      <div class="section-title">موارد استفاده از TMS و یافته‌های QEEG</div>
      <div class="section-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div><div style="font-weight:700;color:#475569;font-size:8px;">موارد استفاده از TMS:</div><div style="font-size:8px;white-space:pre-wrap;margin-top:2px;">${n.tms_usage||"—"}</div></div>
          <div><div style="font-weight:700;color:#475569;font-size:8px;">یافته‌های QEEG:</div><div style="font-size:8px;white-space:pre-wrap;margin-top:2px;">${n.qeeg_findings||"—"}</div></div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">پروتکل درمانی</div>
      <div class="section-body">
        <div class="protocol-grid">
          <div class="protocol-box"><div class="ptitle">پروتکل ۱</div><div class="pval">${n.protocol1||"—"}</div></div>
          <div class="protocol-box"><div class="ptitle">پروتکل ۲</div><div class="pval">${n.protocol2||"—"}</div></div>
          <div class="protocol-box"><div class="ptitle">پروتکل ۳</div><div class="pval">${n.protocol3||"—"}</div></div>
        </div>
      </div>
    </div>
  </div>

  <div class="page">
    <div class="brand">
      <h1>مطب تخصصی دکتر محمد طاهری</h1>
      <div class="sub">فرم TMS — جلسات درمان</div>
    </div>
    <div class="note-text">
      لازم به ذکر است که علائم بهبودی بعد از جلسه هشتم تا دوازدهم خود را نشان می‌دهد.
    </div>
    <table>
      <thead><tr>
        <th style="width:36px">جلسه</th>
        <th>نوع پروتکل</th>
        <th>مدت زمان</th>
        <th>سیر و عوارض</th>
      </tr></thead>
      <tbody>${C}</tbody>
    </table>
    <div class="consent-box">
      <p>
        اینجانب <strong>${n.consent_patient_name||"........................"}</strong>
        نام پدر <strong>${n.consent_father_name||"........................"}</strong>
        به صورت آگاهانه روش درمانی TMS را با اطلاع از عوارض جانبی و درمان‌های دیگر انتخاب نموده‌ام
        و رضایت از انجام درمان با TMS دارم و به سوالات پرسیده شده به دقت پاسخ داده‌ام.
      </p>
      <div class="consent-sign">
        <div class="field"><span class="flbl">نام و نام خانوادگی:</span><span class="fval">${n.consent_patient_name||"........................"}</span></div>
        <div class="field"><span class="flbl">امضا:</span><span class="fval">${n.consent_signature||"........................"}</span></div>
      </div>
    </div>
  </div>
</body></html>`}function Se(){const $=ne(),{hasPermission:A}=ie(),[c]=le(),[n,T]=o.useState([]),[z,C]=o.useState(!0),[D,v]=o.useState(!1),[h,I]=o.useState(null),[V,R]=o.useState(!1),[q,g]=o.useState(""),[O,b]=o.useState([]),[H,G]=o.useState(!1),[j,_]=o.useState(null),[m,y]=o.useState(null),[M,N]=o.useState(""),P=o.useRef(null),W=o.useRef(null),[i,f]=o.useState({service_code:"900115",current_mood:"",current_psychotic:"",current_substance:"",current_anxiety:"",current_cognitive:"",current_physical:"",current_personality_disorder:"",current_ocd:"",previous_diagnosis:"",current_diagnosis:"",treatment_history:"",current_medications:"",tms_usage:"",qeeg_findings:"",protocol1:"",protocol2:"",protocol3:"",sessions:[],consent_patient_name:"",consent_father_name:"",consent_signature:""});o.useEffect(()=>{w()},[]),o.useEffect(()=>{const s=c.get("patient");s&&K(Number(s))},[c]);const w=async()=>{try{const{data:s}=await J();T(Array.isArray(s)?s:s.results||[])}catch{p.error("متأسفانه در دریافت فرم‌های TMS خطایی رخ داد ")}finally{C(!1)}},K=async s=>{try{const{data:t}=await re(s);_(t),y(t);const d=new Date().toISOString().split("T")[0];N(d),g(`${t.first_name} ${t.last_name} - ${t.national_id}`),f(a=>({...a,consent_patient_name:`${t.first_name} ${t.last_name}`,consent_father_name:t.father_name||""})),v(!0)}catch{p.error("متأسفانه در دریافت اطلاعات بیمار خطایی رخ داد ")}},X=o.useCallback(s=>{if(g(s),P.current&&clearTimeout(P.current),!s.trim()){b([]);return}P.current=setTimeout(async()=>{G(!0);try{const d=(await ce(s)).data;b(Array.isArray(d)?d:d.results||[])}catch{b([])}finally{G(!1)}},400)},[]),Y=s=>{_(s),y(s),g(`${s.first_name} ${s.last_name} - ${s.national_id}`),b([]),f(t=>({...t,consent_patient_name:`${s.first_name} ${s.last_name}`,consent_father_name:s.father_name||""}))},Z=()=>{_(null),y(null),g(""),f(s=>({...s,consent_patient_name:"",consent_father_name:""}))},l=(s,t)=>{f(d=>({...d,[s]:t}))},k=(s,t,d)=>{f(a=>{const r=[...a.sessions||[]];return r[s]||(r[s]={protocol:"",duration:"",course:""}),r[s]={...r[s],[t]:d},{...a,sessions:r}})},S=()=>{v(!1),I(null),_(null),y(null),g(""),b([]),N(""),f({service_code:"900115",current_mood:"",current_psychotic:"",current_substance:"",current_anxiety:"",current_cognitive:"",current_physical:"",current_personality_disorder:"",current_ocd:"",previous_diagnosis:"",current_diagnosis:"",treatment_history:"",current_medications:"",tms_usage:"",qeeg_findings:"",protocol1:"",protocol2:"",protocol3:"",sessions:[],consent_patient_name:"",consent_father_name:"",consent_signature:""})},ee=async s=>{try{const{data:t}=await J(),a=(Array.isArray(t)?t:t.results||[]).find(r=>r.id===s);if(!a){p.error("متأسفانه فرم TMS مورد نظر یافت نشد ");return}if(I(s),f({service_code:a.service_code||"900115",current_mood:a.current_mood||"",current_psychotic:a.current_psychotic||"",current_substance:a.current_substance||"",current_anxiety:a.current_anxiety||"",current_cognitive:a.current_cognitive||"",current_physical:a.current_physical||"",current_personality_disorder:a.current_personality_disorder||"",current_ocd:a.current_ocd||"",previous_diagnosis:a.previous_diagnosis||"",current_diagnosis:a.current_diagnosis||"",treatment_history:a.treatment_history||"",current_medications:a.current_medications||"",tms_usage:a.tms_usage||"",qeeg_findings:a.qeeg_findings||"",protocol1:a.protocol1||"",protocol2:a.protocol2||"",protocol3:a.protocol3||"",sessions:a.sessions||[],consent_patient_name:a.consent_patient_name||"",consent_father_name:a.consent_father_name||"",consent_signature:a.consent_signature||""}),N(a.date||""),_({id:a.patient}),y(a.patient_info||null),a.patient_info){const r=a.patient_info;g(`${r.first_name} ${r.last_name} - ${r.national_id}`)}v(!0)}catch{p.error("متأسفانه در دریافت اطلاعات فرم TMS خطایی رخ داد ")}},se=async s=>{var d,a,r,Q;if(s.preventDefault(),!(j!=null&&j.id)){p.error("لطفاً ابتدا بیمار مورد نظر را انتخاب کنید ");return}if(!M){p.error("لطفاً تاریخ مربوطه را وارد کنید ");return}R(!0);const t={patient:j.id,date:M,...i};try{if(h)await de(h,t),p.success("فرم TMS با موفقیت به‌روزرسانی شد "),S(),w();else{await oe(t),p.success("فرم TMS جدید با موفقیت ثبت شد ");const x=c.get("appointment");if(x){$(`/panel/waiting-list?openRecord=${x}`);return}S(),w()}}catch(x){const B=((a=(d=x==null?void 0:x.response)==null?void 0:d.data)==null?void 0:a.detail)||((Q=(r=x==null?void 0:x.response)==null?void 0:r.data)==null?void 0:Q[0])||"متأسفانه در ذخیره فرم TMS خطایی رخ داد ";p.error(typeof B=="string"?B:"متأسفانه در ذخیره فرم TMS خطایی رخ داد ")}finally{R(!1)}},ae=async s=>{if(confirm("آیا از حذف این فرم TMS اطمینان دارید؟"))try{await me(s),p.success("فرم TMS با موفقیت حذف شد "),w()}catch{p.error("متأسفانه در حذف فرم TMS خطایی رخ داد ")}},te=s=>{const t=window.open("","","width=900,height=650");t&&(t.document.write(fe(s,s.patient_info)),t.document.close(),setTimeout(()=>t.print(),300))};return z?e.jsx("div",{className:"flex justify-center py-20",children:e.jsx("div",{className:"animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"})}):D?e.jsxs("div",{className:"max-w-5xl mx-auto space-y-4",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("button",{onClick:S,className:"flex items-center gap-1 text-gray-600 hover:text-blue-600",children:"← بازگشت"}),e.jsx("h2",{className:"text-lg font-bold",children:h?"ویرایش فرم TMS":"فرم جدید TMS"})]}),e.jsxs("form",{onSubmit:se,className:"space-y-4",children:[e.jsxs("div",{className:"card",children:[e.jsx("div",{className:"panel-header panel-header-iranian",children:e.jsx("h3",{children:"اطلاعات فرم"})}),e.jsxs("div",{className:"panel-body",children:[e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4",children:[e.jsxs("div",{className:"relative",children:[e.jsxs("label",{className:"label",children:["بیمار ",e.jsx("span",{className:"text-red-500",children:"*"})]}),j&&!H?e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("input",{className:"input-field",value:q,readOnly:!0}),e.jsx("button",{type:"button",onClick:Z,className:"text-red-500 text-sm",children:"حذف"})]}):e.jsxs("div",{ref:W,className:"relative",children:[e.jsx("input",{className:"input-field",placeholder:"جستجوی بیمار...",value:q,onChange:s=>X(s.target.value)}),O.length>0&&e.jsx("div",{className:"absolute z-[100] top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto",children:O.map(s=>e.jsxs("button",{type:"button",onClick:()=>Y(s),className:"w-full text-right px-3 py-2.5 hover:bg-slate-50 border-b border-slate-50 text-sm",children:[e.jsxs("div",{className:"font-medium",children:[s.first_name," ",s.last_name]}),e.jsxs("div",{className:"text-xs text-gray-400",children:[u(s.national_id)," - ",s.phone?u(s.phone):""]})]},s.id))})]})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"label",children:["تاریخ ",e.jsx("span",{className:"text-red-500",children:"*"})]}),e.jsx(pe,{value:M,onChange:N})]}),e.jsxs("div",{children:[e.jsx("label",{className:"label",children:"کد خدمت"}),e.jsx("input",{className:"input-field ltr",value:i.service_code,onChange:s=>l("service_code",s.target.value)})]})]}),m&&e.jsxs("div",{className:"mt-3 p-3 bg-slate-50 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-2 text-sm",children:[e.jsxs("div",{className:"md:col-span-2",children:[e.jsx("span",{className:"text-gray-500",children:"نام و نام خانوادگی:"})," ",e.jsxs("span",{className:"font-medium",children:[m.first_name," ",m.last_name]})]}),e.jsxs("div",{children:[e.jsx("span",{className:"text-gray-500",children:"کد ملی:"})," ",e.jsx("span",{className:"font-medium ltr",dir:"ltr",children:u(m.national_id)})]}),e.jsxs("div",{children:[e.jsx("span",{className:"text-gray-500",children:"نام پدر:"})," ",e.jsx("span",{className:"font-medium",children:m.father_name||"—"})]}),e.jsxs("div",{children:[e.jsx("span",{className:"text-gray-500",children:"شماره پرونده:"})," ",e.jsx("span",{className:"font-medium",children:m.file_number?E(m.file_number):"—"})]}),e.jsxs("div",{children:[e.jsx("span",{className:"text-gray-500",children:"سن:"})," ",e.jsx("span",{className:"font-medium",children:m.age?L(m.age):"—"})]}),e.jsxs("div",{children:[e.jsx("span",{className:"text-gray-500",children:"شماره تماس:"})," ",e.jsx("span",{className:"font-medium ltr",dir:"ltr",children:u(m.phone)})]}),e.jsxs("div",{className:"col-span-2",children:[e.jsx("span",{className:"text-gray-500",children:"تحصیلات:"})," ",e.jsx("span",{className:"font-medium",children:{ciclu:"سیکل",diplom:"دیپلم",super_diplom:"فوق دیپلم",licence:"لیسانس",master:"فوق لیسانس",doctora:"دکترا"}[m.education]||m.education||"—"})]}),e.jsxs("div",{className:"col-span-2",children:[e.jsx("span",{className:"text-gray-500",children:"شغل:"})," ",e.jsx("span",{className:"font-medium",children:{doctor:"پزشک",midwife:"ماما",engineer:"مهندس",nurse:"پرستار",employee:"کارمند",worker:"کارگر",housewife:"خانه دار",freelance:"آزاد"}[m.job]||m.job||"—"})]}),m.address&&e.jsxs("div",{className:"col-span-4",children:[e.jsx("span",{className:"text-gray-500",children:"آدرس:"})," ",e.jsx("span",{className:"font-medium",children:m.address})]})]})]})]}),e.jsxs("div",{className:"card",children:[e.jsx("div",{className:"panel-header panel-header-iranian",children:e.jsx("h3",{children:"علائم جاری بیمار"})}),e.jsx("div",{className:"panel-body",children:e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"label",children:"خلقی"}),e.jsx("textarea",{className:"input-field",rows:2,value:i.current_mood,onChange:s=>l("current_mood",s.target.value)})]}),e.jsxs("div",{children:[e.jsx("label",{className:"label",children:"سایکوتیک"}),e.jsx("textarea",{className:"input-field",rows:2,value:i.current_psychotic,onChange:s=>l("current_psychotic",s.target.value)})]}),e.jsxs("div",{children:[e.jsx("label",{className:"label",children:"ناشی از مواد"}),e.jsx("textarea",{className:"input-field",rows:2,value:i.current_substance,onChange:s=>l("current_substance",s.target.value)})]}),e.jsxs("div",{children:[e.jsx("label",{className:"label",children:"اضطرابی"}),e.jsx("textarea",{className:"input-field",rows:2,value:i.current_anxiety,onChange:s=>l("current_anxiety",s.target.value)})]}),e.jsxs("div",{children:[e.jsx("label",{className:"label",children:"شناختی"}),e.jsx("textarea",{className:"input-field",rows:2,value:i.current_cognitive,onChange:s=>l("current_cognitive",s.target.value)})]}),e.jsxs("div",{children:[e.jsx("label",{className:"label",children:"جسمانی"}),e.jsx("textarea",{className:"input-field",rows:2,value:i.current_physical,onChange:s=>l("current_physical",s.target.value)})]}),e.jsxs("div",{children:[e.jsx("label",{className:"label",children:"اختلال شخصیت"}),e.jsx("textarea",{className:"input-field",rows:2,value:i.current_personality_disorder,onChange:s=>l("current_personality_disorder",s.target.value)})]}),e.jsxs("div",{children:[e.jsx("label",{className:"label",children:"اختلال وسواسی"}),e.jsx("textarea",{className:"input-field",rows:2,value:i.current_ocd,onChange:s=>l("current_ocd",s.target.value)})]}),e.jsxs("div",{className:"md:col-span-2",children:[e.jsx("label",{className:"label",children:"تشخیص قبلی"}),e.jsx("textarea",{className:"input-field",rows:2,value:i.previous_diagnosis,onChange:s=>l("previous_diagnosis",s.target.value)})]}),e.jsxs("div",{className:"md:col-span-2",children:[e.jsx("label",{className:"label",children:"تشخیص فعلی"}),e.jsx("textarea",{className:"input-field",rows:2,value:i.current_diagnosis,onChange:s=>l("current_diagnosis",s.target.value)})]})]})})]}),e.jsxs("div",{className:"card",children:[e.jsx("div",{className:"panel-header panel-header-iranian",children:e.jsx("h3",{children:"سوابق درمانی"})}),e.jsx("div",{className:"panel-body",children:e.jsx("textarea",{className:"input-field",rows:3,value:i.treatment_history,onChange:s=>l("treatment_history",s.target.value)})})]}),e.jsxs("div",{className:"card",children:[e.jsx("div",{className:"panel-header panel-header-iranian",children:e.jsx("h3",{children:"داروهای مورد استفاده فعلی"})}),e.jsx("div",{className:"panel-body",children:e.jsx("textarea",{className:"input-field",rows:3,value:i.current_medications,onChange:s=>l("current_medications",s.target.value)})})]}),e.jsxs("div",{className:"card",children:[e.jsx("div",{className:"panel-header panel-header-iranian",children:e.jsx("h3",{children:"موارد استفاده از TMS و یافته‌های QEEG"})}),e.jsx("div",{className:"panel-body",children:e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"label",children:"موارد استفاده از TMS"}),e.jsx("textarea",{className:"input-field",rows:3,value:i.tms_usage,onChange:s=>l("tms_usage",s.target.value)})]}),e.jsxs("div",{children:[e.jsx("label",{className:"label",children:"یافته‌های QEEG"}),e.jsx("textarea",{className:"input-field",rows:3,value:i.qeeg_findings,onChange:s=>l("qeeg_findings",s.target.value)})]})]})})]}),e.jsxs("div",{className:"card",children:[e.jsx("div",{className:"panel-header panel-header-iranian",children:e.jsx("h3",{children:"پروتکل درمانی"})}),e.jsx("div",{className:"panel-body",children:e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"label",children:"پروتکل 1"}),e.jsx("textarea",{className:"input-field",rows:3,value:i.protocol1,onChange:s=>l("protocol1",s.target.value)})]}),e.jsxs("div",{children:[e.jsx("label",{className:"label",children:"پروتکل 2"}),e.jsx("textarea",{className:"input-field",rows:3,value:i.protocol2,onChange:s=>l("protocol2",s.target.value)})]}),e.jsxs("div",{children:[e.jsx("label",{className:"label",children:"پروتکل 3"}),e.jsx("textarea",{className:"input-field",rows:3,value:i.protocol3,onChange:s=>l("protocol3",s.target.value)})]})]})})]}),e.jsxs("div",{className:"card",children:[e.jsx("div",{className:"panel-header panel-header-iranian",children:e.jsx("h3",{children:"جلسات درمان"})}),e.jsx("div",{className:"panel-body",children:e.jsx("div",{className:"overflow-x-auto max-h-96 overflow-y-auto",children:e.jsxs("table",{className:"w-full text-sm border-collapse",children:[e.jsx("thead",{className:"sticky top-0 bg-slate-100",children:e.jsxs("tr",{children:[e.jsx("th",{className:"p-2 text-center border w-12",children:"جلسه"}),e.jsx("th",{className:"p-2 text-center border",children:"نوع پروتکل"}),e.jsx("th",{className:"p-2 text-center border w-28",children:"مدت زمان"}),e.jsx("th",{className:"p-2 text-center border",children:"سیر و عوارض"})]})}),e.jsx("tbody",{children:Array.from({length:U},(s,t)=>{var a;const d=((a=i.sessions)==null?void 0:a[t])||{};return e.jsxs("tr",{className:"hover:bg-slate-50",children:[e.jsx("td",{className:"p-1 text-center border font-bold text-slate-500 bg-slate-50",children:u(t+1)}),e.jsx("td",{className:"p-1 border",children:e.jsx("input",{className:"input-field text-xs py-1",value:d.protocol||"",onChange:r=>k(t,"protocol",r.target.value)})}),e.jsx("td",{className:"p-1 border",children:e.jsx("input",{className:"input-field text-xs py-1",value:d.duration||"",onChange:r=>k(t,"duration",r.target.value)})}),e.jsx("td",{className:"p-1 border",children:e.jsx("input",{className:"input-field text-xs py-1",value:d.course||"",onChange:r=>k(t,"course",r.target.value)})})]},t)})})]})})})]}),e.jsxs("div",{className:"card",children:[e.jsx("div",{className:"panel-header panel-header-iranian",children:e.jsx("h3",{children:"رضایت‌نامه"})}),e.jsxs("div",{className:"panel-body space-y-4",children:[e.jsx("div",{className:"p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm leading-relaxed",children:"لازم به ذکر است که علائم بهبودی بعد از جلسه هشتم تا دوازدهم خود را نشان می‌دهد."}),e.jsxs("div",{className:"p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm leading-relaxed",children:["اینجانب ",e.jsx("strong",{children:i.consent_patient_name||"........................"})," ","نام پدر ",e.jsx("strong",{children:i.consent_father_name||"........................"})," ","به صورت آگاهانه روش درمانی TMS را با اطلاع از عوارض جانبی و درمان‌های دیگر انتخاب نموده‌ام و رضایت از انجام درمان با TMS دارم و به سوالات پرسیده شده به دقت پاسخ داده‌ام."]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"label",children:"نام و نام خانوادگی بیمار"}),e.jsx("input",{className:"input-field",value:i.consent_patient_name,onChange:s=>l("consent_patient_name",s.target.value)})]}),e.jsxs("div",{children:[e.jsx("label",{className:"label",children:"نام پدر"}),e.jsx("input",{className:"input-field",value:i.consent_father_name,onChange:s=>l("consent_father_name",s.target.value)})]}),e.jsxs("div",{children:[e.jsx("label",{className:"label",children:"امضا"}),e.jsx("input",{className:"input-field",value:i.consent_signature,onChange:s=>l("consent_signature",s.target.value),placeholder:"نام و نام خانوادگی"})]})]})]})]}),e.jsxs("div",{className:"flex gap-3",children:[e.jsx("button",{type:"submit",disabled:V,className:"btn-primary flex-1",children:V?"در حال ذخیره...":h?"ویرایش فرم TMS":"ثبت فرم TMS"}),e.jsx("button",{type:"button",onClick:S,className:"btn-secondary",children:"انصراف"})]})]})]}):e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("h2",{className:"text-lg font-bold",children:"فرم‌های TMS"}),e.jsxs("button",{onClick:()=>v(!0),className:"btn-primary flex items-center gap-2",children:[e.jsx(xe,{size:16})," فرم جدید TMS"]})]}),n.length===0?e.jsx("div",{className:"card text-center py-12 text-gray-400",children:e.jsx("p",{children:"هیچ فرم TMS ثبت نشده است"})}):e.jsx("div",{className:"card overflow-x-auto",children:e.jsxs("table",{className:"w-full text-sm",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"border-b text-gray-600",children:[e.jsx("th",{className:"text-center py-3 px-2",children:"ردیف"}),e.jsx("th",{className:"text-center py-3 px-2",children:"بیمار"}),e.jsx("th",{className:"text-center py-3 px-2",children:"تاریخ"}),e.jsx("th",{className:"text-center py-3 px-2",children:"پزشک / درمانگر"}),e.jsx("th",{className:"text-center py-3 px-2",children:"عملیات"})]})}),e.jsx("tbody",{children:n.map((s,t)=>e.jsxs("tr",{className:"border-b hover:bg-gray-50",children:[e.jsx("td",{className:"py-3 px-2",children:u(t+1)}),e.jsx("td",{className:"py-3 px-2 font-medium",children:s.patient_name}),e.jsx("td",{className:"py-3 px-2",children:F(s.date)}),e.jsx("td",{className:"py-3 px-2",children:s.doctor_name}),e.jsx("td",{className:"py-3 px-2",children:e.jsxs("div",{className:"flex items-center justify-center gap-2",children:[e.jsx("button",{onClick:()=>te(s),className:"action-btn",title:"چاپ",children:e.jsx(he,{size:15})}),e.jsx("button",{onClick:()=>ee(s.id),className:"action-btn",title:"ویرایش",children:e.jsx(ue,{size:15})}),e.jsx("button",{onClick:()=>ae(s.id),className:"action-btn text-red-500",title:"حذف",children:e.jsx(ve,{size:15})})]})})]},s.id))})]})})]})}export{Se as default};
