// Scan: the roast date in the many ways bags print it, and the bag's weight, which goes into the coffee when it's added.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,v,x)=>console.log((v?'ok  ':'FAIL')+' '+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(1200);
const d=await p.evaluate(()=>{const y=new Date().getFullYear(),Y=String(y).slice(2);const T=[
  ['Roasted on 12.10.'+Y,y+'-10-12'],['ROAST DATE: 03/11/'+y,y+'-11-03'],['Roasted: 2 Nov '+y,y+'-11-02'],['Röstdatum: 04.11.'+y,y+'-11-04'],['Tostado: 31-10-'+y,y+'-10-31'],
  ['Roasted on: '+y+'/11/06  Best before: '+(y+1)+'/05/06',y+'-11-06'],['RD '+y+'.10.28',y+'-10-28'],['Roasted '+y+'1029',y+'-10-29'],['ROASTED: 7TH NOV',y+'-11-07'],
  ['Roast date 10 / 11 / '+Y,y+'-11-10'],['Roasted 10/25/'+y,y+'-10-25'],['Lot 20241029 · Roasted 1 Nov '+y,y+'-11-01']];
  return T.filter(([t,w])=>findDate(t)!==w).map(([t,w])=>t+' -> '+findDate(t)+' (want '+w+')')});
ok('roast dates read in every common form',!d.length,d);
const w=await p.evaluate(()=>{const T=[['Net wt 250g',250],['NET WT. 12 OZ (340 g)',340],['1 kg bag',1000],['Netto 500 g',500],['Recipe: 18 g in, 36 g out. Net weight 250 g',250],['12oz',340],['Altitude 1900 masl',0],['Peso neto: 1,5 kg',1500]];
  return T.filter(([t,g])=>findWeight(t)!==g).map(([t,g])=>t+' -> '+findWeight(t)+' (want '+g+')')});
ok('the bag weight is read (grams, ounces, kilos), not a recipe dose or the altitude',!w.length,w);
const flow=await p.evaluate(async()=>{goTab('scan');await new Promise(r=>setTimeout(r,300));applyInfo(parseLabel('KENYA NYERI\nWashed SL28\nRoasted 2 Nov\nNet wt 250g'));renderScan();
  const shown=$('scan-out').textContent;document.querySelector('#scan-out [data-scanadd], #sc-add, #scan-out .btn')&&0;return{bag:SC.bag,shown:/250 g/.test(shown)}});
ok('a scanned bag keeps its weight and shows it',flow.bag===250&&flow.shown,flow);
const ed=await p.evaluate(()=>{openBeanEditor(null,{name:'x',bag:SC.bag});const v=$('be-bag').value;$('vd').close();return v});ok('and the coffee form starts with that bag size',ed==='250',ed);
ok('no errors',!errs.length,errs);await b.close()})();
