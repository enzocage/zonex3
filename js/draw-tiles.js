// === ZONE X - Draw Tiles ===

// ── TILE RENDERING ─────────────────────────────────────────────
function drawTiles(){
  if(!map.length)return;
  const sc=Math.max(0,Math.floor(camX)),sr=Math.max(0,Math.floor(camY));
  const ec=Math.min(COLS,sc+VIEW_W+2),er=Math.min(ROWS,sr+VIEW_H+2);
  for(let r=sr;r<er;r++)
    for(let c=sc;c<ec;c++){
      if(!map[r])continue;
      drawTile(map[r][c]||0,c*TILE,r*TILE,c,r);
    }
}

// ── TILE DRAW FUNCTIONS ──────────────────────────────────────────
const TILE_DRAW = {};

function drawTile_floor(px,py,c,r,S,g){
  const seed=(c*37+r*19)%100;
  if(seed<6){ctx.fillStyle='#0e2215';ctx.fillRect(px+4+seed%4*6,py+4+(seed>>2)*7,2,2);}
}
TILE_DRAW[T.FLOOR] = drawTile_floor;

function drawTile_wall(px,py,c,r,S,g){
  ctx.fillStyle=C.w0;ctx.fillRect(px,py,S,S);
  ctx.fillStyle=C.w2;ctx.fillRect(px,py,S,4);
  ctx.fillStyle=C.w1;ctx.fillRect(px,py+4,4,S-4);
  ctx.fillStyle=C.ws;ctx.fillRect(px,py+S-3,S,3);
  ctx.fillStyle=C.ws;ctx.fillRect(px+S-3,py+3,3,S-3);
  const sv=(c*13+r*7)%8;
  if(sv===0){ctx.fillStyle='#0f2510';ctx.fillRect(px+8,py+8,5,4);}
  if(sv===1){ctx.fillStyle='#122a14';ctx.fillRect(px+S-12,py+6,4,5);}
  ctx.fillStyle='#1a3020';
  for(const[bx,by]of[[5,5],[S-8,5],[5,S-8],[S-8,S-8]]){
    ctx.beginPath();ctx.arc(px+bx,py+by,1.8,0,Math.PI*2);ctx.fill();
  }
}
TILE_DRAW[T.WALL] = drawTile_wall;

