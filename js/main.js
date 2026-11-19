"use strict";
/* ============================================================
   MAIN — renderer pipeline, loop, boot, and every button listener
   (each listener is attached exactly once, here).
   ============================================================ */

/* ---------- optional restrained post-processing: soft bloom + filmic tone map ---------- */
let composer=null,bloom=null;
function setupPost(){
 try{
  if(Q.low||!R.capabilities.isWebGL2||!THREE.EffectComposer||!THREE.UnrealBloomPass)return;
  if(!R.getContext().getExtension('EXT_color_buffer_float'))return;
  const w=Math.max(2,Math.floor(innerWidth*Q.pr)),h=Math.max(2,Math.floor(innerHeight*Q.pr));
  const rt=new THREE.WebGLMultisampleRenderTarget(w,h,{type:THREE.HalfFloatType,format:THREE.RGBAFormat});rt.samples=4;
  const c=new THREE.EffectComposer(R,rt);
  c.addPass(new THREE.RenderPass(S,cam));
  bloom=new THREE.UnrealBloomPass(new THREE.Vector2(Math.floor(w/2),Math.floor(h/2)),.5,.65,.86);c.addPass(bloom);
  c.addPass(new THREE.ShaderPass({uniforms:{tDiffuse:{value:null},ex:{value:1.35}},
   vertexShader:"varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
   fragmentShader:"uniform sampler2D tDiffuse;uniform float ex;varying vec2 vUv;vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}void main(){vec4 c=texture2D(tDiffuse,vUv);gl_FragColor=vec4(aces(c.rgb*ex),1.);}"}));
  composer=c;R.toneMapping=THREE.NoToneMapping;
 }catch(e){composer=null;R.toneMapping=THREE.ACESFilmicToneMapping;console.warn('Post-processing disabled:',e)}}
function dropPost(){composer=null;R.toneMapping=THREE.ACESFilmicToneMapping}

/* ---------- resize ---------- */
function rs(){
 const w=innerWidth,h=innerHeight;R.setPixelRatio(Q.pr);R.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();
 U.s.value=h*Q.pr/900;
 if(composer){composer.setPixelRatio(Q.pr);composer.setSize(w,h);if(bloom)bloom.resolution.set(w/2,h/2)}}
let rsT=0;addEventListener('resize',()=>{clearTimeout(rsT);rsT=setTimeout(rs,80)});
addEventListener('orientationchange',()=>setTimeout(rs,200));

/* ---------- reduced motion ---------- */
function setReduced(on){
 Q.reduced=!!on;document.body.classList.toggle('rm',Q.reduced);
 const b=$('#rm');b.setAttribute('aria-pressed',String(Q.reduced));b.textContent=Q.reduced?'Motion reduced':'Reduce motion';
 if(bloom)bloom.strength=Q.reduced?.3:.5}

/* ---------- loop ---------- */
const clock=new THREE.Clock(),tmp=new THREE.Vector3();
let slow=0,frames=0,lastFov=cam.fov;
function loop(){
 requestAnimationFrame(loop);if(document.hidden)return;
 const dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;U.t.value+=dt*(Q.reduced?.15:1);
 lant.forEach((s,i)=>{s.material.opacity=Q.reduced?.85:.78+.22*Math.sin(t*3+i*1.7)});
 Chars.update(dt,t);
 if(heart.material.opacity>0)heart.material.opacity=.8+.2*Math.sin(t*2);
 Cosmos.update(dt);
 tmp.copy(look);if(!Q.reduced){tmp.x+=Math.sin(t*.7)*.05;tmp.y+=Math.cos(t*.9)*.04}
 cam.lookAt(tmp);
 if(cam.fov!==lastFov){lastFov=cam.fov;cam.updateProjectionMatrix()}
 if(composer)composer.render(dt);else R.render(S,cam);
 // adaptive quality: if the device struggles, drop bloom first, then resolution
 if(++frames>90){frames=0;}
 if(dt>.028)slow++;else slow=Math.max(0,slow-1);
 if(slow>45){slow=0;if(composer){dropPost()}else if(Q.pr>.8){Q.pr=Math.max(.8,Q.pr-.25);rs()}}}

/* ---------- boot ---------- */
function boot(){
 $('#vt').textContent=CFG.title;$('#wel').textContent=CFG.welcome;
 $('#lines').innerHTML=CFG.forever.map(t=>`<p class="ln">${esc(t)}</p>`).join('');$('.nm').textContent=CFG.say;
 buildLetters();setupPost();setReduced(Q.reduced);Snd.setMuted(false);
 rs();cam.position.set(0,2.6,30);look.set(0,3,DZ);requestAnimationFrame(loop);

 // Begin: unlocks audio (needs this user gesture), starts music, lazy-loads photos + models, starts the film
 $('#begin').addEventListener('click',function(){
  if(stage!=='veil')return;this.disabled=true;
  try{Snd.init();Snd.startMusic()}catch(e){console.warn('Audio unavailable:',e)}
  try{Photos.load();Chars.loadModels()}catch(e){console.warn(e)}
  document.body.classList.add('live');
  gsap.to('#veil',{opacity:0,duration:1.2,onComplete:()=>{$('#veil').style.display='none'}});
  start()});
 $('#skip').addEventListener('click',skipIntro);
 $('#cl').addEventListener('click',closeLetter);
 $('#paper').addEventListener('click',e=>{if(e.target.id==='paper')closeLetter()});
 $('#toF').addEventListener('click',continueToStars);
 $('#rp').addEventListener('click',replay);
 $('#mute').addEventListener('click',()=>Snd.toggle());
 $('#rm').addEventListener('click',()=>setReduced(!Q.reduced));
 addEventListener('keydown',e=>{if(e.key==='Escape')closeLetter();else if(e.key==='m'||e.key==='M')Snd.toggle()});
 addEventListener('error',e=>console.warn('Runtime issue:',e.message))}
boot();
