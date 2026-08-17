/* ================= CONFIG ================= */
/* Вставьте сюда URL веб-приложения Apps Script (…/exec). Он НЕ секретный — защита через вход.
   Пока стоит заглушка, приложение работает локально (без входа) только в этом браузере. */
const BACKEND_URL = "PASTE_APPS_SCRIPT_EXEC_URL_HERE";
function backendReady(){ return typeof BACKEND_URL==='string' && BACKEND_URL.indexOf('http')===0 && BACKEND_URL.indexOf('PASTE')<0; }
