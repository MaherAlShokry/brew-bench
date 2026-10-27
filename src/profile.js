/* ================= YOUR PROFILE ================= */
// Who's brewing: a nickname, a few words, a face and the coffee you love. It is saved on this device and, once you
// sign in with email or Google (Firebase Authentication, over REST like the shared log), it follows you to your other
// phones and the website; sync.js carries everything else you save.

// Firebase settings for signing in (see README). Without an apiKey accounts are off and the profile stays on this device.
// googleClientId is the Web client ID Firebase creates when Google sign-in is switched on. A 'bb-fbcfg' value in
// localStorage overrides these, for testing.
const FB_AUTH={apiKey:'AIzaSyATeoG104Y_UEEsBK03z8Nq2qMBgKyI5Dk',googleClientId:'82914335375-jvcdl4lpjg916s2qu5k4bilsqmmhhf5g.apps.googleusercontent.com'};
const AUTHCFG=(()=>{try{return Object.assign({},FB_AUTH,JSON.parse(localStorage.getItem('bb-fbcfg')||'{}'))}catch(e){return FB_AUTH}})();
const AUTH_ON=!!AUTHCFG.apiKey;
// Google's sign-in window doesn't open inside an app's web view, so the Android app signs in with email.
const GOOGLE_ON=()=>AUTH_ON&&!!AUTHCFG.googleClientId&&!NATIVE;

const STYLES=[['bright','Light and bright'],['sweet','Sweet and balanced'],['choc','Chocolate and nuts'],['wild','Wild ferments'],['espresso','Espresso first'],['milk','Milk drinks']];
const AV_EMOJI=['☕','🫘','🌱','🍒','🌸','🍋','🍫','🔥','⛰️','🫖','🐦','🌙'];
const AV_COL=['#8A5A3B','#A8432F','#C9964A','#4F8A74','#6E8FA8','#9A7390','#5B5F66','#2F2622'];
const PHOTO_RE=/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
// Anything read back (from storage, a backup or the server) is checked field by field.
function okProfile(p){if(!p||typeof p!=='object')return null;const s=(v,n)=>str(v,n).replace(/[\u0000-\u001f\u007f]/g,'');const nick=s(p.nick,30);if(!nick)return null;const av=p.av&&typeof p.av==='object'?p.av:{};
  return{nick,name:s(p.name,40),brief:s(p.brief,160),city:s(p.city,40),style:STYLES.some(x=>x[0]===p.style)?p.style:'',brewer:BREWERS[p.brewer]?p.brewer:'',
    origin:typeof p.origin==='string'&&oInfo(p.origin)?p.origin:'',av:{e:AV_EMOJI.includes(av.e)?av.e:'',c:AV_COL.includes(av.c)?av.c:AV_COL[0]},
    photo:typeof p.photo==='string'&&p.photo.length<120000&&PHOTO_RE.test(p.photo)?p.photo:'',since:+p.since||Date.now(),updated:+p.updated||0}}
let PROFILE=okProfile(load('bb-profile',null));
let ACCT=load('bb-account',null);if(!(ACCT&&typeof ACCT.uid==='string'&&typeof ACCT.refresh==='string'))ACCT=null;
// The shared log signs your entries with your nickname unless you gave it another name.
if(PROFILE&&!ME)ME=PROFILE.nick;
function saveProfile(p){p.updated=Date.now();PROFILE=p;save('bb-profile',p);if(!ME||ME===p.nick)ME=p.nick;pushProfile();profileChanged()}
function profileChanged(){renderMe();const d=$('vd');if(d.open&&d.dataset.me&&!d.classList.contains('closing'))openMe(true);if(window.BEANS_OK&&$('bg-hero'))renderBeanHero()}
// Your face in the top bar (phones) and at the end of the tab bar (larger screens). It opens your profile.
function renderMe(){for(const id of ['ab-me','tab-me']){const b=$(id);if(!b)continue;b.innerHTML=avatarHTML(PROFILE,id==='ab-me'?32:30);
  b.setAttribute('aria-label',PROFILE?'Your profile: '+PROFILE.nick:'Create your profile')}}
function openMe(again){const d=$('vd');$('vd-in').innerHTML=meHTML();d.dataset.me=1;$('vd-x').onclick=()=>d.close();
  if(!again){showDlg(d);d.scrollTop=0;d.addEventListener('close',()=>{delete d.dataset.me},{once:true})}}
