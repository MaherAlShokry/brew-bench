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
const FP_SVG='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10a5 5 0 0 1 10 0v2a9 9 0 0 1-1.5 5 M12 10v3a10 10 0 0 1-2.5 7 M9.5 10a2.5 2.5 0 0 1 5 0v2.5 M4.5 13.5V10a7.5 7.5 0 0 1 13-5.1 M20 10v1.5"/></svg>';
const SYNC_SVG='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 0 1-14 5.3 M4 12a8 8 0 0 1 14-5.3 M18 3v4h-4 M6 21v-4h4"/></svg>';
// Your coffee style, as a title under your name.
const ROLE={bright:'Florals chaser',sweet:'Sweet-cup seeker',choc:'Comfort-cup brewer',wild:'Ferment explorer',espresso:'Espresso devotee',milk:'Milk-drink maker'};
function profileStats(){const mine=LOG.filter(l=>l&&(!l.by||l.by===ME)).length,b=window.BEANS_OK?BEANS:[],o=new Set(b.map(x=>x.origin).filter(Boolean)).size,t=window.BEANS_OK&&TGOT?Object.keys(TGOT).length:0;
  return [[b.length,b.length===1?'coffee':'coffees'],[mine,mine===1?'brew':'brews'],[o,o===1?'origin':'origins'],[t,t===1?'trophy':'trophies']]}
// Who you're signed in as, and the sync; or, signed out, what an account brings.
function accountHTML(){
  if(ACCT)return '<div class="me-acct"><div class="me-row"><span class="me-dot" aria-hidden="true"></span><span class="me-rt"><b>'+(ACCT.provider==='google.com'?'Signed in with Google':'Signed in')+'</b><small>'+esc(ACCT.email)+'</small>'+
      (ACCT.provider==='password'&&!ACCT.verified?'<button type="button" class="linkbtn" id="pf-verify">Confirm your email</button>':'')+'</span><button type="button" class="linkbtn" id="pf-out">Sign out</button></div>'+
      (BIOM?'<div class="me-row"><span class="me-ic" aria-hidden="true">'+FP_SVG+'</span><span class="me-rt"><b>Sign in with your '+bioWord()+'</b><small>'+(BIOM.saved&&BIOM.email===ACCT.email?'On for this phone':'Off')+'</small></span><button type="button" class="linkbtn" id="pf-bio">'+(BIOM.saved&&BIOM.email===ACCT.email?'Turn off':'Turn on')+'</button></div>':'')+syncLine()+'</div>';
  if(!AUTH_ON)return '<p class="me-fine">Saved on this device.</p>';
  return '<div class="me-cta"><button type="button" class="btn" id="pf-signin">Sign in or create an account</button></div>'}
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
  if(e.target.closest('#pf-bio')){const on=BIOM&&BIOM.saved&&BIOM.email===(ACCT&&ACCT.email),w=bioWord();(on?bioOff():bioOn()).then(()=>toast(on?w[0].toUpperCase()+w.slice(1)+' sign-in is off':'Next time, sign in with your '+bioWord()),err=>{if(err&&err.message&&!/cancel/i.test(err.message))toast(err.message)});return}
  if(e.target.closest('#pf-verify')){sendVerify().then(()=>toast('We sent a link to '+ACCT.email+'. Open it to confirm your email.'),err=>toast(err.message));return}});

