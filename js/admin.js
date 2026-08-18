/* ================= ADMIN (пользователи) ================= */
async function renderAdmin(){
  const c=document.getElementById('adminBody');if(!c)return;
  if(!currentUser||currentUser.role!=='Администратор'){c.innerHTML='<div class="admin-msg">Раздел доступен только администратору.</div>';return;}
  c.innerHTML=cardHTML('Пользователи и доступ','<div id="usersBox"><div class="admin-msg">Загрузка…</div></div>','<button class="btn ghost sm" onclick="renderAdmin()">⟳ Обновить</button>');
  try{
    const r=await api('listUsers');const box=document.getElementById('usersBox');if(!box)return;
    if(!r||!r.ok){box.innerHTML='<div class="admin-msg">Не удалось загрузить список ('+esc((r&&r.error)||'сеть')+').</div>';return;}
    const roles=Object.keys(ROLES);
    const rank={pending:0,active:1,blocked:2};
    const users=(r.users||[]).slice().sort((a,b)=>(rank[a.status]??9)-(rank[b.status]??9)||String(a.email).localeCompare(String(b.email)));
    if(!users.length){box.innerHTML='<div class="admin-msg">Пользователей пока нет.</div>';return;}
    const pend=users.filter(u=>u.status==='pending').length;
    box.innerHTML=`
      ${pend?`<div class="admin-banner">На подтверждении: <b>${pend}</b> — назначьте роль и переведите в «active».</div>`:''}
      <div class="usr-list">
        <div class="usr-head"><div>Пользователь</div><div>Роль</div><div>Статус</div><div></div></div>
        ${users.map(u=>{
          const self=currentUser.email.toLowerCase()===String(u.email).toLowerCase();
          return `<div class="usr-row">
            <div class="usr-id">
              <div class="usr-email">${esc(u.email)}${self?' <span class="usr-you">вы</span>':''}</div>
              <div class="usr-name">${esc(u.name||'—')}</div>
            </div>
            <div><select class="usr-sel" ${self?'disabled':''} onchange="adminSetRole('${esc(u.email)}',this.value)">${roles.map(x=>`<option ${u.role===x?'selected':''}>${esc(x)}</option>`).join('')}</select></div>
            <div><select class="usr-sel usr-st-${esc(u.status)}" ${self?'disabled':''} onchange="adminSetStatus('${esc(u.email)}',this.value)">${['pending','active','blocked'].map(s=>`<option ${u.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
            <div class="usr-act">${self?'':`<button class="usr-del" onclick="adminDelUser('${esc(u.email)}')" title="Удалить">🗑</button>`}</div>
          </div>`;}).join('')}
      </div>
      <p class="usr-note"><b>pending</b> — новый, доступа к данным нет · <b>active</b> — работает по своей роли · <b>blocked</b> — вход запрещён.<br>Редакторские роли (Администратор, Финансист, Кадровик, МОЛ) меняют данные; Руководитель и Наблюдатель — только просмотр. Права проверяются на сервере — переключить их в браузере нельзя.</p>`;
  }catch(e){const box=document.getElementById('usersBox');if(box)box.innerHTML='<div class="admin-msg">Ошибка сети.</div>';}
}
async function adminSetRole(email,role){const r=await api('setRole',{email,role});toast(r&&r.ok?'Роль обновлена':authErr(r&&r.error));renderAdmin();}
async function adminSetStatus(email,status){const r=await api('setStatus',{email,status});toast(r&&r.ok?'Статус обновлён':authErr(r&&r.error));renderAdmin();}
async function adminDelUser(email){if(!confirm('Удалить пользователя '+email+'?'))return;const r=await api('deleteUser',{email});toast(r&&r.ok?'Пользователь удалён':authErr(r&&r.error));renderAdmin();}
