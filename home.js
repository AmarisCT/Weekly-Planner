const login=document.getElementById('homeLogin');
const wrap=document.getElementById('homeAccountWrap');
const button=document.getElementById('homeAccountButton');
const nameEl=document.getElementById('homeAccountName');
const menu=document.getElementById('homeAccountMenu');
const logout=document.getElementById('homeLogout');

function users(){try{return JSON.parse(localStorage.getItem('weeklyPlanner.users'))||{}}catch{return{}}}
function closeMenu(){if(menu)menu.hidden=true;if(button)button.setAttribute('aria-expanded','false')}
function updateAccount(){
  const email=localStorage.getItem('weeklyPlanner.currentUser');
  if(!email){login.hidden=false;wrap.hidden=true;return}
  login.hidden=true;wrap.hidden=false;
  nameEl.textContent=(users()[email]?.name||'ACCOUNT').toUpperCase();
}
button?.addEventListener('click',()=>{const opening=menu.hidden;menu.hidden=!opening;button.setAttribute('aria-expanded',String(opening))});
logout?.addEventListener('click',()=>{localStorage.removeItem('weeklyPlanner.currentUser');closeMenu();updateAccount()});
document.addEventListener('click',e=>{if(wrap&&!wrap.contains(e.target))closeMenu()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});

function weatherKind(c){if(c===0)return'clear';if([1,2,3].includes(c))return'cloudy';if([45,48].includes(c))return'fog';if([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(c))return'rain';if([71,73,75,77,85,86].includes(c))return'snow';if([95,96,99].includes(c))return'storm';return'clear'}
async function weather(lat,lon){
  try{
    const u=new URL('https://api.open-meteo.com/v1/forecast');
    u.searchParams.set('latitude',lat);u.searchParams.set('longitude',lon);
    u.searchParams.set('current','weather_code,is_day');u.searchParams.set('timezone','auto');
    const r=await fetch(u);const d=await r.json();
    document.body.dataset.weather=weatherKind(Number(d.current?.weather_code||0));
    document.documentElement.style.setProperty('--sky-tint',Number(d.current?.is_day)===0?'rgba(54,38,100,.13)':'transparent');
  }catch{}
}
if(navigator.geolocation){
  navigator.geolocation.getCurrentPosition(p=>weather(p.coords.latitude,p.coords.longitude),()=>weather(47.6062,-122.3321),{timeout:6000,maximumAge:900000});
}else weather(47.6062,-122.3321);

updateAccount();