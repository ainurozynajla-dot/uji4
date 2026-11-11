const cv=document.getElementById('cv'),ctx=cv.getContext('2d'),$=id=>document.getElementById(id),FAM='"Gill Sans","Seravek","Candara","Trebuchet MS",system-ui,sans-serif';
const VEH=[
 {id:'ped',n:'🚶 Pejalan',w:.75,r:[.3,2],ax:[[0,1]],fo:.3,ro:.3,k:'ped',c:'#f472b6',h:1.7},
 {id:'crowd',n:'👥 Kerumunan',w:5,r:[1,40],ax:[0,1,2,3,4,5].map(i=>[-.7*i,1/6]),fo:.3,ro:.3,k:'ped',c:'#f472b6',h:1.7},
 {id:'bike',n:'🚲 Sepeda',w:.8,r:[.3,2],ax:[[0,.4],[-1.1,.6]],fo:.4,ro:.4,k:'bike',c:'#22c55e',h:1.7},
 {id:'moto',n:'🏍️ Motor',w:2,r:[1,6],ax:[[0,.4],[-1.3,.6]],fo:.5,ro:.5,k:'bike',c:'#ef4444',h:1.7},
 {id:'car',n:'🚗 Mobil',w:15,r:[8,40],ax:[[0,.5],[-2.7,.5]],fo:.9,ro:.9,k:'car',c:'#6366f1',h:1.6},
 {id:'pick',n:'🛻 Pickup',w:30,r:[15,60],ax:[[0,.45],[-3,.55]],fo:1,ro:1.4,k:'cab',cab:1.8,c:'#0ea5e9',c2:'#0369a1',h:1.9},
 {id:'bus',n:'🚌 Bus',w:150,r:[80,300],ax:[[0,.35],[-6,.65]],fo:1.5,ro:2.5,k:'win',c:'#facc15',h:3},
 {id:'truck',n:'🚚 Truk',w:300,r:[100,600],ax:[[0,.4],[-4,.6]],fo:1,ro:1.5,k:'cab',cab:2,c:'#f59e0b',c2:'#d97706',h:2.6},
 {id:'trail',n:'🚛 Trailer',w:450,r:[150,1000],ax:[[0,.2],[-3.5,.4],[-12,.4]],fo:1,ro:1.5,k:'cab',cab:2.5,c:'#64748b',c2:'#334155',h:2.8},
 {id:'train',n:'🚆 Kereta',w:1200,r:[400,3000],ax:[[0,.25],[-2.5,.25],[-13,.25],[-15.5,.25]],fo:2,ro:2,k:'win',c:'#dc2626',h:3.2},
 {id:'box',n:'📦 Beban titik',w:100,r:[10,1000],ax:[[0,1]],fo:.8,ro:.8,k:'box',c:'#7c3aed',h:1.6}
];
VEH.forEach(v=>v.mo=v.ax[v.ax.length-1][0]);
const byId=Object.fromEntries(VEH.map(v=>[v.id,v])),MIX=['car','moto','bus','truck','pick','car','trail','bike'];
const S={xf:-4,xmin:-4,xmax:40,playing:true,speed:3,mu:0,last:0,Mu:1500,Vu:350,cant:false};
let FAIL=null,PART=[],LAST=null,VIEW3=false;
let rows=[{id:'truck',w:300,gap:8}];
let L=20,V=byId.truck,items=[],env=null,sc={v:1,m:1,n:1};
const G=201;let XS=[];

function buildConvoy(keep){
  FAIL=null;PART=[];$('alert').hidden=true;
  items=[];buildStatic();
  rows.forEach((r,i)=>{const v=byId[r.id];
    let off=0;if(i){const p=items[i-1];off=p.off+p.v.mo-p.v.ro-r.gap-v.fo}
    items.push({v,w:r.w,off})});
  const a=items[0],z=items[items.length-1];
  S.xmax=L+(a.v.fo-(z.off+z.v.mo-z.v.ro))+2;
  if(S.cant)S.xmax=L+1;
  S.xf=keep?Math.min(Math.max(S.xf,S.xmin),S.xmax):S.xmin;
  const p=$('pos');p.min=S.xmin;p.max=S.xmax;p.value=S.xf;
  XS=Array.from({length:G},(_,i)=>i*L/(G-1));
  buildEnv();labels();markTheory();
}
function markTheory(){const s=$('th-ss'),c=$('th-ct');if(!s||!c)return;s.classList.toggle('cur',!S.cant);s.classList.toggle('dim',S.cant);c.classList.toggle('cur',S.cant);c.classList.toggle('dim',!S.cant)}
const SL={u:[],t:[],p:[]};let SUP=[],SP=[],NOV=false,_m={};
function buildStatic(){
  SP=[];const N=60,add=(x,P,H)=>SP.push({x,P,H:H||0,s:1});
  SL.u.forEach(u=>{const d=(u.x2-u.x1)/N;for(let i=0;i<N;i++)add(u.x1+d*(i+.5),u.q*d)});
  SL.t.forEach(t=>{const d=(t.x2-t.x1)/N;for(let i=0;i<N;i++){const x=t.x1+d*(i+.5);add(x,(t.qa+(t.qb-t.qa)*(x-t.x1)/(t.x2-t.x1||1))*d)}});
  SL.p.forEach(p=>{const a=p.ang*Math.PI/180;add(p.x,p.P*Math.sin(a),p.P*Math.cos(a))});
  _m={};
}
const loads=xf=>{const o=[];if(NOV)return o;items.forEach(it=>it.v.ax.forEach(([a,f])=>{const x=xf+it.off+a;if(x>=0&&x<=L)o.push({x,P:f*it.w,it})}));return o};
const supX=()=>S.cant?[0]:[0,...SUP.filter(x=>x>0&&x<L).sort((a,b)=>a-b),L];
/* reaksi tumpuan: 2 tumpuan = statika; >2 tumpuan = metode fleksibilitas (EI tetap) */
function reac(all,Lx){
  const X=supX(),n=X.length,sP=all.reduce((q,l)=>q+l.P,0);
  const g=(xp,a)=>{const b=Lx-a;return xp<=a?b*xp*(Lx*Lx-b*b-xp*xp)/(6*Lx):a*(Lx-xp)*(Lx*Lx-a*a-(Lx-xp)*(Lx-xp))/(6*Lx)};
  let Rm=[];const m=n-2;
  if(m>0){const A=[];for(let k=0;k<m;k++){A.push([...Array.from({length:m},(_,j)=>g(X[k+1],X[j+1])),all.reduce((q,l)=>q+l.P*g(X[k+1],l.x),0)])}
    for(let i=0;i<m;i++){let p=i;for(let r=i+1;r<m;r++)if(Math.abs(A[r][i])>Math.abs(A[p][i]))p=r;[A[i],A[p]]=[A[p],A[i]];
      for(let r=0;r<m;r++)if(r!==i){const f=A[r][i]/A[i][i];for(let c=i;c<=m;c++)A[r][c]-=f*A[i][c]}}
    Rm=A.map((r,i)=>r[m]/r[i]);}
  const RA=(all.reduce((q,l)=>q+l.P*(Lx-l.x),0)-Rm.reduce((q,r,j)=>q+r*(Lx-X[j+1]),0))/Lx;
  return [[0,RA],...Rm.map((r,j)=>[X[j+1],r]),[Lx,sP-Rm.reduce((q,r)=>q+r,0)-RA]];
}
function memo(ls){if(_m.ls!==ls){const all=ls.concat(SP);_m={ls,all,R:S.cant?null:reac(all,L)}}return _m}
function sectG(ls,s,Lx,cant,mu){
  let v=0,m=0,n=0;const M=memo(ls),all=M.all;
  if(cant){all.forEach(l=>{if(l.x>=s){v+=l.P;m-=l.P*(l.x-s);n+=l.s?l.H:mu*l.P}})}
  else{
    M.R.forEach(([xj,r])=>{if(xj<s){v+=r;m+=r*(s-xj)}});
    all.forEach(l=>{if(l.x<s){v-=l.P;m-=l.P*(s-l.x)}else n+=l.s?l.H:mu*l.P});
  }
  return [v,m,n];
}
function sect(ls,s){return sectG(ls,s,L,S.cant,S.mu)}
function curve(ls){
  const p=XS.slice();ls.forEach(l=>p.push(l.x-1e-6,l.x+1e-6));supX().forEach(x=>p.push(x-1e-6,x+1e-6));SL.p.forEach(l=>p.push(l.x-1e-6,l.x+1e-6));SL.u.concat(SL.t).forEach(u=>p.push(u.x1,u.x2));
  return p.filter(x=>x>=0&&x<=L).sort((a,b)=>a-b).map(x=>({x,v:sect(ls,x)}));
}
function buildEnv(){
  env={vmax:XS.map(()=>0),vmin:XS.map(()=>0),mmax:XS.map(()=>0),mmin:XS.map(()=>0),nmax:XS.map(()=>0)};
  for(let xf=S.xmin;xf<=S.xmax;xf+=.25){
    const ls=loads(xf);if(!ls.length&&!SP.length)continue;
    XS.forEach((s,i)=>{const [v,m,n]=sect(ls,s);
      env.vmax[i]=Math.max(env.vmax[i],v);env.vmin[i]=Math.min(env.vmin[i],v);
      env.mmax[i]=Math.max(env.mmax[i],m);env.mmin[i]=Math.min(env.mmin[i],m);env.nmax[i]=Math.max(env.nmax[i],n)});
  }
  sc={v:Math.max(1e-6,...env.vmax,...env.vmin.map(Math.abs)),m:Math.max(1e-6,...env.mmax,...env.mmin.map(Math.abs)),n:Math.max(1e-6,...env.nmax)};
}
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
let W=900,H=640;
function resize(){
  const r=cv.getBoundingClientRect(),d=Math.min(window.devicePixelRatio||1,2);if(!r.width)return;
  W=r.width;H=Math.max(540,Math.min(700,W*.74));
  cv.style.height=H+'px';cv.width=W*d;cv.height=H*d;ctx.setTransform(d,0,0,d,0,0);
}

