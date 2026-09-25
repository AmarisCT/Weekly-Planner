const body = document.body;
const periodLabel = document.getElementById('periodLabel');
const greetingText = document.getElementById('greetingText');
const miniClock = document.getElementById('miniClock');
const weatherStatus = document.getElementById('weatherStatus');
const homeLogin = document.getElementById('homeLogin');
const homeAccountWrap = document.getElementById('homeAccountWrap');
const homeAccountButton = document.getElementById('homeAccountButton');
const homeAccountName = document.getElementById('homeAccountName');
const homeAccountMenu = document.getElementById('homeAccountMenu');
const homeLogout = document.getElementById('homeLogout');

function getPeriod(hour){
  if(hour >= 5 && hour < 12) return 'morning';
  if(hour >= 12 && hour < 17) return 'afternoon';
  if(hour >= 17 && hour < 20) return 'sunset';
  return 'night';
}

function updateRoomTime(){
  const now = new Date();
  const period = getPeriod(now.getHours());
  const labels = {
    morning:['MORNING LIGHT','good morning'],
    afternoon:['AFTERNOON LIGHT','good afternoon'],
    sunset:['GOLDEN HOUR','good evening'],
    night:['NIGHT MODE','wind down']
  };
  body.dataset.period = period;
  periodLabel.textContent = labels[period][0];
  greetingText.textContent = labels[period][1];
  miniClock.textContent = now.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
}

function weatherKind(code){
  if(code === 0) return 'clear';
  if([1,2,3].includes(code)) return 'cloudy';
  if([45,48].includes(code)) return 'fog';
  if([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code)) return 'rain';
  if([71,73,75,77,85,86].includes(code)) return 'snow';
  if([95,96,99].includes(code)) return 'storm';
  return 'cloudy';
}

function weatherLabel(code){
  if(code === 0) return 'clear';
  if([1,2].includes(code)) return 'partly cloudy';
  if(code === 3) return 'cloudy';
  if([45,48].includes(code)) return 'foggy';
  if([51,53,55,56,57].includes(code)) return 'drizzle';
  if([61,63,65,66,67,80,81,82].includes(code)) return 'rain';
  if([71,73,75,77,85,86].includes(code)) return 'snow';
  if([95,96,99].includes(code)) return 'storm';
  return 'local weather';
}

function skyPhase(currentTime, sunrise, sunset, isDay){
  const current = new Date(currentTime);
  const rise = new Date(sunrise);
  const set = new Date(sunset);
  const thirty = 30 * 60 * 1000;
  if(!isDay) return 'night';
  if(Math.abs(current - rise) <= thirty) return 'dawn';
  if(Math.abs(current - set) <= 60 * 60 * 1000) return 'golden';
  return 'day';
}

async function loadWeather(lat, lon){
  try{
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', lat);
    url.searchParams.set('longitude', lon);
    url.searchParams.set('current', 'temperature_2m,is_day,weather_code,cloud_cover,precipitation,rain,snowfall');
    url.searchParams.set('daily', 'sunrise,sunset');
    url.searchParams.set('temperature_unit', 'fahrenheit');
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('forecast_days', '1');

    const response = await fetch(url);
    if(!response.ok) throw new Error('Weather request failed');
    const data = await response.json();

    const code = Number(data.current?.weather_code ?? 3);
    const kind = weatherKind(code);
    const phase = skyPhase(
      data.current?.time || new Date().toISOString(),
      data.daily?.sunrise?.[0],
      data.daily?.sunset?.[0],
      Number(data.current?.is_day ?? 1)
    );

    body.dataset.weather = kind;
    body.dataset.sky = phase;

    const temp = Math.round(Number(data.current?.temperature_2m));
    const label = weatherLabel(code);
    weatherStatus.textContent = Number.isFinite(temp) ? `${label} · ${temp}°` : label;
  }catch(error){
    console.warn('Weather unavailable:', error);
    body.dataset.weather = 'clear';
    const hour = new Date().getHours();
    body.dataset.sky = hour < 6 || hour >= 20 ? 'night' : (hour < 8 ? 'dawn' : (hour >= 17 ? 'golden' : 'day'));
    weatherStatus.textContent = 'weather unavailable';
  }
}

function useLocationForWeather(){
  if(!navigator.geolocation){
    loadWeather(47.6062,-122.3321);
    return;
  }

  weatherStatus.textContent = 'allow location for live weather';

  navigator.geolocation.getCurrentPosition(
    (position)=>{
      loadWeather(position.coords.latitude, position.coords.longitude);
    },
    ()=>{
      loadWeather(47.6062,-122.3321);
      weatherStatus.textContent = 'Seattle weather';
    },
    {enableHighAccuracy:false,timeout:8000,maximumAge:15*60*1000}
  );
}

function getUsers(){
  try{return JSON.parse(localStorage.getItem('weeklyPlanner.users')) || {}}
  catch{return {}}
}

function closeAccountMenu(){
  homeAccountMenu.hidden = true;
  homeAccountButton?.setAttribute('aria-expanded','false');
}

function updateAccount(){
  const email = localStorage.getItem('weeklyPlanner.currentUser');
  if(!email){
    homeLogin.hidden = false;
    homeAccountWrap.hidden = true;
    return;
  }
  const users = getUsers();
  const name = users[email]?.name || 'ACCOUNT';
  homeLogin.hidden = true;
  homeAccountWrap.hidden = false;
  homeAccountName.textContent = name.toUpperCase();
}

homeAccountButton?.addEventListener('click',()=>{
  const open = homeAccountMenu.hidden;
  homeAccountMenu.hidden = !open;
  homeAccountButton.setAttribute('aria-expanded',String(open));
});

homeLogout?.addEventListener('click',()=>{
  localStorage.removeItem('weeklyPlanner.currentUser');
  closeAccountMenu();
  updateAccount();
});

document.addEventListener('click',(event)=>{
  if(homeAccountWrap && !homeAccountWrap.contains(event.target)) closeAccountMenu();
});

document.addEventListener('keydown',(event)=>{
  if(event.key === 'Escape') closeAccountMenu();
});

updateRoomTime();
updateAccount();
useLocationForWeather();
setInterval(updateRoomTime,60000);
setInterval(useLocationForWeather,15*60*1000);
