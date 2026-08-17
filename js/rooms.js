/* ---------- CLASSROOM STOCK ---------- */
function renderRooms(){
  const c=document.getElementById('roomBody');if(!c)return;
  const seats=state.rooms.reduce((s,r)=>s+(+r.seats||0),0),comp=state.rooms.reduce((s,r)=>s+(+r.computers||0),0);
  const perB=state.buildings.map(b=>{
    const rs=state.rooms.filter(r=>r.buildingId===b.id),byType={};
    rs.forEach(r=>{const t=r.type||'Прочее';byType[t]=(byType[t]||0)+1});
    const types=Object.keys(byType).map(t=>esc(t)+': '+byType[t]).join(', ');
    return `<tr><td>${esc(b.name)}</td><td class="num">${rs.length}</td><td class="num">${fmt(rs.reduce((s,r)=>s+(+r.seats||0),0))}</td><td class="num">${fmt(rs.reduce((s,r)=>s+(+r.computers||0),0))}</td><td class="hint">${types||'—'}</td></tr>`;
  }).join('');
  c.innerHTML=`<div class="kpis" style="margin-bottom:16px">
      <div class="kpi"><div class="label">Корпусов</div><div class="value">${state.buildings.length}</div></div>
      <div class="kpi"><div class="label">Аудиторий</div><div class="value">${state.rooms.length}</div></div>
      <div class="kpi"><div class="label">Посадочных мест</div><div class="value">${fmt(seats)}</div></div>
      <div class="kpi accent"><div class="label">Компьютерных мест</div><div class="value">${fmt(comp)}</div></div></div>`
    +cardHTML('Корпуса',`<div style="margin-bottom:10px;display:flex;gap:8px;flex-wrap:wrap">${canEdit()?'<button class="btn sm" onclick="openEntModal(\'building\')">＋ Корпус</button>':''}${impBtn('building')}</div><div id="bldTable"></div>`)
    +cardHTML('Аудитории',`<div style="margin-bottom:10px;display:flex;gap:8px;flex-wrap:wrap">${canEdit()?'<button class="btn sm" onclick="openEntModal(\'room\')">＋ Аудитория</button>':''}${impBtn('room')}</div><div id="roomTable"></div>`)
    +cardHTML('Сводка по корпусам',`<div class="table-wrap"><table><thead><tr><th>Корпус</th><th class="num">Аудиторий</th><th class="num">Мест</th><th class="num">Комп. мест</th><th>По типам</th></tr></thead><tbody>${perB||'<tr><td colspan="5" class="hint" style="padding:14px">Нет данных.</td></tr>'}</tbody></table></div>`);
  renderEntTable('building','bldTable');renderEntTable('room','roomTable');
}
