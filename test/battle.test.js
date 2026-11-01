import test from 'node:test';import assert from 'node:assert/strict';import{Battle,CONFIG,visualPosition,speedMultiplier,POWER,attackCooldown,bombRange}from'../battle.js';
function arena(n=1,t=0){const g=new Battle(n,t,()=>.9);g.actors.forEach(a=>a.ai=999);return g;}
test('every team size and side has one human and valid spawns',()=>{for(let n=1;n<=4;n++)for(let t=0;t<2;t++){const g=arena(n,t);assert.equal(g.actors.length,n*2);assert.equal(g.actors.filter(a=>a.human).length,1);for(const a of g.actors)assert.equal(g.map[a.y][a.x],0);}});
test('bomb capacity, wall blocking, chain reaction and self damage',()=>{const g=arena(),a=g.player;a.x=5;a.y=3;a.level=[1,3,3];assert.ok(g.attack(a));a.x=7;a.cool=0;assert.ok(g.attack(a));g.bombs[0].t=.01;g.map[3][9]=1;g.actors[1].x=8;g.actors[1].y=3;g.update(.02);assert.equal(g.bombs.length,0);assert.equal(a.alive,false);assert.equal(g.actors[1].alive,false);assert.ok(!g.fire.some(f=>f.cells.some(([x,y])=>x===10&&y===3)));});
test('bomb capacity starts at one',()=>{const g=arena(),a=g.player;g.attack(a);a.x++;a.cool=0;assert.equal(g.attack(a),false);});
test('pack bite respects reach and kills opponent',()=>{const g=arena(1,1),a=g.player,e=g.actors[0];a.x=7;a.y=3;a.dir=3;a.level[POWER.RG]=2;e.x=6;e.y=3;g.attack(a);g.update(.3);assert.equal(e.alive,false);assert.equal(g.result,1);});
test('bombs block pack movement and bites at every power level',()=>{for(let level=1;level<=3;level++)for(const time of[1.5,.4]){const g=arena(1,1),a=g.player,e=g.actors[0];a.x=5;a.y=3;a.dir=1;a.level=[level,1,level];e.x=7;e.y=3;g.bombs.push({x:6,y:3,t:time,owner:0,team:0,level:1});assert.equal(g.move(a,1),false);assert.equal(a.x,5);g.attack(a);g.update(.18+.08*(level-1));assert.equal(g.bombs.length,1);assert.equal(e.alive,true);assert.equal(g.move(a,1),false);}});
test('fields are 16 by 16 for every team size',()=>{for(let n=1;n<=4;n++){const g=arena(n);assert.equal(g.w,16);assert.equal(g.h,16);}});
test('SP AT RG upgrade independently for both teams and cap at three',()=>{for(const team of[0,1])for(const kind of[0,1,2]){const g=arena(1,team),a=g.player;g.items.push({x:a.x,y:a.y,kind});g.pickup(a);assert.equal(a.level[kind],2);for(let other=0;other<3;other++)if(other!==kind)assert.equal(a.level[other],1);for(let i=0;i<3;i++){g.items.push({x:a.x,y:a.y,kind});g.pickup(a);}assert.equal(a.level[kind],3);}});
test('60 second timeout always awards bomber escape even when outnumbered',()=>{const g=arena(2);assert.equal(g.time,60);g.actors[0].alive=false;g.time=.01;g.update(.02);assert.equal(g.result,0);assert.equal(g.finished,true);assert.equal(g.escaped,true);assert.equal(g.resultReady,false);g.update(2.01);assert.equal(g.resultReady,true);});
test('all sizes survive a complete CPU simulation',()=>{for(let n=1;n<=4;n++){const g=new Battle(n,0);g.actors.forEach(a=>a.human=false);for(let i=0;i<2500&&!g.finished;i++)g.update(.05);assert.ok(g.finished);assert.ok([-1,0,1].includes(g.result));}});

