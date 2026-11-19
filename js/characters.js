"use strict";
/* ============================================================
   CHARACTERS
   1. Built-in couple: articulated procedural figures (neck, jaw, eyes, brows,
      hair, clothes, shoes, hands with 4 fingers + thumb, shoulder/elbow/hip/knee joints).
      They are stylised, NOT photorealistic.
   2. Real models: set CFG.useModels=true and put rigged GLB files in assets/models/.
      They are driven by THREE.AnimationMixer (idle / walk / dance clips by name).
      If loading fails, the built-in couple stays, so nothing breaks.
   ============================================================ */
function person(side,dress,col,hairCol,accent){
 const g=new THREE.Group(),rig={};
 const skin=new THREE.MeshStandardMaterial({color:0xe3b296,roughness:.55}),
  cloth=new THREE.MeshStandardMaterial({color:col,roughness:.78}),
  trou=new THREE.MeshStandardMaterial({color:dress?0x3a1d2a:0x14122a,roughness:.8}),
  hairMat=new THREE.MeshStandardMaterial({color:hairCol,roughness:.42}),
  gold=new THREE.MeshStandardMaterial({color:0xe2b765,metalness:.7,roughness:.3,emissive:0x2a1a04}),
  dark=new THREE.MeshStandardMaterial({color:0x1d0f16,roughness:.5}),
  white=new THREE.MeshStandardMaterial({color:0xf6efe8,roughness:.35}),
  lip=new THREE.MeshStandardMaterial({color:dress?0xc2556b:0xb4706a,roughness:.45}),
  shoe=new THREE.MeshStandardMaterial({color:0x120a10,roughness:.35,metalness:.2}),
  skirtM=new THREE.MeshStandardMaterial({color:col,roughness:.8,side:THREE.DoubleSide});
 const add=(geo,mat,x,y,z,sx=1,sy=1,sz=1,parent=g)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m};
 const body=new THREE.Group();g.add(body);rig.body=body;

 /* torso, shoulders, neck */
 add(new THREE.CapsuleGeometry(.23,.62,8,18),cloth,0,1.08,0,.95,1.02,.7,body);
 add(new THREE.SphereGeometry(.24,24,16),cloth,0,1.42,0,1.18,.7,.78,body);
 add(new THREE.CylinderGeometry(.07,.085,.2,16),skin,0,1.58,0,1,1,1,body);
 if(dress){
  add(new THREE.TorusGeometry(.2,.018,8,32),gold,0,.9,0,1,1,.78,body).rotation.x=Math.PI/2;   // waist belt
  rig.skirt=add(new THREE.CylinderGeometry(.24,.6,.95,40,4,true),skirtM,0,.45,0,1,1,.85,body);
  add(new THREE.TorusGeometry(.11,.012,8,24,Math.PI),gold,0,1.5,.12,1,1,1,body).rotation.z=Math.PI;   // necklace
 }else{
  add(new THREE.TorusGeometry(.085,.022,8,18),accent?new THREE.MeshStandardMaterial({color:accent,roughness:.5}):gold,0,1.56,.015,1,.8,1,body).rotation.x=Math.PI/2; // collar
  for(let i=0;i<4;i++)add(new THREE.SphereGeometry(.014,10,8),gold,0,1.38-i*.15,.165,1,1,.6,body);          // buttons
  add(new THREE.BoxGeometry(.5,.05,.3),dark,0,.86,0,1,1,.8,body);                                          // belt
 }

 /* head: skull, jaw, ears, eyes, brows, nose, lips */
 const head=new THREE.Group();head.position.set(0,1.78,0);body.add(head);rig.head=head;
 add(new THREE.SphereGeometry(.19,36,28),skin,0,.01,0,.84,1.1,.88,head);
 add(new THREE.SphereGeometry(.15,28,20),skin,0,-.07,.02,.9,.9,.84,head);                       // jaw
 [-1,1].forEach(s=>{
  add(new THREE.SphereGeometry(.05,14,12),skin,s*.165,-.01,0,.6,1,.7,head);                    // ear
  add(new THREE.SphereGeometry(.03,16,12),white,s*.065,.03,.152,1.15,.8,.55,head);              // eye white
  add(new THREE.SphereGeometry(.0165,14,12),dark,s*.065,.03,.171,1,1,.5,head);                 // iris
  add(new THREE.SphereGeometry(.005,8,6),white,s*.06,.037,.178,1,1,1,head);                    // catch-light
  const br=add(new THREE.CapsuleGeometry(.007,.055,4,8),hairMat,s*.067,.075,.158,1,1,.6,head);br.rotation.z=Math.PI/2+(dress?s*.12:-s*.06);
  add(new THREE.SphereGeometry(.026,12,10),new THREE.MeshStandardMaterial({color:dress?0xe9a393:0xe0a58f,roughness:.7,transparent:true,opacity:.5}),s*.1,-.035,.14,1,.8,.4,head); // cheek
 });
 add(new THREE.SphereGeometry(.02,14,12),skin,0,-.025,.18,.85,1.4,.9,head);                    // nose
 add(new THREE.CapsuleGeometry(.009,.05,4,8),lip,0,-.088,.158,1,1,.6,head).rotation.z=Math.PI/2;
 const smile=add(new THREE.TorusGeometry(.046,.0055,6,20,Math.PI),dark,0,-.083,.153,1,.5,1,head);smile.rotation.z=Math.PI;

 /* hair */
 add(new THREE.SphereGeometry(.2,32,22,0,Math.PI*2,0,Math.PI*.6),hairMat,0,.07,-.018,1.02,1.06,1.02,head);
 add(new THREE.SphereGeometry(.19,24,20),hairMat,0,-.1,-.105,.98,1.12,.7,head);
 if(dress){
  const fall=add(new THREE.CapsuleGeometry(.11,.66,8,14),hairMat,0,-.3,-.17,1.15,1,.85,head);fall.rotation.x=-.1;rig.hair=fall;
  [-1,1].forEach(s=>{const l=add(new THREE.CapsuleGeometry(.03,.26,6,8),hairMat,s*.17,-.14,.03,1,1,1,head);l.rotation.z=s*.12});  // face-framing locks
  add(new THREE.SphereGeometry(.03,10,8),gold,.12,.14,.07,1,1,1,head);                                                          // hair pin
 }else{
  const fringe=add(new THREE.SphereGeometry(.135,22,14),hairMat,0,.105,.11,1.15,.55,.5,head);fringe.rotation.x=-.2;rig.hair=fringe;
  [-1,1].forEach(s=>add(new THREE.SphereGeometry(.07,12,10),hairMat,s*.15,.03,-.02,.6,1.1,.9,head));                              // sideburn volume
 }

 /* arms: shoulder → elbow → wrist → palm, 4 fingers and a thumb */
 function armAt(x,sgn,inner){
  const pivot=new THREE.Group();pivot.position.set(x,1.4,0);g.add(pivot);
  const sleeve=dress?(inner?skin:cloth):cloth;
  add(new THREE.SphereGeometry(.06,14,12),cloth,0,0,0,1,1,1,pivot);                              // shoulder
  const up=add(new THREE.CapsuleGeometry(.052,.27,8,14),sleeve,0,-.18,0,1,1,.95,pivot);up.rotation.z=sgn*.05;
  const elbow=new THREE.Group();elbow.position.set(0,-.36,0);pivot.add(elbow);
  add(new THREE.SphereGeometry(.05,12,10),sleeve,0,0,0,1,1,1,elbow);
  add(new THREE.CapsuleGeometry(.043,.26,8,14),dress?skin:cloth,0,-.2,.01,1,1,.9,elbow);
  const wrist=new THREE.Group();wrist.position.set(0,-.4,.02);elbow.add(wrist);
  add(new THREE.CapsuleGeometry(.03,.03,4,10),skin,0,0,0,1,1,1,wrist);
  add(new THREE.BoxGeometry(.075,.085,.028),skin,0,-.06,0,1,1,1,wrist);                           // palm
  [[-.027,.048],[-.009,.056],[.009,.052],[.027,.042]].forEach(([fx,fl])=>{
   const f=new THREE.Group();f.position.set(fx,-.105,0);wrist.add(f);f.rotation.x=.18;
   add(new THREE.CapsuleGeometry(.0105,fl,4,8),skin,0,-fl/2,0,1,1,1,f)});
  const th=new THREE.Group();th.position.set(-sgn*.04,-.07,.008);wrist.add(th);th.rotation.set(.2,0,sgn*.7);
  add(new THREE.CapsuleGeometry(.0115,.04,4,8),skin,0,-.02,0,1,1,1,th);
  pivot.userData.elbow=elbow;pivot.userData.wrist=wrist;return pivot};
 rig.armIn=armAt(side*.27,side,true);rig.armOut=armAt(-side*.27,-side,false);

 /* legs: hip → knee → ankle → shoe */
 function legAt(x){
  const hip=new THREE.Group();hip.position.set(x,.85,0);g.add(hip);
  add(new THREE.CapsuleGeometry(.082,.32,8,14),trou,0,-.24,0,1,1,1,hip);
  const knee=new THREE.Group();knee.position.set(0,-.44,0);hip.add(knee);
  add(new THREE.CapsuleGeometry(.065,.32,8,14),dress?skin:trou,0,-.22,0,1,1,1,knee);
  add(new THREE.BoxGeometry(.1,.07,.24),shoe,0,-.42,.04,1,1,1,knee);
  hip.userData.knee=knee;return hip};
 rig.legL=legAt(-.1);rig.legR=legAt(.1);
 g.userData.rig=rig;g.userData.side=side;g.userData.dress=dress;g.userData.mode='idle';g.userData.mix=0;
 g.rotation.y=Math.PI;S.add(g);return g}

