const root=document.documentElement;
const finePointer=matchMedia('(pointer:fine)').matches;
const reducedMotion=matchMedia('(prefers-reduced-motion:reduce)').matches;
let pointerX=innerWidth*.74,pointerY=innerHeight*.52,pointerActive=false;

if(finePointer){
  const ring=document.querySelector('.cursor-ring');
  const dot=document.querySelector('.cursor-dot');
  let ringX=pointerX,ringY=pointerY;
  addEventListener('pointermove',event=>{
    pointerX=event.clientX;
    pointerY=event.clientY;
    pointerActive=true;
    root.style.setProperty('--mx',String(pointerX/innerWidth-.5));
    root.style.setProperty('--my',String(pointerY/innerHeight-.5));
    dot.style.transform=`translate(${pointerX}px,${pointerY}px) translate(-50%,-50%)`;
  });
  addEventListener('pointerleave',()=>{pointerActive=false});
  const updateCursor=()=>{
    ringX+=(pointerX-ringX)*.14;
    ringY+=(pointerY-ringY)*.14;
    ring.style.transform=`translate(${ringX}px,${ringY}px) translate(-50%,-50%)`;
    requestAnimationFrame(updateCursor);
  };
  updateCursor();
}

const canvas=document.querySelector('#field-canvas');
const context=canvas.getContext('2d',{alpha:false});
let width=0,height=0,dpr=1,particles=[],lastTime=0;

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
  const count=reducedMotion?220:(width<800?520:1100);
  particles=Array.from({length:count},()=>{
    const particle={};
    resetParticle(particle,true);
    return particle;
  });
};

const resize=()=>{
  dpr=Math.min(devicePixelRatio||1,1.7);
  width=innerWidth;
  height=innerHeight;
  canvas.width=Math.round(width*dpr);
  canvas.height=Math.round(height*dpr);
  canvas.style.width=`${width}px`;
  canvas.style.height=`${height}px`;
  context.setTransform(dpr,0,0,dpr,0,0);
  context.fillStyle='#030105';
  context.fillRect(0,0,width,height);
  buildParticles();
};

const drawBackdrop=time=>{
  const mobile=width<800;
  const pulse=.5+.5*Math.sin(time*.00035);
  const gradient=context.createRadialGradient(width*(mobile?.58:.76),height*(mobile?.38:.6),0,width*(mobile?.58:.76),height*(mobile?.38:.6),Math.max(width,height)*.7);
  gradient.addColorStop(0,`rgba(70,29,124,${.035+pulse*.018})`);
  gradient.addColorStop(.42,'rgba(15,5,24,.025)');
  gradient.addColorStop(1,'rgba(3,1,5,.085)');
  context.globalCompositeOperation='source-over';
  context.fillStyle='rgba(3,1,5,.032)';
  context.fillRect(0,0,width,height);
  context.fillStyle=gradient;
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

  if(pointerActive){
    const pdx=particle.x-pointerX;
    const pdy=particle.y-pointerY;
    const pointerDistance=Math.max(1,Math.hypot(pdx,pdy));
    if(pointerDistance<260){
      const influence=(1-pointerDistance/260)*.85;
      const pointerTangent=Math.atan2(pdy,pdx)+Math.PI/2;
      angle=angle*(1-influence)+pointerTangent*influence;
      acceleration+=influence*.09;
    }
  }

  particle.vx=particle.vx*.965+Math.cos(angle)*acceleration*dt;
  particle.vy=particle.vy*.965+Math.sin(angle)*acceleration*dt;
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
  if(particle.width>1.25){
    context.save();
    context.lineWidth=particle.width*3.5;
    context.strokeStyle=particle.gold?`rgba(253,208,35,${particle.alpha*fade*.12})`:`rgba(143,57,255,${particle.alpha*fade*.1})`;
    context.stroke();
    context.restore();
  }
  context.stroke();
  if(particle.gold&&particle.width>1.05&&Math.random()<.025){
    context.beginPath();
    context.fillStyle=`rgba(255,245,194,${.65*fade})`;
    context.arc(particle.x,particle.y,1.6,0,Math.PI*2);
    context.fill();
  }
};

const draw=time=>{
  const dt=Math.min(2,(time-lastTime)/16.67||1);
  lastTime=time;
  drawBackdrop(time);
  context.globalCompositeOperation='lighter';
  for(const particle of particles){
    if(!reducedMotion)updateParticle(particle,time,dt);
    drawParticle(particle);
  }
  if(!reducedMotion)requestAnimationFrame(draw);
};

const warmUp=()=>{
  if(reducedMotion)return;
  for(let step=0;step<150;step++){
    const time=step*16.67;
    drawBackdrop(time);
    context.globalCompositeOperation='lighter';
    for(const particle of particles){
      updateParticle(particle,time,1);
      drawParticle(particle);
    }
  }
};

resize();
warmUp();
addEventListener('resize',()=>{resize();warmUp()});
requestAnimationFrame(draw);
