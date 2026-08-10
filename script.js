const reducedMotion=matchMedia('(prefers-reduced-motion:reduce)').matches;

const canvas=document.querySelector('#field-canvas');
const context=canvas.getContext('2d',{alpha:false});
const frameInterval=1000/30;
let width=0,height=0,dpr=1,particles=[],backdropGradient=null;
let animationFrame=0,lastFrame=0,resizeTimer=0;
let pointerX=0,pointerY=0,pointerVelocityX=0,pointerVelocityY=0;
let pointerEnergy=0,pointerLastMove=0,pointerActive=false;

const random=(min,max)=>min+Math.random()*(max-min);

const resetParticle=(particle,initial=false)=>{
  const mobile=width<800;
  const centerX=width*(mobile?.58:.76);
  const centerY=height*(mobile?.38:.6);
  const angle=random(0,Math.PI*2);
  const radius=random(Math.min(width,height)*.06,Math.min(width,height)*(mobile?.58:.7));
  particle.x=centerX+Math.cos(angle)*radius*random(.75,1.35);
  particle.y=centerY+Math.sin(angle)*radius*random(.5,.95);
  particle.px=particle.x;
  particle.py=particle.y;
  particle.vx=0;
  particle.vy=0;
  particle.speed=random(.8,2.15);
  particle.life=initial?random(0,360):0;
  particle.maxLife=random(220,560);
  particle.width=random(.5,1.8);
  particle.gold=Math.random()<.5;
  particle.alpha=random(.32,.84);
};

const buildParticles=()=>{
  const count=reducedMotion?160:(width<800?260:420);
  particles=Array.from({length:count},()=>{
    const particle={};
    resetParticle(particle,true);
    return particle;
  });
};

const resize=()=>{
  dpr=Math.min(devicePixelRatio||1,1.25);
  width=innerWidth;
  height=innerHeight;
  canvas.width=Math.round(width*dpr);
  canvas.height=Math.round(height*dpr);
  canvas.style.width=`${width}px`;
  canvas.style.height=`${height}px`;
  context.setTransform(dpr,0,0,dpr,0,0);
  context.fillStyle='#030105';
  context.fillRect(0,0,width,height);
  const mobile=width<800;
  const centerX=width*(mobile?.58:.76);
  const centerY=height*(mobile?.38:.6);
  backdropGradient=context.createRadialGradient(centerX,centerY,0,centerX,centerY,Math.max(width,height)*.7);
  backdropGradient.addColorStop(0,'rgba(70,29,124,.05)');
  backdropGradient.addColorStop(.42,'rgba(15,5,24,.025)');
  backdropGradient.addColorStop(1,'rgba(3,1,5,.09)');
  buildParticles();
};

const drawBackdrop=()=>{
  context.globalCompositeOperation='source-over';
  context.fillStyle='rgba(3,1,5,.052)';
  context.fillRect(0,0,width,height);
  context.fillStyle=backdropGradient;
  context.fillRect(0,0,width,height);
};

const updateParticle=(particle,time,dt)=>{
  const mobile=width<800;
  const centerX=width*(mobile?.58:.76)+Math.sin(time*.00019)*width*.035;
  const centerY=height*(mobile?.38:.6)+Math.cos(time*.00017)*height*.045;
  const dx=particle.x-centerX;
  const dy=particle.y-centerY;
  const distance=Math.max(1,Math.hypot(dx,dy));
  const tangent=Math.atan2(dy,dx)+Math.PI/2;
  const ripple=Math.sin(distance*.012-time*.00135)*.48;
  const wave=Math.sin(particle.y*.005+time*.00055)*.28+Math.cos(particle.x*.0035-time*.00042)*.2;
  let angle=tangent+ripple+wave;
  let acceleration=particle.speed*(.018+Math.min(distance/Math.max(width,height),.55)*.025);

  particle.vx=particle.vx*.965+Math.cos(angle)*acceleration*dt;
  particle.vy=particle.vy*.965+Math.sin(angle)*acceleration*dt;

  if(pointerActive){
    const pointerDx=particle.x-pointerX;
    const pointerDy=particle.y-pointerY;
    const pointerDistanceSquared=pointerDx*pointerDx+pointerDy*pointerDy;
    const interactionRadius=mobile?110:Math.min(210,Math.max(135,width*.13));
    const interactionRadiusSquared=interactionRadius*interactionRadius;
    if(pointerDistanceSquared>1&&pointerDistanceSquared<interactionRadiusSquared){
      const inverseDistance=1/Math.sqrt(pointerDistanceSquared);
      const normalX=pointerDx*inverseDistance;
      const normalY=pointerDy*inverseDistance;
      const proximity=1-pointerDistanceSquared/interactionRadiusSquared;
      const force=proximity*proximity*pointerEnergy*dt;
      particle.vx+=(normalX*.44-normalY*.17+pointerVelocityX*.022)*force;
      particle.vy+=(normalY*.44+normalX*.17+pointerVelocityY*.022)*force;
    }
  }

  const velocity=Math.hypot(particle.vx,particle.vy);
  const maxVelocity=3.2*particle.speed;
  if(velocity>maxVelocity){
    particle.vx=particle.vx/velocity*maxVelocity;
    particle.vy=particle.vy/velocity*maxVelocity;
  }

  particle.px=particle.x;
  particle.py=particle.y;
  particle.x+=particle.vx*dt;
  particle.y+=particle.vy*dt;
  particle.life+=dt;

  const edge=80;
  if(particle.life>particle.maxLife||particle.x<-edge||particle.x>width+edge||particle.y<-edge||particle.y>height+edge)resetParticle(particle);
};

