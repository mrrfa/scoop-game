import {LV} from './levels.js';
export function levelInfo(i){const lv=LV[i];if(!lv)return null;const total=[...lv.r.join('')].filter(c=>c=='f').length;return {total,par:total*7+20}}
export function computeResult(i,time,lives){const {total,par}=levelInfo(i);
 const stars=1+(lives>=3?1:0)+(time<par?1:0);
 const score=total*100+Math.max(0,Math.round(par-time))*10+lives*50;return {stars,score,total,par}}
