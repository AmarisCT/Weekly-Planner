const login=document.getElementById('homeLogin');
const wrap=document.getElementById('homeAccountWrap');
const button=document.getElementById('homeAccountButton');
const nameEl=document.getElementById('homeAccountName');
const menu=document.getElementById('homeAccountMenu');
const logout=document.getElementById('homeLogout');
const dockLogin=document.getElementById('dockLogin');
const cornerLogin=document.getElementById('cornerLogin');
const home=document.querySelector('.home');
const scene=document.getElementById('scene');
const art=document.getElementById('sceneArt');

function users(){try{return JSON.parse(localStorage.getItem('weeklyPlanner.users'))||{}}catch{return{}}}
function closeMenu(){
  if(menu)menu.hidden=true;
  if(button)button.setAttribute('aria-expanded','false');
}
function updateAccount(){
  const email=localStorage.getItem('weeklyPlanner.currentUser');
  if(!email){
    if(login)login.hidden=false;
    if(dockLogin)dockLogin.hidden=false;
    if(cornerLogin)cornerLogin.hidden=false;
    if(wrap)wrap.hidden=true;
    return;
  }
  if(login)login.hidden=true;
  if(dockLogin)dockLogin.hidden=true;
  if(cornerLogin)cornerLogin.hidden=true;
  if(wrap)wrap.hidden=false;
  if(nameEl)nameEl.textContent=(users()[email]?.name||'ACCOUNT').toUpperCase();
}

button?.addEventListener('click',()=>{
  const opening=menu.hidden;
  menu.hidden=!opening;
  button.setAttribute('aria-expanded',String(opening));
});
logout?.addEventListener('click',()=>{
  localStorage.removeItem('weeklyPlanner.currentUser');
  closeMenu();
  updateAccount();
});
document.addEventListener('click',e=>{
  if(wrap&&!wrap.contains(e.target))closeMenu();
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape')closeMenu();
});

// On portrait phones the room is wider than the screen: start with the computer centred.
const MONITOR_CENTER=0.761;
function centerOnMonitor(){
  if(!home||!scene||home.scrollWidth<=home.clientWidth+1)return;
  if(!window.matchMedia('(orientation: portrait) and (max-width: 900px)').matches){home.scrollLeft=0;return;}
  home.scrollLeft=scene.offsetWidth*MONITOR_CENTER-home.clientWidth/2;
}
if(art&&!art.complete)art.addEventListener('load',centerOnMonitor,{once:true});
centerOnMonitor();
window.addEventListener('orientationchange',()=>setTimeout(centerOnMonitor,250));

updateAccount();

// The room fills the screen, so on some screen shapes the LOGIN button drawn in
// the top-right corner gets trimmed. Then show a real button in the visible corner.
const portraitPhone=window.matchMedia('(orientation: portrait) and (max-width: 900px)');
function placeCornerControls(){
  if(!scene)return;
  const r=scene.getBoundingClientRect();
  const vw=document.documentElement.clientWidth, vh=window.innerHeight;
  const trimmed=!portraitPhone.matches&&(r.left+r.width*0.992>vw+1||r.top+r.height*0.014<-1||r.left+r.width*0.911<-1);
  document.body.classList.toggle('login-offscreen',trimmed);
  scene.style.setProperty('--corner-right',`${Math.max(0,r.right-vw)+14}px`);
  scene.style.setProperty('--corner-top',`${Math.max(0,-r.top)+14}px`);
}
placeCornerControls();
window.addEventListener('resize',placeCornerControls);
portraitPhone.addEventListener?.('change',placeCornerControls);
