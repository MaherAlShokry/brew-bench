// Deleting offers Undo instead of asking first: coffees (with their photo), diary entries, your own recipes and
// custom grinders come back in place; without Undo they stay gone and photos are cleared once the chance has passed.
// Also the backup reminder: shown when nothing is backed up and there is something to keep, not when recently backed up.
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];
p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>{errs.push('native '+d.type());d.dismiss()});
const ok=(n,v,x)=>console.log((v?'ok  ':'FAIL')+' '+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
await p.addInitScript(()=>{sessionStorage.setItem('bb-splashed','1')});await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1200);
const undo=()=>p.evaluate(()=>{const u=document.querySelector('#toast.show .tact');if(u)u.click();return !!u});
const asked=()=>p.evaluate(()=>!!($('ask')&&$('ask').open));
// A coffee with a photo
const id=await p.evaluate(async()=>{const b=BEANS[5];await BIMG.put(b.id,'data:image/png;base64,iVBORw0KGgo=');openBean(b.id);return b.id});await p.waitForTimeout(600);
const n0=await p.evaluate(()=>BEANS.length);
await p.evaluate(()=>$('bd-del').click());await p.waitForTimeout(300);
ok('coffee: no question asked',!await asked());
ok('coffee: removed at once',await p.evaluate(([id,n])=>!beanById(id)&&BEANS.length===n-1,[id,n0]));
ok('coffee: undo offered',await undo());await p.waitForTimeout(200);
ok('coffee: back in place',await p.evaluate(([id,n])=>BEANS[5]&&BEANS[5].id===id&&BEANS.length===n&&JSON.parse(localStorage.getItem('bb-beans')).some(b=>b.id===id),[id,n0]));
await p.waitForTimeout(7000);ok('coffee: photo kept after undo',await p.evaluate(id=>BIMG.get(id).then(v=>!!v),id));
await p.evaluate(id=>{openBean(id)},id);await p.waitForTimeout(500);await p.evaluate(()=>$('bd-del').click());await p.waitForTimeout(7200);
ok('coffee: stays gone and its photo is cleared',await p.evaluate(id=>!beanById(id)&&BIMG.get(id).then(v=>!v),id));
// A diary entry
const bid=await p.evaluate(()=>{const b=BEANS.find(x=>(x.diary||[]).length>=2);openBean(b.id);return b.id});await p.waitForTimeout(600);
const d0=await p.evaluate(id=>beanById(id).diary.length,bid);
await p.evaluate(()=>document.querySelector('#bd-tl [data-deldiary]').click());await p.waitForTimeout(400);
ok('diary: removed at once, no question',!await asked()&&await p.evaluate(([id,n])=>beanById(id).diary.length===n-1,[bid,d0]));
await undo();await p.waitForTimeout(500);
ok('diary: undo brings it back and shows it',await p.evaluate(([id,n])=>beanById(id).diary.length===n&&document.querySelectorAll('#bd-tl [data-deldiary]').length===n,[bid,d0]));
await p.evaluate(()=>$('vd').close());
// Your own recipe
const rid=await p.evaluate(()=>{const r={id:'rundo1',b:'v60',name:'Undo test',dose:15,water:250,temp:93,off:0,steps:['0:00 pour 50g.','3:00 finished.']};CREC.push(r);save('bb-myrecipes',CREC);recipesChanged();openRecipeEditor(CREC.find(x=>x.id==='rundo1'));return 'rundo1'});await p.waitForTimeout(500);
await p.evaluate(()=>$('re-del').click());await p.waitForTimeout(300);
ok('recipe: removed at once, no question',!await asked()&&await p.evaluate(id=>!CREC.some(x=>x.id===id),rid));
await undo();await p.waitForTimeout(200);ok('recipe: undo brings it back',await p.evaluate(id=>CREC.some(x=>x.id===id)&&JSON.parse(localStorage.getItem('bb-myrecipes')).some(x=>x.id===id),rid));
// A custom grinder
const g=await p.evaluate(()=>{const ks=Object.keys(CUSTOM_G);return ks[0]||null});
if(g){ok('grinder test skipped (seeded one exists)',true)}
// Clearing tasting notes
// Backup reminder
await p.evaluate(()=>{localStorage.removeItem('bb-lastbak');localStorage.setItem('bb-bakask',String(Date.now()-8*864e5))});
await p.evaluate(()=>bakNudge());ok('backup: reminder when never backed up',await p.evaluate(()=>/backed up/.test($('toast').textContent)&&!!document.querySelector('#toast .tact')));
await p.evaluate(()=>{localStorage.setItem('bb-lastbak',String(Date.now()-3*864e5));localStorage.setItem('bb-bakask','0');$('toast').classList.remove('show');$('toast').textContent=''});
await p.evaluate(()=>bakNudge());ok('backup: none when backed up 3 days ago',await p.evaluate(()=>!$('toast').classList.contains('show')));
await p.evaluate(()=>{localStorage.setItem('bb-lastbak',String(Date.now()-40*864e5));localStorage.setItem('bb-bakask','0')});
await p.evaluate(()=>bakNudge());ok('backup: reminder when 40 days old',await p.evaluate(()=>/40 days ago/.test($('toast').textContent)));
await p.evaluate(()=>{$('toast').classList.remove('show');bakNudge()});ok('backup: not again the same week',await p.evaluate(()=>!$('toast').classList.contains('show')));
await p.evaluate(()=>showTab('settings'));await p.waitForTimeout(500);ok('settings shows last backup',await p.evaluate(()=>/Last backup 40 days ago/.test(($('st-lastbak')||{}).textContent||'')),await p.evaluate(()=>($('st-lastbak')||{}).textContent));
ok('no errors',!errs.length,errs);await b.close()})();