/* ---------- Editing the profile ---------- */
// opts.join {email,pw,known}: a new account, made together with the profile in one go.
// opts.welcome: a first Google sign-in, with the profile Google's name and photo started.
function openProfileEditor(opts){opts=opts||{};const J=opts.join,d=$('vd'),isNew=!PROFILE||!!J||!!opts.welcome,P=Object.assign({nick:'',name:'',brief:'',city:'',style:'',brewer:'',origin:'',av:{e:'',c:AV_COL[0]},photo:'',since:Date.now()},PROFILE||{});delete d.dataset.me;P.av=Object.assign({},P.av);
  const brewerOpts=Object.entries(BREWERS).sort((a,b)=>a[1].name.localeCompare(b[1].name)).map(([k,b])=>'<option value="'+k+'">'+esc(b.name)+'</option>').join('');
  $('vd-in').innerHTML='<div class="vd-head" style="--c:var(--cherry)"><button class="vd-close" id="vd-x" aria-label="Close">✕</button><span class="pill"><i style="background:var(--cherry)"></i>'+(J?'Join the bench':'Your profile')+'</span><h2 id="vd-title">'+(J?'Set up your account':opts.welcome?'Welcome! Set up your profile':isNew?'Create your profile':'Edit your profile')+'</h2>'+
     (J||opts.welcome?'<p class="vd-sub">'+(J?'Choose a password, then make the profile yours. Only a nickname is needed; the rest can wait.':'We started it from your Google account. Change anything you like.')+'</p>':'')+'</div>'+
   '<div class="vd-body beform pform auth">'+(J?'<div class="au-who"><span>'+esc(J.email)+'</span><button type="button" class="linkbtn" id="au-change">Change</button></div>'+
     '<div class="field"><label for="au-pw">Password <span class="hint">at least 6 characters</span></label><div class="au-pw"><input id="au-pw" type="password" autocomplete="new-password" maxlength="100"><button type="button" class="linkbtn" id="au-show" aria-pressed="false">Show</button></div></div>'+
     (J.known===null?'<p class="au-hint">Already have an account? <button type="button" class="linkbtn" id="au-again">Try your password again</button></p>':'')+'<p class="au-err" id="au-err" role="alert" hidden></p>':'')+
   '<div class="pf-face"><div id="pf-av"></div><div class="pf-photo"><button type="button" class="btn ghost" id="pf-pick">Use a photo</button><button type="button" class="linkbtn" id="pf-nophoto">Remove the photo</button><input type="file" id="pf-file" accept="image/*" hidden></div></div>'+
   '<div class="field"><div class="lbl">Or a symbol</div><div class="pf-emoji" id="pf-emoji" role="group" aria-label="Symbol">'+['',...AV_EMOJI].map(e=>'<button type="button" data-e="'+e+'" aria-label="'+(e||'Your initials')+'">'+(e||'Aa')+'</button>').join('')+'</div></div>'+
   '<div class="field"><div class="lbl">Colour</div><div class="pf-cols" id="pf-cols" role="group" aria-label="Colour">'+AV_COL.map(c=>'<button type="button" data-c="'+c+'" style="--c:'+c+'" aria-label="Colour '+c+'"></button>').join('')+'</div></div>'+
   '<div class="two stackm"><div class="field"><label for="pf-nick">Nickname</label><input id="pf-nick" maxlength="30" autocomplete="nickname" placeholder="e.g. The V60 guy" value="'+esc(P.nick)+'"></div>'+
   '<div class="field"><label for="pf-name">Name <span class="hint">optional</span></label><input id="pf-name" maxlength="40" autocomplete="name" value="'+esc(P.name)+'"></div></div>'+
   '<div class="field"><label for="pf-brief">A few words about you <span class="hint" id="pf-count"></span></label><textarea id="pf-brief" rows="3" maxlength="160" placeholder="e.g. Chasing florals with a Switch and a ZP6. Washed Ethiopians forever.">'+esc(P.brief)+'</textarea></div>'+
   '<div class="field"><div class="lbl">How you like your coffee</div><div class="seg filters wrap" id="pf-style"></div></div>'+
   '<div class="two stackm"><div class="field"><label for="pf-brewer">Favourite brewer</label><select id="pf-brewer"><option value="">None yet</option>'+brewerOpts+'</select></div>'+
   '<div class="field"><label for="pf-origin">Favourite origin</label><select id="pf-origin"><option value="">None yet</option>'+originOptions()+'</select></div></div>'+
   '<div class="field"><label for="pf-city">Where you brew <span class="hint">optional</span></label><input id="pf-city" maxlength="40" autocomplete="address-level2" placeholder="e.g. Muscat" value="'+esc(P.city)+'"></div>'+
   '<div class="actions"><button class="btn" id="pf-save">'+(J?'Create my account':opts.welcome?'Done':isNew?'Create my profile':'Save')+'</button><button class="btn ghost" id="pf-cancel">'+(J?'Back':opts.welcome?'Later':'Cancel')+'</button></div>'+
   (J?'<p class="au-fine">We keep only what you save, and you can delete your account at any time. <a href="'+SITE_URL+'privacy.html" target="_blank" rel="noopener">Privacy policy</a></p>':'')+
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
  const back=()=>openSignIn({M:'pw',email:J.email,known:J.known,pw:$('au-pw').value});
  if(J){$('au-pw').value=J.pw||'';$('au-show').onclick=e=>{const on=$('au-pw').type==='password';$('au-pw').type=on?'text':'password';e.target.textContent=on?'Hide':'Show';e.target.setAttribute('aria-pressed',on)};
    $('au-change').onclick=()=>openSignIn({email:J.email});if($('au-again'))$('au-again').onclick=back}
  const err=m=>{const e=$('au-err');if(e){e.textContent=m;e.hidden=!m;if(m)e.scrollIntoView({block:'center',behavior:RM()?'auto':'smooth'})}else if(m)toast(m)};
  $('pf-save').onclick=async()=>{const nick=$('pf-nick').value.trim(),pw=J?$('au-pw').value:'';err('');
    if(J&&pw.length<6){err(AUTH_ERR.WEAK_PASSWORD);$('au-pw').focus();return}
    if(!nick){err('Choose a nickname');$('pf-nick').focus();return}
    const p=okProfile(Object.assign({},P,{nick,name:$('pf-name').value,brief:$('pf-brief').value,city:$('pf-city').value,brewer:$('pf-brewer').value,origin:$('pf-origin').value}));
    if(!J){saveProfile(p);d.close();toast(opts.welcome?'Welcome to the bench, '+p.nick:isNew?'Welcome, '+p.nick+'!':'Profile saved');return}
    // The account first, then the profile goes up with it. An email that already has an account goes back to its password.
    const b=$('pf-save');b.disabled=true;b.textContent='Creating…';let j;
    try{j=await idt('signUp',{email:J.email,password:pw,returnSecureToken:true})}
    catch(x){b.disabled=false;b.textContent='Create my account';
      if(/already an account/i.test(x.message)){openSignIn({M:'pw',email:J.email,known:true,note:'That password doesn’t match the account for this email. Try again, or reset it.'});return}err(x.message);return}
    setAcct(j,'password');sendVerify().catch(()=>{});PROFILE=p;save('bb-profile',p);await afterSignIn();if(PROFILE)saveProfile(PROFILE);d.close();
    toast('Welcome to the bench, '+nick+'. We sent a link to '+J.email+' to confirm it.')};
  $('pf-cancel').onclick=()=>J?back():d.close();$('vd-x').onclick=()=>d.close();
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
  if(!r.ok){if(r.status===400){signOut();toast('Your sign-in has expired. Sign in again.')}return null}
  const j=await r.json();Object.assign(ACCT,{idToken:j.id_token,refresh:j.refresh_token,exp:Date.now()+(+j.expires_in||3600)*1000-60000});save('bb-account',ACCT);return ACCT.idToken}
