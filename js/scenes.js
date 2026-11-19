"use strict";
/* ============================================================
   SCENES — renderer, lights and every environment.
   Trees/lamps are instanced (few draw calls); particles are GPU shaders.
   ============================================================ */
let R;
try{R=new THREE.WebGLRenderer({canvas:$('#c'),antialias:true,powerPreference:'high-performance'})}
catch(e){document.body.insertAdjacentHTML('beforeend','<p style="position:fixed;inset:0;z-index:99;display:grid;place-items:center;background:#07050d;color:#fff;font:22px Georgia,serif;text-align:center;padding:24px">This film needs WebGL. Please open it in an up-to-date Chrome or Edge.</p>');throw e}
R.setPixelRatio(Q.pr);R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.15;
const S=new THREE.Scene();S.background=new THREE.Color(0x0a0618);S.fog=new THREE.FogExp2(0x1b1030,.021);
const cam=new THREE.PerspectiveCamera(55,1,.1,400),look=new THREE.Vector3();
const U={t:{value:0},s:{value:1}};

/* ---------- lights ---------- */
S.add(new THREE.HemisphereLight(0x8f7bd6,0x2a1020,.7));
const moonL=new THREE.DirectionalLight(0x9db4ff,.9);moonL.position.set(-30,40,-60);S.add(moonL);
const warm=new THREE.PointLight(0xffc48a,0,16);warm.position.set(0,2.3,DZ-6.5);S.add(warm);

/* ---------- glow helpers ---------- */
function glowTex(rgb){const k=document.createElement('canvas');k.width=k.height=64;const g=k.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);
 r.addColorStop(0,`rgba(${rgb},1)`);r.addColorStop(.3,`rgba(${rgb},.3)`);r.addColorStop(1,`rgba(${rgb},0)`);g.fillStyle=r;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(k)}
const GT={gold:glowTex('255,205,130'),moon:glowTex('190,205,255'),rose:glowTex('255,150,190'),white:glowTex('255,246,232'),violet:glowTex('150,110,255')};
function glow(tex,sc,x,y,z,op=1,parent=S){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,opacity:op,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));
 s.scale.setScalar(sc);s.position.set(x,y,z);parent.add(s);return s}
// many small glows in a single draw call
function glowPoints(list,tex,size,op=.9){const g=new THREE.BufferGeometry(),p=new Float32Array(list.length*3);list.forEach((v,i)=>p.set(v,i*3));
 g.setAttribute('position',new THREE.BufferAttribute(p,3));
 const m=new THREE.Points(g,new THREE.PointsMaterial({map:tex,size,transparent:true,opacity:op,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true,fog:false}));m.frustumCulled=false;S.add(m);return m}

/* ---------- sky: stars + moon ---------- */
(()=>{const n=Math.round(900*Q.scale+300),p=new Float32Array(n*3);for(let i=0;i<n;i++){const a=rnd(0,6.283),e=rnd(.08,1.2),r=300;p.set([Math.cos(a)*Math.cos(e)*r,Math.sin(e)*r,Math.sin(a)*Math.cos(e)*r],i*3)}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));
 S.add(new THREE.Points(g,new THREE.PointsMaterial({size:1.6,color:0xdfe6ff,fog:false,sizeAttenuation:false,transparent:true,opacity:.8})));
 const m=new THREE.Mesh(new THREE.SphereGeometry(9,32,32),new THREE.MeshBasicMaterial({color:0xfff3dc,fog:false}));m.position.set(-60,75,-250);S.add(m);
 glow(GT.moon,170,-60,75,-250,.7)})();

