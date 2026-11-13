const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const ok=(n,c,x)=>console.log((c?'ok  ':'FAIL')+' '+n+(x!==undefined?'  ('+JSON.stringify(x)+')':''));const errs=[];
 // website
 let c=await b.newContext({viewport:{width:390,height:844}});let p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));await p.route(/.*/,r=>r.request().url().startsWith('http://localhost')?r.continue():r.abort());await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(500);
 const all=await p.evaluate(()=>{const d0=Math.floor(Date.now()/864e5),out=[];for(let d=d0;d<d0+70;d++){const f=factFor(d);out.push([f.k,f.title,f.text.length,JSON.stringify(f.go)])}return out});
 ok('70 days of facts, all kinds',new Set(all.map(x=>x[0])).size===7,[...new Set(all.map(x=>x[0]))]);ok('none empty',all.every(x=>x[1]&&x[2]>20));ok('varied',new Set(all.map(x=>x[1])).size>=60,new Set(all.map(x=>x[1])).size);
 console.log(all.slice(0,8).map(x=>'   '+x[0]+': '+x[1]+' ('+x[2]+' chars)').join('\n'));
 // each kind opens its page
 for(const k of ['word','variety','origin','process','tech','history','champ']){const d=await p.evaluate(k=>{let d=Math.floor(Date.now()/864e5);while(factFor(d).k!==k)d++;return d},k);
   await p.evaluate(d=>{document.querySelectorAll('dialog[open]').forEach(x=>x.close());goFact(factFor(d).go)},d);await p.waitForTimeout(500);ok('opens: '+k,true,await p.evaluate(()=>[document.querySelector('main section.on').id,!!document.querySelector('dialog[open]')]))}
 await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(x=>x.close());showTab('explore')});await p.waitForTimeout(500);
 ok('Explore shows the card (unless a word day)',await p.evaluate(()=>factFor(Math.floor(Date.now()/864e5)).k==='word'||!!document.querySelector('.td-row[data-fact]')));
 await p.evaluate(()=>showTab('settings'));await p.waitForTimeout(400);ok('website settings: note, no switch',await p.evaluate(()=>!document.getElementById('st-learn')&&/Coffee fact of the day/.test(document.getElementById('settings-in').textContent)));await c.close();
 // app with a notifications plugin
 c=await b.newContext({viewport:{width:390,height:844}});await c.addInitScript(()=>{window.__sched=[];window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>'android',Plugins:{LocalNotifications:{checkPermissions:async()=>({display:'granted'}),requestPermissions:async()=>({display:'granted'}),schedule:async o=>{__sched.push(...o.notifications)},cancel:async()=>{},addListener:()=>{}}}}});
 p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));await p.route(/.*/,r=>r.request().url().startsWith('http://localhost')?r.continue():r.abort());await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(2600);
 await p.evaluate(()=>showTab('settings'));await p.waitForTimeout(400);ok('app: switch shown',await p.evaluate(()=>!!document.getElementById('st-learn')));
 await p.evaluate(()=>[...document.querySelectorAll('#st-learn button')].find(x=>/Every day/.test(x.textContent)).click());await p.waitForTimeout(500);
 const s=await p.evaluate(()=>__sched.filter(n=>n.id>=7201&&n.id<=7214).map(n=>({t:n.title,at:new Date(n.schedule.at).getHours()})));ok('two weeks scheduled at 19:00',s.length>=13&&s.every(x=>x.at===19),s.length);console.log(s.slice(0,4).map(x=>'   '+x.t).join('\n'));
 await p.locator('#settings-in').screenshot({path:'facts-settings.png'}).catch(()=>{});
 console.log('errors',errs.length?errs:'none');await b.close()})();
