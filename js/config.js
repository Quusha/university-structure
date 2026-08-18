/* ================= CONFIG =================
   URL веб-приложения Apps Script (…/exec). Он НЕ секретный — защита через вход.
   Уже вписан ваш адрес. Если поменяете развёртывание — вставьте новый в кавычки ниже. */
const BACKEND_URL_RAW = "https://script.google.com/macros/s/AKfycbyI182BjehArv6q11TXZJQg5HmzDwnEKw9W3nMDc7Dg6t86S5PFxL9p5YshJSC6ENhYUA/exec";

/* дальше менять не нужно — код сам уберёт случайные пробелы/кавычки/скобки */
const BACKEND_URL = (typeof BACKEND_URL_RAW === 'string' ? BACKEND_URL_RAW : '')
  .trim().replace(/^[\s"'<>]+|[\s"'<>]+$/g, '');
function backendReady(){ return /^https?:\/\//.test(BACKEND_URL) && BACKEND_URL.indexOf('PASTE') < 0; }
