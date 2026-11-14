// Tasting notes are never dropped by accident: a long list from a scanned label keeps every whole note (up to the 12
// a coffee holds), retyping a note you have doesn't remove it, and Backspace in the empty box needs a second press.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,v,x)=>console.log((v?'ok  ':'FAIL')+' '+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(1200);
const sn=await p.evaluate(()=>{const l=['Blackcurrant','Grapefruit','Cane sugar','Red apple','Jasmine','Bergamot','Milk chocolate','Hibiscus','Passion fruit','Lemon blossom'];return{out:scanNotes(l),n:scanNotes(l).split(', ').length}});
ok('a long list of scanned notes keeps every whole note',sn.n===10&&!/\b\w+$/.test('')&&sn.out.endsWith('Lemon blossom'),sn);
await p.evaluate(()=>{goTab('beans');openBeanEditor(null,{flavours:'Orange, Vanilla'})});await p.waitForTimeout(500);
await p.fill('#tn-q','orange');await p.keyboard.press('Enter');await p.waitForTimeout(200);
const t1=await p.evaluate(()=>[...document.querySelectorAll('#tn-sel .tn-x')].map(x=>x.textContent.trim()));ok('retyping a note you have keeps it',t1.join()==='Orange,Vanilla',t1);
await p.fill('#tn-q','');await p.focus('#tn-q');await p.keyboard.press('Backspace');await p.waitForTimeout(100);
const t2=await p.evaluate(()=>({n:document.querySelectorAll('#tn-sel .tn-x').length,arm:!!document.querySelector('#tn-sel .tn-x.arm')}));ok('one Backspace only marks the last note',t2.n===2&&t2.arm,t2);
await p.keyboard.press('Backspace');await p.waitForTimeout(100);ok('a second removes it',await p.evaluate(()=>document.querySelectorAll('#tn-sel .tn-x').length===1));
await p.click('#tn-sel .tn-x button');await p.waitForTimeout(100);ok('the × still removes a note at once',await p.evaluate(()=>document.querySelectorAll('#tn-sel .tn-x').length===0));
// Notes that differ only by an accent are two notes: picking Rose (the flower) from the list adds Rose, not Rosé.
await p.focus('#tn-q');await p.fill('#tn-q','rose');await p.waitForTimeout(150);
const ro=await p.evaluate(()=>[...document.querySelectorAll('#tn-list [role=option] .tn-on')].map(x=>x.textContent));
ok('typing rose puts Rose first',ro[0]==='Rose'&&ro.includes('Rosé'),ro);
await p.tap('#tn-list [data-i="'+ro.indexOf('Rosé')+'"]');await p.waitForTimeout(150);
await p.focus('#tn-q');await p.fill('#tn-q','rose');await p.waitForTimeout(150);await p.tap('#tn-list [data-i="0"]');await p.waitForTimeout(150);
const t3=await p.evaluate(()=>[...document.querySelectorAll('#tn-sel .tn-x')].map(x=>x.textContent.trim()));ok('the picked option is the one added, and Rosé and Rose sit side by side',t3.join()==='Rosé,Rose',t3);
ok('no errors',!errs.length,errs);await b.close()})();
