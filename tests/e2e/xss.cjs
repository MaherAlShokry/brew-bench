// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
// Script payloads in every saved text field (coffees, diary, log, profile nickname, recipes), then every page and
// the main dialogs: nothing may run.
const {chromium}=require('playwright');const demo=require('./seed2.cjs');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>{errs.push('DIALOG '+d.message());d.dismiss()});await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
 await p.goto('http://localhost:8099/index.html');await p.evaluate(demo);
 const X='<img src=x onerror=window.__x=(window.__x||0)+1>"\'><svg onload=window.__x=(window.__x||0)+1>';
 await p.evaluate(X=>{const walk=o=>{if(Array.isArray(o))return o.map(walk);if(o&&typeof o==='object'){for(const k in o){if(typeof o[k]==='string'&&!/^(id|date|d|t|o|p|v|origin|process|variety|roast|b|brewer|g|grinder|kind|photo|img|at|ts|key|k|r|m|unit|logo|vibe|accent|roastDate|tried|leftAt|style|av)$/.test(k)&&!/^\d/.test(o[k]))o[k]=o[k]+X;else o[k]=walk(o[k])}return o}return o};
  for(const k of Object.keys(localStorage))if(k.startsWith('bb-')){try{const v=JSON.parse(localStorage.getItem(k));if(v&&typeof v==='object')localStorage.setItem(k,JSON.stringify(walk(v)))}catch(e){}}
  localStorage.setItem('bb-profile',JSON.stringify({nick:'Mo'+X,since:Date.now(),updated:1}))},X);
 await p.reload();await p.waitForTimeout(900);const tabs=await p.evaluate(()=>[...document.querySelectorAll('main section[id]')].map(s=>s.id));
 for(const t of tabs){await p.evaluate(t=>showTab(t),t);await p.waitForTimeout(200)}
 await p.evaluate(async()=>{showTab('beans');for(const v of ['coffees','diary','passport','top3','scans']){BVIEW=v;renderBeanViews();await new Promise(r=>setTimeout(r,150))}
  for(const f of [()=>openBean(BEANS[0].id),()=>openRecipe(0),()=>openMe(),()=>openShare(dialDoc())]){try{f()}catch(e){}await new Promise(r=>setTimeout(r,250));document.querySelectorAll('dialog[open]').forEach(d=>d.close())}});
 const r=await p.evaluate(()=>({ran:window.__x||0,shown:document.body.innerText.includes('onerror'),welcome:document.getElementById('welcome').innerText.slice(0,60)}));
 console.log((r.ran===0?'ok  ':'FAIL')+' no injected script ran ('+r.ran+'), payload shown as text: '+r.shown+', welcome: '+JSON.stringify(r.welcome));console.log(errs.length?'FAIL errors '+errs.slice(0,3):'ok   no page errors');await b.close()})();
