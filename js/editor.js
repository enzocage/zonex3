// === ZONE X - Level Editor ===

// ═══════════════════════════════════════════════════════════════
//  LEVEL EDITOR  [E]
// ═══════════════════════════════════════════════════════════════
// Editor tile colours (flat palette for map view)
const ED_COL={
  [T.FLOOR]:'#0c1e0e',  [T.WALL]:'#22401c',   [T.PLUTONIUM]:'#00cc66',
  [T.CONTAINER]:'#bb9900',[T.KEY]:'#dd7700',   [T.MAT_PICKUP]:'#7744bb',
  [T.TIME_ICON]:'#0099cc',[T.BONUS]:'#cc1188', [T.SPADE]:'#997733',
  [T.CRUMBLY]:'#4a3015', [T.GREEN_DOOR]:'#007722',[T.SLAM_DOOR]:'#994400',
  [T.LASER_DOOR]:'#bb0000',[T.AIR_LOCK]:'#1155bb',[T.WARP_DOOR]:'#772299',
  [T.OUT_DOOR]:'#aaaa00',[T.ACID_POOL]:'#22aa22',[T.FORCE_FIELD]:'#0044aa',
  [T.CONVEYOR_R]:'#995500',[T.CONVEYOR_L]:'#774400',[T.CONVEYOR_U]:'#886600',
  [T.CONVEYOR_D]:'#aa4400',[T.CHEST]:'#886633', [T.CAMERA_TILE]:'#880033',
  [T.ALARM_LIGHT]:'#aa0000',[T.ELECTRO_FLOOR]:'#113355',
};
// Text labels inside tiles (one letter)
const ED_LBL={
  [T.WALL]:'#',[T.PLUTONIUM]:'P',[T.CONTAINER]:'C',[T.KEY]:'K',
  [T.MAT_PICKUP]:'M',[T.TIME_ICON]:'T',[T.BONUS]:'?',[T.SPADE]:'S',
  [T.CRUMBLY]:'~',[T.GREEN_DOOR]:'G',[T.SLAM_DOOR]:'>',[T.LASER_DOOR]:'L',
  [T.AIR_LOCK]:'A',[T.WARP_DOOR]:'W',[T.OUT_DOOR]:'O',[T.ACID_POOL]:'X',
  [T.FORCE_FIELD]:'F',[T.CONVEYOR_R]:'>',[T.CONVEYOR_L]:'<',
  [T.CONVEYOR_U]:'^',[T.CONVEYOR_D]:'v',[T.CHEST]:'$',
  [T.CAMERA_TILE]:'@',[T.ALARM_LIGHT]:'!',[T.ELECTRO_FLOOR]:'~',
};

// Robot placement tools (negative IDs = not real tiles)
const ROB_TOOL_NORMAL=-1, ROB_TOOL_FAST=-2, ROB_TOOL_HEAVY=-3;
const ROB_TOOL_NAMES ={[-1]:'R-Norm',[-2]:'R-Fast',[-3]:'R-Heavy'};
const ROB_TOOL_COLS  ={[-1]:'#ffcc44',[-2]:'#ff8800',[-3]:'#ff3333'};
const ROB_TOOL_TYPES ={[-1]:'normal',[-2]:'fast',[-3]:'heavy'};
const ROB_TOOL_SPEEDS={[-1]:1.0,[-2]:1.5,[-3]:0.8};

const ED_PALETTE=[
  T.FLOOR,T.WALL,T.PLUTONIUM,T.CONTAINER,T.KEY,T.MAT_PICKUP,
  T.TIME_ICON,T.BONUS,T.SPADE,T.CRUMBLY,T.GREEN_DOOR,T.SLAM_DOOR,
  T.LASER_DOOR,T.AIR_LOCK,T.WARP_DOOR,T.OUT_DOOR,T.ACID_POOL,
  T.FORCE_FIELD,T.CONVEYOR_R,T.CONVEYOR_L,T.CONVEYOR_U,T.CONVEYOR_D,
  T.CHEST,T.CAMERA_TILE,T.ALARM_LIGHT,T.ELECTRO_FLOOR,
  ROB_TOOL_NORMAL,ROB_TOOL_FAST,ROB_TOOL_HEAVY,
];
const ED_PAL_NAMES={
  [T.FLOOR]:'Floor',[T.WALL]:'Wall',[T.PLUTONIUM]:'Plu',[T.CONTAINER]:'Cont',
  [T.KEY]:'Key',[T.MAT_PICKUP]:'Mat',[T.TIME_ICON]:'Time',[T.BONUS]:'Bonus',
  [T.SPADE]:'Spade',[T.CRUMBLY]:'Crumb',[T.GREEN_DOOR]:'GDoor',[T.SLAM_DOOR]:'Slam',
  [T.LASER_DOOR]:'Laser',[T.AIR_LOCK]:'AirLk',[T.WARP_DOOR]:'Warp',[T.OUT_DOOR]:'Exit',
  [T.ACID_POOL]:'Acid',[T.FORCE_FIELD]:'Force',[T.CONVEYOR_R]:'Cv-R',[T.CONVEYOR_L]:'Cv-L',
  [T.CONVEYOR_U]:'Cv-U',[T.CONVEYOR_D]:'Cv-D',[T.CHEST]:'Chest',[T.CAMERA_TILE]:'Cam',
  [T.ALARM_LIGHT]:'Alarm',[T.ELECTRO_FLOOR]:'Elec',
};

