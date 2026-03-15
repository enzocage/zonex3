// === ZONE X - AI Level Generator ===

// ═══════════════════════════════════════════════════════════════
//  AI LEVEL GENERATOR  —  Procedural JS implementation
//  No external API needed. Seeded RNG + constraint-based placement.
// ═══════════════════════════════════════════════════════════════

// ── Seeded RNG (mulberry32) ─────────────────────────────────────
function makeRng(seed){
  let s=seed>>>0;
  return function(){
    s+=0x6D2B79F5;
    let t=Math.imul(s^s>>>15,1|s);
    t^=t+Math.imul(t^t>>>7,61|t);
    return ((t^t>>>14)>>>0)/4294967296;
  };
}

// ── Main entry ──────────────────────────────────────────────────
function aiGenerate(){
  if(ed.aiGenerating)return;
  ed.aiGenerating=true;
  ed.aiLastMsg='Generating level...';

  // Use setTimeout so UI redraws the "GENERATING..." state first
  setTimeout(()=>{
    try{
      const result=generateLevel(ed.aiDifficulty, Date.now());
      applyAILevel(result, ed.aiDifficulty);
      ed.aiLastMsg=`Diff ${ed.aiDifficulty}/10 generated! ${result.notes}`;
    }catch(e){
      console.error('Generate error:',e);
      ed.aiLastMsg=`Error: ${String(e).slice(0,70)}`;
    }
    ed.aiGenerating=false;
  },30);
}

// ── Top-level generator ─────────────────────────────────────────
// ── genPhase_rooms: carve rooms and corridors into map ───────────
function genPhase_rooms(genCtx){
  const {m,rng,ri,diff,C}=genCtx;
  const rooms=buildRooms(C.roomCount, rng, ri);

  // Fill everything with walls first
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)m[r][c]=T.WALL;

  // Carve rooms
  for(const room of rooms){
    for(let r=room.r1;r<=room.r2;r++)
      for(let c=room.c1;c<=room.c2;c++)
        m[r][c]=T.FLOOR;
  }

  // Carve corridors between consecutive rooms
  for(let i=0;i<rooms.length-1;i++){
    const a=rooms[i], b=rooms[i+1];
    const ac=ri(a.c1+1,a.c2-1), ar=ri(a.r1+1,a.r2-1);
    const bc=ri(b.c1+1,b.c2-1), br=ri(b.r1+1,b.r2-1);
    carveCorridor(m, ac, ar, bc, br);
  }
  // Extra corridors for higher diff
  if(diff>=5&&rooms.length>=4){
    const a=rooms[0], b=rooms[rooms.length-1];
    const ac=ri(a.c1+1,a.c2-1), ar=ri(a.r1+1,a.r2-1);
    const bc=ri(b.c1+1,b.c2-1), br=ri(b.r1+1,b.r2-1);
    carveCorridor(m, ac, ar, bc, br);
  }

  // Ensure border is wall
  for(let c=0;c<COLS;c++){m[0][c]=T.WALL;m[ROWS-1][c]=T.WALL;}
  for(let r=0;r<ROWS;r++){m[r][0]=T.WALL;m[r][COLS-1]=T.WALL;}

  return rooms;
}

// ── genPhase_doors: place key doors, laser doors, slam doors ─────
function genPhase_doors(genCtx, rooms, nextFloor){
  const {m,ri,C}=genCtx;
  const set=(c,r,t)=>{if(c>=0&&r>=0&&c<COLS&&r<ROWS)m[r][c]=t;};

  // ── 8. Key–Door pairs ────────────────────────────────────────
  for(let k=0;k<C.keyCount;k++){
    const [kc,kr]=nextFloor();
    if(m[kr][kc]===T.FLOOR){set(kc,kr,T.KEY);}
    const doorWall=findDoorWall(m,ri,rooms,k);
    if(doorWall){set(doorWall[0],doorWall[1],T.GREEN_DOOR);}
  }

  // ── 9. Laser doors ───────────────────────────────────────────
  for(let l=0;l<C.laserCount;l++){
    const dw=findDoorWall(m,ri,rooms,l+10);
    if(dw) set(dw[0],dw[1],T.LASER_DOOR);
  }

  // ── 10. Slam doors ───────────────────────────────────────────
  for(let s=0;s<C.slamCount;s++){
    const dw=findDoorWall(m,ri,rooms,s+20);
    if(dw) set(dw[0],dw[1],T.SLAM_DOOR);
  }
}

