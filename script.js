const monthSelect = document.querySelector('#month');
const weekInput = document.querySelector('#weekOf');
const printButton = document.querySelector('#printButton');
const loginButton = document.querySelector('#loginButton');

const editableFields = document.querySelectorAll(
  '[contenteditable="true"][data-key]'
);

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentUser() {
  return localStorage.getItem('weeklyPlanner.currentUser') || 'guest';
}

function userKey(key) {
  return `weeklyPlanner.${getCurrentUser()}.${key}`;
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem('weeklyPlanner.users')) || {};
  } catch {
    return {};
  }
}

function updateLoginButton() {
  const currentUser = localStorage.getItem('weeklyPlanner.currentUser');

  if (!currentUser) {
    loginButton.textContent = 'LOGIN';
    loginButton.href = 'login.html';
    return;
  }

  const users = getUsers();
  const name = users[currentUser]?.name || 'ACCOUNT';

  loginButton.textContent = name.toUpperCase();
  loginButton.href = 'login.html';
}

months.forEach((name, index) => {
  const option = document.createElement('option');
  option.value = String(index);
  option.textContent = name;
  monthSelect.appendChild(option);
});

const today = new Date();
const savedWeek = localStorage.getItem(userKey('weekOf'));
const savedMonth = localStorage.getItem(userKey('month'));

weekInput.value = savedWeek || getLocalDateString(today);
monthSelect.value = savedMonth ?? String(today.getMonth());

weekInput.addEventListener('change', () => {
  localStorage.setItem(userKey('weekOf'), weekInput.value);

  if (weekInput.value) {
    const selectedDate = new Date(`${weekInput.value}T12:00:00`);
    monthSelect.value = String(selectedDate.getMonth());
    localStorage.setItem(userKey('month'), monthSelect.value);
  }
});

monthSelect.addEventListener('change', () => {
  localStorage.setItem(userKey('month'), monthSelect.value);
});

editableFields.forEach((field) => {
  const storageKey = userKey(field.dataset.key);
  const savedText = localStorage.getItem(storageKey);

  if (savedText) {
    field.innerText = savedText;
  }

  field.addEventListener('input', () => {
    localStorage.setItem(storageKey, field.innerText);
  });
});

printButton.addEventListener('click', () => {
  window.print();
});

updateLoginButton();