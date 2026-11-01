import test from 'node:test';import assert from 'node:assert/strict';
import {Battle,CONFIG,bombVisualPosition} from '../battle.js';
function arena(team=0){const g=new Battle(1,team,()=>.9);g.actors.forEach(a=>a.ai=999);g.player.x=3;g.player.y=3;g.player.dir=1;return g;}
function bomb(g,x=4){const b={x,y:3,t:CONFIG.fuse,level:1,owner:0,team:0};g.bombs.push(b);return b;}
test('bomber can kick from level one by walking into a bomb without changing ownership or fuse',()=>{
 const g=arena(),a=g.player,b=bomb(g);assert.deepEqual(a.level,[1,1,1]);assert.equal(g.move(a,1),true);assert.equal(a.x,4);assert.equal(b.x,5);assert.equal(b.rollDir,1);assert.equal(b.t,1.8);assert.equal(b.owner,0);assert.ok(g.events.includes('kick'));
});
test('pack master cannot kick by walking into a bomb',()=>{const g=arena(1),b=bomb(g);assert.equal(g.move(g.player,1),false);assert.equal(b.x,4);assert.equal(b.rollDir,undefined);});
test('walls, breakable blocks, bombs and live actors block an immediate kick',()=>{
 for(const type of['wall','block','bomb','actor']){const g=arena(),b=bomb(g);if(type==='wall')g.map[3][5]=1;if(type==='block')g.map[3][5]=2;if(type==='bomb')bomb(g,5);if(type==='actor'){g.actors[1].x=5;g.actors[1].y=3;}
 assert.equal(g.move(g.player,1),false);assert.equal(g.player.x,3);assert.equal(b.x,4);assert.equal(b.t,1.8);}
});
test('kicked bomb rolls until an obstacle and detonates at its final position on the original fuse',()=>{
 const g=arena(),b=bomb(g);g.map[3][8]=1;g.move(g.player,1);g.update(.12);assert.equal(b.x,6);g.update(.12);assert.equal(b.x,7);g.update(.12);assert.equal(b.x,7);assert.equal(b.rollDir,null);assert.ok(Math.abs(b.t-1.44)<1e-8);g.update(1.44);assert.equal(g.bombs.length,0);assert.ok(g.fire.some(f=>f.cells.some(([x,y])=>x===7&&y===3)));
});
test('bomb movement interpolates and rolling does not cross occupied cells',()=>{
 const g=arena(),b=bomb(g);g.move(g.player,1);assert.deepEqual(bombVisualPosition(b),{x:4,y:3});g.update(.06);assert.ok(Math.abs(bombVisualPosition(b).x-4.5)<1e-8);
 g.actors[1].x=6;g.actors[1].y=3;g.update(.06);assert.equal(b.x,5);assert.equal(b.rollDir,null);assert.deepEqual(bombVisualPosition(b),{x:5,y:3});
});
test('new bombs explode after 1.8 seconds and kicking never refreshes the countdown',()=>{
 const g=arena(),a=g.player;assert.equal(g.attack(a),true);const b=g.bombs[0];assert.equal(b.t,1.8);g.update(.5);a.x=2;a.wait=0;assert.equal(g.move(a,1),true);assert.ok(Math.abs(b.t-1.3)<1e-8);g.update(1.3);assert.equal(g.bombs.includes(b),false);
});
test('rolling bombs still chain explode and explode on active fire',()=>{
 const g=arena(),a=bomb(g,5),b=bomb(g,7);a.t=.01;g.update(.02);assert.equal(g.bombs.length,0);
 const h=arena(),c=bomb(h);h.move(h.player,1);h.fire.push({cells:[[6,3]],t:1,team:0});h.update(.12);assert.equal(h.bombs.includes(c),false);
});
test('CPU hazard projection covers the rolling route and projected blast end',()=>{
 const g=arena(),b=bomb(g);g.move(g.player,1);b.t=1;const projected=g.projectBomb(b),hazards=g.hazards(g.player);assert.ok(projected.x>5);assert.ok(hazards.has(projected.x+',3'));assert.ok(hazards.has('5,3'));
});
