/* ================= DATA IO ================= */
function exportJSON(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='org-structure-'+new Date().toISOString().slice(0,10)+'.json';a.click();toast('Файл сохранён')}
function importJSON(ev){const f=ev.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!d.units||!d.employees)throw 0;state=d;ensureShape();collapsed=new Set();ocCollapsed=new Set();save();renderAll();toast('Данные загружены')}catch(e){toast('Некорректный файл')}};r.readAsText(f);ev.target.value=''}
function exportCSV(){
  const rows=[['ФИО','Должность','Подразделение','Оклад','Ставка','Доплаты','Основания доплат','Начислено']];
  state.employees.forEach(e=>rows.push([e.name,e.position,unitPath(e.unitId),e.oklad,e.rate,supTotal(e),suppSummary(e),empAccrued(e)]));
  const csv='\uFEFF'+rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(';')).join('\n');
  const blob=new Blob([csv],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='employees.csv';a.click();toast('CSV выгружен');
}
function clearAll(){if(!confirm('Удалить ВСЕ подразделения и сотрудников? Сделайте экспорт для резервной копии.'))return;state={units:[],employees:[],accruals:defaultAccruals(),settings:{period:state.settings.period,startDate:state.settings.startDate}};collapsed=new Set();ocCollapsed=new Set();ensureShape();save();renderAll();toast('Очищено')}

