// Your scans can be tidied: delete one, or clear every scan already in your gallery at once (with undo).
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));
await p.evaluate(()=>{const B=JSON.parse(localStorage.getItem('bb-beans'));const mk=(i,name,roaster)=>({id:'scan'+i+'aaaa',t:'',info:{},sc:{origin:'ethiopia',process:'washed',variety:'arabica',roast:'light',date:'',name,roaster},when:'1/1/2026'});
  localStorage.setItem('bb-scans',JSON.stringify([mk(1,B[0].name,B[0].roaster),mk(2,'Not in gallery','Nobody'),mk(3,B[1].name,B[1].roaster),mk(4,'Another','Nobody')]))});
await p.reload();await p.waitForTimeout(1500);await p.evaluate(()=>goTab('beans'));await p.waitForFunction(()=>window.BEANS_OK);
await p.evaluate(()=>document.querySelector('#bg-hero [data-view="scans"]').click());await p.waitForTimeout(600);
const n0=await p.evaluate(()=>[SCANS.length,SCANS.filter(scanBean).length]);
ok('the scans list offers to clear the ones in your gallery',await p.evaluate(()=>!!$('sc-tidy')),n0);
await p.evaluate(()=>$('sc-tidy').click());await p.waitForTimeout(300);
ok('cleared: only scans not in the gallery are left',await p.evaluate(()=>SCANS.length===2&&!SCANS.some(scanBean)&&!$('sc-tidy')&&JSON.parse(localStorage.getItem('bb-scans')).length===2));
await p.evaluate(()=>[...document.querySelectorAll('#toast button')].find(x=>/undo/i.test(x.textContent)).click());await p.waitForTimeout(300);
ok('undo brings them back',await p.evaluate(()=>SCANS.length===4));
await p.evaluate(()=>document.querySelector('[data-scandel="1"]').click());await p.waitForTimeout(300);
ok('one scan deleted',await p.evaluate(()=>SCANS.length===3&&!SCANS.some(s=>s.sc.name==='Not in gallery')&&document.querySelectorAll('#bv-scans .srow').length===3));
await p.screenshot({path:'shots/sctidy.png'});
ok('no errors',!errs.length,errs);await b.close()})();
