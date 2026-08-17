/* ================= TABS ================= */
document.querySelectorAll('#tabs button').forEach(b=>{
  b.onclick=()=>{
    document.querySelectorAll('#tabs button').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    document.getElementById('tab-'+b.dataset.tab).classList.add('active');
    renderAll();
    const t=b.dataset.tab;
    if(t==='orgchart')setTimeout(ocFit,50);
    if(t==='calc')renderCalc();
    if(t==='tariff')renderTariff();
    if(t==='settings')renderSettings();
    if(t==='admin')renderAdmin();
  };
});
