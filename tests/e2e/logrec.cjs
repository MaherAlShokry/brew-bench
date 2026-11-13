// A logged brew keeps its recipe: renamed later, the entry shows the new name and its card still uses that recipe;
// deleted, the entry says it's no longer in the app. Brews from before keys were kept get one, once, from their name.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,v,x)=>console.log((v?'ok  ':'FAIL')+' '+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(1500);
// An old entry (no key) with a built-in recipe's name, then the one-time fill-in on reload.
await p.evaluate(()=>{const r=RECIPES[0];LOG.unshift({id:'oldrk1',ts:Date.now()-864e5,date:'x',coffee:'Old',settings:'',stars:4,snap:{b:r.b,rec:r.name,dose:20,water:300,t:92}});save('bb-log',LOG);localStorage.removeItem('bb-lrk')});
await p.reload();await p.waitForTimeout(2500);await p.evaluate(()=>{goTab('log')});await p.waitForTimeout(1200);
const mig=await p.evaluate(()=>{const l=LOG.find(x=>x.id==='oldrk1');return{rk:l.snap.rk,want:rkey(RECIPES[0])}});ok('an older brew gets its recipe’s key once',mig.rk===mig.want,mig);
// Your own recipe, a brew with it, then a rename.
const r=await p.evaluate(()=>{const n=sanRec({b:'v60',name:'Morning cup',dose:15,water:250,temp:93,off:0,steps:['0:00 pour 50g.','0:45 pour to 250g.'],ts:Date.now()});saveRecipe(n);
  const i=RECIPES.findIndex(x=>x.id===n.id),rk=rkey(RECIPES[i]);LOG.unshift({id:'rk1',ts:Date.now(),date:'x',coffee:'A coffee',settings:'',stars:5,snap:{b:'v60',rec:'Morning cup',rk,dose:15,water:250,t:93}});save('bb-log',LOG);
  const before=logPills(LOG[0]).pills.find(x=>x[0]==='rec')[1];const c=CREC.find(x=>x.id===n.id);c.name='Weekday cup';save('bb-myrecipes',CREC);recipesChanged();
  const after=logPills(LOG[0]).pills.find(x=>x[0]==='rec')[1],linked=snapRecipe(okSnap(LOG[0].snap));return{before,after,linked:linked&&linked.name,id:n.id}});
ok('renamed, the entry shows the recipe’s new name and stays linked to it',r.before==='Morning cup'&&r.after==='Weekday cup'&&r.linked==='Weekday cup',r);
const gone=await p.evaluate(id=>{const c=CREC.find(x=>x.id===id);deleteRecipe(c);return logPills(LOG.find(x=>x.id==='rk1')).pills.find(x=>x[0]==='rec')[1]},r.id);
ok('deleted, the entry says so instead of pointing nowhere',/no longer in the app/.test(gone),gone);
ok('no errors',!errs.length,errs);await b.close()})();
