// Recipes you make get the same checks as the built-in ones: notes in the editor when the steps don't pour the
// recipe's water, a running total is off, times go backwards or a step's temperature isn't the recipe's. Saving
// a recipe that adds up shows none, and notes never stop it being saved.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,v,x)=>console.log((v?'ok  ':'FAIL')+' '+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(1200);
const u=await p.evaluate(()=>{const base={name:'x',b:'v60',dose:20,water:300,temp:93,steps:['0:00 pour 60g.','0:45 pour to 180g.','1:30 pour to 300g.']};
  return{good:recipeIssues(base),short:recipeIssues(Object.assign({},base,{steps:['0:00 pour 60g.','0:45 pour to 180g.','1:30 pour to 280g.']})),
    run:recipeIssues(Object.assign({},base,{steps:['0:00 pour 60g.','0:45 pour 60g (to 130g).','1:30 pour 180g (to 300g).']})),back:recipeIssues(Object.assign({},base,{steps:['0:00 pour 60g.','1:30 pour to 180g.','0:45 pour to 300g.']})),
    temp:recipeIssues(Object.assign({},base,{steps:['0:00 pour 60g at 85°C.','0:45 pour to 300g.']})),iced:recipeIssues(Object.assign({},base,{name:'Iced',steps:['0:00 pour 60g.','0:45 pour to 180g.']})),
    builtins:RECIPES.filter(r=>!r.custom&&!/(Cup|AeroPress|Championship)[^)]*\d{4}/.test(r.name)).map(r=>[r.name,recipeIssues(r)]).filter(x=>x[1].length)}});
ok('a recipe that adds up has no notes, and neither does any built-in one',!u.good.length&&!u.builtins.length,u);
ok('short pours, a wrong running total, times going backwards and a step’s own temperature are each noted',/280 g/.test(u.short[0]||'')&&/130g/.test(u.run[0]||'')&&/backwards/.test(u.back.join())&&/85°C/.test(u.temp.join()),u);
ok('an iced recipe (water on ice) isn’t held to its water total',!u.iced.length,u.iced);
// In the editor.
await p.evaluate(()=>{goTab('recipes');openRecipeEditor(null)});await p.waitForTimeout(400);
await p.fill('#re-name','My test');await p.fill('#re-water','400');await p.dispatchEvent('#re-water','input');await p.waitForTimeout(400);
const ed=await p.evaluate(()=>({shown:!$('re-check').hidden,text:$('re-check').textContent}));ok('the editor shows the note as you change the water',ed.shown&&/400 g/.test(ed.text),ed);
await p.click('#re-save');await p.waitForTimeout(500);ok('notes don’t stop it being saved',await p.evaluate(()=>CREC.some(r=>r.name==='My test')));
ok('no errors',!errs.length,errs);await b.close()})();
