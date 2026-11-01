import test from 'node:test';import assert from 'node:assert/strict';import{Battle,CONFIG,visualPosition}from'../battle.js';
function arena(n=1,t=0){const g=new Battle(n,t,()=>.9);g.actors.forEach(a=>a.ai=999);return g;}
test('every team size and side has one human and valid spawns',()=>{for(let n=1;n<=4;n++)for(let t=0;t<2;t++){const g=arena(n,t);assert.equal(g.actors.length,n*2);assert.equal(g.actors.filter(a=>a.human).length,1);for(const a of g.actors)assert.equal(g.map[a.y][a.x],0);}});
test('bomb capacity, wall blocking, chain reaction and self damage',()=>{const g=arena(),a=g.player;a.x=5;a.y=3;a.level=[3,3];assert.ok(g.attack(a));a.x=7;a.cool=0;assert.ok(g.attack(a));g.bombs[0].t=.01;g.map[3][9]=1;g.actors[1].x=8;g.actors[1].y=3;g.update(.02);assert.equal(g.bombs.length,0);assert.equal(a.alive,false);assert.equal(g.actors[1].alive,false);assert.ok(!g.fire.some(f=>f.cells.some(([x,y])=>x===10&&y===3)));});
test('bomb capacity starts at one',()=>{const g=arena(),a=g.player;g.attack(a);a.x++;a.cool=0;assert.equal(g.attack(a),false);});
test('pack bite respects reach and kills opponent',()=>{const g=arena(1,1),a=g.player,e=g.actors[0];a.x=7;a.y=3;a.dir=3;a.level[1]=2;e.x=5;e.y=3;g.attack(a);g.update(.3);assert.equal(e.alive,false);assert.equal(g.result,1);});
test('bombs block pack movement and bites at every power level',()=>{for(let level=1;level<=3;level++)for(const time of[1.5,.4]){const g=arena(1,1),a=g.player,e=g.actors[0];a.x=5;a.y=3;a.dir=1;a.level=[level,level];e.x=7;e.y=3;g.bombs.push({x:6,y:3,t:time,owner:0,team:0,level:1});assert.equal(g.move(a,1),false);assert.equal(a.x,5);g.attack(a);g.update(.18+.08*(level-1));assert.equal(g.bombs.length,1);assert.equal(e.alive,true);assert.equal(g.move(a,1),false);}});
test('fields are 16 by 16 for every team size',()=>{for(let n=1;n<=4;n++){const g=arena(n);assert.equal(g.w,16);assert.equal(g.h,16);}});
test('shared purple range and brown utility items upgrade the correct ability',()=>{for(const team of[0,1])for(const kind of[0,1]){const g=arena(1,team),a=g.player,ability=team?1-kind:kind;g.items.push({x:a.x,y:a.y,kind});g.pickup(a);assert.equal(a.level[ability],2);assert.equal(a.level[1-ability],1);assert.equal(g.items.length,0);for(let i=0;i<3;i++){g.items.push({x:a.x,y:a.y,kind});g.pickup(a);}assert.equal(a.level[ability],3);}});
test('time limit resolves living team counts',()=>{const g=arena(2);g.actors[2].alive=false;g.time=.01;g.update(.02);assert.equal(g.result,0);assert.equal(g.finished,true);});
test('all sizes survive a complete CPU simulation',()=>{for(let n=1;n<=4;n++){const g=new Battle(n,0);g.actors.forEach(a=>a.human=false);for(let i=0;i<2500&&!g.finished;i++)g.update(.05);assert.ok(g.finished);assert.ok([-1,0,1].includes(g.result));}});

test('bite hits overlapping enemies in all directions',()=>{for(let dir=0;dir<4;dir++){const g=arena(1,1),a=g.player,e=g.actors[0];a.x=e.x=5;a.y=e.y=3;a.dir=dir;g.attack(a);g.update(.17);assert.equal(e.alive,false);}});
test('active bite follows the attacker and hits an enemy entering later',()=>{const g=arena(1,1),a=g.player,e=g.actors[0];a.x=5;a.y=3;a.dir=1;e.x=10;e.y=3;g.attack(a);g.update(.17);a.x=7;e.x=7;g.update(.05);assert.equal(e.alive,false);});
test('friendly blast kills bomber teammates',()=>{const g=arena(2),a=g.actors[1];a.x=5;a.y=3;g.bombs.push({x:5,y:3,t:.01,level:1,owner:0,team:0});g.update(.02);assert.equal(a.alive,false);});
test('CPU refuses a bomb in a sealed dead end',()=>{const g=arena(),a=g.player;a.x=5;a.y=3;for(const[dx,dy]of[[0,-1],[1,0],[0,1],[-1,0]])g.map[a.y+dy][a.x+dx]=2;g.cpu(a);assert.equal(g.bombs.length,0);});
test('CPU escapes its own bomb instead of waiting in the blast',()=>{const g=arena(),a=g.player;a.x=5;a.y=3;const original={x:5,y:3,t:2,level:1,owner:a.id,team:0};g.bombs.push(original);for(let i=0;i<46;i++){g.cpu(a);g.update(.05);}assert.equal(a.alive,true);assert.equal(g.bombs.includes(original),false);});
test('hazard prediction uses earliest chain reaction for all teams',()=>{const g=arena(),a=g.player;g.bombs.push({x:5,y:3,t:.4,level:2,owner:0,team:0},{x:7,y:3,t:2,level:1,owner:1,team:0});const h=g.hazards(a);assert.ok(h.get('7,3').every(([start])=>start<.5));});
test('pack CPU also escapes an incoming blast',()=>{const g=arena(1,1),a=g.player;a.x=5;a.y=3;const bomb={x:5,y:3,t:2,level:2,owner:0,team:0};g.bombs.push(bomb);for(let i=0;i<46;i++){g.cpu(a);g.update(.05);}assert.equal(a.alive,true);assert.equal(g.bombs.includes(bomb),false);});
test('bomber predicts and avoids a visible bite windup',()=>{const g=arena(),a=g.player,e=g.actors[1];a.x=6;a.y=3;e.x=5;e.y=3;e.dir=1;g.attack(e);const hazards=g.hazards(a);assert.equal(g.safeAt(hazards,6,3,0,1),false);for(let i=0;i<10;i++){g.cpu(a);g.update(.05);}assert.equal(a.alive,true);});

test('smooth movement progresses continuously at the existing base and upgrade speeds',()=>{
 for(const team of[0,1])for(const level of[1,2,3]){
  const g=arena(1,team),a=g.player;a.x=5;a.y=3;a.level[0]=level;
  const duration=CONFIG.baseStep/(team?[1,1.5,2][level-1]:1);
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