test('bite hits overlapping enemies in all directions',()=>{for(let dir=0;dir<4;dir++){const g=arena(1,1),a=g.player,e=g.actors[0];a.x=e.x=5;a.y=e.y=3;a.dir=dir;g.attack(a);g.update(.17);assert.equal(e.alive,false);}});
test('active bite follows the attacker and hits an enemy entering later',()=>{const g=arena(1,1),a=g.player,e=g.actors[0];a.x=5;a.y=3;a.dir=1;e.x=10;e.y=3;g.attack(a);g.update(.17);a.x=7;e.x=7;g.update(.05);assert.equal(e.alive,false);});
test('friendly blast kills bomber teammates',()=>{const g=arena(2),a=g.actors[1];a.x=5;a.y=3;g.bombs.push({x:5,y:3,t:.01,level:1,owner:0,team:0});g.update(.02);assert.equal(a.alive,false);});
test('CPU refuses a bomb in a sealed dead end',()=>{const g=arena(),a=g.player;a.x=5;a.y=3;for(const[dx,dy]of[[0,-1],[1,0],[0,1],[-1,0]])g.map[a.y+dy][a.x+dx]=2;g.cpu(a);assert.equal(g.bombs.length,0);});
test('CPU escapes its own bomb instead of waiting in the blast',()=>{const g=arena(),a=g.player;a.x=5;a.y=3;const original={x:5,y:3,t:2,level:1,owner:a.id,team:0};g.bombs.push(original);for(let i=0;i<46;i++){g.cpu(a);g.update(.05);}assert.equal(a.alive,true);assert.equal(g.bombs.includes(original),false);});
test('hazard prediction uses earliest chain reaction for all teams',()=>{const g=arena(),a=g.player;g.bombs.push({x:5,y:3,t:.4,level:2,owner:0,team:0},{x:7,y:3,t:2,level:1,owner:1,team:0});const h=g.hazards(a);assert.ok(h.get('7,3').every(([start])=>start<.5));});
test('pack CPU also escapes an incoming blast',()=>{const g=arena(1,1),a=g.player;a.x=5;a.y=3;const bomb={x:5,y:3,t:2,level:2,owner:0,team:0};g.bombs.push(bomb);for(let i=0;i<46;i++){g.cpu(a);g.update(.05);}assert.equal(a.alive,true);assert.equal(g.bombs.includes(bomb),false);});
test('bomber predicts and avoids a visible bite windup',()=>{const g=arena(),a=g.player,e=g.actors[1];a.x=6;a.y=3;e.x=5;e.y=3;e.dir=1;e.level[POWER.RG]=2;g.attack(e);const hazards=g.hazards(a);assert.equal(g.safeAt(hazards,6,3,0,1),false);for(let i=0;i<10;i++){g.cpu(a);g.update(.05);}assert.equal(a.alive,true);});

test('smooth movement progresses continuously at the existing base and upgrade speeds',()=>{
 for(const team of[0,1])for(const level of[1,2,3]){
  const g=arena(1,team),a=g.player;a.x=5;a.y=3;a.level[0]=level;
  const duration=CONFIG.baseStep/([1,1.2,1.4][level-1]);
  assert.equal(g.move(a,1),true);assert.equal(a.x,6);assert.equal(a.wait,duration);
  assert.deepEqual(visualPosition(a),{x:5,y:3});
  for(const part of[.25,.50,.75,1]){a.wait=duration*(1-part);assert.ok(Math.abs(visualPosition(a).x-(5+part))<1e-9);assert.equal(visualPosition(a).y,3);}
  g.map[3][7]=1;assert.equal(g.move(a,1),false);assert.deepEqual(visualPosition(a),{x:6,y:3});
 }
});
test('smooth movement turns at cell centers without diagonal wall clipping',()=>{
 const g=arena(),a=g.player;a.x=5;a.y=3;g.move(a,1);a.wait=0;g.map[4][6]=0;g.move(a,2);a.wait=a.motion.duration/2;
 assert.deepEqual(visualPosition(a),{x:6,y:3.5});
});

test('holding attack never retriggers pack bite even after cooldown',()=>{
 const g=arena(1,1);g.update(.01,{attack:true});assert.equal(g.events.filter(e=>e==='bite').length,1);
 for(let i=0;i<110;i++)g.update(.02,{attack:true});
 assert.equal(g.events.filter(e=>e==='bite').length,1);assert.equal(g.bites.length,0);
 g.update(.01,{attack:false});g.update(.01,{attack:true});assert.equal(g.events.filter(e=>e==='bite').length,2);
});
test('all reach levels disappear by 0.5 seconds with a shorter hit window',()=>{
 for(const level of[1,2,3]){const g=arena(1,1),a=g.player;a.level[POWER.RG]=level;g.attack(a);
  assert.equal(g.bites[0].active,.12);for(let i=0;i<51;i++)g.update(.01);
  assert.equal(g.bites.length,0);
 }
});
test('a successful bite stops damaging additional enemies during its fade',()=>{
 const g=arena(2,1),a=g.player,first=g.actors[0],second=g.actors[1];a.x=5;a.y=3;a.dir=1;a.level[POWER.RG]=2;first.x=6;first.y=3;second.x=10;second.y=3;g.attack(a);g.update(.25);assert.equal(first.alive,false);
 second.x=6;g.update(.02);assert.equal(second.alive,true);
});
test('expired hit window cannot damage an enemy even while the icon fades',()=>{
 const g=arena(1,1),a=g.player,e=g.actors[0];a.x=5;a.y=3;a.dir=1;a.level[POWER.RG]=2;e.x=10;e.y=3;g.attack(a);for(let i=0;i<40;i++)g.update(.01);assert.ok(g.bites[0].done);e.x=6;g.update(.01);assert.equal(e.alive,true);
});

