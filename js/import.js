/* ================= TEMPLATE IMPORT ENGINE ================= */
function progContingent(pid){return state.contingent.filter(c=>c.programId===pid).reduce((s,c)=>s+(+c.count||0),0)}
function impBtn(key){return canEdit()?`<button class="btn ghost sm" onclick="openImport('${key}')">⤓ Импорт</button>`:''}
function importSpec(key){
  if(key==='units')return{coll:'units',title:'Структура (подразделения)',defaults:{},cols:[
    {k:'name',l:'Наименование',req:1},{k:'parentId',l:'Родитель (имя, можно пусто)',ref:'unit'},{k:'head',l:'Руководитель (должность)'}]};
  if(key==='employees')return{coll:'employees',title:'Штат (сотрудники)',defaults:{supplements:[]},cols:[
    {k:'name',l:'ФИО',req:1},{k:'position',l:'Должность',req:1},{k:'unitId',l:'Подразделение (имя)',ref:'unit'},
    {k:'oklad',l:'Оклад',num:1},{k:'rate',l:'Ставка',num:1}]};
  const cfg=ENT[key];if(!cfg)return null;
  const cols=cfg.fields.map(f=>({k:f.k,l:f.l,req:f.req,num:f.t==='number',dict:f.t==='dict'?f.dict:null,
    ref:f.t==='refEmp'?'emp':f.t==='refUnit'?'unit':f.t==='refProgram'?'program':f.t==='refBuilding'?'building':null}));
  return{coll:cfg.coll,title:cfg.title,defaults:{},cols};
}
function resolveRef(type,val){
  const s=String(val==null?'':val).trim().toLowerCase();if(!s)return '';
  if(type==='unit'){const u=state.units.find(x=>(x.name||'').trim().toLowerCase()===s||unitPath(x.id).toLowerCase()===s||unitPath(x.id).toLowerCase().endsWith(s));return u?u.id:null}
  if(type==='emp'){const e=state.employees.find(x=>(x.name||'').trim().toLowerCase()===s);return e?e.id:null}
  if(type==='program'){const p=state.programs.find(x=>(x.code||'').toLowerCase()===s||(x.name||'').toLowerCase()===s);return p?p.id:null}
  if(type==='building'){const b=state.buildings.find(x=>(x.name||'').trim().toLowerCase()===s);return b?b.id:null}
  return null;
}
function displayImp(c,v){if(c.ref==='unit')return unitPath(v);if(c.ref==='emp')return empName(v);if(c.ref==='program'){const p=state.programs.find(x=>x.id===v);return p?(p.code||p.name):''}if(c.ref==='building'){const b=state.buildings.find(x=>x.id===v);return b?b.name:''}return v;}
function parseDelimited(text){
  const lines=String(text||'').replace(/\r/g,'').split('\n').filter(l=>l.trim()!=='');
  if(!lines.length)return [];
  const delim=lines[0].indexOf(';')>=0?';':(lines[0].indexOf('\t')>=0?'\t':',');
  return lines.map(l=>l.split(delim).map(c=>c.trim().replace(/^"(.*)"$/,'$1')));
}
function importCompute(){
  const spec=importSpec(window._impKey);const res={valid:[],preview:[]};if(!spec)return res;
  const rows=parseDelimited((document.getElementById('impArea')||{}).value||'');
  if(!rows.length)return res;
  let start=0,map=spec.cols.map((c,i)=>i);
  const first=rows[0].map(x=>x.toLowerCase());
  if(spec.cols.some(c=>first.indexOf(c.l.toLowerCase())>=0)){start=1;map=spec.cols.map(c=>first.indexOf(c.l.toLowerCase()));}
  for(let r=start;r<rows.length;r++){
    const row=rows[r],obj=Object.assign({id:uid()},spec.defaults||{}),errs=[],warns=[];
    spec.cols.forEach((c,ci)=>{
      const idx=map[ci];let v=(idx>=0&&idx<row.length)?row[idx]:'';v=(v==null?'':String(v)).trim();
      if(c.req&&!v)errs.push('нет «'+c.l+'»');
      if(c.num){v=parseFloat(String(v).replace(/\s/g,'').replace(',','.'));if(isNaN(v))v=0;}
      if(c.dict&&v&&state.dict[c.dict]&&state.dict[c.dict].indexOf(v)<0)warns.push('«'+v+'» нет в справочнике');
      if(c.ref){if(v){const id=resolveRef(c.ref,v);if(id==null){errs.push('не найдено: '+c.l+'=«'+v+'»');v='';}else v=id;}else v='';}
      obj[c.k]=v;
    });
    res.preview.push({obj,errs,warns});
    if(!errs.length)res.valid.push(obj);
  }
  return res;
}
function importCheck(){
  const spec=importSpec(window._impKey),res=importCompute();window._impValid=res.valid;
  const prev=document.getElementById('impPrev');if(!prev)return;
  if(!res.preview.length){prev.innerHTML='<div class="hint">Нет строк. Вставьте данные или загрузите CSV.</div>';return;}
  const rowsHtml=res.preview.map(p=>{
    const st=p.errs.length?'✗':(p.warns.length?'⚠':'✓'),col=p.errs.length?'var(--danger)':(p.warns.length?'#c98a00':'var(--good)');
    const info=[...p.errs,...p.warns].join('; ');
    const cells=spec.cols.slice(0,4).map(c=>`<td>${esc(String(displayImp(c,p.obj[c.k])||''))}</td>`).join('');
    return `<tr><td style="color:${col};font-weight:700">${st}</td>${cells}<td class="hint">${esc(info)}</td></tr>`;
  }).join('');
  prev.innerHTML=`<div class="hint" style="margin-bottom:6px">Корректных строк: <b>${res.valid.length}</b> из ${res.preview.length}. Кнопка «Сохранить» импортирует корректные.</div><div class="table-wrap" style="max-height:260px;overflow:auto"><table><thead><tr><th></th>${spec.cols.slice(0,4).map(c=>`<th>${esc(c.l)}</th>`).join('')}<th>Замечания</th></tr></thead><tbody>${rowsHtml}</tbody></table></div>`;
}
function importApply(){
  if(!canEdit())return toast('Роль только для просмотра');
  const spec=importSpec(window._impKey),res=importCompute();
  if(!res.valid.length){importCheck();return toast('Нет корректных строк');}
  res.valid.forEach(o=>state[spec.coll].push(o));
  logAudit('импорт',spec.title,res.valid.length+' строк');
  save();closeModal();renderAll();
  const a=document.querySelector('#tabs button.active');if(a){if(a.dataset.tab==='tariff')renderTariff();if(a.dataset.tab==='settings')renderSettings();}
  toast('Импортировано: '+res.valid.length);
}
function downloadTemplate(key){
  const spec=importSpec(key);if(!spec)return;
  const headers=spec.cols.map(c=>c.l).join(';');
  const ex=spec.cols.map(c=>c.ref?'(имя из системы)':(c.num?'0':(c.dict&&state.dict[c.dict]?state.dict[c.dict][0]:''))).join(';');
  const csv='\ufeff'+headers+'\n'+ex+'\n';
  try{const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='template_'+key+'.csv';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);}catch(e){toast('Не удалось скачать')}
}
function impFile(ev){const f=ev.target.files&&ev.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{const ta=document.getElementById('impArea');if(ta){ta.value=rd.result;importCheck();}};rd.readAsText(f,'utf-8');}
function openImport(key){
  const spec=importSpec(key);if(!spec)return;
  if(!canEdit())return toast('Роль только для просмотра');
  window._impKey=key;window._impValid=[];
  const headers=spec.cols.map(c=>c.l).join(';');
  openModal('Импорт по шаблону · '+spec.title,`
    <p class="hint" style="margin-top:0">1) Скачайте шаблон → 2) заполните в Excel/Sheets → 3) вставьте сюда или загрузите CSV → 4) «Проверить» → 5) «Сохранить». Разделитель «;», строку-заголовок оставляйте.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
      <button class="btn ghost sm" onclick="downloadTemplate('${key}')">⬇ Шаблон CSV</button>
      <label class="btn ghost sm" style="cursor:pointer">📄 Загрузить CSV<input type="file" accept=".csv,text/csv" style="display:none" onchange="impFile(event)"></label>
      <button class="btn ghost sm" onclick="importCheck()">Проверить</button>
    </div>
    <textarea id="impArea" style="width:100%;height:130px;border:1px solid var(--line);border-radius:8px;padding:8px;font-family:monospace;font-size:12px" placeholder="${esc(headers)}"></textarea>
    <div id="impPrev" style="margin-top:12px"></div>`, importApply);
}