const ED_PAL_DESC={
  [T.FLOOR]:       'Begehbares Bodenfeld. Neutrale Fläche auf der alle Spielelemente platziert werden können.',
  [T.WALL]:        'Unpassierbare Wand. Blockiert Spieler und Roboter vollständig. Grundbaustein für Korridore und Räume.',
  [T.PLUTONIUM]:   'Radioaktives Material. Muss vollständig eingesammelt werden. Jede Aufnahme startet oder verkürzt den Strahlungs-Countdown.',
  [T.CONTAINER]:   'Abgabebehälter für Plutonium. Mehrere Stücke auf einmal abgeben erhöht den Bonus exponentiell (n²×500 Pkt.).',
  [T.KEY]:         'Schlüssel. Einmalig verwendbar – öffnet dauerhaft eine Grüne Tür. Ohne Schlüssel ist die Tür unpassierbar.',
  [T.MAT_PICKUP]:  'Schutzmatten. Aufnehmen und mit LEERTASTE ablegen. Roboter können die Matte nicht überqueren.',
  [T.TIME_ICON]:   'Zeitkanister. Gibt dem Strahlungs-Timer +12 Sekunden zurück. Lebensrettend in späten Zonen.',
  [T.BONUS]:       'Bonusfeld. Enthält 500 mysteriöse Bonuspunkte. Einfach drüberlaufen zum Einsammeln.',
  [T.SPADE]:       'Schaufel. Tragen erlaubt das Durchgraben von Brüchigen Wänden. Danach verbraucht.',
  [T.CRUMBLY]:     'Brüchige Wand. Nur mit Schaufel passierbar – zerfällt beim Durchqueren dauerhaft.',
  [T.GREEN_DOOR]:  'Grüne Tür. Öffnet sich bei Schlüsselkontakt dauerhaft und verschwindet aus der Karte.',
  [T.SLAM_DOOR]:   'Schlagdurchgang. Einbahnstraße – schließt sich sofort hinter dem Spieler. Kein Zurück.',
  [T.LASER_DOOR]:  'Laserbarrikade. Wechselt zwischen offen und geschlossen. Beim aktiven Strahl durchlaufen = sofortiger Tod.',
  [T.AIR_LOCK]:    'Schleuse. Betreten öffnet automatisch einen benachbarten, bisher gesperrten Bereich.',
  [T.WARP_DOOR]:   'Teleporter. Sofortiger Sprung zum gekoppelten Warp-Ausgang. Paare werden vom Generator vergeben.',
  [T.OUT_DOOR]:    'Ausgang. Öffnet sich erst wenn sämtliches Plutonium abgegeben wurde. Ziel jedes Levels.',
  [T.ACID_POOL]:   'Säurebad. Sofortiger Tod bei Berührung. Vollständig unpassierbar, auch für Roboter.',
  [T.FORCE_FIELD]: 'Kraftfeld. Einwegwand – nur aus der Pfeilrichtung begehbar. Andere Seite blockiert wie eine Wand.',
  [T.CONVEYOR_R]:  'Förderband (→). Schiebt Spieler und Roboter automatisch nach rechts, solange sie darauf stehen.',
  [T.CONVEYOR_L]:  'Förderband (←). Schiebt Spieler und Roboter automatisch nach links.',
  [T.CONVEYOR_U]:  'Förderband (↑). Schiebt Spieler und Roboter automatisch nach oben.',
  [T.CONVEYOR_D]:  'Förderband (↓). Schiebt Spieler und Roboter automatisch nach unten.',
  [T.CHEST]:       'Truhe. Enthält ein zufälliges verstecktes Objekt. Gegen die Truhe laufen öffnet sie.',
  [T.CAMERA_TILE]: 'Überwachungskamera. Dreht ihren Sichtstrahl periodisch. Sichtkontakt mit dem Spieler löst sofort den Alarm aus.',
  [T.ALARM_LIGHT]: 'Alarmsensor. Einmaliger Bodenkontakt genügt um den Alarm dauerhaft auszulösen.',
  [T.ELECTRO_FLOOR]:'Elektroboden. Im Normalzustand sicher. Wird bei aktivem Alarm sofort tödlich.',
};
const ROB_TOOL_DESC={
  [-1]:'Normaler Roboter. Patrouilliert auf seiner Achse. Berühren ist tödlich. Kann durch Matten kurz aufgehalten werden.',
  [-2]:'Schneller Roboter. Bewegt sich sehr rasch – kaum Zeit zum Ausweichen. Besonders gefährlich in engen Korridoren.',
  [-3]:'Schwerer Roboter. Tötet auch auf angrenzenden Feldern ohne direkten Kontakt. Langsamer aber mit größerer Gefahrenzone.',
};

// Sidebar widths/heights
const ED_PAL_W   = 168;  // right sidebar px
const ED_TOOL_H  = 52;   // bottom toolbar px
const ED_TS      = 20;   // map tile size in editor (px)

let ed={
  map:null,
  robots:[],
  selTile:T.WALL,
  camX:0,camY:0,
  dragging:false,erasing:false,
  mouseC:-1,mouseR:-1,
  name:'custom',
  playerC:2,playerR:2,
  showGrid:true,
  setStartMode:false,
  aiDifficulty:5,
  aiGenerating:false,
  aiLastMsg:'',
  hovPalIdx:-1,
  warpPairs:[],      // manually placed warp pairs [{from:{c,r},to:{c,r}}]
  warpFirst:null,    // {c,r} of first warp placed, awaiting partner
};

