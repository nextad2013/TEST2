import test from 'node:test';
import assert from 'node:assert/strict';
import {Battle} from '../battle.js';
function arena(team=0){const g=new Battle(1,team,()=>.9);g.actors.forEach(a=>a.ai=999);g.player.x=5;g.player.y=3;g.player.dir=1;return g;}
test('dash instantly travels two cells and destroys both breakable blocks',()=>{
 const g=arena(),a=g.player;g.map[3][6]=g.map[3][7]=2;
 assert.equal(g.special(a),true);assert.equal(a.x,7);assert.equal(a.y,3);assert.equal(a.motion,null);assert.equal(a.wait,0);assert.equal(a.specialLeft,2);assert.equal(a.glow,.3);
 assert.equal(g.map[3][6],0);assert.equal(g.map[3][7],0);assert.equal(g.afterimages.length,2);assert.deepEqual(g.afterimages.map(i=>i.actor.x),[5,6]);
});
test('dash stops at hard walls and blocked attempts do not consume charges',()=>{
 const g=arena(),a=g.player;g.map[3][7]=1;assert.equal(g.special(a),true);assert.equal(a.x,6);assert.equal(a.specialLeft,2);assert.equal(g.special(a),false);assert.equal(a.specialLeft,2);
});
test('only dash can cross bombs while ordinary walking is still blocked',()=>{
 const g=arena(),a=g.player;g.bombs.push({x:6,y:3,t:2,level:1,owner:a.id,team:0},{x:7,y:3,t:2,level:1,owner:a.id,team:0});assert.equal(g.move(a,1),false);assert.equal(g.special(a),true);assert.equal(a.x,7);assert.equal(g.bombs.length,2);assert.equal(a.specialLeft,2);
});
test('special key triggers once per press and dash does not include a third ordinary step',()=>{
 const g=arena(),a=g.player;g.update(.01,{special:true,dir:1});assert.equal(a.x,7);assert.equal(a.specialLeft,2);
 for(let i=0;i<5;i++)g.update(.01,{special:true});assert.equal(a.specialLeft,2);
 g.update(.01,{special:false});g.update(.01,{special:true});assert.equal(a.x,9);assert.equal(a.specialLeft,1);
});
test('afterimages and dash glow both last 0.3 seconds without granting invincibility',()=>{
 const g=arena(),a=g.player;g.special(a);g.update(.1);assert.ok(g.afterimages.length);g.update(.19);assert.ok(g.afterimages.length);assert.ok(a.glow>0);g.update(.02);assert.equal(g.afterimages.length,0);assert.equal(a.glow,0);assert.equal(g.defeat(a),true);
});
test('shield stops movement and attacks, cancels a pending bite and prevents blast damage for two seconds',()=>{
 const g=arena(1),a=g.player;g.attack(a);assert.ok(g.bites.length);assert.equal(g.special(a),true);assert.equal(a.specialLeft,2);assert.equal(a.shield,2);assert.equal(a.glow,2);assert.equal(g.bites.length,0);
 assert.equal(g.move(a,1),false);a.cool=0;assert.equal(g.attack(a),false);assert.equal(g.defeat(a),false);assert.equal(g.special(a),false);assert.equal(a.specialLeft,2);
 g.fire.push({cells:[[a.x,a.y]],t:3,team:0});g.update(1.99);assert.equal(a.alive,true);assert.equal(a.x,5);assert.ok(a.shield>0);g.update(.02);assert.equal(a.shield,0);assert.equal(a.alive,false);
});
test('three charges per actor are restored at the start of every new round',()=>{
 const g=arena(),a=g.player;
 for(let n=0;n<3;n++){a.dir=n%2?3:1;assert.equal(g.special(a),true);}
 assert.equal(a.specialLeft,0);assert.equal(g.special(a),false);
 const next=new Battle(4,0,()=>.9);
 assert.ok(next.actors.every(a=>a.specialLeft===3));
});
test('dash cannot bypass an enemy contact or be activated after death or round end',()=>{
 const g=arena(),a=g.player,e=g.actors[1];e.x=6;e.y=3;g.special(a);assert.equal(a.alive,false);assert.equal(a.x,6);assert.equal(g.special(a),false);
 const h=arena();h.finished=true;assert.equal(h.special(h.player),false);assert.equal(h.player.specialLeft,3);
});
test('shield does not remove the established passive contact capture',()=>{
 const g=arena(1),a=g.player,e=g.actors[0];g.special(a);e.x=a.x;e.y=a.y;g.update(.01);assert.equal(a.alive,true);assert.equal(e.alive,false);assert.equal(a.specialLeft,2);
});
test('CPU uses shield when trapped in an imminent explosion',()=>{
 const g=arena(1),a=g.player;for(const[dx,dy]of[[0,-1],[1,0],[0,1],[-1,0]])g.map[a.y+dy][a.x+dx]=1;
 g.bombs.push({x:a.x,y:a.y,t:.2,level:1,owner:0,team:0});g.cpu(a);assert.equal(a.shield,2);assert.equal(a.specialLeft,2);g.update(.25);assert.equal(a.alive,true);
});
