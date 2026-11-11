"use strict";
// Dipakai portal.html dan pelengkung.html (data-mode di <body>)
const $=id=>document.getElementById(id),MODE=document.body.dataset.mode,ARCH=MODE==="arch";
const S={L:ARCH?15:6,h:ARCH?7.5:4,q:2.3,P:45,a:3,F:ARCH?0:4,z:2,geom:"circle",spd:2,yaw:0,zoom:1,tilt:.22,auto:false};
const SPEC=[["L","Panjang bentang","m",3,40,.5],["h",ARCH?"Tinggi puncak f":"Tinggi kolom h","m",1,20,.5],["q","Beban merata q","kN/m",0,40,.1],["P","Beban titik P (bergerak)","kN",0,300,1],["a","Posisi P dari A","m",0,40,.05]].concat(ARCH?[]:[["F","Gaya horizontal F","kN",0,100,.5],["z","Tinggi kerja F","m",0,20,.5]]).concat([["spd","Kecepatan","m/s",.5,8,.5],["yaw","Sudut pandang 3D","°",-70,70,1]]);
const CAMS=[[0,.22],[35,.22],[68,.22],[20,.8]];
const show={V:true,M:true,N:false};let running=true,prev=null;
const fmt=n=>(Math.abs(n)<1e-8?0:n).toFixed(2).replace(".",",");
function solve(){
 const {L,h,q,P,a,F,z}=S,W=q*L+P,By=(q*L*L/2+P*a+F*z)/L,Ay=W-By;
 const H=ARCH?(Ay*L/2-q*L*L/8-P*Math.max(0,L/2-a))/h:F;
 const geom=x=>{if(!ARCH)return[h,0];if(S.geom==="parabola")return[4*h*x*(L-x)/(L*L),4*h*(L-2*x)/(L*L)];const R=(L*L/4+h*h)/(2*h),v=Math.sqrt(Math.max(0,R*R-(x-L/2)**2));return[v-(R-h),v<1e-9?(x<L/2?1e10:-1e10):-(x-L/2)/v]};
 const sec=(x,right)=>{const[y,t]=geom(x),th=Math.atan(t),ld=right?x>=a:x>a,V0=Ay-q*x-(ld?P:0),M0=Ay*x-q*x*x/2-(ld?P*(x-a):0);
  return ARCH?{x,y,N:-H*Math.cos(th)-V0*Math.sin(th),V:V0*Math.cos(th)-H*Math.sin(th),M:M0-H*y}:{x,y:h,N:0,V:V0,M:M0+F*z}};
 const xs=[];for(let i=0;i<=120;i++)xs.push(i*L/120);xs.sort((p,r)=>p-r);
 const beam=xs.map(x=>sec(x,true));
 const members=ARCH?[beam]:[
  Array.from({length:41},(_,i)=>{const y=h*i/40;return{x:0,y,N:-Ay,V:y<z?F:0,M:F*Math.min(y,z)}}),
  beam,
  Array.from({length:41},(_,i)=>({x:L,y:h*(1-i/40),N:-By,V:0,M:0}))];
 return{Ay,By,H,W,members,geom};
}

