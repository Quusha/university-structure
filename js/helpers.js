/* ================= HELPERS ================= */
const unitById=id=>state.units.find(u=>u.id===id);
const childrenOf=id=>state.units.filter(u=>u.parentId===id);
const rootUnits=()=>state.units.filter(u=>!u.parentId||!unitById(u.parentId));
const directEmps=id=>state.employees.filter(e=>e.unitId===id);

function descendants(id){let out=[];childrenOf(id).forEach(c=>{out.push(c.id);out=out.concat(descendants(c.id))});return out}
function levelOf(id){let d=0,c=unitById(id);while(c&&c.parentId&&unitById(c.parentId)){d++;c=unitById(c.parentId)}return d}
function supTotal(e){return (e.supplements||[]).reduce((s,x)=>s+(+x.amount||0),0)}
function empBase(e){return (+e.oklad||0)*(+e.rate||0)}
function empAccrued(e){return empBase(e)+supTotal(e)}
function directPayroll(id){return directEmps(id).reduce((s,e)=>s+empAccrued(e),0)}
function directRate(id){return directEmps(id).reduce((s,e)=>s+(+e.rate||0),0)}
function rollupPayroll(id){return directPayroll(id)+childrenOf(id).reduce((s,c)=>s+rollupPayroll(c.id),0)}
function rollupRate(id){return directRate(id)+childrenOf(id).reduce((s,c)=>s+rollupRate(c.id),0)}
function rollupCount(id){return directEmps(id).length+childrenOf(id).reduce((s,c)=>s+rollupCount(c.id),0)}

function monthlyPayroll(){return state.employees.reduce((s,e)=>s+empAccrued(e),0)}

function fmt(n){return Math.round(n||0).toLocaleString('ru-RU')}
function money(n){return fmt(n)+' ₸'}
function esc(s){return (s==null?'':String(s)).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2200)}

/* ================= PERIOD ================= */
function periodMonths(){
  const p=state.settings.period;
  if(p==='half')return 6; if(p==='year')return 12;
  if(p==='all'){const s=new Date(state.settings.startDate),n=new Date();
    let m=(n.getFullYear()-s.getFullYear())*12+(n.getMonth()-s.getMonth())+1;return Math.max(1,m)}
  return 1;
}
function periodLabel(){const p=state.settings.period;
  return p==='month'?'за месяц':p==='half'?'за полугодие':p==='year'?'за год':'за всё время ('+periodMonths()+' мес.)'}
function periodBarHTML(){
  const p=state.settings.period;
  const btn=(v,l)=>`<button class="btn ${p===v?'':'ghost'} sm" onclick="setPeriod('${v}')">${l}</button>`;
  let h=btn('month','Месяц')+btn('half','Полугодие')+btn('year','Год')+btn('all','Всё время');
  if(p==='all')h+=`<label class="hint" style="display:flex;align-items:center;gap:6px;margin-left:8px">с даты: <input type="date" value="${state.settings.startDate}" onchange="setStart(this.value)" style="padding:6px 8px;border:1px solid var(--line);border-radius:8px"></label>`;
  h+=`<span class="pill" style="margin-left:8px">${periodMonths()} мес.</span>`;
  return h;
}
function setPeriod(v){state.settings.period=v;save();renderAccruals();renderAnalytics()}
function setStart(v){state.settings.startDate=v;save();renderAccruals();renderAnalytics()}

