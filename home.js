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

function weatherKind(code){
  if(code===0)return'clear';
  if([1,2,3].includes(code))return'cloudy';
  if([45,48].includes(code))return'fog';
  if([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code))return'rain';
  if([71,73,75,77,85,86].includes(code))return'snow';
  if([95,96,99].includes(code))return'storm';
  return'clear';
}

let liveCoords=null;
let liveTimezone=null;
let liveSunrise=null;
let liveSunset=null;

function minuteValue(value){
  if(!value)return null;
  const m=String(value).match(/T(\d{2}):(\d{2})/);
  return m?Number(m[1])*60+Number(m[2]):null;
}

function minutesNow(timeZone){
  try{
    const parts=new Intl.DateTimeFormat('en-GB',{
      timeZone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'
    }).formatToParts(new Date());
    const hour=Number(parts.find(p=>p.type==='hour')?.value||0);
    const minute=Number(parts.find(p=>p.type==='minute')?.value||0);
    return hour*60+minute;
  }catch{
    const d=new Date();
    return d.getHours()*60+d.getMinutes();
  }
}

function setCelestialPosition(now,sunrise,sunset){
  let isSun=false;
  let progress=.5;

  if(sunrise!==null&&sunset!==null){
    isSun=now>=sunrise&&now<sunset;
    if(isSun){
      progress=Math.max(0,Math.min(1,(now-sunrise)/(sunset-sunrise)));
    }else{
      const nightLength=(1440-sunset)+sunrise;
      const elapsed=now>=sunset?now-sunset:(1440-sunset)+now;
      progress=Math.max(0,Math.min(1,elapsed/nightLength));
    }
  }else{
    const hour=now/60;
    isSun=hour>=6&&hour<20;
    progress=isSun?(hour-6)/14:((hour>=20?hour-20:hour+4)/10);
  }

  const x=10+(progress*80);
  const arc=Math.sin(Math.PI*progress);
  const y=48-(arc*31);

  document.body.dataset.celestial=isSun?'sun':'moon';
  document.documentElement.style.setProperty('--celestial-x',x.toFixed(2)+'%');
  document.documentElement.style.setProperty('--celestial-y',y.toFixed(2)+'%');
}

function applyTimeState(){
  const tz=liveTimezone||Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now=minutesNow(tz);
  const sunrise=minuteValue(liveSunrise);
  const sunset=minuteValue(liveSunset);

  let period;
  if(sunrise!==null&&sunset!==null){
    if(now>=sunrise-60&&now<sunrise+75)period='dawn';
    else if(now>=sunrise+75&&now<sunset-75)period='day';
    else if(now>=sunset-75&&now<sunset+55)period='dusk';
    else period='night';
  }else{
    const hour=Math.floor(now/60);
    period=hour<6||hour>=21?'night':hour<9?'dawn':hour<18?'day':'dusk';
  }

  document.body.dataset.time=period;
  setCelestialPosition(now,sunrise,sunset);
}

async function refreshWeather(){
  if(!liveCoords){applyTimeState();return}

  try{
    const u=new URL('https://api.open-meteo.com/v1/forecast');
    u.searchParams.set('latitude',liveCoords.lat);
    u.searchParams.set('longitude',liveCoords.lon);
    u.searchParams.set('current','weather_code,cloud_cover,precipitation,rain,snowfall,wind_speed_10m');
    u.searchParams.set('daily','sunrise,sunset');
    u.searchParams.set('forecast_days','1');
    u.searchParams.set('timezone','auto');

    const r=await fetch(u,{cache:'no-store'});
    if(!r.ok)throw new Error('Weather request failed');
    const d=await r.json();

    liveTimezone=d.timezone||liveTimezone;
    liveSunrise=d.daily?.sunrise?.[0]||null;
    liveSunset=d.daily?.sunset?.[0]||null;

    const code=Number(d.current?.weather_code??0);
    const kind=weatherKind(code);
    const cloudCover=Math.max(0,Math.min(100,Number(d.current?.cloud_cover??0)));
    const precipitation=Math.max(0,Number(d.current?.precipitation??0));
    const rainfall=Math.max(0,Number(d.current?.rain??0));
    const snowfall=Math.max(0,Number(d.current?.snowfall??0));
    const wind=Math.max(0,Number(d.current?.wind_speed_10m??0));

    let cloudOpacity=.03+(cloudCover/100)*.68;
    if(kind==='cloudy')cloudOpacity=Math.max(cloudOpacity,.34);
    if(['rain','snow','storm'].includes(kind))cloudOpacity=Math.max(cloudOpacity,.48);

    const rainOpacity=Math.min(.94,.36+Math.max(precipitation,rainfall)*.16);
    const snowOpacity=Math.min(1,.72+snowfall*.10);
    const cloudSpeed=Math.max(15,42-Math.min(27,wind*.55));

    document.body.dataset.weather=kind;
    document.documentElement.style.setProperty('--cloud-opacity',cloudOpacity.toFixed(2));
    document.documentElement.style.setProperty('--rain-opacity',rainOpacity.toFixed(2));
    document.documentElement.style.setProperty('--snow-opacity',snowOpacity.toFixed(2));
    document.documentElement.style.setProperty('--cloud-speed',cloudSpeed.toFixed(1)+'s');

    applyTimeState();
  }catch(err){
    console.warn('Live weather unavailable',err);
    document.body.dataset.weather='clear';
    applyTimeState();
  }
}

function startLiveWindow(){
  document.body.dataset.weather='clear';
  applyTimeState();

  if(!navigator.geolocation){
    document.body.dataset.location='unsupported';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos=>{
      liveCoords={lat:pos.coords.latitude,lon:pos.coords.longitude};
      document.body.dataset.location='live';
      document.body.dataset.locationAccuracy=Math.round(pos.coords.accuracy||0);
      refreshWeather();
    },
    err=>{
      document.body.dataset.location='unavailable';
      document.body.dataset.locationError=String(err.code||'');
      applyTimeState();
    },
    {enableHighAccuracy:true,timeout:10000,maximumAge:300000}
  );
}

setInterval(applyTimeState,60000);
setInterval(refreshWeather,300000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshWeather()});

startLiveWindow();
updateAccount();
