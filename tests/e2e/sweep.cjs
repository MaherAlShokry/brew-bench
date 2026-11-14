// The reference content holds together: a world champion for every year of each competition (or a stated gap, or a
// final still to come), champions' flags and recipes exist, varieties and origins point at real varieties, families
// and regions, every origin has its altitude and harvest, and the family tree's notes are for real varieties.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,v,x)=>console.log((v?'ok  ':'FAIL')+' '+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(1500);
await p.evaluate(()=>{goTab('champs');goTab('variety');goTab('map')});await p.waitForTimeout(1500);
const r=await p.evaluate(()=>{const ch=[],vo=[],yr=new Date().getFullYear(),now=Date.now();
  for(const [c,C] of Object.entries(COMPS))for(let y=C.since;y<=yr;y++){if(CHAMPS.some(x=>x.c===c&&x.y===y)||CH_GAPS.some(g=>g[0]===y&&g[1]===c))continue;
    if(EVENTS.some(e=>e.c===c&&e.y===y&&e.end>now-3*864e5))continue;ch.push(c+' '+y)}
  const seen=new Set();for(const x of CHAMPS){const k=x.c+x.y;if(seen.has(k))ch.push('twice: '+k);seen.add(k);if(!FLAGS[x.from])ch.push('no flag: '+x.from);if(!x.who||!x.city)ch.push('no name or city: '+k);
    if(x.ri!=null&&!RECIPES[x.ri])ch.push('recipe missing: '+k);if(x.si!=null&&!RECIPES[x.si])ch.push('recipe missing: '+k)}
  const ids=new Set(V.map(v=>v.id));for(const v of V){if(!FAM[v.fam])vo.push(v.id+': family '+v.fam);for(const x of Array.isArray(v.parents)?v.parents:[])if(typeof x==='string'&&!ids.has(x.split(':')[0]))vo.push(v.id+': parent '+x)}
  for(const [k,o] of Object.entries(ALLO())){if(!REG[o.reg])vo.push(k+': region');if(!o.flag||!o.alt||!o.harvest)vo.push(k+': flag, altitude or harvest');for(const x of Array.isArray(o.vars)?o.vars:[])if(typeof x==='string'&&!ids.has(x.split(':')[0]))vo.push(k+': variety '+x)}
  for(const k of Object.keys((typeof TREE!=='undefined'&&TREE.notes)||{}))if(!ids.has(k))vo.push('tree note: '+k);
  return{ch,vo}});
ok('every competition year has its champion, a stated gap or a final still to come; champions’ details resolve',!r.ch.length,r.ch);
ok('varieties, origins and the tree point at real varieties, families and regions',!r.vo.length,r.vo);
ok('no errors',!errs.length,errs);await b.close()})();