/* ---------- Gambar kendaraan & orang ---------- */
function rr(x,y,w,h,r){r=Math.max(0,Math.min(r,w/2,h/2));ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function sh(hex,a){const n=parseInt(hex.slice(1),16),f=c=>Math.round(Math.max(0,Math.min(255,a>=0?c+(255-c)*a:c*(1+a))));return `rgb(${f(n>>16)},${f(n>>8&255)},${f(n&255)})`}
function lg(y0,y1,c){const g=ctx.createLinearGradient(0,y0,0,y1);g.addColorStop(0,sh(c,.28));g.addColorStop(1,sh(c,-.25));return g}
function poly(p){ctx.beginPath();p.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();ctx.fill()}
function glass(p){const ys=p.map(q=>q[1]),y0=Math.min(...ys),y1=Math.max(...ys),g=ctx.createLinearGradient(0,y0,0,y1);g.addColorStop(0,'#e3f3fc');g.addColorStop(1,'#8cc4e8');ctx.fillStyle=g;poly(p)}
function wheel(x,y,r,rot){
  ctx.fillStyle='#1f2430';ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();
  ctx.fillStyle='#d5dde8';ctx.beginPath();ctx.arc(x,y,r*.58,0,7);ctx.fill();
  ctx.strokeStyle='#7b8798';ctx.lineWidth=Math.max(1,r*.1);
  for(let i=0;i<5;i++){const a=rot+i*Math.PI*.4;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*r*.56,y+Math.sin(a)*r*.56);ctx.stroke()}
  ctx.fillStyle='#475569';ctx.beginPath();ctx.arc(x,y,r*.15,0,7);ctx.fill();
}
function arches(c,D){ctx.fillStyle=sh(c,-.6);D.xs.forEach(x=>{ctx.beginPath();ctx.arc(x,D.deckY-D.wr,D.wr*1.27,Math.PI,0);ctx.fill()})}
function lights(D,by,bh){const w=D.right-D.left;ctx.fillStyle='#fde68a';rr(D.right-w*.06,by+bh*.12,w*.06,bh*.26,2);ctx.fill();ctx.fillStyle='#ef4444';rr(D.left,by+bh*.12,w*.05,bh*.26,2);ctx.fill()}

