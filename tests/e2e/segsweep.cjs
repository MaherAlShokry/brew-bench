// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
// Every selection highlight, on every page and in the sheets, after the things that move them (text size, light or
// dark, a vibe): each visible highlight sits on its picked option, chip rows have none, and every picked option shows
// as picked (its highlight, or its own background).
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},colorScheme:'dark',isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));
await p.evaluate(()=>localStorage.setItem('bb-ui',JSON.stringify({vibe:'pure'})));await p.reload();await p.waitForTimeout(1500);
await p.evaluate(()=>{loadRecipe(0);document.querySelectorAll('#dial details.dstep').forEach(d=>d.open=true)});await p.waitForTimeout(400);
const F=[];let seen=0;
const audit=async where=>{await p.waitForTimeout(220);const r=await p.evaluate(()=>{const out=[];let n=0;const vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight};
  for(const s of document.querySelectorAll('.seg')){if(!vis(s))continue;const on=s.querySelector(':scope>button[aria-pressed="true"]'),ind=s.querySelector(':scope>.seg-ind'),id=s.id||s.className;n++;
    if(s.matches('.seg.filters:not(.gtabs)')&&(ind||s.classList.contains('has-ind'))){out.push(id+': chip row has a gliding highlight');continue}
    if(!on)continue;const showsInd=ind&&getComputedStyle(ind).opacity!=='0';
    if(showsInd){const a=ind.getBoundingClientRect(),o=on.getBoundingClientRect(),off=Math.abs(a.left-o.left)+Math.abs(a.top-o.top)+Math.abs(a.width-o.width);if(off>3)out.push(id+': highlight '+Math.round(off)+'px off its pick')}
    else{const bg=getComputedStyle(on).backgroundColor,bi=getComputedStyle(on).backgroundImage,bs=getComputedStyle(on).boxShadow;if(bg==='rgba(0, 0, 0, 0)'&&bi==='none'&&bs==='none'&&!getComputedStyle(on).borderColor.match(/rgb\(/))out.push(id+': picked option shows nothing')}}
  // A highlight whose strip is out of view isn't drawn somewhere else.
  for(const i of document.querySelectorAll('.seg-ind')){if(getComputedStyle(i).opacity==='0'||!vis(i))continue;const s=i.parentElement,sr=s.getBoundingClientRect(),a=i.getBoundingClientRect();if(a.top<sr.top-3||a.bottom>sr.bottom+3||a.left<sr.left-3||a.right>sr.right+3)out.push((s.id||s.className)+': highlight outside its strip')}
  return{out,n}});seen+=r.n;r.out.forEach(x=>F.push(where+': '+x))};
const pages=['dial','recipes','beans','explore','settings','log','gear','guide','scan','history','map','words','process'];
const sweep=async tag=>{for(const t of pages){await p.evaluate(t=>goTab(t),t);for(const y of [0,1100,2200]){await p.evaluate(y=>scrollTo(0,y),y);await audit(tag+' '+t+'@'+y)}}
  for(const [n,f] of [['recipe sheet','openRecipe(3)'],['coffee sheet','openBean(BEANS[0].id)'],['log filter','goTab("log");openLogFilter()']]){await p.evaluate(f=>(0,eval)(f),f);await audit(tag+' '+n);await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()))}};
await sweep('start');
for(const [tag,f] of [['text L','document.querySelector("#st-text [data-v=l]").click()'],['light','document.querySelector("#st-mode [data-v=light]").click()']]){
  await p.evaluate(()=>goTab('settings'));await p.waitForTimeout(400);await p.evaluate(f=>(0,eval)(f),f);await p.waitForTimeout(500);await sweep(tag)}
await p.evaluate(()=>goTab('settings'));await p.waitForTimeout(400);await p.evaluate(()=>{const v=document.querySelector('.vibe[data-vibe]:not([aria-pressed="true"])');v&&v.click()});await sweep('vibe');
console.log('strips checked',seen);if(F.length)console.log('FAIL '+F.length+':\n  '+[...new Set(F)].slice(0,40).join('\n  '));else console.log('ok   every highlight sits on its pick');
if(errs.length)console.log('FAIL errors',errs);await b.close()})();
