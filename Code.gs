/**
 * Бэкенд «Панель управления университетом» с авторизацией.
 * Хранит данные приложения (JSON) в этой же таблице и работает как API (POST/GET).
 * Проверка личности и прав — на СЕРВЕРЕ: подделать роль в браузере нельзя.
 *
 * НАСТРОЙКА (один раз):
 *  1) Таблица → Расширения → Apps Script → вставьте этот код, сохраните.
 *  2) Запустите функцию setup() один раз (кнопка ▶) — сгенерирует TOKEN_SECRET и лист пользователей.
 *  3) Настройки проекта → Свойства сценария → задайте:
 *       ADMIN_EMAIL = ваш email (под которым зарегистрируетесь) — станете администратором;
 *       INVITE_CODE = (необязательно) код-приглашение: если задан, без него регистрация запрещена.
 *  4) Развернуть → Новое развёртывание → «Веб-приложение»: Запуск от имени: Я; Доступ: Все.
 *       Скопируйте URL …/exec и вставьте в config.js сайта (BACKEND_URL). URL не секретный.
 *  При изменении кода: «Управление развёртываниями → редактировать → Новая версия» (URL не меняется).
 */

var META='_META', DB='_DB', USERS='_USERS', CHUNK=40000;
var ALL_ROLES=['Администратор','Финансист','Кадровик','МОЛ (имущество)','Руководитель','Наблюдатель'];
var EDITOR_ROLES={'Администратор':1,'Финансист':1,'Кадровик':1,'МОЛ (имущество)':1};
var TOKEN_TTL_MS=12*60*60*1000;

function doGet(e){ return route((e&&e.parameter)?e.parameter:{}); }
function doPost(e){ var p={}; try{ p=JSON.parse(e.postData.contents); }catch(err){ p=(e&&e.parameter)?e.parameter:{}; } return route(p); }

function route(p){
  var a=p.action||'ping';
  try{
    if(a==='ping')     return out({ok:true, rev:getRev()});
    if(a==='register') return out(doRegister(p));
    if(a==='login')    return out(doLogin(p));
    var u=authUser(p.token);
    if(!u) return out({ok:false, error:'unauthorized'});
    if(a==='me')   return out({ok:true, user:pub(u)});
    if(a==='get'){
      if(u.status!=='active') return out({ok:false, error:'pending', user:pub(u)});
      return out({ok:true, rev:getRev(), data:getData(), user:pub(u)});
    }
    if(a==='save'){
      if(u.status!=='active'||!EDITOR_ROLES[u.role]) return out({ok:false, error:'forbidden'});
      return out(saveData(p));
    }
    if(u.role!=='Администратор') return out({ok:false, error:'forbidden'});
    if(a==='listUsers')  return out({ok:true, users:listUsers()});
    if(a==='setRole')    return out(adminSetRole(u,p));
    if(a==='setStatus')  return out(adminSetStatus(u,p));
    if(a==='deleteUser') return out(adminDeleteUser(u,p));
    return out({ok:false, error:'unknown_action'});
  }catch(err){ return out({ok:false, error:String(err)}); }
}

function out(obj){ return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function prop(k){ return PropertiesService.getScriptProperties().getProperty(k); }
function setProp(k,v){ PropertiesService.getScriptProperties().setProperty(k,v); }

function secret(){ var s=prop('TOKEN_SECRET'); if(!s){ s=Utilities.getUuid()+Utilities.getUuid(); setProp('TOKEN_SECRET',s); } return s; }
function hex(bytes){ var s=''; for(var i=0;i<bytes.length;i++){ var b=(bytes[i]+256)%256; s+=(b<16?'0':'')+b.toString(16); } return s; }
function sha256(str){ return hex(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str)); }
function hmac(str){ return hex(Utilities.computeHmacSha256Signature(str, secret())); }
function hashPassword(salt, pw){ return sha256(salt+':'+pw); }
function makeToken(email){ var payload=Utilities.base64EncodeWebSafe(email+'|'+(Date.now()+TOKEN_TTL_MS)); return payload+'.'+hmac(payload); }
function authUser(token){
  if(!token||String(token).indexOf('.')<0) return null;
  var parts=String(token).split('.'), payload=parts[0], sig=parts[1];
  if(hmac(payload)!==sig) return null;
  var raw; try{ raw=Utilities.newBlob(Utilities.base64DecodeWebSafe(payload)).getDataAsString(); }catch(e){ return null; }
  var bits=raw.split('|'), email=bits[0], exp=+bits[1];
  if(!email||!exp||Date.now()>exp) return null;
  var u=findUser(email);
  if(!u||u.status==='blocked') return null;
  return u;
}

