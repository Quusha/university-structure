/* ================= CLOUD SYNC (авторизация по токену) ================= */
const REV_KEY='shakarim_sync_rev';
let rev=0, syncStatus='none', pushTimer=null, pushPending=false, pushing=false, pulling=false;
let lastSync=null, conflictServer=null, pollTimer=null;

function loadRev(){try{rev=+localStorage.getItem(REV_KEY)||0;}catch(e){}}
function saveRev(){try{localStorage.setItem(REV_KEY,String(rev));}catch(e){}}

function setStatus(s){syncStatus=s;const chip=document.getElementById('syncChip');
  const map={none:['🔧 Локально','s-'],online:['✅ Онлайн','s-online'],sync:['⏳ Синхронизация…','s-sync'],
    offline:['⛔ Нет связи','s-offline'],conflict:['⚠️ Конфликт','s-conflict']};
  const [t,c]=map[s]||map.none;if(chip){chip.className='tb-btn '+c;chip.textContent=t;}
  const cb=document.getElementById('conflictBanner');if(cb)cb.classList.toggle('show',s==='conflict');
  const el=document.getElementById('syncStatusLine');if(el)el.innerHTML=syncStatusHTML();}
function syncStatusHTML(){
  const label={none:'локальный режим',online:'подключено',sync:'синхронизация…',offline:'нет связи с сервером',conflict:'конфликт версий'}[syncStatus];
  const t=lastSync?(' · последняя синхронизация '+lastSync.toLocaleTimeString('ru-RU')):'';
  return `<span class="dot ${syncStatus==='online'?'online':syncStatus==='offline'?'offline':syncStatus==='conflict'?'conflict':syncStatus==='sync'?'sync':''}"></span> Статус: <b>${label}</b> · версия ${rev}${t}`;
}

async function cloudGet(){ return await api('get'); }
async function cloudPing(){ return await api('ping'); }
async function cloudPost(data,baseRev,force){ return await api('save',{rev:baseRev,force:!!force,data}); }

function onAuthLost(){ setAuthToken(''); currentUser=null; try{clearInterval(pollTimer)}catch(e){} setStatus('offline'); showAuthGate('login','Сессия истекла. Войдите снова.'); }

function cloudSchedulePush(){ if(!backendReady()||!authToken()||syncStatus==='conflict')return; pushPending=true;setStatus('sync');clearTimeout(pushTimer);pushTimer=setTimeout(cloudDoPush,900); }
async function cloudDoPush(){
  if(!backendReady()||!authToken()||pushing||syncStatus==='conflict')return;
  pushing=true;pushPending=false;setStatus('sync');
  try{
    const r=await cloudPost(state,rev,false);
    if(r&&r.ok){rev=r.rev;saveRev();lastSync=new Date();setStatus('online');}
    else if(r&&r.conflict){conflictServer={rev:r.rev,data:r.data};setStatus('conflict');}
    else if(r&&r.error==='unauthorized'){onAuthLost();}
    else if(r&&r.error==='forbidden'){setStatus('online');toast('Недостаточно прав для сохранения');}
    else{setStatus('offline');}
  }catch(e){setStatus('offline');}
  pushing=false;
  if(pushPending&&syncStatus!=='conflict')cloudSchedulePush();
}
async function cloudPull(){
  if(!backendReady()||!authToken()||pulling)return;
  pulling=true;setStatus('sync');
  try{
    const r=await cloudGet();
    if(r&&r.ok){
      if(r.user){currentUser=r.user;state.roleCurrent=currentUser.role;updateAcct();}
      if(r.rev>0&&r.data&&(r.data.units||r.data.employees)){
        state=r.data;ensureShape();rev=r.rev;saveRev();saveLocal();collapsed=new Set();ocCollapsed=new Set();renderAll();
      }else{ const p=await cloudPost(state,0,true); if(p&&p.ok){rev=p.rev;saveRev();} }
      lastSync=new Date();setStatus('online');
    }else if(r&&r.error==='unauthorized'){onAuthLost();}
     else if(r&&r.error==='pending'){setStatus('offline');if(currentUser)currentUser.status='pending';showPending();}
     else{setStatus('offline');}
  }catch(e){setStatus('offline');}
  pulling=false;
}
function resolveConflict(which){
  if(!conflictServer)return;
  if(which==='server'){state=conflictServer.data;ensureShape();rev=conflictServer.rev;saveRev();saveLocal();collapsed=new Set();ocCollapsed=new Set();conflictServer=null;setStatus('online');renderAll();toast('Загружена серверная версия');}
  else{const base=conflictServer.rev;conflictServer=null;setStatus('sync');
    cloudPost(state,base,true).then(r=>{if(r&&r.ok){rev=r.rev;saveRev();lastSync=new Date();setStatus('online');toast('Ваша версия сохранена');}else if(r&&r.error==='forbidden'){setStatus('online');toast('Недостаточно прав');}else{setStatus('offline')}});}
}
function startPoll(){clearInterval(pollTimer);pollTimer=setInterval(async()=>{
  if(!backendReady()||!authToken()||pushing||pushPending||pulling||syncStatus==='conflict')return;
  try{const r=await cloudPing();if(r&&r.ok&&r.rev!==rev){const g=await cloudGet();
    if(g&&g.ok&&g.data){state=g.data;ensureShape();rev=g.rev;saveRev();saveLocal();collapsed=new Set();ocCollapsed=new Set();renderAll();lastSync=new Date();setStatus('online');toast('Обновлено с другого устройства')}
    else if(g&&g.error==='unauthorized'){onAuthLost();}}
  }catch(e){}
},15000);}

function openSyncModal(){
  openModal('Подключение и аккаунт',`
    <div class="status-line" id="syncStatusLine">${syncStatusHTML()}</div>
    <div class="hint" style="margin-top:10px">${currentUser?('Вы вошли как <b>'+esc(currentUser.email)+'</b> · роль <b>'+esc(currentUser.role)+'</b>'):(backendReady()?'Вход не выполнен':'Локальный режим (бэкенд не настроен в config.js)')}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
      <button class="btn ghost sm" onclick="cloudPull().then(()=>toast('Обновлено с сервера'))">⟳ Обновить с сервера</button>
      ${currentUser?'<button class="btn danger sm" onclick="doLogout()">Выйти</button>':''}
    </div>
    <small style="display:block;margin-top:12px;color:var(--muted)">Данные хранятся в Google-таблице и синхронизируются между устройствами. Права проверяются на сервере при каждом действии.</small>`, null);
}
