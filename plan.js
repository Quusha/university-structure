/* ---------- DEVELOPMENT PLAN ---------- */
function renderPlan(){
  const c=document.getElementById('planBody');if(!c)return;
  const col={'Черновик':'#64748b','Подана':'#2a6fb0','На проверке':'#c98a00','На доработке':'#cf3b3b','Одобрена':'#1f9d55','Отклонена':'#cf3b3b'};
  const reqRows=state.requests.map(r=>{const cl=col[r.status]||'#64748b';
    return `<tr><td>${esc(unitPath(r.unitId))||'—'}</td><td>${esc(r.article)}</td><td class="num">${fmt(r.amount)}</td><td><span class="pill" style="background:${cl}22;border-color:${cl}55;color:${cl}">${r.status}</span></td><td class="hint">${esc(r.files||'')}</td><td style="white-space:nowrap">${canEdit()?requestActions(r):''}<button class="btn ghost sm" onclick="requestComments('${r.id}')">💬 ${(r.comments||[]).length}</button>${canEdit()?`<button class="btn ghost sm" onclick="openRequest('${r.id}')">✎</button>`:''}</td></tr>`}).join('');
  const planRows=state.plan.map(p=>{const fact=state.expenses.filter(x=>x.unitId===p.unitId&&x.article===p.article).reduce((s,x)=>s+(+x.amount||0),0);const rest=(+p.planAmount||0)-fact,pct=p.planAmount?fact/p.planAmount*100:0;
    return `<tr><td>${esc(unitPath(p.unitId))}</td><td>${esc(p.article)}</td><td class="num">${fmt(p.planAmount)}</td><td class="num">${fmt(fact)}</td><td class="num" style="color:${rest<0?'var(--danger)':'inherit'}">${fmt(rest)}</td><td class="num">${pct.toFixed(0)}%</td></tr>`}).join('');
  c.innerHTML=
   cardHTML('Раздел 1 · Заявки подразделений',`<div style="margin-bottom:10px;display:flex;gap:8px;flex-wrap:wrap">${canEdit()?'<button class="btn sm" onclick="openRequest()">＋ Заявка</button><button class="btn ghost sm" onclick="buildPlan()">📄 Сформировать план из одобренных</button>':''}</div><div class="table-wrap"><table><thead><tr><th>Подразделение</th><th>Статья</th><th class="num">Сумма</th><th>Статус</th><th>Файлы</th><th></th></tr></thead><tbody>${reqRows||'<tr><td colspan="6" class="hint" style="padding:16px">Заявок нет.</td></tr>'}</tbody></table></div>`)
   +cardHTML('Раздел 2 · Мониторинг: план / факт',`<div class="table-wrap"><table><thead><tr><th>Подразделение</th><th>Статья</th><th class="num">План</th><th class="num">Факт (расходы)</th><th class="num">Остаток</th><th class="num">Освоение</th></tr></thead><tbody>${planRows||'<tr><td colspan="6" class="hint" style="padding:16px">План пуст. Сформируйте его из одобренных заявок.</td></tr>'}</tbody></table></div>`);
}
function requestActions(r){
  const b=(t,fn,cls)=>`<button class="btn ${cls||'ghost'} sm" onclick="${fn}">${t}</button>`;
  if(r.status==='Черновик'||r.status==='На доработке')return b('Подать',`reqStatus('${r.id}','Подана')`);
  if(r.status==='Подана')return b('На проверку',`reqStatus('${r.id}','На проверке')`);
  if(r.status==='На проверке')return b('Одобрить',`reqStatus('${r.id}','Одобрена')`)+b('Доработать',`reqRevise('${r.id}')`,'danger')+b('Отклонить',`reqStatus('${r.id}','Отклонена')`,'danger');
  return '';
}
function reqStatus(id,st){if(!canEdit())return toast('Роль только для просмотра');const r=state.requests.find(x=>x.id===id);r.status=st;logAudit('статус заявки → '+st,'Заявка',unitPath(r.unitId));save();renderPlan();toast('Статус: '+st)}
function reqRevise(id){if(!canEdit())return toast('Роль только для просмотра');const note=prompt('Замечание (что доработать):');if(note==null)return;const r=state.requests.find(x=>x.id===id);r.status='На доработке';(r.comments=r.comments||[]).push({time:new Date().toISOString(),who:state.roleCurrent,text:'На доработку: '+note});save();renderPlan();toast('Отправлено на доработку')}
function openRequest(id){
  if(!canEdit())return toast('Роль только для просмотра');
  const r=id?state.requests.find(x=>x.id===id):null;
  const unitOpts=state.units.map(u=>`<option value="${u.id}" ${r&&r.unitId===u.id?'selected':''}>${esc(unitPath(u.id))}</option>`).join('');
  const artOpts=state.dict.expenseArticles.map(a=>`<option ${r&&r.article===a?'selected':''}>${esc(a)}</option>`).join('');
  openModal(id?'Изменить заявку':'Новая заявка',`
    <div class="field"><label>Подразделение</label><select id="rqUnit">${unitOpts}</select></div>
    <div class="field"><label>Статья расхода</label><select id="rqArt">${artOpts}</select></div>
    <div class="field"><label>Сумма, ₸</label><input id="rqAmt" type="number" value="${r?r.amount:''}"></div>
    <div class="field"><label>Файлы / приложения</label><input id="rqFiles" value="${r?esc(r.files||''):''}" placeholder="ценовое.pdf; смета.xlsx"><small>Прототип: хранятся имена/ссылки. Реальная загрузка — на серверном этапе.</small></div>`,
   ()=>{
     const obj=r||{id:uid(),status:'Черновик',comments:[],createdAt:new Date().toISOString()};
     obj.unitId=document.getElementById('rqUnit').value;obj.article=document.getElementById('rqArt').value;
     obj.amount=+document.getElementById('rqAmt').value||0;obj.files=document.getElementById('rqFiles').value;
     if(!r)state.requests.push(obj);
     logAudit(r?'изменение заявки':'создание заявки','Заявка',unitPath(obj.unitId));
     save();closeModal();renderPlan();toast('Сохранено');
   });
}
function requestComments(id){
  const r=state.requests.find(x=>x.id===id);
  const list=(r.comments||[]).map(x=>`<div style="padding:6px 0;border-bottom:1px solid var(--line2)"><b>${esc(x.who)}</b> <span class="hint">${new Date(x.time).toLocaleString('ru-RU')}</span><br>${esc(x.text)}</div>`).join('')||'<div class="hint">Комментариев нет.</div>';
  openModal('Заявка · переписка',`<div style="max-height:240px;overflow:auto">${list}</div>${canEdit()?'<div class="field" style="margin-top:12px"><label>Добавить комментарий</label><input id="cmText"></div>':''}`,
   ()=>{if(canEdit()){const t=(document.getElementById('cmText')||{}).value;if(t&&t.trim()){(r.comments=r.comments||[]).push({time:new Date().toISOString(),who:state.roleCurrent,text:t.trim()});save();renderPlan()}}closeModal()});
}
function buildPlan(){
  if(!canEdit())return toast('Роль только для просмотра');
  const map={};state.requests.filter(r=>r.status==='Одобрена').forEach(r=>{const k=r.unitId+'|'+r.article;map[k]=(map[k]||0)+(+r.amount||0)});
  state.plan=Object.keys(map).map(k=>{const p=k.split('|');return {id:uid(),unitId:p[0],article:p[1],planAmount:map[k],year:state.settings.year}});
  logAudit('формирование плана','План развития',state.plan.length+' позиций');save();renderPlan();toast('План сформирован: '+state.plan.length+' позиций');
}

