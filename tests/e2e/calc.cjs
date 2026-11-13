// Formulas and calculations, checked as invariants against the real code.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.goto('http://localhost:8099/index.html',{waitUntil:'networkidle'});
const R=await p.evaluate(()=>{const F=[];const bad=(k,m)=>{F.push(k+': '+m)};let n=0;
 // 1. Every grinder: dial text reads back to the same click, size and steps are inverse, size grows with the setting.
 for(const [g,G] of Object.entries(GRINDERS)){let prev=null;const lo=Math.ceil(G.min),hi=Math.floor(G.max);
   for(let c=lo;c<=hi;c++){n++;const d=dial(g,c),back=parseDial(g,d);if(back!==c){bad('dial '+g,c+' -> "'+d+'" -> '+back);break}
     const s=sizeOf(g,c);if(Math.abs(stepsFor(g,s)-c)>1e-6){bad('inverse '+g,c);break}if(prev!=null&&!(s>prev)){bad('monotonic '+g,c+' size '+s+' <= '+prev);break}prev=s}}
 // 2. Converting between grinders for the same brewer keeps the grind size within one click either way.
 const gs=Object.keys(GRINDERS),bs=Object.keys(BREWERS).filter(b=>BREWERS[b].model);let conv=0;
 for(const b of bs)for(const g1 of gs){if(!canGrind(g1,b))continue;const c1=base(g1,b);if(c1<GRINDERS[g1].min||c1>GRINDERS[g1].max)bad('base range '+g1+'/'+b,c1);
   for(const g2 of gs){if(g2===g1||!canGrind(g2,b))continue;conv++;const c2=convertSetting({grinder:g1,setting:c1,brewer:b},g2,b),G2=GRINDERS[g2];
     if(c2==null||c2<G2.min||c2>G2.max)bad('convert range '+g1+'->'+g2+'/'+b,c2);
     const back=convertSetting({grinder:g2,setting:c2,brewer:b},g1,b);const tol=Math.max(1,Math.ceil(GRINDERS[g1].k&&GRINDERS[g2].k?GRINDERS[g2].k/GRINDERS[g1].k:2));
     if(Math.abs(back-c1)>tol+1)bad('round trip '+g1+'->'+g2+'->'+g1+'/'+b,c1+' -> '+c2+' -> '+back)}}
 // 3. The taste model: finer grind, hotter water, longer bloom and more agitation all extract more; a longer ratio lowers body.
 const st0={grinder:'zp6',setting:56,brewer:'v60',temp:93,ratio:15,bloom:45,agit:'med',roast:'light',process:'washed',variety:'caturra',rec:null,dose:15};
 const D=o=>compute(Object.assign({},st0,o));const d0=D({});
 if(!(D({setting:50}).D>d0.D))bad('model','finer grind should extract more');if(!(D({temp:96}).D>d0.D))bad('model','hotter should extract more');
 if(!(D({bloom:60}).D>d0.D))bad('model','longer bloom should extract more');if(!(D({agit:'high'}).D>d0.D))bad('model','more agitation should extract more');
 if(!(D({ratio:17}).body<d0.body))bad('model','longer ratio should lower body');if(!(D({roast:'dark'}).bitter>d0.bitter))bad('model','dark roast should be more bitter');
 if(!(D({setting:40}).bitter>d0.bitter))bad('model','much finer should be more bitter');if(!(D({setting:70}).acid>d0.acid))bad('model','coarser should be more acidic');
 for(const k of ['sweet','acid','body','clarity','bitter'])if(!(d0[k]>=0&&d0[k]<=10))bad('model range',k+' '+d0[k]);
 // 4. Every recipe's brew plan, for every target, strength, roast and process: numbers in range, water = dose x ratio,
 //    and the planned grind lands the predicted extraction near the target.
 let plans=0,maxMiss=0,worst='',limited=0,maxCap=0;
 for(let i=0;i<RECIPES.length;i++){const r=RECIPES[i];if(!BREWERS[r.b].model)continue;
   for(const goal of GOALS.map(x=>x[0]))for(const amt of ['low','mid','high'])for(const roast of ['light','medium','dark'])for(const process of ['washed','natural','anaerobic']){
     if(goal==='balance'&&amt!=='mid')continue;plans++;
     const c={brewer:r.b,grinder:'zp6',tech:i,process,variety:'caturra',roast,age:14,goal,amt,dose:r.dose};const P=plan(c),B=BREWERS[P.st.brewer];
     const tag=r.name+' / '+goal+'/'+amt+'/'+roast+'/'+process;
     if(!Number.isFinite(P.temp)||P.temp<B.temp.min||P.temp>B.temp.max)bad('plan temp',tag+' '+P.temp);
     if(!Number.isFinite(P.ratio)||P.ratio<=0)bad('plan ratio',tag+' '+P.ratio);
     if(!Number.isFinite(P.bloom)||P.bloom<B.bloom.min||P.bloom>B.bloom.max)bad('plan bloom',tag+' '+P.bloom);
     if(Math.abs(P.water-P.dose*P.ratio)>0.51+P.dose*P.ratio*0.01)bad('plan water',tag+' '+P.water+' vs '+P.dose*P.ratio);
     for(const [g,v] of Object.entries(P.set))if(v!=null&&(v<GRINDERS[g].min||v>GRINDERS[g].max||!Number.isInteger(v)))bad('plan setting',tag+' '+g+' '+v);
     if(P.steps.some(s=>/NaN|undefined|Infinity/.test(s)))bad('plan steps',tag+' '+P.steps.join(' | '));
     // The plan's own state, run through the model, should land within the rounding of a click of its target.
     if(P.st.setting!=null){const Dt=Math.max(-0.33,Math.min(0.33,GSPEC[goalOf(goal)].Dt*(goal==='balance'?0:AMTS[amt].m)));const got=compute(Object.assign({},P.st,{dose:P.dose})).D;
       const click=Math.abs(stepsBetween(P.st.grinder,P.st.setting,P.st.setting+1))*KG;const miss=Math.abs(got-Dt);
       if(miss>maxMiss){maxMiss=miss;worst=tag+' got '+got.toFixed(2)+' target '+Dt.toFixed(2)+' click '+click.toFixed(3)}
       const capped=P.held;if(capped)limited++;
       if(!capped&&miss>click*0.6+0.02&&P.st.setting>GRINDERS[P.st.grinder].min&&P.st.setting<GRINDERS[P.st.grinder].max)bad('plan aim',tag+' got '+got.toFixed(3)+' want '+Dt.toFixed(3));
       // However the coffee and target pull, the grind stays near the recipe's own.
       const rs=settingFor(P.st.grinder,P.st.brewer,r.off);if(rs!=null&&Math.abs(stepsBetween(P.st.grinder,rs,P.st.setting))>GRIND_SWAY+0.12)bad('plan sway',tag+' '+rs+' -> '+P.st.setting);
       if(capped&&miss>maxCap)maxCap=miss}}}
 // 5. Scaling a recipe: every amount of water scales by the water factor, coffee by the dose factor, times never.
 let scaled=0;for(const r of RECIPES){const s2=scaleSteps(r,r.dose*2,r.water*2);scaled++;
   r.steps.forEach((s,k)=>{const t1=(s.match(/\d+:\d\d/g)||[]).join(),t2=(s2[k].match(/\d+:\d\d/g)||[]).join();if(t1!==t2)bad('scale times',r.name+': '+s+' -> '+s2[k]);
     if(/°C/.test(s)&&(s.match(/\d+\s?°C/g)||[]).join()!==(s2[k].match(/\d+\s?°C/g)||[]).join())bad('scale temps',r.name+': '+s+' -> '+s2[k])});
   const tot=r.steps.join(' ').match(new RegExp('\\b'+r.water+'\\s?(g|ml)\\b'));if(tot){const want=gfmt(r.water*2);if(!s2.join(' ').includes(want))bad('scale total',r.name+' '+r.water+' -> expected '+want)}}
 // 6. 4:6 pours add up to the water and keep Kasuya's timings.
 for(const W of [200,250,300])for(const goal of ['balance','sweet','bright','strong','light'].filter(g=>GSPEC[g])){const s=steps46(15,W,goal),tot=s.map(x=>(x.match(/pour ([\d.]+)g/)||[])[1]).filter(Boolean).reduce((a,v)=>a+ +v,0);
   if(Math.abs(tot-W)>1.5)bad('4:6 total',W+' '+goal+' '+tot)}
 // 7. Recipe timings: total time is the last step's time; steps run in order.
 for(const r of RECIPES){const ts=parseSteps(r.steps).map(e=>e.t);for(let k=1;k<ts.length;k++)if(ts[k]>=0&&ts[k-1]>=0&&ts[k]<ts[k-1]){bad('step order',r.name+' '+r.steps[k]);break}}
 // 8. Formatting.
 if(mmss(0)!=='0:00'||mmss(75)!=='1:15'||mmss(600)!=='10:00')bad('mmss',[mmss(0),mmss(75),mmss(600)]);if(gfmt(12.4)!=='12'||gfmt(7.25)!=='7.3'&&gfmt(7.25)!=='7.2')bad('gfmt',gfmt(12.4)+' '+gfmt(7.25));
 return {F,n,conv,plans,maxMiss,worst,scaled,limited,maxCap}});
console.log('dial checks',R.n,'| conversions',R.conv,'| plans',R.plans,'| recipes scaled',R.scaled);console.log('largest plan miss',R.maxMiss.toFixed(3),R.worst);console.log('plans with the grind held near the recipe',R.limited,'| their largest miss',R.maxCap.toFixed(3));
console.log(R.F.length?R.F.length+' problems:\n  '+[...new Set(R.F)].slice(0,60).join('\n  '):'no problems');console.log('errors',errs.length?errs:'none');await b.close()})();
