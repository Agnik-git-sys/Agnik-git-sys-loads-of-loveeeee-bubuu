"use strict";
/* ============================================================
   AUDIO SYSTEM
   - background music  : assets/audio/background-music.mp3 (loops, fades in after Begin)
   - personal voice    : assets/audio/my-voice.mp3 (plays once at the finale, music ducks)
   - fallbacks         : soft synthesized pad if the song is missing,
                         browser speech ONLY if the voice file is missing/unplayable
   - never overlaps    : one voice at a time, speech cancelled before any new voice
   ============================================================ */
const Snd=(()=>{
 const MUSIC_VOL=.34, DUCK_VOL=.08, PAD_OFF=.02, PAD_ON=.05;
 let AC=null,master=null,padGain=null,music=null,voice=null;
 let muted=false,started=false,musicPlaying=false,voiceBusy=false,safety=null;
 const mix={m:0};                       // tweened music level (0..MUSIC_VOL)

 const applyMusic=()=>{if(music)music.volume=muted?0:Math.max(0,Math.min(1,mix.m))};
 const fadeMusic=(to,d=1.2)=>gsap.to(mix,{m:to,duration:d,overwrite:true,onUpdate:applyMusic});
 const padTo=v=>{if(AC&&padGain)padGain.gain.setTargetAtTime(v,AC.currentTime,.8)};

 function makeEl(src,loop){
  if(!src)return null;
  const a=new window.Audio();a.preload='auto';a.loop=!!loop;a.src=src;return a;
 }

 function initCtx(){
  try{
   AC=new(window.AudioContext||window.webkitAudioContext)();
   master=AC.createGain();master.gain.value=muted?0:.55;master.connect(AC.destination);
   // warm ambient pad (always available, quiet when the real song plays)
   const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=700;
   padGain=AC.createGain();padGain.gain.value=PAD_ON;f.connect(padGain);padGain.connect(master);
   [110,164.8,220,277.2].forEach((fr,i)=>{const o=AC.createOscillator();o.type=i%2?'triangle':'sine';o.frequency.value=fr;o.detune.value=(i-1.5)*7;o.connect(f);o.start()});
   const l=AC.createOscillator(),lg=AC.createGain();l.frequency.value=.07;lg.gain.value=320;l.connect(lg);lg.connect(f.frequency);l.start();
   if(AC.state==='suspended')AC.resume().catch(()=>{});
  }catch(e){AC=null}
 }

 function init(){
  if(started)return;started=true;
  initCtx();
  music=makeEl(CFG.musicSrc,true);voice=makeEl(CFG.voiceSrc,false);
  if(music){music.volume=0;music.addEventListener('error',()=>{musicPlaying=false;padTo(PAD_ON)})}
  document.addEventListener('visibilitychange',()=>{
   if(document.hidden){if(AC)AC.suspend().catch(()=>{});if(music&&musicPlaying)music.pause()}
   else{if(AC&&!muted)AC.resume().catch(()=>{});if(music&&musicPlaying&&!muted)music.play().catch(()=>{})}
  });
 }

 function startMusic(){
  if(!music||musicPlaying)return;
  const go=()=>music.play().then(()=>{musicPlaying=true;padTo(PAD_OFF);fadeMusic(MUSIC_VOL,3)});
  go().catch(err=>{
   // blocked by the browser: retry on the next real click/tap. Missing file: keep the pad.
   if(err&&err.name==='NotAllowedError'){
    const retry=()=>{removeEventListener('pointerdown',retry);if(!musicPlaying)go().catch(()=>{})};
    addEventListener('pointerdown',retry,{once:true});
   }else padTo(PAD_ON);
  });
 }

 /* ---- voice ---- */
 function speak(text,done){
  let ended=false;const fin=()=>{if(ended)return;ended=true;clearTimeout(safety);done()};
  try{
   if(muted||!('speechSynthesis' in window))throw 0;
   const u=new SpeechSynthesisUtterance(text),vs=speechSynthesis.getVoices();
   u.volume=.7;u.rate=.78;u.pitch=1;
   const f=vs.find(x=>/en/i.test(x.lang)&&/female|samantha|zira|heera|veena|susan/i.test(x.name))||vs.find(x=>/en/i.test(x.lang));
   if(f)u.voice=f;u.onend=fin;u.onerror=fin;
   speechSynthesis.cancel();speechSynthesis.speak(u);
   safety=setTimeout(fin,9000);               // some browsers never fire onend
  }catch(e){safety=setTimeout(fin,2500)}
 }
 function stopVoice(){
  clearTimeout(safety);
  try{speechSynthesis.cancel()}catch(e){}
  if(voice){voice.onended=null;voice.onerror=null;voice.pause();try{voice.currentTime=0}catch(e){}}
  if(voiceBusy){voiceBusy=false;if(musicPlaying)fadeMusic(MUSIC_VOL,1.2)}
 }
 function playVoice(text){
  if(voiceBusy)return;                         // never overlap
  voiceBusy=true;if(musicPlaying)fadeMusic(DUCK_VOL,1);
  const finish=()=>{if(!voiceBusy)return;voiceBusy=false;if(musicPlaying)fadeMusic(MUSIC_VOL,2.5)};
  let fell=false;const fallback=()=>{if(fell)return;fell=true;if(voice)voice.pause();speak(text,finish)};
  const usable=voice&&!voice.error&&voice.networkState!==HTMLMediaElement.NETWORK_NO_SOURCE;
  if(!usable)return fallback();
  try{voice.currentTime=0}catch(e){}
  voice.muted=muted;voice.volume=1;voice.onended=finish;voice.onerror=fallback;
  const p=voice.play();if(p&&p.catch)p.catch(fallback);
 }

 /* ---- sound effects (soft synthesized chimes) ---- */
 function sfx(fr,d=1,type='sine',to){
  if(!AC||muted)return;
  try{
   const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();
   o.type=type;o.frequency.setValueAtTime(fr,t);if(to)o.frequency.exponentialRampToValueAtTime(to,t+d);
   g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(type==='sawtooth'?.06:.14,t+.05);g.gain.exponentialRampToValueAtTime(.0001,t+d);
   o.connect(g);g.connect(master);o.start(t);o.stop(t+d+.05);
  }catch(e){}
 }

 function setMuted(m){
  muted=!!m;applyMusic();
  if(voice)voice.muted=muted;
  if(master&&AC)master.gain.setTargetAtTime(muted?0:.55,AC.currentTime,.1);
  if(muted){try{speechSynthesis.cancel()}catch(e){}}
  const b=$('#mute');b.textContent=muted?'Sound off':'Sound on';b.setAttribute('aria-pressed',String(muted));
  b.setAttribute('aria-label',muted?'Unmute sound':'Mute sound');
 }
 return{init,startMusic,playVoice,stopVoice,sfx,setMuted,toggle:()=>setMuted(!muted),get muted(){return muted}};
})();
const sfx=Snd.sfx;
