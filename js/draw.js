// === ZONE X - Draw ===

// Preload cover image for title screen
const coverImg=new Image();
coverImg.src='content/cover3.jpg';

// ═══════════════════════════════════════════════════════════════
//  DRAW
// ═══════════════════════════════════════════════════════════════
function draw(){
  ctx.fillStyle=C.bg;
  ctx.fillRect(0,0,CW,CH);

  showLevelOverlay(state==='title');
  if(state==='title'){drawTitle();return;}
  if(state==='over') {drawOver();return;}

  // Shake
  let sx=0,sy=0;
  if(shake>0){sx=(Math.random()-.5)*shake*2.5;sy=(Math.random()-.5)*shake*2.5;}

  // Alarm tint
  if(alarmOn){
    const ap=0.07+0.06*Math.sin(glowT*10);
    ctx.fillStyle=`rgba(255,0,0,${ap})`;
    ctx.fillRect(0,0,CW,CH);
  }

  ctx.save();
  ctx.translate(sx,sy);

  // Clip to map area
  ctx.save();
  ctx.beginPath();ctx.rect(0,0,CW,VIEW_H*TILE);ctx.clip();
  ctx.translate(-camX*TILE,-camY*TILE);

  drawTiles();
  drawCameras();
  drawRobots();
  if(state==='playing')drawPlayer();
  drawParts();
  drawPopups();
  if(fogEnabled)drawFog();

  ctx.restore();

  drawHUD();

  // Flash
  if(flash>0.01){
    ctx.save();ctx.globalAlpha=flash;
    ctx.fillStyle=flashCol;ctx.fillRect(0,0,CW,CH);
    ctx.restore();
  }

  ctx.restore();

  if(minimapOn)drawMinimap();
  if(pauseOn&&!editorOn) drawPause();
  if(state==='dead')drawDead();
  if(state==='win') drawWin();
  if(helpOn)   drawHelp();
  if(editorOn) drawEditor();
}

