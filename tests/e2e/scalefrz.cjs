// A recipe scales to any dose (water and every step follow) and has an iced version (part of the water as ice). A coffee
// on the shelf can go in the freezer: its days off roast stop counting until it comes out.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1500);
const i=await p.evaluate(()=>RECIPES.findIndex(r=>r.water&&r.dose));
await p.evaluate(i=>openRecipe(i),i);await p.waitForTimeout(500);
const r0=await p.evaluate(i=>({d:RECIPES[i].dose,w:RECIPES[i].water,dd:$('rs-d').textContent,ww:$('rs-w').textContent}),i);
ok('the scaler starts at the recipe',parseFloat(r0.dd)===r0.d&&parseFloat(r0.ww)===r0.w,r0);
await p.evaluate(()=>{for(let k=0;k<3;k++)document.querySelector('[data-rsd="1"]').click()});await p.waitForTimeout(200);
const r1=await p.evaluate(()=>({dd:parseFloat($('rs-d').textContent),ww:parseFloat($('rs-w').textContent)}));
ok('more coffee, more water in the same ratio',r1.dd>r0.d&&Math.abs(r1.ww/r1.dd-r0.w/r0.d)<0.6,r1);
await p.evaluate(()=>$('rs-ice').click());await p.waitForTimeout(200);
ok('the iced version puts ice in the server',await p.evaluate(()=>/ice/i.test($('rs-body').textContent)&&$('rs-ice').getAttribute('aria-pressed')==='true'));
await p.screenshot({path:'shots/scale.png'});
await p.evaluate(()=>bbBack&&bbBack());await p.waitForTimeout(500);
const id=await p.evaluate(()=>{const b=BEANS.find(x=>x.shelf&&x.roastDate);b.roastDate=new Date(Date.now()-20*864e5).toISOString().slice(0,10);b.frz=[[new Date(Date.now()-10*864e5).toISOString().slice(0,10),new Date(Date.now()-4*864e5).toISOString().slice(0,10)]];saveBeans();return b.id});
const d0=await p.evaluate(id=>fresh(beanById(id)).d,id);
ok('days in the freezer don\'t count',d0===14,d0);
await p.evaluate(id=>{goTab('beans');openBean(id)},id);await p.waitForTimeout(600);
await p.evaluate(()=>$('bd-frz').click());await p.waitForTimeout(500);
const f=await p.evaluate(id=>{const b=beanById(id);return{fz:isFrozen(b),lbl:fresh(b).label,pressed:$('bd-frz').getAttribute('aria-pressed')}},id);
ok('into the freezer: freshness on hold',f.fz&&f.lbl==='Frozen'&&f.pressed==='true',f);
await p.screenshot({path:'shots/frozen.png'});
await p.evaluate(()=>$('bd-frz').click());await p.waitForTimeout(500);
ok('out again: it counts again',await p.evaluate(id=>!isFrozen(beanById(id))&&fresh(beanById(id)).d===14,id));
ok('no errors',!errs.length,errs);await b.close()})();