async function sendVerify(){const t=await idToken();if(!t)throw new Error('Sign in again first.');await idt('sendOobCode',{requestType:'VERIFY_EMAIL',idToken:t})}
function signOut(){syncForget();ACCT=null;try{localStorage.removeItem('bb-account')}catch(e){}profileChanged()}
async function deleteAccount(){const t=await idToken();if(!t)throw new Error('Sign in again first.');
  if(SYNC_DB){try{await fetch(profUrl(t),{method:'DELETE'})}catch(e){}await syncWipe(t)}await idt('delete',{idToken:t});if(BIOM&&BIOM.email===ACCT.email)await bioOff();signOut()}
/* ---------- Fingerprint or face sign-in (the Android app) ---------- */
// Turned on after a sign-in, it keeps the account's sign-in key (never the password) in the phone's keystore, and
// hands it back only after a fingerprint or face check. Signing out keeps it, so the next sign-in is one touch;
// turning it off or deleting the account removes it. bb-bio only notes which email it's for (it isn't backed up).
const BIO_SRV='brew-bench.account';let BIOM=null;
const bioPlug=()=>plugin('NativeBiometric');
const bioWord=()=>BIOM&&BIOM.kind==='face'?'face':BIOM&&BIOM.kind==='fingerprint'?'fingerprint':'fingerprint or face';
async function bioCheck(){const P=bioPlug();BIOM=null;if(!P||!AUTH_ON)return;
  try{const a=await P.isAvailable();if(!a||!a.isAvailable)return;let saved=false;try{saved=!!(await P.isCredentialsSaved({server:BIO_SRV})).isSaved}catch(e){}
    const mark=load('bb-bio',null);if(!saved&&mark)try{localStorage.removeItem('bb-bio')}catch(e){}
    BIOM={kind:a.biometryType===3?'fingerprint':a.biometryType===4?'face':'any',email:saved&&mark&&mark.email||'',saved:saved&&!!mark}}catch(e){}}
