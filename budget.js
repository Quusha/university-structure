/* ---------- BUDGET ---------- */
function renderBudget(){
  const c=document.getElementById('budgetBody');if(!c)return;
  const contIncome=state.contingent.reduce((s,x)=>s+(+x.count||0)*(+x.tariff||0),0);
  const incByArt={};state.incomes.forEach(i=>incByArt[i.article]=(incByArt[i.article]||0)+(+i.amount||0));
  if(contIncome)incByArt['Контингент']=(incByArt['Контингент']||0)+contIncome;
  const expByArt={};state.expenses.forEach(x=>expByArt[x.article]=(expByArt[x.article]||0)+(+x.amount||0));
  const incTot=Object.values(incByArt).reduce((a,b)=>a+b,0),expTot=Object.values(expByArt).reduce((a,b)=>a+b,0);
  const bars=(obj)=>{const m=Math.max(1,...Object.values(obj));return Object.entries(obj).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="bar-row"><div class="bl" title="${esc(k)}">${esc(k)}</div><div class="bar-track"><div class="bar-fill" style="width:${(v/m*100).toFixed(1)}%"></div></div><div class="bar-val">${money(v)}</div></div>`).join('')||'<div class="hint">Нет данных.</div>'};
  c.innerHTML=`<div class="kpis" style="margin-bottom:16px">
      <div class="kpi accent"><div class="label">Доходы</div><div class="value">${money(incTot)}</div><div class="sub">вкл. контингент ${money(contIncome)}</div></div>
      <div class="kpi"><div class="label">Расходы</div><div class="value">${money(expTot)}</div><div class="sub">внесённые статьи</div></div>
      <div class="kpi accent"><div class="label">Сальдо</div><div class="value">${money(incTot-expTot)}</div><div class="sub">доходы − расходы</div></div></div>`
    +cardHTML('Доходы по статьям',`<div style="margin-bottom:10px;display:flex;gap:8px;flex-wrap:wrap">${canEdit()?'<button class="btn sm" onclick="openEntModal(\'income\')">＋ Доход</button>':''}${impBtn('income')}</div><div class="barchart" style="margin-bottom:14px">${bars(incByArt)}</div><div id="incTable"></div>`)
    +cardHTML('Расходы по статьям',`<div style="margin-bottom:10px;display:flex;gap:8px;flex-wrap:wrap">${canEdit()?'<button class="btn sm" onclick="openEntModal(\'expense\')">＋ Расход</button>':''}${impBtn('expense')}</div><div class="barchart" style="margin-bottom:14px">${bars(expByArt)}</div><div id="expTable"></div>`);
  renderEntTable('income','incTable');renderEntTable('expense','expTable');
}