function drawCar(v,D){
  const l=D.left,r=D.right,bot=D.bot,hh=D.hh,w=r-l,bh=hh*.56,by=bot-bh,ct=bot-hh,a=l+w*.2,b=l+w*.76,mid=(a+b)/2+w*.02;
  ctx.fillStyle=lg(by,bot,v.c);rr(l,by,w,bh,hh*.16);ctx.fill();
  ctx.fillStyle=lg(ct,by,v.c);poly([[a-w*.06,by+2],[a+w*.06,ct],[b-w*.04,ct],[b+w*.1,by+2]]);
  glass([[a-w*.03,by-1],[a+w*.07,ct+hh*.09],[mid-w*.02,ct+hh*.09],[mid-w*.02,by-1]]);
  glass([[mid+w*.02,by-1],[mid+w*.02,ct+hh*.09],[b-w*.05,ct+hh*.09],[b+w*.06,by-1]]);
  ctx.strokeStyle='rgba(0,0,0,.2)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(mid,by+2);ctx.lineTo(mid,bot-bh*.15);ctx.stroke();
  lights(D,by,bh);arches(v.c,D);
}
function drawPick(v,D){
  const l=D.left,r=D.right,bot=D.bot,hh=D.hh,bh=hh*.52,by=bot-bh,ct=bot-hh,cl=r-v.cab*D.cw,cwid=r-cl;
  ctx.fillStyle=lg(by,bot,v.c);rr(l,by,cl-l+3,bh,3);ctx.fill();
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(l+3,by,cl-l-3,bh*.16);
  ctx.fillStyle=lg(by,bot,v.c2);rr(cl,by,cwid,bh,hh*.12);ctx.fill();
  ctx.fillStyle=lg(ct,by,v.c2);poly([[cl+cwid*.08,by+2],[cl+cwid*.2,ct],[cl+cwid*.68,ct],[r-cwid*.06,by+2]]);
  glass([[cl+cwid*.16,by],[cl+cwid*.25,ct+hh*.1],[cl+cwid*.64,ct+hh*.1],[r-cwid*.12,by]]);
  lights(D,by,bh);arches(v.c2,D);
}
function drawBus(v,D){
  const l=D.left,r=D.right,bot=D.bot,hh=D.hh,k=D.k,w=r-l,t=bot-hh,train=v.id==='train';
  ctx.fillStyle=lg(t,bot,v.c);rr(l,t,w,hh,train?hh*.3:hh*.12);ctx.fill();
  ctx.fillStyle=train?'#f8fafc':'rgba(31,41,55,.55)';ctx.fillRect(l+2,bot-hh*.3,w-4,hh*.09);
  const n=Math.max(2,Math.floor((w-k*2)/(k*1.55))),ww=(w-k*2.2)/n;
  for(let i=0;i<n;i++){glass([[0,t+hh*.16],[0,t+hh*.5]]);rr(l+k*.5+i*ww+ww*.08,t+hh*.16,ww*.84,hh*.34,3);ctx.fill()}
  glass([[0,t+hh*.16],[0,t+hh*.66]]);rr(r-k*1.4,t+hh*.16,k*1.25,hh*.5,train?7:3);ctx.fill();
  ctx.fillStyle='#fde68a';rr(r-5,bot-hh*.24,4.5,hh*.1,2);ctx.fill();ctx.fillStyle='#ef4444';rr(l+1,bot-hh*.24,4,hh*.1,2);ctx.fill();
  if(train){ctx.strokeStyle='#334155';ctx.lineWidth=2;ctx.lineCap='round';const m=l+w*.5;ctx.beginPath();ctx.moveTo(m-k*.5,t);ctx.lineTo(m,t-hh*.14);ctx.lineTo(m+k*.5,t);ctx.moveTo(m-k*.6,t-hh*.14);ctx.lineTo(m+k*.6,t-hh*.14);ctx.stroke();return t-hh*.16}
  arches(v.c,D);
}
function drawTruck(v,D){
  const l=D.left,r=D.right,bot=D.bot,hh=D.hh,k=D.k,cl=r-v.cab*D.cw,cwid=r-cl,top=bot-hh,ch=hh*.78,ct=bot-ch;
  ctx.fillStyle='#374151';ctx.fillRect(l,bot-3,r-l,5);
  const g=ctx.createLinearGradient(0,top,0,bot);g.addColorStop(0,'#f8fafc');g.addColorStop(1,'#c3cdda');ctx.fillStyle=g;rr(l,top,cl-l-2,hh-3,4);ctx.fill();
  ctx.fillStyle=v.c;ctx.fillRect(l,bot-hh*.4,cl-l-2,hh*.13);
  ctx.strokeStyle='rgba(100,116,139,.35)';ctx.lineWidth=1;
  for(let x=l+k*2.4;x<cl-5;x+=k*2.4){ctx.beginPath();ctx.moveTo(x,top+3);ctx.lineTo(x,bot-5);ctx.stroke()}
  ctx.fillStyle=lg(ct,bot,v.c);poly([[cl,bot-3],[cl,ct],[r-cwid*.3,ct],[r-cwid*.12,ct+ch*.28],[r,ct+ch*.5],[r,bot-3]]);
  glass([[cl+cwid*.12,ct+ch*.52],[cl+cwid*.12,ct+ch*.1],[r-cwid*.36,ct+ch*.1],[r-cwid*.2,ct+ch*.52]]);
  ctx.fillStyle='#fde68a';rr(r-4,bot-ch*.3,4,ch*.14,2);ctx.fill();
  ctx.fillStyle='#94a3b8';ctx.fillRect(cl+3,ct-hh*.14,3,hh*.18);
  arches('#475569',D);
}
function drawBike(v,D,moto){
  const xs=D.xs,deckY=D.deckY,hh=D.hh,F=xs[0],R=xs[1],d=F-R,rw=Math.max(3,Math.min(.3*D.cw,(moto?.26:.24)*hh)),yc=deckY-rw,rot=S.xf*D.cw/rw,lw=Math.max(2,hh*(moto?.09:.05));
  ctx.lineCap='round';ctx.lineJoin='round';
  [F,R].forEach(x=>{
    ctx.strokeStyle='#1f2430';ctx.lineWidth=moto?rw*.36:Math.max(1.5,hh*.035);ctx.beginPath();ctx.arc(x,yc,moto?rw*.82:rw,0,7);ctx.stroke();
    ctx.strokeStyle='#94a3b8';ctx.lineWidth=1;
    for(let i=0;i<6;i++){const a=rot+i*Math.PI/6;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*rw*.8,yc+Math.sin(a)*rw*.8);ctx.lineTo(x-Math.cos(a)*rw*.8,yc-Math.sin(a)*rw*.8);ctx.stroke()}
  });
  const skin='#f1c9a5',shirt='#3b82f6',pants='#334155';
  let hip,sho,hand;
  if(!moto){
    const BB=[R+d*.42,yc],S_=[R+d*.3,deckY-hh*.52],H=[F-d*.1,deckY-hh*.5];
    ctx.strokeStyle=v.c;ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(R,yc);ctx.lineTo(S_[0],S_[1]);ctx.lineTo(BB[0],BB[1]);ctx.lineTo(R,yc);ctx.moveTo(S_[0],S_[1]);ctx.lineTo(H[0],H[1]);ctx.moveTo(BB[0],BB[1]);ctx.lineTo(H[0],H[1]);ctx.lineTo(F,yc);ctx.stroke();
    ctx.strokeStyle='#1f2430';ctx.lineWidth=lw*1.3;ctx.beginPath();ctx.moveTo(S_[0]-d*.05,S_[1]-hh*.02);ctx.lineTo(S_[0]+d*.05,S_[1]-hh*.02);ctx.moveTo(H[0],H[1]);ctx.lineTo(H[0]-d*.03,H[1]-hh*.05);ctx.stroke();
    hip=[S_[0],S_[1]-hh*.04];hand=[H[0]-d*.03,H[1]-hh*.05];
    const pa=S.xf*3;[0,Math.PI].forEach((o,i)=>{const P=[BB[0]+Math.cos(pa+o)*hh*.07,BB[1]+Math.sin(pa+o)*hh*.07],kn=[(hip[0]+P[0])/2+d*.07,(hip[1]+P[1])/2];
      ctx.strokeStyle=i?'#1f2937':pants;ctx.lineWidth=lw*1.4;ctx.beginPath();ctx.moveTo(hip[0],hip[1]);ctx.lineTo(kn[0],kn[1]);ctx.lineTo(P[0],P[1]);ctx.stroke()});
    sho=[hip[0]+d*.2,deckY-hh*.78];
  }else{
    ctx.fillStyle='#64748b';ctx.fillRect(R+d*.3,deckY-hh*.3,d*.22,hh*.14);
    ctx.fillStyle=lg(deckY-hh*.5,deckY-hh*.2,v.c);poly([[R+d*.05,deckY-hh*.45],[R+d*.4,deckY-hh*.52],[R+d*.72,deckY-hh*.5],[F-d*.02,deckY-hh*.36],[F-d*.05,deckY-hh*.2],[R+d*.3,deckY-hh*.18],[R+d*.05,deckY-hh*.28]]);
    ctx.fillStyle='#1f2937';rr(R-d*.02,deckY-hh*.55,d*.4,hh*.07,3);ctx.fill();
    ctx.strokeStyle='#7b8798';ctx.lineWidth=lw*.5;ctx.beginPath();ctx.moveTo(F-d*.05,deckY-hh*.5);ctx.lineTo(F,yc);ctx.moveTo(R+d*.2,deckY-hh*.17);ctx.lineTo(R-d*.06,deckY-hh*.22);ctx.stroke();
    ctx.fillStyle='#fde68a';ctx.beginPath();ctx.arc(F-d*.01,deckY-hh*.42,hh*.045,0,7);ctx.fill();
    hip=[R+d*.25,deckY-hh*.57];hand=[F-d*.08,deckY-hh*.6];sho=[hip[0]+d*.13,deckY-hh*.8];
    ctx.strokeStyle=pants;ctx.lineWidth=lw*.9;ctx.beginPath();ctx.moveTo(hip[0],hip[1]);ctx.lineTo(R+d*.52,deckY-hh*.44);ctx.lineTo(R+d*.4,deckY-hh*.2);ctx.stroke();
  }
  ctx.strokeStyle=shirt;ctx.lineWidth=lw*(moto?1.1:1.5);ctx.beginPath();ctx.moveTo(hip[0],hip[1]);ctx.lineTo(sho[0],sho[1]);ctx.stroke();
  ctx.lineWidth=lw*.75;ctx.beginPath();ctx.moveTo(sho[0],sho[1]);ctx.lineTo(hand[0],hand[1]);ctx.stroke();
  const hx=sho[0]+d*.04,hy=deckY-hh*.9,hr=hh*.075;
  ctx.fillStyle=skin;ctx.beginPath();ctx.arc(hx,hy,hr,0,7);ctx.fill();
  ctx.fillStyle=moto?v.c:'#fbbf24';ctx.beginPath();ctx.arc(hx,hy,hr*(moto?1.12:1.05),Math.PI*(moto?.9:1),Math.PI*(moto?2.1:2));ctx.fill();
  return deckY-hh*.99;
}
const SHIRT=['#ef6f8f','#4f8ef7','#34b38a','#f5b83d','#9b7bea','#f08a4b'],SKIN=['#f1c9a5','#d9a47a','#b97a56','#f6d5b8'],HAIR=['#2b2118','#4a3326','#1c1c1c','#7a5230'];
function person(x,deckY,ph,shirt,p0,skin,hair){
  const a=S.xf*4.5+p0,sw=Math.sin(a),bob=Math.abs(Math.cos(a))*ph*.012,hr=ph*.085,hy=deckY-ph+hr-bob,shy=deckY-ph*.8-bob,hipy=deckY-ph*.47-bob,tw=ph*.2,ll=ph*.46,al=ph*.3,lw=Math.max(2,tw*.4);
  ctx.lineCap='round';
  ctx.strokeStyle=sh(shirt,-.3);ctx.lineWidth=lw*.8;ctx.beginPath();ctx.moveTo(x,shy+tw*.2);ctx.lineTo(x-sw*al*.5,shy+al*.9);ctx.stroke();
  [-sw,sw].forEach((s,i)=>{ctx.strokeStyle=i?'#2b303b':'#3d4556';ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(x,hipy);ctx.lineTo(x+s*ll*.45,deckY-2);ctx.stroke();
    ctx.fillStyle='#1f2430';ctx.beginPath();ctx.ellipse(x+s*ll*.45+lw*.3,deckY-1.5,lw*.8,lw*.45,0,0,7);ctx.fill()});
  ctx.fillStyle=lg(shy,hipy,shirt);rr(x-tw/2,shy,tw,hipy-shy+ph*.03,tw*.35);ctx.fill();
  ctx.strokeStyle=shirt;ctx.lineWidth=lw*.8;ctx.beginPath();ctx.moveTo(x,shy+tw*.2);ctx.lineTo(x+sw*al*.5,shy+al*.9);ctx.stroke();
  ctx.fillStyle=skin;ctx.beginPath();ctx.arc(x+sw*al*.5,shy+al*.9,lw*.5,0,7);ctx.fill();
  ctx.fillRect(x-hr*.25,hy+hr*.6,hr*.5,hr*.7);
  ctx.beginPath();ctx.arc(x+ph*.01,hy,hr,0,7);ctx.fill();
  ctx.fillStyle=hair;ctx.beginPath();ctx.arc(x+ph*.01,hy,hr*1.04,Math.PI*1.05,Math.PI*2.05);ctx.fill();
}
function drawPeople(v,D){
  const ph=1.7*D.k;
  D.xs.forEach((x,i)=>{const sc=v.id==='crowd'?.94+((i*7)%5)*.03:1,j=v.id==='crowd'?i:0;
    person(x,D.deckY,ph*sc,v.id==='crowd'?SHIRT[i%6]:v.c,j*1.3,SKIN[(i*3+1)%4],HAIR[(i*5)%4])});
  return D.deckY-ph*1.05;
}
function drawBox(v,D){
  const l=D.left,r=D.right,bot=D.bot+D.wr*.9,hh=D.hh,w=r-l,t=bot-hh,cx=(l+r)/2,hr=w*.17;
  ctx.strokeStyle='#94a3b8';ctx.lineWidth=Math.max(2,D.k*.14);ctx.lineCap='round';ctx.beginPath();ctx.arc(cx,t+hh*.2,hr,Math.PI,0);ctx.stroke();
  ctx.fillStyle=lg(t,bot,v.c);poly([[l+w*.16,t+hh*.18],[r-w*.16,t+hh*.18],[r,bot],[l,bot]]);
  ctx.fillStyle='rgba(255,255,255,.22)';poly([[l+w*.16,t+hh*.18],[l+w*.3,t+hh*.18],[l+w*.16,bot],[l,bot]]);
  ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(l,bot-hh*.08,w,hh*.08);
  ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='bold '+Math.max(11,hh*.42)+'px '+FAM;ctx.fillText('P',cx,t+hh*.6);
  return t-hr;
}
function drawItem(it,sx,cw,deckY){
  const v=it.v,k=Math.max(9,Math.min(cw*.9,26)),wr=Math.max(3,Math.min(.33*cw,.55*k)),xs=v.ax.map(a=>sx(S.xf+it.off+a[0]));
  const left=Math.min(...xs)-v.ro*cw,right=sx(S.xf+it.off)+v.fo*cw;
  if(right<0||left>W)return deckY-v.h*k;
  const hh=v.h*k,bot=deckY-wr*1.05,D={left,right,bot,hh,wr,xs,k,cw,deckY,rot:S.xf*cw/wr};
  ctx.save();
  if(v.k!=='ped'){ctx.fillStyle='rgba(0,0,0,.16)';ctx.beginPath();ctx.ellipse((left+right)/2,deckY+1,(right-left)/2,2.5,0,0,7);ctx.fill()}
  let t=bot-hh,wheels=false;
  if(v.k==='car'){drawCar(v,D);wheels=true}
  else if(v.k==='cab'){(v.id==='pick'?drawPick:drawTruck)(v,D);wheels=true}
  else if(v.k==='win'){t=drawBus(v,D)||t;wheels=true}
  else if(v.k==='bike')t=drawBike(v,D,v.id==='moto');
  else if(v.k==='ped')t=drawPeople(v,D);
  else t=drawBox(v,D);
  if(wheels)xs.forEach(x=>wheel(x,deckY-wr,wr,D.rot));
  ctx.restore();return t;
}

