// === ZONE X - Audio Engine ===

// ═══════════════════════════════════════════════════════════════
//  AUDIO ENGINE
// ═══════════════════════════════════════════════════════════════
let aCtx=null;
let sfxGain=null;   // master sfx gain node
let musicGain=null; // master music gain node
let musicEl=null;   // <audio> element for streaming music
let musicOn=false;
let sfxVol=0.55;    // sfx master volume 0-1
let musicVol=0.10;  // music start at 10%

function ea(){
  if(aCtx)return;
  aCtx=new(window.AudioContext||window.webkitAudioContext)();
  sfxGain=aCtx.createGain();
  sfxGain.gain.value=sfxVol;
  sfxGain.connect(aCtx.destination);
  musicGain=aCtx.createGain();
  musicGain.gain.value=musicVol;
  musicGain.connect(aCtx.destination);
  initMusic();
}

function initMusic(){
  if(musicEl)return; // already created
  musicEl=document.createElement('audio');
  // No crossOrigin + no createMediaElementSource:
  // connecting <audio> to Web Audio requires CORS headers from the server.
  // vgmtreasurechest.com does not send them, so we play the element directly
  // and control volume via musicEl.volume instead of a gain node.
  musicEl.loop=true;
  musicEl.preload='auto';
  musicEl.volume=musicVol;
  musicEl.src='https://nu.vgmtreasurechest.com/soundtracks/c64-remix-2018/deigeeid/01.%20Lightforce.mp3';
  document.body.appendChild(musicEl);
}

function toggleMusic(){
  musicOn=!musicOn;
  if(!musicEl) initMusic();
  if(musicOn){
    musicEl.play().catch(e=>console.warn('music play failed:',e));
  } else {
    musicEl.pause();
  }
}

function setMusicVol(v){
  musicVol=Math.max(0,Math.min(1,v));
  if(musicEl) musicEl.volume=musicVol;
}
function setSfxVol(v){
  sfxVol=Math.max(0,Math.min(1,v));
  if(sfxGain) sfxGain.gain.setTargetAtTime(sfxVol,aCtx.currentTime,0.05);
}
function updateMusicBtn(){
  const b=document.getElementById('btnMusic');
  if(b) b.textContent=musicOn?'♪ ON':'♪ OFF';
}

// ── Event Jingles ────────────────────────────────────────────────
// Short MP3 clips for game events. Volume scales with the music slider
// (musicVol default 0.10 → factor 8 → 0.80 perceived level at default).
const JINGLE={
  plutonium: 'https://fi.zophar.net/soundfiles/commodore-64/wizball/08_Jingle%20%233.mp3',
  gameOver:  'https://fi.zophar.net/soundfiles/commodore-64/bubble-bobble/12_Game%20Over.mp3',
  gameStart: 'https://fi.zophar.net/soundfiles/commodore-64/ball-blasta/02_Game%20On%21.mp3',
  alarm:     'https://fi.zophar.net/soundfiles/commodore-64/bubble-bobble/06_Skull%20Monster%20Appearance.mp3',
  levelWin:  'https://fi.zophar.net/soundfiles/commodore-64/hyper-sports/03_World%20Record.mp3',
  radCrit:   'https://fi.zophar.net/soundfiles/commodore-64/katakis/11_Boss%20Theme%205%20and%2012.mp3',
};
const jingleEls={};
let radCritOn=false;

function _jEl(key,loop=false){
  if(!jingleEls[key]){
    const el=document.createElement('audio');
    el.preload='auto';
    el.src=JINGLE[key];
    el.loop=loop;
    document.body.appendChild(el);
    jingleEls[key]=el;
  }
  return jingleEls[key];
}
// Volume relative to music slider (rel=1 → 80 % at default 10 % slider)
function _jVol(rel=1){return Math.min(1,musicVol*8*rel);}