function edMapW(){ return CW-ED_PAL_W; }
function edVW(){   return Math.floor(edMapW()/ED_TS); }
function edVH(){   return Math.floor((CH-ED_TOOL_H)/ED_TS); }

function editorInit(){
  ed.map=[];
  for(let r=0;r<ROWS;r++){
    ed.map[r]=[];
    for(let c=0;c<COLS;c++)
      ed.map[r][c]=(r===0||r===ROWS-1||c===0||c===COLS-1)?T.WALL:T.FLOOR;
  }
  ed.camX=0;ed.camY=0;ed.playerC=2;ed.playerR=2;ed.robots=[];
  ed.warpPairs=[];ed.warpFirst=null;
}

function onEditorKey(code){
  if(code==='Escape'||code==='KeyE'){ editorOn=false;pauseOn=false;return; }
  if(code==='KeyG') ed.showGrid=!ed.showGrid;
  const PAN=3;
  if(code==='ArrowLeft'||code==='KeyA')  ed.camX=Math.max(0,ed.camX-PAN);
  if(code==='ArrowRight'||code==='KeyD') ed.camX=Math.min(COLS-edVW(),ed.camX+PAN);
  if(code==='ArrowUp'||code==='KeyW')    ed.camY=Math.max(0,ed.camY-PAN);
  if(code==='ArrowDown'||code==='KeyS')  ed.camY=Math.min(ROWS-edVH(),ed.camY+PAN);
  if(code==='Space'&&ed.mouseC>=0&&ed.mouseR>=0) edPaint(ed.mouseC,ed.mouseR,false);
}

// ── Draw editor ─────────────────────────────────────────────────
function palWrapLines(ctx,text,maxW){
  const words=text.split(' ');
  const lines=[];
  let line='';
  for(const w of words){
    const test=line?line+' '+w:w;
    if(ctx.measureText(test).width>maxW&&line){lines.push(line);line=w;}
    else line=test;
  }
  if(line)lines.push(line);
  return lines;
}

