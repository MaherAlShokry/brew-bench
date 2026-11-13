// The coffee content agrees with itself: each process's brewing advice points the same way as its grind direction and
// its temperature lean, and each recipe's steps add up to its water, run in time order and use its own temperatures.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const fs=require('fs'),path=require('path'),vm=require('vm');const ctx={};vm.createContext(ctx);
const SRC=path.join(__dirname,'..','..','src','data');
vm.runInContext(['origins-varieties-history','brewing'].map(f=>fs.readFileSync(path.join(SRC,f+'.js'),'utf8')).join('\n')+';this.PROCESSES=PROCESSES;this.RECIPES=RECIPES;',ctx);
const {PROCESSES,RECIPES}=ctx;const bad=[];
const ok=(n,v,x)=>console.log((v?'ok  ':'FAIL')+' '+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const temps=s=>[...s.matchAll(/(\d{2})(?:\s*(?:to|–|-)\s*(\d{2}))?\s*°C/g)].map(m=>[+m[1],+(m[2]||m[1])]);
// Processes
const P=[];
for(const [k,p] of Object.entries(PROCESSES)){const b=p.brew||'',lo=b.toLowerCase();
  const said=/finer|\bfine\b/.test(lo)?'finer':/^baseline|baseline grind/.test(lo)?'baseline':/coars/.test(lo)?'coarser':'?';
  if(!['finer','baseline','coarser'].includes(p.dir))P.push(k+': grind direction '+p.dir);
  else if(said!==p.dir)P.push(k+': grind direction '+p.dir+' but the advice says '+said+' ('+b+')');
  const tt=temps(b);
  if(!tt.length){if(!/cool|hot/.test(lo))P.push(k+': no temperature in the advice')}
  else{const mx=Math.max(...tt.map(x=>x[1])),mn=Math.min(...tt.map(x=>x[0]));
    if(mn<85||mx>97)P.push(k+': temperature '+mn+' to '+mx);
    if(p.t<=-0.3&&mx>93)P.push(k+': leans cool ('+p.t+') but advises up to '+mx+'°C');
    if(p.t>=0.15&&mn<92)P.push(k+': leans hot ('+p.t+') but advises from '+mn+'°C')}
  if(!(p.notes||[]).length||!p.char)P.push(k+': no notes or description')}
ok('all '+Object.keys(PROCESSES).length+' processes: advice matches grind direction and temperature',!P.length,P);
// Recipes
const R=[];const at=s=>{const m=s.match(/^(\d+):(\d\d)/);return m?+m[1]*60+ +m[2]:null};
for(const r of RECIPES){const st=r.steps||[],id=r.b+' / '+r.name;
  // Water poured: "pour 60g", "pour 30g (to 60g)", "until 374g". Coffee, dilution and ice are left out.
  let tot=0;for(const s of st){if(/dilute|ice\b|of coffee|coffee per/i.test(s))continue;
    for(const m of s.matchAll(/(?:pour|add)\s+(\d+)\s?g(?! \(to)(?!.*\bto \d)/gi))tot+=+m[1];for(const m of s.matchAll(/(?:to|until)\s+(\d+)\s?g\b/gi))tot=Math.max(tot,+m[1])}
  const iced=/\bice|iced|flash/i.test(r.name+(r.why||'')+st.join(' '));
  if(tot&&r.water&&Math.abs(tot-r.water)>2&&!iced)R.push(id+': steps pour '+tot+'g, recipe water '+r.water+'g');
  // "pour 30g (to 60g)": the running total is right.
  let run=0;for(const s of st){const m=s.match(/pour (\d+)\s?g(?: \(to (\d+)\s?g\))?/i);if(!m)continue;run+=+m[1];if(m[2]&&+m[2]!==run)R.push(id+': "'+s+'" but the pours so far make '+run+'g')}
  const ts=st.map(at).filter(x=>x!=null);for(let i=1;i<ts.length;i++)if(ts[i]<ts[i-1])R.push(id+': step times go backwards');
  const own=[r.temp,r.temp2].filter(Boolean);for(const [a,b] of temps(st.join(' ')+' '+(r.tip||'')+' '+(r.why||'')))if(!own.some(t=>t>=a-3&&t<=b+3))R.push(id+': text says '+a+'°C, recipe '+own.join('/')+'°C');
  if(r.temp&&(r.temp<80||r.temp>100))R.push(id+': temperature '+r.temp);
  const ratio=r.water/r.dose;if(!(ratio>=1.5&&ratio<=35))R.push(id+': ratio 1:'+ratio.toFixed(1))}
ok('all '+RECIPES.length+' recipes: steps add up, run in order and use their own temperatures',!R.length,R);
