import test from 'node:test';import assert from 'node:assert/strict';
import {LV,validate} from '../public/game/levels.js';
import {W,H} from '../public/game/constants.js';
const count=(lv,c)=>[...lv.r.join('')].filter(x=>x==c).length;
test('there are six levels',()=>assert.equal(LV.length,6));
LV.forEach((lv,i)=>{
 test(`level ${i+1} (${lv.n}) is structurally valid`,()=>{
  assert.equal(lv.r.length,H);lv.r.forEach(r=>assert.equal(r.length,W));
  assert.ok([...lv.r.join('')].every(c=>'#.PQfWCE'.includes(c)),'unknown cell type');
  assert.equal(count(lv,'P'),1);assert.equal(count(lv,'Q'),1);assert.equal(count(lv,'E'),1);assert.ok(count(lv,'f')>=4);
  assert.deepEqual(validate(lv),[],'unreachable fruit/exit');
 });});
test('enemy introduction curve',()=>{const e=i=>count(LV[i],'W')+count(LV[i],'C');
 assert.equal(e(0)+e(1),0);assert.ok(e(2)>0);assert.ok(count(LV[3],'C')>0);assert.ok(e(5)>=e(2))});
