// "Likely in the cup" is flavours only (the bars and verdict already say how bright or heavy): the bag's own tasting
// notes come first, then what you tasted in this coffee's brews, then the variety and process, kept only when the
// flavour wheel knows them; a medium or dark roast brings caramel and chocolate, a light one doesn't; brewing lighter
// puts the fruity notes first, heavier the sweet ones. Every note has its colour dot; nothing left hides the block.
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
    light:cupNotes(Object.assign({},st,{bean:null,variety:'geisha',process:'washed',roast:'light'}),{D:0}).map(x=>x.toLowerCase()),
    hid:(()=>{let k;for(const v of V){for(const q in PROCESSES)if(!cupNotes(Object.assign({},S,{bean:null,roast:'light',variety:v.id,process:q}),{D:0}).length){k=[v.id,q];break}if(k)break}
      if(!k)return 'none empty';const keep=[S.bean,S.variety,S.process,S.roast];Object.assign(S,{bean:null,variety:k[0],process:k[1],roast:'light'});render();const h=$('o-cup').hidden;
      [S.bean,S.variety,S.process,S.roast]=keep;render();return h&&!$('o-cup').hidden})(),
    dots:[...document.querySelectorAll('#o-chips .chip')].every(c=>c.querySelector('i.dot')),n:document.querySelectorAll('#o-chips .chip').length}});
const STRUCT=/^(bright|clean|balanced|sweet|syrupy|sour|thin|bitter|drying|harsh ferment|round body|roasty|tea-like|juicy acidity|crisp acidity|complex|smooth|mild)$/;
ok('the bag\'s notes lead',['passion fruit','jasmine'].every(w=>r.mid.slice(0,3).includes(w)),r.mid);
ok('what you tasted in this coffee is in it',r.mid.includes('mango'),r.mid);
ok('at most five notes, each with a colour dot',r.mid.length<=5&&r.n>0&&r.n<=5&&r.dots,{mid:r.mid,n:r.n});
ok('flavours only, never how the cup is built',[r.mid,r.under,r.over,r.far,r.dark,r.none,r.light].every(l=>!l.some(w=>STRUCT.test(w))),r);
ok('brewing lighter puts the fruit ahead of the sugar',r.under.indexOf('passion fruit')<r.under.indexOf('cane sugar')||!r.under.includes('cane sugar'),r.under);
ok('brewing heavier puts the sweet note ahead of the floral',r.over.indexOf('cane sugar')>-1&&r.over.indexOf('cane sugar')<r.over.indexOf('jasmine'),r.over);
ok('a dark roast brings chocolate, a light one no caramel or chocolate of its own',r.dark.some(w=>/chocolate/.test(w))&&!r.light.some(w=>/caramel|milk chocolate|dark chocolate/.test(w)),{dark:r.dark,light:r.light});
ok('with no coffee picked it reads the variety and process',r.none.length>=2&&r.none.some(w=>/floral|jasmine|bergamot/.test(w)),r.none);
ok('with nothing to say, the block hides',r.hid===true,r.hid);
ok('no page errors',!errs.length,errs);await b.close()})();
