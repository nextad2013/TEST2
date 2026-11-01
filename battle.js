export const DIRS=[[0,-1],[1,0],[0,1],[-1,0]];
export const CONFIG={fuse:2,fire:.48,baseStep:.19,biteCooldown:.9,roundTime:120};
export class Battle{
 constructor(n=2,team=0,random=Math.random){this.n=n;this.team=team;this.random=random;this.w=n>2?19:15;this.h=n>2?15:11;this.time=120;this.bombs=[];this.fire=[];this.items=[];this.bites=[];this.actors=[];this.events=[];this.finished=false;this.result=null;this.map=Array.from({length:this.h},(_,y)=>Array.from({length:this.w},(_,x)=>x===0||y===0||x===this.w-1||y===this.h-1||(x%2===0&&y%2===0)?1:random()<.36?2:0));
 for(let t=0;t<2;t++)for(let i=0;i<n;i++){const x=t?this.w-2:1,y=1+i*2;this.actors.push({id:t*4+i,team:t,x,y,dir:t?3:1,alive:true,level:[1,1],wait:0,cool:0,ai:0,human:t===team&&i===0});for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(this.map[y+dy]?.[x+dx]===2)this.map[y+dy][x+dx]=0;}}
 // Fixed routes ensure no team is sealed off by random blocks.
 for(let x=1;x<this.w-1;x++)this.map[this.h-2][x]=0;
 for(let y=1;y<this.h-1;y++){this.map[y][1]=0;this.map[y][this.w-2]=0;}
 }
 get player(){return this.actors.find(a=>a.human)}
 cells(b){const cells=[[b.x,b.y]];for(const [dx,dy]of DIRS){const len=Math.max(1,Math.floor(((dx?this.w:this.h)*b.level/3-1)/2));for(let i=1;i<=len;i++){const x=b.x+dx*i,y=b.y+dy*i,v=this.map[y]?.[x];if(v===undefined||v===1)break;cells.push([x,y]);if(v===2)break;}}return cells;}
 bombAt(x,y){return this.bombs.find(b=>b.x===x&&b.y===y)}
 move(a,d){if(!a.alive||a.wait>0||this.finished)return false;a.dir=d;const [dx,dy]=DIRS[d],x=a.x+dx,y=a.y+dy;if(this.map[y]?.[x]!==0||this.bombAt(x,y))return false;a.x=x;a.y=y;a.wait=CONFIG.baseStep/(a.team?[1,1.5,2][a.level[0]-1]:1);this.pickup(a);return true;}
 pickup(a){const item=this.items.find(i=>i.x===a.x&&i.y===a.y&&i.team===a.team);if(item){a.level[item.kind]=Math.min(3,a.level[item.kind]+1);this.items.splice(this.items.indexOf(item),1);this.events.push('pickup');}}
 attack(a){if(!a.alive||a.cool>0||this.finished)return false;if(!a.team){if(this.bombAt(a.x,a.y)||this.bombs.filter(b=>b.owner===a.id).length>=a.level[1])return false;this.bombs.push({x:a.x,y:a.y,t:2,level:a.level[0],owner:a.id,team:0});a.cool=.3;this.events.push('place');return true;}
 this.bites.push({x:a.x,y:a.y,dir:a.dir,reach:a.level[1],t:.16+.08*(a.level[1]-1),visible:.55,actor:a.id,done:false});a.cool=CONFIG.biteCooldown+.08*(a.level[1]-1);this.events.push('bite');return true;}
 resolveBite(b){const a=this.actors.find(a=>a.id===b.actor);if(!a?.alive)return;const[dx,dy]=DIRS[b.dir];for(let i=1;i<=b.reach;i++){const x=b.x+dx*i,y=b.y+dy*i,v=this.map[y]?.[x];if(v===undefined||v===1)break;if(v===2){const k=x+','+y;this.chew??={};this.chew[k]=(this.chew[k]||0)+1;if(this.chew[k]>=2)this.breakBlock(x,y);break;}const bomb=this.bombAt(x,y);if(bomb){if(bomb.t>.55){this.bombs.splice(this.bombs.indexOf(bomb),1);this.events.push('eat');}break;}const enemy=this.actors.find(e=>e.alive&&e.team!==a.team&&e.x===x&&e.y===y);if(enemy){enemy.alive=false;this.events.push('out');break;}}}
 breakBlock(x,y){this.map[y][x]=0;if(this.random()<.72)this.items.push({x,y,team:this.random()<.5?0:1,kind:this.random()<.5?0:1});}
 explode(b){if(!this.bombs.includes(b))return;const cells=this.cells(b);this.bombs.splice(this.bombs.indexOf(b),1);this.fire.push({cells,t:CONFIG.fire,team:b.team});this.events.push('boom');for(const[x,y]of cells){if(this.map[y][x]===2)this.breakBlock(x,y);const other=this.bombAt(x,y);if(other)this.explode(other);}}
 danger(a){const set=new Set();for(const b of this.bombs){if(a.team===0)continue;for(const[x,y]of this.cells(b))set.add(x+','+y);}for(const f of this.fire)if(f.team!==a.team)for(const[x,y]of f.cells)set.add(x+','+y);return set;}
 cpu(a){if(a.wait>0)return;const danger=this.danger(a),targets=this.actors.filter(e=>e.alive&&e.team!==a.team);if(!targets.length)return;const target=targets.reduce((b,e)=>Math.abs(e.x-a.x)+Math.abs(e.y-a.y)<Math.abs(b.x-a.x)+Math.abs(b.y-a.y)?e:b);const pickups=this.items.filter(i=>i.team===a.team&&a.level[i.kind]<3);let goal=target;for(const i of pickups)if(Math.abs(i.x-a.x)+Math.abs(i.y-a.y)<Math.abs(goal.x-a.x)+Math.abs(goal.y-a.y))goal=i;
 const order=DIRS.map((_,d)=>d).sort(()=>this.random()-.5);let choice=-1,best=Infinity;
 // Breadth-first path search, including blocked cells as goals to break.
 const queue=[{x:a.x,y:a.y,first:-1,dist:0}],seen=new Set([a.x+','+a.y]);for(let q=0;q<queue.length;q++){const p=queue[q];for(const d of order){const[dx,dy]=DIRS[d],x=p.x+dx,y=p.y+dy,key=x+','+y,v=this.map[y]?.[x];if(v===undefined||v===1||seen.has(key)||this.bombAt(x,y))continue;seen.add(key);const first=p.first<0?d:p.first,dist=p.dist+1,penalty=danger.has(key)?20:0,score=Math.abs(goal.x-x)+Math.abs(goal.y-y)+dist*.16+penalty;if(score<best){best=score;choice=first;}if(v===0&&dist<18)queue.push({x,y,first,dist});}}
 if(a.team){const dx=target.x-a.x,dy=target.y-a.y;if((dx===0||dy===0)&&Math.abs(dx+dy)<=a.level[1]){a.dir=dx>0?1:dx<0?3:dy>0?2:0;this.attack(a);}if(choice>=0){a.dir=choice;const[dX,dY]=DIRS[choice];if(this.map[a.y+dY]?.[a.x+dX]===2||this.bombAt(a.x+dX,a.y+dY))this.attack(a);this.move(a,choice);}}
 else{const near=Math.abs(target.x-a.x)+Math.abs(target.y-a.y)<5,block=DIRS.some(([dx,dy])=>this.map[a.y+dy]?.[a.x+dx]===2);if((near||block)&&this.random()<.36)this.attack(a);if(choice>=0)this.move(a,choice);}
 if(danger.has(a.x+','+a.y)){for(const d of order){const[dx,dy]=DIRS[d];if(!danger.has((a.x+dx)+','+(a.y+dy))&&this.move(a,d))break;}}
 }
 update(dt,input={}){if(this.finished)return;this.time=Math.max(0,this.time-dt);for(const a of this.actors){a.wait=Math.max(0,a.wait-dt);a.cool=Math.max(0,a.cool-dt);if(!a.alive)continue;if(a.human){if(input.dir!==undefined)this.move(a,input.dir);if(input.attack)this.attack(a);}else{a.ai-=dt;if(a.ai<=0){this.cpu(a);a.ai=.08+this.random()*.08;}}}
 for(const b of [...this.bombs]){b.t-=dt;if(b.t<=0)this.explode(b);}for(const b of this.bites){b.t-=dt;b.visible-=dt;if(b.t<=0&&!b.done){b.done=true;this.resolveBite(b);}}this.bites=this.bites.filter(b=>b.visible>0);
 for(const f of this.fire){for(const a of this.actors)if(a.alive&&a.team!==f.team&&f.cells.some(([x,y])=>a.x===x&&a.y===y)){a.alive=false;this.events.push('out');}f.t-=dt;}this.fire=this.fire.filter(f=>f.t>0);
 const counts=[0,1].map(t=>this.actors.filter(a=>a.alive&&a.team===t).length);if(counts.includes(0)||this.time<=0){this.finished=true;this.result=counts[0]===counts[1]?-1:counts[0]>counts[1]?0:1;}}
}