// Play jingle alongside background music (one-shot)
function playJingle(key,rel=1){
  const el=_jEl(key,false);
  el.loop=false;
  el.volume=_jVol(rel);
  el.currentTime=0;
  el.play().catch(()=>{});
}

// Stop bg + all jingles, play this one (e.g. Game Over loops, others once)
function playJingleExclusive(key,loop=false,rel=1){
  if(musicEl)musicEl.pause();
  for(const k in jingleEls){if(k!==key){jingleEls[k].pause();jingleEls[k].currentTime=0;}}
  radCritOn=false;
  const el=_jEl(key,loop);
  el.loop=loop;
  el.volume=_jVol(rel);
  el.currentTime=0;
  el.play().catch(()=>{});
}

// Stop all event jingles and optionally resume background music
function stopEventMusic(){
  for(const el of Object.values(jingleEls)){el.pause();el.currentTime=0;}
  radCritOn=false;
  if(musicOn&&musicEl)musicEl.play().catch(()=>{});
}

// Called every frame from update() – starts/stops the radiation-critical loop
function setRadCritMusic(on){
  if(on===radCritOn)return;
  radCritOn=on;
  const el=_jEl('radCrit',true);
  if(on){
    el.loop=true;
    el.volume=_jVol(0.2); // 20 % level as requested
    el.currentTime=0;
    el.play().catch(()=>{});
  }else{
    el.pause();el.currentTime=0;
  }
}

// ── Synthesis primitives ────────────────────────────────────────
function osc(f,d,type='square',v=0.15,opts={}){
  if(!aCtx||!sfxGain)return;
  const o=aCtx.createOscillator();
  const g=aCtx.createGain();
  o.type=type;
  o.frequency.setValueAtTime(f,aCtx.currentTime);
  if(opts.slide) o.frequency.linearRampToValueAtTime(f+opts.slide,aCtx.currentTime+d);
  if(opts.vibrato){
    const lfo=aCtx.createOscillator(),lg=aCtx.createGain();
    lfo.frequency.value=opts.vibrato.rate||6;
    lg.gain.value=opts.vibrato.depth||8;
    lfo.connect(lg);lg.connect(o.frequency);lfo.start();lfo.stop(aCtx.currentTime+d);
  }
  g.gain.setValueAtTime(0.001,aCtx.currentTime);
  g.gain.linearRampToValueAtTime(v,aCtx.currentTime+(opts.attack||0.005));
  g.gain.setValueAtTime(v,aCtx.currentTime+(opts.attack||0.005));
  g.gain.exponentialRampToValueAtTime(0.001,aCtx.currentTime+d);
  o.connect(g);g.connect(sfxGain);
  o.start();o.stop(aCtx.currentTime+d);
  return o;
}

function noiseN(d,v=0.1,ftype='bandpass',freq=300,q=1){
  if(!aCtx||!sfxGain)return;
  const buf=aCtx.createBuffer(1,Math.ceil(aCtx.sampleRate*d),aCtx.sampleRate);
  const data=buf.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1);
  const src=aCtx.createBufferSource();
  const f=aCtx.createBiquadFilter(),g=aCtx.createGain();
  f.type=ftype;f.frequency.value=freq;f.Q.value=q;
  g.gain.setValueAtTime(v,aCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001,aCtx.currentTime+d);
  src.buffer=buf;src.connect(f);f.connect(g);g.connect(sfxGain);
  src.start();src.stop(aCtx.currentTime+d);
}

function chord(freqs,d,type,v){
  freqs.forEach(f=>osc(f,d,type,v));
}

