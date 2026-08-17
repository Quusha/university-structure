/* ================= CONFIG ================= */
/* Вставьте сюда URL веб-приложения Apps Script (…/exec). Он НЕ секретный — защита через вход.
   Пока стоит заглушка, приложение работает локально (без входа) только в этом браузере. */
const BACKEND_URL = "https://script.google.com/macros/s/AKfycbyNpL3-qrwwoGzlDW7nTW9WPfzFcZit2ZfbrDhzpGpCdTQE2XPT7BjSDsHgD5k-37vNOA/exec";
function backendReady(){ return typeof BACKEND_URL==='string' && BACKEND_URL.indexOf('http')===0 && BACKEND_URL.indexOf('PASTE')<0; }
