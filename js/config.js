/* ================= CONFIG ================= */
/* Вставьте сюда URL веб-приложения Apps Script (…/exec). Он НЕ секретный — защита через вход.
   Пока стоит заглушка, приложение работает локально (без входа) только в этом браузере. */
const BACKEND_URL = "https://script.google.com/macros/s/AKfycbyI182BjehArv6q11TXZJQg5HmzDwnEKw9W3nMDc7Dg6t86S5PFxL9p5YshJSC6ENhYUA/exec";
function backendReady(){ return typeof BACKEND_URL==='string' && BACKEND_URL.indexOf('http')===0 && BACKEND_URL.indexOf('PASTE')<0; }
