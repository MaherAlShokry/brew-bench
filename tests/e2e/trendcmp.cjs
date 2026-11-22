// Taste over time on the profile: a bar a month (up to six) for how you rated, the month's main flavour group as a dot,
// and a line on how it's moving; hidden with a single brew. Coffee compare: from a coffee's page, pick another and see
// them side by side (rows both lack are left out), swap sides, and open either.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1800);
const t=await p.evaluate(async()=>{const w=t=>new Promise(r=>setTimeout(r,t)),o={};{const keep=LOG;LOG=keep.filter(l=>l&&l.ts).slice(0,1);o.one=trendsHTML()==='';LOG=keep}
  const d=new Date();for(let i=1;i<=7;i++){const ts=new Date(d.getFullYear(),d.getMonth()-i,10).getTime();LOG.push({id:'tr'+i,ts,date:'',coffee:'X',settings:'',stars:i%2?3:5,fl:[[i<4?'fruity.tropical-fruit.mango':'nutty-cocoa.cocoa.chocolate',3]]})}
  openMe();await w(700);const bars=[...document.querySelectorAll('.mt-panel .mt-col')];o.n=bars.length;o.dots=[...document.querySelectorAll('.mt-panel')].some(x=>/Flavours/.test(x.textContent)&&x.querySelectorAll('.mt-sb i').length>=bars.length);
  o.line=[...document.querySelectorAll('.mt-line')].map(x=>x.textContent).join(' ');document.querySelectorAll('dialog[open]').forEach(x=>x.close());LOG=LOG.filter(l=>!/^tr\d$/.test(l.id));return o});
ok('a single brew: no chart',t.one);
ok('eight months at most, a bar each, flavours by month, with a line',t.n===8&&t.dots&&/ratings/.test(t.line||''),t);
const c=await p.evaluate(async()=>{const w=t=>new Promise(r=>setTimeout(r,t)),a=BEANS[0],b=BEANS[1];openBean(a.id);await w(600);const btn=$('bd-cmp');if(!btn)return{btn:false};btn.click();await w(400);
  const rows=document.querySelectorAll('[data-bcp]').length;$('bcp-q').value=b.name.slice(0,4);$('bcp-q').dispatchEvent(new Event('input'));await w(100);
  const found=!!document.querySelector('[data-bcp="'+b.id+'"]');document.querySelector('[data-bcp="'+b.id+'"]').click();await w(500);
  const title=$('vd-title').textContent,cells=[...document.querySelectorAll('.bc-tab tbody tr')].map(r=>[...r.children].map(x=>x.textContent)),blankRows=cells.filter(r=>r[1]==='–'&&r[2]==='–').length;
  $('bc-swap').click();await w(400);const swapped=$('vd-title').textContent;document.querySelector('[data-bco="'+b.id+'"]').click();await w(500);const opened=$('vd').dataset.bean;
  document.querySelectorAll('dialog[open]').forEach(x=>x.close());return{btn:true,rows,found,title,rowsN:cells.length,blankRows,origin:cells.find(r=>r[0]==='Origin'),swapped,opened,want:[a.id,b.id,beanTitle(a),beanTitle(b)]}});
ok('a coffee page offers Compare, with a searchable list of the others',c.btn&&c.rows>=2&&c.found,c);
ok('the two coffees side by side, no all-blank rows',c.title.startsWith(c.want[2])&&c.title.includes(c.want[3])&&c.rowsN>=4&&!c.blankRows&&!!c.origin,c);
ok('swap sides, and either coffee opens',c.swapped.startsWith(c.want[3])&&c.opened===c.want[1],c);
ok('no page errors',!errs.length,errs);await b.close()})();
