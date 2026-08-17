/* ---------- EDUCATIONAL PROGRAMS ---------- */
function renderPrograms(){
  const c=document.getElementById('progBody');if(!c)return;
  const byB={};state.programs.forEach(p=>{const b=p.buildingId||'—';byB[b]=(byB[b]||0)+progContingent(p.id)});
  const capRows=state.buildings.map(b=>{
    const cont=byB[b.id]||0,rooms=state.rooms.filter(r=>r.buildingId===b.id);
    const seats=rooms.reduce((s,r)=>s+(+r.seats||0),0);
    const lect=rooms.filter(r=>(r.type||'').indexOf('Лекц')===0).reduce((s,r)=>s+(+r.seats||0),0);
    const comp=rooms.reduce((s,r)=>s+(+r.computers||0),0);
    const load=seats?cont/seats*100:0;
    return `<tr><td>${esc(b.name)}</td><td class="num">${fmt(cont)}</td><td class="num">${fmt(seats)}</td><td class="num">${fmt(lect)}</td><td class="num">${fmt(comp)}</td><td class="num" style="color:${load>100?'var(--danger)':'inherit'}">${seats?load.toFixed(0)+'%':'—'}</td></tr>`;
  }).join('');
  const unassigned=byB['—']||0;
  const totCont=state.programs.reduce((s,p)=>s+progContingent(p.id),0);
  c.innerHTML=`<div class="kpis" style="margin-bottom:16px">
      <div class="kpi"><div class="label">Программ</div><div class="value">${state.programs.length}</div></div>
      <div class="kpi"><div class="label">Групп привязано</div><div class="value">${state.contingent.filter(x=>x.programId).length}</div><div class="sub">из ${state.contingent.length}</div></div>
      <div class="kpi accent"><div class="label">Контингент по программам</div><div class="value">${fmt(totCont)}</div></div></div>`
    +cardHTML('Образовательные программы',`<div style="margin-bottom:10px;display:flex;gap:8px;flex-wrap:wrap">${canEdit()?'<button class="btn sm" onclick="openEntModal(\'program\')">＋ Программа</button>':''}${impBtn('program')}</div><div id="progTable"></div><p class="hint">Программа привязывается к кафедре (подразделению) и основному корпусу. Её контингент = сумма групп во вкладке «Контингент», где выбрана эта программа. Через кафедру ОП участвует в калькуляторе ФОТ (сценарий «по подразделению»).</p>`)
    +cardHTML('Контингент и аудиторный фонд по корпусам',`<div class="table-wrap"><table><thead><tr><th>Корпус</th><th class="num">Контингент</th><th class="num">Всего мест</th><th class="num">Лекц. места</th><th class="num">Комп. места</th><th class="num">Ориент. загрузка</th></tr></thead><tbody>${capRows||'<tr><td colspan="6" class="hint" style="padding:14px">Добавьте корпуса и аудитории во вкладке «Аудиторный фонд».</td></tr>'}${unassigned?`<tr><td class="hint">Не привязано к корпусу</td><td class="num">${fmt(unassigned)}</td><td colspan="4"></td></tr>`:''}</tbody></table></div><p class="hint">Загрузка = контингент / посадочные места (ориентир, без учёта сменности и расписания).</p>`);
  renderEntTable('program','progTable');
}

