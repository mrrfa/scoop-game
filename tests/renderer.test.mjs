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
 assert.match(els.hF.textContent,/Fruit 0\//);assert.equal(els.hH.textContent,'Lives ♥♥♥')});
test('HUD displays the remaining shared lives',()=>{S.mode=2;S.g=build(4,2);initRenderer({getContext:()=>ctx});bake();draw();
 assert.equal(els.hH.textContent,'Lives ♥♥')});
test('full restart restores three lives and builds a fresh game (no stale ice/fruit/enemy state)',()=>{S.mode=2;const a=build(3,1);a.ice.add('5,5');a.fruit[0].got=true;a.lives=0;
 const b=build(3);assert.equal(b.ice.size,0);assert.ok(b.fruit.every(f=>!f.got));assert.equal(b.lives,3);assert.equal(b.time,0);assert.equal(b.state,'play')});

// ---- Fruit Crown rendering ----
import {step} from '../public/game/engine.js';
const stand=(p,x,y)=>Object.assign(p,{x,y,fx:x,fy:y,p:1,m:false});
function winRun(mode,pick){S.mode=mode;S.held=[[],[]];S.acts=[[],[]];S.onEnd=null;const g=S.g=build(0);for(const k of pick){stand(g.pl[0],g.fruit[k].x,g.fruit[k].y);step(1/60);step(1/60)}
 g.fruit.forEach(f=>f.got=true);stand(g.pl[0],g.exit.x,g.exit.y);step(1/60);step(1/60);return g}
for(const[mode,label]of[[1,'solo'],[2,'co-op']])test(`${label}: every player wears the full crown once the celebration settles`,()=>{
 const g=winRun(mode,[0,1,2,3]);assert.equal(g.state,'win');initRenderer({getContext:()=>ctx});bake();
 for(let i=0;i<400;i++)step(1/60);for(const k in counts)delete counts[k];assert.doesNotThrow(()=>draw());
 assert.equal(counts.rotate,g.pl.length*4,'4 toppings per player, no stray flying fruit');
 assert.ok(g.vic.done)});
test('empty-fruit victory draws without toppings or errors',()=>{const g=winRun(1,[]);g.vic.layout.length=0;initRenderer({getContext:()=>ctx});bake();for(let i=0;i<200;i++)step(1/60);for(const k in counts)delete counts[k];
 assert.doesNotThrow(()=>draw());assert.ok(!counts.rotate)});
test('fruit fly toward the character before landing',()=>{const g=winRun(1,[0,1]);initRenderer({getContext:()=>ctx});bake();for(let i=0;i<12;i++)step(1/60);for(const k in counts)delete counts[k];draw();
 assert.ok(g.vic.t<g.vic.fly,'still in flight');assert.ok(!counts.rotate,'nothing landed yet');assert.ok(counts.scale>=1,'flying fruit drawn')});
