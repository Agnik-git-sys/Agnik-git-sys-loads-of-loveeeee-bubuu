"use strict";
/* ============================================================
   STORY DIRECTOR
   Path → Temple hall (photos) → Letters → Two stars → Cherry garden
   Every transition kills the previous timeline first, and every button
   has a lock so double-clicks can never stack timelines or listeners.
   ============================================================ */
let tl=null,fov=55,stage='veil',busy=false,letterOpen=false,letterLock=false;

function killAll(){
 if(tl){tl.kill();tl=null}
 Snd.stopVoice();
 gsap.killTweensOf(['#wel','.ln','.nm','#rp','#cap','#cq','#fin','#s4','#s5','#flash','.slabel']);
 Cosmos.leave();
}
function flashTo(v,d,cb){gsap.to('#flash',{opacity:v,duration:d,overwrite:true,onComplete:cb})}
function camReset(f=55){cam.fov=fov=f;cam.updateProjectionMatrix()}

/* I. the path → temple door (the couple waits at the door, seen from behind) */
function start(){
 killAll();stage='path';busy=false;
 ['#s4','#s5'].forEach(s=>{$(s).style.display='none'});
 closePaperNow();
 gsap.set('.ln,.nm,#rp,#wel,#cq,#fin',{opacity:0});$('#rp').classList.remove('ready');
 document.body.classList.add('cine');$('#skip').style.display='block';
 document.querySelectorAll('.env').forEach(e=>{e.classList.remove('read');gsap.set(e.firstChild,{scale:1})});
 pl.visible=pr.visible=true;heart.visible=false;heart.material.opacity=0;
 pl.position.set(.5,0,DZ-9.5);pr.position.set(-.5,0,DZ-9.5);pl.rotation.y=pr.rotation.y=Math.PI;Chars.setMode('hold');
 warm.position.set(0,3,DZ-9);warm.intensity=0;
 camReset();cam.position.set(0,2.6,30);look.set(0,3,DZ);setTag(0);
 tl=gsap.timeline();
 tl.to('#wel',{opacity:1,duration:2},1).to('#wel',{opacity:0,duration:2},8)
  .to(cam.position,{y:2.4,z:DZ-3,duration:22,ease:'sine.inOut'},0)
  .to(look,{y:2.6,z:DZ-16,duration:22,ease:'sine.inOut'},0)
  .call(()=>{setTag(1);sfx(120,2.6,'sawtooth',70)},null,17)
  .to(warm,{intensity:1.8,duration:5},16)
  .to(cam,{fov:40,duration:5,ease:'power2.in'},19.5)
  .to('#flash',{opacity:1,duration:1.2,onComplete:()=>toHall()},25)}

/* II. inside the temple: walk again, stop at each photo */
function toHall(){
 stage='hall';setTag(2);sfx(880,2.5);pl.visible=pr.visible=false;warm.intensity=2.2;camReset();cam.position.set(HX,1.7,10);look.set(HX,1.9,-20);
 if(tl)tl.kill();tl=gsap.timeline();const trk=()=>warm.position.set(cam.position.x,2.6,cam.position.z-1);
 tl.to('#flash',{opacity:0,duration:1.8},0)
  .to(cam.position,{z:-7,duration:5,ease:'sine.inOut',onUpdate:trk},0).to(look,{z:-26,duration:5,ease:'sine.inOut'},0);
 CFG.photos.forEach((p,i)=>{const side=i%2?1:-1,z=-18-i*20,s=5+i*11;
  tl.to(cam.position,{x:HX+side*1.6,y:2,z:z,duration:3,ease:'power2.inOut',onUpdate:trk},s)
    .to(look,{x:HX+side*7.1,y:2.3,z:z,duration:3,ease:'power2.inOut'},s)
    .to(cam,{fov:46,duration:3,ease:'power2.inOut'},s)                       // gentle push toward the photograph
    .call(()=>{cue(p.q);sfx(660,1.4)},null,s+2.8).call(uncue,null,s+7.2)
    .to(cam,{fov:55,duration:3.6,ease:'power2.inOut'},s+7.4)
    .to(cam.position,{x:HX,y:1.7,z:z-9,duration:3.6,ease:'power2.inOut',onUpdate:trk},s+7.4)
    .to(look,{x:HX,y:1.9,z:z-27,duration:3.6,ease:'power2.inOut'},s+7.4)});
 tl.call(toLetters,null,38.6)}

function skipToLetters(){
 if(stage!=='path'&&stage!=='hall')return;
 killAll();pl.visible=pr.visible=false;gsap.set('#flash',{opacity:0});
 warm.position.set(HX,2.6,-68);warm.intensity=2.2;camReset();cam.position.set(HX,1.7,-67);look.set(HX,1.9,-85);toLetters()}

/* III. letters */
function toLetters(){
 stage='letters';$('#skip').style.display='none';uncue();setTag(3);show('#s4',2);
 $('#toF').disabled=false;busy=false}
const esc=t=>t.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const wd=t=>esc(t).split(' ').map(w=>`<span>${w} </span>`).join('');
function buildLetters(){
 const box=$('#env');box.innerHTML='';
 CFG.letters.forEach((l,i)=>{
  const e=document.createElement('button');e.type='button';e.className='env';e.setAttribute('aria-label','Open letter '+(i+1));
  e.style.cssText=`rotate:${[-5,3,-2][i%3]}deg;animation-delay:${i*.7}s`;e.innerHTML='<div class="seal">桜</div>';
  e.addEventListener('click',()=>{
   if(letterLock||stage!=='letters')return;letterLock=true;
   e.classList.add('read');sfx(300,.5,'triangle');
   gsap.to(e.firstChild,{scale:0,duration:.5,onComplete:()=>openLetter(l)})});
  box.appendChild(e)})}