// ── CAMERAS (cone visualization) ───────────────────────────────
function drawCameras(){
  for(const cam of cameras){
    const cx=(cam.c+0.5)*TILE, cy=(cam.r+0.5)*TILE;
    const R=cam.range*TILE;
    ctx.save();
    ctx.globalAlpha=cam.spotted?0.28:0.12;
    const grd=ctx.createRadialGradient(cx,cy,2,cx,cy,R);
    grd.addColorStop(0,cam.spotted?'rgba(255,0,0,0.8)':'rgba(255,200,0,0.5)');
    grd.addColorStop(1,'transparent');
    ctx.fillStyle=grd;
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,R,cam.angle-0.45,cam.angle+0.45);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// ── ROBOTS ─────────────────────────────────────────────────────
function drawRobots(){
  for(const rob of robots){
    if(!rob.alive||rob.c<0)continue;
    const px=rob.px,py=rob.py,S=TILE;
    const moving=rob.moveProgress<1.0;
    const leg=Math.sin(glowT*rob.speed*(moving?6:1))*3;
    const al=rob.alertT;

    ctx.save();
    if(al>0.2){ctx.shadowBlur=12*al;ctx.shadowColor=C.rob;}

    // Heavy robot variant: larger, darker
    const isH=rob.type==='heavy',isF=rob.type==='fast';
    let bc,dc;
    if(isH){
      const hue=(glowT*200+rob.id*37)%360;
      bc=`hsl(${hue},100%,50%)`;
      dc=`hsl(${hue},100%,28%)`;
      ctx.shadowBlur=18;ctx.shadowColor=`hsl(${hue},100%,65%)`;
    } else if(isF){
      bc='#ff5555';dc='#cc2222';
    } else {
      bc=C.rob;dc=C.robD;
    }

    ctx.fillStyle=dc;ctx.fillRect(px+(isH?1:3),py+(isH?3:5),S-(isH?2:6),S-(isH?5:8));
    ctx.fillStyle=bc;ctx.fillRect(px+(isH?2:4),py+(isH?4:6),S-(isH?4:8),S-(isH?8:10));
    // Head
    ctx.fillStyle=dc;ctx.fillRect(px+4,py+(isH?3:4),S-8,9);
    // Eyes
    const eyeCol=isH?bc:(al>0.5?'#ff6600':C.robE);
    ctx.fillStyle=eyeCol;
    ctx.fillRect(px+7,py+(isH?5:7),isH?7:5,isH?4:3);
    ctx.fillRect(px+S-13,py+(isH?5:7),isH?7:5,isH?4:3);
    // Antenna
    ctx.fillStyle=al>0.3?'#ff2200':'#884444';
    ctx.fillRect(px+S/2-1,py+1,2,4);
    ctx.beginPath();ctx.arc(px+S/2,py+2,3,0,Math.PI*2);ctx.fill();
    // Legs
    ctx.fillStyle=dc;
    ctx.fillRect(px+7,py+S-7+leg,5,7-leg);
    ctx.fillRect(px+S-12,py+S-7-leg,5,7+leg);
    if(isH){ctx.fillRect(px+S/2-2,py+S-9+leg*0.5,4,9-leg*0.5);}
    // Stun effect
    if(rob.stunT>0){
      ctx.save();ctx.globalAlpha=0.6;ctx.fillStyle='#88aaff';
      ctx.fillRect(px,py,S,S);ctx.restore();
    }
    // Alert ring
    if(al>0.1){
      ctx.globalAlpha=al*0.5;ctx.strokeStyle='#ff3300';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(px+S/2,py+S/2,S/2+4+al*5,0,Math.PI*2);ctx.stroke();
    }
    ctx.restore();
  }
}

// ── PLAYER ─────────────────────────────────────────────────────
function drawPlayer(){
  const px=player.px,py=player.py,S=TILE;
  const moving=player.moveProgress<1.0;
  const walkCycle=glowT*(moving?8:0);
  const bob=Math.sin(walkCycle)*2.2;
  const walk=Math.sin(walkCycle);

  ctx.save();
  if(pluCarried>0){ctx.shadowBlur=18+8*Math.sin(glowT*7);ctx.shadowColor=C.plu;}

  // Suit legs
  ctx.fillStyle='#1a3366';
  ctx.fillRect(px+8,py+S-10+bob*0.5,6,10-bob*0.5);
  ctx.fillRect(px+S-14,py+S-10-bob*0.5,6,10+bob*0.5);
  // Boot
  ctx.fillStyle='#112244';
  ctx.fillRect(px+7,py+S-4+bob*0.5,7,4);
  ctx.fillRect(px+S-14,py+S-4-bob*0.5,7,4);

  // Suit body
  ctx.fillStyle=C.plD;ctx.fillRect(px+5,py+8+bob,S-10,S-14);
  ctx.fillStyle=C.pl; ctx.fillRect(px+6,py+9+bob,S-12,S-16);
  // Chest detail
  ctx.fillStyle='#2255aa';ctx.fillRect(px+8,py+12+bob,S-16,4);

  // Backpack
  ctx.fillStyle='#1a3355';ctx.fillRect(px+S-10,py+10+bob,6,10);
  ctx.fillStyle='#112244';ctx.fillRect(px+S-9,py+11+bob,4,4);

  // Helmet
  ctx.fillStyle='#1a3355';ctx.fillRect(px+7,py+5+bob,S-14,8);
  // Visor
  ctx.fillStyle='#001a33';ctx.fillRect(px+8,py+6+bob,S-16,6);
  ctx.fillStyle='#0044aa';ctx.fillRect(px+9,py+6+bob,S-18,5);
  ctx.fillStyle='rgba(100,180,255,0.35)';ctx.fillRect(px+9,py+6+bob,5,3);

  // Arms
  ctx.fillStyle='#1a4499';
  ctx.fillRect(px+2,py+10+bob+walk*3,5,8);
  ctx.fillRect(px+S-7,py+10+bob-walk*3,5,8);

  // Plutonium glow circles
  if(pluCarried>0){
    ctx.save();ctx.shadowBlur=8;ctx.shadowColor=C.plu;ctx.fillStyle=C.plu;
    for(let i=0;i<Math.min(pluCarried,5);i++){
      ctx.beginPath();ctx.arc(px+7+i*5,py+S-4+bob,2.5,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}

// ── PARTICLES & POPUPS ─────────────────────────────────────────
function drawParts(){
  for(const p of particles){
    const a=Math.max(0,p.life/p.ml);
    ctx.save();ctx.globalAlpha=a;ctx.fillStyle=p.col;
    if(a>0.3){ctx.shadowBlur=5;ctx.shadowColor=p.col;}
    ctx.fillRect(p.x-p.sz/2,p.y-p.sz/2,p.sz,p.sz);
    ctx.restore();
  }
}
function drawPopups(){
  for(const p of popups){
    const a=Math.max(0,p.life/p.ml);
    const rise=(1-a)*32;
    ctx.save();ctx.globalAlpha=a;
    ctx.shadowBlur=7;ctx.shadowColor='#ffff44';
    ctx.fillStyle='#ffff44';ctx.font='bold 12px monospace';
    ctx.textAlign='center';ctx.fillText(p.txt,p.x,p.y-rise);
    ctx.restore();
  }
}

// ── FOG OF WAR ─────────────────────────────────────────────────
function drawFog(){
  if(!map.length)return;
  const sc=Math.max(0,Math.floor(camX)),sr=Math.max(0,Math.floor(camY));
  const ec=Math.min(COLS,sc+VIEW_W+2),er=Math.min(ROWS,sr+VIEW_H+2);
  for(let r=sr;r<er;r++){
    for(let c=sc;c<ec;c++){
      const key=`${c}:${r}`;
      if(fogRevealed.has(key))continue;
      // Check if adjacent to revealed
      let nearRevealed=false;
      for(const[dc,dr]of[[1,0],[-1,0],[0,1],[0,-1]]){
        if(fogRevealed.has(`${c+dc}:${r+dr}`)){nearRevealed=true;break;}
      }
      ctx.fillStyle=nearRevealed?C.fogEdge:C.fog;
      ctx.fillRect(c*TILE,r*TILE,TILE,TILE);
    }
  }
}

// ── HUD ────────────────────────────────────────────────────────
function drawHUD(){
  const hY=VIEW_H*TILE,W=CW;
  ctx.fillStyle=C.hBg;ctx.fillRect(0,hY,W,HUD_H);
  // Top glow line
  ctx.save();ctx.shadowBlur=4;ctx.shadowColor='#00ff4433';
  ctx.strokeStyle='#00ff4433';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(0,hY+0.5);ctx.lineTo(W,hY+0.5);ctx.stroke();
  ctx.restore();
  // Dividers
  ctx.strokeStyle=C.hLine;ctx.lineWidth=1;
  for(const x of[130,220,310,450,580]){
    ctx.beginPath();ctx.moveTo(x,hY+5);ctx.lineTo(x,hY+HUD_H-5);ctx.stroke();
  }

  const lbl=(x,y,s)=>{ctx.fillStyle=C.hTxt;ctx.font='bold 9px monospace';ctx.textAlign='left';ctx.fillText(s,x,y);};
  const val=(x,y,s,col=C.hHi)=>{
    ctx.save();ctx.shadowBlur=5;ctx.shadowColor=col;
    ctx.fillStyle=col;ctx.font='bold 13px monospace';ctx.textAlign='left';ctx.fillText(s,x,y);
    ctx.restore();
  };

  // Score
  lbl(12,hY+14,'SCORE');
  val(12,hY+30,String(score).padStart(7,'0'));
  lbl(12,hY+44,'HI:'+String(hiScore).padStart(7,'0'));

  // Zone/Time
  lbl(140,hY+14,'ZONE');
  val(140,hY+30,String(zone).padStart(2,'0'),'#ffff44');
  const ts=Math.floor(totalT);
  lbl(140,hY+44,`${String(ts/60|0).padStart(2,'0')}:${String(ts%60).padStart(2,'0')}`);

  // Lives
  lbl(228,hY+14,'LIVES');
  for(let i=0;i<Math.min(lives,6);i++){
    ctx.save();ctx.shadowBlur=3;ctx.shadowColor=C.pl;
    ctx.fillStyle=C.pl;ctx.fillRect(228+i*14,hY+22,11,11);
    ctx.fillStyle='#001a33';ctx.fillRect(229+i*14,hY+23,9,5);
    ctx.restore();
  }

  // Inventory
  lbl(318,hY+14,'INVENTORY');
  const inv=[
    [keysCarried>0?C.key:'#442200',`KEY:${keysCarried}`,318,hY+30],
    [matsCarried>0?C.mat:'#332244',`MAT:${matsCarried}`,318,hY+46],
    [spadeCarried?C.spade:'#443322',spadeCarried?'⛏ SPADE':'- SPADE',390,hY+30],
    [pluCarried>0?C.plu:'#224422',pluCarried>0?`☢×${pluCarried}`:'☢×0',390,hY+46],
  ];
  for(const[col,txt,x,y]of inv){
    ctx.save();if(col!=='#442200'&&col!=='#332244')ctx.shadowBlur=4,ctx.shadowColor=col;
    ctx.fillStyle=col;ctx.font='bold 11px monospace';ctx.textAlign='left';ctx.fillText(txt,x,y);
    ctx.restore();
  }

  // Combo
  if(combo>=2){
    ctx.save();
    const cp=0.8+0.2*Math.sin(glowT*8);
    ctx.shadowBlur=10*cp;ctx.shadowColor='#ff44cc';
    ctx.fillStyle='#ff44cc';ctx.font=`bold ${11+combo}px monospace`;ctx.textAlign='left';
    ctx.fillText(`COMBO ×${combo}!`,460,hY+14);
    // Combo bar
    const cbW=110,cbF=Math.min(1,comboTimer/4);
    ctx.fillStyle='#220011';ctx.fillRect(460,hY+18,cbW,4);
    ctx.fillStyle='#ff44cc';ctx.fillRect(460,hY+18,cbW*cbF,4);
    ctx.restore();
  }

  // Radiation bar
  const bX=460,bY=hY+26,bW=110,bH=12;
  if(combo<2){lbl(460,hY+24,'RADIATION');}
  else lbl(460,hY+24,'');
  ctx.fillStyle='#001100';ctx.fillRect(bX,bY,bW,bH);
  ctx.strokeStyle='#00ff4433';ctx.lineWidth=1;ctx.strokeRect(bX,bY,bW,bH);
  if(radTimer>0&&pluCarried>0){
    const frac=radTimer/radMax;
    const col=frac>.5?'#00ff44':frac>.25?C.hWrn:C.hDng;
    const pls=frac<.25?0.5+0.5*Math.sin(glowT*10):1;
    ctx.save();ctx.shadowBlur=7*pls;ctx.shadowColor=col;
    ctx.fillStyle=col;ctx.fillRect(bX+1,bY+1,(bW-2)*frac,bH-2);
    ctx.restore();
  }

  // Plu left + alarm
  const pc=pluLeft===0?C.out:C.plu;
  ctx.save();ctx.shadowBlur=pluLeft===0?14:4;ctx.shadowColor=pc;
  ctx.fillStyle=pc;ctx.font='bold 11px monospace';ctx.textAlign='left';
  ctx.fillText(`PLU:${pluLeft}`,460,hY+52);ctx.restore();
  if(pluLeft===0){
    ctx.save();const ep=0.7+0.3*Math.sin(glowT*7);
    ctx.shadowBlur=12*ep;ctx.shadowColor=C.out;ctx.fillStyle=C.out;
    ctx.font='bold 11px monospace';ctx.fillText('►EXIT!',512,hY+52);ctx.restore();
  }
  if(alarmOn){
    const ap=0.7+0.3*Math.sin(glowT*12);
    ctx.save();ctx.shadowBlur=10*ap;ctx.shadowColor=C.alarm;
    ctx.fillStyle=C.alarm;ctx.font='bold 11px monospace';
    ctx.fillText('☢ ALARM ☢',570,hY+52);ctx.restore();
  }

  // Controls hint
  ctx.fillStyle='#0f2010';ctx.font='8px monospace';ctx.textAlign='right';
  ctx.fillText('[H]HELP [E]EDIT [Z]MAP [X]DROP [F]FOG [ESC]PAUSE · WASD/ARROWS',CW-6,hY+HUD_H-5);
}

// ── MINIMAP ────────────────────────────────────────────────────
function drawMinimap(){
  if(!map.length||state==='title')return;
  const S=4,mmW=COLS*S+6,mmH=ROWS*S+6;
  const mmX=CW-mmW-6,mmY=6;
  ctx.fillStyle='rgba(0,8,4,0.92)';ctx.fillRect(mmX,mmY,mmW,mmH);
  ctx.strokeStyle='#00ff4444';ctx.lineWidth=1;ctx.strokeRect(mmX,mmY,mmW,mmH);
  for(let r=0;r<ROWS;r++){
    for(let c=0;c<COLS;c++){
      if(fogEnabled&&!fogRevealed.has(`${c}:${r}`))continue;
      const t=map[r][c];
      let col=null;
      if(t===T.WALL)col='#1c3020';
      if(t===T.PLUTONIUM)col=C.plu;
      if(t===T.CONTAINER)col=C.cont;
      if(t===T.OUT_DOOR) col=outOpen?C.out:'#444';
      if(t===T.LASER_DOOR)col=C.laser;
      if(t===T.ACID_POOL)col=C.acid;
      if(t===T.WARP_DOOR)col=C.warp;
      if(col){ctx.fillStyle=col;ctx.fillRect(mmX+3+c*S,mmY+3+r*S,S-1,S-1);}
    }
  }
  // Robots
  ctx.fillStyle=C.rob;
  for(const rob of robots)
    if(rob.alive)ctx.fillRect(mmX+3+rob.c*S,mmY+3+rob.r*S,S,S);
  // Player
  const pp=0.6+0.4*Math.sin(glowT*8);
  ctx.save();ctx.shadowBlur=5*pp;ctx.shadowColor=C.pl;ctx.fillStyle=C.pl;
  ctx.fillRect(mmX+3+player.c*S,mmY+3+player.r*S,S,S);ctx.restore();
  // Camera rect
  ctx.strokeStyle='rgba(0,255,136,0.35)';ctx.lineWidth=1;
  ctx.strokeRect(mmX+3+camX*S,mmY+3+camY*S,VIEW_W*S,VIEW_H*S);
}

// ═══════════════════════════════════════════════════════════════
//  OVERLAY SCREENS
// ═══════════════════════════════════════════════════════════════
function drawTitle(){
  // Dark background
  ctx.fillStyle='#000';ctx.fillRect(0,0,CW,CH);

  // Cover image – fitted to full canvas, vertically centered
  if(coverImg.complete&&coverImg.naturalWidth>0){
    const iw=coverImg.naturalWidth,ih=coverImg.naturalHeight;
    const s=Math.min(CW/iw,CH/ih);
    const dw=iw*s,dh=ih*s;
    const dx=(CW-dw)/2,dy=(CH-dh)/2;
    ctx.drawImage(coverImg,dx,dy,dw,dh);
  }

  // Blinking start prompt (near bottom, above level-select overlay)
  if(Math.floor(Date.now()/550)%2===0){
    ctx.save();ctx.shadowBlur=14;ctx.shadowColor='#ffff44';
    ctx.fillStyle='#ffff44';ctx.font='bold 18px monospace';ctx.textAlign='center';
    ctx.fillText('▶  PRESS ENTER / TAP TO START  ◀',CW/2,CH-112);ctx.restore();
  }
}

function drawDead(){
  ctx.save();ctx.globalAlpha=Math.min(0.75,(2-deathT)/2*0.75);
  ctx.fillStyle='#1a0000';ctx.fillRect(0,0,CW,CH);ctx.restore();
  if(deathT<1.6){
    ctx.save();ctx.shadowBlur=28;ctx.shadowColor='#ff1100';
    ctx.fillStyle='#ff2200';ctx.font='bold 44px monospace';ctx.textAlign='center';
    ctx.fillText('☠ TERMINATED ☠',CW/2,CH/2-18);
    ctx.fillStyle='#ff7744';ctx.font='14px monospace';
    ctx.fillText(`LIVES REMAINING: ${lives}`,CW/2,CH/2+20);
    ctx.restore();
  }
}

function drawWin(){
  ctx.save();ctx.globalAlpha=0.88;ctx.fillStyle='#001106';ctx.fillRect(0,0,CW,CH);ctx.restore();
  ctx.save();ctx.shadowBlur=28;ctx.shadowColor=C.out;
  ctx.fillStyle=C.out;ctx.font='bold 44px monospace';ctx.textAlign='center';
  ctx.fillText('✓ ZONE SECURED',CW/2,CH/2-50);
  ctx.fillStyle='#00ff88';ctx.font='16px monospace';
  ctx.fillText(`TOTAL SCORE: ${score}`,CW/2,CH/2-5);
  ctx.fillStyle='#ffcc00';ctx.font='13px monospace';
  if(totalT<60)ctx.fillText('⚡ SPEED BONUS! +'+CONF.ZONE_FAST_BONUS,CW/2,CH/2+20);
  ctx.fillText(`LIVES BONUS: +${lives*CONF.LIVES_BONUS}`,CW/2,CH/2+40);
  ctx.fillStyle='#00cc55';ctx.font='13px monospace';
  if(currentLevelIndex>0&&currentLevelIndex<levelCount){
    ctx.fillText(`LOADING LEVEL ${currentLevelIndex+1}...`,CW/2,CH/2+70);
  } else {
    ctx.fillText('PRESS ENTER / TAP FOR NEXT ZONE',CW/2,CH/2+70);
  }
  ctx.restore();
}

function drawOver(){
  ctx.fillStyle='#000';ctx.fillRect(0,0,CW,CH);
  for(let y=0;y<CH;y+=3){ctx.fillStyle='rgba(30,0,0,0.6)';ctx.fillRect(0,y,CW,1);}
  ctx.save();ctx.shadowBlur=40;ctx.shadowColor='#ff0000';
  ctx.fillStyle='#ff1100';ctx.font='bold 56px monospace';ctx.textAlign='center';
  ctx.fillText('GAME OVER',CW/2,190);
  ctx.fillStyle='#884422';ctx.font='16px monospace';
  ctx.fillText(`FINAL: ${score}`,CW/2,248);
  ctx.fillText(`ZONES: ${zone-1}`,CW/2,274);
  ctx.fillStyle=C.hTxt;ctx.font='12px monospace';
  ctx.fillText('PRESS ENTER / TAP TO RETURN',CW/2,380);ctx.restore();
}

function drawPause(){
  ctx.save();ctx.globalAlpha=0.65;ctx.fillStyle='#000a04';ctx.fillRect(0,0,CW,CH);ctx.restore();
  ctx.save();ctx.shadowBlur=18;ctx.shadowColor=C.hHi;
  ctx.fillStyle=C.hHi;ctx.font='bold 36px monospace';ctx.textAlign='center';
  ctx.fillText('— PAUSED —',CW/2,CH/2-16);
  ctx.fillStyle=C.hTxt;ctx.font='13px monospace';
  ctx.fillText('[ESC] to resume',CW/2,CH/2+22);ctx.restore();
}
