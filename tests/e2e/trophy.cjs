const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const ok=(n,c,x)=>console.log((c?'ok  ':'FAIL')+' '+n+(x!==undefined?'  ('+JSON.stringify(x)+')':''));const D='';
 const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,serviceWorkers:'block'});await c.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
 await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(800);
 ok('permanent trophies',await p.evaluate(()=>TROPHIES.length),29);
 const at=async iso=>p.evaluate(iso=>seasonNow(new Date(iso+'T12:00')).map(t=>t.id+'('+t.left+'d)').join(' '),iso);
 for(const d of ['2026-11-03','2027-01-15','2027-04-10','2027-07-20','2027-10-01','2026-12-06'])console.log('  running on',d,':',await at(d));
 ok('today: autumn and Brazilian new crop running',/autumn/.test(await at('2026-11-03'))&&/brcrop/.test(await at('2026-11-03')));
 ok('in December: winter and the AeroPress final',/winter/.test(await at('2026-12-06'))&&/finals/.test(await at('2026-12-06')));
 ok('next one to start',await p.evaluate(()=>{const n=seasonNext();return n&&n.n+' in '+n.days+' days'}));
 // earn autumn: coffees from 3 origins added this autumn
 const r=await p.evaluate(()=>{const t=todayISO();const base=BEANS[0];for(const [i,o] of [['a','kenya'],['b','colombia'],['c','brazil']])BEANS.push(Object.assign(JSON.parse(JSON.stringify(base)),{id:'ssn'+i+'1234',name:'Test '+o,origin:o,tried:t,diary:[]}));saveBeans();checkTrophies();return Object.keys(TGOT).filter(k=>/-\d{4}$/.test(k))});
 ok('Harvest moon and Brazilian new crop earned, kept with the year',r.includes('autumn-2026')&&r.includes('brcrop-2026'),r);
 // log brews to get Ten brews
 await p.evaluate(()=>{for(let i=0;i<10;i++)LOG.unshift({id:'tl'+i,ts:Date.now()-i*864e5,date:new Date(Date.now()-i*864e5).toISOString(),coffee:'x',snap:{b:i%3?'v60':'aeropress',rec:i===0?'Pan Wei (Barista 2026)':'The Ultimate V60'}});save('bb-log',LOG);checkTrophies()});
 ok('brew trophies earned',await p.evaluate(()=>['brew10','streak','champ'].filter(k=>TGOT[k])),['brew10','streak','champ']);
 await p.evaluate(()=>{showTab('beans');BVIEW='coffees';renderBeans()});await p.waitForTimeout(600);
 ok('This season card on Coffees',await p.evaluate(()=>!!document.querySelector('#bv-coffees .season')));
 await p.evaluate(()=>document.querySelector('#bv-coffees .season').scrollIntoView({block:'center'}));await p.waitForTimeout(300);await p.screenshot({path:D+'season-card.png'});
 await p.evaluate(()=>[...document.querySelectorAll('#bg-views button')].find(b=>b.textContent.startsWith('Passport')).click());await p.waitForTimeout(500);
 console.log('PP:',await p.evaluate(()=>{const e=document.getElementById('bv-passport');return e.hidden+' '+e.innerText.slice(0,200).replace(/\n/g,' | ')}));await p.evaluate(()=>openTrophies());await p.waitForTimeout(600);ok('Trophies page shows the season, seasonal trophies and all trophies',await p.evaluate(()=>{const t=document.querySelector('#vd-in').innerText;return /This season/i.test(t)&&/Seasonal trophies/i.test(t)&&/Trophies/i.test(t)}));
 await p.evaluate(()=>document.querySelector('#vd .season').scrollIntoView({block:'start'}));await p.waitForTimeout(300);await p.screenshot({path:D+'season-passport.png'});
 ok('no errors',!errs.length,errs);await b.close()})();
