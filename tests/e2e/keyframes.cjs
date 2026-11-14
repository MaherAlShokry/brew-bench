// Every animation the styles name has its @keyframes, and no @keyframes is defined twice (the later one would quietly
// replace the earlier everywhere it's used). Reads the source; no browser.
const fs=require('fs'),path=require('path');const ok=(n,c,x)=>console.log((c?'ok   ':'FAIL ')+n+(c?'':' '+JSON.stringify(x)));
const css=fs.readFileSync(path.join(__dirname,'..','..','src','template.html'),'utf8');
const defined=[...css.matchAll(/@keyframes\s+([\w-]+)/g)].map(m=>m[1]),set=new Set(defined);
const dups=[...new Set(defined.filter((k,i)=>defined.indexOf(k)!==i))];
const KW=new Set(['ease','linear','infinite','forwards','backwards','both','none','alternate','reverse','ease-in','ease-out','ease-in-out','paused','running','normal','step-end','step-start','inherit','initial','unset','alternate-reverse']);
const missing=new Set();
for(const m of css.matchAll(/animation\s*:\s*([^;}]+)/g))for(const part of m[1].split(',')){const t=part.trim().split(/\s+/)[0];if(/^[a-z][\w-]*$/.test(t)&&!KW.has(t)&&!set.has(t))missing.add(t)}
ok('every animation used is defined',!missing.size,[...missing]);
ok('no @keyframes is defined twice',!dups.length,dups);
