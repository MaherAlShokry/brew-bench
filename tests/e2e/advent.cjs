// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();let fails=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fails++};
for(const [mode,w] of [['light',390],['dark',320]]){const c=await b.newContext({viewport:{width:w,height:844},colorScheme:mode});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1200);await p.evaluate(()=>showTab('beans'));await p.waitForTimeout(800);
ok(await p.$('.adv-invite'),'invite shows in season ('+mode+')');
await (await p.$('.adv-invite')).scrollIntoViewIfNeeded();await p.screenshot({path:'adv-inv-'+mode+'.png'});
await p.click('.adv-invite');await p.waitForTimeout(400);
await p.fill('#ac-name','Coffee Advent 2026');await p.fill('#ac-roaster','Archers');await p.fill('#ac-year','2026');
await p.screenshot({path:'adv-ed-'+mode+'.png'});
await p.click('#ac-save');await p.waitForTimeout(500);
ok(await p.evaluate(()=>CALS.length===1&&CALS[0].n===24&&CALS[0].g===50),'calendar saved with 24 × 50 g');
ok(await p.$$eval('.adv-door',l=>l.length)===24,'24 doors');
// open door 1, add a coffee
await p.click('[data-door="1"]');await p.waitForTimeout(400);
ok(await p.evaluate(()=>document.getElementById('vd-title').textContent.startsWith('Door 1')),'editor titled for door 1');
ok(await p.evaluate(()=>$('be-roaster').value==='Archers'&&$('be-bag').value==='50'),'roaster and 50 g filled in');
await p.fill('#be-name','Kenya Kiambu');await p.selectOption('#be-origin',{index:5});await p.click('#be-save');await p.waitForTimeout(600);
ok(await p.$('.adv-door.on[data-door="1"]'),'door 1 shows as opened');
ok(await p.evaluate(()=>{const b=BEANS.find(x=>x.cal);return b&&b.cal.d===1&&b.tried==='2026-12-01'||b.tried===todayISO()}),'coffee linked to door 1');
// add door 2 with rating via data
await p.evaluate(()=>{const c=CALS[0];BEANS.unshift(okBean({id:'advtest2',name:'Ethiopia Guji',roaster:'Archers',origin:BEANS.find(x=>x.cal).origin,rating:4.5,cal:{id:c.id,d:2},ts:Date.now()}));BEANS.find(x=>x.cal&&x.cal.d===1).rating=3.5;saveBeans();openCal(c.id)});await p.waitForTimeout(400);
ok(await p.$('.adv-door.on[data-door="2"] .adv-dr'),'door 2 shows its rating');
ok(await p.evaluate(()=>/2 of 24/.test(document.querySelector('.adv-ph b').textContent)),'progress 2 of 24');
ok(await p.$$eval('#vd-in .clist .crow',l=>l.length)===2,'best of the box lists 2');
// box review
await p.fill('#adv-notes','Great range, lots of Kenya.');await p.dispatchEvent('#adv-notes','change');
ok(await p.evaluate(()=>CALS[0].notes==='Great range, lots of Kenya.'),'box review saved');
const h=await p.evaluate(()=>document.querySelector('#vd-in').scrollHeight);await p.setViewportSize({width:w,height:Math.min(h+40,3200)});await p.waitForTimeout(300);
await p.screenshot({path:'adv-cal-'+mode+'.png'});await p.setViewportSize({width:w,height:844});
// open door coffee and go back
await p.click('[data-door="2"]');await p.waitForTimeout(500);
ok(await p.$('#bd-advback'),'door coffee has a back-to-calendar button');
const ov=await p.evaluate(()=>{const a=document.getElementById('bd-advback').getBoundingClientRect(),t=document.querySelector('.vd-tools').getBoundingClientRect();return a.right<=t.left||a.bottom<=t.top||a.top>=t.bottom});ok(ov,'back button clear of header icons');
ok(await p.evaluate(()=>[...document.querySelectorAll('.specs b')].some(x=>x.textContent==='Advent')),'Advent fact shown');
await p.screenshot({path:'adv-bean-'+mode+'.png'});
await p.click('#bd-advback');await p.waitForTimeout(400);ok(await p.$('.adv-grid'),'back returns to the calendar');
await p.click('#adv-share');await p.waitForTimeout(600);ok(await p.evaluate(()=>SHDOC&&SHDOC.blocks.some(b=>b.list&&b.list.length===2)&&!/undefined|NaN/.test(JSON.stringify(SHDOC.blocks))),'share doc lists the doors');
await p.evaluate(()=>{const d=document.getElementById('sharesheet');if(d&&d.open)d.close()});await p.waitForTimeout(300);
// card on coffees page
await p.evaluate(()=>{const d=$('vd');if(d.open)d.close();renderBeans()});await p.waitForTimeout(500);
ok(await p.$('.adv-card'),'calendar card on the Coffees page');await (await p.$('.adv-card')).scrollIntoViewIfNeeded();await p.screenshot({path:'adv-card-'+mode+'.png'});
// filter
ok(await p.evaluate(()=>BFILTERS.some(f=>f[0]==='advent')&&BEANS.filter(b=>bfKeep(b,'advent')).length===2),'Advent filter finds 2');
// total rating = average of rated door coffees (3.5 and 4.5)
ok(await p.evaluate(()=>{openCal(CALS[0].id);return document.querySelector('.adv-big').textContent.startsWith('4.0')&&/Average of the 2 coffees/.test(document.querySelector('.adv-sl small').textContent)}),'total rating is the average of rated doors (4.0)');
ok(await p.evaluate(()=>!document.querySelector('#adv-rate')&&![...document.querySelectorAll('.adv-door')].some(x=>/Next/.test(x.textContent))&&!/Next/.test(document.querySelector('.adv-ph').textContent)),'no own-rating input, no "Next"');
// back gesture from a door's coffee and from a door's editor stays in the calendar
await p.click('[data-door="2"]');await p.waitForTimeout(600);ok(await p.evaluate(()=>document.getElementById('vd-title').textContent==='Ethiopia Guji'),'door 2 opens its coffee');
await p.goBack();await p.waitForTimeout(700);ok(await p.evaluate(()=>$('vd').open&&!!document.querySelector('.adv-grid')),'back from a door coffee returns to the calendar');
await p.click('[data-door="5"]');await p.waitForTimeout(600);ok(await p.evaluate(()=>/^Door 5/.test(document.getElementById('vd-title').textContent)),'door 5 opens its editor');
await p.goBack();await p.waitForTimeout(700);ok(await p.evaluate(()=>$('vd').open&&!!document.querySelector('.adv-grid')),'back from a door editor returns to the calendar');
await p.click('[data-door="2"]');await p.waitForTimeout(600);await p.click('#bd-edit');await p.waitForTimeout(400);await p.click('#be-save');await p.waitForTimeout(500);
ok(await p.evaluate(()=>document.getElementById('vd-title').textContent==='Ethiopia Guji'),'editing a door coffee returns to that coffee');
await p.goBack();await p.waitForTimeout(700);ok(await p.evaluate(()=>$('vd').open&&!!document.querySelector('.adv-grid')),'...and back from there to the calendar');
await p.goBack();await p.waitForTimeout(700);ok(await p.evaluate(()=>!$('vd').open),'back from the calendar closes it');
// a photo for the calendar
await p.evaluate(async()=>{const cv=document.createElement('canvas');cv.width=320;cv.height=200;const x=cv.getContext('2d');const g=x.createLinearGradient(0,0,320,200);g.addColorStop(0,'#7a1f2b');g.addColorStop(1,'#d9a441');x.fillStyle=g;x.fillRect(0,0,320,200);x.fillStyle='#fff';x.font='bold 40px sans-serif';x.fillText('24',130,115);
  await BIMG.put(CALS[0].id,cv.toDataURL('image/jpeg'));CALS[0].img=true;saveCals();renderBeans();openCal(CALS[0].id)});await p.waitForTimeout(700);
