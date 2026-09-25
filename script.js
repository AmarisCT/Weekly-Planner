const monthSelect = document.querySelector('#month');
const weekInput = document.querySelector('#weekOf');
const printButton = document.querySelector('#printButton');
const loginButton = document.querySelector('#loginButton');
const customizeButton = document.querySelector('#customizeButton');
const themePanel = document.querySelector('#themePanel');
const closeThemePanel = document.querySelector('#closeThemePanel');
const panelBackdrop = document.querySelector('#panelBackdrop');

const backgroundStyle = document.querySelector('#backgroundStyle');
const pageColor = document.querySelector('#pageColor');
const stripeColor = document.querySelector('#stripeColor');
const paperColor = document.querySelector('#paperColor');
const accentColor = document.querySelector('#accentColor');
const backgroundImageUrl = document.querySelector('#backgroundImageUrl');
const backgroundImageFile = document.querySelector('#backgroundImageFile');
const backgroundSize = document.querySelector('#backgroundSize');
const imageOptions = document.querySelector('#imageOptions');
const resetTheme = document.querySelector('#resetTheme');
const presetButtons = document.querySelectorAll('[data-preset]');

const editableFields = document.querySelectorAll(
  '[contenteditable="true"][data-key]'
);

const months = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const defaultTheme = {
  backgroundStyle: 'stripes',
  pageColor: '#f7d9df',
  stripeColor: '#efc3cc',
  paperColor: '#fffaf8',
  accentColor: '#8f565d',
  backgroundImage: '',
  backgroundSize: 'cover'
};

const presets = {
  pink: {
    backgroundStyle: 'stripes',
    pageColor: '#f7d9df',
    stripeColor: '#efc3cc',
    paperColor: '#fffaf8',
    accentColor: '#8f565d',
    backgroundImage: '',
    backgroundSize: 'cover'
  },
  cream: {
    backgroundStyle: 'stripes',
    pageColor: '#f7f0df',
    stripeColor: '#eadfbe',
    paperColor: '#fffdf6',
    accentColor: '#7a6654',
    backgroundImage: '',
    backgroundSize: 'cover'
  },
  lavender: {
    backgroundStyle: 'stripes',
    pageColor: '#eee7f7',
    stripeColor: '#ddd0ee',
    paperColor: '#fffaff',
    accentColor: '#6f587f',
    backgroundImage: '',
    backgroundSize: 'cover'
  },
  dark: {
    backgroundStyle: 'solid',
    pageColor: '#2f2930',
    stripeColor: '#2f2930',
    paperColor: '#f4edf3',
    accentColor: '#6a4459',
    backgroundImage: '',
    backgroundSize: 'cover'
  }
};

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentUser() {
  return localStorage.getItem('weeklyPlanner.currentUser') || 'guest';
}

function isLoggedIn() {
  return Boolean(localStorage.getItem('weeklyPlanner.currentUser'));
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
    customizeButton.classList.add('is-hidden');
    return;
  }

  const users = getUsers();
  const name = users[currentUser]?.name || 'ACCOUNT';

  loginButton.textContent = name.toUpperCase();
  loginButton.href = 'login.html';
  customizeButton.classList.remove('is-hidden');
}

function getSavedTheme() {
  if (!isLoggedIn()) return { ...defaultTheme };

  try {
    return {
      ...defaultTheme,
      ...(JSON.parse(localStorage.getItem(userKey('theme'))) || {})
    };
  } catch {
    return { ...defaultTheme };
  }
}

function saveTheme(theme) {
  if (!isLoggedIn()) return;
  localStorage.setItem(userKey('theme'), JSON.stringify(theme));
}

function applyTheme(theme, save = false) {
  const root = document.documentElement;
  document.body.classList.remove('theme-solid', 'theme-image');

  root.style.setProperty('--stripe-a', theme.pageColor);
  root.style.setProperty('--stripe-b', theme.stripeColor);
  root.style.setProperty('--paper', theme.paperColor);
  root.style.setProperty('--deep-rose', theme.accentColor);

  if (theme.backgroundStyle === 'solid') {
    document.body.classList.add('theme-solid');
  } else if (theme.backgroundStyle === 'image') {
    document.body.classList.add('theme-image');
    const image = theme.backgroundImage ? `url("${theme.backgroundImage.replace(/"/g, '\\"')}")` : 'none';
    root.style.setProperty('--custom-bg-image', image);
    root.style.setProperty('--custom-bg-size', theme.backgroundSize || 'cover');
  }

  backgroundStyle.value = theme.backgroundStyle;
  pageColor.value = theme.pageColor;
  stripeColor.value = theme.stripeColor;
  paperColor.value = theme.paperColor;
  accentColor.value = theme.accentColor;
  backgroundImageUrl.value = theme.backgroundImage?.startsWith('data:') ? '' : (theme.backgroundImage || '');
  backgroundSize.value = theme.backgroundSize || 'cover';

  imageOptions.classList.toggle('visible', theme.backgroundStyle === 'image');
  stripeColor.closest('.theme-control').style.opacity = theme.backgroundStyle === 'stripes' ? '1' : '.45';

  if (save) saveTheme(theme);
}

function readThemeControls() {
  const current = getSavedTheme();
  return {
    backgroundStyle: backgroundStyle.value,
    pageColor: pageColor.value,
    stripeColor: stripeColor.value,
    paperColor: paperColor.value,
    accentColor: accentColor.value,
    backgroundImage: current.backgroundImage || backgroundImageUrl.value.trim(),
    backgroundSize: backgroundSize.value
  };
}

function openThemePanel() {
  themePanel.classList.add('open');
  themePanel.setAttribute('aria-hidden', 'false');
  customizeButton.setAttribute('aria-expanded', 'true');
  panelBackdrop.hidden = false;
}

function closePanel() {
  themePanel.classList.remove('open');
  themePanel.setAttribute('aria-hidden', 'true');
  customizeButton.setAttribute('aria-expanded', 'false');
  panelBackdrop.hidden = true;
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

  if (savedText) field.innerText = savedText;

  field.addEventListener('input', () => {
    localStorage.setItem(storageKey, field.innerText);
  });
});

printButton.addEventListener('click', () => window.print());

customizeButton.addEventListener('click', openThemePanel);
closeThemePanel.addEventListener('click', closePanel);
panelBackdrop.addEventListener('click', closePanel);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && themePanel.classList.contains('open')) closePanel();
});

[backgroundStyle, pageColor, stripeColor, paperColor, accentColor, backgroundSize].forEach((control) => {
  control.addEventListener('input', () => {
    const theme = readThemeControls();
    applyTheme(theme, true);
  });
  control.addEventListener('change', () => {
    const theme = readThemeControls();
    applyTheme(theme, true);
  });
});

backgroundImageUrl.addEventListener('change', () => {
  const theme = readThemeControls();
  theme.backgroundImage = backgroundImageUrl.value.trim();
  theme.backgroundStyle = 'image';
  applyTheme(theme, true);
});

backgroundImageFile.addEventListener('change', () => {
  const file = backgroundImageFile.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const theme = readThemeControls();
    theme.backgroundImage = reader.result;
    theme.backgroundStyle = 'image';
    applyTheme(theme, true);
  };
  reader.readAsDataURL(file);
});

presetButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const preset = presets[button.dataset.preset];
    if (preset) applyTheme({ ...preset }, true);
  });
});

resetTheme.addEventListener('click', () => {
  applyTheme({ ...defaultTheme }, true);
  backgroundImageFile.value = '';
});

updateLoginButton();
applyTheme(getSavedTheme());