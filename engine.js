/* ================= ROLES / AUDIT / GENERIC ENGINE ================= */
const ROLES={
 'Администратор':{tabs:'*',edit:true},
 'Финансист':{tabs:['dashboard','budget','contingent','programs','plan','analytics','structure','orgchart','employees','settings'],edit:true},
 'Кадровик':{tabs:['dashboard','structure','orgchart','employees','accruals','calc','tariff','programs','rooms','settings'],edit:true},
 'МОЛ (имущество)':{tabs:['dashboard','inventory','rooms','settings'],edit:true},
 'Руководитель':{tabs:['dashboard','structure','orgchart','plan'],edit:false},
 'Наблюдатель':{tabs:'*',edit:false},
};
function canEdit(){const r=ROLES[state.roleCurrent];return !r||r.edit!==false}
function applyRole(){
  const r=ROLES[state.roleCurrent]||ROLES['Администратор'];
  const rs=document.getElementById('roleSel');
  if(rs){if(!rs.options.length)rs.innerHTML=Object.keys(ROLES).map(x=>`<option>${x}</option>`).join('');rs.value=state.roleCurrent;}
  let anyActive=false,first=null;
  document.querySelectorAll('#tabs button').forEach(b=>{
    let allow=r.tabs==='*'||r.tabs.indexOf(b.dataset.tab)>=0;
    if(b.dataset.tab==='admin')allow=(currentUser&&currentUser.role==='Администратор');
    b.style.display=allow?'':'none';
    if(allow&&!first)first=b;
    if(allow&&b.classList.contains('active'))anyActive=true;
  });
  if(!anyActive&&first){document.querySelectorAll('#tabs button').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));first.classList.add('active');const s=document.getElementById('tab-'+first.dataset.tab);if(s)s.classList.add('active');}
}
function setRole(r){state.roleCurrent=r;save();renderAll();const a=document.querySelector('#tabs button.active');if(a){if(a.dataset.tab==='calc')renderCalc();if(a.dataset.tab==='tariff')renderTariff();if(a.dataset.tab==='settings')renderSettings();}}
function logAudit(action,entity,detail){state.audit.unshift({id:uid(),time:new Date().toISOString(),who:(currentUser&&currentUser.email)||state.roleCurrent,action,entity,detail});if(state.audit.length>500)state.audit.length=500;}
function empName(id){const e=state.employees.find(x=>x.id===id);return e?e.name:'—'}
function monthsBetween2(a,b){return (b.getFullYear()-a.getFullYear())*12+(b.getMonth()-a.getMonth())}
function assetAmort(a){const life=+a.usefulLife||0,cost=+a.buyAmount||0;if(a.status==='Списан')return{wear:cost,residual:0};if(!life||!cost||!a.buyDate)return{wear:0,residual:cost};const m=Math.max(0,monthsBetween2(new Date(a.buyDate),new Date()));const wear=Math.min(cost,cost/(life*12)*m);return{wear,residual:Math.max(0,cost-wear)}}
function cardHTML(title,inner,headExtra){return `<div class="card" style="margin-bottom:16px"><div class="hd"><h2>${esc(title)}</h2><div class="spacer"></div>${headExtra||''}</div><div class="bd">${inner}</div></div>`}