const nmS=(i,n)=>i===0?'A':i===n-1?'B':'T'+i,fx=(x,d=2)=>(+x).toFixed(d).replace('.',',');
function story(ls,cu){
  const all=ls.concat(SP);
  if(!all.length)return 'Belum ada beban di atas balok, jadi belum ada gaya geser maupun momen. Tekan putar, geser posisinya, atau tambahkan beban merata/segitiga/miring di bawah.';
  const M=memo(ls),tot=all.reduce((q,l)=>q+l.P,0);let ex=cu[0];cu.forEach(q=>{if(Math.abs(q.v[1])>Math.abs(ex.v[1]))ex=q});
  let s=`Total beban vertikal ${fx(tot,1)} kN. `;
  if(S.cant)s+=`Jepit A menahan ${fx(tot,1)} kN dan momen ${fx(all.reduce((q,l)=>q+l.P*l.x,0),1)} kN·m. `;
  else s+='Reaksi: '+M.R.map(([x,r],i)=>nmS(i,M.R.length)+' = '+fx(r,1)+' kN').join(', ')+(M.R.length>2?' (balok menerus, statis tak tentu). ':'. ');
  return s+`Momen terbesar ${fx(ex.v[1],1)} kN·m ada pada jarak ${fx(ex.x,1)} m dari A.`+(S.mu>0?' Gaya rem membuat A menahan gaya horizontal sehingga muncul gaya normal.':'');
}
function steps(ls,cu){
  const all=ls.concat(SP);
  if(!all.length)return '<p>Belum ada beban, jadi semua reaksi dan gaya dalam sama dengan 0.</p>';
  const M=memo(ls),R=M.R,n=R&&R.length,tot=all.reduce((q,l)=>q+l.P,0),HX=all.reduce((q,l)=>q+(l.s?l.H:S.mu*l.P),0),MAx=all.reduce((q,l)=>q+l.P*l.x,0);
  const pr=[];ls.slice(0,4).forEach(l=>pr.push(fx(l.P,1)+' kN di x = '+fx(l.x,1)+' m'));if(ls.length>4)pr.push('… (+'+(ls.length-4)+' beban kendaraan lain)');
  SL.u.forEach(u=>pr.push('merata q = '+u.q+' kN/m pada '+fx(u.x1,1)+'–'+fx(u.x2,1)+' m → W = q·ℓ = '+fx(u.q*(u.x2-u.x1))+' kN di x = '+fx((u.x1+u.x2)/2)+' m'));
  SL.t.forEach(t=>{const ln=t.x2-t.x1;pr.push('segitiga '+t.qa+'→'+t.qb+' kN/m pada '+fx(t.x1,1)+'–'+fx(t.x2,1)+' m → W = ½·q·ℓ = '+fx((t.qa+t.qb)/2*ln)+' kN di x = '+fx(t.x1+ln*(t.qa+2*t.qb)/(3*((t.qa+t.qb)||1)))+' m (⅓ℓ dari sisi terbesar)')});
  SL.p.forEach(p=>{const a=p.ang*Math.PI/180;pr.push('P = '+p.P+' kN ∠'+p.ang+'° di x = '+fx(p.x,1)+' m → P<sub>y</sub> = P·sin α = '+fx(p.P*Math.sin(a))+' kN, P<sub>x</sub> = P·cos α = '+fx(p.P*Math.cos(a))+' kN')});
  let o='<p><b>1. Beban.</b> '+pr.join('; ')+'. ΣP<sub>y</sub> = <b>'+fx(tot)+' kN</b>, ΣP<sub>x</sub> = <b>'+fx(HX)+' kN</b>, L = '+L+' m.</p>',chk;
  if(S.cant){
    o+='<p><b>2. Reaksi jepit A.</b> ΣV = 0 → V<sub>A</sub> = ΣP<sub>y</sub> = <b>'+fx(tot)+' kN</b>. ΣH = 0 → H<sub>A</sub> = −ΣP<sub>x</sub> = <b>'+fx(-HX)+' kN</b>. ΣM<sub>A</sub> = 0 → M<sub>A</sub> = ΣP<sub>y</sub>·x = <b>'+fx(MAx)+' kN·m</b>.</p>';
    chk='ΣV: '+fx(tot)+' − '+fx(tot)+' = 0 ✓';
  }else{
    const RA=R[0][1],RB=R[n-1][1];
    if(n===2)o+='<p><b>2. Reaksi tumpuan.</b> ΣM<sub>B</sub> = 0 → R<sub>A</sub> = ΣP·(L − x)/L = <b>'+fx(RA)+' kN</b>. ΣM<sub>A</sub> = 0 → R<sub>B</sub> = ΣP·x/L = <b>'+fx(RB)+' kN</b>. ΣH = 0 → H<sub>A</sub> = −ΣP<sub>x</sub> = <b>'+fx(-HX)+' kN</b>.</p>';
    else o+='<p><b>2. Reaksi tumpuan (balok menerus, '+n+' tumpuan).</b> Persamaan keseimbangan hanya 2 (ΣV, ΣM), sedangkan reaksi ada '+n+', maka struktur statis tak tentu derajat '+(n-2)+'. Dipakai metode fleksibilitas (EI tetap): tumpuan tengah dilepas jadi gaya redundan R<sub>T</sub>, lalu lendutan di tiap tumpuan tengah disyaratkan = 0 (δ<sub>beban</sub> − Σf·R<sub>T</sub> = 0). Hasil: '+R.map(([x,r],i)=>'R<sub>'+nmS(i,n)+'</sub> = <b>'+fx(r)+' kN</b> (x = '+fx(x,1)+' m)').join('; ')+'.</p>';
    chk='ΣV = '+R.map(r=>fx(r[1])).join(' + ')+' = '+fx(R.reduce((q,r)=>q+r[1],0))+' kN, ΣP<sub>y</sub> = '+fx(tot)+' kN '+(Math.abs(R.reduce((q,r)=>q+r[1],0)-tot)<.01?'✓':'✗');
  }
  let vmx=-1e9,vmn=1e9,mx=cu[0],mm=cu[0],nmax=0;
  cu.forEach(q=>{vmx=Math.max(vmx,q.v[0]);vmn=Math.min(vmn,q.v[0]);nmax=Math.max(nmax,Math.abs(q.v[2]));if(Math.abs(q.v[1])>Math.abs(mx.v[1]))mx=q});
  o+='<p><b>3. Gaya geser (D).</b> V(x) = ΣR di kiri x − ΣP di kiri x → V maks = <b>'+fx(vmx)+' kN</b>, V min = <b>'+fx(vmn)+' kN</b>.</p>';
  o+='<p><b>4. Momen lentur (M).</b> M(x) = ΣR·(x − x<sub>R</sub>) − ΣP·(x − x<sub>P</sub>) → |M| maks = <b>'+fx(Math.abs(mx.v[1]))+' kN·m</b> di x = '+fx(mx.x)+' m'+(S.cant?' (di jepitan, serat atas tertarik)':' (tempat V berubah tanda, dM/dx = V = 0)')+'.</p>';
  o+='<p><b>5. Gaya normal (N).</b> N(x) = ΣP<sub>x</sub> di kanan x (tarik +) → |N| maks = <b>'+fx(nmax)+' kN</b>.</p>';
  o+='<p><b>6. Kontrol.</b> '+chk+'.</p><p><b>7. Terhadap kapasitas.</b> |M|/M<sub>u</sub> = '+fx(Math.abs(mx.v[1])/S.Mu*100,0)+' %, V/V<sub>u</sub> = '+fx(Math.max(vmx,-vmn)/S.Vu*100,0)+' %.</p>';
  return o;
}

