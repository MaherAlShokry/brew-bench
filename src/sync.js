/* ================= SYNC ================= */
// Signed in, what you keep follows your account to every phone and the website: your coffees with their diaries,
// brews, recipes, scans and photos, your Top 5, trophies and favourites, your gear and calibration, and the app's look.
// Each item is compared three ways: this device, the account, and how both looked at the last sync. So a coffee
// edited on the phone and a brew logged on the website both survive; the same item changed in two places keeps this
// device's version, except when a device joins the account for the first time, where the account's copy wins.
// Changes made here go up a few seconds later. Changes from your other devices come in when the app opens or you
// return to it; the page then reloads once to show them.
// Layout in the database (each account reads and writes only its own, see the README):
//   users/<uid>/data/col/<list>/<id>  {t, d: the item as JSON} or {t, del:1}
//   users/<uid>/data/kv/<key>         {t, d: the stored text} or {t, del:1}
//   users/<uid>/data/img/<key>        {t, s: a fingerprint of the photo} or {t, del:1}
//   userimg/<uid>/<key>               the photo itself
const SYNC_COLS=['bb-beans','bb-log','bb-scans','bb-myrecipes'];
const SYNC_KEYS=['bb-top3','bb-trophies','bb-favs','bb-custom-grinders','bb-mygrinders','bb-mybrewers','bb-base3','bb-calc','bb-ui','bb-theme','bb-cardstyle','bb-group','bb-name'];
const SYNC_ID=/^[A-Za-z0-9_:-]{1,40}$/;
const fnv=s=>{let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)}return(h>>>0).toString(36)+'.'+s.length.toString(36)};
// Photos are large: their fingerprint is taken from the length and both ends.
const imgSig=v=>fnv(v.length+v.slice(0,4000)+v.slice(-4000));
let SHADOW=load('bb-syncshadow',null),SYNC_AT=+load('bb-syncat',0)||0,SYNC_ERR='',SYNC_BUSY=false,SYNC_MORE=0,SYNC_T=null;
const syncOn=()=>!!(window.PROFILE_OK&&ACCT&&SYNC_DB);
const syncBase=()=>SYNC_DB.replace(/\/+$/,'');
// The lists as stored, keyed by id. The brew log isn't synced while you're in a shared log (the group carries it),
// and entries other people added to a shared log are never copied into your account.
function localList(k){let a;try{a=JSON.parse(localStorage.getItem(k)||'[]')}catch(e){a=[]}if(!Array.isArray(a))a=[];const m=new Map();
  for(const x of a)if(x&&typeof x.id==='string'&&SYNC_ID.test(x.id)&&!(k==='bb-log'&&x.by&&x.by!==ME))m.set(x.id,JSON.stringify(x));return{a,m}}
// One item, three ways. Returns 'push', 'pull' or '' (nothing to do), and settles the shadow when both already agree.
function syncMerge(H,sk,local,remoteText){const s=H[sk],lh=local==null?null:fnv(local),rh=remoteText==null?null:fnv(remoteText);
  if(lh===rh){if(lh===null)delete H[sk];else H[sk]=lh;return ''}
  const lc=lh!==(s===undefined?null:s),rc=rh!==(s===undefined?null:s);
  return lc&&rc?(s===undefined?'pull':'push'):lc?'push':rc?'pull':''}
