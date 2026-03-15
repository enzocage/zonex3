// === ZONE X - Input ===

// ═══════════════════════════════════════════════════════════════
//  INPUT MODULE
// ═══════════════════════════════════════════════════════════════
const input = {
  keys: {},       // raw keydown state
};

// Continuous movement: how long a key must be held before auto-repeat starts
const KEY_REPEAT_DELAY = CONF.KEY_REPEAT_DELAY;  // seconds before first repeat (hold to run)
const KEY_REPEAT_RATE  = CONF.KEY_REPEAT_RATE;   // seconds between repeats (tile/sec feel)
let keyHeld={dx:0,dy:0,t:0,started:false};

document.addEventListener('keydown',e=>{
  const prev=input.keys[e.code];
  input.keys[e.code]=true;
  if(!prev) onKey(e.code);  // fire once on first press
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space',
      'KeyW','KeyA','KeyS','KeyD'].includes(e.code))
    e.preventDefault();
});
document.addEventListener('keyup',e=>{
  input.keys[e.code]=false;
  // If released dir key, clear held state
  updateHeldDir();
});

function getHeldDir(){
  if(input.keys['ArrowLeft']||input.keys['KeyA'])  return [-1,0];
  if(input.keys['ArrowRight']||input.keys['KeyD']) return [1,0];
  if(input.keys['ArrowUp']||input.keys['KeyW'])    return [0,-1];
  if(input.keys['ArrowDown']||input.keys['KeyS'])  return [0,1];
  return null;
}
function updateHeldDir(){
  const d=getHeldDir();
  if(!d){keyHeld={dx:0,dy:0,t:0,started:false};}
  else {
    if(d[0]!==keyHeld.dx||d[1]!==keyHeld.dy){
      keyHeld={dx:d[0],dy:d[1],t:0,started:false};
    }
  }
}

function setFacing(dx,dy){
  if(dx>0)player.facing=0;
  else if(dx<0)player.facing=2;
  else if(dy>0)player.facing=1;
  else if(dy<0)player.facing=3;
}

// ── Input sub-handlers (called from processInput) ───────────────
function processHelpInput(code){
  if(code==='KeyH'||code==='Escape'){helpOn=false;}
  if(code==='ArrowRight'||code==='KeyD') helpPage=(helpPage+1)%HELP_PAGES;
  if(code==='ArrowLeft'||code==='KeyA')  helpPage=(helpPage-1+HELP_PAGES)%HELP_PAGES;
}

function processTitleInput(code){
  if(code==='Enter'||code==='Space'){
    // Wenn das Level-Dropdown fokussiert ist, nur den Fokus entfernen, nicht starten
    const sel=document.getElementById('levelSelect');
    if(sel&&document.activeElement===sel){sel.blur();return;}
    syncLevelIndex();
    ea();startGame();
  }
}

function processPlayingInput(code){
  if(pauseOn)return;
  if(code==='ArrowLeft'||code==='KeyA')  { player.facing=2; doMove(-1,0); }
  else if(code==='ArrowRight'||code==='KeyD'){ player.facing=0; doMove(1,0); }
  else if(code==='ArrowUp'||code==='KeyW')   { player.facing=3; doMove(0,-1); }
  else if(code==='ArrowDown'||code==='KeyS') { player.facing=1; doMove(0,1); }
  else if(code==='Space')  placeMat();
  else if(code==='KeyX')   dropPlu();
  else if(code==='KeyF')   fogEnabled=!fogEnabled;
}

function onKey(code){
  if(helpOn){ processHelpInput(code); return; }
  if(editorOn){ onEditorKey(code); return; }
  if(state==='title')  { processTitleInput(code); return; }
  if(state==='over')   { if(code==='Enter'){stopEventMusic();state='title';} return; }
  if(state==='win')    { if(code==='Enter')nextZone(); return; }
  if(code==='KeyH')    { helpOn=!helpOn; return; }
  if(code==='KeyE')    {
    if(!editorOn){
      // Snapshot current level into editor
      editorOn=true; pauseOn=true;

      if(state==='playing'&&map.length){
        if(!ed.map) editorInit();
        ed.map=map.map(r=>[...r]);
        ed.playerC=player.c; ed.playerR=player.r;
        // Center camera on player
        ed.camX=Math.max(0,Math.min(COLS-edVW(),player.c-Math.floor(edVW()/2)));
        ed.camY=Math.max(0,Math.min(ROWS-edVH(),player.r-Math.floor(edVH()/2)));
      } else if(!ed.map) {
        editorInit();
      }
    } else {
      editorOn=false; pauseOn=false;

    }
    return;
  }
  if(code==='KeyZ')    { minimapOn=!minimapOn; return; }
  if(code==='Escape')  { pauseOn=!pauseOn; sfx.pause(); return; }
  if(state==='playing') processPlayingInput(code);
}

