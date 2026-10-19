import test from 'node:test';import assert from 'node:assert/strict';
import {S} from '../public/game/state.js';
import {build} from '../public/game/engine.js';
import {initRenderer,bake,draw} from '../public/game/renderer.js';
// Regression: renderer once threw "pos is not defined", hiding players, enemies and the HUD.
const counts={};const ctx=new Proxy({canvas:{width:720,height:528}},{get:(t,k)=>k in t?t[k]:(...a)=>{counts[k]=(counts[k]||0)+1},set:(t,k,v)=>(t[k]=v,true)});
const els={};globalThis.document={getElementById:id=>els[id]??={textContent:''},createElement:()=>({getContext:()=>ctx,width:0,height:0})};
for(const[i,mode]of[[0,1],[2,2],[5,2]])test(`level ${i+1} draws players, enemies and HUD without throwing`,()=>{
 S.mode=mode;S.g=build(i);initRenderer({getContext:()=>ctx});bake();for(const k in counts)delete counts[k];
 assert.doesNotThrow(()=>draw());assert.ok(counts.arc>=S.g.pl.length*3,'player scoops drawn');
 assert.match(els.hF.textContent,/Fruit 0\//);assert.match(els.hH.textContent,/Lives/)});
test('restart builds a fresh game (no stale ice/fruit/enemy state)',()=>{S.mode=1;const a=build(3);a.ice.add('5,5');a.fruit[0].got=true;a.lives=0;
 const b=build(3);assert.equal(b.ice.size,0);assert.ok(b.fruit.every(f=>!f.got));assert.equal(b.lives,3);assert.equal(b.time,0);assert.equal(b.state,'play')});