// ── genPhase_hazards: acid, conveyors, crumbly, chests, pickups ──
function genPhase_hazards(genCtx, nextFloor, pC, pR, contC, contR){
  const {m,pick,C}=genCtx;
  const set=(c,r,t)=>{if(c>=0&&r>=0&&c<COLS&&r<ROWS)m[r][c]=t;};

  // ── 11. Acid pools ───────────────────────────────────────────
  for(let a=0;a<C.acidCount;a++){
    const [ac,ar]=nextFloor();
    if(m[ar][ac]===T.FLOOR&&!(Math.abs(ac-pC)<=3&&Math.abs(ar-pR)<=3)
       &&!(Math.abs(ac-contC)<=2&&Math.abs(ar-contR)<=2))
      set(ac,ar,T.ACID_POOL);
  }

  // ── 12. Conveyor belts ───────────────────────────────────────
  const convDirs=[T.CONVEYOR_R,T.CONVEYOR_L,T.CONVEYOR_U,T.CONVEYOR_D];
  for(let cv=0;cv<C.conveyorCount;cv++){
    const [cc,cr]=nextFloor();
    if(m[cr][cc]===T.FLOOR) set(cc,cr,pick(convDirs));
  }

  // ── 13. Crumbly + Spade ──────────────────────────────────────
  if(C.crumblyCount>0){
    const [sc2,sr2]=nextFloor();
    if(m[sr2][sc2]===T.FLOOR) set(sc2,sr2,T.SPADE);
    for(let cr2=0;cr2<C.crumblyCount;cr2++){
      const [cc,ccr]=nextFloor();
      if(m[ccr][cc]===T.FLOOR) set(cc,ccr,T.CRUMBLY);
    }
  }

  // ── 14. Chests ───────────────────────────────────────────────
  for(let ch=0;ch<C.chestCount;ch++){
    const [cc,cr]=nextFloor();
    if(m[cr][cc]===T.FLOOR) set(cc,cr,T.CHEST);
  }

  // ── 15. Time icons ───────────────────────────────────────────
  for(let ti=0;ti<C.timeIconCount;ti++){
    const [tc,tr]=nextFloor();
    if(m[tr][tc]===T.FLOOR) set(tc,tr,T.TIME_ICON);
  }

  // ── 16. Bonus tiles ──────────────────────────────────────────
  for(let b=0;b<C.bonusCount;b++){
    const [bc,br]=nextFloor();
    if(m[br][bc]===T.FLOOR) set(bc,br,T.BONUS);
  }

  // ── 17. Alarm lights ─────────────────────────────────────────
  if(C.alarmCount>0){
    for(let al=0;al<C.alarmCount;al++){
      const [ac,ar]=nextFloor();
      if(m[ar][ac]===T.FLOOR) set(ac,ar,T.ALARM_LIGHT);
    }
  }

  // ── 18. Electro floors (near alarm) ──────────────────────────
  for(let ef=0;ef<C.electroCount;ef++){
    const [ec,er]=nextFloor();
    if(m[er][ec]===T.FLOOR&&!(Math.abs(ec-pC)<=4&&Math.abs(er-pR)<=4))
      set(ec,er,T.ELECTRO_FLOOR);
  }

  // ── 19. Force fields ─────────────────────────────────────────
  for(let ff=0;ff<C.forceFieldCount;ff++){
    const dw=findDoorWall(m,genCtx.ri,genCtx.rooms||[],ff+30);
    if(dw) set(dw[0],dw[1],T.FORCE_FIELD);
  }
}