const ENT={
 hourlyRate:{coll:'hourlyRates',title:'Почасовая ставка',fields:[
   {k:'category',l:'Категория',t:'text',req:1},{k:'rate',l:'₸ / час',t:'number',req:1}]},
 load:{coll:'loads',title:'Нагрузка',fields:[
   {k:'teacherId',l:'Преподаватель',t:'refEmp'},{k:'discipline',l:'Дисциплина',t:'text',req:1},
   {k:'group',l:'Группа',t:'text'},{k:'kind',l:'Вид',t:'select',opts:['Лекции','Практика','Лабораторные','Экзамен','Прочее']},
   {k:'hours',l:'Часы',t:'number',req:1}]},
 income:{coll:'incomes',title:'Доход',fields:[
   {k:'article',l:'Статья',t:'dict',dict:'incomeArticles'},{k:'source',l:'Источник',t:'select',opts:['Госбюджет','Собственные']},
   {k:'amount',l:'Сумма, ₸',t:'number',req:1},{k:'period',l:'Период',t:'text'},
   {k:'unitId',l:'Подразделение',t:'refUnit'},{k:'note',l:'Примечание',t:'text'}]},
 expense:{coll:'expenses',title:'Расход',fields:[
   {k:'article',l:'Статья',t:'dict',dict:'expenseArticles'},{k:'amount',l:'Сумма, ₸',t:'number',req:1},
   {k:'period',l:'Период',t:'text'},{k:'unitId',l:'Подразделение',t:'refUnit'},
   {k:'doc',l:'Документ',t:'text'},{k:'note',l:'Примечание',t:'text'}]},
 contingent:{coll:'contingent',title:'Группа контингента',fields:[
   {k:'program',l:'ОП / ГОП',t:'text',req:1},{k:'programId',l:'Образовательная программа',t:'refProgram'},{k:'course',l:'Курс',t:'text'},
   {k:'form',l:'Форма',t:'select',opts:['Очная','Заочная','Вечерняя']},
   {k:'source',l:'Источник',t:'select',opts:['Госзаказ (грант)','Собственные средства']},
   {k:'count',l:'Численность',t:'number',req:1},{k:'tariff',l:'Финанс. на 1 обуч./год, ₸',t:'number'}],
   extraCols:[{l:'Доход/год, ₸',render:r=>fmt((+r.count||0)*(+r.tariff||0))}]},
 asset:{coll:'assets',title:'Объект (актив)',searchId:'invSearch',search:(r,q)=>((r.invno||'')+' '+(r.name||'')+' '+empName(r.molId)).toLowerCase().indexOf(q)>=0,fields:[
   {k:'invno',l:'Инв. №',t:'text',req:1},{k:'name',l:'Наименование',t:'text',req:1},
   {k:'category',l:'Категория',t:'dict',dict:'assetCategories'},{k:'buyDate',l:'Дата приобр.',t:'date'},
   {k:'buyAmount',l:'Сумма, ₸',t:'number'},{k:'usefulLife',l:'СПИ, лет',t:'number'},
   {k:'molId',l:'МОЛ',t:'refEmp'},{k:'location',l:'Местонахождение',t:'text'},
   {k:'status',l:'Статус',t:'select',opts:['На складе','В эксплуатации','Списан']},
   {k:'supplier',l:'Поставщик',t:'text',hideCol:1},{k:'desc',l:'Описание',t:'text',hideCol:1}],
   extraCols:[{l:'Остаточная, ₸',render:r=>fmt(assetAmort(r).residual)}],
   rowActions:r=>`<button class="btn ghost sm" onclick="assetMove('${r.id}')" title="Движение">↦</button>`},
 program:{coll:'programs',title:'Образовательная программа',fields:[
   {k:'code',l:'Шифр (ГОП/ОП)',t:'text',req:1},{k:'name',l:'Наименование',t:'text',req:1},
   {k:'level',l:'Уровень',t:'dict',dict:'programLevels'},{k:'deptId',l:'Кафедра/подразделение',t:'refUnit'},
   {k:'buildingId',l:'Основной корпус',t:'refBuilding'},{k:'lang',l:'Язык',t:'select',opts:['Каз','Рус','Англ','Каз/Рус']}],
   extraCols:[{l:'Контингент',render:r=>fmt(progContingent(r.id))}]},
 building:{coll:'buildings',title:'Корпус',fields:[
   {k:'name',l:'Наименование / № корпуса',t:'text',req:1},{k:'address',l:'Адрес',t:'text'}]},
 room:{coll:'rooms',title:'Аудитория',fields:[
   {k:'buildingId',l:'Корпус',t:'refBuilding',req:1},{k:'name',l:'№ / название',t:'text',req:1},
   {k:'type',l:'Тип',t:'dict',dict:'roomTypes'},{k:'seats',l:'Мест',t:'number'},
   {k:'computers',l:'Компьютеров',t:'number'},{k:'note',l:'Примечание',t:'text'}]},
};

