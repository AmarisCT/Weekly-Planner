const login=document.getElementById('homeLogin');
const wrap=document.getElementById('homeAccountWrap');
const button=document.getElementById('homeAccountButton');
const nameEl=document.getElementById('homeAccountName');
const menu=document.getElementById('homeAccountMenu');
const logout=document.getElementById('homeLogout');

function users(){try{return JSON.parse(localStorage.getItem('weeklyPlanner.users'))||{}}catch{return{}}}
function closeMenu(){
  if(menu)menu.hidden=true;
  if(button)button.setAttribute('aria-expanded','false');
}
function updateAccount(){
  const email=localStorage.getItem('weeklyPlanner.currentUser');
  if(!email){
    if(login)login.hidden=false;
    if(wrap)wrap.hidden=true;
    return;
  }
  if(login)login.hidden=true;
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

updateAccount();
