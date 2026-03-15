// === ZONE X - Update ===

// ═══════════════════════════════════════════════════════════════
//  UPDATE
// ═══════════════════════════════════════════════════════════════
function update(dt){
  glowT+=dt;
  if(shake>0)shake=Math.max(0,shake-dt*18);
  if(flash>0)flash=Math.max(0,flash-dt*3.5);

  if(state==='dead'){
    deathT-=dt;
    if(deathT<=0)respawn();
    updParts(dt);return;
  }
  if(state!=='playing')return;
  if(pauseOn)return;

  totalT+=dt;
  updateTouchHold(dt);
  processInput(dt);

  // Combo decay
  if(combo>0){
    comboTimer-=dt;
    if(comboTimer<=0){combo=0;comboTimer=0;}
  }

  // Conveyor auto-push
  if(conveyorPush&&conveyorPush.t>0){
    conveyorPush.t-=dt;
    if(conveyorPush.t<=0){
      const cdx=conveyorPush.dx,cdy=conveyorPush.dy;
      conveyorPush={dx:0,dy:0,t:0};
      doMove(cdx,cdy);
    }
  }

  // Radiation
  if(radTimer>0&&pluCarried>0){
    radTimer-=dt*(1+zone*0.04);
    if(radTimer<=0){radTimer=0;die('radiation');}
    // Warn when critically low
    else if(radTimer<4&&Math.floor(totalT*4)!==Math.floor((totalT-dt)*4)) sfx.radWarn();
  }

  // Lasers
  laserTick+=dt;
  const laserInterval=Math.max(CONF.LASER_MIN_INTERVAL,CONF.LASER_BASE_INTERVAL-zone*0.04);
  if(laserTick>=laserInterval){
    laserTick=0;laserOpen=!laserOpen;
    if(!laserOpen)sfx.laser();
    if(!laserOpen&&map[player.r][player.c]===T.LASER_DOOR)die('laser');
  }

  // Alarm flicker
  if(alarmOn){
    alarmT+=dt;
    if(alarmT<CONF.ALARM_DURATION){
      alarmSfxT+=dt;
      if(alarmSfxT>CONF.ALARM_SFX_INTERVAL){alarmSfxT=0;sfx.alarm();}
    }
  }

  // Robots
  updRobots(dt);

  // Security cameras
  updCameras(dt);

  // Particles / popups
  updParts(dt);
  for(const p of popups)p.life-=dt;
  popups.splice(0,popups.length,...popups.filter(p=>p.life>0));

  // Smooth movement interpolation
  // Player
  if(player.moveProgress<1.0){
    player.moveProgress=Math.min(1.0,player.moveProgress+dt*CONF.MOVE_SPEED);
    const t=smoothstep(player.moveProgress);
    player.px=player.px+(player.tx-player.px)*t;
    player.py=player.py+(player.ty-player.py)*t;
    // snap to target at end
    if(player.moveProgress>=1.0){
      player.px=player.tx;player.py=player.ty;
      // process queued input
      if(player.hasPending){
        player.hasPending=false;
        commitMove(player.nextDx,player.nextDy);
      }
    }
  }
  // Robots
  for(const rob of robots){
    if(!rob.alive||rob.tx===undefined)continue;
    if(rob.moveProgress<1.0){
      rob.moveProgress=Math.min(1.0,rob.moveProgress+dt*CONF.MOVE_SPEED*rob.speed);
      const t=smoothstep(rob.moveProgress);
      rob.px=rob.px+(rob.tx-rob.px)*t;
      rob.py=rob.py+(rob.ty-rob.py)*t;
      if(rob.moveProgress>=1.0){rob.px=rob.tx;rob.py=rob.ty;}
    }
  }

  updateCamera(false);
}

function smoothstep(x){x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);}

function updRobots(dt){
  for(const rob of robots){
    if(!rob.alive||rob.c<0)continue;
    const dist=Math.abs(rob.c-player.c)+Math.abs(rob.r-player.r);
    rob.alertT=dist<=5?Math.min(1,rob.alertT+dt*3):Math.max(0,rob.alertT-dt*2);

    // Stun
    if(rob.stunT>0){rob.stunT-=dt;continue;}

    rob.moveT+=dt;
    const interval=1/rob.speed;
    if(rob.moveT<interval)continue;
    rob.moveT=0;

    let dc=rob.axis==='h'?rob.dir:0,dr=rob.axis==='v'?rob.dir:0;
    const nc=rob.c+dc,nr=rob.r+dr;

    if(nc<0||nr<0||nc>=COLS||nr>=ROWS||
       solid(nc,nr)||map[nr][nc]===T.MAT_PICKUP||
       map[nr][nc]===T.ACID_POOL){
      rob.dir*=-1;
    } else {
      rob.steps+=rob.dir;
      if(Math.abs(rob.steps)>rob.range){rob.dir*=-1;rob.steps+=rob.dir*2;}
      rob.c=nc;rob.r=nr;
      // Start smooth slide
      rob.tx=nc*TILE;rob.ty=nr*TILE;
      rob.moveProgress=0.0;
    }

    // Kill player on contact
    killIfColliding(player.c,player.r);
  }
}

function updCameras(dt){
  for(const cam of cameras){
    // Sweep angle back and forth
    cam.angle+=cam.dir*cam.speed*dt;
    if(cam.angle>cam.angleStart+cam.angleSweep)cam.dir=-1;
    if(cam.angle<cam.angleStart)cam.dir=1;

    // Check if player in camera cone
    const pdx=(player.c+0.5)-(cam.c+0.5);
    const pdy=(player.r+0.5)-(cam.r+0.5);
    const dist=Math.sqrt(pdx*pdx+pdy*pdy);
    if(dist<cam.range){
      const pAngle=Math.atan2(pdy,pdx);
      let aDiff=pAngle-cam.angle;
      while(aDiff>Math.PI)aDiff-=Math.PI*2;
      while(aDiff<-Math.PI)aDiff+=Math.PI*2;
      if(Math.abs(aDiff)<0.45){
        cam.spotted=true;cam.spotTimer=1.5;
        if(!alarmOn){sfx.spotted();triggerAlarm();}
      }
    }
    if(cam.spotTimer>0)cam.spotTimer-=dt;
    else cam.spotted=false;
  }
}

function updParts(dt){
  for(const p of particles){
    p.x+=p.vx;p.y+=p.vy;
    p.vy+=0.14;p.vx*=0.95;
    p.life-=dt;
  }
  particles.splice(0,particles.length,...particles.filter(p=>p.life>0));
}