function usersSheet(){
  var s=ss().getSheetByName(USERS);
  if(!s){ s=ss().insertSheet(USERS); s.getRange(1,1,1,7).setValues([['email','name','salt','hash','role','status','createdAt']]).setFontWeight('bold'); }
  return s;
}
function findUser(email){
  email=String(email||'').trim().toLowerCase();
  var s=usersSheet(), last=s.getLastRow(); if(last<2) return null;
  var v=s.getRange(2,1,last-1,7).getValues();
  for(var i=0;i<v.length;i++){
    if(String(v[i][0]).trim().toLowerCase()===email)
      return {row:i+2, email:v[i][0], name:v[i][1], salt:v[i][2], hash:v[i][3], role:v[i][4], status:v[i][5], createdAt:v[i][6]};
  }
  return null;
}
function listUsers(){
  var s=usersSheet(), last=s.getLastRow(); if(last<2) return [];
  return s.getRange(2,1,last-1,7).getValues().map(function(r){ return {email:r[0], name:r[1], role:r[4], status:r[5], createdAt:r[6]}; });
}
function pub(u){ return {email:u.email, name:u.name, role:u.role, status:u.status}; }

function doRegister(p){
  var email=String(p.email||'').trim().toLowerCase(), name=String(p.name||'').trim(), pw=String(p.password||'');
  if(!email||email.indexOf('@')<1) return {ok:false, error:'bad_email'};
  if(pw.length<6) return {ok:false, error:'weak_password'};
  var invite=prop('INVITE_CODE');
  if(invite && String(p.invite||'')!==invite) return {ok:false, error:'bad_invite'};
  if(findUser(email)) return {ok:false, error:'exists'};
  var adminEmail=String(prop('ADMIN_EMAIL')||'').trim().toLowerCase();
  var role='Наблюдатель', status='pending';
  if(adminEmail && email===adminEmail){ role='Администратор'; status='active'; }
  var salt=Utilities.getUuid();
  usersSheet().appendRow([email, name, salt, hashPassword(salt,pw), role, status, new Date()]);
  return {ok:true, pending:status!=='active'};
}
function doLogin(p){
  var email=String(p.email||'').trim().toLowerCase(), pw=String(p.password||'');
  var u=findUser(email);
  if(!u) return {ok:false, error:'no_user'};
  if(u.status==='blocked') return {ok:false, error:'blocked'};
  if(hashPassword(u.salt,pw)!==u.hash) return {ok:false, error:'bad_credentials'};
  return {ok:true, token:makeToken(u.email), user:pub(u)};
}
function adminSetRole(admin,p){
  var u=findUser(p.email); if(!u) return {ok:false,error:'no_user'};
  if(ALL_ROLES.indexOf(p.role)<0) return {ok:false,error:'bad_role'};
  if(String(u.email).toLowerCase()===String(admin.email).toLowerCase() && p.role!=='Администратор') return {ok:false, error:'self_lock'};
  usersSheet().getRange(u.row,5).setValue(p.role); return {ok:true};
}
function adminSetStatus(admin,p){
  var u=findUser(p.email); if(!u) return {ok:false,error:'no_user'};
  if(['pending','active','blocked'].indexOf(p.status)<0) return {ok:false,error:'bad_status'};
  if(String(u.email).toLowerCase()===String(admin.email).toLowerCase() && p.status!=='active') return {ok:false, error:'self_lock'};
  usersSheet().getRange(u.row,6).setValue(p.status); return {ok:true};
}
function adminDeleteUser(admin,p){
  var u=findUser(p.email); if(!u) return {ok:false,error:'no_user'};
  if(String(u.email).toLowerCase()===String(admin.email).toLowerCase()) return {ok:false,error:'self_lock'};
  usersSheet().deleteRow(u.row); return {ok:true};
}

