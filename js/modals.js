/* ================= MODAL CORE ================= */
let modalSaveHandler=null;
function openModal(title,bodyHTML,onSave){document.getElementById('modalTitle').textContent=title;document.getElementById('modalBody').innerHTML=bodyHTML;modalSaveHandler=onSave;document.getElementById('overlay').classList.add('open')}
function closeModal(){document.getElementById('overlay').classList.remove('open');modalSaveHandler=null}
document.getElementById('modalSave').onclick=()=>{if(modalSaveHandler)modalSaveHandler()};
document.getElementById('overlay').onclick=e=>{if(e.target.id==='overlay')closeModal()};

/* ================= UNIT MODAL ================= */
function openUnitModal(id=null,parentId=null){
  if(!canEdit()){toast('Роль только для просмотра');return}
  const u=id?unitById(id):null;const excluded=id?[id,...descendants(id)]:[];
  const parentOptions='<option value="">— Корневое (верхний уровень) —</option>'+
    state.units.filter(x=>!excluded.includes(x.id)).sort((a,b)=>unitPath(a.id).localeCompare(unitPath(b.id)))
    .map(x=>`<option value="${x.id}" ${((u&&u.parentId===x.id)||(!u&&parentId===x.id))?'selected':''}>${esc(unitPath(x.id))}</option>`).join('');
  const typeOptions=TYPES.map(t=>`<option ${u&&u.type===t?'selected':''}>${t}</option>`).join('');
  openModal(id?'Редактировать подразделение':'Новое подразделение',`
    <div class="field"><label>Наименование *</label><input id="fUnitName" value="${u?esc(u.name):''}" placeholder="Отдел организации учебного процесса"></div>
    <div class="field"><label>Тип</label><select id="fUnitType">${typeOptions}</select></div>
    <div class="field"><label>Вышестоящее подразделение</label><select id="fUnitParent">${parentOptions}</select><small>Определяет положение в дереве, оргсхеме и сводке ФОТ.</small></div>`,
    ()=>{const name=document.getElementById('fUnitName').value.trim();if(!name){toast('Укажите наименование');return}
      const type=document.getElementById('fUnitType').value;const par=document.getElementById('fUnitParent').value||null;
      if(u){u.name=name;u.type=type;u.parentId=par}else{state.units.push({id:uid(),name,type,parentId:par})}
      save();closeModal();renderAll();toast(u?'Изменено':'Добавлено подразделение')});
  setTimeout(()=>document.getElementById('fUnitName').focus(),50);
  if(u)document.getElementById('fUnitType').value=u.type||'Отдел';
}
function deleteUnit(id){
  if(!canEdit()){toast('Роль только для просмотра');return}
  const u=unitById(id),kids=childrenOf(id),emps=directEmps(id);
  let msg=`Удалить «${u.name}»?`;
  if(kids.length||emps.length)msg+=`\n\nДочерние подразделения (${kids.length}) и сотрудники (${emps.length}) будут перемещены на уровень выше.`;
  if(!confirm(msg))return;
  const par=u.parentId||null;kids.forEach(c=>c.parentId=par);emps.forEach(e=>e.unitId=par);
  state.units=state.units.filter(x=>x.id!==id);save();renderAll();toast('Подразделение удалено');
}

