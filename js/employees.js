/* ================= EMPLOYEES ================= */
function unitPath(id){const names=[];let cur=unitById(id),g=0;while(cur&&g++<60){names.unshift(cur.name);cur=cur.parentId?unitById(cur.parentId):null}return names.join(' › ')}
function fillUnitFilter(){const sel=document.getElementById('empUnitFilter');const cur=sel.value;
  sel.innerHTML='<option value="">Все подразделения</option>'+state.units.slice().sort((a,b)=>unitPath(a.id).localeCompare(unitPath(b.id))).map(u=>`<option value="${u.id}">${esc(unitPath(u.id))}</option>`).join('');sel.value=cur}
function suppSummary(e){return (e.supplements||[]).map(s=>`${REASON_SHORT[s.reason]||s.reason}${s.reason==='Другое'&&s.note?' ('+s.note+')':''} +${fmt(s.amount)}`).join('; ')}
function renderEmployees(){
  fillUnitFilter();
  const q=(document.getElementById('empSearch').value||'').toLowerCase().trim();
  const uf=document.getElementById('empUnitFilter').value;const body=document.getElementById('empBody');
  let list=state.employees.slice();
  if(uf)list=list.filter(e=>e.unitId===uf);
  if(q)list=list.filter(e=>(e.name+' '+e.position).toLowerCase().includes(q));
  list.sort((a,b)=>empAccrued(b)-empAccrued(a));
  if(!list.length){body.innerHTML='<tr><td colspan="8"><div class="empty-state"><div class="big">👥</div>Сотрудников нет.<br><br><button class="btn" onclick="openEmpModal()">＋ Добавить сотрудника</button></div></td></tr>';return}
  body.innerHTML=list.map(e=>{
    const sm=suppSummary(e);
    return `<tr>
      <td><b>${esc(e.name)}</b></td>
      <td>${esc(e.position)}</td>
      <td class="hint">${esc(unitPath(e.unitId))||'<i>не назначено</i>'}</td>
      <td class="num">${fmt(e.oklad)}</td>
      <td class="num">${(+e.rate).toLocaleString('ru-RU')}</td>
      <td class="num">${supTotal(e)?fmt(supTotal(e)):'—'}${sm?`<div class="subreasons">${esc(sm)}</div>`:''}</td>
      <td class="num"><b>${fmt(empAccrued(e))}</b></td>
      <td class="num" style="white-space:nowrap">
        <button class="btn ghost sm" onclick="openEmpModal('${e.id}')">✎</button>
        <button class="btn danger sm" onclick="deleteEmp('${e.id}')">🗑</button></td></tr>`;
  }).join('');
}
