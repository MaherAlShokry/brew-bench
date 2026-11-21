// This batch, each in a line: the log card's "Rated" tile has the bean, not a star; the Beans + button steps aside on
// Top 5 (it covered the third coffee's name); a shared recipe's author shows in full under its title; "Clearer" in
// Make a recipe keeps the normal grind (longer ratio, hotter water); your palate names its flavour groups; tasting notes
// on share cards take their wheel group's colour; Varieties filter by family, cup, grind and where grown; grind
// settings are kept, not worked out again, and follow a calibration change; a coffee's remembered grind can be reset
// (and undone); Surprise me can lock its coffee; the daily notes are scheduled again on coming back on a new day;
// problem reports say which build they came from; Carbonic honey is among the processes.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const p=await b.newPage({viewport:{width:360,height:740}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
await p.addInitScript(()=>{sessionStorage.setItem('bb-splashed','1');window.__daily=[];
  window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>'android',Plugins:{
    LocalNotifications:{addListener:()=>({remove(){}}),schedule:async()=>{},cancel:async()=>{},checkPermissions:async()=>({display:'granted'}),requestPermissions:async()=>({display:'granted'})},
    Widget:{update:async()=>{},timer:async()=>{},pending:async()=>({open:''}),daily:async a=>{window.__daily.push(a)},dailyLook:async()=>{}}}}});
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1800);
// 1. Rated tile
const t=await p.evaluate(()=>({rated:tileKey('Rated'),bean:tileKey('Brews')}));
ok('the "Rated" tile draws a bean',t.rated&&/^M12 3\.2c3\.5/.test(t.rated[2]),t.rated&&t.rated[2]);
// 2. Top 5 + button
const f=await p.evaluate(async()=>{goTab('beans');BVIEW='top3';renderBeans();await new Promise(r=>setTimeout(r,400));const a=getComputedStyle($('b-fab')).display;
  BVIEW='coffees';renderBeans();await new Promise(r=>setTimeout(r,300));return[a,getComputedStyle($('b-fab')).display]});
ok('the + steps aside on Top 5 and comes back on Coffees',f[0]==='none'&&f[1]!=='none',f);
// 3. Author line
const au=await p.evaluate(async()=>{const r={id:'rauthor1',custom:true,author:'Alexandria Montgomery-Featherstonehaugh',name:'Morning cup',b:'v60',kind:'pulse',off:0,temp:93,dose:15,water:250,steps:['0:00 pour to 250g.']};
  saveRecipe(r);const i=RECIPES.findIndex(x=>x.id==='rauthor1');openRecipe(i);await new Promise(r=>setTimeout(r,600));
  const by=document.querySelector('dialog[open] .vd-by'),pill=document.querySelector('dialog[open] .vd-head .pill');
  const o={by:by&&by.textContent,full:by&&by.scrollWidth<=by.clientWidth+1,pill:pill&&pill.textContent};document.querySelectorAll('dialog[open]').forEach(d=>d.close());return o});
ok('a shared recipe shows its author in full under the title',au.by==='From Alexandria Montgomery-Featherstonehaugh'&&au.full&&au.pill==='Shared recipe',au);
// 4. Clearer
const cl=await p.evaluate(()=>{const bn=Object.assign({},BEANS[0],{roast:'medium',process:'washed'}),a=makeRecipe(bn,'v60','clear',3),c=makeRecipe(bn,'v60','balanced',3);
  return{a:[a.off,a.temp,a.water/a.dose],c:[c.off,c.temp,c.water/c.dose]}});
ok('Clearer: the normal grind, a longer ratio and hotter water',cl.a[0]===cl.c[0]&&cl.a[1]>cl.c[1]&&cl.a[2]>cl.c[2],cl);
// 5. Palate by group
const pal=await p.evaluate(()=>{LOG.unshift({id:'pg1',ts:Date.now(),date:'',coffee:'X',settings:'',stars:4,fl:[['fruity.tropical-fruit.mango',3],['fruity.tropical-fruit.passion-fruit',3]]});
  const P=palate();goTab('log');renderPalate();const el=document.querySelector('#l-palate .pal-g');return{g:P.groups.map(g=>g.n),c:P.groups[0].c,shown:el&&el.textContent,dot:el&&getComputedStyle(el.querySelector('i')).backgroundColor}});
ok('your palate leans by flavour group, in its colour',/tropical/i.test(pal.g[0])&&/tropical/i.test(pal.shown)&&pal.dot&&pal.dot!=='rgba(0, 0, 0, 0)',pal);
// 6. Share card note colours
const nc=await p.evaluate(()=>{const n=bcNote('Mango'),g=FW.byId[tnLeaf('Mango').id];return{c:n.c,hue:g.hue,unknown:bcNote('Zzqx').c}});
ok('a card\'s tasting note takes its wheel group\'s colour',nc.c===nc.hue&&!!nc.unknown,nc);
// 7. Varieties filters
const vf=await p.evaluate(async()=>{goTab('variety');await new Promise(r=>setTimeout(r,500));const all=document.querySelectorAll('#vgrid .vcard').length;
  VF=['g:kenya'];renderVarieties();const ke=[...document.querySelectorAll('#vgrid .vcard')].map(c=>c.dataset.v);
  VF=['c:acid','d:finer'];renderVarieties();const two=[...document.querySelectorAll('#vgrid .vcard')].map(c=>c.dataset.v);
  const okTwo=two.every(id=>{const v=VBY[id];return vCup(v)==='acid'&&v.dir==='finer'});VF=[];renderVarieties();
  $('vlt-f').click();await new Promise(r=>setTimeout(r,500));const hs=[...document.querySelectorAll('#selsheet[open] h4, #selsheet[open] .ss-h, #selsheet[open] h3')].map(h=>h.textContent);
  $('selsheet').close();return{all,ke:ke.length,kenyaOk:ke.every(id=>(VBY[id].grown||[]).includes('kenya')),two:two.length,okTwo,hs}});
