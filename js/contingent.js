/* ---------- CONTINGENT ---------- */
function renderContingent(){
  const c=document.getElementById('contBody');if(!c)return;
  const total=state.contingent.reduce((s,x)=>s+(+x.count||0),0);
  const gos=state.contingent.filter(x=>(x.source||'').indexOf('Гос')===0).reduce((s,x)=>s+(+x.count||0),0);
  const income=state.contingent.reduce((s,x)=>s+(+x.count||0)*(+x.tariff||0),0);
  c.innerHTML=`<div class="kpis" style="margin-bottom:16px">
      <div class="kpi"><div class="label">Всего обучающихся</div><div class="value">${fmt(total)}</div><div class="sub">${state.contingent.length} групп</div></div>
      <div class="kpi"><div class="label">Госзаказ / Собственные</div><div class="value">${fmt(gos)} / ${fmt(total-gos)}</div></div>
      <div class="kpi accent"><div class="label">Доход от контингента (год)</div><div class="value">${money(income)}</div><div class="sub">учтено в бюджете</div></div></div>`
    +cardHTML('Группы контингента',`<div style="margin-bottom:10px;display:flex;gap:8px;flex-wrap:wrap">${canEdit()?'<button class="btn sm" onclick="openEntModal(\'contingent\')">＋ Группа</button>':''}${impBtn('contingent')}</div><div id="contTable"></div>`);
  renderEntTable('contingent','contTable');
}
