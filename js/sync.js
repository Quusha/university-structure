/* ================= CLOUD SYNC (Google Sheets + Apps Script) ================= */
const SYNC_KEY='shakarim_sync_cfg', REV_KEY='shakarim_sync_rev';
let syncCfg={url:'',secret:''};
let rev=0, syncStatus='none', pushTimer=null, pushPending=false, pushing=false, pulling=false;
let lastSync=null, conflictServer=null, pollTimer=null;

function loadSyncCfg(){try{const s=localStorage.getItem(SYNC_KEY);if(s)syncCfg=JSON.parse(s);}catch(e){}
  try{rev=+localStorage.getItem(REV_KEY)||0;}catch(e){}}
function saveSyncCfg(){try{localStorage.setItem(SYNC_KEY,JSON.stringify(syncCfg));localStorage.setItem(REV_KEY,String(rev));}catch(e){}}
function saveRev(){try{localStorage.setItem(REV_KEY,String(rev));}catch(e){}}

function setStatus(s){syncStatus=s;const chip=document.getElementById('syncChip');
  const map={none:['🔧 Не настроено','s-'],online:['✅ Онлайн','s-online'],sync:['⏳ Синхронизация…','s-sync'],
    offline:['⛔ Офлайн','s-offline'],conflict:['⚠️ Конфликт','s-conflict']};
  const [t,c]=map[s]||map.none;chip.className='tb-btn '+c;chip.textContent=t;
  document.getElementById('conflictBanner').classList.toggle('show',s==='conflict');
  const el=document.getElementById('syncStatusLine');if(el)el.innerHTML=syncStatusHTML();}
function syncStatusHTML(){
  const label={none:'не настроено',online:'подключено',sync:'синхронизация…',offline:'нет связи с сервером',conflict:'конфликт версий'}[syncStatus];
  const t=lastSync?(' · последняя синхронизация '+lastSync.toLocaleTimeString('ru-RU')):'';
  return `<span class="dot ${syncStatus==='online'?'online':syncStatus==='offline'?'offline':syncStatus==='conflict'?'conflict':syncStatus==='sync'?'sync':''}"></span> Статус: <b>${label}</b> · версия ${rev}${t}`;
}

async function cloudGet(){
  const u=syncCfg.url+(syncCfg.url.indexOf('?')<0?'?':'&')+'action=get&key='+encodeURIComponent(syncCfg.secret)+'&t='+Date.now();
  const r=await fetch(u,{method:'GET'});return await r.json();
}
async function cloudPing(){
  const u=syncCfg.url+(syncCfg.url.indexOf('?')<0?'?':'&')+'action=ping&key='+encodeURIComponent(syncCfg.secret)+'&t='+Date.now();
  const r=await fetch(u,{method:'GET'});return await r.json();
}
async function cloudPost(data,baseRev,force){
  const body=JSON.stringify({action:'save',key:syncCfg.secret,rev:baseRev,force:!!force,data});
  const r=await fetch(syncCfg.url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body});
  return await r.json();
}