// ── SFX Library ─────────────────────────────────────────────────
const sfx={
  // Footstep: punchy low thud with tiny pitch variation
  step:()=>{
    if(!aCtx)return;
    const f=55+Math.random()*20;
    osc(f,0.06,'sine',0.09,{attack:0.001,slide:-20});
    noiseN(0.05,0.025,'highpass',2000);
  },

  // Plutonium pickup: bright ascending chime with shimmer
  pickup:()=>{
    ea();
    osc(660,0.08,'sine',0.14,{attack:0.003});
    osc(880,0.12,'sine',0.12,{attack:0.01});
    osc(1320,0.16,'sine',0.08,{attack:0.03});
    setTimeout(()=>osc(1760,0.1,'sine',0.06),60);
  },

  // Container deposit: satisfying multi-layer success sound
  cont:()=>{
    ea();
    osc(220,0.08,'sawtooth',0.1,{attack:0.005});
    setTimeout(()=>{osc(330,0.08,'sawtooth',0.09);},40);
    setTimeout(()=>{osc(440,0.08,'triangle',0.1);},80);
    setTimeout(()=>{osc(880,0.3,'sine',0.18,{attack:0.01,vibrato:{rate:5,depth:10}});},130);
    setTimeout(()=>{osc(1100,0.25,'sine',0.12,{attack:0.015});},180);
    setTimeout(()=>noiseN(0.15,0.07,'bandpass',1200,2),130);
  },

  // Death: descending horror chord with rumble
  death:()=>{
    ea();
    osc(220,0.7,'sawtooth',0.25,{slide:-180,attack:0.01});
    osc(277,0.65,'sawtooth',0.18,{slide:-150,attack:0.01});
    osc(110,0.9,'square',0.15,{slide:-80,attack:0.005});
    noiseN(0.8,0.2,'lowpass',400,0.5);
    setTimeout(()=>noiseN(0.4,0.15,'bandpass',200,1),300);
  },

  // Laser door: sharp electric zap
  laser:()=>{
    ea();
    osc(1800,0.05,'sawtooth',0.18,{slide:-900,attack:0.001});
    noiseN(0.06,0.12,'bandpass',3000,3);
  },

  // Key pickup: bright tinkle
  key:()=>{
    ea();
    osc(1047,0.1,'sine',0.15,{attack:0.003});
    osc(1319,0.14,'sine',0.12,{attack:0.02});
    osc(1568,0.12,'sine',0.08,{attack:0.04});
  },

  // Warp: science fiction teleport sweep
  warp:()=>{
    ea();
    for(let i=0;i<10;i++){
      setTimeout(()=>{
        osc(150+i*90,0.12,'sine',0.09+i*0.01,{attack:0.005});
        if(i%2===0) noiseN(0.06,0.03,'bandpass',500+i*200,2);
      },i*40);
    }
  },

  // Mat placed: dull thud
  mat:()=>{
    ea();
    osc(140,0.12,'square',0.1,{slide:-60,attack:0.003});
    noiseN(0.08,0.06,'lowpass',500);
  },

  // Level win fanfare
  win:()=>{
    ea();
    const melody=[523,659,784,1047,1319];
    melody.forEach((f,i)=>setTimeout(()=>{
      osc(f,0.35,'sine',0.18,{attack:0.01,vibrato:{rate:4,depth:6}});
      osc(f*1.5,0.2,'sine',0.06,{attack:0.02});
    },i*120));
    setTimeout(()=>chord([523,659,784],0.5,'sine',0.12),700);
  },

  // Alarm: two-tone siren
  alarm:()=>{
    ea();
    osc(960,0.12,'sawtooth',0.18,{attack:0.005});
    setTimeout(()=>osc(720,0.12,'sawtooth',0.15,{attack:0.005}),130);
    noiseN(0.1,0.04,'highpass',1500);
  },

  // Chest open: treasure fanfare
  chest:()=>{
    ea();
    osc(523,0.08,'square',0.1,{attack:0.005});
    setTimeout(()=>osc(659,0.08,'square',0.1),60);
    setTimeout(()=>osc(784,0.08,'square',0.1),120);
    setTimeout(()=>osc(1047,0.25,'sine',0.18,{attack:0.01,vibrato:{rate:6,depth:8}}),180);
  },

  // Conveyor: mechanical clunk
  conveyor:()=>{
    ea();
    osc(80,0.05,'square',0.04,{slide:20,attack:0.001});
    noiseN(0.04,0.03,'bandpass',150,2);
  },

  // Electro shock: crackling zap
  shock:()=>{
    ea();
    noiseN(0.3,0.3,'bandpass',800,4);
    osc(120,0.25,'sawtooth',0.2,{slide:200,attack:0.001});
    osc(3600,0.1,'sine',0.08,{attack:0.001});
    setTimeout(()=>noiseN(0.15,0.15,'bandpass',1200,3),100);
  },

  // Combo: ascending pitch ping per stack
  combo:(n)=>{
    ea();
    const f=350+n*70;
    osc(f,0.18,'sine',0.22,{attack:0.008,vibrato:{rate:8,depth:5}});
    osc(f*2,0.1,'sine',0.08,{attack:0.02});
    if(n>=4) noiseN(0.1,0.06,'bandpass',2000,3);
  },

  // Crumble: rock breaking
  crumble:()=>{
    ea();
    noiseN(0.25,0.2,'lowpass',600,0.8);
    osc(120,0.2,'square',0.12,{slide:-50,attack:0.002});
    setTimeout(()=>noiseN(0.15,0.12,'bandpass',300,1),80);
  },

  // Door slam: heavy metal crash
  slam:()=>{
    ea();
    noiseN(0.35,0.25,'lowpass',500,0.5);
    osc(80,0.3,'square',0.2,{slide:-40,attack:0.001});
    osc(160,0.15,'sawtooth',0.12,{slide:-80,attack:0.002});
  },

  // Radiation low warning tick
  radWarn:()=>{
    ea();
    osc(440,0.05,'square',0.1,{attack:0.001});
    setTimeout(()=>osc(440,0.05,'square',0.1,{attack:0.001}),80);
  },

  // Airlock: pressurized whoosh
  airlock:()=>{
    ea();
    noiseN(0.3,0.15,'bandpass',600,2);
    osc(200,0.3,'sine',0.08,{slide:300,attack:0.01});
  },

  // Exit unlocked: triumphant pulse
  exitOpen:()=>{
    ea();
    chord([523,659,784,1047],0.2,'sine',0.08);
    setTimeout(()=>chord([659,784,1047,1319],0.3,'sine',0.1),200);
    setTimeout(()=>osc(1568,0.5,'sine',0.18,{attack:0.02,vibrato:{rate:5,depth:12}}),420);
  },

  // Bonus pickup: sparkle
  bonus:()=>{
    ea();
    for(let i=0;i<6;i++) setTimeout(()=>osc(800+i*180,0.08,'sine',0.1-i*0.012,{attack:0.003}),i*25);
  },

  // Spade pickup: woody thunk
  spade:()=>{
    ea();
    osc(200,0.12,'triangle',0.15,{slide:-80,attack:0.003});
    noiseN(0.1,0.08,'bandpass',400,3);
  },

  // Camera spotted: warning blip
  spotted:()=>{
    ea();
    osc(1200,0.06,'square',0.15,{attack:0.001,slide:-200});
    setTimeout(()=>osc(1200,0.06,'square',0.15,{attack:0.001,slide:-200}),90);
  },

  // Time pickup: clock chime
  time:()=>{
    ea();
    osc(783,0.15,'sine',0.15,{attack:0.005});
    osc(1047,0.18,'sine',0.12,{attack:0.01});
    osc(1319,0.1,'sine',0.06,{attack:0.02});
  },

  // Green door unlock: mechanism click
  doorOpen:()=>{
    ea();
    osc(300,0.04,'square',0.1,{attack:0.001});
    osc(600,0.06,'square',0.08,{attack:0.005});
    noiseN(0.08,0.05,'highpass',1000);
  },

  // Pause: muted click
  pause:()=>{
    ea();
    osc(220,0.08,'triangle',0.08,{attack:0.003});
    osc(440,0.05,'triangle',0.05,{attack:0.005});
  },
};