function drawEditor(){
  if(!ed.map) editorInit();
  ctx.save();
  ctx.fillStyle='#010c04';ctx.fillRect(0,0,CW,CH);

  // ── Map viewport ──────────────────────────────────────────────
  const MW=edMapW(), MH=CH-ED_TOOL_H;
  ctx.save();
  ctx.beginPath();ctx.rect(0,0,MW,MH);ctx.clip();

  const vw=edVW()+1, vh=edVH()+1;
  for(let r=0;r<vh;r++){
    for(let c=0;c<vw;c++){
      const mc=c+ed.camX,mr=r+ed.camY;
      if(mc<0||mr<0||mc>=COLS||mr>=ROWS)continue;
      const t=ed.map[mr][mc];
      const px=c*ED_TS,py=r*ED_TS;
      // Render actual tile appearance scaled to ED_TS
      ctx.save();
      ctx.beginPath();ctx.rect(px,py,ED_TS,ED_TS);ctx.clip();
      ctx.translate(px,py);
      ctx.scale(ED_TS/TILE,ED_TS/TILE);
      drawTile(t,0,0,mc,mr);
      ctx.restore();
      // grid
      if(ed.showGrid){
        ctx.strokeStyle='rgba(0,80,20,0.45)';ctx.lineWidth=0.5;
        ctx.strokeRect(px,py,ED_TS,ED_TS);
      }
    }
  }

  // Player start marker
  const psx=(ed.playerC-ed.camX)*ED_TS,psy=(ed.playerR-ed.camY)*ED_TS;
  if(psx>=0&&psy>=0&&psx<MW&&psy<MH){
    ctx.save();ctx.shadowBlur=8;ctx.shadowColor=C.pl;
    ctx.fillStyle='rgba(0,80,200,0.55)';ctx.fillRect(psx,psy,ED_TS,ED_TS);
    ctx.fillStyle=C.pl;ctx.font=`bold ${ED_TS-4}px monospace`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('P',psx+ED_TS/2,psy+ED_TS/2+1);ctx.restore();
  }

  // Placed robots
  for(const rob of ed.robots){
    const rx=(rob.c-ed.camX)*ED_TS,ry=(rob.r-ed.camY)*ED_TS;
    if(rx<-ED_TS||ry<-ED_TS||rx>=MW||ry>=MH)continue;
    const rc=ROB_TOOL_COLS[rob._tool]||'#ffcc44';
    ctx.save();
    ctx.shadowBlur=6;ctx.shadowColor=rc;
    ctx.fillStyle=rc+'44';ctx.fillRect(rx,ry,ED_TS,ED_TS);
    ctx.strokeStyle=rc;ctx.lineWidth=1.5;ctx.strokeRect(rx+1,ry+1,ED_TS-2,ED_TS-2);
    ctx.fillStyle=rc;ctx.font=`bold ${ED_TS-5}px monospace`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('R',rx+ED_TS/2,ry+ED_TS/2+1);
    ctx.restore();
  }

  // Warp pair connector lines
  ctx.save();
  for(const wp of (ed.warpPairs||[])){
    const ax=(wp.from.c-ed.camX)*ED_TS+ED_TS/2, ay=(wp.from.r-ed.camY)*ED_TS+ED_TS/2;
    const bx=(wp.to.c  -ed.camX)*ED_TS+ED_TS/2, by=(wp.to.r  -ed.camY)*ED_TS+ED_TS/2;
    ctx.strokeStyle='rgba(180,80,255,0.7)';ctx.lineWidth=1.5;
    ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();
    ctx.setLineDash([]);
  }
  // Pending first warp highlight
  if(ed.warpFirst){
    const wx=(ed.warpFirst.c-ed.camX)*ED_TS,wy=(ed.warpFirst.r-ed.camY)*ED_TS;
    const pulse=0.5+0.5*Math.sin(Date.now()*0.007);
    ctx.strokeStyle=`rgba(255,100,255,${0.6+0.4*pulse})`;ctx.lineWidth=2.5;
    ctx.strokeRect(wx+1,wy+1,ED_TS-2,ED_TS-2);
    ctx.fillStyle=`rgba(180,0,255,${0.18*pulse})`;ctx.fillRect(wx,wy,ED_TS,ED_TS);
  }
  ctx.restore();

  // Warp mode status message
  if(ed.warpFirst&&ed.selTile===T.WARP_DOOR){
    ctx.save();
    ctx.fillStyle='rgba(0,0,0,0.72)';ctx.fillRect(0,0,MW,18);
    ctx.fillStyle='#ff88ff';ctx.font='bold 11px monospace';ctx.textAlign='center';
    ctx.fillText('WARP 1 gesetzt – klicke auf ein zweites Feld für den Ziel-Warp',MW/2,13);
    ctx.restore();
  }

  // Hover cursor
  if(ed.mouseC>=0&&ed.mouseC<COLS&&ed.mouseR>=0&&ed.mouseR<ROWS){
    const hx=(ed.mouseC-ed.camX)*ED_TS,hy=(ed.mouseR-ed.camY)*ED_TS;
    ctx.save();
    // tile preview at 50% alpha
    if(!ed.erasing&&!ed.setStartMode){
      if(ed.selTile<0){
        const rc=ROB_TOOL_COLS[ed.selTile];
        ctx.globalAlpha=0.6;
        ctx.fillStyle=rc+'44';ctx.fillRect(hx,hy,ED_TS,ED_TS);
        ctx.fillStyle=rc;ctx.font=`bold ${ED_TS-5}px monospace`;
        ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText('R',hx+ED_TS/2,hy+ED_TS/2+1);
      } else {
        ctx.globalAlpha=0.55;
        ctx.beginPath();ctx.rect(hx,hy,ED_TS,ED_TS);ctx.clip();
        ctx.translate(hx,hy);ctx.scale(ED_TS/TILE,ED_TS/TILE);
        drawTile(ed.selTile,0,0,ed.mouseC,ed.mouseR);
      }
    }
    ctx.restore();
    ctx.save();
    ctx.strokeStyle=ed.erasing?'#ff4422':ed.setStartMode?'#4488ff':'#00ff88';
    ctx.lineWidth=2;ctx.strokeRect(hx+1,hy+1,ED_TS-2,ED_TS-2);
    ctx.restore();
  }
  ctx.restore();

  // ── Palette sidebar ───────────────────────────────────────────
  const PX=MW;
  ctx.fillStyle='#010e05';ctx.fillRect(PX,0,ED_PAL_W,CH);
  ctx.save();ctx.strokeStyle='rgba(0,255,68,0.3)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(PX,0);ctx.lineTo(PX,CH);ctx.stroke();ctx.restore();

  // Title
  ctx.fillStyle='#00bb44';ctx.font='bold 10px monospace';ctx.textAlign='center';
  ctx.fillText('PALETTE',PX+ED_PAL_W/2,13);

  // Selected tile label
  const selName=ED_PAL_NAMES[ed.selTile]||ROB_TOOL_NAMES[ed.selTile]||'?';
  ctx.fillStyle='#00ff88';ctx.font='bold 9px monospace';ctx.textAlign='center';
  ctx.fillText('['+selName+']',PX+ED_PAL_W/2,24);

  // Palette grid: 3 columns with real square tile icons
  const PAL_ICO=20; // square icon size px
  const PAL_PAD=6;
  const palCols=3;
  const palColW=Math.floor((ED_PAL_W-PAL_PAD*2-4)/palCols); // cell width
  const palRowH=PAL_ICO+14; // icon + name below
  ED_PALETTE.forEach((tid,i)=>{
    const col=i%palCols,row=Math.floor(i/palCols);
    const cellX=PX+PAL_PAD+col*(palColW+4);
    const cellY=32+row*(palRowH+4);
    // center icon horizontally in cell
    const iconX=cellX+Math.floor((palColW-PAL_ICO)/2);
    const iconY=cellY;
    // dark bg
    ctx.fillStyle='#040f06';ctx.fillRect(iconX,iconY,PAL_ICO,PAL_ICO);
    // draw tile icon — robot tools use custom glyph
    if(tid<0){
      const rc=ROB_TOOL_COLS[tid];
      ctx.save();
      ctx.fillStyle=rc+'33';ctx.fillRect(iconX,iconY,PAL_ICO,PAL_ICO);
      ctx.shadowBlur=8;ctx.shadowColor=rc;
      ctx.fillStyle=rc;ctx.font=`bold ${PAL_ICO-6}px monospace`;
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText('R',iconX+PAL_ICO/2,iconY+PAL_ICO/2+1);
      ctx.restore();
    } else {
      ctx.save();
      ctx.beginPath();ctx.rect(iconX,iconY,PAL_ICO,PAL_ICO);ctx.clip();
      ctx.translate(iconX,iconY);
      ctx.scale(PAL_ICO/TILE,PAL_ICO/TILE);
      drawTile(tid,0,0,1,1);
      ctx.restore();
    }
    // name label
    ctx.fillStyle=tid<0?ROB_TOOL_COLS[tid]+'cc':'rgba(160,230,160,0.8)';
    ctx.font='5px monospace';
    ctx.textAlign='center';ctx.textBaseline='alphabetic';
    ctx.fillText(ED_PAL_NAMES[tid]||ROB_TOOL_NAMES[tid]||tid,iconX+PAL_ICO/2,iconY+PAL_ICO+9);
    // selection ring (around icon only, square)
    if(tid===ed.selTile){
      ctx.save();ctx.shadowBlur=8;ctx.shadowColor='#00ff88';
      ctx.strokeStyle='#00ff88';ctx.lineWidth=2;
      ctx.strokeRect(iconX-1,iconY-1,PAL_ICO+2,PAL_ICO+2);ctx.restore();
    } else {
      ctx.strokeStyle='rgba(0,180,50,0.2)';ctx.lineWidth=0.5;
      ctx.strokeRect(iconX,iconY,PAL_ICO,PAL_ICO);
    }
  });

  // Mode indicator in sidebar
  const modeY=32+Math.ceil(ED_PALETTE.length/palCols)*(palRowH+4)+10;
  if(ed.setStartMode){
    ctx.fillStyle='#2244ff';ctx.font='bold 9px monospace';ctx.textAlign='center';
    ctx.fillText('>> CLICK START <<',PX+ED_PAL_W/2,modeY);
    ctx.fillStyle='rgba(20,40,200,0.4)';
    ctx.fillRect(PX+4,modeY+4,ED_PAL_W-8,18);
    ctx.fillStyle='#88aaff';ctx.font='8px monospace';
    ctx.fillText('Click map = Player start',PX+ED_PAL_W/2,modeY+15);
  }

  // Coords display
  const infoY=CH-ED_TOOL_H-30;
  ctx.fillStyle='#1a3a1a';ctx.font='8px monospace';ctx.textAlign='center';
  ctx.fillText(`Cam: ${ed.camX},${ed.camY}`,PX+ED_PAL_W/2,infoY);
  if(ed.mouseC>=0) ctx.fillText(`Tile: ${ed.mouseC},${ed.mouseR}`,PX+ED_PAL_W/2,infoY+11);

  // ── Toolbar ───────────────────────────────────────────────────
  const TBY=CH-ED_TOOL_H;
  ctx.fillStyle='#010e05';ctx.fillRect(0,TBY,CW,ED_TOOL_H);
  ctx.save();ctx.strokeStyle='rgba(0,255,68,0.25)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(0,TBY);ctx.lineTo(CW,TBY);ctx.stroke();ctx.restore();

  const BH=22,BY=TBY+6;
  function edBtn(lbl,x,w,active,color,glowing){
    const col=active?(color||'#003a14'):'#010e05';
    ctx.fillStyle=col;ctx.fillRect(x,BY,w,BH);
    if(glowing){
      ctx.save();ctx.shadowBlur=12;ctx.shadowColor='#ffaa00';
      ctx.strokeStyle='#ffaa00';ctx.lineWidth=1.5;
      ctx.strokeRect(x,BY,w,BH);ctx.restore();
    } else {
      ctx.strokeStyle=active?'#00ff88':'rgba(0,255,68,0.3)';ctx.lineWidth=1;
      ctx.strokeRect(x,BY,w,BH);
    }
    ctx.fillStyle=glowing?'#ffcc44':active?'#00ff88':'#00aa44';
    ctx.font='bold 9px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(lbl,x+w/2,BY+BH/2);
  }
  let bx=6;
  edBtn('NEW',bx,42,false);          bx+=46;
  edBtn('LOAD',bx,46,false);         bx+=50;
  edBtn('SAVE JSON',bx,70,false);    bx+=74;
  edBtn('PLAY',bx,44,false,'#003300'); bx+=48;
  edBtn('SET START',bx,68,ed.setStartMode,'#001a44'); bx+=72;
  edBtn('[G]GRID',bx,56,ed.showGrid); bx+=60;

  // ── AI Generator section ──────────────────────────────────────
  const aiX=bx+4;
  // separator
  ctx.strokeStyle='rgba(255,170,0,0.3)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(bx+1,BY-1);ctx.lineTo(bx+1,BY+BH+1);ctx.stroke();

  const isGenerating=ed.aiGenerating;
  const glowPulse=0.6+0.4*Math.sin(glowT*6);

  // Generate button
  const genW=90;
  if(isGenerating){
    ctx.fillStyle='#1a0c00';ctx.fillRect(aiX,BY,genW,BH);
    ctx.save();ctx.shadowBlur=10*glowPulse;ctx.shadowColor='#ff8800';
    ctx.strokeStyle=`rgba(255,136,0,${glowPulse})`;ctx.lineWidth=1.5;
    ctx.strokeRect(aiX,BY,genW,BH);ctx.restore();
    ctx.fillStyle=`rgba(255,180,0,${glowPulse})`;
    ctx.font='bold 8px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('GENERATING...',aiX+genW/2,BY+BH/2);
  } else {
    edBtn('AI GENERATE',aiX,genW,false,'#0a0a00',true);
  }

  // Difficulty stepper: - [N] +
  const stepX=aiX+genW+6;
  edBtn('-',stepX,18,false,'#1a0800');
  ctx.fillStyle='#0a1a00';ctx.fillRect(stepX+22,BY,28,BH);
  ctx.strokeStyle='rgba(255,170,0,0.5)';ctx.lineWidth=1;
  ctx.strokeRect(stepX+22,BY,28,BH);
  ctx.save();ctx.shadowBlur=8;ctx.shadowColor='#ffaa00';
  ctx.fillStyle='#ffcc44';ctx.font='bold 14px monospace';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(String(ed.aiDifficulty),stepX+36,BY+BH/2);ctx.restore();
  edBtn('+',stepX+54,18,false,'#1a0800');

  // Difficulty label
  ctx.fillStyle='rgba(200,150,0,0.7)';ctx.font='7px monospace';
  ctx.textAlign='center';ctx.textBaseline='alphabetic';
  ctx.fillText('DIFFICULTY',stepX+36,BY+BH+10);

  // Close button far right
  edBtn('[ESC]CLOSE',CW-84,80,false);

  // Hint line
  ctx.fillStyle='#1a3a1a';ctx.font='8px monospace';ctx.textAlign='left';ctx.textBaseline='alphabetic';
  const aiMsg=ed.aiLastMsg?`AI: ${ed.aiLastMsg.slice(0,60)}`:'LMB paint  RMB erase  ARROWS pan  [G] grid  [E]/[ESC] close';
  ctx.fillStyle=ed.aiLastMsg?'#886600':'#1a3a1a';
  ctx.fillText(aiMsg,6,TBY+ED_TOOL_H-5);

  // ── Palette hover tooltip ─────────────────────────────────────
  if(ed.hovPalIdx>=0&&ed.hovPalIdx<ED_PALETTE.length){
    const htid=ED_PALETTE[ed.hovPalIdx];
    const hrow=Math.floor(ed.hovPalIdx/3);
    const rowCenterY=32+hrow*(20+14+4)+10;
    const ICO3=60;   // 3× the 20px palette icon
    const TTW=168;   // tooltip width — matches sidebar for clean alignment
    const TXT_PAD=8; // horizontal text padding
    const TXT_W=TTW-TXT_PAD*2;
    const DESC_LH=11; // description line height
    // pre-compute description lines to know tooltip height
    const hname=ED_PAL_NAMES[htid]||ROB_TOOL_NAMES[htid]||'?';
    const hdesc=ED_PAL_DESC[htid]||ROB_TOOL_DESC[htid]||'';
    ctx.font='9px monospace'; // set font before measureText
    const descLines=hdesc?palWrapLines(ctx,hdesc,TXT_W):[];
    const TTH=8+ICO3+14+4+2+descLines.length*DESC_LH+10; // top+icon+name+sep+desc+bottom
    const ttX=PX-TTW-6;
    const ttY=Math.max(2,Math.min(CH-ED_TOOL_H-TTH-2,rowCenterY-TTH/2));
    // drop shadow + dark background
    ctx.save();
    ctx.shadowBlur=20;ctx.shadowColor='rgba(0,255,100,0.35)';
    ctx.fillStyle='rgba(1,12,5,0.98)';ctx.fillRect(ttX,ttY,TTW,TTH);
    ctx.restore();
    // border
    ctx.strokeStyle='#00cc55';ctx.lineWidth=1;
    ctx.strokeRect(ttX+0.5,ttY+0.5,TTW-1,TTH-1);
    // top accent stripe
    ctx.fillStyle='rgba(0,200,80,0.12)';ctx.fillRect(ttX+1,ttY+1,TTW-2,3);
    // draw element at 3× zoom
    const icoX=ttX+(TTW-ICO3)/2;
    const icoY=ttY+8;
    ctx.save();
    ctx.beginPath();ctx.rect(icoX,icoY,ICO3,ICO3);ctx.clip();
    if(htid<0){
      const rc=ROB_TOOL_COLS[htid];
      ctx.fillStyle=rc+'22';ctx.fillRect(icoX,icoY,ICO3,ICO3);
      ctx.shadowBlur=14;ctx.shadowColor=rc;
      ctx.fillStyle=rc;ctx.font='bold 42px monospace';
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText('R',icoX+ICO3/2,icoY+ICO3/2+1);
    } else {
      ctx.translate(icoX,icoY);
      ctx.scale(ICO3/TILE,ICO3/TILE);
      drawTile(htid,0,0,1,1);
    }
    ctx.restore();
    // name label — bold, crisp
    const nameCol=htid<0?ROB_TOOL_COLS[htid]:'#00ff88';
    ctx.fillStyle=nameCol;
    ctx.font='bold 11px monospace';
    ctx.textAlign='center';ctx.textBaseline='alphabetic';
    ctx.fillText(hname,ttX+TTW/2,ttY+8+ICO3+13);
    // separator line
    const sepY=ttY+8+ICO3+18;
    ctx.strokeStyle='rgba(0,180,60,0.3)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(ttX+TXT_PAD,sepY);ctx.lineTo(ttX+TTW-TXT_PAD,sepY);ctx.stroke();
    // description text — wrapped, readable
    ctx.fillStyle='rgba(180,230,180,0.9)';
    ctx.font='9px monospace';
    ctx.textAlign='left';ctx.textBaseline='alphabetic';
    let dy=sepY+DESC_LH;
    for(const ln of descLines){
      ctx.fillText(ln,ttX+TXT_PAD,dy);
      dy+=DESC_LH;
    }
  }
}

