// === ZONE X - Help Overlay ===

// ═══════════════════════════════════════════════════════════════
//  HELP OVERLAY  [H]
// ═══════════════════════════════════════════════════════════════
const HELP_ITEMS=[
  {id:T.FLOOR,       col:'#0b1a0c', label:'Floor',         desc:'Safe walkable ground'},
  {id:T.WALL,        col:'#1e3828', label:'Wall',           desc:'Impassable solid barrier'},
  {id:T.PLUTONIUM,   col:'#00ff88', label:'Plutonium',      desc:'Collect all! Starts radiation countdown'},
  {id:T.CONTAINER,   col:'#e8c000', label:'Container',      desc:'Deposit plutonium here: n^2 x 500 pts'},
  {id:T.KEY,         col:'#ff9900', label:'Key',            desc:'Unlocks one Green Door'},
  {id:T.MAT_PICKUP,  col:'#9966dd', label:'Mat',            desc:'Pick up; place with SPACE to block robots'},
  {id:T.TIME_ICON,   col:'#00ddff', label:'Time Canister',  desc:'+12 seconds to radiation timer'},
  {id:T.BONUS,       col:'#ff44cc', label:'Bonus (?) ',     desc:'+500 pts mystery pickup'},
  {id:T.SPADE,       col:'#cc9944', label:'Spade',          desc:'Carry it to dig through Crumbly walls'},
  {id:T.CRUMBLY,     col:'#4a3520', label:'Crumbly Wall',   desc:'Dig through if carrying a Spade'},
  {id:T.GREEN_DOOR,  col:'#00cc44', label:'Green Door',     desc:'Opens with a Key; permanently removed'},
  {id:T.SLAM_DOOR,   col:'#dd5500', label:'Slam Door',      desc:'One-way passage; closes behind you!'},
  {id:T.LASER_DOOR,  col:'#ff1100', label:'Laser Door',     desc:'Lethal when beam is active; wait for gap'},
  {id:T.AIR_LOCK,    col:'#2288ff', label:'Air Lock',       desc:'Stepping on it opens a nearby section'},
  {id:T.WARP_DOOR,   col:'#cc44ff', label:'Warp Door',      desc:'Instant teleport to its paired exit'},
  {id:T.OUT_DOOR,    col:'#ffee00', label:'Exit (OUT)',      desc:'Opens only when ALL plutonium is collected'},
  {id:T.ACID_POOL,   col:'#33ff44', label:'Acid Pool',      desc:'Instant death on contact. Avoid!'},
  {id:T.FORCE_FIELD, col:'#0077ff', label:'Force Field',    desc:'One-directional wall; enter from arrow side'},
  {id:T.CONVEYOR_R,  col:'#ff8800', label:'Conveyor Belt',  desc:'Pushes player/robots in its direction'},
  {id:T.CHEST,       col:'#ccaa44', label:'Chest',          desc:'Contains a hidden item; walk into it'},
  {id:T.CAMERA_TILE, col:'#ff0055', label:'Security Camera',desc:'Sweeping cone; spotted = ALARM!'},
  {id:T.ALARM_LIGHT, col:'#ff2200', label:'Alarm Sensor',   desc:'Touch triggers the alarm'},
  {id:T.ELECTRO_FLOOR,col:'#44aaff',label:'Electro Floor',  desc:'Safe normally; LETHAL during alarm'},
];
const HELP_KEYS=[
  {key:'ARROWS / WASD', act:'Move  (hold for continuous run)'},
  {key:'SPACE',         act:'Place mat in facing direction'},
  {key:'X',            act:'Emergency drop -- dump plutonium, reset radiation'},
  {key:'Z',            act:'Toggle minimap overlay'},
  {key:'F',            act:'Toggle fog of war'},
  {key:'H',            act:'Toggle this help screen'},
  {key:'E',            act:'Toggle level editor'},
  {key:'ESC',          act:'Pause / unpause'},
  {key:'SWIPE',        act:'Move (mobile)'},
  {key:'DOUBLE-TAP',   act:'Place mat (mobile)'},
  {key:'HOLD + DRAG',  act:'Continuous run (mobile)'},
];

