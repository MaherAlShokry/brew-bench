// The app behaves and looks the same everywhere.
// Back: every sheet closes on back with the page behind it where it was, and every page opened from Explore returns
// to Explore at the same spot. Look: across the forms and lists (add a coffee, a recipe, the log, settings, scan, brew, recipes, beans, words), main
// buttons, secondary buttons, text boxes, search bars and field labels each share one size, corner and type.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1800);
await p.evaluate(()=>goTab('beans'));await p.waitForFunction(()=>window.BEANS_OK);await p.waitForTimeout(500);
const back=async()=>{await p.evaluate(()=>bbBack());await p.waitForTimeout(650)};
// 1. Every sheet: back closes it and the page behind stays where it was.
const SHEETS={bean:'openBean(BEANS[0].id)',beanEdit:'openBeanEditor(null)',recipe:'openRecipe(0)',variety:"openVariety('geisha')",origin:"openOrigin('kenya')",trophies:'openTrophies()',
  me:'openMe()',logFilter:'openLogFilter()',tips:'openTips()',flow:'openFlowStep(FLOW[0].id)',champ:'openChamp(CHAMPS[0])',share:'openShareNow(beanDoc(BEANS[0]))',speed:'openSpeed()',
  roastery:"openRoaster('Archers')",roasteries:'openRoasters()',compare:'openCompare(0,1)',comparePick:'openComparePick(0)'};
const bad=[];
for(const [name,open] of Object.entries(SHEETS)){await p.evaluate(()=>scrollTo(0,500));await p.waitForTimeout(150);const y0=await p.evaluate(()=>Math.round(scrollY));
  await p.evaluate(o=>eval(o),open);await p.waitForTimeout(650);const opened=await p.evaluate(()=>!!document.querySelector('dialog[open]'));
  await back();const s=await p.evaluate(()=>({open:!!document.querySelector('dialog[open]:not(.closing)'),y:Math.round(scrollY),beans:$('beans').classList.contains('on')}));
  if(!opened||s.open||!s.beans||Math.abs(s.y-y0)>4)bad.push([name,{opened,...s,y0}]);
  await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));await p.waitForTimeout(300)}
ok('every sheet: back closes it, the page behind where it was',!bad.length,bad);
// 2. Every page opened from Explore: back returns to Explore at the same spot.
await p.evaluate(()=>showTab('explore'));await p.waitForTimeout(500);const subs=['tech','gear','map','variety','champs','flow','words','wheel','history','process','guide'];const bad2=[];
for(const id of subs){await p.evaluate(()=>scrollTo(0,400));await p.waitForTimeout(150);const y0=await p.evaluate(()=>Math.round(scrollY));
  await p.evaluate(id=>showTab(id),id);await p.waitForTimeout(500);await p.evaluate(()=>scrollTo(0,200));await back();
  const s=await p.evaluate(()=>({on:(document.querySelector('main section.on')||{}).id,y:Math.round(scrollY)}));if(s.on!=='explore'||Math.abs(s.y-y0)>4){bad2.push([id,s,y0]);await p.evaluate(()=>showTab('explore'));await p.waitForTimeout(400)}}
ok('every Explore page: back returns to Explore where you were',!bad2.length,bad2);
// 3. The forms share one look per kind of control.
const FORMS={beanEdit:['openBeanEditor(null)','dialog[open]'],recipeEdit:['openRecipeEditor(null)','dialog[open]'],log:["goTab('log')",'#log'],settings:["goTab('settings')",'#settings'],scan:["goTab('scan')",'#scan'],dial:["goTab('dial')",'#dial'],recipes:["goTab('recipes');showRecipeList&&showRecipeList()",'#recipes'],beans:["goTab('beans')",'#beans'],words:["showTab('words')",'#words']};
const looks={};
for(const [name,[open,root]] of Object.entries(FORMS)){await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));await p.waitForTimeout(350);
  await p.evaluate(o=>eval(o),open);await p.waitForTimeout(700);
  const r=await p.evaluate(root=>{const R=[...document.querySelectorAll(root)].pop();if(!R)return[];const out=[];const vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&(!e.checkVisibility||e.checkVisibility({visibilityProperty:true,contentVisibilityAuto:true}))&&!e.closest('details:not([open])')};
    const sig=(e,kind,withH=true)=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return[kind,(withH?'h'+Math.round(r.height)+' ':'')+'r'+s.borderTopLeftRadius+' '+s.fontSize+' '+s.fontWeight,(e.textContent||e.placeholder||e.id||'').trim().slice(0,24)]};
    // Main and secondary buttons in the forms' own rows (small chips, link-style buttons and the last brew's row of
    // icon buttons are their own kinds). Only what's on screen: not the inside of a closed panel.
    R.querySelectorAll('button.btn:not(.mini):not(.sm):not(.linkbtn)').forEach(e=>vis(e)&&!e.closest('.ls-t,.hero,.herowrap,.rhome,.lb-act')&&out.push(sig(e,e.classList.contains('ghost')?'secondary button':'main button')));
    // Text boxes (the timeline's compact step rows and the dial tiles' numbers are their own kinds).
    R.querySelectorAll('input[type=text],input[type=date],input[type=search],input:not([type]),textarea').forEach(e=>vis(e)&&!e.closest('.se-row,.re-num,.tl')&&out.push(sig(e.closest('.lf-q')||e,e.tagName==='TEXTAREA'?'text area':e.closest('.lf-q')?'search bar':'text box',e.tagName!=='TEXTAREA')));
    R.querySelectorAll('.field>label,.two>.field>label,label.fl').forEach(e=>vis(e)&&out.push(sig(e,'field label',false)));
    return out},root);
  for(const [k,sg,t] of r){(looks[k]=looks[k]||{});(looks[k][sg]=looks[k][sg]||[]).push(name+':'+t)}}
for(const k of Object.keys(looks).sort()){const v=Object.entries(looks[k]).sort((a,b)=>b[1].length-a[1].length);
  ok(k.replace(/x$/,'xe')+'s look the same in every form ('+v[0][0]+', '+v[0][1].length+' of them)',v.length===1,[v[0][1].slice(0,3).join(', ')].concat(v.slice(1).map(([s,l])=>s+' → '+l.slice(0,4).join(', '))))}
ok('no errors',!errs.length,errs);await b.close()})();
