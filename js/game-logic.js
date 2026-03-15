// === ZONE X - Game Logic ===

// ═══════════════════════════════════════════════════════════════
//  MOVEMENT & INTERACTION
// ═══════════════════════════════════════════════════════════════
function killIfColliding(c,r){
  if(state!=='playing')return;
  for(const rob of robots){
    if(!rob.alive)continue;
    if(rob.c===c&&rob.r===r){die('robot');return;}
    if(rob.type==='heavy'){
      if(Math.abs(rob.c-c)+Math.abs(rob.r-r)===1){die('robot');return;}
    }
  }
}

function doMove(dx,dy){
  if(state!=='playing')return;
  // If still animating, queue the input
  if(player.moveProgress<1.0){
    player.hasPending=true;player.nextDx=dx;player.nextDy=dy;
    return;
  }
  commitMove(dx,dy);
}

function commitMove(dx,dy){
  const nc=player.c+dx, nr=player.r+dy;
  if(nc<0||nr<0||nc>=COLS||nr>=ROWS)return;
  const t=map[nr][nc];

  // Force field
  if(t===T.FORCE_FIELD){
    if(dx!==1){flash=0.4;flashCol=C.ff;return;}
  }
  // Crumbly
  if(t===T.CRUMBLY){
    if(spadeCarried){map[nr][nc]=T.FLOOR;spawnCrumble(nc,nr);sfx.crumble();return;}
    return;
  }
  // Solid walls
  if(solid(nc,nr)){
    if(t===T.GREEN_DOOR&&keysCarried>0){
      keysCarried--;map[nr][nc]=T.FLOOR;
      sfx.key();burst(nc,nr,C.gDoor,12);
    } else return;
  }
  // Closed laser = instant death
  if(t===T.LASER_DOOR&&!laserOpen){die('laser');return;}

  // Commit grid position
  player.c=nc;player.r=nr;
  player.animT++;
  stepT++;if(stepT>=4){stepT=0;sfx.step();}
  revealFog(nc,nr);
  // Collision: player walked onto a robot
  killIfColliding(nc,nr);
  if(state!=='playing')return;

  // Start smooth animation toward new tile
  player.startPx=player.px;player.startPy=player.py;
  player.tx=nc*TILE;player.ty=nr*TILE;
  player.moveProgress=0.0;

  // Conveyor push: queue next move automatically
  handleConveyor(nc,nr);

  // Interactions
  if(t===T.ACID_POOL){die('acid');return;}
  if(t===T.ELECTRO_FLOOR&&alarmOn){die('shock');return;}
  interactTile(nc,nr);
}

function handleConveyor(c,r){
  const t=map[r][c];
  let cdx=0,cdy=0;
  if(t===T.CONVEYOR_R)cdx=1;
  else if(t===T.CONVEYOR_L)cdx=-1;
  else if(t===T.CONVEYOR_U)cdy=-1;
  else if(t===T.CONVEYOR_D)cdy=1;
  if(cdx||cdy){
    sfx.conveyor();
    // schedule automatic push after brief delay
    conveyorPush={dx:cdx,dy:cdy,t:0.25};
  }
}

