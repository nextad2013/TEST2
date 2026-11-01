export const DIRS=[[0,-1],[1,0],[0,1],[-1,0]];
export const CONFIG={fuse:2,fire:.48,baseStep:16/60,biteCooldown:.9,biteLifetime:.5,biteActive:.12,roundTime:120};
// Rendering follows the existing movement timer; collision and CPU keep grid positions.
export function visualPosition(a){
 if(!a.motion||a.wait<=0)return {x:a.x,y:a.y};
 const progress=Math.max(0,Math.min(1,1-a.wait/a.motion.duration));
 return {x:a.motion.x+(a.x-a.motion.x)*progress,y:a.motion.y+(a.y-a.motion.y)*progress};
}
export function speedMultiplier(a){return a.team?[1,1.5,2][a.level[0]-1]:[1,1.3,1.6][a.level[1]-1];}
export class Battle{
 constructor(n=2,team=0,random=Math.random){this.n=n;this.team=team;this.random=random;this.w=16;this.h=16;this.time=120;this.bombs=[];this.fire=[];this.items=[];this.bites=[];this.actors=[];this.events=[];this.finished=false;this.result=null;this.map=Array.from({length:this.h},(_,y)=>Array.from({length:this.w},(_,x)=>x===0||y===0||x===this.w-1||y===this.h-1||(x%2===0&&y%2===0)?1:random()<.36?2:0));
 for(let t=0;t<2;t++)for(let i=0;i<n;i++){const x=t?this.w-2:1,y=1+i*2;this.actors.push({id:t*4+i,team:t,x,y,dir:t?3:1,alive:true,level:[1,1],wait:0,cool:0,ai:0,human:t===team&&i===0});for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(this.map[y+dy]?.[x+dx]===2)this.map[y+dy][x+dx]=0;}}
 // Fixed routes ensure no team is sealed off by random blocks.
 for(let x=1;x<this.w-1;x++)this.map[this.h-2][x]=0;
 for(let y=1;y<this.h-1;y++){this.map[y][1]=0;this.map[y][this.w-2]=0;}
 }
 get player(){return this.actors.find(a=>a.human)}
 cells(b){const cells=[[b.x,b.y]];for(const [dx,dy]of DIRS){const len=Math.max(1,Math.floor(((dx?this.w:this.h)*b.level/3-1)/2));for(let i=1;i<=len;i++){const x=b.x+dx*i,y=b.y+dy*i,v=this.map[y]?.[x];if(v===undefined||v===1)break;cells.push([x,y]);if(v===2)break;}}return cells;}
 bombAt(x,y){return this.bombs.find(b=>b.x===x&&b.y===y)}
 move(a,d){if(!a.alive||a.wait>0||this.finished)return false;a.dir=d;const [dx,dy]=DIRS[d],x=a.x+dx,y=a.y+dy;if(this.map[y]?.[x]!==0||this.bombAt(x,y))return false;a.motion={x:a.x,y:a.y,duration:CONFIG.baseStep/speedMultiplier(a)};a.x=x;a.y=y;a.wait=a.motion.duration;this.pickup(a);return true;}
 pickup(a){const item=this.items.find(i=>i.x===a.x&&i.y===a.y);if(item){const ability=a.team?1-item.kind:item.kind;a.level[ability]=Math.min(3,a.level[ability]+1);this.items.splice(this.items.indexOf(item),1);this.events.push('pickup');}}
 attack(a){if(!a.alive||a.cool>0||this.finished)return false;if(!a.team){if(this.bombAt(a.x,a.y)||this.bombs.filter(b=>b.owner===a.id).length>=a.level[1])return false;this.bombs.push({x:a.x,y:a.y,t:2,level:a.level[0],owner:a.id,team:0});a.cool=.3;this.events.push('place');return true;}
 this.bites.push({x:a.x,y:a.y,dir:a.dir,reach:a.level[1]-1,t:.16+.08*(a.level[1]-1),visible:CONFIG.biteLifetime,active:CONFIG.biteActive,actor:a.id,done:false});a.cool=CONFIG.biteCooldown+.08*(a.level[1]-1);this.events.push('bite');return true;}
 biteCells(b){const a=this.actors.find(a=>a.id===b.actor);if(!a?.alive)return [];const cells=[[a.x,a.y]];const[dx,dy]=DIRS[b.dir];for(let i=1;i<=b.reach;i++){const x=a.x+dx*i,y=a.y+dy*i,v=this.map[y]?.[x];if(v===undefined||v===1||this.bombAt(x,y))break;cells.push([x,y]);if(v===2)break;}return cells;}
 resolveBite(b){const a=this.actors.find(a=>a.id===b.actor);if(!a?.alive)return;if(b.reach===0&&!b.chewed){const[dx,dy]=DIRS[b.dir],x=a.x+dx,y=a.y+dy;if(this.map[y]?.[x]===2){const k=x+','+y;this.chew??={};this.chew[k]=(this.chew[k]||0)+1;if(this.chew[k]>=2)this.breakBlock(x,y);b.chewed=true;}}for(const[x,y]of this.biteCells(b)){if(this.map[y][x]===2){if(!b.chewed){const k=x+','+y;this.chew??={};this.chew[k]=(this.chew[k]||0)+1;if(this.chew[k]>=2)this.breakBlock(x,y);b.chewed=true;}break;}const enemies=this.actors.filter(e=>e.alive&&e.team!==a.team&&e.x===x&&e.y===y);if(enemies.length){for(const enemy of enemies)enemy.alive=false;this.events.push('out');b.done=true;break;}}}
 breakBlock(x,y){this.map[y][x]=0;if(this.random()<.72)this.items.push({x,y,kind:this.random()<.5?0:1});}
 explode(b){if(!this.bombs.includes(b))return;const cells=this.cells(b);this.bombs.splice(this.bombs.indexOf(b),1);this.fire.push({cells,t:CONFIG.fire,team:b.team});this.events.push('boom');for(const[x,y]of cells){if(this.map[y][x]===2)this.breakBlock(x,y);const other=this.bombAt(x,y);if(other)this.explode(other);}}
 stepTime(a){return CONFIG.baseStep/speedMultiplier(a)+.035;}
 hazards(a,bombs=this.bombs){
  const hazards=new Map(),add=(x,y,start,end)=>{const k=x+','+y;if(!hazards.has(k))hazards.set(k,[]);hazards.get(k).push([start,end]);};
  const times=bombs.map(b=>Math.max(0,b.t)),cells=bombs.map(b=>this.cells(b));
  // Propagate earliest detonation through every chain, regardless of ownership.
  for(let pass=0;pass<bombs.length;pass++){let changed=false;for(let i=0;i<bombs.length;i++)for(let j=0;j<bombs.length;j++)if(times[j]>times[i]&&cells[i].some(([x,y])=>x===bombs[j].x&&y===bombs[j].y)){times[j]=times[i];changed=true;}if(!changed)break;}
  cells.forEach((list,i)=>list.forEach(([x,y])=>add(x,y,Math.max(0,times[i]-.09),times[i]+CONFIG.fire+.1)));
  for(const f of this.fire)for(const[x,y]of f.cells)add(x,y,0,f.t+.1);
  if(a.team===0)for(const bite of this.bites)if(!bite.done){for(const[x,y]of this.biteCells(bite))add(x,y,Math.max(0,bite.t-.08),Math.max(0,bite.t)+bite.active+.1);}
  return hazards;
 }
 safeAt(hazards,x,y,start,end){return !(hazards.get(x+','+y)||[]).some(([lo,hi])=>start<=hi&&end>=lo);}
 escape(a,bombs=this.bombs,hazards=this.hazards(a,bombs)){
  const step=this.stepTime(a),queue=[{x:a.x,y:a.y,d:0,first:-1}],seen=new Set([a.x+','+a.y]);
  for(let i=0;i<queue.length;i++){const p=queue[i],time=p.d*step;
   if(this.safeAt(hazards,p.x,p.y,time,6))return p;
   for(let d=0;d<4;d++){const[dx,dy]=DIRS[d],x=p.x+dx,y=p.y+dy,key=x+','+y;if(seen.has(key)||this.map[y]?.[x]!==0||bombs.some(b=>b.x===x&&b.y===y))continue;
    if(!this.safeAt(hazards,p.x,p.y,Math.max(0,time-step*.3),time+step*.4)||!this.safeAt(hazards,x,y,time+step*.4,time+step*1.5))continue;
    seen.add(key);queue.push({x,y,d:p.d+1,first:p.first<0?d:p.first});
   }
  }
  return null;
 }
 cpu(a){
  if(a.wait>0||!a.alive)return;const hazards=this.hazards(a),step=this.stepTime(a);
  if(!this.safeAt(hazards,a.x,a.y,0,6)){
   const exit=this.escape(a,this.bombs,hazards);if(exit?.first>=0){this.move(a,exit.first);return;}
   // If trapped, choose the available step with the latest incoming blast.
   let best=-1,latest=-1;for(let d=0;d<4;d++){const[dx,dy]=DIRS[d],x=a.x+dx,y=a.y+dy;if(this.map[y]?.[x]!==0||this.bombAt(x,y)||!this.safeAt(hazards,x,y,step*.4,step*1.5))continue;const hit=Math.min(9,...(hazards.get(x+','+y)||[]).map(([t])=>t));if(hit>latest){latest=hit;best=d;}}
   if(best>=0)this.move(a,best);return;
  }
  const enemies=this.actors.filter(e=>e.alive&&e.team!==a.team);if(!enemies.length)return;
  const distance=e=>Math.abs(e.x-a.x)+Math.abs(e.y-a.y),target=enemies.reduce((b,e)=>distance(e)<distance(b)?e:b);
  if(a.team===1&&a.cool<=0){for(let dir=0;dir<4;dir++){const bite={actor:a.id,dir,reach:a.level[1]-1};if(this.biteCells(bite).some(([x,y])=>enemies.some(e=>e.x===x&&e.y===y))){a.dir=dir;this.attack(a);return;}}}
  if(a.team===0&&a.cool<=0&&!this.bombAt(a.x,a.y)&&this.bombs.filter(b=>b.owner===a.id).length<a.level[1]){
   const bomb={x:a.x,y:a.y,t:CONFIG.fuse,level:a.level[0],owner:a.id,team:0},blast=this.cells(bomb);
   const useful=blast.some(([x,y])=>this.map[y][x]===2||enemies.some(e=>e.x===x&&e.y===y));
   if(useful){const bombs=[...this.bombs,bomb],escape=this.escape(a,bombs);const allies=this.actors.filter(e=>e.alive&&e.team===0&&e.id!==a.id);
    if(escape?.first>=0&&allies.every(e=>this.escape(e,bombs))){this.attack(a);this.move(a,escape.first);return;}
   }
  }
  let goal=target;for(const item of this.items)if(a.level[a.team?1-item.kind:item.kind]<3&&distance(item)<distance(goal)+2)goal=item;
  const queue=[{x:a.x,y:a.y,d:0,first:-1}],seen=new Set([a.x+','+a.y]);let best=null,bestScore=Infinity;
  for(let i=0;i<queue.length;i++){const p=queue[i];for(let d=0;d<4;d++){const[dx,dy]=DIRS[d],x=p.x+dx,y=p.y+dy,key=x+','+y,v=this.map[y]?.[x];if(v===undefined||v===1||seen.has(key)||this.bombAt(x,y))continue;seen.add(key);const first=p.first<0?d:p.first,time=(p.d+1)*step;if(!this.safeAt(hazards,x,y,Math.max(0,time-step),time+step*2))continue;
    const closeRisk=a.team===0?enemies.filter(e=>Math.abs(e.x-x)+Math.abs(e.y-y)<=1&&e.cool<.25).length*5:0;
    const score=Math.abs(goal.x-x)+Math.abs(goal.y-y)+(p.d+1)*.14+closeRisk+(v===2?2:0);
    if(score<bestScore){bestScore=score;best={x,y,first};}if(v===0)queue.push({x,y,d:p.d+1,first});
   }}
  if(best){const[dx,dy]=DIRS[best.first];if(a.team&&this.map[a.y+dy]?.[a.x+dx]===2){a.dir=best.first;this.attack(a);}else this.move(a,best.first);}
 }
 update(dt,input={}){if(this.finished)return;const attackPressed=!!input.attack&&!this.attackHeld;this.attackHeld=!!input.attack;this.time=Math.max(0,this.time-dt);for(const a of this.actors){a.wait=Math.max(0,a.wait-dt);a.cool=Math.max(0,a.cool-dt);if(!a.alive)continue;if(a.human){if(input.dir!==undefined)this.move(a,input.dir);if(a.team?attackPressed:input.attack)this.attack(a);}else{a.ai-=dt;if(a.ai<=0){this.cpu(a);a.ai=.035+this.random()*.025;}}}
 for(const b of [...this.bombs]){b.t-=dt;if(b.t<=0)this.explode(b);}for(const b of this.bites){const previousWindup=b.t;b.t-=dt;b.visible-=dt;if(b.t<=0&&!b.done&&b.visible>0){this.resolveBite(b);b.active-=Math.max(0,dt-Math.max(0,previousWindup));if(b.active<=0)b.done=true;}}this.bites=this.bites.filter(b=>b.visible>0);
 for(const f of this.fire){for(const a of this.actors)if(a.alive&&f.cells.some(([x,y])=>a.x===x&&a.y===y)){a.alive=false;this.events.push('out');}f.t-=dt;}this.fire=this.fire.filter(f=>f.t>0);
 const counts=[0,1].map(t=>this.actors.filter(a=>a.alive&&a.team===t).length);if(counts.includes(0)||this.time<=0){this.finished=true;this.result=counts[0]===counts[1]?-1:counts[0]>counts[1]?0:1;}}
}