function cloudSchedulePush(){if(!syncCfg.url||syncStatus==='conflict')return;pushPending=true;setStatus('sync');clearTimeout(pushTimer);pushTimer=setTimeout(cloudDoPush,900);}
async function cloudDoPush(){
  if(!syncCfg.url||pushing||syncStatus==='conflict')return;
  pushing=true;pushPending=false;setStatus('sync');
  try{
    const r=await cloudPost(state,rev,false);
    if(r&&r.ok){rev=r.rev;saveRev();lastSync=new Date();setStatus('online');}
    else if(r&&r.conflict){conflictServer={rev:r.rev,data:r.data};setStatus('conflict');}
    else{setStatus('offline');}
  }catch(e){setStatus('offline');}
  pushing=false;
  if(pushPending&&syncStatus!=='conflict')cloudSchedulePush();
}
async function cloudPull(){
  if(!syncCfg.url||pulling)return;
  pulling=true;setStatus('sync');
  try{
    const r=await cloudGet();
    if(r&&r.ok){
      if(r.rev>0&&r.data&&(r.data.units||r.data.employees)){
        state=r.data;ensureShape();rev=r.rev;saveRev();saveLocal();collapsed=new Set();ocCollapsed=new Set();renderAll();
      }else{ // сервер пуст — заливаем текущие данные как стартовые
        const p=await cloudPost(state,0,true);if(p&&p.ok){rev=p.rev;saveRev();}
      }
      lastSync=new Date();setStatus('online');
    }else{setStatus(r&&r.error==='unauthorized'?'offline':'offline');if(r&&r.error==='unauthorized')toast('Неверный ключ доступа');}
  }catch(e){setStatus('offline');}
  pulling=false;
}
function resolveConflict(which){
  if(!conflictServer)return;
  if(which==='server'){state=conflictServer.data;ensureShape();rev=conflictServer.rev;saveRev();saveLocal();collapsed=new Set();ocCollapsed=new Set();conflictServer=null;setStatus('online');renderAll();toast('Загружена серверная версия');}
  else{const base=conflictServer.rev;conflictServer=null;setStatus('sync');
    cloudPost(state,base,true).then(r=>{if(r&&r.ok){rev=r.rev;saveRev();lastSync=new Date();setStatus('online');toast('Ваша версия сохранена на сервере');}else{setStatus('offline')}});}
}
function startPoll(){clearInterval(pollTimer);pollTimer=setInterval(async()=>{
  if(!syncCfg.url||pushing||pushPending||pulling||syncStatus==='conflict')return;
  try{const r=await cloudPing();if(r&&r.ok&&r.rev!==rev){const g=await cloudGet();
    if(g&&g.ok&&g.data){state=g.data;ensureShape();rev=g.rev;saveRev();saveLocal();collapsed=new Set();ocCollapsed=new Set();renderAll();lastSync=new Date();setStatus('online');toast('Обновлено с другого устройства')}}
  }catch(e){}
},15000);}

function openSyncModal(){
  openModal('Синхронизация · Google Таблица',`
    <div class="status-line" id="syncStatusLine">${syncStatusHTML()}</div>
    <div class="field"><label>URL веб-приложения Apps Script (…/exec)</label>
      <input id="fSyncUrl" value="${esc(syncCfg.url)}" placeholder="https://script.google.com/macros/s/…/exec"></div>
    <div class="field"><label>Секретный ключ доступа</label>
      <input id="fSyncKey" value="${esc(syncCfg.secret)}" placeholder="тот же ключ, что задан в Script Properties">
      <small>Ключ хранится только на этом устройстве и не попадает в GitHub. Введите одинаковый ключ на обоих ноутбуках.</small></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">
      <button class="btn ghost sm" onclick="syncTest()">Проверить связь</button>
      <button class="btn ghost sm" onclick="cloudPull().then(()=>toast('Загружено с сервера'))">⬇ Взять с сервера</button>
      <button class="btn ghost sm" onclick="cloudDoPush().then(()=>toast('Отправлено на сервер'))">⬆ Отправить на сервер</button>
      <button class="btn danger sm" onclick="syncDisconnect()">Отключить</button>
    </div>
    <small style="display:block;margin-top:10px;color:var(--muted)">Подключение: сохранить → приложение сразу загрузит данные с сервера и включит автосинхронизацию. Изменения обеих машин объединяются автоматически (при одновременной правке одного и того же появится выбор версии).</small>`,
  ()=>{
    syncCfg.url=document.getElementById('fSyncUrl').value.trim();
    syncCfg.secret=document.getElementById('fSyncKey').value.trim();
    saveSyncCfg();closeModal();
    if(syncCfg.url){cloudPull().then(()=>{startPoll();});toast('Подключение сохранено');}else{setStatus('none');}
  });
}
async function syncTest(){
  const url=document.getElementById('fSyncUrl').value.trim(),key=document.getElementById('fSyncKey').value.trim();
  if(!url){toast('Укажите URL');return}
  const el=document.getElementById('syncStatusLine');el.innerHTML='<span class="dot sync"></span> Проверка…';
  try{const r=await fetch(url+(url.indexOf('?')<0?'?':'&')+'action=ping&key='+encodeURIComponent(key)+'&t='+Date.now());
    const j=await r.json();
    if(j&&j.ok)el.innerHTML='<span class="dot online"></span> Связь есть · версия на сервере '+j.rev;
    else el.innerHTML='<span class="dot offline"></span> Ответ получен, но ключ неверный или доступ закрыт';
  }catch(e){el.innerHTML='<span class="dot offline"></span> Нет связи (проверьте URL и что доступ = «Все»)';}
}
function syncDisconnect(){syncCfg={url:'',secret:''};rev=0;saveSyncCfg();clearInterval(pollTimer);setStatus('none');closeModal();toast('Синхронизация отключена')}

