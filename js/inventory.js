/* ---------- INVENTORY ---------- */
function renderInventory(){
  const c=document.getElementById('invBody');if(!c)return;
  const cost=state.assets.reduce((s,a)=>s+(+a.buyAmount||0),0);
  const wear=state.assets.reduce((s,a)=>s+assetAmort(a).wear,0);
  c.innerHTML=`<div class="kpis" style="margin-bottom:16px">
     <div class="kpi"><div class="label">Объектов</div><div class="value">${state.assets.length}</div></div>
     <div class="kpi"><div class="label">Первонач. стоимость</div><div class="value">${money(cost)}</div></div>
     <div class="kpi"><div class="label">Износ</div><div class="value">${money(wear)}</div></div>
     <div class="kpi accent"><div class="label">Остаточная</div><div class="value">${money(cost-wear)}</div></div></div>`
   +cardHTML('Реестр материальных ценностей',`<div style="margin-bottom:10px;display:flex;gap:8px;flex-wrap:wrap">${canEdit()?'<button class="btn sm" onclick="openEntModal(\'asset\')">＋ Объект</button>':''}${impBtn('asset')}<input id="invSearch" placeholder="поиск: наименование / № / МОЛ" oninput="renderEntTable('asset','invTable')" style="padding:8px 10px;border:1px solid var(--line);border-radius:8px;min-width:220px"></div><div id="invTable"></div>`)
   +cardHTML('Что закреплено за сотрудником (при увольнении)',`<div class="field" style="max-width:360px"><label>Сотрудник</label><select id="invEmp" onchange="renderMolAssets()"><option value="">—</option>${state.employees.map(e=>`<option value="${e.id}">${esc(e.name)}</option>`).join('')}</select></div><div id="molAssets"></div>`);
  renderEntTable('asset','invTable');renderMolAssets();
}
function renderMolAssets(){
  const box=document.getElementById('molAssets');if(!box)return;
  const id=(document.getElementById('invEmp')||{}).value;
  if(!id){box.innerHTML='<div class="hint">Выберите сотрудника, чтобы увидеть закреплённое имущество.</div>';return}
  const list=state.assets.filter(a=>a.molId===id&&a.status!=='Списан');
  const sum=list.reduce((s,a)=>s+assetAmort(a).residual,0);
  box.innerHTML=list.length?`<div class="table-wrap"><table><thead><tr><th>Инв.№</th><th>Наименование</th><th class="num">Остаточная, ₸</th></tr></thead><tbody>${list.map(a=>`<tr><td>${esc(a.invno)}</td><td>${esc(a.name)}</td><td class="num">${fmt(assetAmort(a).residual)}</td></tr>`).join('')}<tr><td colspan="2" style="font-weight:700">Итого к сдаче</td><td class="num" style="font-weight:700">${fmt(sum)}</td></tr></tbody></table></div>`:'<div class="hint">За сотрудником ничего не числится.</div>';
}
function assetMove(id){
  if(!canEdit())return toast('Роль только для просмотра');
  const a=state.assets.find(x=>x.id===id);if(!a)return;
  const empOpts=state.employees.map(e=>`<option value="${e.id}">${esc(e.name)}</option>`).join('');
  openModal('Движение: '+a.name,`
    <div class="field"><label>Тип операции</label><select id="mvType"><option>Постановка на баланс</option><option>Приход на склад</option><option>Выдача сотруднику</option><option>Возврат на склад</option><option>Списание</option></select></div>
    <div class="field"><label>Кому (для выдачи)</label><select id="mvEmp"><option value="">—</option>${empOpts}</select></div>
    <div class="field"><label>Местонахождение</label><input id="mvLoc" value="${esc(a.location||'')}"></div>
    <div class="field"><label>Документ-основание</label><input id="mvDoc" placeholder="накладная / акт №"></div>
    <div class="field"><label>Дата</label><input id="mvDate" type="date" value="${new Date().toISOString().slice(0,10)}"></div>`,
   ()=>{
     const type=document.getElementById('mvType').value,emp=document.getElementById('mvEmp').value,loc=document.getElementById('mvLoc').value,doc=document.getElementById('mvDoc').value,date=document.getElementById('mvDate').value;
     state.assetMoves.push({id:uid(),assetId:a.id,type,to:emp?empName(emp):loc,date,doc});
     if(type==='Выдача сотруднику'&&emp){a.molId=emp;a.status='В эксплуатации'}
     if(type==='Приход на склад'||type==='Возврат на склад')a.status='На складе';
     if(type==='Списание')a.status='Списан';
     if(loc)a.location=loc;
     logAudit('движение: '+type,'Имущество',(a.invno||'')+' '+a.name);
     save();closeModal();renderInventory();toast('Операция записана');
   });
}