/* ================= EMPLOYEE MODAL (with supplements) ================= */
function suppRowHTML(s){s=s||{reason:'Ученое звание',amount:'',note:''};
  const opts=REASONS.map(r=>`<option ${s.reason===r?'selected':''}>${r}</option>`).join('');
  const showNote=s.reason==='Другое';
  return `<div class="supp-row">
    <select class="supp-reason" onchange="toggleSuppNote(this)" style="width:150px">${opts}</select>
    <input class="supp-amount" type="number" min="0" step="1000" placeholder="сумма ₸" style="width:120px" value="${s.amount!==''&&s.amount!=null?s.amount:''}">
    <input class="supp-note" placeholder="причина (напр. решение Правления)" style="flex:1;${showNote?'':'display:none'}" value="${esc(s.note||'')}">
    <button class="btn danger sm" onclick="this.closest('.supp-row').remove()">×</button></div>`;
}
function toggleSuppNote(sel){const note=sel.closest('.supp-row').querySelector('.supp-note');note.style.display=sel.value==='Другое'?'':'none'}
function addSuppRow(){document.getElementById('suppList').insertAdjacentHTML('beforeend',suppRowHTML())}
function openEmpModal(id=null,unitId=null){
  if(!canEdit()){toast('Роль только для просмотра');return}
  if(!state.units.length){toast('Сначала создайте хотя бы одно подразделение');return}
  const e=id?state.employees.find(x=>x.id===id):null;
  const unitOptions=state.units.slice().sort((a,b)=>unitPath(a.id).localeCompare(unitPath(b.id)))
    .map(u=>`<option value="${u.id}" ${((e&&e.unitId===u.id)||(!e&&unitId===u.id))?'selected':''}>${esc(unitPath(u.id))}</option>`).join('');
  const suppRows=(e&&e.supplements&&e.supplements.length)?e.supplements.map(suppRowHTML).join(''):'';
  openModal(id?'Редактировать сотрудника':'Новый сотрудник',`
    <div class="field"><label>ФИО *</label><input id="fEmpName" value="${e?esc(e.name):''}" placeholder="Оспанов Т. А."></div>
    <div class="field"><label>Должность *</label><input id="fEmpPos" value="${e?esc(e.position):''}" placeholder="Начальник отдела"></div>
    <div class="field"><label>Подразделение</label><select id="fEmpUnit">${unitOptions}</select></div>
    <div class="field"><div class="row2">
      <div><label>Оклад, ₸/мес *</label><input id="fEmpOklad" type="number" min="0" step="1000" value="${e?e.oklad:''}" placeholder="300000"></div>
      <div><label>Ставка</label><input id="fEmpRate" type="number" min="0" max="3" step="0.25" value="${e?e.rate:'1'}"></div></div></div>
    <div class="field"><label>Доплаты</label>
      <div class="supp-box">
        <div id="suppList">${suppRows}</div>
        <button class="btn ghost sm" style="margin-top:4px" onclick="addSuppRow()">＋ Добавить доплату</button>
        <small style="margin-top:8px">Причина: ученое звание, научная степень или «Другое» (укажите основание — напр. решение Правления). Начислено = оклад × ставка + сумма всех доплат.</small>
      </div></div>`,
    ()=>{
      const name=document.getElementById('fEmpName').value.trim();
      const pos=document.getElementById('fEmpPos').value.trim();
      const oklad=+document.getElementById('fEmpOklad').value||0;
      const rate=+document.getElementById('fEmpRate').value||0;
      const unit=document.getElementById('fEmpUnit').value;
      if(!name||!pos){toast('Укажите ФИО и должность');return}
      const supplements=[...document.querySelectorAll('#suppList .supp-row')].map(r=>({
        reason:r.querySelector('.supp-reason').value,
        amount:+r.querySelector('.supp-amount').value||0,
        note:r.querySelector('.supp-note').value.trim()
      })).filter(s=>s.amount>0);
      if(e){Object.assign(e,{name,position:pos,oklad,rate,unitId:unit,supplements})}
      else{state.employees.push({id:uid(),name,position:pos,oklad,rate,unitId:unit,supplements})}
      save();closeModal();renderAll();toast(e?'Изменено':'Сотрудник добавлен');
    });
  setTimeout(()=>document.getElementById('fEmpName').focus(),50);
}
function deleteEmp(id){if(!canEdit()){toast('Роль только для просмотра');return}const e=state.employees.find(x=>x.id===id);if(!confirm(`Удалить сотрудника «${e.name}»?`))return;state.employees=state.employees.filter(x=>x.id!==id);save();renderAll();toast('Сотрудник удалён')}
