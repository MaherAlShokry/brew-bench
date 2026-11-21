// A recipe keeps its own timings on the Brew page: the bloom starts from the recipe's (Deep 27 five pours blooms 30 s,
// so its second pour stays at 0:30), very fresh beans add 10 s to it rather than jumping to the brewer's 55 s, and a
// bloom left over from before this was fixed (the tuned one, never changed by hand) becomes the recipe's on load.
// The steps don't repeat waits the times already give.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(1200);
const i=await p.evaluate(()=>RECIPES.findIndex(r=>r.name==='Deep 27 five pours'));
const a=await p.evaluate(i=>{const c=a=>plan({brewer:'deep27',tech:i,goal:'balance',amt:'mid',roast:'light',process:'washed',variety:'caturra',age:a,grinder:'zp6',dose:15});
  return{b14:c(14).bloom,b5:c(5).bloom,waits:RECIPES[i].steps.filter(s=>/wait/i.test(s)).length}},i);
ok('the plan keeps the recipe\'s 30 s bloom',a.b14===30,a);
ok('very fresh beans: the recipe\'s bloom plus 10 s',a.b5===40,a);
ok('no "wait" in steps whose times already give it',a.waits===0,a);
// A state saved before the fix: this recipe, with the brewer's 50 s bloom tuned in and never changed.
await p.evaluate(i=>{const s=JSON.parse(localStorage.getItem('bb-state')||'{}');Object.assign(s,{brewer:'deep27',rec:i,reck:rkey(RECIPES[i]),bloom:50,tuned:{bloom:50}});
  localStorage.setItem('bb-state',JSON.stringify(s));localStorage.removeItem('bb-bloomfix');
  const u=JSON.parse(localStorage.getItem('bb-ui')||'{}');u.resume='keep';localStorage.setItem('bb-ui',JSON.stringify(u))},i);
await p.reload();await p.waitForTimeout(1200);
const c=await p.evaluate(()=>({bloom:S.bloom,second:(dialPlan()||{steps:[]}).steps[1]}));
ok('an old tuned 50 s bloom becomes the recipe\'s 30 s',c.bloom===30&&/^0:30 /.test(c.second||''),c);
// A bloom you set yourself stays.
await p.evaluate(i=>{const s=JSON.parse(localStorage.getItem('bb-state'));Object.assign(s,{bloom:50,tuned:{bloom:40}});localStorage.setItem('bb-state',JSON.stringify(s));localStorage.removeItem('bb-bloomfix')},i);
await p.reload();await p.waitForTimeout(1200);
ok('a bloom you set yourself stays',await p.evaluate(()=>S.bloom)===50);
ok('no page errors',!errs.length,errs);await b.close()})();