for(const id of ['ab-me','tab-me'])if($(id))$(id).onclick=()=>openMe();

/* ---------- The face ---------- */
const PERSON_SVG='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 19.5c.9-3.6 3.8-5.6 7.2-5.6s6.3 2 7.2 5.6"/></svg>';
const initials=p=>p.nick.split(/\s+/).filter(Boolean).map(w=>[...w][0]).join('').slice(0,2).toUpperCase();
function avatarHTML(p,size){if(!p)return '<span class="pav none" style="--s:'+size+'px">'+PERSON_SVG+'</span>';
  return '<span class="pav" style="--s:'+size+'px;--c:'+p.av.c+'">'+(p.photo?'<img src="'+p.photo+'" alt="">':p.av.e?'<i aria-hidden="true">'+p.av.e+'</i>':'<b aria-hidden="true">'+esc(initials(p))+'</b>')+'</span>'}
// A square, centred copy of a photo, small enough to keep with the profile.
function squarePhoto(src,n){return new Promise((ok,no)=>{const img=new Image();img.onload=()=>{const s=Math.min(img.width,img.height),c=document.createElement('canvas');c.width=c.height=n;
  c.getContext('2d').drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,n,n);try{ok(c.toDataURL('image/jpeg',.82))}catch(e){no(e)}};img.onerror=()=>no(new Error('image'));img.src=src})}

/* ---------- The profile sheet ---------- */
// A steaming cup, drawn in the app's cream and roast colours; the steam drifts unless motion is reduced.
const CUP_SVG='<svg class="me-cup" viewBox="0 0 120 92" aria-hidden="true"><g class="me-steam" fill="none" stroke="#F3E3C8" stroke-width="3.2" stroke-linecap="round"><path d="M47 30c-6-8 6-12 0-21"/><path d="M60 27c-6-8 6-12 0-21"/><path d="M73 30c-6-8 6-12 0-21"/></g>'+
  '<path d="M28 40h62v14a25 25 0 0 1-25 25h-12a25 25 0 0 1-25-25z" fill="#F3E3C8"/><path d="M89 46h6a9.5 9.5 0 0 1 0 19h-6" fill="none" stroke="#F3E3C8" stroke-width="5.5"/><ellipse cx="59" cy="41" rx="29" ry="4.2" fill="#5A3420"/><path d="M18 86h82" stroke="#F3E3C8" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/></svg>';
const PEN_SVG='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z M13.5 6.5l4 4"/></svg>';
const SYNC_SVG='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 0 1-14 5.3 M4 12a8 8 0 0 1 14-5.3 M18 3v4h-4 M6 21v-4h4"/></svg>';
// Your coffee style, as a title under your name.
const ROLE={bright:'Florals chaser',sweet:'Sweet-cup seeker',choc:'Comfort-cup brewer',wild:'Ferment explorer',espresso:'Espresso devotee',milk:'Milk-drink maker'};
function profileStats(){const mine=LOG.filter(l=>l&&(!l.by||l.by===ME)).length,b=window.BEANS_OK?BEANS:[],o=new Set(b.map(x=>x.origin).filter(Boolean)).size,t=window.BEANS_OK&&TGOT?Object.keys(TGOT).length:0;
  return [[b.length,b.length===1?'coffee':'coffees'],[mine,mine===1?'brew':'brews'],[o,o===1?'origin':'origins'],[t,t===1?'trophy':'trophies']]}
// Who you're signed in as, and the sync; or, signed out, what an account brings.
function accountHTML(){
  if(ACCT)return '<div class="me-acct"><div class="me-row"><span class="me-dot" aria-hidden="true"></span><span class="me-rt"><b>'+(ACCT.provider==='google.com'?'Signed in with Google':'Signed in')+'</b><small>'+esc(ACCT.email)+'</small>'+
      (ACCT.provider==='password'&&!ACCT.verified?'<button type="button" class="linkbtn" id="pf-verify">Confirm your email</button>':'')+'</span><button type="button" class="linkbtn" id="pf-out">Sign out</button></div>'+syncLine()+'</div>';
  if(!AUTH_ON)return '<p class="me-fine">Saved on this device.</p>';
  return '<div class="me-cta"><b>Keep your bench everywhere</b><ul><li>Your profile on every phone</li><li>Coffees, diary, brews and photos in sync</li><li>The app and the website, one bench</li></ul>'+
    '<button type="button" class="btn" id="pf-signin">Sign in or create an account</button></div>'}