function interactTile(c,r){
  const t=map[r][c];

  if(t===T.PLUTONIUM){
    map[r][c]=T.FLOOR;
    collectedPlu.add(`${c}:${r}`);
    pluCarried++;pluLeft--;
    if(radTimer<=0)radTimer=radMax;
    score+=CONF.PLU_SCORE;
    addCombo();
    sfx.pickup();burst(c,r,C.plu,16);
    addPopup(c,r,'+'+CONF.PLU_SCORE);
    if(pluLeft===0)openExit();
  }
  if(t===T.CONTAINER&&pluCarried>0){
    const n=pluCarried,pts=n*n*500*(1+combo*0.1)|0;
    score+=pts;if(score>hiScore)hiScore=score;
    sfx.cont();flash=0.5;flashCol=C.cont;
    burst(c,r,C.cont,28);
    const pluTxt = n>1 ? ' x'+n : '';
    const comboTxt = combo>1 ? ' COMBO x'+combo : '';
    addPopup(c,r,'+'+pts+pluTxt+comboTxt);
    if(n>=3)burst(c,r,'#fff',30);
    pluCarried=0;radTimer=0;
    combo=0;comboTimer=0;
  }
  if(t===T.KEY){
    map[r][c]=T.FLOOR;keysCarried++;score+=CONF.KEY_SCORE;
    sfx.key();burst(c,r,C.key,10);addPopup(c,r,'+'+CONF.KEY_SCORE+' KEY');
  }
  if(t===T.MAT_PICKUP){
    map[r][c]=T.FLOOR;matsCarried++;score+=CONF.MAT_SCORE;
    burst(c,r,C.mat,8);
  }
  if(t===T.TIME_ICON){
    map[r][c]=T.FLOOR;
    radTimer=Math.min(radMax,radTimer+12);score+=CONF.TIME_SCORE;
    sfx.time();flash=0.3;flashCol=C.time;
    burst(c,r,C.time,14);addPopup(c,r,'+'+CONF.TIME_SCORE+' TIME');
  }
  if(t===T.BONUS){
    map[r][c]=T.FLOOR;score+=CONF.BONUS_SCORE;
    sfx.bonus();burst(c,r,C.bonus,20);addPopup(c,r,'+'+CONF.BONUS_SCORE+' BONUS!');
  }
  if(t===T.SPADE){
    map[r][c]=T.FLOOR;spadeCarried=true;score+=CONF.SPADE_SCORE;
    sfx.spade();burst(c,r,C.spade,10);addPopup(c,r,'SPADE!');
  }
  if(t===T.SLAM_DOOR){
    map[r][c]=T.WALL;shake=5;sfx.slam();
    burst(c,r,C.slam,14);
  }
  if(t===T.AIR_LOCK){sfx.airlock();triggerAirLock(c,r);}
  if(t===T.WARP_DOOR) doWarp(c,r);
  if(t===T.OUT_DOOR&&outOpen) levelDone();
  if(t===T.CHEST) openChest(c,r);
  if(t===T.ALARM_LIGHT&&!alarmOn) triggerAlarm();
}

function openChest(c,r){
  const key=`${c}:${r}`;
  const item=CHEST_CONTENTS[key];
  sfx.chest();burst(c,r,C.chest,18);
  map[r][c]=T.FLOOR;
  if(item===T.KEY){keysCarried++;addPopup(c,r,'KEY inside!');}
  else if(item===T.SPADE){spadeCarried=true;addPopup(c,r,'SPADE inside!');}
  else if(item===T.TIME_ICON){radTimer=Math.min(radMax,radTimer+8);addPopup(c,r,'TIME inside!');}
  else if(item===T.BONUS){score+=CONF.BONUS_SCORE;addPopup(c,r,'+'+CONF.BONUS_SCORE+' inside!');}
  else addPopup(c,r,'Empty...');
  score+=CONF.PLU_SCORE;
}

function triggerAlarm(){
  alarmOn=true;alarmT=0;alarmSfxT=0;sfx.alarm();
  flash=0.5;flashCol=C.alarm;
  addPopup(player.c,player.r,'☢ ALARM! ☢');
  // Electro floors activate; robots speed up briefly
  for(const rob of robots)rob.speed*=1.3;
}

function triggerAirLock(c,r){
  for(let d=1;d<=5;d++){
    for(const[dc,dr]of[[d,0],[-d,0],[0,d],[0,-d]]){
      const nc=c+dc,nr=r+dr;
      if(nc>=0&&nr>=0&&nc<COLS&&nr<ROWS&&map[nr][nc]===T.WALL){
        map[nr][nc]=T.FLOOR;burst(nc,nr,C.air,10);return;
      }
    }
  }
}

function doWarp(c,r){
  const p=WARP_PAIRS.find(p=>p.from.c===c&&p.from.r===r);
  if(!p)return;
  sfx.warp();flash=0.7;flashCol=C.warp;
  player.c=p.to.c;player.r=p.to.r;
  player.px=p.to.c*TILE;player.py=p.to.r*TILE;
  player.tx=player.px;player.ty=player.py;
  player.moveProgress=1.0;
  burst(p.to.c,p.to.r,C.warp,22);shake=7;
  revealFog(p.to.c,p.to.r);
}

function openExit(){
  outOpen=true;sfx.exitOpen();flash=0.6;flashCol=C.out;
  for(let r=0;r<ROWS;r++)
    for(let c=0;c<COLS;c++)
      if(map[r][c]===T.OUT_DOOR)burst(c,r,C.out,20);
  addPopup(player.c,player.r,'EXIT UNLOCKED!');
}

