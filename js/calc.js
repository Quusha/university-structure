/* ---------- ФОТ CALCULATOR ---------- */
function renderCalc(){
  const c=document.getElementById('calcBody');if(!c)return;
  const unitOpts=state.units.map(u=>`<option value="${u.id}">${esc(unitPath(u.id))}</option>`).join('');
  c.innerHTML=cardHTML('Сценарный калькулятор ФОТ («что если»)',`
   <p class="hint" style="margin-top:0">Смоделируйте изменения и сравните с текущим состоянием. Основная база не меняется.</p>
   <div class="row">
     <div style="flex:1;min-width:240px">
       <div class="field"><label>Повысить оклады на, %</label><input id="scRaise" type="number" step="0.5" value="10"></div>
       <div class="field"><label>Кому</label><select id="scScope"><option value="all">Всем</option><option value="unit">Подразделению (с вложенными)</option><option value="pos">Должности, содержащей текст</option></select></div>
       <div class="field"><label>Подразделение</label><select id="scUnit">${unitOpts}</select></div>
       <div class="field"><label>Текст в должности</label><input id="scPos" placeholder="напр. Профессор"></div>
     </div>
     <div style="flex:1;min-width:240px">
       <div class="field"><label>Изменить ставку начислений на, п.п.</label><input id="scAccr" type="number" step="0.5" value="0"><small>Прибавляется к каждому «% от ФОТ/мес».</small></div>
       <div class="field"><label>Добавить новых ставок</label><input id="scAdd" type="number" step="1" value="0"><small>По среднему окладу.</small></div>
       <button class="btn" onclick="computeScenario()">Рассчитать</button>
     </div>
   </div>
   <div id="scResult" style="margin-top:16px"></div>`);
  computeScenario();
}
function computeScenario(){
  const raise=(+document.getElementById('scRaise').value||0)/100;
  const scope=document.getElementById('scScope').value;
  const unitId=document.getElementById('scUnit').value;
  const posText=(document.getElementById('scPos').value||'').toLowerCase();
  const accrDelta=(+document.getElementById('scAccr').value||0);
  const addN=+document.getElementById('scAdd').value||0;
  const scopeUnits=scope==='unit'?[unitId,...descendants(unitId)]:[];
  function hit(e){if(scope==='all')return true;if(scope==='unit')return scopeUnits.indexOf(e.unitId)>=0;if(scope==='pos')return (e.position||'').toLowerCase().indexOf(posText)>=0;return false}
  const baseCur=state.employees.reduce((s,e)=>s+empBase(e),0);
  const suppCur=state.employees.reduce((s,e)=>s+supTotal(e),0);
  const baseNew=state.employees.reduce((s,e)=>s+empBase(e)*(hit(e)?(1+raise):1),0);
  const ratesSum=state.employees.reduce((s,e)=>s+(+e.rate||0),0);
  const avg=ratesSum?baseCur/ratesSum:0;
  const addCost=addN*avg;
  const mpCur=baseCur+suppCur,mpNew=baseNew+suppCur+addCost;
  function accrOn(P){return state.accruals.reduce((s,a)=>{if(!a.enabled)return s;const v=+a.value||0;if(a.mode==='monthly_percent')return s+P*(v+accrDelta)/100*12;if(a.mode==='annual_salaries')return s+P*v;if(a.mode==='annual_fixed')return s+v;return s},0)}
  const accrCur=accrOn(mpCur),accrNew=accrOn(mpNew);
  const totCur=mpCur*12+accrCur,totNew=mpNew*12+accrNew;
  const row=(l,a,b)=>{const d=b-a,p=a?d/a*100:0;return `<tr><td>${l}</td><td class="num">${money(a)}</td><td class="num">${money(b)}</td><td class="num" style="color:${d>0?'var(--danger)':d<0?'var(--good)':'inherit'}">${d>=0?'+':''}${money(d)} (${d>=0?'+':''}${p.toFixed(1)}%)</td></tr>`};
  document.getElementById('scResult').innerHTML=`<div class="table-wrap"><table><thead><tr><th>Показатель</th><th class="num">Сейчас</th><th class="num">Сценарий</th><th class="num">Δ</th></tr></thead><tbody>${row('ФОТ / мес',mpCur,mpNew)}${row('ФОТ / год',mpCur*12,mpNew*12)}${row('Начисления / год',accrCur,accrNew)}${row('Итого фонд / год',totCur,totNew)}</tbody></table></div>`;
}

