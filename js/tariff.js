/* ---------- TARIFF ---------- */
function renderTariff(){
  const c=document.getElementById('tariffBody');if(!c)return;
  const rateOpts=state.hourlyRates.map(r=>`<option value="${r.rate}">${esc(r.category)} — ${fmt(r.rate)} ₸/час</option>`).join('');
  c.innerHTML=
   cardHTML('Учебная нагрузка',`<div style="margin-bottom:10px;display:flex;gap:8px;flex-wrap:wrap">${canEdit()?'<button class="btn sm" onclick="openEntModal(\'load\')">＋ Нагрузка</button>':''}${impBtn('load')}</div><div id="loadTable"></div>`)
   +cardHTML('Почасовые ставки',`<div style="margin-bottom:10px;display:flex;gap:8px;flex-wrap:wrap">${canEdit()?'<button class="btn sm" onclick="openEntModal(\'hourlyRate\')">＋ Ставка</button>':''}${impBtn('hourlyRate')}</div><div id="rateTable"></div>`)
   +cardHTML('Сравнение: оклад vs почасовая',`<div class="field" style="max-width:360px"><label>Ставка для сравнения</label><select id="tfRate">${rateOpts||'<option value="2500">2500 ₸/час</option>'}</select></div><div id="tfCompare"></div>`);
  renderEntTable('load','loadTable');renderEntTable('hourlyRate','rateTable');tariffCompare();
  const sel=document.getElementById('tfRate');if(sel)sel.onchange=tariffCompare;
}
function tariffCompare(){
  const rate=+((document.getElementById('tfRate')||{}).value)||0;const byT={};
  state.loads.forEach(l=>{if(!l.teacherId)return;byT[l.teacherId]=(byT[l.teacherId]||0)+(+l.hours||0)});
  const rows=Object.keys(byT).map(tid=>{const e=state.employees.find(x=>x.id===tid);if(!e)return '';
    const hours=byT[tid],hourly=hours*rate,okladYear=empBase(e)*12,cheaper=hourly<okladYear?'почасовая':'оклад';
    return `<tr><td>${esc(e.name)}</td><td>${esc(e.position)}</td><td class="num">${fmt(hours)}</td><td class="num">${money(hourly)}</td><td class="num">${money(okladYear)}</td><td><span class="pill">${cheaper}</span></td></tr>`}).join('');
  const c=document.getElementById('tfCompare');if(c)c.innerHTML=`<div class="table-wrap"><table><thead><tr><th>Преподаватель</th><th>Должность</th><th class="num">Часы</th><th class="num">Почасовая, ₸</th><th class="num">Оклад/год, ₸</th><th>Выгоднее</th></tr></thead><tbody>${rows||'<tr><td colspan="6" class="hint" style="padding:16px">Внесите нагрузку с привязкой к преподавателям.</td></tr>'}</tbody></table></div>`;
}
