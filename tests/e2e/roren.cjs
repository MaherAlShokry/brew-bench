// A roastery can be renamed, or merged into another (its coffees, logo and star move across), and the Roastery view
// sorts by most coffees, highest rated or most recent.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1500);
await p.evaluate(()=>goTab('beans'));await p.waitForFunction(()=>window.BEANS_OK);await p.waitForTimeout(300);
const [a,c]=await p.evaluate(()=>{const r=roasteries();return [r[r.length-1].name,r[0].name]});
const na=await p.evaluate(a=>roFind(a).list.length,a),nc=await p.evaluate(c=>roFind(c).list.length,c);
await p.evaluate(a=>{setFavRo(a);openRoasterNow(a)},a);await p.waitForTimeout(500);
ok('a roastery page has rename or merge at the top',await p.evaluate(()=>!!document.querySelector('.vd-tools #ro-ren')));
await p.evaluate(()=>$('ro-ren').click());await p.waitForTimeout(300);
await p.fill('#rn-name','Renamed Roasters');await p.evaluate(()=>$('rn-save').click());await p.waitForTimeout(500);
ok('renamed: its coffees and your star follow',await p.evaluate(([a,n])=>!roFind(a)&&roFind('Renamed Roasters').list.length===n&&favRo()==='Renamed Roasters'&&$('vd-title').textContent==='Renamed Roasters',[a,na]));
await p.evaluate(()=>$('ro-ren').click());await p.waitForTimeout(300);
await p.evaluate(c=>[...document.querySelectorAll('[data-into]')].find(x=>x.dataset.into===c).click(),c);await p.waitForTimeout(500);
ok('merged: one roastery with both lists',await p.evaluate(([c,n])=>!roFind('Renamed Roasters')&&roFind(c).list.length===n&&roKey(favRo())===roKey(c),[c,na+nc]));
await p.evaluate(()=>$('vd').close());await p.waitForTimeout(400);
await p.evaluate(()=>[...document.querySelectorAll('#bg-views button')].find(x=>x.textContent.trim()==='Roastery').click());await p.waitForTimeout(600);
for(const [k,lab,chk] of [['rated','Highest rated',r=>r.every((x,i)=>!i||x.avg<=r[i-1].avg)],['recent','Most recent',r=>r.every((x,i)=>!i||x.last<=r[i-1].last)],['count','Most coffees',r=>r.every((x,i)=>!i||x.list.length<=r[i-1].list.length)]]){
  await p.evaluate(()=>$('rov-sort').click());await p.waitForTimeout(500);
  await p.evaluate(lab=>{const x=[...document.querySelectorAll('#selsheet button')].find(x=>x.textContent.trim().startsWith(lab));x.click();const d=document.querySelector('#selsheet .btn:not(.ghost),#sel-ok,#ch-ok');if(d)d.click()},lab);await p.waitForTimeout(600);
  const r=await p.evaluate(()=>{const m=new Map(roasteries().map(r=>[r.name,{avg:r.avg,last:r.last,list:r.list}]));return [...document.querySelectorAll('#bv-roasteries .clist .rov-row')].map(x=>m.get(x.dataset.ro)).filter(Boolean).map(r=>({avg:r.avg,last:r.last,list:{length:r.list.length}}))});
  ok('sorted: '+lab,r.length>1&&chk(r),r.slice(0,4));}
await p.screenshot({path:'shots/rosort.png'});
ok('no errors',!errs.length,errs);await b.close()})();
