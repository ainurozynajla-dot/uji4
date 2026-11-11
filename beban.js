/* Beban tambahan (merata, segitiga, titik miring) & tumpuan tambahan untuk balok.html */
(function(){
const g=id=>document.getElementById(id),fn=v=>(+v).toFixed(2).replace(/\.?0+$/,'').replace('.',',');
const F={u:[['x1','Dari x (m)',0],['x2','Sampai x (m)',()=>L],['q','q (kN/m)',20]],
 t:[['x1','Dari x (m)',0],['x2','Sampai x (m)',()=>L],['qa','q awal (kN/m)',0],['qb','q akhir (kN/m)',30]],
 p:[['x','Posisi x (m)',()=>L/2],['P','P (kN)',100],['ang','Sudut α (°) dari sumbu balok',45]]};
const T={u:'Merata',t:'Segitiga',p:'Titik miring'};
function form(){const pa=g('bt').value==='p';g('bf').innerHTML=F[g('bt').value].map(([k,t,d])=>'<label>'+t+'<input type="number" step="any" data-k="'+k+'" value="'+(typeof d==='function'?d():d)+'"></label>').join('')+(pa?'<div style="flex:0 0 100%;display:flex;gap:6px;flex-wrap:wrap">'+[0,30,45,60,90,120,135,150,180].map(a=>'<button type="button" class="chip" data-a="'+a+'">'+a+'°</button>').join('')+'</div>':'')}
function chip(txt,del){const d=document.createElement('span');d.className='chip on';d.style.margin='4px 6px 0 0';d.textContent=txt+' ✕';d.style.cursor='pointer';d.title='Hapus';d.onclick=del;return d}
/* baris beban yang bisa diedit langsung (nilai berubah saat diketik) */
const LB={x:'x (m)',x1:'Dari x (m)',x2:'Sampai x (m)',q:'q (kN/m)',qa:'q awal',qb:'q akhir',P:'P (kN)',ang:'Sudut α (°)'};
function row(box,title,o,keys,del){
  const d=document.createElement('div');d.className='rw';const h=document.createElement('b');h.textContent=title;h.style.cssText='flex:0 0 100%';d.append(h);
  keys.forEach(k=>{const l=document.createElement('label');l.textContent=LB[k];const i=document.createElement('input');i.type='number';i.step='any';i.value=+(+o[k]).toFixed(4);
    i.oninput=()=>{const v=parseFloat(i.value);if(isNaN(v))return;o[k]=k==='ang'?Math.min(180,Math.max(0,v)):Math.max(0,v);if(/^x/.test(k))o[k]=Math.min(L,o[k]);buildConvoy(true)};l.append(i);d.append(l)});
  if(keys.includes('ang')){const pr=document.createElement('div');pr.style.cssText='flex:0 0 100%;display:flex;gap:6px;flex-wrap:wrap';
    [0,30,45,60,90,120,135,150,180].forEach(a=>{const c=document.createElement('button');c.type='button';c.className='chip';c.textContent=a+'°';c.onclick=()=>{o.ang=a;list();buildConvoy(true)};pr.append(c)});d.append(pr)}
  const x=document.createElement('button');x.type='button';x.className='chip';x.textContent='✕ Hapus';x.onclick=del;d.append(x);box.append(d);
}
function list(){
  const b=g('blist');b.innerHTML='';
  SL.u.forEach((u,i)=>row(b,'Merata #'+(i+1),u,['x1','x2','q'],()=>{SL.u.splice(i,1);upd()}));
  SL.t.forEach((t,i)=>row(b,'Segitiga #'+(i+1),t,['x1','x2','qa','qb'],()=>{SL.t.splice(i,1);upd()}));
  SL.p.forEach((p,i)=>row(b,'Beban titik #'+(i+1),p,['x','P','ang'],()=>{SL.p.splice(i,1);upd()}));
  const s=g('slist');s.innerHTML='';SUP.forEach((x,i)=>s.append(chip('Tumpuan T'+(i+1)+' di '+fn(x)+' m',()=>{SUP.splice(i,1);upd()})));
}
function upd(){SUP.sort((a,b)=>a-b);list();buildConvoy(true)}
g('bt').onchange=form;form();
g('bf').addEventListener('click',e=>{const a=e.target.dataset&&e.target.dataset.a;if(a!==undefined){g('bf').querySelector('[data-k=ang]').value=a}});
g('badd').onclick=()=>{
  const t=g('bt').value,o={};g('bf').querySelectorAll('input').forEach(i=>o[i.dataset.k]=parseFloat(i.value));
  const c=v=>Math.min(L,Math.max(0,v||0));
  if(t==='p'){o.x=c(o.x);o.P=Math.max(0,o.P||0);o.ang=Math.min(180,Math.max(0,o.ang||0))}
  else{o.x1=c(o.x1);o.x2=c(o.x2);if(o.x2<=o.x1){alert('Nilai "Sampai x" harus lebih besar dari "Dari x".');return}
    if(t==='u')o.q=Math.max(0,o.q||0);else{o.qa=Math.max(0,o.qa||0);o.qb=Math.max(0,o.qb||0)}}
  SL[t].push(o);upd();
};
g('sadd').onclick=()=>{
  if(S.cant){alert('Kantilever hanya punya satu tumpuan (jepit). Pilih "Balok sederhana" untuk menambah tumpuan.');return}
  const x=parseFloat(g('sx').value);if(!(x>0&&x<L)){alert('Posisi tumpuan harus di antara 0 dan '+L+' m.');return}
  if(SUP.length>=4){alert('Maksimal 4 tumpuan tambahan.');return}SUP.push(x);upd();
};
g('nov').onchange=e=>{NOV=e.target.checked;upd()};
g('bclr').onclick=()=>{SL.u=[];SL.t=[];SL.p=[];SUP.length=0;upd()};
/* contoh soal: balok A-B, P1 = 4 t tegak di 2 m, P2 = 4√2 t miring 45° di 5 m, L = 8 m (dalam kN: ×10) */
g('bex').onclick=()=>{
  g('stype').value='ss';S.cant=false;L=8;g('L').value=8;SL.u=[];SL.t=[];SUP.length=0;
  SL.p=[{x:2,P:40,ang:90},{x:5,P:40*Math.SQRT2,ang:135}];NOV=true;g('nov').checked=true;
  S.playing=false;g('play').textContent='▶ Putar';upd();
};
list();
})();
