export const T=48,W=15,H=11;
export const COL={cream:'#FFF8E9',ink:'#38352F',pink:'#F3A7B4',mint:'#A8DCC3',yel:'#F5D67C',ice:'#A9D8EC',lav:'#C8B8E8',brown:'#C7B9A5'};
export const DIRS=[[0,-1],[1,0],[0,1],[-1,0]],DK={u:DIRS[0],r:DIRS[1],d:DIRS[2],l:DIRS[3]};
export const reduced=typeof matchMedia!=='undefined'&&matchMedia('(prefers-reduced-motion:reduce)').matches;
export const hsh=(a,b,c)=>{const s=Math.sin(a*127.1+b*311.7+c*74.7)*43758.5453;return s-Math.floor(s)-.5};