// ── genPhase_warpDoors: place warp door pairs ────────────────────
function genPhase_warpDoors(genCtx, rooms){
  const {m,ri,C}=genCtx;
  const set=(c,r,t)=>{if(c>=0&&r>=0&&c<COLS&&r<ROWS)m[r][c]=t;};
  const warpPairs=[];
  if(C.warpPairs>0&&rooms.length>=4){
    for(let wp=0;wp<C.warpPairs;wp++){
      const ra=rooms[wp*2%rooms.length];
      const rb=rooms[(wp*2+2)%rooms.length];
      const wa=[ri(ra.c1+1,ra.c2-1),ri(ra.r1+1,ra.r2-1)];
      const wb=[ri(rb.c1+1,rb.c2-1),ri(rb.r1+1,rb.r2-1)];
      if(m[wa[1]][wa[0]]===T.FLOOR&&m[wb[1]][wb[0]]===T.FLOOR){
        set(wa[0],wa[1],T.WARP_DOOR);
        set(wb[0],wb[1],T.WARP_DOOR);
        warpPairs.push({from:{c:wa[0],r:wa[1]},to:{c:wb[0],r:wb[1]}});
      }
    }
  }
  return warpPairs;
}

// ── genPhase_validate: flood-fill reachability check & patch ─────
function genPhase_validate(genCtx, pC, pR, contC, contR, pluPositions){
  const {m}=genCtx;
  const set=(c,r,t)=>{if(c>=0&&r>=0&&c<COLS&&r<ROWS)m[r][c]=t;};

  // Ensure player start is floor
  m[pR][pC]=T.FLOOR;
  // Ensure container reachable (flood-fill)
  const reachable=floodFill(m,pC,pR);
  if(!reachable.has(`${contC}:${contR}`)){
    for(const key of reachable){
      const [fc,fr]=key.split(':').map(Number);
      if(m[fr][fc]===T.FLOOR){set(fc,fr,T.CONTAINER);break;}
    }
  }
  // Ensure at least one plutonium is reachable
  let reachablePlu=0;
  for(const [pc2,pr2] of pluPositions){
    if(reachable.has(`${pc2}:${pr2}`))reachablePlu++;
  }
  if(reachablePlu===0&&pluPositions.length>0){
    const [fc,fr]=[...reachable].map(k=>k.split(':').map(Number)).find(([c,r])=>m[r][c]===T.FLOOR)||[pC+2,pR];
    set(fc,fr,T.PLUTONIUM);
  }
}

