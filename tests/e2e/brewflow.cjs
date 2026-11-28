// The Brew page: picking a coffee keeps the brewer you chose (only that brewer's grind for the coffee comes back);
// steeps keep their times at any dose while pour-overs stretch; every valve and immersion recipe has its steep as a
// step; Kasuya's New Hybrid follows his shop's recipe at 90°C; every timed step starts with its time.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1800);
const r=await p.evaluate(()=>{const bn=BEANS[0],g=MYG.find(x=>canGrind(x,'v60')&&canGrind(x,'sw')),now=Date.now();delete DIALNEXT[bn.id];
  // The coffee was last brewed on a V60, and once on the Switch.
  LOG.unshift({id:'bf1',ts:now,date:'',coffee:'x',settings:'',stars:4,snap:{b:'v60',g,c:roundG(g,settingFor(g,'v60',0)-4),bean:{id:bn.id,name:'x'}}},
              {id:'bf2',ts:now-1000,date:'',coffee:'x',settings:'',stars:4,snap:{b:'sw',g,c:roundG(g,settingFor(g,'sw',0)+4),bean:{id:bn.id,name:'x'}}});
  goTab('dial');const kh=RECIPES.findIndex(x=>x.kind==='kh2');S.brewer='sw';loadRecipe(kh);render();
  useBean(bn);const keep={b:S.brewer,rec:S.rec,set:S.setting,want:lastBrewFor(bn.id,'sw').set};
  // A coffee with brews only on another brewer leaves the grind alone, and the brewer too.
  LOG.splice(1,1);S.setting=50;useBean(bn);const other={b:S.brewer,set:S.setting};LOG.splice(0,1);
  const R=RECIPES[kh],t=st=>st.map(x=>(/^\s*(\d+:\d\d)/.exec(x)||[])[1]).filter(Boolean).join(' ');
  const v60=RECIPES.find(x=>x.b==='v60'&&doseScales(x)&&x.kind!=='46');
  // A steep: the coffee sits in water (the valve closed, or a brewer without one) for 40 seconds or more after a pour
  // or a stir. Each needs its own step, so the timer shows it instead of a pour that seems to last a minute.
  const steepless=[];for(const x of RECIPES){if(!['Valve and hybrid','Immersion and pressure'].includes(BREWERS[x.b].type))continue;
    const ts=x.steps.map(s=>{const m=/^\s*(\d+):(\d\d)/.exec(s);return m?+m[1]*60+ +m[2]:null});let shut=!['sw','swneo','swi','pulsar'].includes(x.b);
    x.steps.forEach((s,i)=>{if(/\bclose|closed/i.test(s))shut=true;else if(/\bopen|drain/i.test(s))shut=false;
      if(!shut||ts[i]==null||ts[i+1]==null||/steep|wait|let it/i.test(s)||!['pour','stir','swirl','valve','note'].includes(stepKind(s)))return;
      if(ts[i+1]-ts[i]>=40)steepless.push(x.name+': '+s)})}
  S.dose=15;const dp=dialPlan();
  return{keep,other,t20:t(R.steps),t15:t(scaleSteps(R,15,225)),t26:t(scaleSteps(R,26,390)),g15:scaleSteps(R,15,225).join(' '),
    v60:t(v60.steps)!==t(scaleSteps(v60,v60.dose*1.5,v60.water*1.5)),steepless,temp:dp.temp||S.temp,first:dp.steps[0],
    steep:R.steps.some(s=>/^2:20 let it steep/.test(s))}});
ok('picking a coffee keeps the brewer and the recipe',r.keep.b==='sw'&&r.other.b==='sw',r);
ok('…and brings back its grind for that brewer only',r.keep.set===r.keep.want&&r.other.set===50,r);
ok('a steep keeps its times at any dose',r.t20===r.t15&&r.t20===r.t26,r);
ok('a pour-over still stretches its times with more water',r.v60,r);
ok('New Hybrid at 15g matches the PHILOCOFFEA recipe (34, 90, 150, 225g)',/Pour 34g/.test(r.g15)&&/to 90g/.test(r.g15)&&/to 150g/.test(r.g15)&&/to 225g/.test(r.g15),r.g15);
ok('New Hybrid has its steep, and stays at 90°C on the Brew page',r.steep&&/90°C/.test(r.first),r);
ok('every valve and immersion recipe has a steep step',!r.steepless.length,r.steepless);
const bl=await p.evaluate(()=>{const out={};for(const [k,name,b] of [['v60','The Ultimate V60','v60'],['kh2','New Hybrid (2025)','sw'],['inv','Inverted AeroPress','aeropress'],['fp','Classic 4-minute press','frenchpress']]){
    const i=RECIPES.findIndex(x=>x.name===name);S.brewer=b;loadRecipe(i);render();const B=BREWERS[S.brewer];
    S.bloom=Math.max(B.bloom.min,30);const a=dialPlan().steps;S.bloom=Math.min(B.bloom.max,75);render();const c=dialPlan().steps;
    out[k]={moved:JSON.stringify(a)!==JSON.stringify(c),hidden:$('i-bloom').closest('.field').hidden,a,c}}return out});