/* procedural motion: idle breathing, a walk cycle, and a hand-holding pose */
function animateProc(p,t,i,dt){
 const r=p.userData.rig,side=p.userData.side,mode=p.userData.mode;
 p.userData.mix+=((mode==='walk'?1:0)-p.userData.mix)*Math.min(1,dt*4);const w=p.userData.mix;
 const ph=t*4.2+i*Math.PI,sw=Math.sin(ph)*w;
 r.body.scale.y=1+Math.sin(t*1.6+i)*.006;r.body.rotation.z=Math.sin(ph*.5)*.02*w;
 r.head.rotation.y=Math.sin(t*.5+i)*.07;r.head.rotation.x=Math.sin(t*.7+i*2)*.03-(mode==='hold'?.05:0);
 r.legL.rotation.x=sw*.55;r.legR.rotation.x=-sw*.55;
 r.legL.userData.knee.rotation.x=Math.max(0,-sw)*.6;r.legR.userData.knee.rotation.x=Math.max(0,sw)*.6;
 if(r.skirt){r.skirt.rotation.z=Math.sin(ph*.5)*.03*w;r.skirt.scale.x=1+Math.abs(sw)*.05}
 const hold=mode==='hold'?1:0,k=Math.min(1,dt*3);
 // inner arm reaches toward the partner; outer arm swings or rests
 const tIn=hold?.3*side:-sw*.5*side, tInX=hold?-.45:-sw*.5, tElb=hold?-.5:Math.max(0,sw)*.4;
 r.armIn.rotation.z+=((hold?side*.3:0)-r.armIn.rotation.z)*k;
 r.armIn.rotation.x+=((hold?-.35:sw*.5)-r.armIn.rotation.x)*k;
 r.armIn.userData.elbow.rotation.x+=((hold?-.45:0)-r.armIn.userData.elbow.rotation.x)*k;
 r.armOut.rotation.x=-sw*.5;r.armOut.rotation.z=-side*.08;r.armOut.userData.elbow.rotation.x=Math.max(0,-sw)*.4;
 if(r.hair)r.hair.rotation.x=(p.userData.dress?-.1:-.2)+Math.sin(t*1.2+i)*.04;
 p.position.y=(p.userData.base||0)+Math.sin(t*1.5+i)*.01+Math.abs(sw)*.03}

