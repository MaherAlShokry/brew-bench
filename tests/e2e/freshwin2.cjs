const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();let fails=0;const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(2000);
const r=await p.evaluate(()=>{const out=[];const ok=(n,c,x)=>out.push((c?'ok   ':'FAIL ')+n+' '+JSON.stringify(x));
  const W=o=>freshWin(okBean(Object.assign({id:'fwtest'+Math.random().toString(36).slice(2,8),name:'t',ts:Date.now()},o)));
  const base=W({roast:'light'});ok('light base',''+base.w==='7,30,60'&&!base.why.length,base);
  const g=W({roast:'light',variety:'geisha'});ok('dense variety +2/+3/+5',''+g.w==='9,33,65'&&g.why[0]==='dense bean',g);
  const k=W({roast:'medium',origin:'kenya'});ok('Kenya (high-grown) by altitude',k.w[0]===6&&k.why.includes('high-grown'),[k,altOf('kenya')]);
  const br=W({roast:'medium',origin:'brazil'});ok('Brazil (lower) stays or softer',br.w[0]<=4,[br,altOf('brazil')]);
  const n=W({roast:'medium',process:'natural'});ok('natural shortens',''+n.w==='4,19,36'&&n.why.includes('natural'),n);
  const dc=W({roast:'medium',process:'swisswater'});ok('decaf shorter',dc.w[1]<=16&&dc.w[2]<=32&&dc.why.includes('decaf'),dc);
  const mp=W({roast:'dark',variety:'maragogype'});ok('soft variety',mp.w[2]<30&&mp.why[0]==='large, soft bean',mp);
  // opened: roast 40 days ago, opened 5 days after roast, medium → peak to 19, good to 33
  const rd=new Date(Date.now()-40*864e5).toISOString().slice(0,10),od=new Date(Date.parse(rd)+5*864e5).toISOString().slice(0,10);
  const o=W({roast:'medium',roastDate:rd,diary:[{k:'opened',d:od,t:'x'}]});ok('opened caps the window',''+o.w==='4,19,33'&&o.why.some(x=>/^opened/.test(x)),o);
  // espresso: two espresso brews of this bean
  const eb=okBean({id:'fwesp1',name:'E',roast:'medium',ts:Date.now()});BEANS.push(eb);const keep=LOG.slice();
  LOG.unshift({beanId:'fwesp1',brewer:'espresso',ts:Date.now(),stars:4},{beanId:'fwesp1',snap:{b:'espresso'},ts:Date.now(),stars:4});
  const e=freshWin(eb);ok('mostly espresso rests longer',''+e.w==='9,26,50'&&e.why.includes('espresso'),e);LOG.splice(0,LOG.length,...keep);BEANS=BEANS.filter(x=>x!==eb);
  const all=W({roast:'dark',process:'swisswater',variety:'maragogype'});ok('always ordered',all.w[0]<all.w[1]&&all.w[1]<all.w[2],all);
  return out});r.forEach(x=>{console.log(x);if(x.startsWith('FAIL'))fails++});
await p.evaluate(()=>{const b=BEANS.find(x=>x.shelf);Object.assign(b,{roast:'light',variety:'geisha',process:'natural'});const t=new Date(Date.now()-20*864e5);b.roastDate=t.toISOString().slice(0,10);openBean(b.id)});await p.waitForTimeout(500);
console.log(await p.evaluate(()=>document.querySelector('.bd-fh').textContent+' | '+document.querySelector('.bd-fw').textContent));await (await p.$('.bd-shelf')).screenshot({path:'fresh2.png'});
console.log('errors',errs,'fails',fails);await b.close()})();