ok('Varieties: grown-in, cup and grind filters narrow the list',vf.all===82&&vf.ke>0&&vf.ke<vf.all&&vf.kenyaOk&&vf.okTwo,vf);
ok('the filter sheet offers family, cup, grind and grown in',['Family','Cup','Grind','Grown in'].every(h=>vf.hs.some(x=>x.trim().startsWith(h))),vf.hs);
// 8. Grind memo
const gm=await p.evaluate(()=>{const a=settingFor('zp6','v60',0.3),t0=performance.now();for(let i=0;i<20000;i++)settingFor('zp6','v60',0.3);const fast=performance.now()-t0;
  GOFF.zp6=4;const b=settingFor('zp6','v60',0.3);delete GOFF.zp6;const c=settingFor('zp6','v60',0.3);
  BOFF={};const d=settingFor('kultra','v60',0.3)===settingFor0('kultra','v60',0.3);return{a,b,c,fast,d,same:a===settingFor0('zp6','v60',0.3)}});
ok('grind settings are kept and still follow a grinder change',gm.same&&gm.b!==gm.a&&gm.c===gm.a&&gm.d&&gm.fast<80,gm);
// 9. Reset a coffee's grind
const rs=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const bn=BEANS[0];
  DIALNEXT[bn.id]={g:'zp6',set:52,temp:93,brewer:'v60'};openBean(bn.id);await new Promise(r=>setTimeout(r,600));
  const btn=$('bd-greset'),had=!!btn;if(btn)btn.click();await new Promise(r=>setTimeout(r,200));
  const after={mem:grindMem(bn.id),btn:!!$('bd-greset')};LOG.unshift({id:'gm1',ts:Date.now()+5,date:'',coffee:'X',settings:'',stars:4,snap:{b:'v60',g:'zp6',c:61,bean:{id:bn.id,name:'x'}}});
  const later=lastBrewFor(bn.id);LOG.shift();document.querySelectorAll('dialog[open]').forEach(d=>d.close());return{had,after,later:later&&later.set}});
ok('Reset grind forgets what a coffee remembered, and later brews count again',rs.had&&!rs.after.mem&&!rs.after.btn&&rs.later===61,rs);
// 10. Surprise keep coffee
const sk=await p.evaluate(async()=>{goTab('recipes');await new Promise(r=>setTimeout(r,300));openMakeRecipe(null,true);await new Promise(r=>setTimeout(r,800));
  const pick=()=>(document.querySelector('dialog[open] [data-mk="bean"][aria-pressed="true"]')||{}).dataset.v;const first=pick();document.querySelector('dialog[open] [data-lock="bean"]').click();
  const seen=new Set();for(let i=0;i<6;i++){$('mk-again').click();await new Promise(r=>setTimeout(r,250));seen.add(pick())}
  const lk=document.querySelector('dialog[open] [data-lock="bean"]'),pressed=lk&&lk.getAttribute('aria-pressed');document.querySelectorAll('dialog[open]').forEach(d=>d.close());return{first,seen:[...seen],pressed}});
ok('Surprise me: locking the coffee keeps it through Shuffle',sk.pressed==='true'&&sk.seen.length===1&&sk.seen[0]===sk.first,sk);
// 11. Daily notes on resume
const dn=await p.evaluate(async()=>{await setReminder(true,'08:30');window.__daily=[];const o=Date.prototype.toDateString;Date.prototype.toDateString=function(){return 'next day'};
  document.dispatchEvent(new Event('visibilitychange'));Date.prototype.toDateString=o;await new Promise(r=>setTimeout(r,400));return window.__daily.map(c=>c.kind)});
ok('coming back on a new day schedules the daily notes again',dn.includes('cabinet'),dn);
// 12. Version in reports
const rp=await p.evaluate(()=>reportText().split('\n')[0]);
ok('a problem report names its build',/\(web build [0-9a-f]{7},/.test(rp),rp);
// 13. Carbonic honey
const ch=await p.evaluate(()=>({p:PROCESSES.carbonichoney&&PROCESSES.carbonichoney.name,scan:parseLabel('Ethiopia Guji\nProcess: Carbonic Honey').process_key,cm:parseLabel('Colombia carbonic maceration').process_key}));
ok('Carbonic honey is a process, and a bag saying so scans to it',ch.p==='Carbonic honey'&&ch.scan==='carbonichoney'&&ch.cm==='carbonic',ch);
ok('no page errors',!errs.length,errs);await b.close()})();
