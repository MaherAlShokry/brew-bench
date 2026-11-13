// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.route(/.*/,r=>r.request().url().startsWith('http://localhost')?r.continue():r.abort());await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(500);
const out=await p.evaluate(()=>{const issues=[];RECIPES.forEach((r,i)=>{const B=BREWERS[r.b];if(!B){issues.push([r.name,'unknown brewer']);return}
 const ev=parseSteps(r.steps),ts=r.steps.map(s=>{const m=/^\s*(\d+):(\d\d)/.exec(s);return m?+m[1]*60+ +m[2]:null});let last=-1;ts.forEach((t,j)=>{if(t!=null){if(t<last)issues.push([r.name,'step '+(j+1)+' time goes back ('+r.steps[j]+')']);last=t}});
 const c=pourCurve(r.steps,r.water);const perc=['Cone dripper','Flat-bottom dripper'].includes(B.type);
 if(c&&Math.abs(c.lvl-r.water)>3&&!/ice/i.test(r.steps.join(' ')))issues.push([r.name,'pours reach '+c.lvl+' of '+r.water+'g']);
 if(perc&&!c)issues.push([r.name,'dripper recipe without pour amounts']);
 if(r.temp&&(r.temp<B.temp.min||r.temp>B.temp.max))issues.push([r.name,'temp '+r.temp+' outside '+B.temp.min+'-'+B.temp.max]);
 const ratio=r.water/r.dose;if(B.ratio&&(ratio<B.ratio.min-0.6||ratio>B.ratio.max+0.6)&&B.model)issues.push([r.name,'ratio 1:'+ratio.toFixed(1)+' outside '+B.ratio.min+'-'+B.ratio.max]);
 for(const g of Object.keys(GRINDER_LIB)){const v=settingFor(g,r.b,r.off||0);if(v==null)continue;const G=GRINDERS[g],raw=shift(g,baseX(g,r.b),-(r.off||0)*160);if(raw<G.min-1||raw>G.max+1)issues.push([r.name,G.name+' clamped ('+raw.toFixed(0)+' vs '+G.min+'-'+G.max+')'])}
});return issues});
const by={};for(const [n,m] of out)(by[n]=by[n]||[]).push(m);for(const [n,m] of Object.entries(by))console.log(n+': '+m.join('; '));console.log(out.length,'issues');await b.close()})();