/* ---------- Keruntuhan & penggambaran utama ---------- */
function stress(r){
  const a=[102,112,128],b=[245,158,11],c=[220,38,38],mx=(p,q,t)=>p.map((v,i)=>Math.round(v+(q[i]-v)*t));
  return 'rgb('+(r<.7?a:r<.9?mx(a,b,(r-.7)/.2):mx(b,c,Math.min(1,(r-.9)/.1)))+')';
}
function resetFail(){FAIL=null;PART=[];$('alert').hidden=true}
const clamp01=v=>Math.max(0,Math.min(1,v));

function draw(t){
  const fg=css('--fg'),mu=css('--muted'),ln=css('--line'),cV=css('--v'),cM=css('--m'),cN=css('--n');
  const now=performance.now(),tc=FAIL?(now-FAIL.t0)/1000:0,dt=Math.min((now-(draw.l||now))/1000,.05);draw.l=now;
  ctx.clearRect(0,0,W,H);ctx.save();
  if(FAIL&&tc<.7){const s=6*(1-tc/.7);ctx.translate((Math.random()-.5)*s,(Math.random()-.5)*s)}
  const x0=48,x1=W-48,sx=x=>x0+x/L*(x1-x0),cw=sx(1)-sx(0);
  const ls=loads(S.xf),cu=curve(ls),deckY=H*.19,deckH=12,wy=deckY+deckH+42;
  let a=0,b=0,c=0,d=0,xm=0;
  let cs=0;cu.forEach(q=>{a=Math.max(a,q.v[0]);b=Math.min(b,q.v[0]);if(Math.abs(q.v[1])>c){c=Math.abs(q.v[1]);cs=q.v[1];xm=q.x}d=Math.max(d,q.v[2])});
  const rM=c/S.Mu,rV=Math.max(a,-b)/S.Vu,r=Math.max(rM,rV);
  LAST={ls,cu,r,xm};
  if(!FAIL&&$('col').checked&&r>=1){
    const mode=rM>=rV?'lentur':'geser';
    let xc=xm;if(mode==='geser'){const q=cu.reduce((p,q)=>Math.abs(q.v[0])>Math.abs(p.v[0])?q:p);xc=q.x<L/2?L*.15:L*.85}
    xc=S.cant?L*.06:Math.min(Math.max(xc,L*.15),L*.85);
    FAIL={t0:now,xc,mode,sp:false};
    for(let i=0;i<50;i++)PART.push({k:i<16?'dust':'chip',x:sx(xc),y:deckY+6,vx:(Math.random()-.5)*170,vy:-Math.random()*160-20,s:2+Math.random()*4,life:1.3+Math.random(),c:Math.random()<.5?'#8b8f98':'#c0c4cc'});
    $('atext').textContent='Jembatan runtuh! '+(mode==='lentur'?'Momen lentur melampaui kapasitas':'Gaya geser melampaui kapasitas')+' (retak di x = '+xc.toFixed(1)+' m).';
    $('alert').hidden=false;
  }
  const amp=FAIL?16:16*Math.pow(Math.min(r,1),1.6),sag=x=>{if(x<0)return 0;if(S.cant){const u=Math.min(x,L);return amp*(3*u*u*L-u*u*u)/(2*L*L*L)}return x>L?0:amp*Math.sin(Math.PI*x/L)},slope=x=>{if(x<0)return 0;if(S.cant){const u=Math.min(x,L);return Math.atan(amp*(6*u*L-3*u*u)/(2*L*L*L)/cw)}return x>L?0:Math.atan(amp*Math.PI/L*Math.cos(Math.PI*x/L)/cw)};
  // langit & air
  ctx.fillStyle=css('--cloud');
  [[.1,.25,1],[.45,.12,1.3],[.75,.3,.8]].forEach(([p,q,s],i)=>{
    const cx=((p*W+t*.008*(i+1))%(W+240))-120,cy=deckY*q*1.2+8;
    [[0,0,34],[30,6,26],[-30,8,24],[8,-10,22]].forEach(([dx,dy,rr_])=>{ctx.beginPath();ctx.ellipse(cx+dx*s,cy+dy*s,rr_*s*1.3,rr_*s*.7,0,0,7);ctx.fill()})});
  const wg=ctx.createLinearGradient(0,wy,0,wy+24);wg.addColorStop(0,'rgba(96,165,250,.45)');wg.addColorStop(1,'rgba(37,99,235,.25)');
  ctx.fillStyle=wg;ctx.beginPath();ctx.moveTo(x0-24,wy+24);
  for(let x=x0-24;x<=x1+24;x+=6)ctx.lineTo(x,wy+Math.sin(x*.05+now*.002)*2);
  ctx.lineTo(x1+24,wy+24);ctx.closePath();ctx.fill();
  ctx.font='12px '+FAM;ctx.textBaseline='middle';

  ctx.fillStyle='rgba(120,130,150,.55)';ctx.fillRect(0,deckY,x0,deckH);if(!S.cant)ctx.fillRect(x1,deckY,W-x1,deckH);
  // dek: keseluruhan (normal) atau dua potongan (runtuh)
  const col=stress(FAIL?1:r),path=(xa,xb)=>{ctx.beginPath();const n=Math.max(2,Math.ceil((xb-xa)/L*70));for(let i=0;i<=n;i++){const x=xa+(xb-xa)*i/n,X=sx(x),Y=deckY+deckH/2+sag(x);i?ctx.lineTo(X,Y):ctx.moveTo(X,Y)}};
  const th=FAIL&&tc>.9?Math.min(1.15,1.6*Math.pow(tc-.9,2)):0,dyp=FAIL&&tc>2.3?160*Math.pow(tc-2.3,2):0,dyi=FAIL&&tc>1?380*Math.pow(tc-1,2):0;
  const side=it=>FAIL?((S.xf+it.off+it.v.mo/2)<FAIL.xc?0:1):0;
  const xfm=piece=>{if(S.cant&&!piece)return;ctx.translate(0,dyp);const px=S.cant?sx(FAIL.xc):piece?x1:x0,py=deckY+deckH/2;ctx.translate(px,py);ctx.rotate(S.cant?th:piece?-th:th);ctx.translate(-px,-py)};
  ctx.lineCap='butt';ctx.strokeStyle=col;ctx.lineWidth=deckH;
  if(!FAIL){path(0,L);ctx.stroke()}
  else{
    [[0,FAIL.xc],[FAIL.xc,L]].forEach(([xa,xb],pc)=>{
      ctx.save();ctx.globalAlpha=(S.cant&&!pc)?1:clamp01(1-dyp/90);xfm(pc);ctx.strokeStyle=col;ctx.lineWidth=deckH;path(xa,xb);ctx.stroke();
      const ex=sx(FAIL.xc),ey=deckY+deckH/2+sag(FAIL.xc),dir=pc?1:-1;ctx.fillStyle=col;
      for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(ex,ey-deckH/2+i*4);ctx.lineTo(ex+dir*(3+i%2*3),ey-deckH/2+i*4+2);ctx.lineTo(ex,ey-deckH/2+i*4+4);ctx.fill()}
      ctx.restore();
    });
  }
  // retakan
  if(r>.85||FAIL){const cx=FAIL?FAIL.xc:xm,X=sx(cx),Y=deckY+deckH+sag(cx);
    if(!FAIL||tc<1.2){ctx.strokeStyle='#450a0a';ctx.lineWidth=1.5;ctx.beginPath();
      [[0,0,-3,7],[-1,3,3,9],[2,1,0,10]].forEach(([p,q,u,v])=>{ctx.moveTo(X+p*2,Y-deckH+q);ctx.lineTo(X+p*2+u,Y+v)});ctx.stroke()}}

  // kendaraan
  const tops=new Map();
  (NOV?[]:items).forEach(it=>{
    const cxm=S.xf+it.off+it.v.mo/2,X=sx(cxm),yo=sag(cxm),ang=slope(cxm);
    ctx.save();
    if(FAIL){const dd=dyp+dyi,sd=side(it);ctx.globalAlpha=clamp01(1-(dd-60)/90);ctx.translate(0,dd);const px=S.cant?sx(FAIL.xc):sd?x1:x0,py=deckY+deckH/2;ctx.translate(px,py);ctx.rotate(S.cant?(sd?th:0):sd?-th:th);ctx.translate(-px,-py)}
    ctx.translate(X,deckY+yo);ctx.rotate(ang);ctx.translate(-X,-deckY);
    tops.set(it,drawItem(it,sx,cw,deckY)+yo);ctx.restore();
  });
  if(!FAIL){
    ctx.strokeStyle=cM;ctx.fillStyle=cM;ctx.lineWidth=2;ctx.textAlign='center';ctx.font='12px '+FAM;
    let lastX=-99;ls.sort((p,q)=>p.x-q.x).forEach(l=>{const X=sx(l.x),y1=tops.get(l.it)-4,y0=y1-16;
      ctx.beginPath();ctx.moveTo(X,y0);ctx.lineTo(X,y1);ctx.stroke();
      ctx.beginPath();ctx.moveTo(X,y1+3);ctx.lineTo(X-4,y1-5);ctx.lineTo(X+4,y1-5);ctx.fill();
      if(X-lastX>26){ctx.fillText(l.P.toFixed(l.P<10?1:0),X,y0-7);lastX=X}});
  }
  if(!FAIL){ctx.strokeStyle=cV;ctx.fillStyle=cV;ctx.lineWidth=1.6;ctx.textAlign='center';ctx.font='12px '+FAM;
    const ar=(X,y0,y1)=>{ctx.beginPath();ctx.moveTo(X,y0);ctx.lineTo(X,y1);ctx.stroke();ctx.beginPath();ctx.moveTo(X,y1+1);ctx.lineTo(X-3.5,y1-6);ctx.lineTo(X+3.5,y1-6);ctx.fill()};
    const dist=(a,b,qa,qb,lab)=>{const mq=Math.max(qa,qb)||1,hh=34,X1=sx(a),X2=sx(b),n=Math.max(2,Math.round((X2-X1)/16)),tp=i=>[sx(a+(b-a)*i/n),deckY-2-Math.max(3,(qa+(qb-qa)*i/n)/mq*hh)];
      ctx.beginPath();for(let i=0;i<=n;i++){const p=tp(i);i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])}ctx.stroke();
      for(let i=0;i<=n;i++){const p=tp(i);ar(p[0],p[1],deckY-3)}ctx.fillText(lab,(X1+X2)/2,deckY-hh-12)};
    SL.u.forEach(u=>dist(u.x1,u.x2,u.q,u.q,'q = '+u.q+' kN/m'));
    SL.t.forEach(t=>dist(t.x1,t.x2,t.qa,t.qb,t.qa+' → '+t.qb+' kN/m'));
    SL.p.forEach(p=>{const a=p.ang*Math.PI/180,X=sx(p.x),dx=Math.cos(a)*44,dy=Math.sin(a)*44,g=Math.atan2(dy,dx);ctx.beginPath();ctx.moveTo(X-dx,deckY-2-dy);ctx.lineTo(X,deckY-2);ctx.stroke();
      ctx.beginPath();ctx.moveTo(X,deckY-2);ctx.lineTo(X-8*Math.cos(g-.4),deckY-2-8*Math.sin(g-.4));ctx.lineTo(X-8*Math.cos(g+.4),deckY-2-8*Math.sin(g+.4));ctx.fill();ctx.fillText(p.P+' kN ∠'+p.ang+'°',X-dx,deckY-dy-10)})}
  // tumpuan & label
  ctx.fillStyle=fg;
  if(S.cant){const wx=x0-14,wt=deckY-18,wh=deckH+66;ctx.fillRect(wx,wt,14,wh);ctx.strokeStyle=mu;ctx.lineWidth=1.5;for(let i=0;i<7;i++){ctx.beginPath();ctx.moveTo(wx,wt+8+i*10);ctx.lineTo(wx-8,wt+16+i*10);ctx.stroke()}}
  else{ctx.beginPath();ctx.moveTo(x0,deckY+deckH);ctx.lineTo(x0-14,deckY+deckH+24);ctx.lineTo(x0+14,deckY+deckH+24);ctx.fill();
  ctx.beginPath();ctx.arc(x1,deckY+deckH+10,9,0,7);ctx.fill();ctx.fillRect(x1-16,deckY+deckH+21,32,3)}
  supX().slice(1,S.cant?1:-1).forEach((x,i)=>{const X=sx(x);ctx.beginPath();ctx.moveTo(X,deckY+deckH);ctx.lineTo(X-12,deckY+deckH+22);ctx.lineTo(X+12,deckY+deckH+22);ctx.fill();ctx.fillStyle=mu;ctx.textAlign='center';ctx.fillText('T'+(i+1),X,wy+34);ctx.fillStyle=fg});
  ctx.fillStyle=mu;ctx.textAlign='center';ctx.font='12px '+FAM;
  ctx.fillText(S.cant?'A (jepit)':'A (sendi)',x0,wy+34);ctx.fillText(S.cant?'B (ujung bebas)':'B (rol)',x1,wy+34);ctx.fillText('L = '+L+' m',(x0+x1)/2,wy+34);

  // percikan air, debu, serpihan
  if(FAIL){
    if(tc<1.5&&Math.random()<.6)PART.push({k:'dust',x:sx(FAIL.xc)+(Math.random()-.5)*20,y:deckY+8,vx:(Math.random()-.5)*50,vy:-10-Math.random()*30,s:3+Math.random()*3,life:1.2});
    if(!FAIL.sp&&dyp>70){FAIL.sp=true;(S.cant?[sx((FAIL.xc+L)/2)]:[sx(FAIL.xc*.5),sx((FAIL.xc+L)/2)]).forEach(X=>{for(let i=0;i<24;i++)PART.push({k:'drop',x:X+(Math.random()-.5)*40,y:wy,vx:(Math.random()-.5)*120,vy:-Math.random()*240-60,s:2+Math.random()*2,life:1.5})})}
  }
  PART.forEach(p=>{p.vy+=(p.k==='dust'?-18:520)*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;if(p.k==='drop'&&p.y>wy+3&&p.vy>0)p.life=0});
  PART=PART.filter(p=>p.life>0);
  PART.forEach(p=>{
    if(p.k==='dust'){ctx.fillStyle='rgba(205,210,220,'+Math.min(.5,p.life*.4)+')';ctx.beginPath();ctx.arc(p.x,p.y,p.s*(1+Math.max(0,1.6-p.life)*2.2),0,7);ctx.fill()}
    else if(p.k==='drop'){ctx.fillStyle='rgba(147,197,253,.9)';ctx.beginPath();ctx.arc(p.x,p.y,p.s,0,7);ctx.fill()}
    else{ctx.fillStyle=p.c;ctx.fillRect(p.x,p.y,p.s,p.s)}
  });

  // peringatan
  ctx.textAlign='left';ctx.font='600 14px '+FAM;
  if(!FAIL&&r>.85){ctx.globalAlpha=.65+.35*Math.sin(now/180);ctx.fillStyle=cM;ctx.fillText('⚠ Mendekati batas kapasitas',x0,14);ctx.globalAlpha=1}
  if(FAIL){ctx.fillStyle=cM;ctx.font='700 18px Georgia,serif';ctx.fillText('JEMBATAN RUNTUH',x0,16);
    if(tc<.6){ctx.fillStyle='rgba(220,38,38,'+.2*(1-tc/.6)+')';ctx.fillRect(-10,-10,W+20,H+20)}}

  // diagram
  const pt=deckY+deckH+82,ph=(H-pt-8)/3,showEnv=$('env').checked;
  if(FAIL)ctx.globalAlpha=.4;
  [{t:'SFD – gaya geser (kN)',c:cV,i:0,s:sc.v,sg:1,k:'v'},{t:'BMD – momen lentur (kN·m)',c:cM,i:1,s:sc.m,sg:-1,k:'m'},{t:'NFD – gaya normal (kN)',c:cN,i:2,s:sc.n,sg:-1,k:'n'}].forEach((p,j)=>{
    const y0=pt+j*ph+ph/2,half=ph/2-14,f=v=>y0+p.sg*(-v)/p.s*half;
    ctx.strokeStyle=ln;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y0);ctx.stroke();
    ctx.fillStyle=mu;ctx.textAlign='left';ctx.font='12px '+FAM;ctx.fillText(p.t,x0,y0-half-4);
    if(showEnv&&env){
      ctx.setLineDash([4,3]);ctx.strokeStyle=p.c;ctx.globalAlpha*=.45;
      (p.k==='v'?[env.vmax,env.vmin]:p.k==='m'?[S.cant?env.mmin:env.mmax]:[env.nmax]).forEach(e=>{ctx.beginPath();XS.forEach((s,i)=>{i?ctx.lineTo(sx(s),f(e[i])):ctx.moveTo(sx(s),f(e[i]))});ctx.stroke()});
      ctx.setLineDash([]);ctx.globalAlpha/=.45;
    }
    const cap=p.k==='m'?[S.cant?-S.Mu:S.Mu]:p.k==='v'?[S.Vu,-S.Vu]:[];
    cap.forEach(v=>{if(Math.abs(v)<=p.s*1.25){ctx.setLineDash([2,3]);ctx.strokeStyle=cM;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x0,f(v));ctx.lineTo(x1,f(v));ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle=cM;ctx.textAlign='right';ctx.fillText('kapasitas '+Math.abs(v),x1,f(v)+(v>0&&p.k==='m'?10:-8))}});
    ctx.beginPath();ctx.moveTo(sx(0),y0);cu.forEach(q=>ctx.lineTo(sx(q.x),f(q.v[p.i])));ctx.lineTo(sx(L),y0);ctx.closePath();
    const ga=ctx.globalAlpha;ctx.globalAlpha=ga*.25;ctx.fillStyle=p.c;ctx.fill();ctx.globalAlpha=ga;ctx.strokeStyle=p.c;ctx.lineWidth=2;ctx.stroke();
    let ex=cu[0];cu.forEach(q=>{if(Math.abs(q.v[p.i])>Math.abs(ex.v[p.i]))ex=q});
    if(Math.abs(ex.v[p.i])>.05){ctx.fillStyle=p.c;ctx.textAlign='center';const yy=f(ex.v[p.i]);
      ctx.fillText(ex.v[p.i].toFixed(1),Math.min(Math.max(sx(ex.x),x0+20),x1-20),yy+(yy<y0?-9:9))}
  });
  ctx.globalAlpha=1;
  if(!FAIL){ctx.setLineDash([3,4]);ctx.strokeStyle=mu;ctx.lineWidth=1;
    ls.forEach(l=>{ctx.beginPath();ctx.moveTo(sx(l.x),wy+40);ctx.lineTo(sx(l.x),H-8);ctx.stroke()});ctx.setLineDash([])}
  ctx.restore();
  $('s1').textContent=a.toFixed(1)+' kN';$('s2').textContent=b.toFixed(1)+' kN';$('s3').textContent=cs.toFixed(1)+' kN·m';$('s4').textContent=d.toFixed(1)+' kN';
  $('story').textContent=story(ls,cu);
  if(now-(steps.t||0)>180){steps.t=now;const h=steps(ls,cu);if(h!==steps.h){steps.h=h;$('steps').innerHTML=h}}
  $('bar').style.width=Math.min(100,r*100)+'%';$('bar').style.background=stress(r);
  $('gtext').textContent=(r*100).toFixed(0)+' % dari kapasitas ('+(rM>=rV?'lentur':'geser')+')';
}

