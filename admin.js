/* ================= ADMIN (пользователи) ================= */
async function renderAdmin(){
  const c=document.getElementById('adminBody');if(!c)return;
  if(!currentUser||currentUser.role!=='Администратор'){c.innerHTML='<div class="hint" style="padding:16px">Раздел доступен только администратору.</div>';return;}
  c.innerHTML=cardHTML('Пользователи и доступ','<div id="usersBox" class="hint">Загрузка…</div>','<button class="btn ghost sm" onclick="renderAdmin()">⟳ Обновить</button>');
  try{
    const r=await api('listUsers');const box=document.getElementById('usersBox');if(!box)return;
    if(!r||!r.ok){box.innerHTML='<div class="hint">Не удалось загрузить список ('+esc((r&&r.error)||'сеть')+').</div>';return;}
    const roles=Object.keys(ROLES);
    const rows=(r.users||[]).map(u=>{
      const self=currentUser.email.toLowerCase()===String(u.email).toLowerCase();
      const stColor={active:'var(--good)',pending:'#c98a00',blocked:'var(--danger)'}[u.status]||'';
      return `<tr>
        <td><b>${esc(u.email)}</b>${self?' <span class="hint">(вы)</span>':''}</td>
        <td>${esc(u.name||'')}</td>
        <td><select ${self?'disabled':''} onchange="adminSetRole('${esc(u.email)}',this.value)">${roles.map(x=>`<option ${u.role===x?'selected':''}>${esc(x)}</option>`).join('')}</select></td>
        <td><select ${self?'disabled':''} onchange="adminSetStatus('${esc(u.email)}',this.value)" style="color:${stColor};font-weight:600">${['pending','active','blocked'].map(s=>`<option ${u.status===s?'selected':''}>${s}</option>`).join('')}</select></td>
        <td>${self?'':`<button class="btn danger sm" onclick="adminDelUser('${esc(u.email)}')">🗑</button>`}</td>
      </tr>`;}).join('');
    box.innerHTML=`<div class="table-wrap"><table><thead><tr><th>Email</th><th>Имя</th><th>Роль</th><th>Статус</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="5" class="hint" style="padding:14px">Пользователей нет.</td></tr>'}</tbody></table></div>
      <p class="hint">Статус <b>pending</b> — новый, доступа к данным нет; <b>active</b> — работает по своей роли; <b>blocked</b> — вход запрещён. Редакторские роли (Администратор, Финансист, Кадровик, МОЛ) могут менять данные; Руководитель и Наблюдатель — только просмотр. Права проверяются на сервере при каждом действии — переключить их в браузере невозможно.</p>`;
  }catch(e){const box=document.getElementById('usersBox');if(box)box.innerHTML='<div class="hint">Ошибка сети.</div>';}
}
async function adminSetRole(email,role){const r=await api('setRole',{email,role});toast(r&&r.ok?'Роль обновлена':authErr(r&&r.error));renderAdmin();}
async function adminSetStatus(email,status){const r=await api('setStatus',{email,status});toast(r&&r.ok?'Статус обновлён':authErr(r&&r.error));renderAdmin();}
async function adminDelUser(email){if(!confirm('Удалить пользователя '+email+'?'))return;const r=await api('deleteUser',{email});toast(r&&r.ok?'Пользователь удалён':authErr(r&&r.error));renderAdmin();}