// ── processInput: per-frame input dispatch (called from game loop) ──
function processInput(dt){
  if(state!=='playing'||pauseOn||helpOn||editorOn)return;
  // Continuous keyboard movement
  const d=getHeldDir();
  if(!d){keyHeld={dx:0,dy:0,t:0,started:false};return;}
  const [dx,dy]=d;
  if(dx!==keyHeld.dx||dy!==keyHeld.dy){
    keyHeld={dx,dy,t:0,started:false};
    return;
  }
  keyHeld.t+=dt;
  if(!keyHeld.started){
    if(keyHeld.t>=KEY_REPEAT_DELAY){
      keyHeld.started=true;
      keyHeld.t=0;
      setFacing(dx,dy);
      doMove(dx,dy);
    }
  } else {
    if(keyHeld.t>=KEY_REPEAT_RATE){
      keyHeld.t=0;
      setFacing(dx,dy);
      doMove(dx,dy);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
//  INPUT — Touch (invisible swipe + hold-to-repeat)
//  Strategy:
//   • Swipe from anywhere: low threshold (14px), fires immediately on move
//   • Hold & drag: continues to move while finger is held in a direction
//   • Double-tap: place mat
//   • Tap (no swipe): also triggers a move if on a directional half of screen
// ═══════════════════════════════════════════════════════════════
let touch={active:false,x0:0,y0:0,x:0,y:0,t0:0,fired:false,tapT:0,tapN:0};
const SWIPE_MIN=CONF.SWIPE_MIN;     // px in canvas-space before direction locks
const SWIPE_LOCK=CONF.SWIPE_LOCK;   // px to lock in and fire
const HOLD_REPEAT=CONF.HOLD_REPEAT; // seconds between repeat moves while holding
let holdTimer=0,holdDx=0,holdDy=0;

function touchDir(dx,dy){
  if(Math.abs(dx)>Math.abs(dy)){
    return dx>0?[1,0]:[-1,0];
  } else {
    return dy>0?[0,1]:[0,-1];
  }
}

canvas.addEventListener('touchstart',e=>{
  e.preventDefault();
  ea();

  // 2-finger touch → place mat behind player
  if(e.touches.length>=2&&state==='playing'&&!pauseOn){
    placeMatBehind();
    return;
  }

  const now=Date.now();
  const pt=e.touches[0];
  const rect=canvas.getBoundingClientRect();
  const cx=(pt.clientX-rect.left)/scale;
  const cy=(pt.clientY-rect.top)/scale;
  touch={active:true,x0:cx,y0:cy,x:cx,y:cy,t0:now,fired:false,tapT:touch.tapT,tapN:touch.tapN};
  holdDx=0;holdDy=0;holdTimer=0;

  // Screen-state taps
  if(state==='title')  { ea();startGame(); return; }
  if(state==='over')   { stopEventMusic();state='title'; return; }
  if(state==='win')    { nextZone(); return; }
},{passive:false});

canvas.addEventListener('touchmove',e=>{
  e.preventDefault();
  if(!touch.active||state!=='playing'||pauseOn)return;
  const pt=e.touches[0];
  const rect=canvas.getBoundingClientRect();
  touch.x=(pt.clientX-rect.left)/scale;
  touch.y=(pt.clientY-rect.top)/scale;
  const dx=touch.x-touch.x0, dy=touch.y-touch.y0;
  const dist=Math.sqrt(dx*dx+dy*dy);

  if(dist>=SWIPE_MIN && !touch.fired){
    const [fdx,fdy]=touchDir(dx,dy);
    // Fire first step as soon as threshold crossed
    if(dist>=SWIPE_MIN){
      touch.fired=true;
      player.facing=fdx>0?0:fdx<0?2:fdy>0?1:3;
      doMove(fdx,fdy);
      holdDx=fdx;holdDy=fdy;holdTimer=HOLD_REPEAT;
    }
  }
  // Update hold direction if swipe changes significantly
  if(touch.fired && dist>=SWIPE_LOCK){
    const [fdx,fdy]=touchDir(dx,dy);
    if(fdx!==holdDx||fdy!==holdDy){
      holdDx=fdx;holdDy=fdy;holdTimer=0;
      player.facing=fdx>0?0:fdx<0?2:fdy>0?1:3;
    }
  }
},{passive:false});

canvas.addEventListener('touchend',e=>{
  e.preventDefault();
  const now=Date.now();
  if(!touch.active){touch.active=false;return;}

  const dx=touch.x-touch.x0, dy=touch.y-touch.y0;
  const dist=Math.sqrt(dx*dx+dy*dy);
  const elapsed=now-touch.t0;

  if(state==='playing'&&!pauseOn){
    if(!touch.fired && dist<SWIPE_MIN && elapsed<300){
      // Tap → move toward tapped side
      const cx=touch.x0, cy=touch.y0;
      const midX=CW/2, midY=(VIEW_H*TILE)/2;
      const adx=Math.abs(cx-midX), ady=Math.abs(cy-midY);
      if(adx>ady){
        const fd=cx>midX?1:-1;
        player.facing=fd>0?0:2;doMove(fd,0);
      } else {
        const fd=cy>midY?1:-1;
        player.facing=fd>0?1:3;doMove(0,fd);
      }
    }
  }
  touch.active=false;
  holdDx=0;holdDy=0;holdTimer=0;
},{passive:false});

// Hold-to-repeat: processed inside the game update loop
function updateTouchHold(dt){
  if(!touch.active||!touch.fired||state!=='playing'||pauseOn)return;
  if(holdDx===0&&holdDy===0)return;
  holdTimer-=dt;
  if(holdTimer<=0){
    holdTimer=HOLD_REPEAT;
    player.facing=holdDx>0?0:holdDx<0?2:holdDy>0?1:3;
    doMove(holdDx,holdDy);
  }
}