function ss(){ return SpreadsheetApp.getActiveSpreadsheet(); }
function sheet(name){ var s=ss().getSheetByName(name); if(!s) s=ss().insertSheet(name); return s; }
function getRev(){ var v=sheet(META).getRange('A1').getValue(); return v?Number(v):0; }
function setRev(r){ var m=sheet(META); m.getRange('A1').setValue(r); m.getRange('A2').setValue(new Date()); }
function getData(){
  var d=sheet(DB), last=d.getLastRow();
  if(last<1) return {units:[],employees:[],accruals:[],settings:{}};
  var vals=d.getRange(1,1,last,1).getValues(), s='';
  for(var i=0;i<vals.length;i++) s+=(vals[i][0]||'');
  if(!s) return {units:[],employees:[],accruals:[],settings:{}};
  try{ return JSON.parse(s); }catch(err){ return {units:[],employees:[],accruals:[],settings:{}}; }
}
function writeBlob(json){
  var d=sheet(DB); d.clearContents();
  var chunks=[]; for(var i=0;i<json.length;i+=CHUNK) chunks.push([json.substring(i,i+CHUNK)]);
  if(chunks.length) d.getRange(1,1,chunks.length,1).setValues(chunks);
}
function saveData(p){
  var lock=LockService.getScriptLock(); lock.waitLock(20000);
  try{
    var cur=getRev();
    if(!p.force && String(p.rev)!==String(cur)) return {ok:false, conflict:true, rev:cur, data:getData()};
    var data=p.data||{};
    writeBlob(JSON.stringify(data));
    var nr=cur+1; setRev(nr);
    try{ mirror(data); }catch(e){}
    return {ok:true, rev:nr};
  }finally{ lock.releaseLock(); }
}
function mirror(data){
  var units=data.units||[], emps=data.employees||[];
  var byId={}; units.forEach(function(u){ byId[u.id]=u; });
  function path(id){ var n=[],c=byId[id],g=0; while(c&&g++<60){ n.unshift(c.name); c=c.parentId?byId[c.parentId]:null; } return n.join(' › '); }
  function lvl(id){ var d=0,c=byId[id]; while(c&&c.parentId&&byId[c.parentId]){ d++; c=byId[c.parentId]; } return d+1; }
  var su=sheet('Подразделения'); su.clearContents();
  var rowsU=[['Наименование','Тип','Вышестоящее','Уровень']];
  units.forEach(function(u){ rowsU.push([u.name,u.type||'',(u.parentId&&byId[u.parentId])?byId[u.parentId].name:'',lvl(u.id)]); });
  su.getRange(1,1,rowsU.length,4).setValues(rowsU); su.getRange(1,1,1,4).setFontWeight('bold');
  var se=sheet('Сотрудники'); se.clearContents();
  var rowsE=[['ФИО','Должность','Подразделение','Оклад','Ставка','Доплаты','Основания доплат','Начислено']];
  emps.forEach(function(e){
    var supp=e.supplements||[], sTotal=supp.reduce(function(s,x){return s+(+x.amount||0);},0);
    var reasons=supp.map(function(x){return x.reason+(x.reason==='Другое'&&x.note?' ('+x.note+')':'')+' +'+(+x.amount||0);}).join('; ');
    rowsE.push([e.name,e.position,path(e.unitId),+e.oklad||0,+e.rate||0,sTotal,reasons,(+e.oklad||0)*(+e.rate||0)+sTotal]);
  });
  se.getRange(1,1,rowsE.length,8).setValues(rowsE); se.getRange(1,1,1,8).setFontWeight('bold');
}

function setup(){ secret(); if(prop('ADMIN_EMAIL')===null) setProp('ADMIN_EMAIL',''); usersSheet(); Logger.log('Готово. Задайте ADMIN_EMAIL (и по желанию INVITE_CODE) в Свойствах сценария.'); }
