/* ================= ACCRUALS ================= */
function accrualAmount(a){
  if(!a.enabled)return 0;
  const M=periodMonths(),P=monthlyPayroll(),v=+a.value||0;
  if(a.mode==='monthly_percent')return P*v/100*M;
  if(a.mode==='annual_salaries')return P*v*(M/12);
  if(a.mode==='annual_fixed')return v*(M/12);
  return 0;
}
function accrualsTotal(){return state.accruals.reduce((s,a)=>s+accrualAmount(a),0)}
function setAccrual(id,field,val){
  const a=state.accruals.find(x=>x.id===id);if(!a)return;
  if(field==='value')val=+val||0;
  a[field]=val;save();renderAccruals();renderAnalytics();
}
function addAccrual(){if(!canEdit()){toast('Роль только для просмотра');return}state.accruals.push({id:uid(),name:'Новое начисление',mode:'monthly_percent',value:0,enabled:true});save();renderAccruals()}
function delAccrual(id){state.accruals=state.accruals.filter(x=>x.id!==id);save();renderAccruals();renderAnalytics()}

function renderAccruals(){
  document.getElementById('periodBarA').innerHTML=periodBarHTML();
  document.getElementById('accrualPeriodLbl').textContent=periodLabel();
  const total=accrualsTotal();
  const body=document.getElementById('accrualBody');
  const modeOpt=(m)=>['monthly_percent','annual_salaries','annual_fixed'].map(v=>
    `<option value="${v}" ${m===v?'selected':''}>${{monthly_percent:'% от ФОТ/мес',annual_salaries:'× оклада/год',annual_fixed:'фикс. ₸/год'}[v]}</option>`).join('');
  body.innerHTML=state.accruals.map(a=>{
    const amt=accrualAmount(a);const share=total?(amt/total*100):0;
    return `<tr>
      <td><input type="checkbox" ${a.enabled?'checked':''} onchange="setAccrual('${a.id}','enabled',this.checked)"></td>
      <td><input class="cell-in" style="width:100%" value="${esc(a.name)}" onchange="setAccrual('${a.id}','name',this.value)"></td>
      <td><select class="cell-in" style="width:100%" onchange="setAccrual('${a.id}','mode',this.value)">${modeOpt(a.mode)}</select></td>
      <td class="num"><input class="cell-in" type="number" step="0.1" style="width:90px;text-align:right" value="${a.value}" onchange="setAccrual('${a.id}','value',this.value)"></td>
      <td class="num"><b>${money(amt)}</b></td>
      <td class="num">${share.toFixed(1)}%</td>
      <td class="num"><button class="btn danger sm" onclick="delAccrual('${a.id}')">🗑</button></td>
    </tr>`;
  }).join('')||'<tr><td colspan="7" class="hint" style="padding:18px">Начислений нет. <button class="btn sm" onclick="addAccrual()">＋ Добавить</button></td></tr>';
  document.getElementById('accrualFoot').innerHTML=
    `<tr><td></td><td colspan="3">Итого начислений и соцвыплат ${periodLabel()}</td><td class="num">${money(total)}</td><td class="num">100%</td><td></td></tr>`;

  const bars=state.accruals.filter(a=>accrualAmount(a)>0).map(a=>({name:a.name,val:accrualAmount(a)})).sort((x,y)=>y.val-x.val);
  const max=Math.max(1,...bars.map(b=>b.val));
  document.getElementById('accrualChart').innerHTML=bars.length?bars.map(b=>`
    <div class="bar-row"><div class="bl" title="${esc(b.name)}">${esc(b.name)}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${(b.val/max*100).toFixed(1)}%"></div></div>
      <div class="bar-val">${money(b.val)}</div></div>`).join(''):'<div class="hint">Включите начисления и добавьте сотрудников с окладами.</div>';
}
