// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,v,x)=>console.log((v?'ok  ':'FAIL')+' '+n+(x!==undefined?'  ('+JSON.stringify(x).slice(0,300)+')':''));
await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));
await p.evaluate(async()=>{const bs=JSON.parse(localStorage.getItem('bb-beans'));const y=new Date().getFullYear();const cv=document.createElement('canvas');cv.width=600;cv.height=800;const x=cv.getContext('2d');
  for(const [i,bb] of bs.entries()){bb.shelf=i<4;bb.bag=250;bb.tried=y+'-03-1'+i;if(i%2===0){x.fillStyle='hsl('+i*40+',50%,45%)';x.fillRect(0,0,600,800);await BIMG.put(bb.id,cv.toDataURL('image/jpeg',.85));bb.img=true}}
  localStorage.setItem('bb-beans',JSON.stringify(bs));const t={};t[y]={ids:bs.slice(0,5).map(b=>b.id),hm:[bs[5].id,bs[6].id],snap:[]};localStorage.setItem('bb-top3',JSON.stringify(t))});
await p.reload();await p.waitForTimeout(2000);
const r=await p.evaluate(async()=>{const y=new Date().getFullYear(),out=[];
  const docs=[['recipes',()=>recipesDoc()],['recipe',()=>recipeDoc(3)],['dial',()=>dialDoc()],['variety',()=>varietyDoc(V[0].id)],['origin',()=>originDoc(Object.keys(ALLO())[0])],['history',()=>historyDoc()],
    ['logEntry',()=>logEntryDoc(LOG[0])],['log',()=>logDoc()],['champ',()=>champDoc(CHAMPS[0])],['words',()=>wordsDoc()],['flow',()=>flowDoc()],['wheel',()=>wheelDoc()],
    ['bean',()=>beanDoc(BEANS[0])],['top5',()=>top5Doc(y)],['shelf',()=>shelfDoc()],['gallery',()=>galleryDoc()],['advent',()=>{if(!CALS.length){CALS.push(okCal({id:'advaudit',name:'Audit Advent',roaster:'Archers',year:2026,notes:'A fine box.'}));BEANS.slice(0,5).forEach((b,i)=>b.cal={id:'advaudit',d:i*3+1})}return calDoc(CALS[0])}]];
  try{await loadPDF()}catch(e){out.push({k:'pdf-load',err:String(e)})}
  const bad=/undefined|NaN|\[object|null(?![a-z])/;
  for(const [k,f] of docs){const o={k};try{const d=f();o.title=d.title;const t=docText(d);o.textLen=t.length;o.textBad=(t.match(bad)||[])[0]||'';const s=shareText(d);o.shareBad=(s.match(bad)||[])[0]||'';
      try{const pdf=await docPDF(d);o.pdf=pdf?pdf.size:0;o.pdfType=pdf&&pdf.type}catch(e){o.pdfErr=String(e).slice(0,120)}
      if(d.card){o.cards=[];for(const mode of ['dark','light'])for(const [col] of cardCols()){const keep=Object.assign({},CARD_STYLE);Object.assign(CARD_STYLE,{mode,col});const s0=performance.now();
          try{const bl=await d.card();const bm=bl&&await createImageBitmap(bl);o.cards.push([mode,col,bm?bm.width:0,bm?bm.height:0,Math.round(performance.now()-s0)])}catch(e){o.cards.push([mode,col,'ERR '+String(e).slice(0,80)])}finally{Object.assign(CARD_STYLE,keep)}}}
    }catch(e){o.err=String(e).slice(0,160)}out.push(o)}
  return out});
for(const o of r){if(o.err){ok(o.k+': builds',false,o.err);continue}
  ok(o.k+': text has no undefined/NaN',!o.textBad&&!o.shareBad,o.textBad||o.shareBad||o.textLen);
  ok(o.k+': PDF',!o.pdfErr&&o.pdf>500,o.pdfErr||o.pdf);
  if(o.cards){// A very long card (every coffee word) is drawn a little smaller so it fits a canvas; it must stay readable (1000+ wide).
    const badc=o.cards.filter(x=>typeof x[2]!=='number'||x[3]<800||(x[3]<=12000?x[2]!==1620:x[2]<1000||x[3]>32000));const t=o.cards.map(x=>x[4]).filter(Number.isFinite);
    ok(o.k+': card in all '+o.cards.length+' looks',!badc.length,badc.length?badc:{h:[...new Set(o.cards.map(x=>x[3]))],ms:Math.round(t.reduce((a,b)=>a+b,0)/t.length)+' avg / '+Math.max(...t)+' max'})}}
console.log('errors',errs);await b.close()})();