/* ---------- ground, path, petals on the ground ---------- */
const ground=new THREE.Mesh(new THREE.PlaneGeometry(400,400),new THREE.MeshStandardMaterial({color:0x140c24,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.z=-60;S.add(ground);
const path=new THREE.Mesh(new THREE.PlaneGeometry(4.2,210),new THREE.MeshStandardMaterial({color:0x34234a,roughness:.85,emissive:0x1a0f2a}));path.rotation.x=-Math.PI/2;path.position.set(0,.02,-75);S.add(path);
function petalFloor(n,fn){const im=new THREE.InstancedMesh(new THREE.CircleGeometry(.07,5),new THREE.MeshBasicMaterial({color:0xffb7c5,side:THREE.DoubleSide}),n),d=new THREE.Object3D();
 for(let i=0;i<n;i++){fn(d,i);d.rotation.set(-Math.PI/2,0,rnd(0,6.3));d.scale.setScalar(rnd(.7,1.7));d.updateMatrix();im.setMatrixAt(i,d.matrix)}S.add(im)}
petalFloor(Math.round(700*Q.scale+150),d=>d.position.set(rnd(-2.2,2.2)*(Math.random()<.7?1:3.5),.04,rnd(30,DZ-14)));

/* ---------- sakura trees (instanced: 3 draw calls for every tree) ---------- */
const blobG=new THREE.IcosahedronGeometry(1,2);
(()=>{const p=blobG.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=1+.17*Math.sin(x*5)*Math.cos(y*4+z*3);p.setXYZ(i,x*k,y*k*.82,z*k)}blobG.computeVertexNormals()})();
const petalM=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0x8a2f58,emissiveIntensity:.55,roughness:.9,flatShading:true});
const barkM=new THREE.MeshStandardMaterial({color:0x2d1a22,roughness:1});
const TREES={blobs:[],trunks:[],branches:[]};
const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_v=new THREE.Vector3(),_s=new THREE.Vector3(),_tm=new THREE.Matrix4();
function tree(x,z,s){
 _tm.compose(_v.set(x,0,z),_q.setFromEuler(_e.set(0,rnd(0,6),0)),_s.set(1,1,1));const base=_tm.clone();
 const put=(list,px,py,pz,rx,rz,sx,sy,sz)=>{_m.compose(_v.set(px,py,pz),_q.setFromEuler(_e.set(rx,0,rz)),_s.set(sx,sy,sz));list.push(base.clone().multiply(_m))};
 put(TREES.trunks,0,2.1*s,0,0,0,s,s,s);
 for(let i=0;i<8;i++){const a=i*2.4;
  put(TREES.blobs,Math.cos(a)*1.9*s,(4.2+Math.sin(i*1.7)*.8)*s,Math.sin(a)*1.9*s,0,0,(1.2+(i%3)*.35)*s,(1.2+(i%3)*.35)*s,(1.2+(i%3)*.35)*s);
  if(i<5)put(TREES.branches,Math.cos(a)*.8*s,3.5*s,Math.sin(a)*.8*s,Math.sin(a)*.8,-Math.cos(a)*.8,s,s,s)}}
function buildTrees(){
 const mk=(geo,mat,list,color)=>{if(!list.length)return;const im=new THREE.InstancedMesh(geo,mat,list.length);
  list.forEach((m,i)=>{im.setMatrixAt(i,m);if(color)im.setColorAt(i,new THREE.Color().setHSL(rnd(.93,.99),rnd(.55,.85),rnd(.72,.82)))});
  im.instanceMatrix.needsUpdate=true;im.frustumCulled=false;S.add(im)};
 mk(blobG,petalM,TREES.blobs,true);
 mk(new THREE.CylinderGeometry(.16,.36,4.2,7),barkM,TREES.trunks);
 mk(new THREE.CylinderGeometry(.04,.09,2.2,5),barkM,TREES.branches);
 TREES.blobs.length=TREES.trunks.length=TREES.branches.length=0}
for(let z=14;z>DZ-6;z-=17)[-1,1].forEach(sd=>tree(sd*rnd(7,10.5),z+rnd(-3,3),rnd(.9,1.25)));
tree(-13,DZ-8,1.9);tree(13,DZ-12,1.6);

