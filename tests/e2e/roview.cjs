// Beans has a Roasteries view: every roastery you have coffee from, most coffees first, with how many and your
// average; a tap opens its page and back returns to the list where you were.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1500);
await p.evaluate(()=>goTab('beans'));await p.waitForFunction(()=>window.BEANS_OK);await p.waitForTimeout(400);
ok('the strip has a Roastery view',await p.evaluate(()=>[...document.querySelectorAll('#bg-views button')].some(x=>x.textContent.trim()==='Roastery')));
await p.evaluate(()=>[...document.querySelectorAll('#bg-views button')].find(x=>x.textContent.trim()==='Roastery').click());await p.waitForTimeout(600);
const v=await p.evaluate(()=>{const rows=[...document.querySelectorAll('#bv-roasteries .rov-row')];return{shown:!$('bv-roasteries').hidden,names:rows.map(r=>r.dataset.ro),n:roasteries().length,counts:rows.map(r=>+r.querySelector('.cr-tx>small').textContent.match(/\d+/)[0])}});
ok('it lists every roastery you have',v.shown&&v.names.length===v.n&&v.n>0,v);
ok('most coffees first',v.counts.every((x,i)=>!i||x<=v.counts[i-1]),v.counts);
await p.evaluate(()=>scrollTo(0,300));await p.waitForTimeout(150);const y=await p.evaluate(()=>Math.round(scrollY));
await p.evaluate(()=>document.querySelector('#bv-roasteries .rov-row').click());await p.waitForTimeout(700);
ok('a tap opens its page',await p.evaluate(n=>$('vd').open&&($('vd-title')||{}).textContent===n,v.names[0]));
await p.evaluate(()=>bbBack());await p.waitForTimeout(700);
ok('back returns to the list where you were',await p.evaluate(y=>!$('vd').open&&!$('bv-roasteries').hidden&&Math.abs(scrollY-y)<4,y));
// Your favourite: the highest rated until you star one at the top of its page.
const auto=await p.evaluate(()=>document.querySelector('.rov-hero b').textContent);
const other=await p.evaluate(a=>roasteries().map(r=>r.name).find(n=>n!==a),auto);
await p.evaluate(o=>openRoasterNow(o,true),other);await p.waitForTimeout(700);
ok('a roastery page has its star, add and share at the top',await p.evaluate(()=>!!document.querySelector('.vd-head .vd-tools #ro-fav')&&!!document.querySelector('.vd-tools #ro-add')&&!!document.querySelector('.vd-tools #ro-share')&&!document.querySelector('#vd-in .actions #ro-add')));
await p.evaluate(()=>$('ro-fav').click());await p.waitForTimeout(200);
// The favourite coffee from them: the star on one of its coffees.
const pick=await p.evaluate(()=>{const s=[...document.querySelectorAll('.ro-bstar')];const t=s.find(x=>x.getAttribute('aria-pressed')!=='true')||s[0];t.click();return t.dataset.rofav});await p.waitForTimeout(600);
ok('starring a coffee makes it your favourite from them',await p.evaluate(id=>document.querySelector('.ro-best').dataset.bean===id&&document.querySelector('.ro-bstar[data-rofav="'+id+'"]').getAttribute('aria-pressed')==='true',pick));
const card=await p.evaluate(async()=>{const b=await roasteryCardImg($('vd-title').textContent);return b&&b.size});ok('the roastery shares as an image',card>20000,card);
await p.evaluate(()=>$('vd').close());await p.waitForTimeout(800);
ok('the starred roastery leads the view',await p.evaluate(o=>document.querySelector('.rov-hero b').textContent===o,other),other);
const card2=await p.evaluate(async()=>{const b=await roasteriesCardImg();return b&&b.size});ok('your roasteries share as an image',card2>20000,card2);
// Add a roastery: it's listed, and offered when you type a roastery.
await p.evaluate(()=>$('rov-add').click());await p.waitForTimeout(700);await p.fill('#ra-name','Bonanza Coffee');await p.evaluate(()=>$('ra-save').click());await p.waitForTimeout(900);
ok('an added roastery is listed',await p.evaluate(()=>[...document.querySelectorAll('#bv-roasteries .rov-row')].some(x=>x.dataset.ro==='Bonanza Coffee')));
ok('and offered in the roastery picklist',await p.evaluate(()=>roasterRows()('bonan').some(x=>x.v==='Bonanza Coffee')));
ok('the stars and added roasteries go to the account',await p.evaluate(()=>['bb-favro','bb-roasteries','bb-rofavbean'].every(k=>SYNC_KEYS.includes(k))));
// A roastery's logo shows (it once came out 0×0 inside its padded square): in the view, its hero and on its page.
await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
await p.evaluate(async()=>{for(const r of roasteries()){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.fillStyle='#c33';g.fillRect(0,0,64,64);await setRoLogo(r.name,c.toDataURL('image/png'))}renderRoasteriesView()});await p.waitForTimeout(400);
const lg=await p.evaluate(()=>[...document.querySelectorAll('#bv-roasteries .ro-mark.logo img')].map(i=>{const R=i.getBoundingClientRect();return Math.min(R.width,R.height)}));
ok('roastery logos show in the view',lg.length>0&&lg.every(v=>v>20),lg);
await p.evaluate(()=>openRoasterNow(roasteries()[0].name));await p.waitForTimeout(500);
const lg2=await p.evaluate(()=>{const i=document.querySelector('#vd-in .ro-mark.logo img');const R=i&&i.getBoundingClientRect();return R?Math.min(R.width,R.height):0});
ok('and on its page',lg2>20,lg2);
ok('no errors',!errs.length,errs);await b.close()})();