async function bioOn(){const P=bioPlug();if(!P||!ACCT)throw new Error('Sign in first.');
  await P.verifyIdentity({title:'Turn on '+bioWord()+' sign-in',subtitle:ACCT.email,negativeButtonText:'Cancel',maxAttempts:3});
  if(!(await idToken()))throw new Error('Sign in again first.');
  await P.setCredentials({username:ACCT.email,password:ACCT.refresh,server:BIO_SRV});save('bb-bio',{email:ACCT.email});await bioCheck();profileChanged()}
async function bioOff(){const P=bioPlug();if(P)try{await P.deleteCredentials({server:BIO_SRV})}catch(e){}try{localStorage.removeItem('bb-bio')}catch(e){}await bioCheck();profileChanged()}
// The check, then the kept key is swapped for a fresh session, just as the app renews one every hour.
async function bioSignIn(){const P=bioPlug();
  try{await P.verifyIdentity({title:'Sign in to The Brew Bench',subtitle:BIOM.email,negativeButtonText:'Use my password',maxAttempts:3})}catch(e){return false}
  const c=await P.getCredentials({server:BIO_SRV});let r;
  try{r=await fetch('https://securetoken.googleapis.com/v1/token?key='+encodeURIComponent(AUTHCFG.apiKey),{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=refresh_token&refresh_token='+encodeURIComponent(c.password)})}
  catch(e){throw new Error('You’re offline. Connect and try again.')}
  if(!r.ok){await bioOff();throw new Error('That saved sign-in has run out (the password may have changed). Sign in with your password, then turn '+bioWord()+' sign-in on again.')}
  const j=await r.json();let u={};try{u=((await idt('lookup',{idToken:j.id_token})).users||[])[0]||{}}catch(e){}
  const provs=(u.providerUserInfo||[]).map(x=>x.providerId);
  setAcct({localId:j.user_id,email:u.email||c.username,idToken:j.id_token,refreshToken:j.refresh_token,expiresIn:j.expires_in,emailVerified:u.emailVerified},provs.includes('google.com')&&!provs.includes('password')?'google.com':'password');
  if(ACCT.refresh!==c.password)try{await P.setCredentials({username:ACCT.email,password:ACCT.refresh,server:BIO_SRV})}catch(e){}
  await afterSignIn();return true}
bioCheck().then(()=>{if(BIOM)profileChanged()});

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
// One way in for everyone: Google, or an email first. A known email asks for its password; a new one sets up the
// account (password, nickname, name) on the next screen. Firebase may hide whether an email has an account (its
// email enumeration protection); then the password is tried first and, if nothing matches, the new-account screen
// follows, where an email that does have an account is caught and sent back to try the password again.
function openSignIn(init){if(!AUTH_ON)return;init=init||{};const d=$('vd');delete d.dataset.me;let M=init.M||'start',email=init.email||'',pw=init.pw||'',known=init.known===undefined?null:init.known,note=init.note||'';
  const HEAD={start:['Your bench, your account','Sign in or join','One account for your profile, coffees, diary and brews.'],
    pw:['Welcome back','Enter your password',''],bio:['One touch next time','Sign in with your fingerprint or face?',''],reset:['It happens','Reset your password','We’ll email you a link to choose a new one.']};
  const pwField=(ac,hint)=>'<div class="field"><label for="au-pw">Password'+(hint?' <span class="hint">'+hint+'</span>':'')+'</label><div class="au-pw"><input id="au-pw" type="password" autocomplete="'+ac+'" maxlength="100"><button type="button" class="linkbtn" id="au-show" aria-pressed="false">Show</button></div></div>';
  const who=()=>'<div class="au-who"><span>'+esc(email)+'</span><button type="button" class="linkbtn" id="au-change">Change</button></div>';
  const draw=()=>{const h=HEAD[M];let body='';
    if(M==='start')body=(BIOM&&BIOM.saved&&BIOM.email?'<button type="button" class="btn au-bio" id="au-bio">'+FP_SVG+'<span>Sign in with your '+bioWord()+'<small>'+esc(BIOM.email)+'</small></span></button><div class="au-or"><span>or</span></div>':'')+(GOOGLE_ON()?'<div class="au-google" id="au-google"></div><div class="au-or"><span>or with email</span></div>':'')+
      '<div class="field"><label for="au-email">Email</label><input id="au-email" type="email" autocomplete="email" inputmode="email" autocapitalize="off" spellcheck="false" maxlength="120" placeholder="you@example.com" value="'+esc(email)+'"></div>';
    else if(M==='pw')body=who()+pwField('current-password')+'<button type="button" class="linkbtn au-forgot" id="au-forgot">Forgot your password?</button>'+
      (known===null?'<p class="au-hint">New here? Enter the password you’d like and we’ll set up your account next.</p>':'');
    else if(M==='reset')body=who();
    else if(M==='bio')body='<p class="au-hint">Your password stays with you: the phone keeps only a sign-in key, unlocked by your '+bioWord()+'. You can turn it off from your profile.</p><div class="actions"><button type="button" class="btn" id="au-yes">Turn it on</button><button type="button" class="btn ghost" id="au-no">Not now</button></div>';
    $('vd-in').innerHTML='<div class="me-hero au-hero"><button class="vd-close me-x" id="vd-x" aria-label="Close">✕</button>'+CUP_SVG+
       '<span class="me-k">'+h[0]+'</span><h2 id="vd-title">'+h[1]+'</h2>'+(h[2]?'<p>'+h[2]+'</p>':'')+'</div>'+
     '<div class="vd-body beform auth"><form id="au-form" novalidate>'+body+'<p class="au-err" id="au-err" role="alert"'+(note?'':' hidden')+'>'+esc(note)+'</p>'+
      (M==='bio'?'':'<div class="actions"><button class="btn" id="au-go" type="submit">'+{start:'Continue',pw:'Sign in',reset:'Send the link'}[M]+'</button></div>')+'</form>'+
      (M==='reset'?'<p class="au-switch"><button type="button" class="linkbtn" id="au-back">Back</button></p>':'')+
      (M==='start'&&NATIVE&&AUTHCFG.googleClientId?'<p class="hint au-note">Signing in with Google works on the website. In the app, use your email.</p>':'')+
      '<p class="au-fine">We keep only what you save, and you can delete your account at any time. <a href="'+SITE_URL+'privacy.html" target="_blank" rel="noopener">Privacy policy</a></p></div>';
    note='';
    if($('au-google'))googleButton($('au-google'),r=>{if(r.isNewUser)openProfileEditor({welcome:true});else d.close()});
    const err=m=>{const e=$('au-err');e.textContent=m;e.hidden=!m};
    const go=m=>{if($('au-pw'))pw=$('au-pw').value;if(m==='new'){openProfileEditor({join:{email,pw,known}});return}M=m;draw()};
    if($('au-change'))$('au-change').onclick=()=>{pw='';known=null;go('start')};
    if($('au-forgot'))$('au-forgot').onclick=()=>go('reset');
    if($('au-bio'))$('au-bio').onclick=async()=>{err('');try{if(await bioSignIn()){d.close();toast('Signed in'+(PROFILE?' as '+PROFILE.nick:''))}}catch(x){await bioCheck();note=x.message;draw()}};
    if($('au-yes'))$('au-yes').onclick=async()=>{try{await bioOn();d.close();toast('Next time, sign in with your '+bioWord())}catch(x){if(!/cancel/i.test(x.message||''))err(x.message)}};
    if($('au-no'))$('au-no').onclick=()=>{save('bb-bio-no',1);d.close()};
    if($('au-back'))$('au-back').onclick=()=>go('pw');
    if($('au-pw')){$('au-pw').value=pw;$('au-show').onclick=e=>{const on=$('au-pw').type==='password';$('au-pw').type=on?'text':'password';e.target.textContent=on?'Hide':'Show';e.target.setAttribute('aria-pressed',on)}}
    const busy=(on,t)=>{const b=$('au-go');b.disabled=on;if(t)b.textContent=t};
    $('au-form').onsubmit=async e=>{e.preventDefault();err('');const label=$('au-go').textContent;
      try{if(M==='start'){email=$('au-email').value.trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){err(AUTH_ERR.INVALID_EMAIL);$('au-email').focus();return}
          busy(true,'Checking…');known=null;
          // Firebase says whether the email has an account, unless its email enumeration protection hides it.
          try{const j=await idt('createAuthUri',{identifier:email,continueUri:location.origin+'/'});if(typeof j.registered==='boolean')known=j.registered}catch(x){}
          go(known===false?'new':'pw');return}
        if(M==='reset'){busy(true,'Sending…');await idt('sendOobCode',{requestType:'PASSWORD_RESET',email});d.close();toast('Check '+email+' for a link to reset your password');return}
        pw=$('au-pw').value;
        if(M==='pw'){if(!pw){err(AUTH_ERR.MISSING_PASSWORD);$('au-pw').focus();return}busy(true,'Signing in…');
          try{const j=await idt('signInWithPassword',{email,password:pw,returnSecureToken:true});setAcct(j,'password');await afterSignIn();
            // In the app, offer one-touch sign-in once (or again when it's kept for another email).
            if(BIOM&&!(BIOM.saved&&BIOM.email===email)&&!load('bb-bio-no',0)){M='bio';draw();return}
            d.close();toast('Signed in'+(PROFILE?' as '+PROFILE.nick:''));return}
          catch(x){if(known===null&&/match|no account/i.test(x.message)){if(pw.length>=6){go('new');return}throw new Error('That email and password don’t match. New here? Choose a password of at least 6 characters.')}throw x}}
      }
      catch(x){err(x.message);busy(false,label)}};
    $('vd-x').onclick=()=>d.close();
    const f=$('vd-in').querySelector(M==='start'?'#au-email':M==='bio'?'#au-yes':'#au-pw');if(f&&!matchMedia('(pointer:coarse)').matches)setTimeout(()=>f.focus(),60)};
  draw();showDlg(d);d.scrollTop=0}
// Google's own button (Google Identity Services). Its ID token signs in to Firebase, and the name and photo start the profile.
function googleButton(el,done){loadScript('https://accounts.google.com/gsi/client').then(()=>{
    google.accounts.id.initialize({client_id:AUTHCFG.googleClientId,ux_mode:'popup',callback:async r=>{try{
      const j=await idt('signInWithIdp',{postBody:'id_token='+encodeURIComponent(r.credential)+'&providerId=google.com',requestUri:location.origin,returnSecureToken:true,returnIdpCredential:true});
      setAcct(j,'google.com');await afterSignIn({name:j.displayName||j.fullName,first:j.firstName,photo:j.photoUrl});
      // A first sign-in with Google asks once how to be known; the name and photo from Google start it off.
      if(done)done({isNewUser:!!j.isNewUser});else $('vd').close();if(!j.isNewUser)toast('Signed in with Google'+(PROFILE?' as '+PROFILE.nick:''))}catch(x){const e=$('au-err');if(e){e.textContent=x.message;e.hidden=false}}}});
    google.accounts.id.renderButton(el,{theme:curTheme()==='dark'?'filled_black':'outline',size:'large',shape:'pill',text:'continue_with',width:Math.min(360,el.clientWidth||320)})})
  .catch(()=>{el.innerHTML='<p class="hint">Google sign-in couldn’t load. Check your connection, or use your email.</p>'})}
// Pages drawn before this part of the app loaded pick the profile up now.
window.PROFILE_OK=true;profileChanged();
