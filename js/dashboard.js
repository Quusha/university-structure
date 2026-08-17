/* ---------- DASHBOARD ---------- */
function renderDashboard(){
  const c=document.getElementById('dashBody');if(!c)return;
  const mp=monthlyPayroll(),accr=accrualsTotal();
  const contIncome=state.contingent.reduce((s,x)=>s+(+x.count||0)*(+x.tariff||0),0);
  const income=state.incomes.reduce((s,x)=>s+(+x.amount||0),0)+contIncome;
  const expense=state.expenses.reduce((s,x)=>s+(+x.amount||0),0);
  const students=state.contingent.reduce((s,x)=>s+(+x.count||0),0);
  const resid=state.assets.reduce((s,a)=>s+assetAmort(a).residual,0);
  const reqOpen=state.requests.filter(r=>r.status==='Подана'||r.status==='На проверке').length;
  const molCount=state.assets.filter(a=>a.molId&&a.status!=='Списан').length;
  const kpi=(l,v,s,acc)=>`<div class="kpi${acc?' accent':''}"><div class="label">${l}</div><div class="value">${v}</div><div class="sub">${s||''}</div></div>`;
  c.innerHTML=`<h2 style="color:var(--navy);margin-bottom:12px">Единая панель управления</h2>
   <div class="kpis">
    ${kpi('Подразделения / штат',state.units.length+' / '+state.employees.length,fmt(mp)+' ₸ ФОТ/мес')}
    ${kpi('Доходы (оценка/год)',money(income),'контингент '+money(contIncome),true)}
    ${kpi('Расходы (внесено)',money(expense),'без учёта ФОТ')}
    ${kpi('Баланс (оценка)',money(income-expense-mp*12-accr),'доходы − расходы − ФОТ − начисл.',true)}
    ${kpi('Контингент',fmt(students)+' обуч.',state.contingent.length+' групп')}
    ${kpi('Имущество',state.assets.length+' поз.','остаточная '+money(resid))}
    ${kpi('Заявки в работе',reqOpen,state.requests.length+' всего')}
    ${kpi('Закреплено имущества',molCount+' поз.','за сотрудниками (МОЛ)')}
   </div>
   <div class="hint" style="margin-top:14px">Прототип панели: показатели считаются со всех модулей на общих данных. Заполняйте разделы — цифры здесь обновятся. Тяжёлые части (автораспиание, загрузка файлов, настоящая авторизация) в этом файле упрощены — см. roadmap.</div>`;
}