function meHTML(){const p=PROFILE,x='<button class="vd-close me-x" id="vd-x" aria-label="Close">✕</button>';
  if(!p)return '<div class="me-hero blank">'+x+CUP_SVG+'<span class="me-k">The Brew Bench</span><h2 id="vd-title">Who’s brewing?</h2>'+
      '<p>A nickname, a face and a few words about the cups you love.</p><div class="me-acts"><button type="button" class="btn me-main" id="pf-new">Create your profile</button>'+
      (AUTH_ON&&!ACCT?'<button type="button" class="btn me-ghost" id="pf-signin">I have an account</button>':'')+'</div></div>'+(ACCT?'<div class="me-body">'+accountHTML()+'</div>':'');
  const dna=[p.origin&&['<span class="me-flag">'+flagOf(p.origin)+'</span>','Favourite origin',originName(p.origin)],p.brewer&&['☕','Favourite brewer',BREWERS[p.brewer].name],p.city&&['📍','Brews in',p.city]].filter(Boolean);
  return '<div class="me-hero" style="--c:'+p.av.c+'">'+x+'<button type="button" class="me-edit" id="pf-edit">'+PEN_SVG+'Edit</button>'+avatarHTML(p,96)+
      '<span class="me-k">'+esc(ROLE[p.style]||'Home brewer')+'</span><h2 id="vd-title">'+esc(p.nick)+'</h2>'+(p.name?'<small class="me-name">'+esc(p.name)+'</small>':'')+
      '<span class="me-since">Brewing with us since '+new Date(p.since).toLocaleDateString(undefined,{month:'long',year:'numeric'})+'</span></div>'+
    '<div class="me-body">'+(p.brief?'<blockquote class="me-brief">'+esc(p.brief)+'</blockquote>':'<button type="button" class="me-add" id="pf-edit2">Add a few words about how you take your coffee</button>')+
      '<div class="me-stats">'+profileStats().map(([n,l])=>'<span><b>'+n+'</b>'+l+'</span>').join('')+'</div>'+
      (dna.length?'<div class="me-dna">'+dna.map(([i,k,v])=>'<div><i aria-hidden="true">'+i+'</i><span><small>'+k+'</small><b>'+esc(v)+'</b></span></div>').join('')+'</div>'
        :'<button type="button" class="me-add" id="pf-edit3">Add your favourite origin, brewer and where you brew</button>')+accountHTML()+'</div>'}
$('vd').addEventListener('click',e=>{if(e.target.closest('#pf-new,#pf-edit,#pf-edit2,#pf-edit3')){delete $('vd').dataset.me;openProfileEditor();return}if(e.target.closest('#pf-signin')){delete $('vd').dataset.me;openSignIn();return}
  if(e.target.closest('#pf-out')){if(confirm('Sign out? Your profile stays on this phone.'))signOut();return}
  if(e.target.closest('#pf-verify')){sendVerify().then(()=>toast('We sent a link to '+ACCT.email+'. Open it to confirm your email.'),err=>toast(err.message));return}});

