// === ZONE X - Level Manager ===
// ── Neue Level: Nummer hier eintragen + entsprechende levels/N.js laden ──
const AVAILABLE_LEVELS = [1, 2, 3, 4, 5, 6];

let currentLevelIndex = 1;
let levelCount = AVAILABLE_LEVELS.length;

// Global fallback-Arrays – werden durch loadDefaultLevel() aus ZONE_LEVELS[1] befüllt
let MAP_BASE   = [];
let WARP_PAIRS = [];
let ROBOT_DEFS = [];
let CAM_DEFS   = [];

function buildLevelDropdown() {
  const sel = document.getElementById('levelSelect');
  if (!sel) return;
  sel.innerHTML = '';
  for (const n of AVAILABLE_LEVELS) {
    const opt = document.createElement('option');
    opt.value = n;
    opt.textContent = `LEVEL ${String(n).padStart(2,'0')}`;
    sel.appendChild(opt);
  }
  sel.value = AVAILABLE_LEVELS[0];
  currentLevelIndex = AVAILABLE_LEVELS[0];
}

function showLevelOverlay(visible) {
  const el = document.getElementById('levelSelectOverlay');
  if (el) el.style.display = visible ? 'flex' : 'none';
}

function syncLevelIndex() {
  const sel = document.getElementById('levelSelect');
  if (sel) currentLevelIndex = parseInt(sel.value) || 1;
}

// Befüllt MAP_BASE etc. synchron aus window.ZONE_LEVELS[1]
function loadDefaultLevel() {
  const data = (window.ZONE_LEVELS || {})[1];
  if (!data) { console.error('ZONE_LEVELS[1] nicht gefunden'); return; }
  MAP_BASE   = data.map.map(r => Array.isArray(r) ? [...r] : []);
  ROBOT_DEFS = (data.robots  && data.robots.length  > 0) ? data.robots  : [];
  CAM_DEFS   = (data.cameras && data.cameras.length > 0) ? data.cameras : [];
  WARP_PAIRS = [];
  if (data.warpPairs) {
    for (const wp of data.warpPairs) {
      WARP_PAIRS.push({from: wp.from, to: wp.to});
      WARP_PAIRS.push({from: wp.to,   to: wp.from});
    }
  }
}

// Lädt Level n synchron aus window.ZONE_LEVELS – gibt Promise.resolve() zurück
// damit bestehende .then()-Aufrufer weiter funktionieren
function loadLevelByIndex(n) {
  const data = (window.ZONE_LEVELS || {})[n];
  if (data) {
    applyLevelData(data);
    currentLevelIndex = n;
  } else {
    console.error('Level nicht gefunden:', n);
    resetLevel();
  }
  return Promise.resolve();
}

function applyLevelData(data) {
  map = data.map.map(r => Array.isArray(r) ? [...r] : []);
  pluLeft = 0; outOpen = false; laserTick = 0; laserOpen = false;
  particles = []; popups = []; radTimer = 0; pluCarried = 0; keysCarried = 0;
  matsCarried = CONF.START_MATS; spadeCarried = false; chestKeyCarried = false;
  alarmOn = false; alarmT = 0; alarmSfxT = 0; shake = 0; flash = 0;
  totalT = 0; stepT = 0; combo = 0; comboTimer = 0;
  conveyorPush = {dx:0, dy:0, t:0}; fogRevealed = new Set();

  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (map[r] && map[r][c] === T.PLUTONIUM) pluLeft++;

  const sc = (data.playerStart && data.playerStart.c != null) ? data.playerStart.c : 2;
  const sr = (data.playerStart && data.playerStart.r != null) ? data.playerStart.r : 2;
  player = {c:sc, r:sr, facing:0, animT:0,
            px:sc*TILE, py:sr*TILE, tx:sc*TILE, ty:sr*TILE,
            moving:false, moveProgress:1.0, nextDx:0, nextDy:0, hasPending:false};

  const robDefs = (data.robots && data.robots.length > 0) ? data.robots : ROBOT_DEFS;
  robots = robDefs.map((d, i) => ({
    c:d.c, r:d.r, px:d.c*TILE, py:d.r*TILE, tx:d.c*TILE, ty:d.r*TILE,
    moveProgress:1.0, prevC:d.c, prevR:d.r,
    axis:d.axis||'h', range:d.range||4,
    speed:(d.speed||1.0)*(1+zone*0.04),
    type:d.type||'normal', dir:1, steps:0, moveT:0, alertT:0, id:i, alive:true, stunT:0,
  }));

  const camDefs = (data.cameras && data.cameras.length > 0) ? data.cameras : CAM_DEFS;
  cameras = camDefs.map(d => ({
    c:d.c, r:d.r, range:d.range||5,
    angleStart:d.angleStart||0, angleSweep:d.angleSweep||(Math.PI*0.7),
    angle:d.angleStart||0, dir:1, speed:0.8, spotted:false, spotTimer:0,
  }));

  WARP_PAIRS.length = 0;
  if (data.warpPairs && data.warpPairs.length > 0) {
    for (const wp of data.warpPairs) {
      WARP_PAIRS.push({from: wp.from, to: wp.to});
      WARP_PAIRS.push({from: wp.to, to: wp.from});
    }
  }

  revealFog(player.c, player.r);
  updateCamera(true);
}

// Dropdown befüllen
buildLevelDropdown();

// Sofort syncen wenn Spieler Dropdown ändert
(function(){
  const sel = document.getElementById('levelSelect');
  if(sel) sel.addEventListener('change', syncLevelIndex);
})();
