const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const found=new Map();
for(const th of ['light','dark']){const c=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
await c.addInitScript(t=>{sessionStorage.setItem('bb-splashed','1');localStorage.setItem('bb-theme',t)},th);const p=await c.newPage();
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(800);
const scan=async lbl=>{const r=await p.evaluate(()=>{const out=[];const root=document.querySelector('dialog[open]')||document.querySelector('main section.on');if(!root)return out;
 for(const e of root.querySelectorAll('button,span,i,a')){const t=e.textContent.trim();if(!t||[...t].length>2||/[\w\d]/.test(t)||e.children.length)continue;const r=e.getBoundingClientRect();if(!r.width||r.width<14||r.height<14)continue;
  const cs=getComputedStyle(e);if(cs.display==='inline'&&e.tagName!=='BUTTON')continue;
  const rg=document.createRange();rg.selectNodeContents(e);const g=rg.getBoundingClientRect();
  // ink box of the glyph via canvas
  const cv=document.createElement('canvas');const ctx=cv.getContext('2d');ctx.font=cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;const m=ctx.measureText(t);
  const inkTop=g.top+(g.height/2)+( (m.fontBoundingBoxAscent-m.fontBoundingBoxDescent)/2 )-m.actualBoundingBoxAscent;const inkBot=inkTop+m.actualBoundingBoxAscent+m.actualBoundingBoxDescent;
  const inkL=g.left+(g.width-m.width)/2-m.actualBoundingBoxLeft+ (m.width/2) - m.width/2,inkR=g.left+(g.width-m.width)/2+m.actualBoundingBoxRight;
  const dy=((inkTop+inkBot)/2)-(r.top+r.height/2),dx=((g.left+(g.width-m.width)/2-m.actualBoundingBoxLeft+inkR)/2)-(r.left+r.width/2);
  if(Math.abs(dy)>1.6||Math.abs(dx)>1.6)out.push(t+' '+(e.className||e.tagName)+' dx '+dx.toFixed(1)+' dy '+dy.toFixed(1)+' in '+Math.round(r.width)+'x'+Math.round(r.height))}
 return out});r.forEach(x=>{if(!found.has(x))found.set(x,lbl+'/'+th)})};
for(const t of ['dial','recipes','beans','explore','gear','settings','log','scan']){try{await p.evaluate(t=>goTab(t),t)}catch(e){continue}await p.waitForTimeout(500);await scan(t)}
for(const [n,f] of [['editor',()=>openBeanEditor()],['bean',()=>openBean(BEANS[0].id)],['recipe',()=>openRecipe(0)],['variety',()=>openVariety('geisha')],['notes',()=>openNotesPicker()]]){try{await p.evaluate(f);await p.waitForTimeout(500);await scan('dlg:'+n);await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));await p.waitForTimeout(300)}catch(e){}}
await c.close()}
for(const [k,v] of found)console.log(v.padEnd(22),k);console.log('total',found.size);await b.close()})()