// apply: also bring in other devices' changes (only when the page can reload safely). Returns true when it did.
async function sync(apply){if(!syncOn())return false;if(SYNC_BUSY){SYNC_MORE=Math.max(SYNC_MORE,apply?2:1);return false}
  SYNC_BUSY=true;let pulled=false;
  try{const tok=await idToken();if(!tok)return false;const uid=encodeURIComponent(ACCT.uid),q='.json?auth='+encodeURIComponent(tok);
    if(!SHADOW||SHADOW.uid!==ACCT.uid)SHADOW={uid:ACCT.uid,h:{}};const H=SHADOW.h,now=Date.now();
    const res=await fetch(syncBase()+'/users/'+uid+'/data'+q);if(!res.ok)throw Object.assign(new Error('read'),{status:res.status});const R=(await res.json())||{};
    const up={},done=[],pulls=[];const txt=r=>r&&!r.del&&typeof r.d==='string'?r.d:null;
    // Lists, item by item.
    for(const k of SYNC_COLS){if(k==='bb-log'&&GROUP)continue;const L=localList(k),RC=(R.col&&R.col[k])||{},pre='c|'+k+'|';
      const ids=new Set([...L.m.keys(),...Object.keys(RC).filter(i=>SYNC_ID.test(i)),...Object.keys(H).filter(x=>x.startsWith(pre)).map(x=>x.slice(pre.length))]);
      const sets=new Map(),dels=new Set();
      for(const id of ids){const l=L.m.has(id)?L.m.get(id):null,r=txt(RC[id]),a=syncMerge(H,pre+id,l,r);
        if(a==='push'){up['col/'+k+'/'+id]=l==null?{t:now,del:1}:{t:now,d:l};done.push([pre+id,l])}
        else if(a==='pull'&&apply){if(r==null)dels.add(id);else sets.set(id,r);done.push([pre+id,r])}}
      if(sets.size||dels.size){const out=[];for(const x of L.a){const id=x&&x.id;if(dels.has(id))continue;if(sets.has(id)){out.push(JSON.parse(sets.get(id)));sets.delete(id)}else out.push(x)}
        for(const v of sets.values())out.unshift(JSON.parse(v));pulls.push([k,JSON.stringify(out)])}}
    // Settings, each as a whole.
    for(const k of SYNC_KEYS){const l=localStorage.getItem(k),r=txt(R.kv&&R.kv[k]),a=syncMerge(H,'k|'+k,l,r);
      if(a==='push'){up['kv/'+k]=l==null?{t:now,del:1}:{t:now,d:l};done.push(['k|'+k,l])}else if(a==='pull'&&apply){pulls.push([k,r]);done.push(['k|'+k,r])}}
    // Photos: uploaded and fetched one by one, their fingerprints listed with the rest.
    const imgs=await BIMG.all(),RI=R.img||{},keys=new Set([...Object.keys(imgs).filter(i=>SYNC_ID.test(i)),...Object.keys(RI).filter(i=>SYNC_ID.test(i)),...Object.keys(H).filter(x=>x.startsWith('i|')).map(x=>x.slice(2))]);
    const imgUrl=k=>syncBase()+'/userimg/'+uid+'/'+encodeURIComponent(k)+q;
    for(const k of keys){const l=typeof imgs[k]==='string'?imgSig(imgs[k]):null,r=RI[k]&&!RI[k].del?RI[k].s:null,a=syncMerge(H,'i|'+k,l,r);
      if(a==='push'){const w=await fetch(imgUrl(k),l==null?{method:'DELETE'}:{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(imgs[k])});
        if(!w.ok)throw Object.assign(new Error('photo'),{status:w.status});up['img/'+k]=l==null?{t:now,del:1}:{t:now,s:l};done.push(['i|'+k,l])}
      else if(a==='pull'&&apply){if(r==null)await BIMG.del(k);else{const g=await fetch(imgUrl(k));const v=g.ok?await g.json():null;if(typeof v!=='string'||!/^data:image\//.test(v))continue;await BIMG.put(k,v)}
        pulled=true;done.push(['i|'+k,r])}}
    if(Object.keys(up).length){const w=await fetch(syncBase()+'/users/'+uid+'/data'+q,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(up)});if(!w.ok)throw Object.assign(new Error('write'),{status:w.status})}
    for(const [k,v] of pulls){if(v==null)localStorage.removeItem(k);else localStorage.setItem(k,v);pulled=true}
    for(const [sk,v] of done){if(v==null)delete H[sk];else H[sk]=fnv(v)}
    save('bb-syncshadow',SHADOW);SYNC_AT=Date.now();save('bb-syncat',SYNC_AT);SYNC_ERR=''}
  // A refusal (401/403) means the database's rules don't let accounts keep their data yet (see the README).
  catch(e){SYNC_ERR=navigator.onLine===false?'offline':e.status===401||e.status===403?'rules':'error'}
  finally{SYNC_BUSY=false;const more=SYNC_MORE;SYNC_MORE=0;if(more)setTimeout(()=>more===2?syncNow():sync(false),200)}
  return pulled}
// Safe to reload: no sheet open and nothing being typed.
const syncSafe=()=>!document.querySelector('dialog[open]')&&!(document.activeElement&&/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName));
// Bring everything in and show it. A page that has just reloaded for a sync only sends its own changes, so two devices
// can never bounce reloads back and forth.
// Asked for with Sync now, it brings everything in straight away, even with the profile open.
async function syncNow(force){if(!syncOn())return;let last=0;try{last=+sessionStorage.getItem('bb-syncreload')||0}catch(e){}
  const since=Date.now()-last,apply=force===true||syncSafe()&&since>5000;const pulled=await sync(apply);
  if(pulled){try{sessionStorage.setItem('bb-syncreload',String(Date.now()))}catch(e){}location.reload();return}
  if(!apply){if(since<=5000)setTimeout(syncNow,5200-since);else SYNC_WAIT=true}if(window.PROFILE_OK)profileChanged()}
