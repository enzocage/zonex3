// === ZONE X - Main (Canvas Setup & Game Loop) ===

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ── Responsive sizing ──────────────────────────────────────────
const TILE = 32;
const VIEW_W = 21, VIEW_H = 14, HUD_H = 68;
let CW, CH, scale = 1;
function resize() {
  const sw = window.innerWidth, sh = window.innerHeight - 20;
  const tw = VIEW_W * TILE, th = VIEW_H * TILE + HUD_H;
  scale = Math.min(sw / tw, sh / th, 1.5);
  CW = Math.round(tw); CH = Math.round(th);
  canvas.width = CW; canvas.height = CH;
  canvas.style.width  = Math.round(CW * scale) + 'px';
  canvas.style.height = Math.round(CH * scale) + 'px';
}
resize();
window.addEventListener('resize', resize);

// ═══════════════════════════════════════════════════════════════
//  MAIN LOOP
// ═══════════════════════════════════════════════════════════════
let lastT=0;
function loop(ts){
  const dt=Math.min((ts-lastT)/1000,0.05);lastT=ts;
  update(dt);draw();
  requestAnimationFrame(loop);
}
loadDefaultLevel(); // befüllt MAP_BASE etc. aus window.ZONE_LEVELS[1]
requestAnimationFrame(ts=>{lastT=ts;requestAnimationFrame(loop);});
