const {chromium}=require('playwright');const ok=(c,m,x)=>{console.log((c?'ok  ':'FAIL')+' '+m+(x!==undefined?'  ('+JSON.stringify(x)+')':''));if(!c)process.exitCode=1};
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,serviceWorkers:'block'});await c.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(800);
const ids=['udaini','dawairi','tufahi','jaadi'];
ok(await p.evaluate(ids=>ids.every(i=>VBY[i]&&VBY[i].fam==='yemen'),ids),'four new Yemeni varieties');
ok(await p.evaluate(ids=>ids.every(i=>new RegExp('value="'+i+'"').test(varietyOptions())),ids),'in every variety picker');
await p.evaluate(()=>goTab('variety'));await p.waitForTimeout(700);
ok(await p.evaluate(()=>/Udaini/.test(document.querySelector('main section.on').textContent)&&/Tufahi/.test(document.querySelector('main section.on').textContent)),'listed on Varieties');
await p.evaluate(()=>openVariety('udaini'));await p.waitForTimeout(600);
ok(await p.evaluate(()=>/Udayn/.test(document.getElementById('vd-in').innerText)),'Udaini sheet opens with its story');
await (await p.$('#vd-in')).screenshot({path:'shots/udaini.png'});
await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
// scanner recognises spellings
for(const [txt,want] of [['Origin: Yemen\nVariety: Odaini\nProcess: Natural','udaini'],['Yemen Haraz\nVarietal: Tuffahi\nNatural','tufahi'],['Yemen\nDawayri\nNatural sun-dried','dawairi'],["Yemen\nVariety: Ja'adi",'jaadi'],['Yemen\nUdaini, Dawairi\nNatural','udaini']]){
 const j=await p.evaluate(t=>parseLabel(t),txt);ok(j.variety_key===want,'label "'+txt.split('\n').slice(-2).join(' / ')+'" → '+want,[j.variety_key,j.variety_keys])}
// the model treats them differently
const prof=await p.evaluate(ids=>ids.map(i=>{Object.assign(SC,{origin:'yemen',process:'natural',variety:i,roast:'light'});const x=beanProfile();return i+': '+x.meters.map(m=>m[0][0]+m[1]).join(' ')+' | '+x.head}),ids);console.log(prof.join('\n'));
const g=await p.evaluate(ids=>ids.map(i=>i+' '+gLabel('zp6',plan({brewer:'v60',grinder:'zp6',tech:RECIPES.findIndex(r=>r.name==='Tetsu Kasuya 4:6'),process:'natural',variety:i,roast:'light',age:14,goal:'balance'}).st.setting)).join(', '),ids);console.log('4:6 on ZP6:',g);
await p.evaluate(()=>{goTab('map');selectOrigin('yemen',true)});await p.waitForTimeout(700);
ok(await p.evaluate(()=>/Udaini/.test(document.body.innerText)),'Yemen origin lists them');
ok(errs.length===0,'no errors',errs);await b.close()})();
