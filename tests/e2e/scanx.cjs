const {chromium}=require('playwright');const ok=(c,m,x)=>console.log((c?'ok  ':'FAIL')+' '+m+(x!==undefined?'  ('+JSON.stringify(x)+')':''));
(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(700);
const scan=async t=>{await p.evaluate(t=>{showTab('scan');document.getElementById('scan-text').value=t;runLocalScan(false)},t);await p.waitForTimeout(500);return p.evaluate(()=>({p:SC.info&&SC.info.process_key,v:SC.info&&SC.info.variety_keys,vn:SC.info&&SC.info.varieties}))};
let r;
r=await scan('Ethiopia Yirgacheffe\nProcess: Supernatural\nVariety: Heirloom');ok(r.p==='supernatural','Supernatural',r);ok(r.vn&&r.vn[0]==='Heirloom','heirloom shows as Heirloom',r.vn);
r=await scan('Ethiopia Guji\nProcess: Natural\nVariety: Kurume, Wolisho, Dega');ok(r.p==='natural','plain natural stays natural',r.p);ok(JSON.stringify(r.v)==='["kurume","wolisho","dega"]','three Ethiopian landraces',r.v);
r=await scan('Colombia Huila\nNitro washed\nVariety: Papayo');ok(r.p==='nitro'&&r.v[0]==='papayo','nitro washed + papayo',r);
r=await scan('Honduras\nRegion: Lempira\nProcess: Washed\nCatuai');ok(!(r.v||[]).includes('lempira')&&r.v[0]==='catuai','Lempira region is not the variety',r.v);
r=await scan('Honduras\nVariety: Lempira, IHCAFE 90\nProcess: Raisin natural');ok(JSON.stringify(r.v)==='["lempira","ihcafe90"]'&&r.p==='raisin','Lempira on variety line + raisin',r);
r=await scan('Kenya Nyeri\nVarieties: SL28, K7, SL14\nCold fermentation');ok(JSON.stringify(r.v)==='["sl28","k7","sl14"]'&&r.p==='coldferment','Kenyan varieties + cold ferment',r);
r=await scan('Brazil Cerrado\nAcaiá, Paraíso\nSlow dried, dark room');ok((r.v||[]).includes('acaia')&&(r.v||[]).includes('paraiso')&&r.p==='slowdry','Brazil varieties + slow dry',r);
r=await scan('Guatemala\nVariety: Anacafé 14\nWashed');ok(r.v&&r.v[0]==='anacafe14','Anacafe 14',r.v);
// picker labels
const lab=await p.evaluate(()=>{const s=document.createElement('select');s.innerHTML=varietyOptions();return [...s.options].map(o=>o.textContent)});ok(lab.includes('Heirloom')&&!lab.some(x=>/Ethiopian landraces/.test(x)),'picker shows Heirloom',lab.filter(x=>/Heirloom|Kurume|Lempira/.test(x)));
const pl=await p.evaluate(()=>{const s=document.createElement('select');s.innerHTML=processOptions();return [...s.options].map(o=>o.textContent)});ok(['Supernatural','Cold fermentation','Nitrogen fermentation','Slow dry','Raisin'].every(x=>pl.includes(x)),'process picker has the new five');
await b.close();ok(!errs.length,'no errors',errs)})()
