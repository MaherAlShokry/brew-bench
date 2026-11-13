// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
// Good to know: shown once, on a visit after the first and only when nothing else is open; not on the first visit;
// again from Settings; the Android app mentions the widgets, the website working offline.
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok  ':'FAIL')+' '+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const open=async(native,visits,seen)=>{const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
  await p.addInitScript(([native,visits,seen])=>{window.__tipsTest=600;if(native)window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>'android',Plugins:{}};
    if(sessionStorage.getItem('tipsinit'))return;sessionStorage.setItem('tipsinit','1');sessionStorage.setItem('bb-splashed','1');if(visits)localStorage.setItem('bb-visits',String(visits));else localStorage.removeItem('bb-visits');
    if(seen)localStorage.setItem('bb-tips',String(seen));else localStorage.removeItem('bb-tips')},[native,visits,seen]);
  await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(6500);return{p,c,errs}};
let {p,c,errs}=await open(false,0,0);
ok('not on the very first visit',await p.evaluate(()=>!$('vd').open));await c.close();
({p,c,errs}=await open(false,3,0));
ok('shown on a later visit',await p.evaluate(()=>$('vd').open&&/worth knowing/.test($('vd').textContent)));
const web=await p.evaluate(()=>[...document.querySelectorAll('.gk-tip b')].map(x=>x.textContent));
ok('the website mentions offline use, not widgets',web.some(t=>/offline/i.test(t))&&!web.some(t=>/home screen/i.test(t)),web);
await p.click('#tips-ok');await p.waitForTimeout(400);ok('Got it closes it',await p.evaluate(()=>!$('vd').open));
ok('remembered',await p.evaluate(()=>localStorage.getItem('bb-tips')==='1'));
await p.reload();await p.waitForTimeout(6500);ok('not shown again',await p.evaluate(()=>!$('vd').open));
await p.evaluate(()=>showTab('settings'));await p.waitForTimeout(500);await p.click('#st-tips');await p.waitForTimeout(500);
ok('again from Settings',await p.evaluate(()=>$('vd').open&&/worth knowing/.test($('vd').textContent)));
ok('no errors (website)',!errs.length,errs);await c.close();
({p,c,errs}=await open(true,3,0));
const app=await p.evaluate(()=>[...document.querySelectorAll('.gk-tip b')].map(x=>x.textContent));
ok('the Android app mentions the widgets',app.some(t=>/home screen/i.test(t)),app);
ok('no errors (app)',!errs.length,errs);await c.close();
// Waits for an open sheet to close first
({p,c,errs}=await (async()=>{const r=await open(false,0,0);await r.c.close();
  const c2=await b.newContext({viewport:{width:390,height:844}});const p2=await c2.newPage();await p2.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
  await p2.addInitScript(()=>{window.__tipsTest=600;sessionStorage.setItem('bb-splashed','1');localStorage.setItem('bb-visits','4');localStorage.removeItem('bb-tips')});
  await p2.goto('http://localhost:8099/index.html');await p2.evaluate(()=>openTrophies());await p2.waitForTimeout(6000);return{p:p2,c:c2,errs:[]}})());
ok('waits while another sheet is open',await p.evaluate(()=>/trophies/i.test($('vd').textContent)));
await p.evaluate(()=>$('vd').close());await p.waitForTimeout(5000);ok('then shows',await p.evaluate(()=>$('vd').open&&/worth knowing/.test($('vd').textContent)));
await c.close();await b.close()})();
