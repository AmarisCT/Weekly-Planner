const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const authTitle = document.getElementById('authTitle');
const message = document.getElementById('message');

function showMode(mode) {
  const login = mode === 'login';
  loginForm.classList.toggle('hidden', !login);
  signupForm.classList.toggle('hidden', login);
  loginTab.classList.toggle('active', login);
  signupTab.classList.toggle('active', !login);
  authTitle.textContent = login ? 'LOGIN' : 'SIGN UP';
  message.textContent = '';
}

loginTab.addEventListener('click', () => showMode('login'));
signupTab.addEventListener('click', () => showMode('signup'));

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem('weeklyPlanner.users')) || {};
  } catch {
    return {};
  }
}

function saveUsers(users) {
  localStorage.setItem('weeklyPlanner.users', JSON.stringify(users));
}

signupForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim().toLowerCase();
  const password = document.getElementById('signupPassword').value;

  const users = getUsers();

  if (users[email]) {
    message.textContent = 'An account with that email already exists.';
    return;
  }

  users[email] = { name, email, password };
  saveUsers(users);
  localStorage.setItem('weeklyPlanner.currentUser', email);

  message.textContent = 'Account created. Opening your planner...';
  window.location.href = 'index.html';
});

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  const users = getUsers();
  const user = users[email];

  if (!user || user.password !== password) {
    message.textContent = 'Email or password is incorrect.';
    return;
  }

  localStorage.setItem('weeklyPlanner.currentUser', email);
  message.textContent = 'Login successful. Opening your planner...';
  window.location.href = 'index.html';
});