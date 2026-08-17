/* ================= ANALYTICS ================= */
function renderAnalytics(){
  document.getElementById('periodBarAn').innerHTML=periodBarHTML();
  document.getElementById('periodInfoAn').textContent=periodLabel();
  const M=periodMonths();
  const base=state.employees.reduce((s,e)=>s+empBase(e),0);
  const supp=state.employees.reduce((s,e)=>s+supTotal(e),0);
  const payMonthly=base+supp;
  const payPeriod=payMonthly*M;
  const accr=accrualsTotal();
  const grand=payPeriod+accr;
  const heads=state.employees.length;
  const rates=state.employees.reduce((s,e)=>s+(+e.rate||0),0);
  const avg=rates?base/rates:0;

  document.getElementById('kpis').innerHTML=`
    <div class="kpi"><div class="label">Подразделений</div><div class="value">${state.units.length}</div><div class="sub">в структуре</div></div>
    <div class="kpi"><div class="label">Сотрудников</div><div class="value">${heads}</div><div class="sub">${rates.toLocaleString('ru-RU')} штатных ставок</div></div>
    <div class="kpi accent"><div class="label">ФОТ ${periodLabel()}</div><div class="value">${money(payPeriod)}</div><div class="sub">оклады ${money(base*M)} · доплаты ${money(supp*M)}</div></div>
    <div class="kpi"><div class="label">Начисления и соцвыплаты</div><div class="value">${money(accr)}</div><div class="sub">${periodLabel()}</div></div>
    <div class="kpi accent"><div class="label">Итого фонд ${periodLabel()}</div><div class="value">${money(grand)}</div><div class="sub">ФОТ + начисления</div></div>
    <div class="kpi"><div class="label">Средний оклад</div><div class="value">${money(avg)}</div><div class="sub">на ставку, ₸/мес</div></div>`;

  document.getElementById('blockLbl').textContent=periodLabel();
  const blocks=rootUnits().map(u=>({name:u.name,val:rollupPayroll(u.id)*M})).filter(b=>b.val>0).sort((a,b)=>b.val-a.val);
  const max=Math.max(1,...blocks.map(b=>b.val));
  const chart=document.getElementById('blockChart');
  chart.innerHTML=blocks.length?blocks.map(b=>`<div class="bar-row"><div class="bl" title="${esc(b.name)}">${esc(b.name)}</div>
    <div class="bar-track"><div class="bar-fill" style="width:${(b.val/max*100).toFixed(1)}%"></div></div>
    <div class="bar-val">${money(b.val)}</div></div>`).join(''):'<div class="hint">Назначьте оклады сотрудникам.</div>';

  const top=state.employees.slice().sort((a,b)=>empAccrued(b)-empAccrued(a)).slice(0,6);
  document.getElementById('topSalaries').innerHTML=top.length?top.map((e,i)=>`
    <div style="display:flex;gap:10px;align-items:center;padding:7px 0;border-bottom:1px solid var(--line2)">
      <span class="pill">${i+1}</span>
      <div style="flex:1;min-width:0"><div style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(e.name)}</div>
      <div class="hint" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(e.position)}${supTotal(e)?' · +доплаты':''}</div></div>
      <b style="font-variant-numeric:tabular-nums">${money(empAccrued(e))}</b></div>`).join(''):'<div class="hint">Нет данных.</div>';

  const rows=state.units.slice().sort((a,b)=>rollupPayroll(b.id)-rollupPayroll(a.id)).map(u=>`
    <tr><td>${esc(unitPath(u.id))}</td><td><span class="pill">${esc(u.type||'')}</span></td>
      <td class="num">${directEmps(u.id).length}</td><td class="num">${directRate(u.id).toLocaleString('ru-RU')}</td>
      <td class="num">${fmt(directPayroll(u.id))}</td><td class="num"><b>${fmt(rollupPayroll(u.id))}</b></td></tr>`).join('');
  document.getElementById('analyticsBody').innerHTML=rows||'<tr><td colspan="6" class="hint" style="padding:20px">Нет подразделений.</td></tr>';
}
