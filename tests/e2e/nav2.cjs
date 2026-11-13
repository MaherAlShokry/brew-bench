const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await ctx.route(/.*/,r=>r.request().url().startsWith('http://localhost')?r.continue():r.abort());
 const p=await ctx.newPage();await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(800);
 for(const [what,act] of [['right',()=>p.tap('.bottomnav [data-bn="recipes"]')],['left',()=>p.tap('.bottomnav [data-bn="dial"]')],['push',async()=>{await p.tap('.bottomnav [data-bn="explore"]');await p.waitForTimeout(900);await p.evaluate(()=>document.querySelector('#explore-in [data-go="map"]').click())}],['pop',()=>p.goBack()]]){
   await p.evaluate(()=>{window.__r=null;const o=document.startViewTransition.bind(document);document.startViewTransition=f=>{const t=o(f);t.ready.then(()=>{__r=document.getAnimations().map(a=>(a.effect.pseudoElement||a.effect.target.className||a.effect.target.tagName)+':'+a.animationName+':'+Math.round(a.effect.getTiming().duration))}).catch(e=>__r='skipped '+e.message);return t}});
   await act();await p.waitForTimeout(150);console.log(what.padEnd(5),JSON.stringify(await p.evaluate(()=>__r)));await p.waitForTimeout(900)}
 await b.close()})();
