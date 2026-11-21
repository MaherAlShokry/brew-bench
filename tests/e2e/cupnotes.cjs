// "Likely in the cup" reads the coffee: the bag's own tasting notes come first, then what you tasted in this coffee's
// brews, then the variety and process; a darker roast brings chocolate; brewing lighter (under) puts the bright notes
// first, heavier puts the sweet ones first, and far off leads with the fault. Every note has its colour dot.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1500);
const r=await p.evaluate(()=>{const bn=BEANS[0];bn.flavours='Passion fruit, jasmine, cane sugar';
  LOG.unshift({id:'cn1',ts:Date.now(),date:'',coffee:beanTitle(bn),settings:'',stars:5,fl:[['fruity.tropical-fruit.mango',3]],snap:{b:'v60',bean:{id:bn.id,name:beanTitle(bn)}}});
  useBean(bn);goTab('dial');render();
  const st=Object.assign({},S),at=D=>cupNotes(Object.assign({},st,{roast:'light'}),{D}).map(x=>x.toLowerCase());
  return{mid:at(0),under:at(-0.8),over:at(0.8),far:at(-1.5),dark:cupNotes(Object.assign({},st,{roast:'dark'}),{D:0}).map(x=>x.toLowerCase()),
    none:cupNotes(Object.assign({},st,{bean:null,variety:'geisha',process:'washed'}),{D:0}).map(x=>x.toLowerCase()),
    dots:[...document.querySelectorAll('#o-chips .chip')].every(c=>c.querySelector('i.dot')),n:document.querySelectorAll('#o-chips .chip').length}});
ok('the bag\'s notes lead',['passion fruit','jasmine'].every(w=>r.mid.slice(0,3).includes(w)),r.mid);
ok('what you tasted in this coffee is in it',r.mid.includes('mango'),r.mid);
ok('at most six notes, each with a colour dot',r.mid.length<=6&&r.n>0&&r.n<=6&&r.dots,{mid:r.mid,n:r.n});
ok('brewing lighter puts a bright note first',r.under[0]==='bright'&&r.under.indexOf('passion fruit')<r.under.indexOf('cane sugar')||!r.under.includes('cane sugar'),r.under);
ok('brewing heavier puts syrupy first and the sweet note ahead',r.over[0]==='syrupy'&&r.over.indexOf('cane sugar')>-1&&r.over.indexOf('cane sugar')<r.over.indexOf('jasmine'),r.over);
ok('far under leads with sour',r.far[0]==='sour',r.far);
ok('a dark roast brings chocolate',r.dark.some(w=>/chocolate/.test(w)),r.dark);
ok('with no coffee picked it reads the variety and process',r.none.length>=3&&r.none.some(w=>/floral|jasmine|bergamot/.test(w)),r.none);
ok('no page errors',!errs.length,errs);await b.close()})();
