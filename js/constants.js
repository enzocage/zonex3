// === ZONE X - Constants ===

// ── Tile IDs ───────────────────────────────────────────────────
const T = {
  FLOOR:0,WALL:1,PLUTONIUM:2,CONTAINER:3,KEY:4,MAT_PICKUP:5,
  TIME_ICON:6,BONUS:7,SPADE:8,CRUMBLY:9,GREEN_DOOR:10,
  SLAM_DOOR:11,LASER_DOOR:12,AIR_LOCK:13,WARP_DOOR:14,
  OUT_DOOR:15,ACID_POOL:16,FORCE_FIELD:17,CONVEYOR_R:18,
  CONVEYOR_L:19,CONVEYOR_U:20,CONVEYOR_D:21,CHEST:22,
  CAMERA_TILE:23,ALARM_LIGHT:24,ELECTRO_FLOOR:25
};

// ── Palette ────────────────────────────────────────────────────
const C = {
  bg:'#01080a',
  fl0:'#091510',fl1:'#0b1a13',
  w0:'#162820',w1:'#1e3828',w2:'#253e2d',wt:'#2c4a34',ws:'#0c1e12',
  plu:'#00ff88',pluD:'#00aa55',
  cont:'#e8c000',contD:'#aa8a00',
  key:'#ff9900',
  mat:'#9966dd',
  time:'#00ddff',
  bonus:'#ff44cc',
  spade:'#cc9944',
  crumb:'#4a3520',crumb2:'#6e4a28',
  gDoor:'#00cc44',
  slam:'#dd5500',
  laser:'#ff1100',
  air:'#2288ff',
  warp:'#cc44ff',
  out:'#ffee00',
  pl:'#3a99ff',plD:'#1a4488',
  rob:'#ff2222',robD:'#991111',robE:'#ffff00',
  acid:'#33ff44',
  ff:'#0077ff',
  con_r:'#ff8800',con_l:'#ff4400',con_u:'#ffcc00',con_d:'#ff6600',
  chest:'#ccaa44',
  cam:'#ff0055',
  alarm:'#ff2200',
  elec:'#44aaff',
  hBg:'#010e04',hLine:'#00ff4428',hTxt:'#00bb44',hHi:'#00ff88',
  hWrn:'#ffcc00',hDng:'#ff3300',
  fog:'rgba(0,0,0,0.88)',
  fogEdge:'rgba(0,0,0,0.55)',
};

// ── Global constants ────────────────────────────────────────────
const CONF = {
  // Grid / view
  TILE:       32,
  COLS:       36,
  ROWS:       36,
  VIEW_W:     21,
  VIEW_H:     14,
  HUD_H:      68,
  // Radiation
  RAD_MAX:    20,
  // Movement
  MOVE_SPEED: 12.0,
  // Keyboard
  KEY_REPEAT_DELAY: 0.14,
  KEY_REPEAT_RATE:  0.09,
  // Touch
  SWIPE_MIN:   14,
  SWIPE_LOCK:  28,
  HOLD_REPEAT: 0.18,
  // Camera spring
  CAM_K:    0.13,
  CAM_DAMP: 0.72,
  // Fog of war
  FOG_RADIUS: 5,
  // Laser timing
  LASER_BASE_INTERVAL: 1.5,
  LASER_MIN_INTERVAL:  0.5,
  // Alarm SFX
  ALARM_SFX_INTERVAL: 0.5,
  ALARM_DURATION: 3,
  // Starting values
  START_LIVES: 5,
  START_MATS:  3,
  // Scoring
  PLU_SCORE:       100,
  KEY_SCORE:       200,
  TIME_SCORE:      300,
  BONUS_SCORE:     500,
  SPADE_SCORE:     150,
  MAT_SCORE:        50,
  ZONE_BONUS_BASE: 2000,
  ZONE_FAST_BONUS: 2000,
  LIVES_BONUS:      500,
  DROP_PLU_PENALTY: 400,
};

const COLS=36,ROWS=36;