/* ---------- lanterns + torii gate ---------- */
const lant=[],lampM=new THREE.MeshBasicMaterial({color:0xffd9a0,fog:false}),postM=new THREE.MeshStandardMaterial({color:0x1c1226});
const lampSpots=[];
for(let z=10;z>DZ+8;z-=14)[-3.2,3.2].forEach(x=>{lampSpots.push([x,z]);lant.push(glow(GT.gold,3.2,x,2.3,z,.9))});
(()=>{const n=lampSpots.length,posts=new THREE.InstancedMesh(new THREE.CylinderGeometry(.04,.06,2.2,6),postM,n),lamps=new THREE.InstancedMesh(new THREE.SphereGeometry(.17,12,12),lampM,n),d=new THREE.Object3D();
 lampSpots.forEach(([x,z],i)=>{d.position.set(x,1.1,z);d.updateMatrix();posts.setMatrixAt(i,d.matrix);d.position.set(x,2.3,z);d.updateMatrix();lamps.setMatrixAt(i,d.matrix)});S.add(posts,lamps)})();
(()=>{const m=new THREE.MeshStandardMaterial({color:0x8d1f33,roughness:.6,emissive:0x2a0610}),z=-48;
 [-2.6,2.6].forEach(x=>{const c=new THREE.Mesh(new THREE.CylinderGeometry(.22,.26,6,10),m);c.position.set(x,3,z);S.add(c)});
 const a=new THREE.Mesh(new THREE.BoxGeometry(7.6,.38,.5),m);a.position.set(0,5.9,z);S.add(a);
 const b=new THREE.Mesh(new THREE.BoxGeometry(6,.22,.3),m);b.position.set(0,5.0,z);S.add(b)})();

/* ---------- temple, hall materials + builders ---------- */
const goldM=new THREE.MeshStandardMaterial({color:0xd9a441,metalness:.6,roughness:.35,emissive:0x3a2406}),redM=new THREE.MeshStandardMaterial({color:0x8d1f33,roughness:.6,emissive:0x2a0610}),stoneM=new THREE.MeshStandardMaterial({color:0x3a2f4d,roughness:.9}),roofM=new THREE.MeshStandardMaterial({color:0x241631,roughness:.7,flatShading:true});
const box=(w,h,d,m,x,y,z)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.set(x,y,z);S.add(b);return b};
const cyl=(r,h,m,x,y,z)=>{const c=new THREE.Mesh(new THREE.CylinderGeometry(r,r*1.1,h,12),m);c.position.set(x,y,z);S.add(c);return c};
const roof=(r,h,y,z)=>{const c=new THREE.Mesh(new THREE.ConeGeometry(r,h,4),roofM);c.rotation.y=Math.PI/4;c.scale.set(1.25,1,.9);c.position.set(0,y,z);S.add(c)};
(()=>{const z=DZ-16;
 box(12,.5,9,stoneM,0,.25,z);box(10.4,.5,7.6,stoneM,0,.75,z);box(4,.3,1.4,stoneM,0,.15,z+5.2);box(8,4.4,5.2,stoneM,0,3,z);
 [-3.6,-1.8,0,1.8,3.6].forEach(x=>cyl(.26,4.4,redM,x,3,z+3.4));
 box(8.6,.4,.5,goldM,0,5.4,z+3.4);box(9.4,.3,.9,redM,0,5.75,z+3.2);
 const door=new THREE.Mesh(new THREE.PlaneGeometry(2.4,3.4),new THREE.MeshBasicMaterial({color:0xffd9a0,fog:false}));door.position.set(0,2.5,z+2.62);S.add(door);
 roof(6.6,2.6,7.2,z);roof(4.4,2.2,9.2,z);const sp=new THREE.Mesh(new THREE.SphereGeometry(.28,12,12),goldM);sp.position.set(0,10.6,z);S.add(sp);
 glow(GT.gold,11,0,2.6,z+3.4,.8);glow(GT.gold,4,0,10.6,z,.9);
 [-4.6,4.6].forEach(x=>{cyl(.05,2,postM,x,1.5,z+4.6);const l=new THREE.Mesh(new THREE.SphereGeometry(.2,12,12),lampM);l.position.set(x,2.7,z+4.6);S.add(l);lant.push(glow(GT.gold,3.4,x,2.7,z+4.6,.9))})})();