// ── Editor input ─────────────────────────────────────────────────
function edMousePos(e){
  const rect=canvas.getBoundingClientRect();
  return [(e.clientX-rect.left)/scale,(e.clientY-rect.top)/scale];
}
function edHitMap(sx,sy){ return sx<edMapW()&&sy<CH-ED_TOOL_H; }
function edHitPal(sx,sy){ return sx>=edMapW()&&sy<CH-ED_TOOL_H; }
function edHitBar(sx,sy){ return sy>=CH-ED_TOOL_H; }

function edScreenToTile(sx,sy){
  return [Math.floor(sx/ED_TS)+ed.camX, Math.floor(sy/ED_TS)+ed.camY];
}

canvas.addEventListener('mousemove',e=>{
  if(!editorOn)return;
  const [sx,sy]=edMousePos(e);
  if(edHitMap(sx,sy)){
    [ed.mouseC,ed.mouseR]=edScreenToTile(sx,sy);
    if(ed.dragging&&!ed.setStartMode) edPaint(ed.mouseC,ed.mouseR,ed.erasing);
    ed.hovPalIdx=-1;
  } else {
    ed.mouseC=-1;ed.mouseR=-1;
    if(edHitPal(sx,sy)){
      const _palColW=Math.floor((ED_PAL_W-6*2-4)/3);
      const relX=sx-edMapW()-6,relY=sy-32;
      if(relY>=0){
        const hc=Math.min(2,Math.floor(relX/(_palColW+4)));
        const hr=Math.floor(relY/(20+14+4));
        const hi=hr*3+hc;
        ed.hovPalIdx=(hi>=0&&hi<ED_PALETTE.length)?hi:-1;
      } else { ed.hovPalIdx=-1; }
    } else { ed.hovPalIdx=-1; }
  }
});