function labels(){
  $('pv').textContent=S.xf.toFixed(1)+' m';$('sv').textContent=S.speed+' m/s';$('mv').textContent=Math.round(S.mu*100)+' %';
  $('lv').textContent=L+' m';$('cmv').textContent=S.Mu+' kN·m';$('cvv').textContent=S.Vu+' kN';
}
function setRows(l){rows=l;renderRows();buildConvoy(false)}
function setVeh(id){
  document.querySelectorAll('.chip[data-id]').forEach(c=>c.classList.toggle('on',c.dataset.id===id));
  setRows([{id,w:byId[id].w,gap:8}]);
}
function numField(t,val,fn,off){
  const l=document.createElement('label');l.textContent=t;
  const inp=document.createElement('input');inp.type='number';inp.step='any';inp.min=0;inp.value=off?'':val;inp.disabled=!!off;
  inp.oninput=()=>{const v=parseFloat(inp.value);if(v>=0)fn(v)};
  l.appendChild(inp);return l;
}
function renderRows(){
  const box=$('rows');box.innerHTML='';
  rows.forEach((r,i)=>{
    const d=document.createElement('div');d.className='rw';
    const sel=document.createElement('select');sel.innerHTML=VEH.map(v=>`<option value="${v.id}">${v.n}</option>`).join('');sel.value=r.id;
    sel.onchange=()=>{r.id=sel.value;r.w=byId[r.id].w;renderRows();buildConvoy(true)};
    const w=numField('Berat (kN)',r.w,v=>{r.w=v;buildConvoy(true)});
    const g=numField('Jarak ke depan (m)',r.gap,v=>{r.gap=v;buildConvoy(true)},i===0);
    const x=document.createElement('button');x.className='chip';x.textContent='✕';x.setAttribute('aria-label','Hapus beban');x.disabled=rows.length<2;
    x.onclick=()=>{rows.splice(i,1);renderRows();buildConvoy(true)};
    d.append(sel,w,g,x);box.appendChild(d);
  });
}
$('addsel').innerHTML=VEH.map(v=>`<option value="${v.id}">${v.n}</option>`).join('');
$('addsel').value='car';
$('add').onclick=()=>{if(rows.length<10){const id=$('addsel').value;rows.push({id,w:byId[id].w,gap:8});renderRows();buildConvoy(true)}};
$('mixb').onclick=()=>{document.querySelectorAll('.chip[data-id]').forEach(c=>c.classList.remove('on'));setRows(MIX.slice(0,6).map(id=>({id,w:byId[id].w,gap:8})))};
VEH.forEach(v=>{const b=document.createElement('button');b.className='chip';b.textContent=v.n;b.dataset.id=v.id;b.onclick=()=>setVeh(v.id);$('veh').appendChild(b)});