/* ---------- Editing the profile ---------- */
function openProfileEditor(){const d=$('vd'),isNew=!PROFILE,P=Object.assign({nick:'',name:'',brief:'',city:'',style:'',brewer:'',origin:'',av:{e:'',c:AV_COL[0]},photo:'',since:Date.now()},PROFILE||{});P.av=Object.assign({},P.av);
  const brewerOpts=Object.entries(BREWERS).sort((a,b)=>a[1].name.localeCompare(b[1].name)).map(([k,b])=>'<option value="'+k+'">'+esc(b.name)+'</option>').join('');
  $('vd-in').innerHTML='<div class="vd-head" style="--c:var(--cherry)"><button class="vd-close" id="vd-x" aria-label="Close">✕</button><span class="pill"><i style="background:var(--cherry)"></i>Your profile</span><h2 id="vd-title">'+(isNew?'Create your profile':'Edit your profile')+'</h2></div>'+
   '<div class="vd-body beform pform"><div class="pf-face"><div id="pf-av"></div><div class="pf-photo"><button type="button" class="btn ghost" id="pf-pick">Use a photo</button><button type="button" class="linkbtn" id="pf-nophoto">Remove the photo</button><input type="file" id="pf-file" accept="image/*" hidden></div></div>'+
   '<div class="field"><div class="lbl">Or a symbol</div><div class="pf-emoji" id="pf-emoji" role="group" aria-label="Symbol">'+['',...AV_EMOJI].map(e=>'<button type="button" data-e="'+e+'" aria-label="'+(e||'Your initials')+'">'+(e||'Aa')+'</button>').join('')+'</div></div>'+
   '<div class="field"><div class="lbl">Colour</div><div class="pf-cols" id="pf-cols" role="group" aria-label="Colour">'+AV_COL.map(c=>'<button type="button" data-c="'+c+'" style="--c:'+c+'" aria-label="Colour '+c+'"></button>').join('')+'</div></div>'+
   '<div class="two stackm"><div class="field"><label for="pf-nick">Nickname</label><input id="pf-nick" maxlength="30" autocomplete="nickname" placeholder="e.g. The V60 guy" value="'+esc(P.nick)+'"></div>'+
   '<div class="field"><label for="pf-name">Name <span class="hint">optional</span></label><input id="pf-name" maxlength="40" autocomplete="name" value="'+esc(P.name)+'"></div></div>'+
   '<div class="field"><label for="pf-brief">A few words about you <span class="hint" id="pf-count"></span></label><textarea id="pf-brief" rows="3" maxlength="160" placeholder="e.g. Chasing florals with a Switch and a ZP6. Washed Ethiopians forever.">'+esc(P.brief)+'</textarea></div>'+
   '<div class="field"><div class="lbl">How you like your coffee</div><div class="seg filters wrap" id="pf-style"></div></div>'+
   '<div class="two stackm"><div class="field"><label for="pf-brewer">Favourite brewer</label><select id="pf-brewer"><option value="">None yet</option>'+brewerOpts+'</select></div>'+
   '<div class="field"><label for="pf-origin">Favourite origin</label><select id="pf-origin"><option value="">None yet</option>'+originOptions()+'</select></div></div>'+
   '<div class="field"><label for="pf-city">Where you brew <span class="hint">optional</span></label><input id="pf-city" maxlength="40" autocomplete="address-level2" placeholder="e.g. Muscat" value="'+esc(P.city)+'"></div>'+
   '<div class="actions"><button class="btn" id="pf-save">'+(isNew?'Create my profile':'Save')+'</button><button class="btn ghost" id="pf-cancel">Cancel</button></div>'+
   (isNew?'':'<button type="button" class="linkbtn danger" id="pf-del">'+(ACCT?'Delete my account and profile':'Delete my profile')+'</button>')+'</div>';
  $('pf-brewer').value=P.brewer;$('pf-origin').value=P.origin;
  const face=()=>{$('pf-av').innerHTML=avatarHTML(okProfile(Object.assign({},P,{nick:$('pf-nick').value.trim()||'?'})),96);$('pf-nophoto').hidden=!P.photo;
    $('pf-emoji').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',!P.photo&&b.dataset.e===P.av.e));$('pf-cols').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.c===P.av.c))};
  const count=()=>{$('pf-count').textContent=$('pf-brief').value.length+'/160'};
  const style=()=>seg('pf-style',STYLES,()=>P.style,v=>{P.style=P.style===v?'':v;style()});style();face();count();
  $('pf-nick').oninput=face;$('pf-brief').oninput=count;
  $('pf-emoji').onclick=e=>{const b=e.target.closest('[data-e]');if(!b)return;P.av.e=b.dataset.e;P.photo='';face()};
  $('pf-cols').onclick=e=>{const b=e.target.closest('[data-c]');if(!b)return;P.av.c=b.dataset.c;face()};
  $('pf-pick').onclick=()=>$('pf-file').click();$('pf-nophoto').onclick=()=>{P.photo='';face()};
  $('pf-file').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{P.photo=await squarePhoto(await fileURL(f),192);face()}catch(_){toast('That photo couldn’t be read')}};
  $('pf-save').onclick=()=>{const nick=$('pf-nick').value.trim();if(!nick){toast('Choose a nickname');$('pf-nick').focus();return}
    const p=okProfile(Object.assign({},P,{nick,name:$('pf-name').value,brief:$('pf-brief').value,city:$('pf-city').value,brewer:$('pf-brewer').value,origin:$('pf-origin').value}));
    saveProfile(p);d.close();toast(isNew?'Welcome, '+p.nick+'!':'Profile saved')};
  $('pf-cancel').onclick=()=>d.close();$('vd-x').onclick=()=>d.close();
  if($('pf-del'))$('pf-del').onclick=async()=>{if(!confirm(ACCT?'Delete your account? Your profile and everything synced to it are removed from the server, and this can’t be undone. This phone keeps its own copy of your coffees, brews and recipes.':'Delete your profile from this phone?'))return;
    const had=!!ACCT;if(had){try{await deleteAccount()}catch(err){toast(err.message);return}}PROFILE=null;try{localStorage.removeItem('bb-profile')}catch(_){}d.close();profileChanged();toast(had?'Your account and profile are deleted':'Profile deleted')};
  showDlg(d);d.scrollTop=0}

