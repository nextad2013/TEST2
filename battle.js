export const DIRS=[[0,-1],[1,0],[0,1],[-1,0]];
export const CONFIG={fuse:1.8,kickStep:.12,fire:.48,baseStep:16/60,biteCooldown:2,biteLifetime:.5,biteActive:.12,roundTime:60};
// Rendering follows the existing movement timer; collision and CPU keep grid positions.
export function visualPosition(a){
 if(!a.motion||a.wait<=0)return {x:a.x,y:a.y};
 const progress=Math.max(0,Math.min(1,1-a.wait/a.motion.duration));
 return {x:a.motion.x+(a.x-a.motion.x)*progress,y:a.motion.y+(a.y-a.motion.y)*progress};
}
export function bombVisualPosition(b){
 if(!b.slideFrom)return {x:b.x,y:b.y};const progress=Math.min(1,(b.slideAge||0)/CONFIG.kickStep);
 return {x:b.slideFrom.x+(b.x-b.slideFrom.x)*progress,y:b.slideFrom.y+(b.y-b.slideFrom.y)*progress};
}
export const POWER={SP:0,AT:1,RG:2};
export function speedMultiplier(a){return [1,1.2,1.4][a.level[POWER.SP]-1];}
export function attackCooldown(a){return a.team?[2,1,0][a.level[POWER.AT]-1]:.3;}
export function bombRange(level){return [2,5,Infinity][level-1];}
export class Battle{
 constructor(n=2,team=0,random=Math.random){this.n=n;this.team=team;this.random=random;this.w=16;this.h=16;this.time=CONFIG.roundTime;this.afterimages=[];this.bombs=[];this.fire=[];this.items=[];this.bites=[];this.actors=[];this.events=[];this.finished=false;this.endElapsed=0;this.result=null;this.escaped=false;this.map=Array.from({length:this.h},(_,y)=>Array.from({length:this.w},(_,x)=>x===0||y===0||x===this.w-1||y===this.h-1||(x%2===0&&y%2===0)?1:random()<.36?2:0));
 for(let t=0;t<2;t++)for(let i=0;i<n;i++){const x=t?this.w-2:1,y=1+i*2;this.actors.push({id:t*4+i,team:t,x,y,dir:t?3:1,alive:true,specialLeft:3,glow:0,shield:0,level:[1,1,1],wait:0,cool:0,ai:0,human:t===team&&i===0});for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(this.map[y+dy]?.[x+dx]===2)this.map[y+dy][x+dx]=0;}}
 // Fixed routes ensure no team is sealed off by random blocks.
 for(let x=1;x<this.w-1;x++)this.map[this.h-2][x]=0;
 for(let y=1;y<this.h-1;y++){this.map[y][1]=0;this.map[y][this.w-2]=0;}
 }
 defeat(a){if(!a.alive||a.shield>0)return false;a.death={...visualPosition(a),elapsed:0};a.alive=false;this.events.push('out');return true;}
 animateDeaths(dt){for(const a of this.actors)if(a.death)a.death.elapsed+=dt;}
 get resultReady(){return this.finished&&this.endElapsed>=2;}
 get player(){return this.actors.find(a=>a.human)}
 cells(b){const cells=[[b.x,b.y]];for(const [dx,dy]of DIRS){const len=Math.min(bombRange(b.level),dx?this.w:this.h);for(let i=1;i<=len;i++){const x=b.x+dx*i,y=b.y+dy*i,v=this.map[y]?.[x];if(v===undefined||v===1)break;cells.push([x,y]);if(v===2)break;}}return cells;}
 bombAt(x,y){return this.bombs.find(b=>b.x===x&&b.y===y)}
 move(a,d){if(!a.alive||a.shield>0||a.wait>0||this.finished)return false;a.dir=d;const [dx,dy]=DIRS[d],x=a.x+dx,y=a.y+dy;if(this.map[y]?.[x]!==0)return false;const bomb=this.bombAt(x,y);if(bomb&&!this.kickBomb(a,bomb,d))return false;a.motion={x:a.x,y:a.y,duration:CONFIG.baseStep/speedMultiplier(a)};a.x=x;a.y=y;a.wait=a.motion.duration;this.pickup(a);this.consumeContacts();return true;}
 canRollTo(b,x,y,bombs=this.bombs){return this.map[y]?.[x]===0&&!bombs.some(other=>other!==b&&other.x===x&&other.y===y)&&!this.actors.some(a=>a.alive&&a.x===x&&a.y===y);}
 shiftBomb(b,x,y){b.slideFrom={x:b.x,y:b.y};b.slideAge=0;b.x=x;b.y=y;}
 kickBomb(a,b,d){
  if(a.team!==0||!a.alive||this.finished)return false;const[dx,dy]=DIRS[d],x=b.x+dx,y=b.y+dy;
  if(!this.canRollTo(b,x,y))return false;
  this.shiftBomb(b,x,y);b.rollDir=d;b.rollTimer=CONFIG.kickStep;this.events.push('kick');return true;
 }
 projectBomb(b,bombs=this.bombs){
  const p={...b},path=[{x:b.x,y:b.y}];if(b.rollDir===undefined||b.rollDir===null)return {...p,path};
  const[dx,dy]=DIRS[b.rollDir];let time=Math.max(0,b.rollTimer??CONFIG.kickStep);
  while(time<b.t-1e-8&&path.length<this.w+this.h){const x=p.x+dx,y=p.y+dy;if(!this.canRollTo(b,x,y,bombs))break;p.x=x;p.y=y;path.push({x,y});time+=CONFIG.kickStep;}
  return {...p,path};
 }
 advanceBombs(dt){
  let remaining=dt;
  // Advance to the next roll or detonation event, keeping fuse timing unchanged by kicks.
  while(remaining>1e-8&&this.bombs.length){
   const next=Math.min(remaining,...this.bombs.map(b=>Math.max(0,b.t)),...this.bombs.filter(b=>b.rollDir!==undefined&&b.rollDir!==null).map(b=>Math.max(0,b.rollTimer)));
   for(const b of this.bombs){b.t-=next;b.slideAge=(b.slideAge||0)+next;if(b.rollDir!==undefined&&b.rollDir!==null)b.rollTimer-=next;}
   remaining-=next;
   for(const b of [...this.bombs]){
    if(b.t>1e-8&&b.rollDir!==undefined&&b.rollDir!==null&&b.rollTimer<=1e-8){const[dx,dy]=DIRS[b.rollDir],x=b.x+dx,y=b.y+dy;if(this.canRollTo(b,x,y)){this.shiftBomb(b,x,y);b.rollTimer=CONFIG.kickStep;}else{b.rollDir=null;b.rollTimer=0;}}
    if(b.t<=1e-8||this.fire.some(f=>f.t>dt-remaining+1e-8&&f.cells.some(([x,y])=>x===b.x&&y===b.y))){const fireStart=this.fire.length;this.explode(b);for(let i=fireStart;i<this.fire.length;i++)this.fire[i].t+=dt-remaining;}
   }
  }
 }
 dashPath(a){const[dx,dy]=DIRS[a.dir],path=[];for(let step=1;step<=2;step++){const x=a.x+dx*step,y=a.y+dy*step;if(this.map[y]?.[x]===undefined||this.map[y][x]===1)break;path.push({x,y});}return path;}
 special(a){
  if(!a.alive||this.finished||a.specialLeft<=0||a.shield>0)return false;
  if(a.team===1){
   a.specialLeft--;a.glow=1.5;a.shield=1.5;a.motion=null;a.wait=0;
   this.bites=this.bites.filter(b=>b.actor!==a.id||b.contact);this.events.push('shield');return true;
  }
  const path=this.dashPath(a);if(!path.length)return false;
  a.specialLeft--;a.glow=.3;a.wait=0;a.motion=null;
  for(const cell of path){
   this.afterimages.push({actor:{...a,motion:null,wait:0},t:.3});
   if(this.map[cell.y][cell.x]===2)this.breakBlock(cell.x,cell.y);
   a.x=cell.x;a.y=cell.y;this.pickup(a);this.consumeContacts();if(!a.alive)break;
  }
  this.events.push('dash');return true;
 }
 animateSpecials(dt){
  for(const a of this.actors){a.glow=Math.max(0,a.glow-dt);a.shield=Math.max(0,a.shield-dt);}
  for(const ghost of this.afterimages)ghost.t-=dt;this.afterimages=this.afterimages.filter(ghost=>ghost.t>0);
 }
 pickup(a){const item=this.items.find(i=>i.x===a.x&&i.y===a.y);if(item){const ability=item.kind;a.level[ability]=Math.min(3,a.level[ability]+1);this.items.splice(this.items.indexOf(item),1);this.events.push('pickup');}}
 attack(a){if(!a.alive||a.shield>0||a.cool>0||this.finished)return false;if(!a.team){if(this.bombAt(a.x,a.y)||this.bombs.filter(b=>b.owner===a.id).length>=a.level[1])return false;this.bombs.push({x:a.x,y:a.y,t:CONFIG.fuse,level:a.level[POWER.RG],owner:a.id,team:0});a.cool=.3;this.events.push('place');return true;}
 if(this.bites.some(b=>b.actor===a.id&&!b.done))return false;this.bites=this.bites.filter(b=>b.actor!==a.id||b.contact);this.bites.push({x:a.x,y:a.y,dir:a.dir,reach:a.level[POWER.RG]-1,t:.16+.08*(a.level[POWER.RG]-1),visible:CONFIG.biteLifetime,active:CONFIG.biteActive,actor:a.id,done:false});a.cool=attackCooldown(a);this.events.push('bite');return true;}
 consumeContacts(){
  for(const a of this.actors){if(!a.alive||a.team!==1)continue;
   const enemies=this.actors.filter(e=>e.alive&&e.team===0&&e.x===a.x&&e.y===a.y);if(!enemies.length)continue;
   for(const enemy of enemies)this.defeat(enemy);
   // Contact always eats, including during the manual attack cooldown.
   // The visual reuses the normal bite icon without granting extra ranged damage.
   this.bites=this.bites.filter(b=>!(b.contact&&b.actor===a.id));
   this.bites.push({x:a.x,y:a.y,dir:a.dir,reach:0,t:0,visible:CONFIG.biteLifetime,active:0,actor:a.id,done:true,contact:true});
   a.cool=Math.max(a.cool,attackCooldown(a));this.events.push('bite');
  }
 }
 biteCells(b){if(b.contact)return [[b.x,b.y]];const a=this.actors.find(a=>a.id===b.actor);if(!a?.alive)return [];const cells=[[a.x,a.y]];const[dx,dy]=DIRS[b.dir];for(let i=1;i<=b.reach;i++){const x=a.x+dx*i,y=a.y+dy*i,v=this.map[y]?.[x];if(v===undefined||v===1||this.bombAt(x,y))break;cells.push([x,y]);if(v===2)break;}return cells;}
 resolveBite(b){const a=this.actors.find(a=>a.id===b.actor);if(!a?.alive)return;if(b.reach===0&&!b.chewed){const[dx,dy]=DIRS[b.dir],x=a.x+dx,y=a.y+dy;if(this.map[y]?.[x]===2){const k=x+','+y;this.chew??={};this.chew[k]=(this.chew[k]||0)+1;if(this.chew[k]>=2)this.breakBlock(x,y);b.chewed=true;}}for(const[x,y]of this.biteCells(b)){if(this.map[y][x]===2){if(!b.chewed){const k=x+','+y;this.chew??={};this.chew[k]=(this.chew[k]||0)+1;if(this.chew[k]>=2)this.breakBlock(x,y);b.chewed=true;}break;}const enemies=this.actors.filter(e=>e.alive&&e.team!==a.team&&e.x===x&&e.y===y);if(enemies.length){for(const enemy of enemies)this.defeat(enemy);b.done=true;break;}}}
 breakBlock(x,y){this.map[y][x]=0;if(this.random()<.72)this.items.push({x,y,kind:Math.min(2,Math.floor(this.random()*3))});}
 explode(b){if(!this.bombs.includes(b))return;const cells=this.cells(b);this.bombs.splice(this.bombs.indexOf(b),1);this.fire.push({cells,t:CONFIG.fire,team:b.team});this.events.push('boom');for(const[x,y]of cells){if(this.map[y][x]===2)this.breakBlock(x,y);const other=this.bombAt(x,y);if(other)this.explode(other);}}
 stepTime(a){return CONFIG.baseStep/speedMultiplier(a)+.035;}
 hazards(a,bombs=this.bombs){
  const hazards=new Map(),add=(x,y,start,end)=>{const k=x+','+y;if(!hazards.has(k))hazards.set(k,[]);hazards.get(k).push([start,end]);};
  const projected=bombs.map(b=>this.projectBomb(b,bombs)),times=bombs.map(b=>Math.max(0,b.t)),cells=projected.map(b=>this.cells(b));
  // Propagate earliest detonation through every chain, regardless of ownership.
  for(let pass=0;pass<bombs.length;pass++){let changed=false;for(let i=0;i<bombs.length;i++)for(let j=0;j<bombs.length;j++)if(times[j]>times[i]&&cells[i].some(([x,y])=>x===projected[j].x&&y===projected[j].y)){times[j]=times[i];changed=true;}if(!changed)break;}
  cells.forEach((list,i)=>{
   const predictedCells=new Map(list.map(([x,y])=>[x+','+y,[x,y]]));
   // A kicked bomb may be stopped by a moving character or induced early along its route.
   if(projected[i].path.length>1)for(const position of projected[i].path)for(const[x,y]of this.cells({...bombs[i],...position}))predictedCells.set(x+','+y,[x,y]);
   for(const[x,y]of predictedCells.values())add(x,y,Math.max(0,times[i]-.09),times[i]+CONFIG.fire+.1);
  });
  for(const f of this.fire)for(const[x,y]of f.cells)add(x,y,0,f.t+.1);
  if(a.team===0)for(const bite of this.bites)if(!bite.done){for(const[x,y]of this.biteCells(bite))add(x,y,Math.max(0,bite.t-.08),Math.max(0,bite.t)+bite.active+.1);}
  return hazards;
 }
 safeAt(hazards,x,y,start,end){return !(hazards.get(x+','+y)||[]).some(([lo,hi])=>start<=hi&&end>=lo);}
 escape(a,bombs=this.bombs,hazards=this.hazards(a,bombs),initialDelay=0){
  if(!this.safeAt(hazards,a.x,a.y,0,initialDelay))return null;
  const step=this.stepTime(a),queue=[{x:a.x,y:a.y,d:0,first:-1}],seen=new Set([a.x+','+a.y]);
  for(let i=0;i<queue.length;i++){const p=queue[i],time=p.d*step+initialDelay;
   if(this.safeAt(hazards,p.x,p.y,time,6))return p;
   for(let d=0;d<4;d++){const[dx,dy]=DIRS[d],x=p.x+dx,y=p.y+dy,key=x+','+y;if(seen.has(key)||this.map[y]?.[x]!==0||bombs.some(b=>b.x===x&&b.y===y))continue;
    if(!this.safeAt(hazards,p.x,p.y,Math.max(0,time-step*.3),time+step*.4)||!this.safeAt(hazards,x,y,time+step*.4,time+step*1.5))continue;
    seen.add(key);queue.push({x,y,d:p.d+1,first:p.first<0?d:p.first});
   }
  }
  return null;
 }
 kickAttackPlan(a,b,d,bombs=this.bombs){
  const[dx,dy]=DIRS[d],x=b.x+dx,y=b.y+dy,step=this.stepTime(a);
  if(b.t<step+.15||!this.canRollTo(b,x,y,bombs))return null;
  const kicked={...b,x,y,rollDir:d,rollTimer:CONFIG.kickStep},planned=bombs.map(other=>other===b?kicked:other),projected=this.projectBomb(kicked,planned),blast=this.cells(projected);
  const targets=this.actors.filter(e=>e.alive&&e.team!==a.team&&e.shield<b.t&&blast.some(([px,py])=>px===e.x&&py===e.y));if(!targets.length)return null;
  const afterKick={...a,x:b.x,y:b.y},hazards=this.hazards(afterKick,planned);
  if(!this.escape(afterKick,planned,hazards,step))return null;
  const allies=this.actors.filter(e=>e.alive&&e.team===a.team&&e.id!==a.id);
  if(!allies.every(ally=>this.escape(ally,planned,this.hazards(ally,planned),ally.wait)))return null;
  return {direction:d,score:targets.length*10-projected.path.length*.05};
 }
 tryKickAttack(a){
  let best=null;for(let d=0;d<4;d++){const[dx,dy]=DIRS[d],b=this.bombAt(a.x+dx,a.y+dy);if(!b)continue;const plan=this.kickAttackPlan(a,b,d);if(plan&&(!best||plan.score>best.score))best=plan;}
  return best?this.move(a,best.direction):false;
 }
 trySetupKick(a){
  if(a.cool>0||this.bombAt(a.x,a.y)||this.bombs.filter(b=>b.owner===a.id).length>=a.level[POWER.AT])return false;
  let best=null;
  for(let d=0;d<4;d++){
   const[dx,dy]=DIRS[d],stand={...a,x:a.x-dx,y:a.y-dy};
   if(this.map[stand.y]?.[stand.x]!==0||this.bombAt(stand.x,stand.y)||this.actors.some(e=>e.alive&&e.id!==a.id&&e.x===stand.x&&e.y===stand.y))continue;
   const b={x:a.x,y:a.y,t:CONFIG.fuse-this.stepTime(a),level:a.level[POWER.RG],owner:a.id,team:0},bombs=[...this.bombs,b],plan=this.kickAttackPlan(stand,b,d,bombs);
   if(!plan||!this.safeAt(this.hazards(a,bombs),stand.x,stand.y,0,this.stepTime(a)+.1))continue;
   if(!best||plan.score>best.score)best=plan;
  }
  if(!best)return false;
  if(!this.attack(a))return false;
  return this.move(a,(best.direction+2)%4);
 }
 cpu(a){
  if(a.wait>0||!a.alive||a.shield>0)return;if(a.team===0&&this.tryKickAttack(a))return;const hazards=this.hazards(a),step=this.stepTime(a);
  if(!this.safeAt(hazards,a.x,a.y,0,6)){
   if(a.specialLeft>0){
    if(a.team===0){const oldDir=a.dir;for(let d=0;d<4;d++){a.dir=d;const path=this.dashPath(a),last=path.at(-1);if(last&&this.safeAt(hazards,last.x,last.y,0,6)&&path.every(p=>!this.actors.some(e=>e.alive&&e.team!==a.team&&e.x===p.x&&e.y===p.y))){this.special(a);return;}}a.dir=oldDir;}
    else if(!this.safeAt(hazards,a.x,a.y,0,.4)&&!this.escape(a,this.bombs,hazards)){this.special(a);return;}
   }
   const exit=this.escape(a,this.bombs,hazards);if(exit?.first>=0){this.move(a,exit.first);return;}
   // If trapped, choose the available step with the latest incoming blast.
   let best=-1,latest=-1;for(let d=0;d<4;d++){const[dx,dy]=DIRS[d],x=a.x+dx,y=a.y+dy;if(this.map[y]?.[x]!==0||this.bombAt(x,y)||!this.safeAt(hazards,x,y,step*.4,step*1.5))continue;const hit=Math.min(9,...(hazards.get(x+','+y)||[]).map(([t])=>t));if(hit>latest){latest=hit;best=d;}}
   if(best>=0)this.move(a,best);return;
  }
  const enemies=this.actors.filter(e=>e.alive&&e.team!==a.team);if(!enemies.length)return;
  const distance=e=>Math.abs(e.x-a.x)+Math.abs(e.y-a.y),target=enemies.reduce((b,e)=>distance(e)<distance(b)?e:b);
  if(a.team===1&&a.cool<=0){for(let dir=0;dir<4;dir++){const bite={actor:a.id,dir,reach:a.level[POWER.RG]-1};if(this.biteCells(bite).some(([x,y])=>enemies.some(e=>e.x===x&&e.y===y))){a.dir=dir;this.attack(a);return;}}}
  if(a.team===0&&this.trySetupKick(a))return;
  if(a.team===0&&a.cool<=0&&!this.bombAt(a.x,a.y)&&this.bombs.filter(b=>b.owner===a.id).length<a.level[1]){
   const bomb={x:a.x,y:a.y,t:CONFIG.fuse,level:a.level[POWER.RG],owner:a.id,team:0},blast=this.cells(bomb);
   const useful=blast.some(([x,y])=>this.map[y][x]===2||enemies.some(e=>e.x===x&&e.y===y));
   if(useful){const bombs=[...this.bombs,bomb],escape=this.escape(a,bombs);const allies=this.actors.filter(e=>e.alive&&e.team===0&&e.id!==a.id);
    if(escape?.first>=0&&allies.every(e=>this.escape(e,bombs))){this.attack(a);this.move(a,escape.first);return;}
   }
  }
  let goal=target;for(const item of this.items)if(a.level[item.kind]<3&&distance(item)<distance(goal)+2)goal=item;
  const queue=[{x:a.x,y:a.y,d:0,first:-1}],seen=new Set([a.x+','+a.y]);let best=null,bestScore=Infinity;
  for(let i=0;i<queue.length;i++){const p=queue[i];for(let d=0;d<4;d++){const[dx,dy]=DIRS[d],x=p.x+dx,y=p.y+dy,key=x+','+y,v=this.map[y]?.[x];if(v===undefined||v===1||seen.has(key))continue;const blockingBomb=this.bombAt(x,y);if(blockingBomb&&(a.team!==0||p.d>0||!this.canRollTo(blockingBomb,x+dx,y+dy)))continue;seen.add(key);const first=p.first<0?d:p.first,time=(p.d+1)*step;if(!this.safeAt(hazards,x,y,Math.max(0,time-step),time+step*2))continue;
    const closeRisk=a.team===0?enemies.filter(e=>Math.abs(e.x-x)+Math.abs(e.y-y)<=1&&e.cool<.25).length*5:0;
    const score=Math.abs(goal.x-x)+Math.abs(goal.y-y)+(p.d+1)*.14+closeRisk+(v===2?2:0);
    if(score<bestScore){bestScore=score;best={x,y,first};}if(v===0)queue.push({x,y,d:p.d+1,first});
   }}
  if(best){const[dx,dy]=DIRS[best.first];if(a.team&&this.map[a.y+dy]?.[a.x+dx]===2){a.dir=best.first;this.attack(a);}else this.move(a,best.first);}
 }
 update(dt,input={}){this.animateDeaths(dt);this.animateSpecials(dt);if(this.finished){this.endElapsed+=dt;for(const b of this.bites)b.visible-=dt;this.bites=this.bites.filter(b=>b.visible>0);for(const f of this.fire)f.t-=dt;this.fire=this.fire.filter(f=>f.t>0);return;}const specialPressed=!!input.special&&!this.specialHeld;this.specialHeld=!!input.special;const attackPressed=!!input.attack&&!this.attackHeld;this.attackHeld=!!input.attack;this.time=Math.max(0,this.time-dt);if(this.time<=0){this.finished=true;this.result=0;this.escaped=true;return;}this.consumeContacts();for(const a of this.actors){a.wait=Math.max(0,a.wait-dt);a.cool=Math.max(0,a.cool-dt);if(!a.alive)continue;if(a.human){let usedSpecial=false;if(specialPressed){if(input.dir!==undefined&&a.shield<=0)a.dir=input.dir;usedSpecial=this.special(a);}if(!usedSpecial&&input.dir!==undefined)this.move(a,input.dir);if(a.team?(a.level[POWER.AT]===3?input.attack:attackPressed):input.attack)this.attack(a);}else{a.ai-=dt;if(a.ai<=0){this.cpu(a);a.ai=.035+this.random()*.025;}}}
 this.advanceBombs(dt);for(const b of this.bites){const previousWindup=b.t;b.t-=dt;b.visible-=dt;if(b.t<=0&&!b.done&&b.visible>0){this.resolveBite(b);b.active-=Math.max(0,dt-Math.max(0,previousWindup));if(b.active<=0)b.done=true;}}this.bites=this.bites.filter(b=>b.visible>0);
 for(const f of this.fire){for(const a of this.actors)if(a.alive&&f.cells.some(([x,y])=>a.x===x&&a.y===y)){this.defeat(a);}f.t-=dt;}this.fire=this.fire.filter(f=>f.t>0);
 const counts=[0,1].map(t=>this.actors.filter(a=>a.alive&&a.team===t).length);if(counts.includes(0)){this.finished=true;this.result=counts[0]===counts[1]?-1:counts[0]>counts[1]?0:1;}}
}
