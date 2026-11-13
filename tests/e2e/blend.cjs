// Blends: a coffee of several origins. Added through the form like varieties (a second origin makes it a blend), shown with
// its flags and parts, a Passport region of its own with one universal stamp (its countries don't get stamps), its own
// trophies, a Blends filter, read from a label, kept tidy when stored, and drawn on a share card.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,v,x)=>console.log((v?'ok  ':'FAIL')+' '+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1500);
const before=await p.evaluate(()=>{const st=cabStats();return{o:st.o.size,regs:st.regs.size,prof:profileStats().find(x=>/origin/.test(x[1]))[0]}});
// The form: one origin to start; adding a second makes it a blend, adding a third keeps it one.
await p.evaluate(()=>{goTab('beans');openBeanEditor(null)});await p.waitForTimeout(600);
const one=await p.evaluate(()=>({n:$('be-origins').querySelectorAll('select').length,lbl:$('be-olbl').textContent,blendOpt:!!document.querySelector('#be-origins option[value="blend"]')}));
ok('one origin picker to start, and no Blend option to pick',one.n===1&&one.lbl==='Origin'&&!one.blendOpt,one);
await p.fill('#be-name','House Blend');
await p.selectOption('#be-origins select[data-oi="0"]','brazil');
await p.click('#be-addo');await p.waitForTimeout(150);await p.selectOption('#be-origins select[data-oi="1"]','ethiopia');
const two=await p.evaluate(()=>$('be-olbl').textContent);ok('a second origin says it\u2019s a blend',/blend/i.test(two),two);
await p.click('#be-addo');await p.waitForTimeout(150);await p.selectOption('#be-origins select[data-oi="2"]','colombia');
await p.click('#be-save');await p.waitForTimeout(700);
const saved=await p.evaluate(()=>{const b=BEANS.find(x=>x.name==='House Blend');return b&&{origin:b.origin,blend:b.blend,id:b.id}});
ok('saved as a blend of its three origins',saved&&saved.origin==='blend'&&JSON.stringify(saved.blend)===JSON.stringify([{o:'brazil'},{o:'ethiopia'},{o:'colombia'}]),saved);
// Shown: flags in the list, parts on its page.
const shown=await p.evaluate(id=>{renderBeans&&renderBeans();const row=document.querySelector('#beans [data-bean="'+id+'"]');openBean(id);const page=$('vd-in').textContent;$('vd').close();return{row:row&&row.textContent,page}},saved.id);
ok('the list shows its flags and Blend',/🇧🇷🇪🇹🇨🇴/.test(shown.row||'')&&/Blend/.test(shown.row||''),shown.row);
ok('its page lists the origins',/Blend of/.test(shown.page)&&/Brazil/.test(shown.page)&&/Ethiopia/.test(shown.page)&&/Colombia/.test(shown.page),shown.page.slice(0,300));
// Passport: a Blends region and one stamp; the countries in it don't count as origins.
const pp=await p.evaluate(()=>{const st=cabStats();renderPassport();const el=$('bv-passport');return{o:st.o.size,regs:st.regs.size,blendReg:(el.querySelector('.pp-blend')||{}).textContent,stamp:!!el.querySelector('[data-ppo="blend"]'),more:/more/.test(el.querySelector('.pp-h h3').textContent),stampURL:stampURL('blend').slice(0,22)}});
ok('the passport has a Blends region with the count',/Blends\s*1/.test((pp.blendReg||'').replace(/\s+/g,' ')),pp.blendReg);
ok('one universal blend stamp, drawn',pp.stamp&&pp.stampURL.startsWith('data:image/png'),pp);
ok('a blend doesn’t add origins or regions to the count',pp.o===before.o&&pp.regs===before.regs,{before,pp});
const prof=await p.evaluate(()=>profileStats().find(x=>/origin/.test(x[1]))[0]);ok('nor to the profile’s origins',prof===before.prof,{before:before.prof,prof});
ok('and isn’t counted as a country off the map',!pp.more,pp);
// Trophies of its own.
const tro=await p.evaluate(()=>{checkTrophies();const T=TGOT||{};return['blend1','blendworld','blendcont','blend5'].map(k=>!!T[k])});
ok('blend trophies: first blend, three countries, two regions earned; five blends not yet',tro.join()==='true,true,true,false',tro);
// The Blends filter.
const fl=await p.evaluate(()=>{BF=['blend'];const l=beanList();BF=[];return l.map(b=>b.name)});ok('the Blends filter shows only blends',fl.length===1&&fl[0]==='House Blend',fl);
// Edit: the origins come back; removing down to one makes it a single-origin coffee again.
const ed=await p.evaluate(id=>{openBeanEditor(beanById(id));return[...$('be-origins').querySelectorAll('select')].map(x=>x.value)},saved.id);
ok('editing shows the blend\u2019s origins',ed.join()==='brazil,ethiopia,colombia',ed);
await p.click('#be-origins [data-ox="2"]');await p.click('#be-origins [data-ox="1"]');await p.click('#be-save');await p.waitForTimeout(600);
const back=await p.evaluate(id=>{const b=beanById(id);return{o:b.origin,blend:'blend' in b}},saved.id);ok('down to one origin, it\u2019s a single-origin coffee again',back.o==='brazil'&&!back.blend,back);
await p.evaluate(id=>{const b=beanById(id);Object.assign(b,okBean(Object.assign({},b,{origin:'blend',blend:[{o:'brazil'},{o:'ethiopia'},{o:'colombia'}]})));saveBeans()},saved.id);
// Stored tidily: unknown origins, a blend inside a blend, repeats and a fifth part drop out; a single origin keeps no parts.
const tidy=await p.evaluate(()=>{const a=okBean({id:'tidy1',name:'x',origin:'blend',blend:[{o:'brazil'},{o:'atlantis'},{o:'blend'},{o:'brazil'},{o:'kenya',r:'Nyeri'},{o:'peru'},{o:'india'},{o:'yemen'}]}),b=okBean({id:'tidy2',name:'y',origin:'kenya',blend:[{o:'brazil'}]});return{a:a.blend,b:'blend' in b}});
ok('stored blends keep four known, different parts; single origins keep none',JSON.stringify(tidy.a)==='[{"o":"brazil"},{"o":"kenya","r":"Nyeri"},{"o":"peru"},{"o":"india"}]'&&!tidy.b,tidy);
// A label that says blend and names two countries.
const lab=await p.evaluate(()=>{const i=parseLabel('HOUSE ESPRESSO\nA blend of Brazil and Ethiopia\nRoast: medium');const s=parseLabel('KENYA NYERI\nWashed SL28');return{o:i.origin_key,parts:(i.blend||[]).map(x=>x.o),single:s.origin_key}});
ok('a label naming a blend of two countries is read as a blend',lab.o==='blend'&&lab.parts.join()==='brazil,ethiopia'&&lab.single==='kenya',lab);
// Its share card draws.
const card=await p.evaluate(async id=>{try{const bl=await shCardFor(beanDoc(beanById(id)),{mode:'dark',col:'origin'});return bl&&bl.size}catch(e){return 'error '+e.message}},saved.id);
ok('its share card draws',card>10000,card);
ok('no errors',!errs.length,errs);await b.close()})();