function fieldInput(f,val){
  const v=val==null?'':val;
  if(f.t==='select')return `<select id="ef_${f.k}">${(f.opts||[]).map(o=>`<option ${v===o?'selected':''}>${esc(o)}</option>`).join('')}</select>`;
  if(f.t==='dict')return `<select id="ef_${f.k}">${(state.dict[f.dict]||[]).map(o=>`<option ${v===o?'selected':''}>${esc(o)}</option>`).join('')}</select>`;
  if(f.t==='refEmp')return `<select id="ef_${f.k}"><option value="">—</option>${state.employees.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(e=>`<option value="${e.id}" ${v===e.id?'selected':''}>${esc(e.name)} — ${esc(e.position)}</option>`).join('')}</select>`;
  if(f.t==='refUnit')return `<select id="ef_${f.k}"><option value="">—</option>${state.units.slice().sort((a,b)=>unitPath(a.id).localeCompare(unitPath(b.id))).map(u=>`<option value="${u.id}" ${v===u.id?'selected':''}>${esc(unitPath(u.id))}</option>`).join('')}</select>`;
  if(f.t==='refProgram')return `<select id="ef_${f.k}"><option value="">—</option>${state.programs.slice().sort((a,b)=>((a.code||a.name||'')+'').localeCompare((b.code||b.name||'')+'')).map(p=>`<option value="${p.id}" ${v===p.id?'selected':''}>${esc((p.code?p.code+' — ':'')+(p.name||''))}</option>`).join('')}</select>`;
  if(f.t==='refBuilding')return `<select id="ef_${f.k}"><option value="">—</option>${state.buildings.slice().sort((a,b)=>((a.name||'')+'').localeCompare((b.name||'')+'')).map(b=>`<option value="${b.id}" ${v===b.id?'selected':''}>${esc(b.name)}</option>`).join('')}</select>`;
  if(f.t==='date')return `<input id="ef_${f.k}" type="date" value="${esc(v)}">`;
  if(f.t==='number')return `<input id="ef_${f.k}" type="number" step="any" value="${v}">`;
  return `<input id="ef_${f.k}" value="${esc(v)}" placeholder="${esc(f.ph||'')}">`;
}
function openEntModal(key,id){
  if(!canEdit())return toast('Роль только для просмотра');
  const cfg=ENT[key],coll=state[cfg.coll],row=id?coll.find(x=>x.id===id):null;
  const body=cfg.fields.map(f=>`<div class="field"><label>${esc(f.l)}${f.req?' *':''}</label>${fieldInput(f,row?row[f.k]:'')}</div>`).join('');
  openModal((id?'Изменить':'Добавить')+': '+cfg.title,body,()=>{
    const obj=row||{id:uid()};
    for(const f of cfg.fields){const el=document.getElementById('ef_'+f.k);let val=el.value;if(f.t==='number')val=+val||0;obj[f.k]=val;}
    for(const f of cfg.fields){if(f.req&&(obj[f.k]===''||obj[f.k]==null)){toast('Заполните: '+f.l);return;}}
    if(!row)coll.push(obj);
    logAudit(row?'изменение':'создание',cfg.title,obj.name||obj.invno||obj.article||obj.program||obj.discipline||obj.category||'');
    save();closeModal();renderAll();
    const a=document.querySelector('#tabs button.active');if(a&&a.dataset.tab==='tariff')renderTariff();
    toast('Сохранено');
  });
}
function delEnt(key,id){if(!canEdit())return toast('Роль только для просмотра');const cfg=ENT[key];if(!confirm('Удалить запись?'))return;state[cfg.coll]=state[cfg.coll].filter(x=>x.id!==id);logAudit('удаление',cfg.title,id);save();renderAll();const a=document.querySelector('#tabs button.active');if(a&&a.dataset.tab==='tariff')renderTariff();toast('Удалено')}
function renderEntTable(key,containerId){
  const cfg=ENT[key],c=document.getElementById(containerId);if(!c)return;
  let coll=state[cfg.coll].slice();
  if(cfg.searchId){const q=((document.getElementById(cfg.searchId)||{}).value||'').toLowerCase().trim();if(q&&cfg.search)coll=coll.filter(r=>cfg.search(r,q));}
  const cols=cfg.fields.filter(f=>!f.hideCol);
  const head=cols.map(f=>`<th class="${f.t==='number'?'num':''}">${esc(f.l)}</th>`).join('')+(cfg.extraCols||[]).map(x=>`<th class="num">${esc(x.l)}</th>`).join('')+'<th></th>';
  const rows=coll.map(r=>{
    const tds=cols.map(f=>{let v=r[f.k];if(f.t==='refEmp')v=empName(v);else if(f.t==='refUnit')v=v?unitPath(v):'';else if(f.t==='refProgram'){const p=state.programs.find(x=>x.id===v);v=p?(p.code||p.name):''}else if(f.t==='refBuilding'){const b=state.buildings.find(x=>x.id===v);v=b?b.name:''}else if(f.t==='number')v=fmt(v);return `<td class="${f.t==='number'?'num':''}">${esc(String(v==null?'':v))}</td>`}).join('');
    const extra=(cfg.extraCols||[]).map(x=>`<td class="num">${x.render(r)}</td>`).join('');
    const acts=canEdit()?`<td class="num" style="white-space:nowrap">${cfg.rowActions?cfg.rowActions(r):''}<button class="btn ghost sm" onclick="openEntModal('${key}','${r.id}')">✎</button><button class="btn danger sm" onclick="delEnt('${key}','${r.id}')">🗑</button></td>`:'<td></td>';
    return `<tr>${tds}${extra}${acts}</tr>`;
  }).join('');
  c.innerHTML=`<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${rows||'<tr><td colspan="20" class="hint" style="padding:18px">Нет записей.</td></tr>'}</tbody></table></div>`;
}