function dropPlu(){
  if(state!=='playing'||pluCarried<=0||!map.length)return;
  const n=pluCarried;pluCarried=0;pluLeft+=n;radTimer=0;
  score=Math.max(0,score-CONF.DROP_PLU_PENALTY*n);flash=0.4;flashCol='#ff4400';
  addPopup(player.c,player.r,`-${CONF.DROP_PLU_PENALTY*n} (DROPPED)`);
  combo=0;comboTimer=0;
  const dirs=[[0,1],[1,0],[0,-1],[-1,0],[1,1],[-1,1],[1,-1],[-1,-1]];
  let placed=0;
  for(const[dc,dr]of dirs){
    if(placed>=n)break;
    const nc=player.c+dc,nr=player.r+dr;
    if(nc>=0&&nr>=0&&nc<COLS&&nr<ROWS&&map[nr][nc]===T.FLOOR){
      map[nr][nc]=T.PLUTONIUM;placed++;burst(nc,nr,C.plu,8);
    }
  }
}

function placeMat(){
  if(state!=='playing'||matsCarried<=0||!player||player.facing===undefined)return;
  const facing=player.facing||0;
  const fDir=[[1,0],[0,1],[-1,0],[0,-1]][facing];
  if(!fDir)return;
  const nc=player.c+fDir[0],nr=player.r+fDir[1];
  if(nc>=0&&nr>=0&&nc<COLS&&nr<ROWS&&map[nr][nc]===T.FLOOR){
    map[nr][nc]=T.MAT_PICKUP;matsCarried--;
    sfx.mat();burst(nc,nr,C.mat,6);
  }
}

function addCombo(){
  combo++;comboTimer=4.0;
  if(combo>=2)sfx.combo(combo);
}

function solid(c,r){
  if(c<0||r<0||c>=COLS||r>=ROWS)return true;
  const t=map[r][c];
  return t===T.WALL||t===T.GREEN_DOOR||t===T.SLAM_DOOR||
    (t===T.CRUMBLY&&!spadeCarried);
}

// ═══════════════════════════════════════════════════════════════
//  DIE / WIN
// ═══════════════════════════════════════════════════════════════
function die(cause){
  if(state!=='playing')return;
  state='dead';deathT=2.0;sfx.death();shake=14;
  if(cause==='acid')flash=0.8,flashCol='#44ff44';
  else if(cause==='shock')flash=0.8,flashCol=C.elec;
  else flash=0.8,flashCol='#ff0000';
  spawnDeathPx(player.px+TILE/2,player.py+TILE/2);
  lives--;
}
function respawn(){
  if(lives<=0){state='over';return;}
  // Preserve alarm across reload
  const savedAlarmOn=alarmOn,savedAlarmT=alarmT,savedAlarmSfxT=alarmSfxT;
  // Full reload: restores map, robots, cameras, player from level data
  loadLevelByIndex(currentLevelIndex);
  // Remove all previously collected plutonium from the restored map
  for(const key of collectedPlu){
    const[c,r]=key.split(':').map(Number);
    if(map[r]&&map[r][c]===T.PLUTONIUM)map[r][c]=T.FLOOR;
  }
  // Recount pluLeft
  pluLeft=0;
  for(let r=0;r<ROWS;r++)
    for(let c=0;c<COLS;c++)
      if(map[r][c]===T.PLUTONIUM)pluLeft++;
  if(pluLeft===0)outOpen=true;
  // Restore alarm
  if(savedAlarmOn){
    alarmOn=true;alarmT=savedAlarmT;alarmSfxT=savedAlarmSfxT;
    for(const rob of robots)rob.speed*=1.3;
  }
  state='playing';
}
function levelDone(){
  state='win';
  const bonus=CONF.ZONE_BONUS_BASE*zone+(totalT<60?CONF.ZONE_FAST_BONUS:0)+(lives*CONF.LIVES_BONUS);
  score+=bonus;zoneScore=bonus;
  if(score>hiScore)hiScore=score;
  sfx.win();flash=0.8;flashCol=C.out;
  // Auto-advance to next JSON level after 2.5 s
  if(currentLevelIndex>0&&currentLevelIndex<levelCount){
    setTimeout(()=>{if(state==='win')nextZone();},2500);
  }
}
function nextZone(){
  zone++;state='playing';
  collectedPlu.clear(); // fresh level, reset collected tracking
  if(currentLevelIndex>0&&currentLevelIndex<levelCount){
    currentLevelIndex++;
    resetLevel();
    loadLevelByIndex(currentLevelIndex);
  } else {
    resetLevel();
  }
}
