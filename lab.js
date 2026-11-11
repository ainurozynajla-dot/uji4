"use strict";
const $=id=>document.getElementById(id);
let mode="portal",view3=false,rotation=30,rows=[],last=null;
let running=false,previousTime=null,elapsed=0;
function stopMotion(){running=false;previousTime=null;elapsed=0;$("play").textContent="Jalankan beban bergerak";$("play").setAttribute("aria-pressed","false");}

const fmt=n=>Math.abs(n)<1e-8?"0.000":n.toFixed(3);
const ids=["L","height","q","P","a","F","z","scale","angle","probe","geometry","showV","showM","showN"];
function read(){const s={};for(const id of ids){const e=$(id);s[id]=e.type==="checkbox"?e.checked:e.tagName==="SELECT"?e.value:Number(e.value)}return s}
function solve(s,kind){
 const L=s.L,h=s.height,q=s.q,P=s.P,a=s.a,F=kind==="portal"?s.F:0,z=s.z,W=q*L+P;
 const By=(q*L*L/2+P*a+F*z)/L,Ay=W-By;
 const H=kind==="arch"?(Ay*L/2-q*L*L/8-P*Math.max(0,L/2-a))/h:F;
 const geom=x=>{if(kind==="portal")return [h,0];if(s.geometry==="parabola")return [4*h*x*(L-x)/(L*L),4*h*(L-2*x)/(L*L)];const R=(L*L/4+h*h)/(2*h),v=Math.sqrt(Math.max(0,R*R-(x-L/2)**2));return [v-(R-h),v<1e-9?(x<L/2?1e10:-1e10):-(x-L/2)/v]};
 const section=(x,right=false)=>{const [y,t]=geom(x),theta=Math.atan(t),loaded=right?x>=a:x>a,V0=Ay-q*x-(loaded?P:0),M0=Ay*x-q*x*x/2-(loaded?P*(x-a):0);return{x,y,N:kind==="arch"?-H*Math.cos(theta)-V0*Math.sin(theta):-V0*0-H*0,V:kind==="arch"?V0*Math.cos(theta)-H*Math.sin(theta):V0,M:kind==="arch"?M0-H*y:M0+F*z}};
 const points=[];for(let i=0;i<=120;i++)points.push(i*L/120);points.push(a);if(kind==="arch")points.push(L/2);points.sort((a,b)=>a-b);
 const beam=points.flatMap(x=>x===a&&P>0?[section(x,false),section(x,true)]:[section(x,true)]);
 if(kind==="portal")for(const r of beam)r.N=0;
 const members=kind==="arch"?[{name:"A–C–B",samples:beam}]:[
 {name:"A–C · kolom kiri",samples:Array.from({length:61},(_,i)=>{const y=h*i/60;return{x:0,y,N:-Ay,V:y<z?F:0,M:F*Math.min(y,z)}})},
 {name:"C–D · balok atas",samples:beam.map(r=>({...r,y:h}))},
 {name:"D–B · kolom kanan",samples:Array.from({length:61},(_,i)=>({x:L,y:h*(1-i/60),N:-By,V:0,M:0}))}];
 return {Ay,By,H,W,F,members,section,geom};
}
function esc(t){return String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll('"',"&quot;")}
function svgText(x,y,t,color="#203149",size=16){return '<text x="'+x+'" y="'+y+'" fill="'+color+'" font-family="system-ui" font-size="'+size+'">'+esc(t)+'</text>'}
function line(a,b,color,w=2){return '<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+b[0]+'" y2="'+b[1]+'" stroke="'+color+'" stroke-width="'+w+'"/>'}
function render(){
 const s=read();
 if(![s.L,s.height,s.q,s.P,s.a,s.F,s.z,s.scale].every(Number.isFinite)||s.L<=0||s.height<=0||s.q<0||s.P<0||s.a<0||s.a>s.L||s.z<0||s.z>s.height||(mode==="arch"&&s.geometry==="circle"&&s.height>s.L/2)){
 $("error").textContent="Vérifikasi input: bentang dan tinggi harus positif; posisi beban di dalam bentang, tinggi gaya di dalam kolom. Busur lingkaran memerlukan f ≤ L/2.";return}
 $("error").textContent="";const r=solve(s,mode);last={s,r};rows=[];
 const k=Math.min(760/s.L,310/s.height),yaw=view3?Number(s.angle)*Math.PI/180:0;
 const project=(x,y,d=0)=>[500+(x-s.L/2)*k*Math.cos(yaw)+d*k*Math.sin(yaw),430-y*k+(x-s.L/2)*k*Math.sin(yaw)*.22-d*k*Math.cos(yaw)*.22];
 let art='<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#b8603e"/></marker></defs>';
 const path=arr=>arr.map((p,i)=>(i?"L":"M")+project(p.x,p.y).join(",")).join(" ");
 for(const m of r.members){
 if(view3){art+='<path d="'+m.samples.map((p,i)=>(i?"L":"M")+project(p.x,p.y,.3).join(",")).join(" ")+'" fill="none" stroke="#b8cce0" stroke-width="12"/>';for(let i=0;i<m.samples.length;i+=12)art+=line(project(m.samples[i].x,m.samples[i].y),project(m.samples[i].x,m.samples[i].y,.3),"#9bb4ce",2)}
 art+='<path d="'+path(m.samples)+'" fill="none" stroke="#284b70" stroke-width="8" stroke-linejoin="round"/>';
 }
 for(const x of [0,s.L]){const p=project(x,0);art+='<path d="M'+p[0]+','+p[1]+' l-12,20 h24 Z" fill="white" stroke="#203149" stroke-width="2"/>';if(mode==="portal"&&x===s.L)art+='<circle cx="'+(p[0]-6)+'" cy="'+(p[1]+24)+'" r="3"/><circle cx="'+(p[0]+6)+'" cy="'+(p[1]+24)+'" r="3"/>';art+=svgText(p[0]-12,p[1]+48,x===0?"A":"B")}
 if(mode==="arch"){const p=project(s.L/2,s.height);art+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="6" fill="white" stroke="#203149" stroke-width="2"/>';art+=svgText(p[0]+10,p[1]+20,"C · sendi")}
 function arrow(x,y,dx,dy,label){const p=project(x,y);art+='<line x1="'+(p[0]-dx)+'" y1="'+(p[1]-dy)+'" x2="'+p[0]+'" y2="'+p[1]+'" stroke="#b8603e" stroke-width="2" marker-end="url(#arr)"/>';if(label)art+=svgText(p[0]-dx-18,p[1]-dy-10,label,"#b8603e",14)}
 if(s.q>0){for(let i=0;i<=12;i++){const x=s.L*i/12;arrow(x,mode==="arch"?r.geom(x)[0]:s.height,0,42,i===6?"q = "+s.q+" kN/m":"")}}
 if(s.P>0)arrow(s.a,mode==="arch"?r.geom(s.a)[0]:s.height,0,80,"P = "+s.P+" kN");
 if(mode==="portal"&&s.F>0)arrow(0,s.z,65,0,"F = "+s.F+" kN");
 const px=s.probe*s.L,probe=r.section(px,true),pp=project(px,mode==="arch"?probe.y:s.height);art+='<circle cx="'+pp[0]+'" cy="'+pp[1]+'" r="6" fill="#dc2626"/>';art+=svgText(22,30,"x = "+fmt(px)+" m · M = "+fmt(probe.M)+" kN·m");
 art+=svgText(22,505,"A: V = "+fmt(r.Ay)+" kN   |   B: V = "+fmt(r.By)+" kN   |   H = "+fmt(r.H)+" kN");
 $("scene").innerHTML=art;
 $("sceneNote").textContent=view3?"Proyeksi 3D struktur bidang. Ubah sudut pandang untuk memutar; pembebanan dan solusi tetap dua dimensi.":"Titik merah mengikuti posisi pemeriksaan. Diagram ditampilkan per batang agar pembacaan kolom dan balok tidak tercampur.";
 const all=r.members.flatMap(m=>m.samples),max=key=>Math.max(...all.map(p=>Math.abs(p[key])));
 $("stats").innerHTML=[["Reaksi A",r.Ay,"kN"],["Reaksi B",r.By,"kN"],["Momen |M| maks",max("M"),"kN·m"],["Normal |N| maks",max("N"),"kN"]].map(([t,n,u])=>'<div class="card stat"><span class="muted">'+t+'</span><strong>'+fmt(n)+'</strong>'+u+'</div>').join("");
 let dg="";for(const [key,color,label] of [["V","#2563eb","SFD"],["M","#dc2626","BMD"],["N","#16834a","NFD"]]){
 if(!s["show"+key])continue;dg+='<h3 style="color:'+color+';margin-top:24px">'+label+'</h3>';
 for(const m of r.members){const sample=m.samples,amp=Math.max(1,...sample.map(p=>Math.abs(p[key])));let pth="";sample.forEach((p,i)=>{const x=75+i/(sample.length-1)*850,y=115-p[key]/amp*65*s.scale;pth+=(i?"L":"M")+x+","+y});
 dg+='<svg viewBox="0 0 1000 230" role="img" aria-label="'+label+' '+m.name+'">'+svgText(20,22,m.name)+" "+line([75,115],[925,115],"#a8b7c8",1)+'<path d="'+pth+'" fill="none" stroke="'+color+'" stroke-width="3"/>'+svgText(75,215,"Awal: "+fmt(sample[0][key]))+svgText(390,215,"|maks|: "+fmt(Math.max(...sample.map(p=>Math.abs(p[key])))))+svgText(735,215,"Akhir: "+fmt(sample.at(-1)[key]))+'</svg>';
 }
 }$("diagrams").innerHTML=dg;
 const errV=r.Ay+r.By-r.W,errM=r.By*s.L-s.q*s.L*s.L/2-s.P*s.a-r.F*s.z;
 $("steps").innerHTML='<ol><li>Total beban vertikal W = qL + P = <b>'+fmt(r.W)+' kN</b>.</li><li>ΣM terhadap A = 0: V_B L − qL²/2 − Pa'+(mode==="portal"?' − Fz':'')+' = 0 → <b>V_B = '+fmt(r.By)+' kN</b>.</li><li>ΣV = 0: V_A = W − V_B = <b>'+fmt(r.Ay)+' kN</b>.</li><li>'+(mode==="arch"?'Sendi puncak: M_C = 0 → H = [V_A L/2 − qL²/8 − P max(0,L/2−a)]/f = <b>'+fmt(r.H)+' kN</b>.':'ΣH = 0: H_A = −F = <b>'+fmt(-r.F)+' kN</b>; rol B tidak menahan gaya horizontal.')+'</li><li>Kontrol ΣV = '+fmt(errV)+' kN; ΣM_A = '+fmt(errM)+' kN·m.'+(mode==="arch"?' Kontrol M_C = '+fmt(r.section(s.L/2,true).M)+' kN·m.':' Kontrol M ujung B = '+fmt(r.section(s.L,true).M)+' kN·m.')+'</li></ol>'+(r.Ay<0||r.By<0?'<p style="color:#dc2626">Reaksi vertikal negatif: diperlukan penahan uplift; tumpuan kontak biasa dapat terangkat sehingga model ini tidak lagi berlaku.</p>':'');
 $("theory").innerHTML=mode==="portal"?'<p>Portal statis tertentu: A sendi, B rol, sambungan atas kaku. Titik C dan D bukan sendi dalam.</p><div class="formula">V_B = (qL²/2 + Pa + Fz)/L; V_A = qL + P − V_B; H_A = −F.<br>Kolom kiri pada tinggi y: N = −V_A; V = F untuk y &lt; z dan 0 di atasnya; M = F min(y,z).<br>Balok atas: N = 0; V(x) = V_A − qx − P·I(x ≥ a); M(x) = Fz + V_Ax − qx²/2 − P max(0,x−a).<br>Kolom kanan: N = −V_B; V = 0; M = 0.</div><p>Nilai tepat pada gaya terpusat memiliki limit kiri/kanan untuk gaya geser. Arah positif geser memakai normal lokal (−t_y, t_x), dengan arah batang A→C→D→B. Momen positif adalah momen internal berlawanan jarum jam pada bagian struktur sisi A.</p>':'<p>Pelengkung tiga sendi: sendi A dan B menahan reaksi horizontal dan vertikal; sendi C di puncak membuat M_C = 0.</p><div class="formula">M₀(x) = V_Ax − qx²/2 − P max(0,x−a).<br>H = M₀(L/2)/f; M(x) = M₀(x) − Hy(x).<br>V₀(x) = V_A − qx − P·I(x ≥ a).<br>N(x) = −H cos θ − V₀ sin θ; V(x) = V₀ cos θ − H sin θ; θ = atan(dy/dx).<br>Parabola: y = 4fx(L−x)/L².<br>Lingkaran: R = ((L/2)²+f²)/(2f); y = √[R²−(x−L/2)²] − (R−f).</div><p>Beban q didefinisikan per meter proyeksi horizontal, bukan per meter panjang busur. Kasus q penuh pada parabola memiliki M = 0; busur lingkaran umumnya tidak. N negatif berarti tekan. Diagram gaya normal dan geser memakai arah tangen dari A menuju B.</p>';
 $("assumptions").textContent=mode==="portal"?"Analisis orde pertama, sambungan sudut kaku, A sendi dan B rol. Beban merata vertikal bekerja sepanjang balok atas, satu beban titik vertikal, dan satu gaya horizontal pada kolom kiri. Berat sendiri hanya termasuk jika dimasukkan dalam beban.":"Pelengkung simetris tiga sendi dengan puncak pada L/2. Beban vertikal merata penuh dan satu beban titik. Tidak termasuk beban horizontal luar atau beban merata parsial.";
 for(const m of r.members)for(const [i,p]of m.samples.entries())if(i%6===0||i===m.samples.length-1)rows.push({batang:m.name,x:p.x,y:p.y,N:p.N,V:p.V,M:p.M});
 $("values").innerHTML='<table><thead><tr><th>Batang</th><th>x (m)</th><th>y (m)</th><th>N (kN)</th><th>V (kN)</th><th>M (kN·m)</th></tr></thead><tbody>'+rows.map(p=>'<tr><td>'+p.batang+'</td>'+["x","y","N","V","M"].map(k=>'<td>'+fmt(p[k])+'</td>').join("")+'</tr>').join("")+'</tbody></table>';
}
function preset(){stopMotion();const arch=mode==="arch";for(const[k,v]of Object.entries(arch?{L:15,height:7.5,q:2,P:0,a:7.5,F:0,z:2}:{L:6,height:4,q:2.3,P:0,a:3,F:4,z:2}))$(k).value=v;$("geometry").value="circle";render()}
document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{stopMotion();const v=b.dataset.mode;document.querySelectorAll("[data-mode]").forEach(n=>n.setAttribute("aria-pressed",n===b));$("balok").hidden=v!=="balok";$("lab").hidden=v==="balok";if(v==="balok")return;mode=v;const arch=v==="arch";$("title").textContent=arch?"Pelengkung tiga sendi":"Portal statis tertentu";$("intro").textContent=arch?"Dari reaksi tumpuan ke gaya normal, geser, dan momen sepanjang busur.":"Jelajahi gaya dalam pada dua kolom dan balok atas dengan tumpuan sendi–rol.";$("horizontal").hidden=arch;$("elevation").hidden=arch;$("radiuslabel").hidden=!arch;$("heightlabel").firstChild.textContent=arch?"Tinggi puncak f (m)":"Tinggi kolom h (m)";preset()});
for(const id of ids)$(id).addEventListener("input",render);
$("preset").onclick=preset;
$("view2").onclick=()=>{view3=false;$("view2").setAttribute("aria-pressed","true");$("view3").setAttribute("aria-pressed","false");render()};
$("view3").onclick=()=>{view3=true;$("view3").setAttribute("aria-pressed","true");$("view2").setAttribute("aria-pressed","false");render()};
$("rotate").onclick=()=>{view3=true;$("angle").value=Number($("angle").value)>=70?-60:Number($("angle").value)+20;$("view3").setAttribute("aria-pressed","true");$("view2").setAttribute("aria-pressed","false");render()};
$("export").onclick=()=>{if(!rows.length)return;const csv="\uFEFFBatang,x_m,y_m,N_kN,V_kN,M_kNm\r\n"+rows.map(r=>[r.batang,r.x,r.y,r.N,r.V,r.M].join(",")).join("\r\n");const u=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"})),a=document.createElement("a");a.href=u;a.download="ANSTRUCEDU-"+mode+".csv";a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)};

$("play").onclick=()=>{
 if(running){stopMotion();return;}
 if(!last||$("error").textContent)return;
 if(Number($("P").value)===0)$("P").value="45";
 render();if($("error").textContent)return;
 running=true;previousTime=null;elapsed=0;
 $("play").textContent="Jeda";$("play").setAttribute("aria-pressed","true");
};
document.addEventListener("visibilitychange",()=>{previousTime=null;elapsed=0});
function animateMotion(time){
 requestAnimationFrame(animateMotion);
 if(!running||document.hidden||$("lab").hidden){previousTime=null;return;}
 if(previousTime===null){previousTime=time;return;}
 elapsed+=Math.min((time-previousTime)/1000,.2);previousTime=time;
 if(elapsed<.1)return;
 const speed=Number($("speed").value),span=Number($("L").value);
 if(!Number.isFinite(speed)||speed<=0||speed>10||!Number.isFinite(span)||span<=0){stopMotion();$("error").textContent="Periksa kecepatan (0–10 m/s) dan bentang.";return;}
 const next=Number($("a").value)+speed*elapsed;
 $("a").value=next>span?0:next;$("probe").value=Number($("a").value)/span;
 elapsed=0;render();if($("error").textContent)stopMotion();
}
requestAnimationFrame(animateMotion);

// buka modul sesuai #hash dari halaman Beranda
{const m=location.hash.slice(1),b=document.querySelector('[data-mode="'+m+'"]');if(b)b.click()}