ok(await p.evaluate(()=>!!document.querySelector('.adv-hero img')),'calendar photo shows on its page');
// ranking against a second calendar from another roastery
await p.evaluate(()=>{CALS.push(okCal({id:'advcal2',roaster:'Spirit Hub',year:2026}));BEANS.unshift(okBean({id:'advtest3',name:'Yemen Haraz',roaster:'Spirit Hub',rating:5,cal:{id:'advcal2',d:1},ts:Date.now()}));saveBeans();saveCals();openCal(CALS[0].id)});await p.waitForTimeout(400);
ok(await p.evaluate(()=>/#2 of your 2 calendars/.test(document.querySelector('.adv-sl small').textContent)),'ranked #2 of 2');
const h2=await p.evaluate(()=>document.querySelector('#vd-in').scrollHeight);await p.setViewportSize({width:w,height:Math.min(h2+40,3200)});await p.waitForTimeout(300);await p.screenshot({path:'adv-cal2-'+mode+'.png'});await p.setViewportSize({width:w,height:844});
// animation frames: door opening
await p.evaluate(()=>{const g=document.querySelector('.adv-grid');g.scrollIntoView({block:'start'})});await p.waitForTimeout(200);
await p.click('[data-door="7"]');await p.waitForTimeout(160);await p.screenshot({path:'adv-anim-'+mode+'.png'});await p.waitForTimeout(700);
await p.goBack();await p.waitForTimeout(250);await p.screenshot({path:'adv-anim2-'+mode+'.png'});await p.waitForTimeout(900);
await p.evaluate(()=>{$('vd').close();renderBeans()});await p.waitForTimeout(500);
ok(await p.$$eval('.adv-rr',l=>l.length)===2,'ranked list shows both calendars');
ok(await p.evaluate(()=>document.querySelector('.adv-rr .adv-rt b').textContent==='Spirit Hub'),'higher rated box first');
ok(await p.evaluate(()=>!!document.querySelector('.adv-card .adv-thumb')),'card shows the calendar photo');
await (await p.$('.adv-h')).scrollIntoViewIfNeeded();await p.waitForTimeout(300);await p.screenshot({path:'adv-rank-'+mode+'.png'});
await p.evaluate(()=>{CALS=CALS.filter(c=>c.id!=='advcal2');BEANS=BEANS.filter(b=>b.id!=='advtest3');saveBeans();saveCals()});
// persistence
await p.reload();await p.waitForTimeout(1000);ok(await p.evaluate(()=>CALS.length===1&&BEANS.filter(b=>b.cal).length===2),'survives a reload');
// remove
await p.evaluate(()=>{showTab('beans');openCal(CALS[0].id)});await p.waitForTimeout(400);await p.click('#adv-del');await p.waitForTimeout(300);await p.click('#ask-ok');await p.waitForTimeout(400);
ok(await p.evaluate(()=>!CALS.length&&!BEANS.some(b=>b.cal)&&BEANS.some(b=>b.id==='advtest2')),'removing keeps the coffees, unlinks them');
ok(!errs.length,'no errors '+JSON.stringify(errs));await c.close()}
console.log('fails',fails);await b.close()})();