canvas.addEventListener('mousedown',e=>{
  if(helpOn){
    const rect=canvas.getBoundingClientRect();
    const sx=(e.clientX-rect.left)/scale, sy=(e.clientY-rect.top)/scale;
    // Tab clicks: two tabs centered at W/2
    const W=CW;
    if(sy>=34&&sy<=48){
      if(sx>=W/2-74&&sx<=W/2-2) helpPage=0;
      else if(sx>=W/2+6&&sx<=W/2+78) helpPage=1;
    }
    return;
  }
  if(!editorOn)return;
  e.preventDefault();
  const [sx,sy]=edMousePos(e);

  if(edHitBar(sx,sy)){
    edToolbarClick(sx,sy);return;
  }
  if(edHitPal(sx,sy)){
    edPaletteClick(sx,sy);return;
  }
  if(edHitMap(sx,sy)){
    [ed.mouseC,ed.mouseR]=edScreenToTile(sx,sy);
    if(ed.setStartMode){
      if(ed.mouseC>=0&&ed.mouseC<COLS&&ed.mouseR>=0&&ed.mouseR<ROWS){
        ed.playerC=ed.mouseC;ed.playerR=ed.mouseR;
        ed.setStartMode=false;
      }
      return;
    }
    ed.dragging=true;ed.erasing=(e.button===2);
    edPaint(ed.mouseC,ed.mouseR,ed.erasing);
  }
});
canvas.addEventListener('mouseup',()=>{ed.dragging=false;});
canvas.addEventListener('contextmenu',e=>{if(editorOn)e.preventDefault();});

