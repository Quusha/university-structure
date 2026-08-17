/* ---------- SETTINGS ---------- */
function renderSettings(){
  const c=document.getElementById('setBody');if(!c)return;
  const chips=(d)=>state.dict[d].map((v,i)=>`<span class="pill" style="margin:3px">${esc(v)} ${canEdit()?`<a onclick="dictDel('${d}',${i})" style="cursor:pointer;color:var(--danger)">×</a>`:''}</span>`).join('');
  const dictEd=(d,l)=>cardHTML(l,`<div>${chips(d)}</div>${canEdit()?`<div style="margin-top:10px;display:flex;gap:8px"><input id="di_${d}" placeholder="новая запись" style="padding:8px 10px;border:1px solid var(--line);border-radius:8px"><button class="btn sm" onclick="dictAdd('${d}')">Добавить</button></div>`:''}`);
  c.innerHTML=
    cardHTML('Роль (демонстрационная)',`<div class="field" style="max-width:340px"><label>Текущая роль</label><select onchange="setRole(this.value)">${Object.keys(ROLES).map(r=>`<option ${state.roleCurrent===r?'selected':''}>${r}</option>`).join('')}</select><small>Влияет на видимость вкладок и кнопок. Это интерфейсное разграничение (демо), не настоящая защита — реальная авторизация появляется на серверном этапе (см. roadmap).</small></div>`)
   +dictEd('incomeArticles','Справочник: статьи доходов')
   +dictEd('expenseArticles','Справочник: статьи расходов')
   +dictEd('assetCategories','Справочник: категории имущества')
   +dictEd('programLevels','Справочник: уровни программ')
   +dictEd('roomTypes','Справочник: типы аудиторий')
   +cardHTML('Импорт данных по шаблону',`<p class="hint" style="margin-top:0">Выберите раздел: скачайте шаблон (CSV), заполните в Excel/Sheets, загрузите — записи встают прямо в базу. Ссылки (подразделение, программа, корпус) сопоставляются по названию.</p><div style="display:flex;gap:8px;flex-wrap:wrap">
     <button class="btn ghost sm" onclick="openImport('units')">Структура</button>
     <button class="btn ghost sm" onclick="openImport('employees')">Штат</button>
     <button class="btn ghost sm" onclick="openImport('contingent')">Контингент</button>
     <button class="btn ghost sm" onclick="openImport('program')">Обр. программы</button>
     <button class="btn ghost sm" onclick="openImport('building')">Корпуса</button>
     <button class="btn ghost sm" onclick="openImport('room')">Аудитории</button>
     <button class="btn ghost sm" onclick="openImport('asset')">Инвентарь</button>
     <button class="btn ghost sm" onclick="openImport('income')">Доходы</button>
     <button class="btn ghost sm" onclick="openImport('expense')">Расходы</button>
     <button class="btn ghost sm" onclick="openImport('load')">Нагрузка</button>
     <button class="btn ghost sm" onclick="openImport('hourlyRate')">Почас. ставки</button>
   </div>`)
   +cardHTML('Синхронизация и выгрузки',`<button class="btn ghost sm" onclick="openSyncModal()">🔧 Синхронизация (Google Таблица)</button> <button class="btn ghost sm" onclick="exportJSON()">⬇ Экспорт JSON</button> <button class="btn ghost sm" onclick="exportCSV()">⬇ CSV сотрудников</button>`)
   +cardHTML('Журнал изменений (аудит)',`<div id="auditTable"></div>`);
  renderAudit();
}
function dictAdd(d){if(!canEdit())return;const el=document.getElementById('di_'+d);const v=el.value.trim();if(!v)return;state.dict[d].push(v);save();renderSettings()}
function dictDel(d,i){if(!canEdit())return;state.dict[d].splice(i,1);save();renderSettings()}
function renderAudit(){const c=document.getElementById('auditTable');if(!c)return;const rows=state.audit.slice(0,80).map(a=>`<tr><td class="hint">${new Date(a.time).toLocaleString('ru-RU')}</td><td>${esc(a.who)}</td><td>${esc(a.action)}</td><td>${esc(a.entity)}</td><td class="hint">${esc(a.detail||'')}</td></tr>`).join('');c.innerHTML=`<div class="table-wrap"><table><thead><tr><th>Время</th><th>Роль</th><th>Действие</th><th>Объект</th><th>Детали</th></tr></thead><tbody>${rows||'<tr><td colspan="5" class="hint" style="padding:16px">Пока пусто.</td></tr>'}</tbody></table></div>`}
function importEmployeesCSV(){
  if(!canEdit())return toast('Роль только для просмотра');
  const t=(document.getElementById('impText').value||'').trim();if(!t){toast('Вставьте данные');return}
  let n=0;
  t.split(/\r?\n/).forEach(line=>{const p=line.split(';');if(p.length<2)return;const fio=p[0],pos=p[1],unit=p[2]||'',ok=p[3],rate=p[4];
    let unitId='';if(unit){const u=state.units.find(x=>x.name.trim().toLowerCase()===unit.trim().toLowerCase()||unitPath(x.id).toLowerCase().indexOf(unit.trim().toLowerCase())>=0);if(u)unitId=u.id}
    state.employees.push({id:uid(),name:(fio||'').trim(),position:(pos||'').trim(),unitId,oklad:+ok||0,rate:+rate||1,supplements:[]});n++;});
  logAudit('импорт','Сотрудники',n+' строк');save();renderAll();renderSettings();toast('Импортировано: '+n);
}