// ── Help page state ──────────────────────────────────────────────
let helpPage=0; // 0=tiles, 1=controls
const HELP_PAGES=2;

function drawHelp(){
  const W=CW,H=CH;
  ctx.save();
  ctx.globalAlpha=0.97;ctx.fillStyle='#010e05';ctx.fillRect(0,0,W,H);
  ctx.globalAlpha=1;

  // ── Chrome border ──
  ctx.save();
  ctx.shadowBlur=20;ctx.shadowColor='#00ff4455';
  ctx.strokeStyle='#00ff4440';ctx.lineWidth=1.5;
  ctx.strokeRect(6,6,W-12,H-12);
  ctx.restore();

  // ── Header ──
  ctx.save();ctx.shadowBlur=16;ctx.shadowColor='#00ff88';
  ctx.fillStyle='#00ff88';ctx.font='bold 18px monospace';ctx.textAlign='center';
  ctx.fillText('⚛  ZONE X  —  '+( helpPage===0?'GAME ELEMENTS':'CONTROLS & HINTS')+'  ⚛',W/2,26);
  ctx.restore();

  // Page tabs
  ['ELEMENTS','CONTROLS'].forEach((lbl,i)=>{
    const tx=W/2-70+i*80, ty=34;
    const active=helpPage===i;
    ctx.fillStyle=active?'#003a14':'#010e05';
    ctx.fillRect(tx-4,ty,72,14);
    ctx.strokeStyle=active?'#00ff88':'#00ff4440';ctx.lineWidth=1;
    ctx.strokeRect(tx-4,ty,72,14);
    ctx.fillStyle=active?'#00ff88':'#336633';
    ctx.font='bold 8px monospace';ctx.textAlign='center';
    ctx.fillText(lbl,tx+32,ty+10);
  });

  helpDivider(52);

  if(helpPage===0) drawHelpTiles(W,H);
  else             drawHelpControls(W,H);

  // Footer
  helpDivider(H-20);
  ctx.fillStyle='#1a4422';ctx.font='9px monospace';ctx.textAlign='center';
  ctx.fillText('[←][→] switch page    [H]/[ESC] close',W/2,H-7);
  ctx.restore();
}

function drawHelpTiles(W,H){
  // Draw items in 3 columns with actual rendered tile swatches
  const COLS_N=3;
  const SW=28; // swatch size
  const PAD_L=12;
  const ROW_H=32;
  const COL_W=Math.floor(W/COLS_N);
  const START_Y=58;

  HELP_ITEMS.forEach((item,i)=>{
    const col=i%COLS_N, row=Math.floor(i/COLS_N);
    const x=col*COL_W+PAD_L;
    const y=START_Y+row*ROW_H;

    // Swatch background
    ctx.fillStyle='#040f06';
    ctx.fillRect(x,y,SW,SW);

    // Draw actual tile appearance using mini drawTile
    ctx.save();
    ctx.beginPath();ctx.rect(x,y,SW,SW);ctx.clip();
    ctx.translate(x,y);
    ctx.scale(SW/TILE,SW/TILE);
    drawTile(item.id,0,0,0,0);
    ctx.restore();

    // Border
    ctx.strokeStyle='rgba(0,255,100,0.18)';ctx.lineWidth=1;
    ctx.strokeRect(x,y,SW,SW);

    // Label
    ctx.fillStyle='#00ff88';ctx.font='bold 9px monospace';ctx.textAlign='left';
    ctx.fillText(item.label, x+SW+5, y+10);
    // Description
    ctx.fillStyle='#2a6632';ctx.font='8px monospace';
    const d=item.desc.length>46?item.desc.slice(0,45)+'…':item.desc;
    ctx.fillText(d, x+SW+5, y+21);
  });
}

