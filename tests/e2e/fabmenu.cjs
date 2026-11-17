// The Beans + is a shortcut menu: scan a bag, add a coffee, an advent calendar or a roastery, each opening its form.
// Recipes has no floating new-recipe button. Share images follow the app's light or dark look. Text boxes don't resize.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
for(const sc of ['light','dark']){const p=await b.newPage({viewport:{width:390,height:844},colorScheme:sc});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1500);
await p.evaluate(()=>goTab('beans'));await p.waitForFunction(()=>window.BEANS_OK);await p.waitForTimeout(300);
const got={};
for(const k of ['scan','bean','advent','roastery']){await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());goTab('beans')});await p.waitForTimeout(300);
  await p.click('#b-fab-add');await p.waitForTimeout(250);if(k==='scan')ok(sc+': the + opens a menu of four',await p.evaluate(()=>!$('b-fab-menu').hidden&&document.querySelectorAll('#b-fab-menu .fab-mi').length===4&&$('b-fab-add').getAttribute('aria-expanded')==='true'));
  await p.click('[data-fab='+k+']');await p.waitForTimeout(500);got[k]=await p.evaluate(()=>(document.querySelector('dialog[open] #vd-title')||{}).textContent||document.querySelector('main section.on').id);}
ok(sc+': each item opens its form',got.scan==='scan'&&got.bean==='Add a coffee'&&got.advent==='Add an advent calendar'&&got.roastery==='Add a roastery',got);
await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());goTab('beans')});await p.click('#b-fab-add');await p.waitForTimeout(200);await p.keyboard.press('Escape');await p.waitForTimeout(450);
ok(sc+': Escape closes it',await p.evaluate(()=>$('b-fab-menu').hidden));
// While open the page stays put, and back only closes the menu (the tab stays).
// The app's own scroll leaves the + where it is; scrolling down yourself tucks it away, a small scroll up brings it back.
await p.evaluate(()=>{scrollTo(0,300)});await p.waitForTimeout(200);ok('the app scrolling leaves the + shown',await p.evaluate(()=>!$('b-fab').classList.contains('away')));
await p.mouse.move(200,400);for(let i=0;i<4;i++){await p.mouse.wheel(0,60);await p.waitForTimeout(40)}await p.waitForTimeout(250);
ok('scrolling down hides the +',await p.evaluate(()=>$('b-fab').classList.contains('away')));
ok('the tab bar goes with it',await p.evaluate(()=>document.documentElement.classList.contains('nav-away')));
await p.mouse.wheel(0,-40);await p.waitForTimeout(350);ok('scrolling up brings the + back',await p.evaluate(()=>!$('b-fab').classList.contains('away')));
ok('and the tab bar',await p.evaluate(()=>!document.documentElement.classList.contains('nav-away')));
await p.click('#b-fab-add');await p.waitForTimeout(250);
const y0=await p.evaluate(()=>scrollY);await p.mouse.wheel(0,600);await p.waitForTimeout(300);
ok(sc+': the page doesn\'t scroll under the open menu',await p.evaluate(y=>Math.abs(scrollY-y)<2&&document.documentElement.classList.contains('fab-lock'),y0));
await p.goBack();await p.waitForTimeout(400);
ok(sc+': back closes the menu and stays on Beans',await p.evaluate(()=>$('b-fab-menu').hidden&&document.querySelector('main section.on').id==='beans'&&!document.documentElement.classList.contains('fab-lock')));
await p.click('#b-fab-add');await p.waitForTimeout(250);await p.click('[data-fab=bean]');await p.waitForTimeout(600);await p.goBack();await p.waitForTimeout(600);
ok(sc+': after a pick, back closes its sheet and stays on Beans',await p.evaluate(()=>!document.querySelector('dialog[open]')&&document.querySelector('main section.on').id==='beans'));
ok(sc+': no new-recipe button on Recipes',await p.evaluate(()=>{goTab('recipes');return !document.querySelector('#recipes .fab')}));
await p.evaluate(()=>{CARD_STYLE.mode='light';openShare(recipeDoc(0))});await p.waitForTimeout(500);
ok(sc+': a share image follows the app\'s look',await p.evaluate(m=>CARD_STYLE.mode===m,sc));
ok(sc+': text boxes don\'t resize',await p.evaluate(()=>[...document.querySelectorAll('textarea')].every(t=>getComputedStyle(t).resize==='none')));
ok(sc+': no errors',!errs.length,errs);await p.close()}
await b.close()})();