function openLetter(l){
 gsap.killTweensOf('.sheet span');
 $('#sheet').innerHTML=`<p>${wd(l.to)}</p><p>${wd(l.body)}</p><p style="text-align:right">${wd(l.from)}</p>`;
 $('#sheet').scrollTop=0;letterOpen=true;
 $('#paper').style.display='grid';gsap.fromTo('#paper',{opacity:0},{opacity:1,duration:.7,overwrite:true});
 gsap.to('.sheet span',{opacity:1,duration:.7,stagger:.05,delay:.5});
 $('#cl').focus({preventScroll:true})}
function closeLetter(){
 if(!letterOpen)return;letterOpen=false;
 gsap.to('#paper',{opacity:0,duration:.6,overwrite:true,onComplete:()=>{$('#paper').style.display='none';letterLock=false}})}
function closePaperNow(){letterOpen=false;letterLock=false;gsap.killTweensOf('#paper');$('#paper').style.display='none'}
function continueToStars(){
 if(stage!=='letters'||busy||letterOpen)return;busy=true;$('#toF').disabled=true;sfx(1046,3);
 gsap.to('#flash',{opacity:1,duration:1.2,overwrite:true,onComplete:()=>{$('#s4').style.display='none';toCosmos()}})}

/* IV. two stars: Agnik and Sanchari circle, spiral inward and become one light */
function toCosmos(){
 killAll();stage='cosmos';busy=false;setTag(4);pl.visible=pr.visible=false;warm.intensity=0;
 Cosmos.enter();const st=Cosmos.st;
 camReset();cam.position.set(CX,8,78);look.set(CX,0,0);
 tl=gsap.timeline();
 tl.to('#flash',{opacity:0,duration:2},0)
  .to(st,{vis:1,duration:3,ease:'power1.inOut'},.6)
  .to(st,{th:Math.PI*8,duration:20,ease:'power2.in'},.6)
  .to(st,{r:14,duration:13.4,ease:'sine.inOut'},.6)
  .to(st,{r:3,duration:5.2,ease:'power1.in'},14)
  .to(cam.position,{y:4,z:46,duration:13.4,ease:'sine.inOut'},0)
  .to(cam.position,{y:2.4,z:30,duration:7,ease:'power2.inOut'},14)
  .to(cam,{fov:40,duration:6,ease:'power2.inOut'},15)
  .call(()=>cue(CFG.stars.q1),null,3.5).call(uncue,null,12)
  .to(st,{merge:1,duration:1.4,ease:'power3.in'},19.4)
  .call(()=>{sfx(1046,3.2);sfx(523,3.2,'triangle')},null,20.7)
  .to(st,{burst:1,duration:3.6,ease:'power2.out'},20.7)
  .to(st,{ring:1,duration:3,ease:'power2.out'},20.7)
  .to('#flash',{opacity:.5,duration:.15},20.7).to('#flash',{opacity:0,duration:1.3},20.85)
  .call(()=>cue(CFG.stars.q2),null,22.4).call(uncue,null,25.4)
  .to('#flash',{opacity:1,duration:1.4,onComplete:()=>garden()},26.2)}
function skipStars(){if(stage==='cosmos'&&!busy){busy=true;killAll();flashTo(1,.6,()=>garden())}}

/* V. the cherry blossom garden: hands held, push in on the face, dissolve to the photo, her name */
function whisper(t){Snd.playVoice(t)}
function garden(){
 killAll();stage='garden';busy=false;setTag(5);$('#s5').style.display='flex';$('#skip').style.display='none';
 pl.visible=pr.visible=heart.visible=true;
 pl.position.set(-.5,0,GZ);pr.position.set(.5,0,GZ);pl.rotation.y=.4;pr.rotation.y=-.4;Chars.setMode('hold');
 heart.position.set(0,.65,GZ);heart.scale.setScalar(2.2);heart.material.opacity=.9;
 warm.position.set(0,2.6,GZ+3);warm.intensity=2.4;camReset();cam.position.set(0,2.8,GZ+19);look.set(0,1.5,GZ);
 gsap.set('.ln,.nm,#rp',{opacity:0});
 tl=gsap.timeline();
 tl.to('#flash',{opacity:0,duration:2},0)
  .to(cam.position,{y:1.8,z:GZ+7,duration:10,ease:'sine.inOut'},0).to(look,{y:1.4,duration:10,ease:'sine.inOut'},0)
  .to(cam,{fov:28,duration:7,ease:'power2.inOut'},10)
  .to(cam.position,{x:.5,y:1.62,z:GZ+2.2,duration:7,ease:'power2.inOut'},10)
  .to(look,{x:.5,y:1.62,z:GZ,duration:7,ease:'power2.inOut'},10)
  .to('#fin',{opacity:1,duration:3},15.5)
  .to('.ln',{opacity:1,duration:2.4,stagger:1.6},18.5)
  .call(()=>{whisper(CFG.say);sfx(1046,3)},null,21).to('.nm',{opacity:1,duration:3.2},21)
  .to('#rp',{opacity:1,duration:1.5},26).call(()=>$('#rp').classList.add('ready'),null,26)}

function replay(){
 if(stage!=='garden'||busy)return;busy=true;$('#rp').classList.remove('ready');
 gsap.to('#flash',{opacity:1,duration:1,overwrite:true,onComplete(){start();gsap.to('#flash',{opacity:0,duration:1.5})}})}

/* skip button + keyboard */
function skipIntro(){sfx(500,1);if(stage==='cosmos')skipStars();else skipToLetters()}
