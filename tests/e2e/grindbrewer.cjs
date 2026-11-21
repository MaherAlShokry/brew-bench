// Grind memory per coffee and brewer: a coffee brewed on a V60 and on a Switch remembers each grind; switching the
// Brew page's brewer with the coffee picked sets that brewer's grind; the dial-in helper keeps its answer per brewer.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1800);
const r=await p.evaluate(async()=>{const bn=BEANS[0],g=MYG.find(x=>canGrind(x,'v60')&&canGrind(x,'sw')),now=Date.now();delete DIALNEXT[bn.id];
  LOG.unshift({id:'gb1',ts:now,date:'',coffee:'x',settings:'',stars:4,snap:{b:'v60',g,c:roundG(g,settingFor(g,'v60',0)-0),bean:{id:bn.id,name:'x'}}},
              {id:'gb2',ts:now-1000,date:'',coffee:'x',settings:'',stars:4,snap:{b:'sw',g,c:roundG(g,settingFor(g,'sw',0)+0),bean:{id:bn.id,name:'x'}}});
  const v=lastBrewFor(bn.id,'v60'),w=lastBrewFor(bn.id,'sw'),any=lastBrewFor(bn.id);
  goTab('dial');useBean(bn);render();const sel=$('i-brewer');sel.value='sw';sel.dispatchEvent(new Event('change'));await new Promise(r=>setTimeout(r,100));
  const afterSw={b:S.brewer,g:S.grinder,set:S.setting};
  DIALNEXT[bn.id]={brewer:'v60',g,set:55,temp:94,taste:'sour',by:{v60:{brewer:'v60',g,set:55,temp:94,taste:'sour'},sw:{brewer:'sw',g,set:77,temp:92,taste:'bitter'}}};
  const dv=dialNextFor(bn.id,'v60'),ds=dialNextFor(bn.id,'sw'),dn=dialNextFor(bn.id,'neo');
  LOG.splice(0,2);delete DIALNEXT[bn.id];
  return{g,v:v&&v.brewer,w:w&&w.brewer,any:any&&any.brewer,afterSw,wset:w&&w.set,dv:dv&&dv.set,ds:ds&&ds.set,dn:dn&&dn.set}});
ok('the last brew is found per brewer',r.v==='v60'&&r.w==='sw'&&r.any==='v60',r);
ok('switching the brewer sets that brewer\'s remembered grind',r.afterSw.b==='sw'&&r.afterSw.g===r.g&&r.afterSw.set===r.wset,r);
ok('the dial-in helper\'s answer is kept per brewer (and twins share it)',r.dv===55&&r.ds===77&&r.dn===55,r);
ok('no page errors',!errs.length,errs);await b.close()})();
