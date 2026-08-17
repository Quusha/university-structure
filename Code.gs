/**
 * Бэкенд для «Конструктора структуры университета».
 * Хранит все данные приложения (JSON) в этой же Google-таблице и работает как API (GET/POST).
 *
 * НАСТРОЙКА (один раз):
 *  1) Создайте новую Google-таблицу → Расширения → Apps Script.
 *  2) Вставьте этот код, сохраните.
 *  3) Задайте секретный ключ: Настройки проекта (шестерёнка слева) → «Свойства сценария»
 *     (Script Properties) → добавьте свойство:  ключ = API_KEY,  значение = ваш длинный секрет.
 *     (Либо запустите один раз функцию setupKey ниже, вписав туда секрет.)
 *  4) Развернуть → Новое развёртывание → тип «Веб-приложение»:
 *        - Запуск от имени: Я (владелец таблицы);
 *        - У кого есть доступ: Все (Anyone).  ← нужно, чтобы сайт с GitHub Pages мог обращаться по fetch.
 *     Скопируйте URL вида .../exec — его вставите в приложении (кнопка «Синхронизация»).
 *
 * БЕЗОПАСНОСТЬ: «Все» = URL технически доступен любому, НО каждая операция требует секретный ключ,
 * которого нет в публичном коде сайта (он хранится только на ваших ноутбуках). Сама таблица приватна.
 * После изменения кода делайте «Управление развёртываниями → редактировать → Новая версия»,
 * чтобы URL не менялся.
 */

var META = '_META';   // A1 = номер версии (rev), A2 = дата
var DB   = '_DB';     // JSON, разбитый на части по столбцу A
var CHUNK = 40000;    // предел ячейки Google Sheets — 50 000 символов

function doGet(e){ return route(e, (e && e.parameter) ? e.parameter : {}); }
function doPost(e){
  var p = {};
  try { p = JSON.parse(e.postData.contents); }
  catch (err) { p = (e && e.parameter) ? e.parameter : {}; }
  return route(e, p);
}

function route(e, p){
  var action = p.action || 'get';
  if (!keyOk(p.key)) return out({ ok:false, error:'unauthorized' });
  if (action === 'ping') return out({ ok:true, rev:getRev() });
  if (action === 'get')  return out({ ok:true, rev:getRev(), data:getData() });
  if (action === 'save') return out(saveData(p));
  return out({ ok:false, error:'unknown_action' });
}

function keyOk(k){
  var real = PropertiesService.getScriptProperties().getProperty('API_KEY');
  return !!real && !!k && String(k) === String(real);
}
function out(obj){
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function ss(){ return SpreadsheetApp.getActiveSpreadsheet(); }
function sheet(name){ var s = ss().getSheetByName(name); if (!s) s = ss().insertSheet(name); return s; }

function getRev(){
  var v = sheet(META).getRange('A1').getValue();
  return v ? Number(v) : 0;
}
function setRev(r){
  var m = sheet(META);
  m.getRange('A1').setValue(r);
  m.getRange('A2').setValue(new Date());
}

function getData(){
  var d = sheet(DB), last = d.getLastRow();
  if (last < 1) return { units:[], employees:[], accruals:[], settings:{} };
  var vals = d.getRange(1, 1, last, 1).getValues(), s = '';
  for (var i = 0; i < vals.length; i++) s += (vals[i][0] || '');
  if (!s) return { units:[], employees:[], accruals:[], settings:{} };
  try { return JSON.parse(s); }
  catch (err) { return { units:[], employees:[], accruals:[], settings:{} }; }
}
function writeBlob(json){
  var d = sheet(DB);
  d.clearContents();
  var chunks = [];
  for (var i = 0; i < json.length; i += CHUNK) chunks.push([ json.substring(i, i + CHUNK) ]);
  if (chunks.length) d.getRange(1, 1, chunks.length, 1).setValues(chunks);
}

function saveData(p){
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);                       // не даём двум ноутбукам писать одновременно
  try {
    var cur = getRev();
    if (!p.force && String(p.rev) !== String(cur)) {
      // клиент опирался на устаревшую версию → конфликт, отдаём актуальные данные
      return { ok:false, conflict:true, rev:cur, data:getData() };
    }
    var data = p.data || {};
    writeBlob(JSON.stringify(data));
    var nr = cur + 1;
    setRev(nr);
    try { mirror(data); } catch (e) {}         // читаемые копии для анализа в таблице
    return { ok:true, rev:nr };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Односторонние читаемые копии на листах «Подразделения» и «Сотрудники».
 * Перезаписываются при каждом сохранении — правьте данные в приложении, не здесь.
 */
function mirror(data){
  var units = data.units || [], emps = data.employees || [];
  var byId = {}; units.forEach(function(u){ byId[u.id] = u; });
  function path(id){ var n=[], c=byId[id], g=0; while(c && g++<60){ n.unshift(c.name); c = c.parentId ? byId[c.parentId] : null; } return n.join(' › '); }
  function lvl(id){ var d=0, c=byId[id]; while(c && c.parentId && byId[c.parentId]){ d++; c = byId[c.parentId]; } return d+1; }

  var su = sheet('Подразделения'); su.clearContents();
  var rowsU = [['Наименование','Тип','Вышестоящее','Уровень']];
  units.forEach(function(u){
    rowsU.push([ u.name, u.type || '', (u.parentId && byId[u.parentId]) ? byId[u.parentId].name : '', lvl(u.id) ]);
  });
  su.getRange(1,1,rowsU.length,4).setValues(rowsU);
  su.getRange(1,1,1,4).setFontWeight('bold');

  var se = sheet('Сотрудники'); se.clearContents();
  var rowsE = [['ФИО','Должность','Подразделение','Оклад','Ставка','Доплаты','Основания доплат','Начислено']];
  emps.forEach(function(e){
    var supp = e.supplements || [];
    var sTotal = supp.reduce(function(s,x){ return s + (+x.amount || 0); }, 0);
    var reasons = supp.map(function(x){ return x.reason + (x.reason==='Другое' && x.note ? ' ('+x.note+')' : '') + ' +' + (+x.amount||0); }).join('; ');
    var accrued = (+e.oklad||0) * (+e.rate||0) + sTotal;
    rowsE.push([ e.name, e.position, path(e.unitId), +e.oklad||0, +e.rate||0, sTotal, reasons, accrued ]);
  });
  se.getRange(1,1,rowsE.length,8).setValues(rowsE);
  se.getRange(1,1,1,8).setFontWeight('bold');
}

/** Необязательно: задать ключ прямо из редактора (запустите один раз, потом удалите секрет). */
function setupKey(){
  PropertiesService.getScriptProperties().setProperty('API_KEY', 'ЗАМЕНИТЕ-НА-ДЛИННЫЙ-СЕКРЕТ');
}
