// === ZONE X - Level Manager ===
// ── Neue Level: Nummer hier eintragen wenn neue JSON-Files in Levels/ hinzugefügt werden ──
const AVAILABLE_LEVELS = [1, 2, 3, 4, 5, 6];

let currentLevelIndex = 0; // 0 = built-in, sonst Index in AVAILABLE_LEVELS
let levelCount = AVAILABLE_LEVELS.length;

function buildLevelDropdown() {
  const sel = document.getElementById('levelSelect');
  if (!sel) return;
  sel.innerHTML = '';
  const optB = document.createElement('option');
  optB.value = 0;
  optB.textContent = 'BUILT-IN';
  sel.appendChild(optB);
  for (const n of AVAILABLE_LEVELS) {
    const opt = document.createElement('option');
    opt.value = n;
    opt.textContent = `LEVEL ${String(n).padStart(2,'0')}`;
    sel.appendChild(opt);
  }
  if (levelCount > 0) {
    sel.value = AVAILABLE_LEVELS[0];
    currentLevelIndex = AVAILABLE_LEVELS[0];
  }
}

function showLevelOverlay(visible) {
  const el = document.getElementById('levelSelectOverlay');
  if (el) el.style.display = visible ? 'flex' : 'none';
}

function syncLevelIndex() {
  const sel = document.getElementById('levelSelect');
  if (sel) currentLevelIndex = parseInt(sel.value) || 0;
}

function loadLevelByIndex(n) {
  return new Promise(resolve => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `levels/${n}.json`, true);
    xhr.onload = () => {
      // status 0 = file:// success, 200 = HTTP success
      if (xhr.status === 200 || xhr.status === 0) {
        try {
          const data = JSON.parse(xhr.responseText);
          applyLevelData(data);
          currentLevelIndex = n;
        } catch(e) {
          console.error('Level parse error', n, e);
          resetLevel();
        }
      } else {
        console.error('Level not found', n, 'status:', xhr.status);
        resetLevel();
      }
      resolve();
    };
    xhr.onerror = () => {
      console.error('Level load error', n);
      resetLevel();
      resolve();
    };
    xhr.send();
  });
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

// Dropdown beim Laden sofort befüllen (kein async nötig)
buildLevelDropdown();

// Sofort syncen wenn Spieler Dropdown ändert
(function(){
  const sel = document.getElementById('levelSelect');
  if(sel) sel.addEventListener('change', syncLevelIndex);
})();
