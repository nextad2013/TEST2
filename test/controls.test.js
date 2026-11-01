import test from 'node:test';import assert from 'node:assert/strict';import {directionFromStick,directionsFromStick} from '../controls.js';
test('single circular pad selects all four directions and has a center dead zone',()=>{
 for(const [x,y,expected]of[[0,-45,0],[45,0,1],[0,45,2],[-45,0,3],[12,-35,0],[35,12,1]])assert.equal(directionFromStick(x,y),expected);
 assert.equal(directionFromStick(0,0),undefined);assert.equal(directionFromStick(6,6),undefined);
});

test('diagonal presses select only the slightly stronger axis in every quadrant',()=>{
 for(const [x,y,expected]of[[40.01,-40,[1]],[40,-40.01,[0]],[40.01,40,[1]],[40,40.01,[2]],[-40.01,-40,[3]],[-40,-40.01,[0]],[-40.01,40,[3]],[-40,40.01,[2]],[35,-15,[1]],[15,-35,[0]]])assert.deepEqual(directionsFromStick(x,y),expected);
 assert.deepEqual(directionsFromStick(0,0),[]);assert.equal(directionsFromStick(40,40).length,1);
});
