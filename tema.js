// Palet warna (dipakai semua halaman simulator), ukuran iframe, dan penanda frame
(function(){
var PAL=window.PAL={
 laut:{n:"Laut",acc:"#0e7c86",g1:"#0e7c86",g2:"#2bb5bd",v:"#2563eb",m:"#dc2626",nn:"#16834a"},
 senja:{n:"Senja",acc:"#c2410c",g1:"#ea580c",g2:"#f59e0b",v:"#7c3aed",m:"#e11d48",nn:"#0d9488"},
 lembayung:{n:"Lembayung",acc:"#6d28d9",g1:"#7c3aed",g2:"#a78bfa",v:"#2563eb",m:"#db2777",nn:"#059669"},
 aman:{n:"Ramah buta warna",acc:"#0072b2",g1:"#0072b2",g2:"#56b4e9",v:"#0072b2",m:"#d55e00",nn:"#009e73"}};
window.setPalette=function(k){var p=PAL[k]||PAL.laut,s=document.documentElement.style;
 s.setProperty("--acc",p.acc);s.setProperty("--acc2",p.g2);s.setProperty("--g1",p.g1);s.setProperty("--g2",p.g2);s.setProperty("--accfg","#fff");s.setProperty("--glow",p.acc+"40");
 s.setProperty("--v",p.v);s.setProperty("--m",p.m);s.setProperty("--n",p.nn);
 window.curPal=PAL[k]?k:"laut";try{localStorage.setItem("anstru_pal",window.curPal)}catch(e){}
 window.dispatchEvent(new Event("anstru-pal"))};
var k="laut";try{k=localStorage.getItem("anstru_pal")||"laut"}catch(e){}
window.setPalette(k);
if(parent===window)return;document.documentElement.classList.add("in-frame");
var f=function(){var h=Math.ceil(document.body.getBoundingClientRect().height);if(h>0)parent.postMessage({anstru:1,h:h},"*")};
addEventListener("load",f);addEventListener("resize",f);if(window.ResizeObserver)new ResizeObserver(f).observe(document.body);setInterval(f,1000)})();
