const body = document.body;
const periodLabel = document.getElementById('periodLabel');
const greetingText = document.getElementById('greetingText');
const miniClock = document.getElementById('miniClock');
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
setInterval(updateRoomTime,60000);