/* ---------- photos: lazy-loaded textures, placeholder until the real image arrives ---------- */
const Photos={mats:[],loaded:false,
 placeholderCanvas(i){const k=document.createElement('canvas');k.width=270;k.height=360;const g=k.getContext('2d'),gr=g.createLinearGradient(0,0,270,360);
  gr.addColorStop(0,'#5b2a52');gr.addColorStop(1,'#1e1233');g.fillStyle=gr;g.fillRect(0,0,270,360);g.fillStyle='rgba(243,217,164,.75)';g.font='italic 22px Georgia,serif';g.textAlign='center';
  g.fillText('photo-0'+(i+1)+'.jpg',135,185);return k},
 load(){if(this.loaded)return;this.loaded=true;const L=new THREE.TextureLoader(),maxA=R.capabilities.getMaxAnisotropy();
  CFG.photos.forEach((p,i)=>L.load(p.src,t=>{t.anisotropy=Math.min(4,maxA);const old=this.mats[i].map;this.mats[i].map=t;this.mats[i].needsUpdate=true;if(old)old.dispose();
    if(i===0)$('#fin img').src=p.src},undefined,()=>console.warn('Photo not found:',p.src)));
  const fin=$('#fin img');fin.onerror=()=>{fin.onerror=null;fin.src=this.placeholderCanvas(0).toDataURL()};fin.src=CFG.photos[0].src}};
const vigTex=(()=>{const k=document.createElement('canvas');k.width=k.height=128;const g=k.getContext('2d'),r=g.createRadialGradient(64,64,30,64,64,92);
 r.addColorStop(0,'rgba(10,4,20,0)');r.addColorStop(1,'rgba(10,4,20,.55)');g.fillStyle=r;g.fillRect(0,0,128,128);return new THREE.CanvasTexture(k)})();

/* ---------- palace hall: x offset HX, runs toward -z; photos hang on the walls ---------- */
(()=>{const fl=new THREE.Mesh(new THREE.PlaneGeometry(15,104),new THREE.MeshStandardMaterial({color:0x2a1c3c,roughness:.3,metalness:.35}));fl.rotation.x=-Math.PI/2;fl.position.set(HX,0,-42);S.add(fl);
 const rug=new THREE.Mesh(new THREE.PlaneGeometry(3.2,104),new THREE.MeshStandardMaterial({color:0x7a1a30,roughness:.9}));rug.rotation.x=-Math.PI/2;rug.position.set(HX,.02,-42);S.add(rug);
 [-7.6,7.6].forEach(x=>box(.4,9,104,stoneM,HX+x,4.5,-42));box(15.6,.4,104,roofM,HX,9,-42);box(15.6,9,.4,stoneM,HX,4.5,-94);
 const cols=[];for(let z=6;z>-92;z-=9)[-4.4,4.4].forEach(x=>cols.push([x,z]));
 const cs=new THREE.InstancedMesh(new THREE.CylinderGeometry(.34,.37,9,12),redM,cols.length),bs=new THREE.InstancedMesh(new THREE.BoxGeometry(1,.3,1),goldM,cols.length*2),d=new THREE.Object3D(),gl=[];
 cols.forEach(([x,z],i)=>{d.position.set(HX+x,4.5,z);d.updateMatrix();cs.setMatrixAt(i,d.matrix);
  d.position.set(HX+x,.15,z);d.updateMatrix();bs.setMatrixAt(i*2,d.matrix);d.position.set(HX+x,8.7,z);d.updateMatrix();bs.setMatrixAt(i*2+1,d.matrix);
  lant.push(glow(GT.gold,3,HX+x*.8,2.4,z,.8))});
 S.add(cs,bs);
 const fg=[];for(let z=8;z>-92;z-=4)[-2.1,2.1].forEach(x=>fg.push([HX+x,.25,z]));glowPoints(fg,GT.gold,1.1,.9);
 box(5.4,.6,3,stoneM,HX,.3,-90);box(3.6,.6,2,goldM,HX,.9,-90);glow(GT.gold,16,HX,3.2,-88,.7);
 for(let i=0;i<8;i++){const a=i/8*6.28,m=new THREE.Mesh(blobG,new THREE.MeshStandardMaterial({color:0xffb3c8,emissive:0x8a2f58,emissiveIntensity:.55,roughness:.9,flatShading:true}));m.scale.set(.5,.17,.28);m.position.set(HX+Math.cos(a)*.7,1.45,-90+Math.sin(a)*.7);m.rotation.y=-a;S.add(m)}
 CFG.photos.forEach((p,i)=>{const side=i%2?1:-1,z=-18-i*20,g=new THREE.Group();
  const mat=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(Photos.placeholderCanvas(i)),toneMapped:false});Photos.mats[i]=mat;
  const pic=new THREE.Mesh(new THREE.PlaneGeometry(2.7,3.6),mat);pic.position.z=.09;
  const edge=new THREE.Mesh(new THREE.PlaneGeometry(2.7,3.6),new THREE.MeshBasicMaterial({map:vigTex,transparent:true,depthWrite:false,toneMapped:false}));edge.position.z=.095;
  g.add(new THREE.Mesh(new THREE.BoxGeometry(3.1,4,.14),goldM),pic,edge);g.position.set(HX+side*7.2,2.3,z);g.rotation.y=-side*Math.PI/2;S.add(g);
  glow(GT.gold,8,HX+side*7.3,2.3,z,.5)})})();

