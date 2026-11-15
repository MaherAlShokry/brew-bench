// Screenshot check for a pull request: every main page (top and scrolled), the Beans views, the main sheets and the +
// menu, light and dark, from the base build (BASE, default port 8098) and the pull request's build (PR, port 8099),
// with the same data and clock, animations off. Lists every view that differs and by how much (share of pixels), and
// keeps each pair side by side in shotdiff/ for review. Writes shotdiff.md (for the PR comment). Never fails: a change
// can be intended; the list is there so nothing changes unnoticed.
// Usage: node tools/shotdiff.cjs   (needs Playwright; serve both builds first)
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const seed=require(path.join(__dirname,'..','tests','e2e','seed2.cjs'));
const BASE=+(process.env.BASE||8098),PR=+(process.env.PR||8099),OUT='shotdiff';
async function shots(b,port,scheme){const c=await b.newContext({viewport:{width:390,height:844},colorScheme:scheme,isMobile:true,hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'});
  await c.route(/.*/,r=>r.request().url().startsWith('http://localhost')?r.continue():r.abort());const p=await c.newPage();
  await p.addInitScript(s=>{sessionStorage.setItem('bb-splashed','1');Date.now=(n=>()=>n)(Date.UTC(2026,10,15,10,0,0));Math.random=()=>.42;if(!localStorage.getItem('bb-seeded')){eval('('+s+')()');localStorage.setItem('bb-seeded','1')}window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>'android',Plugins:{}}},seed.toString());
  await p.goto('http://localhost:'+port+'/index.html');await p.waitForTimeout(6000);
  await p.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'});
  const out={};const snap=async k=>{await p.waitForTimeout(350);out[k]=await p.screenshot()};
  for(const t of ['dial','recipes','beans','explore','settings','log','gear','guide','variety','words','champs','history','process','tech','flow','wheel','map']){
    await p.evaluate(t=>{showTab(t);scrollTo(0,0)},t);await p.waitForTimeout(500);await snap(t);await p.evaluate(()=>scrollTo(0,900));await snap(t+' (scrolled)')}
  for(const v of ['roastery','diary','passport','top3']){await p.evaluate(v=>{showTab('beans');try{bvStep(BVIEW,v);BVIEW=v;BDIRTY.add(v);renderBeanViews()}catch(e){}scrollTo(0,0)},v);await p.waitForTimeout(600);await snap('beans: '+v)}
  const sheet=async(k,open,close)=>{try{await p.evaluate(open);await snap(k);await p.evaluate(close);await p.waitForTimeout(400)}catch(e){}};
  await sheet('a coffee',()=>{showTab('beans');openBean(BEANS[0].id)},()=>$('vd').close());
  await sheet('a recipe',()=>openRecipe(2),()=>$('vd').close());
  await sheet('the timer',()=>openTimer(2),()=>$('timer').close());
  await sheet('the coffee editor',()=>openBeanEditor(null),()=>$('vd').close());
  try{await p.evaluate(()=>showTab('dial'));await p.click('#d-fab .fab-main');await snap('the + menu')}catch(e){}
  await c.close();return out}
(async()=>{fs.mkdirSync(OUT,{recursive:true});const b=await chromium.launch();
  // The share of pixels that differ, worked out in the browser (no image library needed).
  const cmp=await b.newPage();
  const diff=async(x,y)=>cmp.evaluate(async([a,b])=>{const load=s=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src='data:image/png;base64,'+s});const [A,B]=await Promise.all([load(a),load(b)]);
    if(A.width!==B.width||A.height!==B.height)return 1;const c=document.createElement('canvas');c.width=A.width;c.height=A.height;const g=c.getContext('2d',{willReadFrequently:true});
    g.drawImage(A,0,0);const da=g.getImageData(0,0,c.width,c.height).data;g.clearRect(0,0,c.width,c.height);g.drawImage(B,0,0);const db=g.getImageData(0,0,c.width,c.height).data;
    let n=0;for(let i=0;i<da.length;i+=4)if(Math.abs(da[i]-db[i])+Math.abs(da[i+1]-db[i+1])+Math.abs(da[i+2]-db[i+2])>24)n++;return n/(da.length/4)},[x.toString('base64'),y.toString('base64')]);
  const rows=[];let views=0;
  for(const sc of ['light','dark']){const A=await shots(b,BASE,sc),B=await shots(b,PR,sc);
    for(const k of Object.keys(B)){views++;if(!A[k]){rows.push([sc,k,'new']);continue}if(A[k].equals(B[k]))continue;const d=await diff(A[k],B[k]);if(d<0.0005)continue;
      rows.push([sc,k,(d*100).toFixed(d<0.01?2:1)+'%']);const f=(sc+'-'+k).replace(/[^a-z0-9]+/gi,'-');fs.writeFileSync(path.join(OUT,f+'-base.png'),A[k]);fs.writeFileSync(path.join(OUT,f+'-pr.png'),B[k])}}
  await b.close();
  const md='### Screenshot check\n'+(rows.length?rows.length+' of '+views+' views look different from the base (light and dark). The pairs are in the run\'s *screenshots* artifact.\n\n| Mode | View | Pixels changed |\n|---|---|---:|\n'+rows.map(r=>'| '+r.join(' | ')+' |').join('\n'):'All '+views+' views look the same as the base, light and dark.')+'\n';
  fs.writeFileSync('shotdiff.md',md);console.log(md)})();
