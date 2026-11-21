// The Brew welcome follows the day: in the morning your last brew again and the timer, in the afternoon Surprise me,
// in the evening the diary and tomorrow's coffee from your cabinet; each pill does what it says.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(2500);
const r=await p.evaluate(()=>{const at=h=>{const d=new Date();d.setHours(h,0,0,0);const x=document.createElement('div');x.innerHTML=welcomeHTML(d).html;return[...x.querySelectorAll('[data-wa]')].map(b=>b.dataset.wa)};
  return{m:at(8),d:at(14),e:at(20),n:at(2),shown:document.querySelectorAll('#welcome [data-wa]').length}});
ok('morning: brew again and the timer',r.m.join()==='again,timer',r);
ok('afternoon: Surprise me',r.d[0]==='make',r);
ok('evening and late: the diary and tomorrow\'s coffee',r.e.join()==='diary,tomorrow'&&r.n.join()==='diary,tomorrow',r);
ok('the welcome shows them now',r.shown>0,r);
const c=await p.evaluate(async()=>{const w=t=>new Promise(r=>setTimeout(r,t)),el=$('welcome'),o={};
  el.innerHTML=welcomeHTML((()=>{const d=new Date();d.setHours(20);return d})()).html;el.querySelector('[data-wa="diary"]').click();await w(600);o.diary=BVIEW==='diary'&&document.querySelector('main section.on').id==='beans';
  goTab('dial');await w(400);el.innerHTML=welcomeHTML((()=>{const d=new Date();d.setHours(20);return d})()).html;el.querySelector('[data-wa="tomorrow"]').click();await w(600);o.bean=$('vd').open&&!!$('vd').dataset.bean;document.querySelectorAll('dialog[open]').forEach(d=>d.close());
  el.innerHTML=welcomeHTML((()=>{const d=new Date();d.setHours(14);return d})()).html;el.querySelector('[data-wa="make"]').click();await w(700);o.make=!!document.querySelector('dialog[open] .mk-ht');document.querySelectorAll('dialog[open]').forEach(d=>d.close());
  el.innerHTML=welcomeHTML((()=>{const d=new Date();d.setHours(8);return d})()).html;el.querySelector('[data-wa="again"]').click();await w(700);o.timer=$('timer').open;if($('timer').open)$('timer').close();return o});
ok('each pill opens its page: diary, tomorrow\'s coffee, Surprise me, the timer',c.diary&&c.bean&&c.make&&c.timer,c);
ok('no page errors',!errs.length,errs);await b.close()})();