/* ---------- cherry blossom garden ---------- */
(()=>{const gr=new THREE.Mesh(new THREE.CircleGeometry(80,48),new THREE.MeshStandardMaterial({color:0x1a1030,roughness:1}));gr.rotation.x=-Math.PI/2;gr.position.set(0,0,GZ);S.add(gr);
 petalFloor(Math.round(1200*Q.scale+200),d=>{const a=rnd(0,6.28),r=Math.sqrt(Math.random())*34;d.position.set(Math.cos(a)*r,.04,GZ+Math.sin(a)*r)});
 for(let i=0;i<28;i++){const a=i/28*6.28+rnd(-.1,.1),r=rnd(13,34),c=Math.cos(a),s=Math.sin(a);if(s>.5&&Math.abs(c)<.55)continue;tree(c*r,GZ+s*r,rnd(1.2,1.9))}})();
buildTrees();

/* ---------- particles: falling petals + fireflies (GPU) ---------- */
const FS="varying float a;uniform vec3 c;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(c,(1.-smoothstep(.15,.5,d))*a*.9);}";
const PV="attribute float ph;uniform float t,uS;varying float a;void main(){vec3 p=position;p.y=mod(p.y-t*(.5+ph*.6),16.);p.x+=sin(t*.5+ph*40.)*1.6;p.z+=cos(t*.4+ph*30.)*1.2;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((60.+ph*70.)/-mv.z*uS,1.,38.);a=smoothstep(0.,1.5,p.y)*(1.-smoothstep(20.,140.,-mv.z));}";
const FV="attribute float ph;uniform float t,uS;varying float a;void main(){vec3 p=position;p.y=.6+ph*5.+sin(t*.4+ph*20.)*.8;p.x+=sin(t*.3+ph*30.)*2.;p.z+=cos(t*.25+ph*25.)*2.;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(180./-mv.z*uS,1.,30.);a=(.45+.55*sin(t*2.+ph*50.))*(1.-smoothstep(10.,90.,-mv.z));}";
function pts(n,vs,col,fx,z0=DZ-20,z1=28,x0=0){n=Math.round(n*Q.scale);const g=new THREE.BufferGeometry(),p=new Float32Array(n*3),h=new Float32Array(n);
 for(let i=0;i<n;i++){p.set([x0+rnd(-fx,fx),rnd(0,16),rnd(z0,z1)],i*3);h[i]=Math.random()}
 g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('ph',new THREE.BufferAttribute(h,1));
 const m=new THREE.Points(g,new THREE.ShaderMaterial({uniforms:{t:U.t,uS:U.s,c:{value:new THREE.Color(col)}},vertexShader:vs,fragmentShader:FS,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
 m.frustumCulled=false;S.add(m)}
pts(2600,PV,0xffc2d2,18);pts(260,FV,0xffd98a,14);pts(3000,PV,0xffc2d2,30,GZ-40,GZ+40);pts(240,FV,0xffd98a,16,GZ-20,GZ+20);pts(300,FV,0xffd98a,7,-92,10,HX);

/* ============================================================
   COSMOS — two stars (Agnik and Sanchari) circle, spiral and merge
   ============================================================ */
const Cosmos=(()=>{
 const g=new THREE.Group();g.position.set(CX,0,0);g.visible=false;S.add(g);
 // star field with a little colour variety
 {const n=Math.round(2600*Q.scale+400),p=new Float32Array(n*3),c=new Float32Array(n*3),col=new THREE.Color();
  for(let i=0;i<n;i++){const a=rnd(0,6.283),b=Math.acos(rnd(-1,1)),r=rnd(120,260);p.set([Math.sin(b)*Math.cos(a)*r,Math.cos(b)*r,Math.sin(b)*Math.sin(a)*r],i*3);
   col.setHSL(rnd(.55,.95),rnd(.2,.6),rnd(.7,.95));c.set([col.r,col.g,col.b],i*3)}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(p,3));geo.setAttribute('color',new THREE.BufferAttribute(c,3));
  g.add(new THREE.Points(geo,new THREE.PointsMaterial({size:1.7,vertexColors:true,sizeAttenuation:false,fog:false,transparent:true,opacity:.9,depthWrite:false})))}
 // nebula clouds
 [[GT.violet,-90,20,-150,230,.28],[GT.rose,70,-10,-170,260,.2],[GT.violet,10,60,-200,300,.22],[GT.rose,-60,-40,-120,180,.16],[GT.gold,120,40,-190,200,.12]].forEach(([t,x,y,z,s,o])=>glow(t,s,x,y,z,o,g));
 // the two stars
 const mkStar=(tex,core)=>{const grp=new THREE.Group(),m=new THREE.Mesh(new THREE.SphereGeometry(1.1,24,24),new THREE.MeshBasicMaterial({color:core,fog:false})),
  h1=glow(tex,16,0,0,0,1,grp),h2=glow(GT.white,6,0,0,0,1,grp);grp.add(m);g.add(grp);return{grp,m,h1,h2}};
 const A=mkStar(GT.gold,0xffe9b8),B=mkStar(GT.rose,0xffc4d8);
 // orbit trails (ring buffer of recent positions)
 const TN=Math.round(120*Q.scale+30);
 const mkTrail=color=>{const pos=new Float32Array(TN*3),geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const col=new Float32Array(TN*3),c=new THREE.Color(color);for(let i=0;i<TN;i++){const k=1-i/TN;col.set([c.r*k,c.g*k,c.b*k],i*3)}geo.setAttribute('color',new THREE.BufferAttribute(col,3));
  const l=new THREE.Line(geo,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));l.frustumCulled=false;g.add(l);return{pos,geo,l}};
 const TA=mkTrail(0xffd890),TB=mkTrail(0xff9fc0);
 // merge burst + shock ring
 const BN=Math.round(700*Q.scale+100),bp=new Float32Array(BN*3),bd=new Float32Array(BN*3),bs=new Float32Array(BN);
 for(let i=0;i<BN;i++){const a=rnd(0,6.283),b=Math.acos(rnd(-1,1));bd.set([Math.sin(b)*Math.cos(a),Math.cos(b),Math.sin(b)*Math.sin(a)],i*3);bs[i]=rnd(.3,1)}
 const bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.BufferAttribute(bp,3));bg.setAttribute('dir',new THREE.BufferAttribute(bd,3));bg.setAttribute('sp',new THREE.BufferAttribute(bs,1));
 const burstU={p:{value:0},c1:{value:new THREE.Color(0xffd890)},c2:{value:new THREE.Color(0xff9fc0)}};
 const burst=new THREE.Points(bg,new THREE.ShaderMaterial({uniforms:burstU,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:"attribute vec3 dir;attribute float sp;uniform float p;varying float a;varying float k;void main(){vec3 q=dir*sp*p*60.;vec4 mv=modelViewMatrix*vec4(q,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((40.-p*28.)*sp/-mv.z*300.,1.,24.);a=p>0.?(1.-p)*(1.-p):0.;k=sp;}",
  fragmentShader:"varying float a;varying float k;uniform vec3 c1,c2;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(mix(c1,c2,k),(1.-smoothstep(.1,.5,d))*a);}"}));
 burst.frustumCulled=false;g.add(burst);
 const ring=new THREE.Mesh(new THREE.RingGeometry(.92,1,64),new THREE.MeshBasicMaterial({color:0xffe6c8,transparent:true,opacity:0,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));ring.rotation.x=-1.1;g.add(ring);
 // state driven by the director
 const st={r:34,th:0,vis:0,merge:0,burst:0,active:false,ring:0};
 const wA=new THREE.Vector3(),wB=new THREE.Vector3(),pr=new THREE.Vector3(),LA=$('#lbA'),LB=$('#lbB');
 const place=(L,v)=>{pr.copy(v).project(cam);const ok=pr.z<1&&Math.abs(pr.x)<1.1&&Math.abs(pr.y)<1.1;
  L.style.opacity=ok?String(Math.min(1,st.vis)*(1-st.merge)):'0';
  L.style.transform=`translate(${(pr.x*.5+.5)*innerWidth}px,${(-pr.y*.5+.5)*innerHeight-54}px) translate(-50%,-100%)`};
 let tick=0;
 function update(dt){
  if(!st.active)return;
  const e=Math.max(0,1-st.merge),r=st.r*e,th=st.th;
  // gentle 3D tilt so the orbit reads as a spiral, not a flat circle
  const ax=Math.cos(th)*r,az=Math.sin(th)*r,ay=Math.sin(th*.7)*r*.22;
  A.grp.position.set(ax,ay,az);B.grp.position.set(-ax,-ay,-az);
  const pulse=1+.06*Math.sin(U.t.value*3),sA=(16+st.merge*10)*pulse*st.vis,sB=(15+st.merge*11)*pulse*st.vis;
  A.h1.scale.setScalar(Math.max(.01,sA));B.h1.scale.setScalar(Math.max(.01,sB));
  A.h2.scale.setScalar(Math.max(.01,(6+st.merge*14)*st.vis));B.h2.scale.setScalar(Math.max(.01,(5.5+st.merge*14)*st.vis));
  A.m.scale.setScalar(Math.max(.01,st.vis*(1+st.merge*.8)));B.m.scale.setScalar(Math.max(.01,st.vis*(1+st.merge*.8)));
  // blend colours toward champagne as they merge
  A.m.material.color.setHex(0xffe9b8).lerp(new THREE.Color(0xfff2e0),st.merge);B.m.material.color.setHex(0xffc4d8).lerp(new THREE.Color(0xfff2e0),st.merge);
  // trails: every few frames push the newest position to the front
  if((tick++%2)===0)[[TA,A],[TB,B]].forEach(([T,S2])=>{T.pos.copyWithin(3,0,TN*3-3);T.pos[0]=S2.grp.position.x;T.pos[1]=S2.grp.position.y;T.pos[2]=S2.grp.position.z;T.geo.attributes.position.needsUpdate=true});
  TA.l.material.opacity=TB.l.material.opacity=st.vis*(1-st.merge);
  burstU.p.value=st.burst;ring.scale.setScalar(1+st.ring*70);ring.material.opacity=st.ring>0?(1-st.ring)*.8:0;
  A.grp.getWorldPosition(wA);B.grp.getWorldPosition(wB);place(LA,wA);place(LB,wB)}
 function reset(){Object.assign(st,{r:34,th:0,vis:0,merge:0,burst:0,ring:0});TA.pos.fill(0);TB.pos.fill(0);burstU.p.value=0;LA.style.opacity=LB.style.opacity='0'}
 function enter(){g.visible=true;st.active=true;LA.textContent=CFG.stars.a;LB.textContent=CFG.stars.b;reset()}
 function leave(){g.visible=false;st.active=false;LA.style.opacity=LB.style.opacity='0';reset()}
 return{g,st,update,enter,leave,reset}
})();