const drawParticle=particle=>{
  const fade=Math.sin(Math.min(1,particle.life/45)*Math.PI/2)*Math.min(1,(particle.maxLife-particle.life)/70);
  if(fade<=0)return;
  context.beginPath();
  context.moveTo(particle.px,particle.py);
  context.lineTo(particle.x,particle.y);
  context.lineWidth=particle.width;
  context.strokeStyle=particle.gold?`rgba(253,208,35,${Math.min(1,particle.alpha*fade*1.18)})`:`rgba(143,57,255,${particle.alpha*fade*.82})`;
  context.stroke();
  if(particle.gold&&particle.width>1.05&&Math.random()<.012){
    context.beginPath();
    context.fillStyle=`rgba(255,245,194,${.65*fade})`;
    context.arc(particle.x,particle.y,1.6,0,Math.PI*2);
    context.fill();
  }
};

const drawFrame=(time,dt,update=true)=>{
  drawBackdrop();
  context.globalCompositeOperation='lighter';
  for(const particle of particles){
    if(update)updateParticle(particle,time,dt);
    drawParticle(particle);
  }
};

const warmUp=()=>{
  const steps=reducedMotion?1:24;
  for(let step=0;step<steps;step++){
    const time=step*16.67;
    drawFrame(time,1,true);
  }
};

const draw=time=>{
  if(document.hidden){
    animationFrame=0;
    return;
  }
  animationFrame=requestAnimationFrame(draw);
  const elapsed=time-lastFrame;
  if(elapsed<frameInterval)return;
  lastFrame=time-elapsed%frameInterval;
  if(pointerActive){
    pointerVelocityX*=.86;
    pointerVelocityY*=.86;
    pointerEnergy*=time-pointerLastMove>500?.94:.985;
    if(time-pointerLastMove>2200||pointerEnergy<.018)pointerActive=false;
  }
  drawFrame(time,Math.min(2,elapsed/16.67||1),true);
};

const stopAnimation=()=>{
  if(animationFrame)cancelAnimationFrame(animationFrame);
  animationFrame=0;
};

const startAnimation=()=>{
  if(reducedMotion){
    drawFrame(0,1,false);
    return;
  }
  if(animationFrame)return;
  lastFrame=performance.now();
  animationFrame=requestAnimationFrame(draw);
};

resize();
warmUp();
startAnimation();

addEventListener('pointermove',event=>{
  const nextX=event.clientX;
  const nextY=event.clientY;
  if(pointerActive){
    pointerVelocityX=pointerVelocityX*.55+(nextX-pointerX)*.45;
    pointerVelocityY=pointerVelocityY*.55+(nextY-pointerY)*.45;
  }else{
    pointerVelocityX=0;
    pointerVelocityY=0;
  }
  pointerX=nextX;
  pointerY=nextY;
  pointerEnergy=Math.min(1,.34+Math.hypot(pointerVelocityX,pointerVelocityY)*.045);
  pointerLastMove=performance.now();
  pointerActive=true;
},{passive:true});

addEventListener('blur',()=>{
  pointerActive=false;
  pointerEnergy=0;
});

addEventListener('resize',()=>{
  clearTimeout(resizeTimer);
  resizeTimer=setTimeout(()=>{
    resize();
    warmUp();
  },140);
});

document.addEventListener('visibilitychange',()=>{
  if(document.hidden)stopAnimation();
  else startAnimation();
});

addEventListener('pagehide',stopAnimation);
