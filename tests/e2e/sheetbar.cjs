// The pinned action bar on recipe-style sheets: there when a sheet opens, out of the way while you scroll down to read,
// back when you scroll up, and at the end it rests below everything, covering nothing. Its buttons still work.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1500);
const st=()=>p.evaluate(()=>{const d=$('vd'),a=d.querySelector('.sheet-acts');if(!a)return null;const r=a.getBoundingClientRect();
  return {off:a.classList.contains('sa-off'),inView:r.bottom<=innerHeight+1&&r.top>=0,top:r.top,bottom:r.bottom,left:r.left,right:r.right}});
const scrollTo=async y=>{await p.evaluate(y=>{$('vd').scrollTop=y},y);await p.waitForTimeout(380)};
const sheets=[['recipe',"openRecipe(RECIPES.findIndex(r=>/10-pour/.test(r.name)))"],['champion',"openChamp(CHAMPS.find(c=>c.rec&&c.who==='Emi Fukahori'))"],
  ['compare',"openCompareNow(RECIPES.findIndex(r=>/10-pour/.test(r.name)),RECIPES.findIndex(r=>/Emi/.test(r.name)))"]];
for(const [n,js] of sheets){await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));await p.waitForTimeout(400);await p.evaluate(js);await p.waitForTimeout(900);
  const s0=await st();ok(n+': the bar shows when it opens',s0&&!s0.off&&s0.inView,s0);
  const H=await p.evaluate(()=>$('vd').scrollHeight-$('vd').clientHeight);if(H<200){ok(n+': long enough to scroll',false,H);continue}
  await scrollTo(60);await scrollTo(Math.round(H/2));const s1=await st();ok(n+': out of the way while scrolling down',s1.off,s1);
  ok(n+': hiding it leaves the sheet the same height',await p.evaluate(()=>$('vd').scrollHeight-$('vd').clientHeight)===H,[H,await p.evaluate(()=>$('vd').scrollHeight-$('vd').clientHeight)]);
  await scrollTo(Math.round(H/2)-120);const s2=await st();ok(n+': back on scrolling up',!s2.off&&s2.inView,s2);
  await scrollTo(Math.round(H/2)+100);await scrollTo(H);const s3=await st();ok(n+': there at the end',!s3.off&&s3.inView,s3);
  // At the end nothing sits under it.
  const hid=await p.evaluate(()=>{const d=$('vd'),a=d.querySelector('.sheet-acts'),r=a.getBoundingClientRect(),out=[];
    for(const e of d.querySelectorAll('.vd-body *')){if(a.contains(e)||e.contains(a)||!e.getClientRects().length)continue;if(![...e.childNodes].some(x=>x.nodeType===3&&x.textContent.trim())&&!/^(IMG|svg|BUTTON|INPUT)$/.test(e.tagName))continue;
      const q=e.getBoundingClientRect();if(q.width&&q.height&&q.top<r.bottom-1&&q.bottom>r.top+1&&q.left<r.right-1&&q.right>r.left+1)out.push(e.tagName+' '+e.textContent.trim().slice(0,30))}return out});
  ok(n+': at the end it covers nothing',!hid.length,hid)}
// Still works: Start timer from the recipe's bar, after scrolling.
await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));await p.waitForTimeout(400);
await p.evaluate(()=>openRecipe(RECIPES.findIndex(r=>/Rao-style/.test(r.name))));await p.waitForTimeout(900);await scrollTo(99999);
await p.click('#vd .sheet-acts [data-timer]');await p.waitForTimeout(900);ok('Start timer from the bar opens the timer',await p.evaluate(()=>!!$('tm-title')&&$('tm-title').textContent.includes('Rao')));
ok('no page errors',!errs.length,errs);await b.close()})();
