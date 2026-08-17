/* ================= TREE ================= */
function renderTree(){
  const root=document.getElementById('treeRoot');root.innerHTML='';
  const roots=rootUnits();
  if(!roots.length){root.innerHTML='<div class="empty-state"><div class="big">🗂</div>Пока нет подразделений.<br><br><button class="btn" onclick="openUnitModal()">＋ Добавить первое</button></div>';return}
  roots.forEach(u=>root.appendChild(treeNode(u)));
}
function treeNode(u){
  const li=document.createElement('li');if(collapsed.has(u.id))li.classList.add('collapsed');
  const kids=childrenOf(u.id);const node=document.createElement('div');node.className='node';
  const caret=kids.length?`<span class="caret" onclick="toggleCollapse('${u.id}')">${collapsed.has(u.id)?'▶':'▼'}</span>`:'<span class="caret empty">•</span>';
  node.innerHTML=`${caret}<span class="name">${esc(u.name)}</span><span class="type-badge">${esc(u.type||'')}</span>
    <span class="metrics"><span>👥 <b>${rollupCount(u.id)}</b></span><span>· ставок <b>${rollupRate(u.id).toLocaleString('ru-RU')}</b></span><span>· <b>${money(rollupPayroll(u.id))}</b>/мес</span></span>
    <span class="acts">
      <button title="Добавить сотрудника" onclick="openEmpModal(null,'${u.id}')">👤+</button>
      <button title="Добавить дочернее" onclick="openUnitModal(null,'${u.id}')">＋</button>
      <button title="Редактировать" onclick="openUnitModal('${u.id}')">✎</button>
      <button class="del" title="Удалить" onclick="deleteUnit('${u.id}')">🗑</button></span>`;
  li.appendChild(node);
  if(kids.length){const ul=document.createElement('ul');kids.forEach(c=>ul.appendChild(treeNode(c)));li.appendChild(ul)}
  return li;
}
function toggleCollapse(id){collapsed.has(id)?collapsed.delete(id):collapsed.add(id);renderTree()}
function expandAll(expand){collapsed=new Set();if(!expand)state.units.forEach(u=>{if(childrenOf(u.id).length)collapsed.add(u.id)});renderTree()}
