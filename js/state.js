// === ZONE X - State Variables ===

// ═══════════════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════════════
let map=[],robots=[],cameras=[],particles=[],popups=[];
let player={};
let score=0,lives=5,zone=1,hiScore=0;
let pluCarried=0,keysCarried=0,matsCarried=3;
let spadeCarried=false,chestKeyCarried=false;
let radTimer=0,radMax=CONF.RAD_MAX;
let pluLeft=0,outOpen=false;
let laserTick=0,laserOpen=false;
let camX=0,camY=0,camVX=0,camVY=0;
let state='title'; // title|playing|dead|win|over|pause
let deathT=0,stepT=0;
let shake=0,flash=0,flashCol='#f00';
let glowT=0,totalT=0;
let minimapOn=false,pauseOn=false;
let alarmOn=false,alarmT=0,alarmSfxT=0;
let fogEnabled=true;
// fog of war: set of revealed tile keys
let fogRevealed=new Set();
// combo system
let combo=0,comboTimer=0;
// conveyor momentum
let conveyorPush={dx:0,dy:0,t:0};
// score history for bonus display
let zoneScore=0;
// chest contents: chestKey -> item type
const CHEST_CONTENTS={
  '32:2':T.KEY,'5:33':T.SPADE,'28:11':T.TIME_ICON,'28:2':T.BONUS
};

// Extra state flags
let helpOn=false;
let editorOn=false;

// Positions of plutonium tiles already collected this level (persists across respawns)
let collectedPlu=new Set();
let _deathSnap=null; // unused, kept for safety
