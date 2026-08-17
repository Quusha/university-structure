/* ================= INIT ================= */
if(!load()){buildSeed()}
ensureShape();saveLocal();
initOrgChart();
loadSyncCfg();
renderAll();
if(syncCfg.url){setStatus('sync');cloudPull().then(()=>startPoll());}else{setStatus('none');}

