// === ZONE X - Camera & Particles ===

// ═══════════════════════════════════════════════════════════════
//  CAMERA
// ═══════════════════════════════════════════════════════════════
function updateCamera(instant){
  // Track smooth pixel position for camera
  const pcx=player.px/TILE, pcy=player.py/TILE;
  const tx=Math.max(0,Math.min(COLS-VIEW_W,pcx-VIEW_W/2+0.5));
  const ty=Math.max(0,Math.min(ROWS-VIEW_H,pcy-VIEW_H/2+0.5));
  if(instant){camX=tx;camY=ty;camVX=0;camVY=0;return;}
  const k=CONF.CAM_K,damp=CONF.CAM_DAMP;
  camVX=(camVX+(tx-camX)*k)*damp;
  camVY=(camVY+(ty-camY)*k)*damp;
  camX+=camVX;camY+=camVY;
}

// ═══════════════════════════════════════════════════════════════
//  PARTICLES
// ═══════════════════════════════════════════════════════════════
function burst(c,r,col,n){
  const px=(c+0.5)*TILE,py=(r+0.5)*TILE;
  for(let i=0;i<n;i++){
    const a=Math.random()*Math.PI*2,s=1+Math.random()*3.5;
    particles.push({x:px,y:py,vx:Math.cos(a)*s,vy:Math.sin(a)*s-0.5,
      life:0.5+Math.random()*0.6,ml:1.1,col,sz:2+Math.random()*4});
  }
}
function spawnCrumble(c,r){
  const px=(c+0.5)*TILE,py=(r+0.5)*TILE;
  for(let i=0;i<18;i++){
    particles.push({
      x:px+(Math.random()-0.5)*TILE,y:py+(Math.random()-0.5)*TILE,
      vx:(Math.random()-0.5)*4,vy:-Math.random()*3.5,
      life:0.7+Math.random()*0.5,ml:1.2,
      col:Math.random()>.5?C.crumb:C.crumb2,sz:3+Math.random()*5
    });
  }
}
function spawnDeathPx(px,py){
  const cols=['#ff3300','#ff8800','#ffff44','#ff2200','#ffffff','#ff6600'];
  for(let i=0;i<70;i++){
    const a=Math.random()*Math.PI*2,s=2+Math.random()*8;
    particles.push({x:px,y:py,vx:Math.cos(a)*s,vy:Math.sin(a)*s,
      life:1.0+Math.random()*1.0,ml:2.0,
      col:cols[Math.random()*cols.length|0],sz:2+Math.random()*7});
  }
}
function addPopup(c,r,txt){
  popups.push({x:(c+0.5)*TILE,y:r*TILE,txt,life:1.4,ml:1.4});
}