/* ---------- Signing in (Firebase Authentication REST API) ---------- */
const IDT='https://identitytoolkit.googleapis.com/v1/accounts:';
const AUTH_ERR={EMAIL_EXISTS:'There’s already an account with that email. Sign in instead.',EMAIL_NOT_FOUND:'There’s no account with that email yet. Create one instead.',
  INVALID_PASSWORD:'That password doesn’t match.',INVALID_LOGIN_CREDENTIALS:'That email and password don’t match.',INVALID_EMAIL:'That doesn’t look like an email address.',
  WEAK_PASSWORD:'Use a password of at least 6 characters.',MISSING_PASSWORD:'Enter your password.',TOO_MANY_ATTEMPTS_TRY_LATER:'Too many tries. Wait a few minutes and try again.',
  USER_DISABLED:'This account has been switched off.',OPERATION_NOT_ALLOWED:'That way of signing in isn’t switched on for this app yet.',CREDENTIAL_TOO_OLD_LOGIN_AGAIN:'For your safety, sign out and in again, then try once more.',
  TOKEN_EXPIRED:'For your safety, sign out and in again, then try once more.',INVALID_ID_TOKEN:'Your sign-in has expired. Sign in again.',USER_NOT_FOUND:'That account no longer exists.'};
async function idt(op,body){let r;try{r=await fetch(IDT+op+'?key='+encodeURIComponent(AUTHCFG.apiKey),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})}
  catch(e){throw new Error('You’re offline. Connect and try again.')}
  const j=await r.json().catch(()=>({}));if(!r.ok){const code=String(j.error&&j.error.message||'').split(/[ :]/)[0];throw new Error(AUTH_ERR[code]||'Couldn’t do that ('+(code||r.status)+'). Try again.')}return j}
