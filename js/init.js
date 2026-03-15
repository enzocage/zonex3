// === ZONE X - Init ===

// ═══════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════
function startGame(){
  ea();
  syncLevelIndex();
  score=0;lives=CONF.START_LIVES;zone=1;hiScore=Math.max(hiScore,score);
  zoneScore=0;
  resetLevel(); // immer zuerst: gültiger Spielzustand, Loop läuft stabil
  state='playing';
  if(currentLevelIndex>0){
    loadLevelByIndex(currentLevelIndex); // überschreibt Map wenn XHR fertig
  }
}
function resetLevel(){
  map=MAP_BASE.map(r=>[...r]);
  pluLeft=0;outOpen=false;
  laserTick=0;laserOpen=false;
  particles=[];popups=[];
  radTimer=0;pluCarried=0;keysCarried=0;
  matsCarried=CONF.START_MATS;spadeCarried=false;chestKeyCarried=false;
  alarmOn=false;alarmT=0;alarmSfxT=0;
  shake=0;flash=0;
  totalT=0;stepT=0;
  combo=0;comboTimer=0;
  conveyorPush={dx:0,dy:0,t:0};
  fogRevealed=new Set();

  for(let r=0;r<ROWS;r++)
    for(let c=0;c<COLS;c++)
      if(map[r][c]===T.PLUTONIUM)pluLeft++;

  player={c:2,r:2,facing:0,animT:0,
          px:2*TILE,py:2*TILE,       // pixel draw position (top-left of tile)
          tx:2*TILE,ty:2*TILE,       // target pixel position
          moving:false,moveProgress:1.0,
          nextDx:0,nextDy:0,hasPending:false};

  robots=ROBOT_DEFS.map((d,i)=>({
    c:d.c,r:d.r,px:d.c*TILE,py:d.r*TILE,
    tx:d.c*TILE,ty:d.r*TILE,moveProgress:1.0,prevC:d.c,prevR:d.r,
    axis:d.axis,range:d.range,
    speed:d.speed*(1+zone*0.04),
    type:d.type,dir:1,steps:0,
    moveT:0,alertT:0,id:i,alive:true,
    // heavy robots are slower but kill on adjacent tile
    stunT:0,
  }));

  cameras=CAM_DEFS.map(d=>({
    c:d.c,r:d.r,range:d.range,
    angleStart:d.angleStart,angleSweep:d.angleSweep,
    angle:d.angleStart,dir:1,
    speed:0.8,spotted:false,spotTimer:0,
  }));

  // reveal start area fog
  revealFog(player.c,player.r);
  updateCamera(true);
}

function revealFog(c,r){
  const R=CONF.FOG_RADIUS;
  for(let dy=-R;dy<=R;dy++)
    for(let dx=-R;dx<=R;dx++){
      if(dx*dx+dy*dy<=R*R)
        fogRevealed.add(`${c+dx}:${r+dy}`);
    }
}
