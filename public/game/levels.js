import {W,DIRS} from './constants.js';
export const LV=[
{n:'The Doodle Garden',d:'Open paths and tasty fruit. No enemies.',r:[
"###############","#P..f.....f..Q#","#.##.#####.##.#","#.f..........f#","#.##.##.##.##.#","#....#...#....#","#.##.##.##.##.#","#f...........f#","#.##.#####.##.#","#E.....f......#","###############"]},
{n:'The Icebox',d:'Practice making and breaking ice.',r:[
"###############","#P...f.....f.Q#","#.............#","#..###...###..#","#f.#.......#.f#","#..#...f...#..#","#..#.......#..#","#..###...###..#","#.............#","#E.....f.....f#","###############"]},
{n:'Berry Trouble',d:'Grumpy wanderers in narrow halls.',r:[
"#P.f...#...f.Q#","#.##.#.#.#.##.#","#.#.f#...#f.#.#","#.#.##.W.##.#.#","#...#.....#...#","###.#.###.#.###","#f..#.....#..f#","#.###..W..###.#","#.....#.#.....#","#E....f.f.....#","###############"]},
{n:'The Scribble Trap',d:'A chaser appears! Wall it off with ice.',r:[
"###############","#P.f.........Q#","#.####.#.####.#","#.f..........f#","#.#.#######.#.#","#...#..C..#...#","#.#.#.###.#.#.#","#f..#..f..#..f#","#.####.#.####.#","#E.....W.....f#","###############"]},
{n:'Mint Condition',d:'Split paths. Plan together.',r:[
"###############","#P.....#.....Q#","#.####.#.####.#","#.f..#...#..f.#","#.##.#.f.#.##.#","#....#...#....#","#.##.##.##.##.#","#f.....W.....f#","#.####.#.####.#","#E..f..C......#","###############"]},
{n:'The Great Meltdown',d:'Everything at once. Good luck!',r:[
"###############","#P.f.......f.Q#","#.##.#####.##.#","#.f#...W...#f.#","#.##.#.#.#.##.#","#....#f#f#....#","#.##.#.#.#.##.#","#.f#...C...#f.#","#.##.#####.##.#","#E.....W......#","###############"]}];
// pad/validate rows
LV.forEach((l,i)=>{l.r=l.r.map(s=>s.padEnd(W,'#').slice(0,W))});
export function validate(lv){const r=lv.r,seen=new Set();let sx,sy,need=[];
 r.forEach((row,y)=>[...row].forEach((c,x)=>{if(c=='P'){sx=x;sy=y}if('fEWC'.includes(c))need.push([x,y,c])}));
 const q=[[sx,sy]];seen.add(sx+','+sy);while(q.length){const[x,y]=q.shift();for(const[dx,dy]of DIRS){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(r[ny]&&r[ny][nx]&&r[ny][nx]!='#'&&!seen.has(k)){seen.add(k);q.push([nx,ny])}}}
 return need.filter(([x,y,c])=>!seen.has(x+','+y)&&'fE'.includes(c))}