ok('the bloom moves the timer\'s steps (a recipe with setup steps, a closed-valve bloom, an AeroPress)',bl.v60.moved&&bl.kh2.moved&&bl.inv.moved,bl);
ok('…and a wait inside the bloom stays put',bl.kh2.c.some(s=>/^0:10 let it bloom/.test(s))&&bl.kh2.c.some(s=>/^1:15 open the valve/i.test(s)),bl.kh2.c);
ok('a recipe with no bloom hides the bloom slider',bl.fp.hidden&&!bl.v60.hidden,bl);
const sp=await p.evaluate(async()=>{const out={};
  // The Classic 4-minute press: its steep runs from 0:15 to the plunge at 4:00.
  S.brewer='frenchpress';loadRecipe(RECIPES.findIndex(x=>x.name==='Classic 4-minute press'));S.steep=0;render();
  const f=$('i-steep').closest('.field');out.shown=!f.hidden;out.own=$('v-steep').textContent;
  const si=$('i-steep');si.value=300;si.dispatchEvent(new Event('input'));await new Promise(r=>setTimeout(r,250));
  out.steps=dialPlan().steps;out.label=$('v-steep').textContent;dialTimer();out.timer=TM.ev.map(e=>e.t);$('timer').close&&$('timer').close();
  // Another recipe starts from its own steep; a V60 has none.
  S.brewer='sw';loadRecipe(RECIPES.findIndex(x=>x.kind==='kh2'));render();out.kh2=(a=>a?a.end-a.start:0)(steepAt(dialPlan().steps));
  S.brewer='v60';loadRecipe(0);render();out.v60=$('i-steep').closest('.field').hidden;return out});
ok('a steep recipe has a steep slider, at its own steep',sp.shown&&sp.own==='3:45',sp);
ok('moving it moves the end of the steep and the steps after it',sp.steps.some(x=>/^5:15 plunge/.test(x))&&sp.steps.some(x=>/^5:30 pour/.test(x))&&sp.label==='5:00',sp.steps);
ok('…in the timer too',sp.timer.includes(315),sp.timer);
ok('another recipe keeps its own steep, and a V60 has no steep slider',sp.kh2===35&&sp.v60,sp);
// The steep counts in the cup: longer extracts more, shorter less, so the strip's marker and verdict follow it; the
// recipe's own steep reads as before.
const se=await p.evaluate(async()=>{const i=RECIPES.findIndex(r=>{try{return steepAt(planSteps(r,r.dose,r.water,'balanced').steps)}catch(e){return false}});const r=RECIPES[i];
  S.brewer=r.b;loadRecipe(i);goTab('dial');render();await new Promise(x=>setTimeout(x,300));const si=$('i-steep'),own=+si.value;
  const D0=compute(S).D;S.steep=0;const Dnone=compute(S).D;const at=v=>{si.value=v;si.dispatchEvent(new Event('input'));return new Promise(x=>setTimeout(()=>x({D:compute(S).D,m:parseFloat($('mr-m').style.left)}),250))};
  const lo=await at(+si.min),mid=await at(own),hi=await at(+si.max);return{own,same:Math.abs(D0-Dnone)<1e-9&&Math.abs(mid.D-Dnone)<1e-9,lo,mid,hi}});
ok('a longer steep extracts more and a shorter one less: the strip moves; the recipe\'s own steep changes nothing',se.same&&se.lo.D<se.mid.D&&se.mid.D<se.hi.D&&se.lo.m<se.mid.m&&se.mid.m<se.hi.m,se);
// On the Switch the steep is the whole time the valve is shut: from CLOSE to OPEN. Its default is the recipe's own,
// and a longer one opens the valve that much after it was closed; a short one never opens it before "let it steep".
const vs=await p.evaluate(()=>{const i=RECIPES.findIndex(r=>r.name==='New Hybrid (2025)');const r=RECIPES[i];S.brewer=r.b;loadRecipe(i);render();
  const own=+$('i-steep').value,min=+$('i-steep').min,at=v=>{S.steep=v;S.steepRec=S.rec;return dialPlan().steps};
  const s60=at(60),sMin=at(min),t=(st,re)=>{const x=st.find(y=>re.test(y));return x?tOf(x):null};S.steep=0;
  return{own,min,close:t(s60,/close the valve/i),open60:t(s60,/open the valve and let it drain/i),openMin:t(sMin,/open the valve and let it drain/i),cue:t(sMin,/let it steep/)}});
ok('on the Switch the steep runs from closing the valve to opening it (New Hybrid: 0:35 by default; 1:00 opens it a minute after it closed)',vs.own===35&&vs.open60-vs.close===60&&vs.openMin>vs.cue,vs);
ok('no page errors',!errs.length,errs);await b.close()})();