// ── Top-level generator ─────────────────────────────────────────
function generateLevel(diff, seed){
  const rng=makeRng(seed^(diff*0x9e3779b9));
  const ri=(a,b)=>Math.floor(rng()*(b-a+1))+a; // random int inclusive
  const pick=arr=>arr[Math.floor(rng()*arr.length)];
  const shuffle=arr=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=ri(0,i);[a[i],a[j]]=[a[j],a[i]];}return a;};

  const constraints=buildDiffConstraints(diff);

  // ── 1. Init blank map ─────────────────────────────────────────
  const m=[];
  for(let r=0;r<ROWS;r++){m[r]=[];for(let c=0;c<COLS;c++)m[r][c]=T.FLOOR;}
  const set=(c,r,t)=>{if(c>=0&&r>=0&&c<COLS&&r<ROWS)m[r][c]=t;};

  const genCtx={m,rng,ri,pick,shuffle,C:constraints,diff};

  // ── 2. Build room layout ──────────────────────────────────────
  const rooms=genPhase_rooms(genCtx);
  genCtx.rooms=rooms;

  // ── 3. Player start — in first room ──────────────────────────
  const startRoom=rooms[0];
  const pC=ri(startRoom.c1+1,startRoom.c2-1);
  const pR=ri(startRoom.r1+1,startRoom.r2-1);

  // ── 4. Collect all floor cells, excluding start area ─────────
  const floorCells=[];
  for(let r=1;r<ROWS-1;r++)for(let c=1;c<COLS-1;c++){
    if(m[r][c]===T.FLOOR&&!(Math.abs(c-pC)<=2&&Math.abs(r-pR)<=2))
      floorCells.push([c,r]);
  }
  const shuffledFloor=shuffle(floorCells);
  let fi=0;
  const nextFloor=()=>shuffledFloor[fi++]||[pC+4,pR];

  // ── 5. Place Container — in middle room, away from start ─────
  const midRoom=rooms[Math.floor(rooms.length/2)];
  const contC=ri(midRoom.c1+1,midRoom.c2-1);
  const contR=ri(midRoom.r1+1,midRoom.r2-1);
  set(contC,contR,T.CONTAINER);

  // ── 6. Place Plutonium spread across rooms ───────────────────
  const pluRooms=shuffle(rooms.filter(r=>r!==rooms[0])).slice(0,constraints.plutoniumCount);
  const pluPositions=[];
  for(let i=0;i<constraints.plutoniumCount;i++){
    const room=pluRooms[i%pluRooms.length];
    let pc,pr,tries=0;
    do{pc=ri(room.c1+1,room.c2-1);pr=ri(room.r1+1,room.r2-1);tries++;}
    while(m[pr][pc]!==T.FLOOR&&tries<20);
    if(m[pr][pc]===T.FLOOR){set(pc,pr,T.PLUTONIUM);pluPositions.push([pc,pr]);}
  }

  // ── 7. Place OUT_DOOR — in last room ─────────────────────────
  const lastRoom=rooms[rooms.length-1];
  let outC,outR,outTries=0;
  do{outC=ri(lastRoom.c1+1,lastRoom.c2-1);outR=ri(lastRoom.r1+1,lastRoom.r2-1);outTries++;}
  while(m[outR][outC]!==T.FLOOR&&outTries<30);
  set(outC,outR,T.OUT_DOOR);

  // ── 8–10. Doors (keys, laser, slam) ──────────────────────────
  genPhase_doors(genCtx, rooms, nextFloor);

  // ── 11–19. Hazards & pickups ──────────────────────────────────
  genPhase_hazards(genCtx, nextFloor, pC, pR, contC, contR);

  // ── 20. Warp pairs ───────────────────────────────────────────
  const warpPairs=genPhase_warpDoors(genCtx, rooms);

  // ── 21. Build robots ─────────────────────────────────────────
  const genRobots=buildRobotDefs(constraints, rooms, pC, pR, rng, ri);

  // ── 22. Build cameras ────────────────────────────────────────
  const genCameras=buildCameraDefs(constraints, rooms, m, rng, ri);

  // ── 23. Mat pickups ──────────────────────────────────────────
  if(diff>=5){
    const [mc,mr]=nextFloor();
    if(m[mr][mc]===T.FLOOR) set(mc,mr,T.MAT_PICKUP);
  }

  // ── 24. Validate & patch ─────────────────────────────────────
  genPhase_validate(genCtx, pC, pR, contC, contR, pluPositions);

  return{
    map:m,
    playerStart:{c:pC,r:pR},
    robots:genRobots,
    cameras:genCameras,
    warpPairs,
    notes:`${constraints.plutoniumCount} plu, ${genRobots.length} robots, ${rooms.length} rooms`,
  };
}

// ── Room layout generator ────────────────────────────────────────
function buildRooms(roomCount, rng, ri){
  // Divide the map into zones, place one room per zone
  const margin=2;
  const usableW=COLS-margin*2, usableH=ROWS-margin*2;
  const rooms=[];
  const cols=roomCount<=4?2:3;
  const rowsN=Math.ceil(roomCount/cols);
  const zoneW=Math.floor(usableW/cols);
  const zoneH=Math.floor(usableH/rowsN);

  for(let gy=0;gy<rowsN&&rooms.length<roomCount;gy++){
    for(let gx=0;gx<cols&&rooms.length<roomCount;gx++){
      const zx=margin+gx*zoneW;
      const zy=margin+gy*zoneH;
      const minW=5,minH=4;
      const maxW=Math.max(minW,zoneW-2);
      const maxH=Math.max(minH,zoneH-2);
      const rw=ri(minW,maxW);
      const rh=ri(minH,maxH);
      const c1=zx+ri(1,Math.max(1,zoneW-rw-1));
      const r1=zy+ri(1,Math.max(1,zoneH-rh-1));
      const c2=Math.min(COLS-2,c1+rw);
      const r2=Math.min(ROWS-2,r1+rh);
      rooms.push({c1,r1,c2,r2});
    }
  }
  return rooms;
}