function setAcct(j,provider){ACCT={uid:j.localId,email:j.email||'',provider,idToken:j.idToken,refresh:j.refreshToken,exp:Date.now()+(+j.expiresIn||3600)*1000-60000,verified:!!j.emailVerified||provider!=='password'};save('bb-account',ACCT)}
// A fresh ID token, renewed with the refresh token when the old one has run out (they last an hour).
async function idToken(){if(!ACCT)return null;if(ACCT.idToken&&Date.now()<ACCT.exp)return ACCT.idToken;let r;
  try{r=await fetch('https://securetoken.googleapis.com/v1/token?key='+encodeURIComponent(AUTHCFG.apiKey),{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=refresh_token&refresh_token='+encodeURIComponent(ACCT.refresh)})}catch(e){return null}
  if(!r.ok){if(r.status===400){signOut();toast('Your sign-in has expired. Sign in again to keep your profile in sync.')}return null}
  const j=await r.json();Object.assign(ACCT,{idToken:j.id_token,refresh:j.refresh_token,exp:Date.now()+(+j.expires_in||3600)*1000-60000});save('bb-account',ACCT);return ACCT.idToken}
async function sendVerify(){const t=await idToken();if(!t)throw new Error('Sign in again first.');await idt('sendOobCode',{requestType:'VERIFY_EMAIL',idToken:t})}
function signOut(){syncForget();ACCT=null;try{localStorage.removeItem('bb-account')}catch(e){}profileChanged()}
async function deleteAccount(){const t=await idToken();if(!t)throw new Error('Sign in again first.');
  if(SYNC_DB){try{await fetch(profUrl(t),{method:'DELETE'})}catch(e){}await syncWipe(t)}await idt('delete',{idToken:t});signOut()}
// Once signed in: bring down the profile kept with the account, or keep the one made on this phone.
async function afterSignIn(g){g=g||{};
  if(!PROFILE&&(g.name||g.photo)){const nick=str(g.first||String(g.name||'').split(' ')[0],30)||'Coffee lover';let photo='';if(g.photo)try{photo=await squarePhoto(await (await fetch(g.photo)).blob().then(fileURL),192)}catch(e){}
    PROFILE=okProfile({nick,name:g.name||'',photo,since:Date.now(),updated:0});if(PROFILE)save('bb-profile',PROFILE)}
  await pullProfile();profileChanged();syncNow()}

/* ---------- The profile on the server (the shared log's database) ---------- */
// Each account can read and write only its own profile; see the database rules in the README.
const profUrl=t=>SYNC_DB.replace(/\/+$/,'')+'/profiles/'+encodeURIComponent(ACCT.uid)+'.json?auth='+encodeURIComponent(t);
async function pushProfile(){if(!ACCT||!SYNC_DB||!PROFILE)return;const t=await idToken();if(!t)return;
  try{await fetch(profUrl(t),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(PROFILE)})}catch(e){}}
async function pullProfile(){if(!ACCT||!SYNC_DB)return;const t=await idToken();if(!t)return;let rp=null;
  try{const r=await fetch(profUrl(t));if(!r.ok)return;rp=okProfile(await r.json())}catch(e){return}
  if(rp&&(!PROFILE||rp.updated>PROFILE.updated)){PROFILE=rp;save('bb-profile',rp);if(!ME)ME=rp.nick}else if(PROFILE)pushProfile()}
// Keep the profile current on every visit.
if(ACCT)setTimeout(()=>pullProfile().then(profileChanged),1500);

/* ---------- The sign-in sheet ---------- */
function openSignIn(mode){if(!AUTH_ON)return;const d=$('vd');let M=mode||'in';
  const draw=()=>{const up=M==='up',reset=M==='reset';
    $('vd-in').innerHTML='<div class="me-hero au-hero">'+'<button class="vd-close me-x" id="vd-x" aria-label="Close">✕</button>'+CUP_SVG+
       '<span class="me-k">'+(reset?'It happens':up?'Join the bench':'Welcome back')+'</span><h2 id="vd-title">'+(reset?'Reset your password':up?'Create your account':'Sign in')+'</h2>'+
       '<p>'+(reset?'We’ll email you a link to choose a new one.':up?'One account for your profile, coffees, diary, brews and photos, on every phone and the website.':'Pick up your bench where you left it: your coffees, diary and brews come with you.')+'</p></div>'+
     '<div class="vd-body beform auth">'+
      (up?'<ul class="au-perks"><li><i aria-hidden="true">👤</i>Your profile on every phone</li><li><i aria-hidden="true">🫘</i>Coffees, diary and brews in sync</li><li><i aria-hidden="true">🌐</i>The app and the website, one bench</li></ul>':'')+
      (!reset&&GOOGLE_ON()?'<div class="au-google" id="au-google"></div><div class="au-or"><span>or with email</span></div>':'')+
      '<form id="au-form" novalidate><div class="field"><label for="au-email">Email</label><input id="au-email" type="email" autocomplete="email" inputmode="email" autocapitalize="off" spellcheck="false" maxlength="120" placeholder="you@example.com"></div>'+
      (reset?'':'<div class="field"><label for="au-pw">Password'+(up?' <span class="hint">at least 6 characters</span>':'')+'</label><div class="au-pw"><input id="au-pw" type="password" autocomplete="'+(up?'new-password':'current-password')+'" maxlength="100"><button type="button" class="linkbtn" id="au-show" aria-pressed="false">Show</button></div></div>')+
      (M==='in'?'<button type="button" class="linkbtn au-forgot" id="au-forgot">Forgot your password?</button>':'')+
      '<p class="au-err" id="au-err" role="alert" hidden></p><div class="actions"><button class="btn" id="au-go" type="submit">'+(reset?'Send the link':up?'Create my account':'Sign in')+'</button></div></form>'+
      '<p class="au-switch">'+(reset?'<button type="button" class="linkbtn" id="au-back">Back to sign in</button>':up?'Already have an account? <button type="button" class="linkbtn" id="au-to-in">Sign in</button>':'New to the bench? <button type="button" class="linkbtn" id="au-to-up">Create an account</button>')+'</p>'+
      (NATIVE&&AUTHCFG.googleClientId?'<p class="hint au-note">Signing in with Google works on the website. In the app, use your email.</p>':'')+
      '<p class="au-fine">We keep only what you save, and you can delete your account at any time. <a href="'+SITE_URL+'privacy.html" target="_blank" rel="noopener">Privacy policy</a></p></div>';
    for(const [id,m] of [['au-to-up','up'],['au-to-in','in']])if($(id))$(id).onclick=()=>{const v=$('au-email').value;M=m;draw();$('au-email').value=v;$('au-email').focus()};
    if($('au-google'))googleButton($('au-google'));
    const err=m=>{const e=$('au-err');e.textContent=m;e.hidden=!m};
    if($('au-show'))$('au-show').onclick=e=>{const on=$('au-pw').type==='password';$('au-pw').type=on?'text':'password';e.target.textContent=on?'Hide':'Show';e.target.setAttribute('aria-pressed',on)};
    if($('au-forgot'))$('au-forgot').onclick=()=>{const v=$('au-email').value;M='reset';draw();$('au-email').value=v};
    if($('au-back'))$('au-back').onclick=()=>{M='in';draw()};
    $('au-form').onsubmit=async e=>{e.preventDefault();const email=$('au-email').value.trim(),pw=$('au-pw')?$('au-pw').value:'';err('');
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){err(AUTH_ERR.INVALID_EMAIL);$('au-email').focus();return}
      if(!reset&&(up?pw.length<6:!pw)){err(up?AUTH_ERR.WEAK_PASSWORD:AUTH_ERR.MISSING_PASSWORD);$('au-pw').focus();return}
      const b=$('au-go');b.disabled=true;b.textContent=reset?'Sending…':up?'Creating…':'Signing in…';
      try{if(reset){await idt('sendOobCode',{requestType:'PASSWORD_RESET',email});d.close();toast('Check '+email+' for a link to reset your password');return}
        const j=await idt(up?'signUp':'signInWithPassword',{email,password:pw,returnSecureToken:true});setAcct(j,'password');
        if(up)sendVerify().catch(()=>{});await afterSignIn();d.close();
        toast(up?'Account created. We sent a link to '+email+' to confirm it.':'Signed in'+(PROFILE?' as '+PROFILE.nick:''));if(up&&!PROFILE)setTimeout(openProfileEditor,350)}
      catch(x){err(x.message);b.disabled=false;b.textContent=reset?'Send the link':up?'Create account':'Sign in'}};
    $('vd-x').onclick=()=>d.close()};
  draw();showDlg(d);d.scrollTop=0}
// Google's own button (Google Identity Services). Its ID token signs in to Firebase, and the name and photo start the profile.
function googleButton(el){loadScript('https://accounts.google.com/gsi/client').then(()=>{
    google.accounts.id.initialize({client_id:AUTHCFG.googleClientId,ux_mode:'popup',callback:async r=>{try{
      const j=await idt('signInWithIdp',{postBody:'id_token='+encodeURIComponent(r.credential)+'&providerId=google.com',requestUri:location.origin,returnSecureToken:true,returnIdpCredential:true});
      setAcct(j,'google.com');await afterSignIn({name:j.displayName||j.fullName,first:j.firstName,photo:j.photoUrl});$('vd').close();
      toast('Signed in with Google'+(PROFILE?' as '+PROFILE.nick:''))}catch(x){const e=$('au-err');if(e){e.textContent=x.message;e.hidden=false}}}});
    google.accounts.id.renderButton(el,{theme:curTheme()==='dark'?'filled_black':'outline',size:'large',shape:'pill',text:'continue_with',width:Math.min(360,el.clientWidth||320)})})
  .catch(()=>{el.innerHTML='<p class="hint">Google sign-in couldn’t load. Check your connection, or use your email.</p>'})}
// Pages drawn before this part of the app loaded pick the profile up now.
window.PROFILE_OK=true;profileChanged();