let SYNC_WAIT=false;
// Send this device's changes a few seconds after the last one.
function syncSoon(){if(!syncOn())return;clearTimeout(SYNC_T);SYNC_T=setTimeout(()=>sync(false).then(()=>{if(window.PROFILE_OK)profileChanged()}),4000)}
// Every saved change to a synced list or setting, and every photo saved or removed, sends it up.
{const set=Storage.prototype.setItem,rm=Storage.prototype.removeItem,watch=k=>SYNC_COLS.includes(k)||SYNC_KEYS.includes(k);
  Storage.prototype.setItem=function(k,v){set.call(this,k,v);if(this===window.localStorage&&watch(k))syncSoon()};
  Storage.prototype.removeItem=function(k){rm.call(this,k);if(this===window.localStorage&&watch(k))syncSoon()}}
{const put=BIMG.put,del=BIMG.del;BIMG.put=(k,v)=>put(k,v).then(r=>{syncSoon();return r});BIMG.del=k=>del(k).then(r=>{syncSoon();return r})}
// Signing out or into another account starts the comparison afresh; deleting the account removes its data.
function syncForget(){SHADOW=null;SYNC_AT=0;try{localStorage.removeItem('bb-syncshadow');localStorage.removeItem('bb-syncat')}catch(e){}}
async function syncWipe(tok){const uid=encodeURIComponent(ACCT.uid),q='.json?auth='+encodeURIComponent(tok);
  for(const p of ['/users/'+uid,'/userimg/'+uid])try{await fetch(syncBase()+p+q,{method:'DELETE'})}catch(e){}syncForget()}
// When to sync: on opening, on coming back to the app, when back online, and when a sheet that held it up closes.
if(syncOn())setTimeout(syncNow,900);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&syncOn()&&Date.now()-SYNC_AT>20000)syncNow()});
addEventListener('online',()=>syncSoon());
document.addEventListener('close',()=>{if(SYNC_WAIT){SYNC_WAIT=false;setTimeout(syncNow,500)}},true);
// The line on the profile card.
// Shown only when something is wrong: working sync needs no mention.
function syncLine(){if(!syncOn()||!SYNC_ERR)return '';const ago=SYNC_AT?Math.round((Date.now()-SYNC_AT)/60000):-1;
  const when=SYNC_ERR==='offline'?'Offline: changes go up when you’re back':SYNC_ERR==='rules'?'The database turned sync away':SYNC_ERR?'Couldn’t sync just now':ago<0?'Not synced yet':ago<1?'Synced just now':'Synced '+(ago<60?ago+' min ago':Math.round(ago/60)+' h ago');
  return '<div class="me-row me-syncrow'+(SYNC_ERR?' off':'')+'"><span class="me-ic" aria-hidden="true">'+SYNC_SVG+'</span><span class="me-rt"><b>'+when+'</b>'+(SYNC_ERR==='rules'?'<small>Its rules don’t allow saving your data yet. Publish the rules from the README in the Firebase console.</small>':'')+'</span><button type="button" class="linkbtn" id="pf-sync">Sync now</button></div>'}
$('vd').addEventListener('click',e=>{const b=e.target.closest('#pf-sync');if(!b||b.disabled)return;b.disabled=true;b.textContent='Syncing…';
  syncNow(true).then(()=>toast(SYNC_ERR==='offline'?'You’re offline. Your changes go up when you’re back':SYNC_ERR==='rules'?'The database turned sync away: its rules need publishing':SYNC_ERR?'Couldn’t sync. Try again in a moment':'Everything’s in sync'))});