const sb=t=>t,tbl=(h,rows)=>'<div class="vtwrap"><table class="vt"><thead><tr>'+h.map(x=>'<th>'+x+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(c=>'<td>'+c+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
function stepsHTML(r){
 const {L,h,q,P,a,F,z}=S,Ay=r.Ay,By=r.By,W=r.W,k=fmt,p=(t)=>'<p>'+t+'</p>',b=x=>'<b>'+x+'</b>';
 let o=p(b('1. Reaksi tumpuan.')+' Tumpuan A sendi (V<sub>A</sub>, H<sub>A</sub>), B '+(ARCH?'sendi (V<sub>B</sub>, H<sub>B</sub>)':'rol (V<sub>B</sub>)')+'. Resultan beban merata Q = q·L = '+k(q)+' × '+k(L)+' = '+b(k(q*L)+' kN')+' di tengah bentang.');
 o+=p('ΣM<sub>A</sub> = 0 → V<sub>B</sub>·L − Q·L/2 − P·a'+(ARCH?'':' − F·z')+' = 0 → V<sub>B</sub> = ('+k(q*L*L/2)+' + '+k(P*a)+(ARCH?'':' + '+k(F*z))+')/'+k(L)+' = '+b(k(By)+' kN ↑'));
 o+=p('ΣM<sub>B</sub> = 0 → V<sub>A</sub> = [Q·L/2 + P·(L − a)'+(ARCH?'':' − F·z')+']/L = '+b(k(Ay)+' kN ↑')+' ('+(ARCH?'bandingkan':'dicek')+' dengan ΣV di bawah).');
 o+=p('ΣV = 0 → V<sub>A</sub> + V<sub>B</sub> = Q + P → '+k(Ay)+' + '+k(By)+' = '+k(W)+' → '+(Math.abs(Ay+By-W)<.01?'✓ OK':'✗ tidak seimbang'));
 if(ARCH){
  o+=p('ΣM<sub>C</sub> = 0 (tinjau sisi kiri sendi puncak C): V<sub>A</sub>·L/2 − H·f − Q/2·L/4 − P·max(0, L/2 − a) = 0 → H = ['+k(Ay*L/2)+' − '+k(q*L*L/8)+' − '+k(P*Math.max(0,L/2-a))+']/'+k(h)+' = '+b(k(r.H)+' kN'));
  o+=p('ΣH = 0 → H<sub>A</sub> = H<sub>B</sub> = H = '+b(k(r.H)+' kN')+' (A ke kanan, B ke kiri, saling meniadakan) ✓.');
  o+=p(b('2. Gaya dalam di potongan x.')+' Misal sudut singgung busur θ (tan θ = dy/dx). Dengan V₀(x) = V<sub>A</sub> − q·x − P·[x ≥ a] dan M₀(x) = V<sub>A</sub>·x − q·x²/2 − P·(x − a)<sub>+</sub>:'+'<div class="fx">M(x) = M₀(x) − H·y(x)<br>N(x) = −H·cos θ − V₀(x)·sin θ<br>V(x) = V₀(x)·cos θ − H·sin θ</div>');
  const m=r.members[0],rows=[];for(let i=0;i<=8;i++){const pt=m[i*15],g=r.geom(pt.x);rows.push([k(pt.x),k(pt.y),k(Math.atan(g[1])*180/Math.PI)+'°',k(pt.N),k(pt.V),k(pt.M)])}
  o+=tbl(['x (m)','y (m)','θ','N (kN)','V (kN)','M (kN·m)'],rows);
  o+=p('Tanda: N negatif = tekan; V positif memutar searah jarum jam pada potongan kiri. Pada catatan kuliah tanda V dibalik, besarnya sama. Di sendi puncak C, M = '+b(k(m[60].M))+' (harus ≈ 0 karena sendi).');
 }else{
  o+=p('ΣH = 0 → H<sub>A</sub> = −F = '+b(k(-F)+' kN')+' (rol B tidak menahan gaya horizontal).');
  const c=r.members[0],bm=r.members[1],rc=r.members[2],mxb=bm.reduce((q,x)=>Math.abs(x.M)>Math.abs(q.M)?x:q,bm[0]),ie=Math.round(Math.min(z,h)/h*40);
  o+=p(b('2. Kolom kiri (A–C).')+' N<sub>A</sub> = N<sub>E</sub> = N<sub>C</sub> = −V<sub>A</sub> = '+b(k(-Ay)+' kN')+' (tekan). Geser: D = F = '+k(F)+' kN untuk 0 < y < z (di bawah E), D = 0 di atas E. Momen: M<sub>A</sub> = 0, M<sub>E</sub> = M<sub>C</sub> = F·z = '+k(F)+' × '+k(z)+' = '+b(k(F*z)+' kN·m')+'.');
  o+=p(b('3. Balok (C–D).')+' V<sub>C</sub> = V<sub>A</sub> = '+k(Ay)+' kN; V<sub>D</sub> = V<sub>A</sub> − q·L − P = '+b(k(bm[120].V)+' kN')+'. Titik V = 0 di x = '+k(mxb.x)+' m, tempat momen ekstrem M = '+b(k(mxb.M)+' kN·m')+'. Untuk q merata saja: M<sub>maks</sub> = qL²/8 = '+k(q*L*L/8)+' kN·m (ditambah momen sambungan kaku).');
  o+=p(b('4. Kolom kanan (B–D).')+' N<sub>B</sub> = N<sub>D</sub> = −V<sub>B</sub> = '+b(k(-By)+' kN')+', D = 0, M<sub>B</sub> = 0.');
  const row=(n,x)=>[n,k(x.N),k(x.V),k(x.M)];
  o+=tbl(['Titik','N (kN)','V (kN)','M (kN·m)'],[row('A',c[0]),row('E (tinggi F)',c[ie]),row('C',c[40]),row('Tengah balok',bm[60]),row('Momen ekstrem balok',mxb),row('D',bm[120]),row('B',rc[40])]);
 }
 o+=p(b('Kontrol akhir.')+' Q + P = '+k(W)+' kN = V<sub>A</sub> + V<sub>B</sub> '+(Math.abs(Ay+By-W)<.01?'✓':'✗')+(Ay<0||By<0?'. <span style="color:var(--m)">Reaksi negatif: tumpuan terangkat, model tidak berlaku.</span>':''));
 return o;
}
function build(){
 $("ctrl").innerHTML=SPEC.map(([k,t,u,mn,mx,st])=>'<label>'+t+': <b id="v_'+k+'"></b><input type="range" id="i_'+k+'" min="'+mn+'" max="'+(k==="a"?S.L:mx)+'" step="'+st+'" value="'+S[k]+'"></label>').join("")+(ARCH?'<label>Bentuk busur<select id="geom"><option value="circle">Busur lingkaran</option><option value="parabola">Parabola</option></select></label>':"");
 SPEC.forEach(([k,,u])=>$("i_"+k).addEventListener("input",e=>{S[k]=+e.target.value;if(k==="L"){$("i_a").max=S.L;S.a=Math.min(S.a,S.L)}if(k==="yaw")$("t3").classList.toggle("on",S.yaw!==0);paint()}));
 if(ARCH)$("geom").onchange=e=>{S.geom=e.target.value;paint()};
 $("play").onclick=()=>{running=!running;prev=null;$("play").textContent=running?"⏸ Jeda":"▶ Jalankan"};
 for(const k of["V","M","N"])$("c"+k).onchange=e=>{show[k]=e.target.checked;paint()};
 $("t2").onclick=()=>{S.yaw=0;S.tilt=.22;S.auto=false;if($("oa"))$("oa").checked=false;$("i_yaw").value=0;$("t2").classList.add("on");$("t3").classList.remove("on");paint()};
 $("t3").onclick=()=>{S.yaw=35;S.tilt=.22;$("i_yaw").value=35;$("t3").classList.add("on");$("t2").classList.remove("on");paint()};
}
function paint(){
 if(window.markCam)markCam();
 const r=solve(),cs=getComputedStyle(document.documentElement),C=n=>cs.getPropertyValue(n).trim()||"#888";
 const cv=$("cv"),dpr=Math.min(window.devicePixelRatio||1,2),W=cv.clientWidth||700,H=Math.round(W*.66);
 cv.width=W*dpr;cv.height=H*dpr;cv.style.height=H+"px";const g=cv.getContext("2d");g.setTransform(dpr,0,0,dpr,0,0);
 const yaw=S.yaw*Math.PI/180,k=Math.min((W-150)/S.L,(H-190)/S.h)*S.zoom;
 const pt=(x,y,d=0)=>[W/2+(x-S.L/2)*k*Math.cos(yaw)+d*k*Math.sin(yaw),H-80-y*k+(x-S.L/2)*k*Math.sin(yaw)*S.tilt-d*k*Math.cos(yaw)*S.tilt];
 const B=yaw?Math.max(.5,S.L*.07):0,depths=B?[0,B]:[0];
 g.clearRect(0,0,W,H);g.lineJoin="round";g.lineCap="round";g.font="13px system-ui";
 const line=(pts,col,w)=>{g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.strokeStyle=col;g.lineWidth=w;g.stroke()};
 // diagram dulu (di belakang batang)
 const T={V:["SFD",C("--v")],M:["BMD",C("--m")],N:["NFD",C("--n")]};
 for(const key of["V","M","N"]){if(!show[key])continue;
  const amp=Math.max(1e-9,...r.members.flat().map(p=>Math.abs(p[key]))),col=T[key][1];let best=null;
  for(const m of r.members){const top=[],base=[];
   m.forEach((p,i)=>{const p0=m[Math.max(0,i-1)],p1=m[Math.min(m.length-1,i+1)];let tx=p1.x-p0.x,ty=p1.y-p0.y;const l=Math.hypot(tx,ty)||1;tx/=l;ty/=l;
    if(!(p1.x-p0.x||p1.y-p0.y)){tx=1;ty=0}
    const off=p[key]/amp*62/k,dd=B/2;base.push(pt(p.x,p.y,dd));top.push(pt(p.x-ty*off,p.y+tx*off,dd));
    if(!best||Math.abs(p[key])>best.v)best={v:Math.abs(p[key]),raw:p[key],pos:top[top.length-1]}});
   g.beginPath();top.concat(base.slice().reverse()).forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fillStyle=col+"33";g.fill();line(top,col,2.5)}
  if(best){g.fillStyle=col;g.fillText(T[key][0]+" maks "+fmt(best.raw),best.pos[0]+8,best.pos[1]-8)}}
 // struktur
 const fg=C("--fg");
 for(const d of depths)for(const m of r.members)line(m.map(p=>pt(p.x,p.y,d)),d?C("--muted"):fg,7);
 if(B)for(const m of r.members)for(let i=0;i<m.length;i+=Math.ceil(m.length/10))line([pt(m[i].x,m[i].y,0),pt(m[i].x,m[i].y,B)],C("--muted"),2);
 for(const x of[0,S.L]){const p=pt(x,0,B/2);g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(p[0]-13,p[1]+22);g.lineTo(p[0]+13,p[1]+22);g.closePath();g.fillStyle=C("--card");g.fill();g.strokeStyle=fg;g.lineWidth=2;g.stroke();g.fillStyle=fg;g.fillText(x?"B":"A",p[0]-4,p[1]+40)}
 if(ARCH){const p=pt(S.L/2,r.geom(S.L/2)[0],0);g.beginPath();g.arc(p[0],p[1],6,0,7);g.fillStyle=C("--card");g.fill();g.stroke();g.fillStyle=fg;g.fillText("C (sendi)",p[0]+10,p[1]-10)}
 // beban
 const arrow=(x,y,dx,dy,col,lab)=>{const p=pt(x,y,B/2);g.strokeStyle=col;g.fillStyle=col;g.lineWidth=2.5;g.beginPath();g.moveTo(p[0]-dx,p[1]-dy);g.lineTo(p[0],p[1]);g.stroke();const a=Math.atan2(dy,dx);g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(p[0]-9*Math.cos(a-.4),p[1]-9*Math.sin(a-.4));g.lineTo(p[0]-9*Math.cos(a+.4),p[1]-9*Math.sin(a+.4));g.fill();if(lab)g.fillText(lab,p[0]-dx-20,p[1]-dy-8)};
 const topY=x=>ARCH?r.geom(x)[0]:S.h;
 if(S.q>0)for(let i=0;i<=8;i++)arrow(S.L*i/8,topY(S.L*i/8),0,26,C("--muted"),i===4?"q = "+S.q+" kN/m":"");
 if(S.P>0)arrow(S.a,topY(S.a),0,70,C("--acc"),"P = "+S.P+" kN");
 if(!ARCH&&S.F>0)arrow(0,S.z,60,0,C("--acc"),"F = "+S.F+" kN");
 // angka
 $("v_L").textContent=S.L+" m";$("v_h").textContent=S.h+" m";$("v_q").textContent=S.q+" kN/m";$("v_P").textContent=S.P+" kN";$("v_a").textContent=fmt(S.a)+" m";$("v_spd").textContent=S.spd+" m/s";$("v_yaw").textContent=S.yaw+"°";
 if(!ARCH){$("v_F").textContent=S.F+" kN";$("v_z").textContent=S.z+" m"}
 const all=r.members.flat(),mx=k=>Math.max(...all.map(p=>Math.abs(p[k])));
 $("s1").textContent=fmt(r.Ay)+" kN";$("s2").textContent=fmt(r.By)+" kN";$("s3").textContent=fmt(mx("M"))+" kN·m";$("s4").textContent=fmt(ARCH?r.H:mx("N"))+" kN";
 $("steps").innerHTML=stepsHTML(r);
 $("story").textContent=(S.P>0?"Beban P = "+S.P+" kN berada "+fmt(S.a)+" m dari A. ":"Tidak ada beban titik. ")+"Reaksi A = "+fmt(r.Ay)+" kN dan B = "+fmt(r.By)+" kN. "+(ARCH?"Pelengkung menahan beban dengan gaya tekan; H = "+fmt(r.H)+" kN di tiap tumpuan.":"Momen terbesar "+fmt(mx("M"))+" kN·m terjadi di sambungan atau di bawah beban.");
}
function loop(t){requestAnimationFrame(loop);if(!running||document.hidden||S.P<=0){prev=null;return}
 if(prev===null){prev=t;return}const dt=Math.min((t-prev)/1000,.1);prev=t;S.a+=S.spd*dt;if(S.a>S.L)S.a=0;$("i_a").value=S.a;paint()}
build();paint();requestAnimationFrame(loop);window.addEventListener("resize",paint);

// ===== kamera & warna =====
function markCam(){const i=CAMS.findIndex(c=>c[0]===S.yaw&&c[1]===S.tilt);document.querySelectorAll(".cambar [data-cam]").forEach((b,j)=>b.classList.toggle("on",j===i))}
function buildCam(){
 const bar=document.createElement("div");bar.className="card cambar";
 const sw=Object.keys(window.PAL||{}).map(k=>'<button type="button" class="sw" data-pal="'+k+'" title="'+PAL[k].n+'" aria-label="Palet '+PAL[k].n+'" style="background:linear-gradient(135deg,'+PAL[k].g1+','+PAL[k].g2+')"></button>').join("");
 bar.innerHTML='<div class="grp"><span class="lb">Kamera</span><div class="seg" role="group" aria-label="Sudut kamera"><button type="button" data-cam="0">Depan</button><button type="button" data-cam="1">Serong</button><button type="button" data-cam="2">Samping</button><button type="button" data-cam="3">Atas</button></div></div><div class="grp"><label>Zoom<input type="range" id="zm" min="0.6" max="1.6" step="0.05" value="1"></label></div><div class="grp"><label class="chk"><input type="checkbox" id="oa"> Putar</label><button type="button" class="ibtn" id="snap" title="Simpan gambar PNG">📸 Simpan</button></div><div class="grp"><span class="lb">Warna</span>'+sw+'</div>';
 $("card2d").parentNode.insertBefore(bar,$("card2d"));
 bar.querySelectorAll("[data-cam]").forEach(b=>b.onclick=()=>{const c=CAMS[+b.dataset.cam];S.yaw=c[0];S.tilt=c[1];S.auto=false;$("oa").checked=false;$("i_yaw").value=S.yaw;$("t3").classList.toggle("on",S.yaw!==0);$("t2").classList.toggle("on",S.yaw===0);paint()});
 $("oa").onchange=e=>{S.auto=e.target.checked;if(S.auto){S.tilt=.22;$("t3").classList.add("on");$("t2").classList.remove("on")}};
 $("zm").oninput=e=>{S.zoom=+e.target.value;paint()};
 const mark=()=>bar.querySelectorAll("[data-pal]").forEach(b=>b.classList.toggle("on",b.dataset.pal===window.curPal));
 bar.querySelectorAll("[data-pal]").forEach(b=>b.onclick=()=>{setPalette(b.dataset.pal);mark()});mark();
 $("snap").onclick=()=>{const cv=$("cv"),t=document.createElement("canvas");t.width=cv.width;t.height=cv.height;const x=t.getContext("2d");x.fillStyle=matchMedia("(prefers-color-scheme:dark)").matches?"#0d1f23":"#f4f9fa";x.fillRect(0,0,t.width,t.height);x.drawImage(cv,0,0);
  t.toBlob(b=>{const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="anstruedu-"+MODE+".png";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500)})};
 markCam();
}
let ap=0,p0=null;
function spin(t){requestAnimationFrame(spin);if(!S.auto||document.hidden){p0=null;return}if(p0===null){p0=t;return}ap+=(t-p0)/1000*.6;p0=t;S.yaw=Math.round(Math.sin(ap)*55);if($("i_yaw"))$("i_yaw").value=S.yaw;$("t3").classList.add("on");paint()}
addEventListener("load",buildCam);requestAnimationFrame(spin);
addEventListener("anstru-pal",()=>paint());
