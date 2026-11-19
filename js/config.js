"use strict";
/* ============================================================
   CONFIG — the only file you normally need to edit.
   Files go in assets/ (see UPLOAD-GUIDE.docx). Keep the filenames.
   ============================================================ */
const CFG={
 title:"A little film, made only for you",
 musicSrc:"assets/audio/background-music.mp3",   // your song
 voiceSrc:"assets/audio/my-voice.mp3",           // your recording: "I love you, Sanchari."
 welcome:"Some walks are worth remembering.",
 say:"I love you, Sanchari",                     // spoken only if my-voice.mp3 is missing
 forever:["Every road I walk leads back to you."],

 /* 3D people. false = built-in procedural couple (works everywhere).
    true  = load assets/models/*.glb (rigged, animated). Needs a local web server,
    see README.md. If a model fails to load, the built-in couple is used. */
 useModels:false,
 models:{male:"assets/models/male-character.glb",female:"assets/models/female-character.glb"},
 modelHeight:{male:1.82,female:1.7},

 photos:[
  {src:"assets/photos/photo-01.jpg",q:"The best place in the world is right next to you."},
  {src:"assets/photos/photo-02.jpg",q:"Heads together, hearts even closer."},
  {src:"assets/photos/photo-03.jpg",q:"You make every ordinary day feel like magic."}],

 /* the two stars chapter (new) */
 stars:{a:"Agnik",b:"Sanchari",
  q1:"Two stars, a whole sky apart, and still they kept finding each other.",
  q2:"And then, only one light."},

 letters:[
  {to:"Bubu,",body:"I don’t know how to fit this much love into words, but I’m going to try. You are the first thing I think about when I wake up and the last thing on my mind before I sleep. Every small moment with you, even the silly and ordinary ones, turns into something I want to keep forever. I love the way you smile, the way you rest your head on my shoulder, the way you make everything feel lighter. That is how much I love you, Bubu, more than I can ever say out loud.",from:"Yours, always — Agnik"},
  {to:"My Bubu,",body:"You are mine, and you are my whole world. Whatever the day brings, the moment I see you everything feels like home. You are my calm, my favourite person, my reason to smile on the heaviest days. I hold on to you the way I hold on to my happiest dreams, and I never want to let go. Thank you for being mine, Bubu. You are my world, today and every day after.",from:"Only yours"},
  {to:"Bubu, my love,",body:"If I could pour my heart onto this page, it still would not be enough to show how much I love you. I love you in the loud, happy moments and in the quiet ones, in every laugh and every little fight we melt away with a hug. I love you more than yesterday, and tomorrow I will love you more than today. Whatever comes next, I want to walk through it with you, hand in hand. This is how much I love you, Bubu, endlessly.",from:"Forever yours, Agnik"}]
};
const CAP=["Chapter I · The Path","Chapter II · The Temple","Chapter III · Memories","Chapter IV · Letters","Chapter V · Two Stars","Chapter VI · The Cherry Blossom Garden"];

/* ---------- world constants (do not need editing) ---------- */
const DZ=-150,          // temple on the path
      HX=600,           // palace hall x offset
      GZ=-480,          // cherry garden z
      CX=-900;          // cosmos x offset

/* ---------- tiny utilities ---------- */
const $=s=>document.querySelector(s), rnd=(a,b)=>a+Math.random()*(b-a);
const Q={ // quality + motion settings, shared by every module
 mobile:/Android|iPhone|iPad|Mobi/i.test(navigator.userAgent),
 reduced:!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches),
 low:false,pr:1,scale:1};
Q.low=Q.mobile||(navigator.hardwareConcurrency||8)<=4;
Q.pr=Math.min(window.devicePixelRatio||1,Q.low?1.25:1.75);
Q.scale=Q.low?.55:1;                      // particle count multiplier
const show=(s,d=1.5)=>{const e=$(s);e.style.display='flex';gsap.fromTo(e,{opacity:0},{opacity:1,duration:d,overwrite:true})};
const hide=(s,d=1)=>gsap.to(s,{opacity:0,duration:d,overwrite:true,onComplete:()=>{$(s).style.display='none'}});
const setTag=i=>{$('#cap').textContent=CAP[i];gsap.fromTo('#cap',{opacity:0,y:8},{opacity:.9,y:0,duration:1.6,overwrite:'auto'})};
const cue=t=>{$('#cq').textContent=t;gsap.fromTo('#cq',{opacity:0,y:10},{opacity:1,y:0,duration:1.4,overwrite:'auto'})},
      uncue=()=>gsap.to('#cq',{opacity:0,duration:.8,overwrite:'auto'});

/* ---------- compatibility: Three r128 has no CapsuleGeometry (it arrived in r139).
   The original file used it, which crashed the whole script and left every button dead. ---------- */
if(!THREE.CapsuleGeometry){
 THREE.CapsuleGeometry=class CapsuleGeometry extends THREE.LatheGeometry{
  constructor(radius=1,length=1,capSegments=4,radialSegments=8){
   const pts=[],h=length/2;
   for(let i=0;i<=capSegments;i++){const a=-Math.PI/2+(i/capSegments)*(Math.PI/2);pts.push(new THREE.Vector2(Math.cos(a)*radius,Math.sin(a)*radius-h))}
   for(let i=0;i<=capSegments;i++){const a=(i/capSegments)*(Math.PI/2);pts.push(new THREE.Vector2(Math.cos(a)*radius,Math.sin(a)*radius+h))}
   pts[0].x=Math.max(pts[0].x,1e-4);pts[pts.length-1].x=Math.max(pts[pts.length-1].x,1e-4);
   super(pts,radialSegments);this.type='CapsuleGeometry'}};
}