// ── Carve L-shaped corridor between two points ──────────────────
function carveCorridor(m, c1,r1, c2,r2){
  // Horizontal then vertical
  const minC=Math.min(c1,c2), maxC=Math.max(c1,c2);
  const minR=Math.min(r1,r2), maxR=Math.max(r1,r2);
  for(let c=minC;c<=maxC;c++) if(r1>=1&&r1<ROWS-1)m[r1][c]=T.FLOOR;
  for(let r=minR;r<=maxR;r++) if(c2>=1&&c2<COLS-1)m[r][c2]=T.FLOOR;
}

// ── Find a wall tile bridging two floor areas for a door ─────────
function findDoorWall(m, ri, rooms, salt){
  // Look for tiles that are walls with floor on both sides (N/S or E/W)
  const candidates=[];
  for(let r=2;r<ROWS-2;r++){
    for(let c=2;c<COLS-2;c++){
      if(m[r][c]!==T.WALL)continue;
      const floorN=m[r-1][c]===T.FLOOR, floorS=m[r+1][c]===T.FLOOR;
      const floorW=m[r][c-1]===T.FLOOR, floorE=m[r][c+1]===T.FLOOR;
      if((floorN&&floorS)||(floorW&&floorE)) candidates.push([c,r]);
    }
  }
  if(candidates.length===0)return null;
  return candidates[(salt*7+13)%candidates.length];
}

// ── Flood fill from position, returns Set of "c:r" strings ───────
function floodFill(m, startC, startR){
  const visited=new Set();
  const queue=[[startC,startR]];
  const passable=t=>t===T.FLOOR||t===T.PLUTONIUM||t===T.CONTAINER||
    t===T.KEY||t===T.TIME_ICON||t===T.BONUS||t===T.SPADE||
    t===T.MAT_PICKUP||t===T.OUT_DOOR||t===T.CHEST||
    t===T.WARP_DOOR||t===T.ACID_POOL||t===T.ELECTRO_FLOOR||
    t===T.CONVEYOR_R||t===T.CONVEYOR_L||t===T.CONVEYOR_U||t===T.CONVEYOR_D||
    t===T.ALARM_LIGHT||t===T.CAMERA_TILE||t===T.LASER_DOOR||
    t===T.GREEN_DOOR||t===T.SLAM_DOOR||t===T.AIR_LOCK||
    t===T.CRUMBLY||t===T.FORCE_FIELD;
  while(queue.length){
    const [c,r]=queue.pop();
    const key=`${c}:${r}`;
    if(visited.has(key))continue;
    if(c<0||r<0||c>=COLS||r>=ROWS)continue;
    if(!passable(m[r][c]))continue;
    visited.add(key);
    queue.push([c+1,r],[c-1,r],[c,r+1],[c,r-1]);
  }
  return visited;
}

// ── Build robot definitions ──────────────────────────────────────
function buildRobotDefs(C, rooms, pC, pR, rng, ri){
  const robots=[];
  const specs=C.robotSpecs;
  let roomIdx=1;
  for(const spec of specs){
    for(let i=0;i<spec.count;i++){
      const room=rooms[roomIdx%rooms.length];
      roomIdx++;
      // Keep away from player start room
      const rc=ri(room.c1+1,room.c2-1);
      const rr=ri(room.r1+1,room.r2-1);
      if(Math.abs(rc-pC)<=4&&Math.abs(rr-pR)<=4)continue;
      const axis=rng()<0.5?'h':'v';
      const range=axis==='h'?(room.c2-room.c1-2):(room.r2-room.r1-2);
      robots.push({c:rc,r:rr,axis,range:Math.max(2,range),speed:spec.speed,type:spec.type});
    }
  }
  return robots;
}

