// Back returns where you came from, to the same spot: from Explore's word of the day, an origin fact and a section,
// one back goes straight to Explore (not first to the top of the page you're on), scrolled where you left it. On the
// first screen with nowhere to go back to, back still goes to the top before it leaves the app.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,v,x)=>console.log((v?'ok  ':'FAIL')+' '+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1500);
const at=()=>p.evaluate(()=>({tab:document.querySelector('main section.on').id,y:Math.round(scrollY)}));
const back=async()=>{await p.evaluate(()=>window.bbBack());await p.waitForTimeout(600)};
// Explore, scrolled down a little, then the word of the day.
await p.click('[data-bn="explore"]');await p.waitForTimeout(600);await p.evaluate(()=>scrollTo(0,140));await p.waitForTimeout(200);
await p.click('#explore-in [data-word]');await p.waitForTimeout(900);let a=await at();
ok('the word of the day opens Coffee words, scrolled to the word',a.tab==='words'&&a.y>80,a);
await back();a=await at();ok('one back returns to Explore, where it was',a.tab==='explore'&&Math.abs(a.y-140)<4,a);
// A section from Explore's list, scrolled further down.
await p.evaluate(()=>scrollTo(0,900));await p.waitForTimeout(200);const y0=await p.evaluate(()=>Math.round(scrollY));
await p.evaluate(()=>{const g=[...document.querySelectorAll('#explore-in [data-go]')].find(x=>x.dataset.go==='process');g.click()});await p.waitForTimeout(900);
await p.evaluate(()=>scrollTo(0,1200));await p.waitForTimeout(200);a=await at();ok('a section opens',a.tab==='process',a);
await back();a=await at();ok('back from a scrolled section goes straight to Explore, where it was',a.tab==='explore'&&Math.abs(a.y-y0)<4,[a,y0]);
// An origin fact opens the map with its own step back.
await p.evaluate(()=>{const day=Math.floor(Date.now()/864e5);let k=day;for(let i=0;i<60;i++){const f=factFor(day+i);if(f&&f.go&&f.go.origin){k=day+i;break}}goFact(factFor(k).go)});await p.waitForTimeout(900);
a=await at();ok('an origin fact opens the map',a.tab==='map',a);await back();a=await at();ok('back from it returns to Explore',a.tab==='explore',a);
// Opening a bottom-bar page starts at its top.
await p.click('[data-bn="recipes"]');await p.waitForTimeout(600);a=await at();ok('a new visit starts at the top',a.tab==='recipes'&&a.y===0,a);
// The first screen, scrolled, with nowhere to go back to: back goes to the top first.
await p.evaluate(()=>{showTab('dial');NAVD=0;syncShell('dial')});await p.waitForTimeout(400);await p.evaluate(()=>scrollTo(0,600));await p.waitForTimeout(200);
const r=await p.evaluate(()=>window.bbBack());await p.waitForTimeout(700);a=await at();ok('on the first screen, back scrolls to the top first',r===true&&a.tab==='dial'&&a.y<5,a);
ok('no errors',!errs.length,errs);await b.close()})();
