// Recipes: pours reach the water, steps in order, keys resolve; grind settings match the first version.
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(700);
 console.log(await p.evaluate(()=>{const o=[];
  RECIPES.forEach((r,ix)=>{const c=pourCurve(r.steps,r.water);if(c&&r.water&&Math.abs(c.lvl-r.water)>r.water*.03&&!/esp|cold|aero|press|immers|sw/i.test(r.b+r.kind+(BREWERS[r.b].of||'')))o.push('water '+r.name+': '+c.lvl+'/'+r.water);
   const ts=r.steps.map(s=>{const m=/^\s*(\d+):(\d\d)/.exec(s);return m?+m[1]*60+ +m[2]:null}).filter(x=>x!=null);for(let i=1;i<ts.length;i++)if(ts[i]<ts[i-1])o.push('order '+r.name);
   if(!(r.dose>0&&r.water>0))o.push('dose/water '+r.name);if(rByKey(rkey(r))!==ix)o.push('key '+r.name+' leads to '+(RECIPES[rByKey(rkey(r))]||{}).name)});
  for(const [a,k] of Object.entries(RALIAS))if(rByKey(k)<0)o.push('alias '+a+' -> '+k);
  const names={};RECIPES.forEach(r=>{const k=r.name+'|'+r.b;if(names[k])o.push('duplicate '+k);names[k]=1});
  const first={v60:[56,72],neo:[53,69],kalita:[54,64],chemex:[64,84],frenchpress:[78,102],aeropress:[44,62],espresso:[null,36]};
  for(const [b,[z,k]] of Object.entries(first)){const zz=BASE.zp6&&BASE.zp6[b]!=null?null:base('zp6',b),kk=base('kultra',b);if(z!=null&&zz!==z)o.push('ZP6 '+b+' '+zz+' (first '+z+')');if(kk!==k)o.push('K-Ultra '+b+' '+kk+' (first '+k+')')}
  for(const [g,G] of Object.entries(GRINDERS))for(const b of MODEL){const v=base(g,b);if(v!=null&&(v<G.min||v>G.max))o.push('out of range '+g+' '+b+' '+v)}
  return (o.length?'FAIL '+o.length+' issues\n'+o.join('\n'):'ok   '+RECIPES.length+' recipes: pours, step order, keys, aliases and names all good; ZP6 and K-Ultra match the first version; every grinder setting in range')}));await b.close()})();
