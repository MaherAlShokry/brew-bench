// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,colorScheme:'dark'});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>{errs.push('native '+d.type());d.dismiss()});const ok=(n,v,x)=>console.log((v?'ok  ':'FAIL')+' '+n+(x!==undefined?'  ('+JSON.stringify(x)+')':''));
await p.addInitScript(()=>{sessionStorage.setItem('bb-splashed','1')});await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1000);await p.addStyleTag({content:'#toast{display:none!important}'});
const id=await p.evaluate(()=>{const b=BEANS.find(x=>x.shelf);openBean(b.id);return b.id});await p.waitForTimeout(700);
await p.evaluate(()=>{$('bd-left').scrollIntoView({block:'center'})});await p.click('#bd-left');await p.waitForTimeout(600);await p.screenshot({path:'ask-grams.png'});
await p.fill('#ask-v','120');await p.click('#ask-in-plus').catch(()=>{});await p.click('.ask-b[data-d="1"]');await p.click('#ask-ok');await p.waitForTimeout(500);
ok('grams sheet saves (120 + 5)',await p.evaluate(id=>gramsLeft(beanById(id))===125&&!$('selsheet').open&&$('vd').open,id),await p.evaluate(id=>gramsLeft(beanById(id)),id));
await p.click('#bd-left');await p.waitForTimeout(500);await p.click('#ask-no');await p.waitForTimeout(400);ok('cancel keeps it',await p.evaluate(id=>gramsLeft(beanById(id))===125,id));
await p.evaluate(()=>$('vd').close());await p.waitForTimeout(500);
// delete a brew: it goes at once with Undo; Undo brings it back in place, and without Undo it stays gone
await p.evaluate(()=>goTab('log'));await p.waitForTimeout(600);const n0=await p.evaluate(()=>LOG.length),id0=await p.evaluate(()=>LOG[0].id);
await p.evaluate(()=>document.querySelector('#l-list [data-del]').click());await p.waitForTimeout(500);await p.screenshot({path:'ask-del.png'});
ok('delete removes it at once',await p.evaluate(n=>LOG.length===n-1,n0));
ok('offers undo',await p.evaluate(()=>/Undo/.test($('toast').textContent)&&$('toast').classList.contains('show')));
await p.evaluate(()=>document.querySelector('#toast .tact').click());await p.waitForTimeout(400);ok('undo brings it back in place',await p.evaluate(([n,id])=>LOG.length===n&&LOG[0].id===id,[n0,id0]));
await p.evaluate(()=>document.querySelector('#l-list [data-del]').click());await p.waitForTimeout(7200);ok('stays deleted after undo time',await p.evaluate(n=>LOG.length===n-1&&JSON.parse(localStorage.getItem('bb-log')).length===n-1,n0));
ok('no native boxes, no errors',!errs.length,errs);await b.close()})()
