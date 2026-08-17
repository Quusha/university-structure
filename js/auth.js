/* ================= AUTH ================= */
const AUTH_TOKEN_KEY='shakarim_auth_token';
let currentUser=null, authMode='login';
function authToken(){try{return localStorage.getItem(AUTH_TOKEN_KEY)||''}catch(e){return ''}}
function setAuthToken(t){try{t?localStorage.setItem(AUTH_TOKEN_KEY,t):localStorage.removeItem(AUTH_TOKEN_KEY)}catch(e){}}
async function api(action,payload){
  const body=JSON.stringify(Object.assign({action,token:authToken()},payload||{}));
  const r=await fetch(BACKEND_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body});
  return await r.json();
}
async function authBoot(){
  if(!backendReady()){document.body.classList.add('local-mode');renderAll();return;}
  const t=authToken();
  if(t){try{const r=await api('me');if(r&&r.ok&&r.user){currentUser=r.user;return afterAuth();}}catch(e){}}
  showAuthGate('login');
}
function afterAuth(){
  if(!currentUser)return showAuthGate('login');
  if(currentUser.status==='blocked'){setAuthToken('');return showAuthGate('login','Доступ заблокирован администратором.');}
  if(currentUser.status==='pending')return showPending();
  state.roleCurrent=currentUser.role;
  hideAuthGate();updateAcct();renderAll();
  cloudPull().then(()=>startPoll());
}
function gateEl(){let g=document.getElementById('authGate');if(!g){g=document.createElement('div');g.id='authGate';g.className='auth-gate';document.body.appendChild(g);}return g;}
function hideAuthGate(){const g=document.getElementById('authGate');if(g)g.style.display='none';}
function showAuthGate(mode,msg){
  authMode=mode||'login';const g=gateEl();g.style.display='flex';
  g.innerHTML=`<div class="auth-card">
    <div class="auth-brand">Панель управления<br>университетом</div>
    <div class="auth-tabs">
      <button class="${authMode==='login'?'on':''}" onclick="showAuthGate('login')">Вход</button>
      <button class="${authMode==='register'?'on':''}" onclick="showAuthGate('register')">Регистрация</button>
    </div>
    ${authMode==='register'?`<input id="auName" placeholder="Имя и фамилия">`:''}
    <input id="auEmail" type="email" placeholder="Email" autocomplete="username">
    <input id="auPass" type="password" placeholder="Пароль" autocomplete="${authMode==='login'?'current-password':'new-password'}" onkeydown="if(event.key==='Enter'){${authMode==='login'?'doLogin()':'doRegister()'}}">
    ${authMode==='register'?`<input id="auInvite" placeholder="Код приглашения (если требуется)">`:''}
    <button class="auth-btn" onclick="${authMode==='login'?'doLogin()':'doRegister()'}">${authMode==='login'?'Войти':'Зарегистрироваться'}</button>
    <div class="auth-msg" id="auMsg">${msg?esc(msg):''}</div>
    <div class="auth-note">Новые аккаунты создаются со статусом «на подтверждении» — доступ выдаёт администратор.</div>
  </div>`;
  const em=document.getElementById('auEmail');if(em)em.focus();
}
function showPending(){
  const g=gateEl();g.style.display='flex';
  g.innerHTML=`<div class="auth-card">
    <div class="auth-brand">Ожидание подтверждения</div>
    <div class="auth-note" style="margin:12px 0">Аккаунт <b>${esc((currentUser&&currentUser.email)||'')}</b> создан и ждёт, пока администратор активирует доступ и выдаст роль.</div>
    <button class="auth-btn" onclick="location.reload()">Проверить снова</button>
    <button class="btn ghost sm" style="margin-top:10px" onclick="doLogout()">Выйти</button>
  </div>`;
}
function authErr(code){return {bad_email:'Неверный email',weak_password:'Пароль минимум 6 символов',exists:'Такой email уже зарегистрирован',bad_invite:'Неверный код приглашения',no_user:'Пользователь не найден',bad_credentials:'Неверный email или пароль',blocked:'Доступ заблокирован',unauthorized:'Сессия недействительна',forbidden:'Недостаточно прав',self_lock:'Нельзя изменить собственный доступ',pending:'Аккаунт ещё не подтверждён'}[code]||('Ошибка: '+(code||'сеть'));}
async function doLogin(){
  const email=(document.getElementById('auEmail').value||'').trim(), password=document.getElementById('auPass').value||'';
  const msg=document.getElementById('auMsg');if(msg)msg.textContent='Вход…';
  try{const r=await api('login',{email,password});
    if(r&&r.ok){setAuthToken(r.token);currentUser=r.user;afterAuth();}else if(msg)msg.textContent=authErr(r&&r.error);
  }catch(e){if(msg)msg.textContent='Нет связи с сервером';}
}
async function doRegister(){
  const name=(document.getElementById('auName')||{}).value||'', email=(document.getElementById('auEmail').value||'').trim();
  const password=document.getElementById('auPass').value||'', invite=(document.getElementById('auInvite')||{}).value||'';
  const msg=document.getElementById('auMsg');if(msg)msg.textContent='Создание…';
  try{const r=await api('register',{name:name.trim(),email,password,invite});
    if(r&&r.ok){
      if(r.pending){showAuthGate('login','Аккаунт создан и ожидает подтверждения администратором.');}
      else{const l=await api('login',{email,password});if(l&&l.ok){setAuthToken(l.token);currentUser=l.user;afterAuth();}else showAuthGate('login','Аккаунт создан. Войдите.');}
    }else if(msg)msg.textContent=authErr(r&&r.error);
  }catch(e){if(msg)msg.textContent='Нет связи с сервером';}
}
function doLogout(){setAuthToken('');currentUser=null;try{clearInterval(pollTimer)}catch(e){}location.reload();}
function updateAcct(){
  const el=document.getElementById('acctChip');if(!el)return;
  if(currentUser){el.style.display='';el.innerHTML='👤 '+esc(currentUser.email)+' · '+esc(currentUser.role)+' · <a onclick="doLogout()" style="text-decoration:underline;cursor:pointer">Выйти</a>';}
  else el.style.display='none';
}
