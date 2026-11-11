/* Tombol "Pasang aplikasi" (PWA): Android/Chrome/Edge langsung, iPhone lewat petunjuk Bagikan → Layar Utama */
(function(){
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
if(matchMedia('(display-mode: standalone)').matches||navigator.standalone)return;
let ev=null;const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
const b=document.createElement('button');b.type='button';b.textContent='📲 Pasang aplikasi';b.hidden=true;
b.style.cssText='position:fixed;right:14px;bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:50;padding:10px 16px;border:0;border-radius:999px;background:#0f766e;color:#fff;font:600 14px system-ui,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.3);cursor:pointer';
b.onclick=async()=>{if(ev){ev.prompt();await ev.userChoice;ev=null;b.hidden=true}
  else alert(ios?'Di iPhone/iPad: ketuk tombol Bagikan (kotak dengan panah ke atas) di Safari, lalu pilih "Tambah ke Layar Utama".':'Buka menu browser (⋮) lalu pilih "Instal aplikasi" atau "Tambahkan ke layar utama".')};
addEventListener('beforeinstallprompt',e=>{e.preventDefault();ev=e;b.hidden=false});
addEventListener('appinstalled',()=>b.hidden=true);
document.addEventListener('DOMContentLoaded',()=>{document.body.appendChild(b);if(ios)b.hidden=false;else setTimeout(()=>{if(!ev)b.hidden=false},2500)});
})();
