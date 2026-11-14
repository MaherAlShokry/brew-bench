// Roasteries: logos (added on a roastery's page, shown wherever it appears), the roastery box's suggestions (yours first
// with logo and count, the app's list while typing), and the scanner's memory: a name in your spelling, a roastery
// known from the words on its bags, and from the look of its bags (another coffee in the same bag).
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,v,x)=>console.log((v?'ok  ':'FAIL')+' '+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1500);
await p.evaluate(()=>goTab('beans'));await p.waitForFunction(()=>window.BEANS_OK);
// Two Kuf coffees in the same blue bag (with photos), one Julith in a yellow one.
await p.evaluate(async()=>{const bag=(bg,fg,shift)=>{const c=document.createElement('canvas');c.width=600;c.height=800;const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,600,800);g.fillStyle=fg;g.fillRect(120+shift,180,360,420);g.fillStyle='#e8d2b0';g.fillRect(420+shift,40,120,700);return c.toDataURL('image/jpeg',.9)};
  BEANS[0].roaster='Kuf Roastery';BEANS[0].name='Zamzam';BEANS[1].roaster='Kuf Roastery';BEANS[1].name='Bani Matar';BEANS[2].roaster='Julith Coffee';
  await BIMG.put(BEANS[0].id,bag('#1d3f8f','#f4f1ea',0));await BIMG.put(BEANS[1].id,bag('#1d3f8f','#f4f1ea',8));await BIMG.put(BEANS[2].id,bag('#f2c230','#1a1a1a',0));
  for(const i of [0,1,2])BEANS[i].img=true;saveBeans();window.__bag=bag});
// 1. Your spelling.
const canon=await p.evaluate(()=>[roCanon('KUF ROASTERY'),roCanon('kuf'),roCanon('Kufa Coffee'),roCanon('Julith'),roCanon('Brand New Roasters')]);
ok('a name read off a label takes your spelling',canon[0]==='Kuf Roastery'&&canon[1]==='Kuf Roastery'&&canon[3]==='Julith Coffee',canon);
ok('but a different roastery isn’t folded into one you have',canon[2]==='Kufa Coffee'&&canon[4]==='Brand New Roasters',canon);
// 2. The words on its bags.
const w=await p.evaluate(()=>{roLearnWords('Kuf Roastery','KUF ROASTERY\nZamzam\nkufroastery.com\nRiyadh · Saudi Arabia\nNet weight 250 g');roLearnWords('Julith Coffee','julith\nIndonesia Sindoro\n@julithcoffee\nPeach Pear Jasmine');
  return[roByWords('Bani Matar\nKUF\nkufroastery.com\nYemen'),roByWords('Peach\n@julithcoffee\nGeisha'),roByWords('Ethiopia Guji\nNatural\nBlueberry')]});
ok('a label sharing a roastery’s words is that roastery’s',w[0]==='Kuf Roastery'&&w[1]==='Julith Coffee',w);
ok('a label with none of them is nobody’s',w[2]==='',w);
// 3. The look of its bags: the gallery is learnt, then a new coffee in the same bag is matched; another bag isn't.
await p.evaluate(()=>roLearnGallery());await p.waitForFunction(()=>Object.keys(RMEM.v).length>=3,null,{timeout:15000});
const look=await p.evaluate(async()=>[await roByLook(__bag('#1d3f8f','#f4f1ea',4)),await roByLook(__bag('#2a8f4f','#111111',0)),await roByLook(__bag('#f2c230','#1a1a1a',6))]);
ok('a new coffee in a bag you know is matched to its roastery',look[0]==='Kuf Roastery'&&look[2]==='Julith Coffee',look);
ok('a bag unlike any you have is matched to none',look[1]==='',look);
// In a real scan (pasted label text with no roastery name), the roastery comes from memory and the status says how.
await p.evaluate(()=>goTab('scan'));await p.waitForTimeout(400);
await p.evaluate(async()=>{newScan();$('scan-text').value='Bani Matar\nYemen\nNatural\nKUF\nRiyadh\nRoasted 2026-11-01';await runLocalScan(false)});await p.waitForTimeout(600);
const sc=await p.evaluate(()=>({r:SC.roaster,how:SC.roHow,st:$('scan-status').textContent,box:$('s-roaster').value}));
ok('a scan with no roastery on it gets it from what the scanner remembers, and says so',sc.r==='Kuf Roastery'&&sc.how==='words'&&sc.box==='Kuf Roastery'&&/Kuf Roastery, from words on its other bags/.test(sc.st),sc);
// Logos.
await p.evaluate(async()=>{goTab('beans');const c=document.createElement('canvas');c.width=c.height=120;const g=c.getContext('2d');g.fillStyle='#1d3f8f';g.fillRect(0,0,120,120);await setRoLogo('Kuf Roastery',c.toDataURL('image/png'))});
const lg=await p.evaluate(()=>({mark:/ro-mark logo/.test(roMark('Kuf Roastery')),plain:/ro-mark logo/.test(roMark('Julith Coffee'))}));
ok('a roastery with a logo shows it, one without keeps its initials',lg.mark&&!lg.plain,lg);
await p.evaluate(()=>openRoasterNow('Kuf Roastery'));await p.waitForTimeout(500);
const rp=await p.evaluate(()=>({btn:!!$('ro-logo'),img:!!document.querySelector('.ro-title .ro-mark.logo img'),rm:!!$('ro-logo-rm')}));
ok('its page shows the logo, to change or remove',rp.btn&&rp.img&&rp.rm,rp);
ok('Remove sits in the pen\u2019s menu, not on the page',await p.evaluate(()=>$('ro-logo-menu').hidden&&!!$('ro-logo-menu').contains($('ro-logo-rm'))));await p.evaluate(()=>$('ro-logo').click());await p.waitForTimeout(150);ok('the pen opens it',await p.evaluate(()=>!$('ro-logo-menu').hidden));await p.evaluate(()=>$('ro-logo-rm').click());await p.waitForTimeout(500);ok('removing it brings back the initials',await p.evaluate(()=>!/ro-mark logo/.test(roMark('Kuf Roastery'))&&!document.querySelector('.ro-title .ro-mark.logo')));
await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));await p.waitForTimeout(400);
// The roastery box: yours first with their counts; the app's list joins in as you type.
await p.evaluate(()=>openBeanEditor(null));await p.waitForTimeout(700);
await p.click('#be-roaster');await p.type('#be-roaster','ku');await p.waitForTimeout(300);
const dd=await p.evaluate(()=>[...document.querySelectorAll('#be-rsug .aco')].map(o=>o.querySelector('b').textContent+'|'+o.querySelector('small').textContent));
ok('typing shows your roastery first, with how many coffees',dd[0]==='Kuf Roastery|2 coffees',dd);
const wide=await p.evaluate(()=>{const l=$('be-rsug').getBoundingClientRect(),r=$('be-roaster').closest('.two').getBoundingClientRect();return Math.abs(l.width-r.width)<2});
ok('the list is as wide as the row',wide);
await p.tap('#be-rsug [data-i="0"]');await p.waitForTimeout(200);ok('tapping one fills it in',await p.evaluate(()=>$('be-roaster').value==='Kuf Roastery'));
await p.fill('#be-roaster','');await p.type('#be-roaster','spec');await p.waitForTimeout(300);
ok('the app’s roastery list joins in while typing',await p.evaluate(()=>[...document.querySelectorAll('#be-rsug small')].some(s=>s.textContent==='In the roastery list')));
ok('no errors',!errs.length,errs);await b.close()})();
