import test from 'node:test';import assert from 'node:assert/strict';import {directionFromStick} from '../controls.js';
test('single circular pad selects all four directions and has a center dead zone',()=>{
 for(const [x,y,expected]of[[0,-45,0],[45,0,1],[0,45,2],[-45,0,3],[12,-35,0],[35,12,1]])assert.equal(directionFromStick(x,y),expected);
 assert.equal(directionFromStick(0,0),undefined);assert.equal(directionFromStick(6,6),undefined);
});