test('pack reach is own cell plus exactly zero, one, or two forward cells',()=>{
 for(const level of[1,2,3])for(const distance of[0,1,2,3]){
  const g=arena(1,1),a=g.player,e=g.actors[0];a.x=5;a.y=3;a.dir=1;a.level[POWER.RG]=level;e.x=5+distance;e.y=3;g.attack(a);
  assert.equal(g.bites[0].reach,level-1);g.update(.17+.08*(level-1));assert.equal(e.alive,distance>level-1);
 }
});
test('base pack can still chew blocks without hitting adjacent enemies',()=>{
 const g=arena(1,1),a=g.player;a.x=5;a.y=3;a.dir=1;g.map[3][6]=2;
 for(let i=0;i<2;i++){a.cool=0;g.attack(a);g.update(.17);g.update(.5);}assert.equal(g.map[3][6],0);
});

test('overlap automatically eats without attack even during cooldown and shows bite action',()=>{
 const g=arena(1,1),a=g.player,e=g.actors[0];a.x=e.x=5;a.y=e.y=3;a.cool=5;g.update(.01);
 assert.equal(e.alive,false);const effect=g.bites.find(b=>b.contact);assert.ok(effect);assert.equal(effect.reach,0);assert.ok(g.events.includes('bite'));assert.ok(g.events.includes('out'));
});
test('either team moving into the other triggers immediate contact capture',()=>{
 for(const movingTeam of[0,1]){const g=arena(1,1),a=g.player,e=g.actors[0];a.x=6;a.y=3;e.x=5;e.y=3;
  assert.equal(g.move(movingTeam?a:e,movingTeam?3:1),true);assert.equal(e.alive,false);
 }
});
test('contact captures only same-cell enemies, never adjacent ones or allies',()=>{
 const g=arena(2,1),a=g.player,e=g.actors[0],other=g.actors[1],ally=g.actors[3];a.x=e.x=ally.x=5;a.y=e.y=ally.y=3;other.x=6;other.y=3;g.update(.01);
 assert.equal(e.alive,false);assert.equal(other.alive,true);assert.equal(ally.alive,true);
});
test('contact effect disappears after half a second and does not repeat',()=>{
 const g=arena(2,1),a=g.player,e=g.actors[0];a.x=e.x=5;a.y=e.y=3;g.update(.01);for(let i=0;i<60;i++)g.update(.01);
 assert.equal(g.bites.length,0);assert.equal(g.events.filter(e=>e==='out').length,1);
});

test('SP has identical 1 1.2 1.4 multipliers and escape timing on both teams',()=>{
 for(const team of[0,1])for(const level of[1,2,3]){const g=arena(1,team),a=g.player;a.level[POWER.SP]=level;assert.equal(speedMultiplier(a),[1,1.2,1.4][level-1]);assert.ok(Math.abs(g.stepTime(a)-(CONFIG.baseStep/speedMultiplier(a)+.035))<1e-9);}
});
test('AT changes bomb capacity independently of RG and SP',()=>{
 for(const level of[1,2,3]){const g=arena(),a=g.player;a.level[POWER.AT]=level;a.x=3;a.y=3;for(let i=0;i<level;i++){a.x=3+i*2;a.cool=0;assert.equal(g.attack(a),true);}a.x=11;a.cool=0;assert.equal(g.attack(a),false);assert.equal(g.bombs.length,level);assert.equal(speedMultiplier(a),1);assert.ok(g.bombs.every(b=>b.level===1));}
});
test('pack AT cooldown is 2 then 1 then zero and max permits held repeats',()=>{
 for(const level of[1,2,3]){const g=arena(1,1),a=g.player;a.level[POWER.AT]=level;g.update(.01,{attack:true});assert.equal(a.cool,[2,1,0][level-1]);for(let i=0;i<250;i++)g.update(.01,{attack:true});const count=g.events.filter(e=>e==='bite').length;assert.equal(count>1,level===3);assert.ok(g.bites.length<=1);}
});
test('RG bomb rays are 3 then 6 then to edge and respect walls',()=>{
 for(const level of[1,2,3]){const g=arena(),b={x:1,y:3,level};g.map[3].fill(0);g.map[3][0]=g.map[3][15]=1;const cells=g.cells(b);assert.ok(cells.some(([x,y])=>x===[4,7,14][level-1]&&y===3));assert.ok(!cells.some(([x,y])=>y===3&&x>[4,7,14][level-1]));g.map[3][3]=1;assert.ok(!g.cells(b).some(([x,y])=>x>=3&&y===3));}
});
test('last defeat waits two seconds before result while ascending and freezes combat',()=>{
 const g=arena(1,1),a=g.player,e=g.actors[0];a.x=e.x=5;a.y=e.y=3;g.update(.01);assert.equal(g.finished,true);assert.equal(g.resultReady,false);assert.ok(e.death);const time=g.time;g.update(1);assert.equal(g.resultReady,false);assert.equal(e.death.elapsed,1);g.update(.99);assert.equal(g.resultReady,false);g.update(.02);assert.equal(g.resultReady,true);assert.equal(g.time,time);assert.equal(g.move(a,1),false);
});