function drawHelpControls(W,H){
  const START_Y=62;
  const COL_W=W/2;

  // Game objective box
  ctx.save();
  ctx.fillStyle='#001a08';ctx.fillRect(12,START_Y-4,W-24,36);
  ctx.strokeStyle='#00ff4430';ctx.lineWidth=1;ctx.strokeRect(12,START_Y-4,W-24,36);
  ctx.fillStyle='#00ff88';ctx.font='bold 10px monospace';ctx.textAlign='left';
  ctx.fillText('OBJECTIVE',18,START_Y+10);
  ctx.fillStyle='#2a8855';ctx.font='9px monospace';
  ctx.fillText('Collect all ☢ Plutonium  →  Deposit at containers  →  Reach EXIT when it opens',18,START_Y+26);
  ctx.restore();

  const divY=START_Y+40;
  helpDivider(divY);
  ctx.fillStyle='#00bb44';ctx.font='bold 10px monospace';ctx.textAlign='left';
  ctx.fillText('KEYBOARD',14,divY+14);

  const keys=[
    ['ARROWS / W A S D','Move  (tap once = step, hold = continuous run)'],
    ['SPACE',           'Place mat in facing direction (blocks robots)'],
    ['X',              'Emergency drop — dump carried plutonium'],
    ['Z',              'Toggle minimap overlay'],
    ['F',              'Toggle fog of war'],
    ['H',              'Toggle this help screen'],
    ['E',              'Open / close level editor'],
    ['ESC',            'Pause / unpause game'],
  ];
  keys.forEach((k,i)=>{
    const col=i%2, row=Math.floor(i/2);
    const x=col*COL_W+14, y=divY+28+row*17;
    // Key pill
    ctx.fillStyle='#002a10';ctx.fillRect(x,y-10,108,13);
    ctx.strokeStyle='#00ff4440';ctx.lineWidth=1;ctx.strokeRect(x,y-10,108,13);
    ctx.fillStyle='#00dd66';ctx.font='bold 8px monospace';ctx.textAlign='left';
    ctx.fillText(k[0],x+4,y);
    ctx.fillStyle='#2a6640';ctx.font='8px monospace';
    ctx.fillText(k[1],x+114,y);
  });

  const div2Y=divY+28+Math.ceil(keys.length/2)*17+4;
  helpDivider(div2Y);
  ctx.fillStyle='#00bb44';ctx.font='bold 10px monospace';ctx.textAlign='left';
  ctx.fillText('TOUCH / MOBILE',14,div2Y+14);

  const mobile=[
    ['SWIPE',          'Move in direction of swipe (fires on movement)'],
    ['HOLD + DRAG',    'Continuous run while finger is held down'],
    ['DOUBLE-TAP',     'Place mat'],
    ['TAP SIDE',       'Move toward tapped half of screen'],
  ];
  mobile.forEach((k,i)=>{
    const x=14+Math.floor(i%2)*COL_W, y=div2Y+28+Math.floor(i/2)*17;
    ctx.fillStyle='#002a10';ctx.fillRect(x,y-10,90,13);
    ctx.strokeStyle='#00ff4440';ctx.lineWidth=1;ctx.strokeRect(x,y-10,90,13);
    ctx.fillStyle='#00dd66';ctx.font='bold 8px monospace';ctx.textAlign='left';
    ctx.fillText(k[0],x+4,y);
    ctx.fillStyle='#2a6640';ctx.font='8px monospace';
    ctx.fillText(k[1],x+96,y);
  });

  const div3Y=div2Y+28+Math.ceil(mobile.length/2)*17+4;
  helpDivider(div3Y);
  ctx.fillStyle='#00bb44';ctx.font='bold 10px monospace';ctx.textAlign='left';
  ctx.fillText('GAMEPLAY TIPS',14,div3Y+14);
  const tips=[
    '• Radiation timer counts down while carrying Plutonium — use Time Canisters!',
    '• Robots are stunned by mats. Heavy robots kill even when adjacent.',
    '• Security cameras sweep — spotted = ALARM: electro floors go lethal.',
    '• Combo: rapid container deposits multiply your bonus (up to ×8!).',
    '• Warp Doors teleport in pairs — explore to find the exits.',
    '• Crumbly walls can be dug through only if you carry the Spade.',
  ];
  tips.forEach((t,i)=>{
    ctx.fillStyle=i%2===0?'#2a7744':'#1e5533';
    ctx.font='8px monospace';ctx.textAlign='left';
    ctx.fillText(t,14,div3Y+28+i*14);
  });
}

function helpDivider(y){
  ctx.save();ctx.strokeStyle='rgba(0,255,68,0.18)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(12,y);ctx.lineTo(CW-12,y);ctx.stroke();ctx.restore();
}