const pl=person(1,false,0x2b2a4a,0x1a1018,0xe2b765),pr=person(-1,true,0xd96b8a,0x2a1410);
const heart=glow(GT.gold,0,0,1.0,DZ-8,0);
pl.visible=pr.visible=heart.visible=false;

const Chars=(()=>{
 const people=[pl,pr],clipRe={idle:/idle|stand|breath|rest/i,hold:/idle|hold|hand|stand|breath/i,walk:/walk/i,dance:/dance|waltz|sway/i};
 let mode='idle',loading=false;
 function play(p,m){
  const u=p.userData.glb;if(!u)return;
  const pick=(re)=>u.clips.find(c=>re.test(c.name));
  const clip=pick(clipRe[m])||pick(clipRe.idle)||u.clips[0];if(!clip)return;
  const next=u.actions.get(clip.name)||(()=>{const a=u.mixer.clipAction(clip);u.actions.set(clip.name,a);return a})();
  if(u.cur===next)return;next.reset().fadeIn(.5).play();if(u.cur)u.cur.fadeOut(.5);u.cur=next}
 function setMode(m){mode=m;people.forEach(p=>{p.userData.mode=m;play(p,m)})}
 function adopt(p,gltf,height){
  const model=gltf.scene,box=new THREE.Box3().setFromObject(model),h=Math.max(.01,box.max.y-box.min.y),s=height/h;
  model.scale.setScalar(s);model.position.y=-box.min.y*s;
  model.traverse(o=>{if(o.isMesh){o.frustumCulled=false;if(o.material){o.material.fog=true}}});
  p.userData.proc=p.children.slice();p.userData.proc.forEach(c=>p.remove(c));p.add(model);
  p.userData.glb={mixer:new THREE.AnimationMixer(model),clips:gltf.animations||[],actions:new Map(),cur:null};
  p.userData.base=0;play(p,mode)}
 function loadScript(src){return new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s)})}
 async function loadModels(){
  if(!CFG.useModels||loading)return;loading=true;
  try{
   if(!THREE.GLTFLoader)await loadScript('vendor/GLTFLoader.js');
   const L=new THREE.GLTFLoader();
   const get=(url,p,h)=>new Promise(res=>L.load(url,g=>{try{adopt(p,g,h)}catch(e){console.warn('Model unusable:',url,e)}res()},undefined,()=>{console.warn('Model not loaded (using built-in figure):',url);res()}));
   await Promise.all([get(CFG.models.male,pl,CFG.modelHeight.male),get(CFG.models.female,pr,CFG.modelHeight.female)]);
  }catch(e){console.warn('Could not start model loader; using built-in figures.',e)}}
 function update(dt,t){people.forEach((p,i)=>{if(!p.visible)return;const u=p.userData.glb;if(u)u.mixer.update(dt);else animateProc(p,t,i,dt)})}
 return{setMode,loadModels,update,get mode(){return mode}}
})();
