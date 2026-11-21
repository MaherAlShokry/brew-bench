// Settings and profile, overhauled: Settings opens with you (a row that opens your profile); every on/off choice is a
// switch at the end of its line that flips at once; the accent is one row of colour dots; the About links are rows, not
// underlined text, with the build at the foot. The profile's edit is a round button and its numbers one strip of four.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const p=await b.newPage({viewport:{width:360,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1500);
const r=await p.evaluate(async()=>{const w=t=>new Promise(r=>setTimeout(r,t)),o={};goTab('settings');await w(500);
  const me=$('st-me');o.me={first:$('settings-in').firstElementChild===me,name:me&&me.textContent.includes(PROFILE.nick)};
  o.sw=[...document.querySelectorAll('#settings-in .tgl')].map(t=>t.id);
  o.inline=[...document.querySelectorAll('#settings-in .tgl')].every(t=>{const a=t.getBoundingClientRect(),b=t.closest('.sl').querySelector('b').getBoundingClientRect();return Math.abs((a.top+a.bottom)/2-(b.top+b.bottom)/2)<14&&a.right<=innerWidth});
  const sw=$('st-motion'),before=sw.getAttribute('aria-checked');sw.click();await w(50);o.flip={before,after:$('st-motion').getAttribute('aria-checked'),motion:UI.motion};$('st-motion').click();await w(50);o.flip.back=UI.motion;
  const dots=[...document.querySelectorAll('#settings-in .swatch')].map(s=>s.getBoundingClientRect().top);o.oneRow=dots.length>1&&dots.every(t=>Math.abs(t-dots[0])<2);
  o.under=[...document.querySelectorAll('#settings-in a')].filter(a=>getComputedStyle(a).textDecorationLine!=='none').map(a=>a.textContent);
  o.foot=($('settings-in').querySelector('.st-foot')||{}).textContent;
  me.click();await w(700);const d=document.querySelector('dialog[open]');o.prof={open:!!d&&!!d.dataset.me,edit:(()=>{const e=$('pf-edit').getBoundingClientRect();return Math.abs(e.width-e.height)<2&&!$('pf-edit').textContent.trim()})(),
    nums:document.querySelectorAll('.me-nums>span').length,numsTop:[...document.querySelectorAll('.me-nums>span')].map(s=>Math.round(s.getBoundingClientRect().top))};
  d&&d.close();return o});
ok('Settings opens with you, a tap from your profile',r.me.first&&r.me.name,r.me);
ok('on/off choices are switches at the end of their line',['st-resume','st-views','st-motion','st-rep'].every(id=>r.sw.includes(id))&&r.inline,r.sw);
ok('a switch flips at once and back',r.flip.before==='false'&&r.flip.after==='true'&&r.flip.motion==='reduced'&&r.flip.back==='full',r.flip);
ok('the accent is one row of colour dots',r.oneRow);
ok('no underlined links; the build at the foot',!r.under.length&&/The Brew Bench/.test(r.foot||''),r);
ok('profile: round edit button, four numbers in one strip',r.prof.open&&r.prof.edit&&r.prof.nums===4&&new Set(r.prof.numsTop).size===1,r.prof);
ok('no page errors',!errs.length,errs);await b.close()})();