// ── Build camera definitions ─────────────────────────────────────
function buildCameraDefs(C, rooms, m, rng, ri){
  if(C.cameraCount===0)return[];
  const cameras=[];
  for(let i=0;i<C.cameraCount;i++){
    // Place in a corridor wall — find a floor tile adjacent to wall
    const room=rooms[(i+1)%rooms.length];
    const cc=ri(room.c1,room.c2);
    const cr=ri(room.r1,room.r2);
    cameras.push({
      c:cc,r:cr,range:ri(4,7),
      angleStart:rng()*Math.PI*2,
      angleSweep:Math.PI*(0.5+rng()*0.5),
    });
  }
  return cameras;
}

// ── Constraint table ─────────────────────────────────────────────
function buildDiffConstraints(d){
  const lerp=(a,b,t)=>Math.round(a+(b-a)*((d-1)/9));
  return{
    plutoniumCount: lerp(3,8),
    roomCount:      [2,2,3,3,4,4,5,5,6,7][d-1],
    keyCount:       [0,0,0,1,1,2,2,3,3,3][d-1],
    laserCount:     [0,0,0,0,1,1,2,2,3,3][d-1],
    slamCount:      [0,0,0,0,0,1,1,2,2,2][d-1],
    warpPairs:      [0,0,0,0,0,1,1,1,2,2][d-1],
    acidCount:      [0,0,2,3,4,4,5,6,7,8][d-1],
    conveyorCount:  [0,0,0,2,2,3,4,4,5,6][d-1],
    crumblyCount:   [0,0,0,0,2,2,3,4,5,6][d-1],
    chestCount:     [0,0,0,1,1,1,2,2,2,3][d-1],
    electroCount:   [0,0,0,0,0,2,3,4,5,6][d-1],
    alarmCount:     [0,0,0,0,1,1,2,2,3,3][d-1],
    cameraCount:    [0,0,0,0,1,1,2,2,3,3][d-1],
    timeIconCount:  [1,1,2,2,2,2,3,3,3,3][d-1],
    bonusCount:     [0,0,0,1,1,1,1,2,2,2][d-1],
    forceFieldCount:[0,0,0,0,0,1,1,2,2,2][d-1],
    robotSpecs: [
      // d1
      [{count:1,type:'normal',speed:0.7}],
      // d2
      [{count:2,type:'normal',speed:0.8}],
      // d3
      [{count:2,type:'normal',speed:0.9},{count:1,type:'normal',speed:0.8}],
      // d4
      [{count:3,type:'normal',speed:1.0}],
      // d5
      [{count:3,type:'normal',speed:1.0},{count:1,type:'fast',speed:1.3}],
      // d6
      [{count:3,type:'normal',speed:1.1},{count:2,type:'fast',speed:1.4}],
      // d7
      [{count:3,type:'normal',speed:1.1},{count:2,type:'fast',speed:1.4},{count:1,type:'heavy',speed:0.7}],
      // d8
      [{count:4,type:'normal',speed:1.2},{count:2,type:'fast',speed:1.5},{count:1,type:'heavy',speed:0.8}],
      // d9
      [{count:4,type:'normal',speed:1.2},{count:3,type:'fast',speed:1.5},{count:2,type:'heavy',speed:0.9}],
      // d10
      [{count:5,type:'normal',speed:1.3},{count:3,type:'fast',speed:1.6},{count:2,type:'heavy',speed:1.0}],
    ][d-1],
  };
}

