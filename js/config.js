/* ================= CONFIG ================= */
/* Вставьте сюда URL веб-приложения Apps Script (…/exec). Он НЕ секретный — защита через вход.
   Пока стоит заглушка, приложение работает локально (без входа) только в этом браузере. */
const BACKEND_URL = "https://script.google.com/macros/s/AKfycbwsvrd927PFU2jsmvVI9HFGLpVITWXPPAgAyFuZT0xovS3_SAD6fnFhcNAW-ohs5FqL_g/exec";
function backendReady(){ return typeof BACKEND_URL==='string' && BACKEND_URL.indexOf('http')===0 && BACKEND_URL.indexOf('PASTE')<0; }