// Mouse wheel: scroll editor camera
canvas.addEventListener('wheel',e=>{
  if(!editorOn)return;
  e.preventDefault();
  if(Math.abs(e.deltaX)>Math.abs(e.deltaY)){
    ed.camX=Math.max(0,Math.min(COLS-edVW(),ed.camX+Math.sign(e.deltaX)*2));
  } else {
    ed.camY=Math.max(0,Math.min(ROWS-edVH(),ed.camY+Math.sign(e.deltaY)*2));
  }
},{passive:false});

function edPaletteClick(sx,sy){
  const PX=edMapW();
  const PAL_ICO=20,PAL_PAD=6,palCols=3;
  const palColW=Math.floor((ED_PAL_W-PAL_PAD*2-4)/palCols);
  const palRowH=PAL_ICO+14+4;
  const relX=sx-PX-PAL_PAD,relY=sy-32;
  if(relY<0)return;
  const col=Math.min(palCols-1,Math.floor(relX/(palColW+4)));
  const row=Math.floor(relY/palRowH);
  const idx=row*palCols+col;
  if(idx>=0&&idx<ED_PALETTE.length){
    const newTile=ED_PALETTE[idx];
    if(newTile!==T.WARP_DOOR) ed.warpFirst=null; // cancel pending warp pair
    ed.selTile=newTile;
  }
}