function drawTile_plutonium(px,py,c,r,S,g){
  const p=0.65+0.35*Math.sin(g*4.5+(c+r)*0.8);
  ctx.save();
  const grd=ctx.createRadialGradient(px+S/2,py+S/2,2,px+S/2,py+S/2,S*0.55);
  grd.addColorStop(0,`rgba(0,255,136,${0.35*p})`);
  grd.addColorStop(1,'transparent');
  ctx.fillStyle=grd;ctx.fillRect(px,py,S,S);
  ctx.shadowBlur=14*p;ctx.shadowColor=C.plu;
  ctx.fillStyle=C.pluD;
  ctx.beginPath();ctx.arc(px+S/2,py+S/2,S/3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=C.plu;
  ctx.beginPath();ctx.arc(px+S/2,py+S/2,S/3*p*0.9,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#aaffdd';
  ctx.beginPath();ctx.arc(px+S/2,py+S/2,3,0,Math.PI*2);ctx.fill();
  for(let i=0;i<3;i++){
    const a=g*2+i*Math.PI*2/3;
    const ox=Math.cos(a)*S/3.5,oy=Math.sin(a)*S/3.5;
    ctx.fillStyle=C.plu;
    ctx.beginPath();ctx.arc(px+S/2+ox,py+S/2+oy,2.5,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}
TILE_DRAW[T.PLUTONIUM] = drawTile_plutonium;

function drawTile_container(px,py,c,r,S,g){
  ctx.fillStyle='#2a2000';ctx.fillRect(px+1,py+1,S-2,S-2);
  ctx.fillStyle=C.contD;ctx.fillRect(px+3,py+3,S-6,S-6);
  ctx.fillStyle=C.cont;ctx.fillRect(px+5,py+5,S-10,S-10);
  ctx.fillStyle='#1a1200';ctx.fillRect(px+9,py+9,S-18,S-18);
  ctx.save();ctx.shadowBlur=8;ctx.shadowColor=C.cont;
  ctx.fillStyle=C.cont;ctx.font=`bold ${S-16}px serif`;
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('☢',px+S/2,py+S/2);ctx.restore();
  for(const[bx,by]of[[3,3],[S-6,3],[3,S-6],[S-6,S-6]]){
    ctx.fillStyle='#887700';ctx.fillRect(px+bx,py+by,3,3);
  }
}
TILE_DRAW[T.CONTAINER] = drawTile_container;

function drawTile_key(px,py,c,r,S,g){
  ctx.save();ctx.shadowBlur=9;ctx.shadowColor=C.key;
  ctx.strokeStyle=C.key;ctx.lineWidth=2.5;ctx.lineCap='round';
  ctx.beginPath();ctx.arc(px+11,py+S/2,5,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.moveTo(px+16,py+S/2);ctx.lineTo(px+S-7,py+S/2);ctx.stroke();
  ctx.lineWidth=2;
  for(const tx2 of[S-10,S-15]){
    ctx.beginPath();ctx.moveTo(px+tx2,py+S/2);ctx.lineTo(px+tx2,py+S/2+4);ctx.stroke();
  }
  ctx.restore();
}
TILE_DRAW[T.KEY] = drawTile_key;

function drawTile_mat_pickup(px,py,c,r,S,g){
  ctx.fillStyle=C.mat;ctx.fillRect(px+4,py+9,S-8,S-18);
  ctx.fillStyle='#cc99ff';ctx.fillRect(px+4,py+9,S-8,3);
  ctx.strokeStyle='#7744aa';ctx.lineWidth=1;
  for(let i=0;i<4;i++){
    ctx.beginPath();ctx.moveTo(px+6+i*7,py+10);ctx.lineTo(px+6+i*7,py+S-10);ctx.stroke();
  }
}
TILE_DRAW[T.MAT_PICKUP] = drawTile_mat_pickup;

function drawTile_time_icon(px,py,c,r,S,g){
  ctx.save();ctx.shadowBlur=9;ctx.shadowColor=C.time;
  ctx.strokeStyle=C.time;ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(px+S/2,py+S/2,S/3,0,Math.PI*2);ctx.stroke();
  const ha=g*0.6;
  ctx.lineWidth=2;ctx.beginPath();
  ctx.moveTo(px+S/2,py+S/2);
  ctx.lineTo(px+S/2+Math.cos(ha-1.57)*(S/4.5),py+S/2+Math.sin(ha-1.57)*(S/4.5));
  ctx.stroke();
  ctx.lineWidth=1.5;ctx.beginPath();
  ctx.moveTo(px+S/2,py+S/2);
  ctx.lineTo(px+S/2+Math.cos(ha*7-1.57)*(S/5.5),py+S/2+Math.sin(ha*7-1.57)*(S/5.5));
  ctx.stroke();
  ctx.fillStyle=C.time;ctx.beginPath();ctx.arc(px+S/2,py+S/2,2.5,0,Math.PI*2);ctx.fill();
  ctx.restore();
}
TILE_DRAW[T.TIME_ICON] = drawTile_time_icon;

function drawTile_bonus(px,py,c,r,S,g){
  const p=0.8+0.2*Math.sin(g*6+c+r);
  ctx.save();ctx.shadowBlur=12*p;ctx.shadowColor=C.bonus;
  ctx.fillStyle=C.bonus;ctx.font=`bold ${(S-7)*p}px monospace`;
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('?',px+S/2,py+S/2+1);ctx.restore();
}
TILE_DRAW[T.BONUS] = drawTile_bonus;

function drawTile_spade(px,py,c,r,S,g){
  ctx.save();ctx.shadowBlur=6;ctx.shadowColor=C.spade;
  ctx.strokeStyle=C.spade;ctx.lineWidth=3;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(px+8,py+S-7);ctx.lineTo(px+S-7,py+8);ctx.stroke();
  ctx.lineWidth=4;
  ctx.beginPath();ctx.moveTo(px+S-11,py+5);ctx.lineTo(px+S-4,py+12);ctx.stroke();
  ctx.beginPath();ctx.moveTo(px+S-5,py+6);ctx.lineTo(px+S-13,py+17);ctx.stroke();
  ctx.restore();
}
TILE_DRAW[T.SPADE] = drawTile_spade;

function drawTile_crumbly(px,py,c,r,S,g){
  ctx.fillStyle=C.crumb;ctx.fillRect(px,py,S,S);
  ctx.strokeStyle='#2a1808';ctx.lineWidth=1;
  ctx.beginPath();
  ctx.moveTo(px+5,py+5);ctx.lineTo(px+19,py+22);ctx.lineTo(px+13,py+28);
  ctx.moveTo(px+21,py+5);ctx.lineTo(px+28,py+19);
  ctx.stroke();
  ctx.fillStyle=C.crumb2;
  ctx.fillRect(px+6,py+3,5,4);ctx.fillRect(px+18,py+19,4,4);
}
TILE_DRAW[T.CRUMBLY] = drawTile_crumbly;

function drawTile_green_door(px,py,c,r,S,g){
  ctx.fillStyle='#002a10';ctx.fillRect(px,py,S,S);
  ctx.fillStyle=C.gDoor;ctx.fillRect(px+2,py+2,S-4,S-4);
  ctx.fillStyle='#004418';ctx.fillRect(px+5,py+5,S-10,S-10);
  ctx.fillStyle='#00ff66';
  ctx.fillRect(px+S/2-4,py+S/2-1,8,7);
  ctx.strokeStyle='#00ff66';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(px+S/2,py+S/2-5,4,Math.PI,0);ctx.stroke();
}
TILE_DRAW[T.GREEN_DOOR] = drawTile_green_door;

function drawTile_slam_door(px,py,c,r,S,g){
  ctx.fillStyle='#2a1000';ctx.fillRect(px,py,S,S);
  ctx.fillStyle=C.slam;ctx.fillRect(px+3,py+3,S-6,S-6);
  ctx.fillStyle='#ff8800';ctx.font=`${S-8}px serif`;
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('⟶',px+S/2,py+S/2+1);
}
TILE_DRAW[T.SLAM_DOOR] = drawTile_slam_door;

function drawTile_laser_door(px,py,c,r,S,g){
  if(!laserOpen){
    ctx.save();
    const lp=0.75+0.25*Math.sin(g*18);
    ctx.shadowBlur=18*lp;ctx.shadowColor=C.laser;
    ctx.strokeStyle=C.laser;ctx.lineWidth=3.5*lp;
    ctx.beginPath();ctx.moveTo(px,py+S/2);ctx.lineTo(px+S,py+S/2);ctx.stroke();
    ctx.strokeStyle='rgba(255,150,100,0.7)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(px,py+S/2);ctx.lineTo(px+S,py+S/2);ctx.stroke();
    ctx.fillStyle='#ff4400';
    ctx.beginPath();ctx.arc(px+3,py+S/2,4,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(px+S-3,py+S/2,4,0,Math.PI*2);ctx.fill();
    ctx.restore();
  } else {
    ctx.strokeStyle='#3a0800';ctx.lineWidth=1;
    ctx.strokeRect(px+4,py+4,S-8,S-8);
    ctx.fillStyle='#1a0400';
    ctx.beginPath();ctx.arc(px+3,py+S/2,3,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(px+S-3,py+S/2,3,0,Math.PI*2);ctx.fill();
  }
}
TILE_DRAW[T.LASER_DOOR] = drawTile_laser_door;

function drawTile_air_lock(px,py,c,r,S,g){
  ctx.fillStyle=C.air;ctx.fillRect(px+3,py+3,S-6,S-6);
  ctx.fillStyle='#001a55';ctx.fillRect(px+6,py+6,S-12,S-12);
  for(let i=0;i<3;i++){
    const ap=Math.sin(g*3.5+i*2.1)*0.5+0.5;
    ctx.fillStyle=`rgba(34,136,255,${ap})`;
    ctx.beginPath();ctx.arc(px+S/2+(i-1)*7,py+S/2,3,0,Math.PI*2);ctx.fill();
  }
}
TILE_DRAW[T.AIR_LOCK] = drawTile_air_lock;

function drawTile_warp_door(px,py,c,r,S,g){
  ctx.fillStyle='#080018';ctx.fillRect(px,py,S,S);
  ctx.save();
  const wp=0.55+0.45*Math.sin(g*3.2+(c+r)*0.9);
  ctx.shadowBlur=20*wp;ctx.shadowColor=C.warp;
  ctx.strokeStyle=C.warp;ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(px+S/2,py+S/2,S/3,g,g+Math.PI*1.5);ctx.stroke();
  ctx.strokeStyle='#dd88ff';ctx.lineWidth=1;
  ctx.beginPath();ctx.arc(px+S/2,py+S/2,S/4,-g,-g+Math.PI*1.5);ctx.stroke();
  ctx.fillStyle=C.warp;ctx.font=`${S-18}px monospace`;
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('⊛',px+S/2,py+S/2+1);ctx.restore();
}
TILE_DRAW[T.WARP_DOOR] = drawTile_warp_door;

function drawTile_out_door(px,py,c,r,S,g){
  ctx.fillStyle='#110f00';ctx.fillRect(px,py,S,S);
  ctx.save();
  if(outOpen){
    const op=0.8+0.2*Math.sin(g*7);
    ctx.shadowBlur=28*op;ctx.shadowColor=C.out;
    ctx.fillStyle=C.out;ctx.fillRect(px+2,py+2,S-4,S-4);
    ctx.fillStyle='#221500';ctx.fillRect(px+5,py+5,S-10,S-10);
    ctx.fillStyle=C.out;ctx.font=`bold ${S-12}px monospace`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('OUT',px+S/2,py+S/2);
  } else {
    ctx.strokeStyle='#333300';ctx.lineWidth=1;
    ctx.strokeRect(px+4,py+4,S-8,S-8);
    ctx.fillStyle='#333322';ctx.font=`bold ${S-18}px monospace`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('OUT',px+S/2,py+S/2);
  }
  ctx.restore();
}
TILE_DRAW[T.OUT_DOOR] = drawTile_out_door;

function drawTile_acid_pool(px,py,c,r,S,g){
  const ap=0.65+0.35*Math.sin(g*4.2+c*0.6+r*0.8);
  const gd=ctx.createRadialGradient(px+S/2,py+S/2,2,px+S/2,py+S/2,S*.6);
  gd.addColorStop(0,'#88ff44');gd.addColorStop(.6,'#44aa00');gd.addColorStop(1,'#1a4000');
  ctx.fillStyle=gd;ctx.fillRect(px,py,S,S);
  for(let i=0;i<3;i++){
    const bx=(c*17+i*13+r*7)%20+6,by=(c*11+i*19+r*3)%20+6;
    const bt=(g*2.2+i*1.5)%(Math.PI*2);
    ctx.save();ctx.globalAlpha=0.3+0.4*Math.sin(bt);
    ctx.strokeStyle='#ccff88';ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(px+bx,py+by,3,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  }
}
TILE_DRAW[T.ACID_POOL] = drawTile_acid_pool;

function drawTile_force_field(px,py,c,r,S,g){
  const fp=0.5+0.5*Math.sin(g*9+c+r);
  ctx.save();ctx.shadowBlur=10;ctx.shadowColor=C.ff;
  for(let i=0;i<5;i++){
    ctx.globalAlpha=fp*(0.4+i*.1);ctx.strokeStyle=C.ff;ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(px+3+i*6,py+2);ctx.lineTo(px+3+i*6,py+S-2);ctx.stroke();
  }
  ctx.globalAlpha=0.8;ctx.fillStyle=C.ff;ctx.font=`${S-14}px sans-serif`;
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('→',px+S/2,py+S/2);
  ctx.restore();
}
TILE_DRAW[T.FORCE_FIELD] = drawTile_force_field;

function drawTile_conveyor(px,py,c,r,S,g){
  const t2=map[r]&&map[r][c]!==undefined?map[r][c]:T.CONVEYOR_R;
  // t2 may not be available in all calling contexts; use the tile value passed via closure trick
  // The function receives the tile type via the dispatch key lookup, so we recover it:
  const tVal=TILE_DRAW._lastT;
  const isR=tVal===T.CONVEYOR_R,isL=tVal===T.CONVEYOR_L,isU=tVal===T.CONVEYOR_U;
  const isCvD=tVal===T.CONVEYOR_D;
  const col=isR?C.con_r:isL?C.con_l:isU?C.con_u:C.con_d;
  ctx.fillStyle='#1a1500';ctx.fillRect(px,py,S,S);
  const off=(g*20)%S;
  ctx.save();ctx.beginPath();ctx.rect(px,py,S,S);ctx.clip();
  ctx.fillStyle=col;ctx.globalAlpha=0.35;
  const horiz=isR||isL;
  const dir=(isR||isCvD)?1:-1;
  for(let i=-1;i<3;i++){
    const pos=(i*S/3+(isR?off:isL?-off:0)+S)%S-S/3*dir;
    if(horiz)ctx.fillRect(px+pos*(isL?-1:1)-2,py+6,S/3-2,S-12);
    else ctx.fillRect(px+6,py+pos*(isU?-1:1)-2,S-12,S/3-2);
  }
  ctx.globalAlpha=0.9;
  ctx.fillStyle=col;ctx.font=`${S-8}px sans-serif`;
  ctx.textAlign='center';ctx.textBaseline='middle';
  const arrow=isR?'→':isL?'←':isU?'↑':'↓';
  ctx.fillText(arrow,px+S/2,py+S/2);
  ctx.restore();
}
TILE_DRAW[T.CONVEYOR_R] = drawTile_conveyor;
TILE_DRAW[T.CONVEYOR_L] = drawTile_conveyor;
TILE_DRAW[T.CONVEYOR_U] = drawTile_conveyor;
TILE_DRAW[T.CONVEYOR_D] = drawTile_conveyor;

function drawTile_chest(px,py,c,r,S,g){
  ctx.fillStyle='#2a2000';ctx.fillRect(px+2,py+5,S-4,S-9);
  ctx.fillStyle=C.chest;ctx.fillRect(px+3,py+6,S-6,S-11);
  ctx.fillStyle='#886600';ctx.fillRect(px+3,py+6,S-6,6);
  ctx.fillStyle='#ccaa00';ctx.fillRect(px+S/2-3,py+S/2,6,5);
  ctx.strokeStyle='#ccaa00';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(px+S/2,py+S/2,3,Math.PI,0);ctx.stroke();
  ctx.fillStyle='rgba(255,255,200,0.2)';ctx.fillRect(px+5,py+7,8,3);
}
TILE_DRAW[T.CHEST] = drawTile_chest;

function drawTile_camera_tile(px,py,c,r,S,g){
  ctx.fillStyle='#1a0010';ctx.fillRect(px,py,S,S);
  ctx.save();
  const csp=0.6+0.4*Math.sin(g*5+c);
  ctx.shadowBlur=8*csp;ctx.shadowColor=C.cam;
  ctx.fillStyle=C.cam;
  ctx.fillRect(px+5,py+10,S-14,S-18);
  ctx.beginPath();ctx.arc(px+S-9,py+S/2,5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#330011';
  ctx.beginPath();ctx.arc(px+S-9,py+S/2,3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=alarmOn?`rgba(255,0,0,${csp})`:'#440000';
  ctx.beginPath();ctx.arc(px+8,py+12,2.5,0,Math.PI*2);ctx.fill();
  ctx.restore();
}
TILE_DRAW[T.CAMERA_TILE] = drawTile_camera_tile;

function drawTile_alarm_light(px,py,c,r,S,g){
  ctx.fillStyle='#1a0800';ctx.fillRect(px,py,S,S);
  const alp=alarmOn?0.5+0.5*Math.sin(g*12):0.3;
  ctx.save();
  ctx.shadowBlur=alarmOn?20:4;ctx.shadowColor=C.alarm;
  ctx.fillStyle=`rgba(255,34,0,${alp})`;
  ctx.beginPath();ctx.arc(px+S/2,py+S/2,S/3,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=C.alarm;ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(px+S/2,py+S/2,S/3,0,Math.PI*2);ctx.stroke();
  ctx.restore();
}
TILE_DRAW[T.ALARM_LIGHT] = drawTile_alarm_light;

function drawTile_electro_floor(px,py,c,r,S,g){
  ctx.fillStyle='#001122';ctx.fillRect(px,py,S,S);
  if(alarmOn){
    const ep=0.5+0.5*Math.sin(g*15+c*1.3+r*1.7);
    ctx.save();ctx.shadowBlur=12*ep;ctx.shadowColor=C.elec;
    ctx.strokeStyle=`rgba(68,170,255,${ep})`;ctx.lineWidth=1.5;
    ctx.beginPath();
    ctx.moveTo(px,py+S/2);
    ctx.lineTo(px+8,py+4);ctx.lineTo(px+16,py+S-4);
    ctx.lineTo(px+24,py+S/2);ctx.lineTo(px+S,py+6);
    ctx.stroke();ctx.restore();
  } else {
    ctx.strokeStyle='#001a33';ctx.lineWidth=1;
    ctx.strokeRect(px+4,py+4,S-8,S-8);
  }
}
TILE_DRAW[T.ELECTRO_FLOOR] = drawTile_electro_floor;

// ── TILE DISPATCH ────────────────────────────────────────────────
function drawTile(t,px,py,c,r){
  const S=TILE,g=glowT,ev=(c+r)%2===0;
  // base floor
  ctx.fillStyle=ev?C.fl0:C.fl1;
  ctx.fillRect(px,py,S,S);

  TILE_DRAW._lastT=t;
  const fn=TILE_DRAW[t];
  if(fn) fn(px,py,c,r,S,g);
}