// ── Apply generated level to editor ─────────────────────────────
function applyAILevel(level, diff){
  if(!level||!level.map){ed.aiLastMsg='Generator returned no map';return;}
  const newMap=level.map.map(row=>[...row]);
  // Enforce border
  for(let c=0;c<COLS;c++){newMap[0][c]=T.WALL;newMap[ROWS-1][c]=T.WALL;}
  for(let r=0;r<ROWS;r++){newMap[r][0]=T.WALL;newMap[r][COLS-1]=T.WALL;}
  ed.map=newMap;
  ed.name=`ai_d${diff}`;
  if(level.playerStart){
    ed.playerC=Math.max(1,Math.min(COLS-2,level.playerStart.c));
    ed.playerR=Math.max(1,Math.min(ROWS-2,level.playerStart.r));
  }
  ed.camX=Math.max(0,Math.min(COLS-edVW(),ed.playerC-Math.floor(edVW()/2)));
  ed.camY=Math.max(0,Math.min(ROWS-edVH(),ed.playerR-Math.floor(edVH()/2)));
  ed.aiRobots=level.robots||[];
  ed.aiCameras=level.cameras||[];
  ed.aiWarpPairs=level.warpPairs||[];
}

// ── Override editorPlay to use AI-generated robots/cameras/warps ─
function editorPlay(){
  if(!ed.map)return;
  editorOn=false;pauseOn=false;
  const kp=document.getElementById('aiKeyPanel');
  if(kp)kp.style.display='none';
  const m=ed.map.map(r=>[...r]);
  const sc=ed.playerC,sr=ed.playerR;

  score=0;lives=CONF.START_LIVES;zone=1;hiScore=Math.max(hiScore,score);zoneScore=0;
  state='playing';
  map=m;
  pluLeft=0;outOpen=false;laserTick=0;laserOpen=false;
  particles=[];popups=[];radTimer=0;pluCarried=0;keysCarried=0;
  matsCarried=CONF.START_MATS;spadeCarried=false;chestKeyCarried=false;
  alarmOn=false;alarmT=0;alarmSfxT=0;shake=0;flash=0;totalT=0;stepT=0;
  combo=0;comboTimer=0;conveyorPush={dx:0,dy:0,t:0};fogRevealed=new Set();
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(map[r]&&map[r][c]===T.PLUTONIUM)pluLeft++;

  player={c:sc,r:sr,facing:0,animT:0,
          px:sc*TILE,py:sr*TILE,tx:sc*TILE,ty:sr*TILE,
          moving:false,moveProgress:1.0,nextDx:0,nextDy:0,hasPending:false};

  const robDefs=(ed.robots&&ed.robots.length>0)?ed.robots:(ed.aiRobots&&ed.aiRobots.length>0)?ed.aiRobots:ROBOT_DEFS;
  robots=robDefs.map((d,i)=>({
    c:d.c,r:d.r,px:d.c*TILE,py:d.r*TILE,tx:d.c*TILE,ty:d.r*TILE,
    moveProgress:1.0,prevC:d.c,prevR:d.r,
    axis:d.axis||'h',range:d.range||4,
    speed:(d.speed||1.0)*(1+zone*0.04),
    type:d.type||'normal',dir:1,steps:0,moveT:0,alertT:0,id:i,alive:true,stunT:0,
  }));

  const camDefs=(ed.aiCameras&&ed.aiCameras.length>0)?ed.aiCameras:CAM_DEFS;
  cameras=camDefs.map(d=>({
    c:d.c,r:d.r,range:d.range||5,
    angleStart:d.angleStart||0,angleSweep:d.angleSweep||(Math.PI*0.7),
    angle:d.angleStart||0,dir:1,speed:0.8,spotted:false,spotTimer:0,
  }));

  const allWarpPairs=[...(ed.warpPairs||[]),...(ed.aiWarpPairs||[])];
  if(allWarpPairs.length>0){
    WARP_PAIRS.length=0;
    for(const wp of allWarpPairs){
      WARP_PAIRS.push({from:wp.from,to:wp.to});
      WARP_PAIRS.push({from:wp.to,to:wp.from});
    }
  }

  revealFog(player.c,player.r);updateCamera(true);
  if(ed.aiRobots&&ed.aiRobots.length>0){
    addPopup(sc,sr,`AI Level ${ed.aiDifficulty}/10`);
  }
}