const SLOW=matchMedia('(pointer:coarse)').matches;let lastDraw=0;
function loop(t){
  if(SLOW&&!FAIL&&t-lastDraw<33){requestAnimationFrame(loop);return}lastDraw=t;
  const dt=Math.min((t-S.last)/1000||0,.05);S.last=t;
  if(S.playing&&!FAIL){S.xf+=S.speed*dt;if(S.xf>S.xmax)S.xf=S.xmin;$('pos').value=S.xf;labels()}
  draw(t);if(VIEW3)draw3(t);requestAnimationFrame(loop);
}
$('pos').oninput=e=>{if(FAIL){e.target.value=S.xf;return}S.xf=+e.target.value;S.playing=false;$('play').textContent='▶ Putar';labels()};
$('spd').oninput=e=>{S.speed=+e.target.value;labels()};


$('L').oninput=e=>{L=+e.target.value;buildConvoy(true)};



$('mu').oninput=e=>{S.mu=e.target.value/100;buildEnv();labels()};
$('play').onclick=()=>{S.playing=!S.playing;$('play').textContent=S.playing?'⏸ Jeda':'▶ Putar'};
$('cm').oninput=e=>{S.Mu=+e.target.value;resetFail();labels()};
$('cs').oninput=e=>{S.Vu=+e.target.value;resetFail();labels()};
$('col').onchange=resetFail;
$('rebuild').onclick=()=>{resetFail();S.xf=S.xmin;S.playing=true;$('play').textContent='⏸ Jeda'};
$('stype').onchange=e=>{S.cant=e.target.value==='cant';S.Mu=S.cant?6500:1500;S.Vu=S.cant?450:350;$('cm').value=S.Mu;$('cs').value=S.Vu;buildConvoy(false)};
addEventListener('resize',resize);
resize();setVeh('truck');requestAnimationFrame(loop);