function edToolbarClick(sx,sy){
  const BH=22,BY=CH-ED_TOOL_H+6;
  if(sy<BY||sy>BY+BH+12)return; // +12 for difficulty label below

  // Difficulty label click area (below stepper)
  // Main button row
  if(sy>=BY&&sy<=BY+BH){
    // Static buttons (positions must match drawEditor)
    let bx=6;
    if(sx>=bx&&sx<=bx+42){editorNew();return;} bx+=46;
    if(sx>=bx&&sx<=bx+46){editorLoad();return;} bx+=50;
    if(sx>=bx&&sx<=bx+70){editorSave();return;} bx+=74;
    if(sx>=bx&&sx<=bx+44){editorPlay();return;} bx+=48;
    if(sx>=bx&&sx<=bx+68){ed.setStartMode=!ed.setStartMode;return;} bx+=72;
    if(sx>=bx&&sx<=bx+56){ed.showGrid=!ed.showGrid;return;} bx+=60;
    // AI section
    const aiX=bx+4;
    if(sx>=aiX&&sx<=aiX+90){aiGenerate();return;}            // Generate btn
    const stepX=aiX+90+6;
    if(sx>=stepX&&sx<=stepX+18){                              // minus
      ed.aiDifficulty=Math.max(1,ed.aiDifficulty-1);return;
    }
    if(sx>=stepX+54&&sx<=stepX+72){                           // plus
      ed.aiDifficulty=Math.min(10,ed.aiDifficulty+1);return;
    }
    // Close
    if(sx>=CW-84&&sx<=CW){ editorOn=false;pauseOn=false;return; }
  }
}

function edPaint(c,r,erase){
  if(!ed.map||c<0||r<0||c>=COLS||r>=ROWS)return;
  if(ed.selTile<0){
    // Robot tool: place or remove
    ed.robots=ed.robots.filter(rob=>!(rob.c===c&&rob.r===r));
    if(!erase) ed.robots.push({c,r,type:ROB_TOOL_TYPES[ed.selTile],axis:'h',range:4,speed:ROB_TOOL_SPEEDS[ed.selTile],_tool:ed.selTile});
    return;
  }
  // Warp door: must be placed in pairs
  if(ed.selTile===T.WARP_DOOR){
    if(erase){
      ed.map[r][c]=T.FLOOR;
      ed.warpPairs=ed.warpPairs.filter(wp=>
        !(wp.from.c===c&&wp.from.r===r)&&!(wp.to.c===c&&wp.to.r===r));
      if(ed.warpFirst&&ed.warpFirst.c===c&&ed.warpFirst.r===r) ed.warpFirst=null;
    } else {
      if(ed.map[r][c]===T.WARP_DOOR) return; // already placed, no duplicate
      ed.map[r][c]=T.WARP_DOOR;
      if(ed.warpFirst===null){
        ed.warpFirst={c,r};
      } else if(!(ed.warpFirst.c===c&&ed.warpFirst.r===r)){
        ed.warpPairs.push({from:{...ed.warpFirst},to:{c,r}});
        ed.warpFirst=null;
      }
    }
    return;
  }
  ed.map[r][c]=erase?T.FLOOR:ed.selTile;
}

function editorNew(){
  ed.map=[];
  for(let r=0;r<ROWS;r++){
    ed.map[r]=[];
    for(let c=0;c<COLS;c++)
      ed.map[r][c]=(r===0||r===ROWS-1||c===0||c===COLS-1)?T.WALL:T.FLOOR;
  }
  ed.playerC=2;ed.playerR=2;ed.camX=0;ed.camY=0;ed.robots=[];
  ed.warpPairs=[];ed.warpFirst=null;
}

function editorSave(){
  if(!ed.map)return;
  const data={
    name:ed.name||'custom',cols:COLS,rows:ROWS,
    playerStart:{c:ed.playerC,r:ed.playerR},
    map:ed.map,
    robots:ed.robots.map(rob=>({c:rob.c,r:rob.r,type:rob.type,axis:rob.axis,range:rob.range,speed:rob.speed})),
    warpPairs:(ed.warpPairs||[]).map(wp=>({from:{...wp.from},to:{...wp.to}})),
  };
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=`zonex_${ed.name||'level'}.json`;
  document.body.appendChild(a);a.click();
  document.body.removeChild(a);URL.revokeObjectURL(url);
}

function editorLoad(){
  const inp=document.createElement('input');
  inp.type='file';inp.accept='.json,application/json';
  inp.onchange=ev=>{
    const f=ev.target.files[0];if(!f)return;
    const reader=new FileReader();
    reader.onload=re=>{
      try{
        const data=JSON.parse(re.target.result);
        if(data.map&&Array.isArray(data.map)){
          ed.map=data.map.map(r=>Array.isArray(r)?[...r]:[]);
          ed.name=data.name||'loaded';
          if(data.playerStart){ed.playerC=data.playerStart.c||2;ed.playerR=data.playerStart.r||2;}
          ed.robots=(data.robots||[]).map(rob=>({...rob,_tool:rob.type==='fast'?ROB_TOOL_FAST:rob.type==='heavy'?ROB_TOOL_HEAVY:ROB_TOOL_NORMAL}));
          ed.warpPairs=(data.warpPairs||[]).map(wp=>({from:{...wp.from},to:{...wp.to}}));
          ed.warpFirst=null;
          ed.camX=0;ed.camY=0;
        }
      }catch(err){console.error('Load failed',err);}
    };
    reader.readAsText(f);
  };
  inp.click();
}

// ── Update controls hint in HUD (monkey-patch after load) ────────
// (handled inline in drawHUD already -- no changes needed)
