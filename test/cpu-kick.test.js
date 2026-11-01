import test from 'node:test';import assert from 'node:assert/strict';import {Battle,CONFIG}from'../battle.js';
function arena(){const g=new Battle(2,0,()=>.9);for(let y=1;y<15;y++)for(let x=1;x<15;x++)g.map[y][x]=0;g.actors.forEach(a=>a.ai=999);const cpu=g.actors[1];cpu.x=5;cpu.y=3;cpu.specialLeft=0;g.actors[2].x=10;g.actors[2].y=3;g.actors[3].x=14;g.actors[3].y=9;return {g,cpu};}
test('allied CPU deliberately kicks an adjacent bomb toward an enemy before retreating',()=>{
 const {g,cpu}=arena(),b={x:6,y:3,t:1.4,level:1,owner:0,team:0};g.bombs.push(b);g.cpu(cpu);assert.equal(b.rollDir,1);assert.equal(b.x,7);assert.equal(cpu.x,6);assert.ok(g.events.includes('kick'));assert.equal(b.owner,0);assert.equal(b.t,1.4);
});
test('CPU creates a shot by placing a bomb, stepping back and then kicking it',()=>{
 const {g,cpu}=arena();g.cpu(cpu);assert.equal(g.bombs.length,1);assert.equal(g.bombs[0].x,5);assert.equal(cpu.x,4);assert.equal(g.bombs[0].owner,cpu.id);
 for(let i=0;i<7;i++)g.update(.05);g.cpu(cpu);assert.ok(g.events.includes('kick'));assert.equal(g.bombs[0].rollDir,1);assert.equal(cpu.x,5);
});
test('kick planner rejects imminent explosions and directions that cannot hit an enemy',()=>{
 const {g,cpu}=arena(),b={x:6,y:3,t:.1,level:1,owner:0,team:0};g.bombs.push(b);assert.equal(g.tryKickAttack(cpu),false);assert.equal(b.x,6);b.t=CONFIG.fuse;g.actors[2].y=8;assert.equal(g.tryKickAttack(cpu),false);assert.equal(b.x,6);
});
test('CPU avoids kicking a blast toward an ally without time to escape',()=>{
 const {g,cpu}=arena(),ally=g.player;ally.x=9;ally.y=5;g.map[4][8]=g.map[4][10]=g.map[5][8]=g.map[5][10]=g.map[6][9]=1;
 const b={x:6,y:3,t:.8,level:1,owner:cpu.id,team:0};g.bombs.push(b);assert.equal(g.tryKickAttack(cpu),false);assert.equal(b.x,6);
});
