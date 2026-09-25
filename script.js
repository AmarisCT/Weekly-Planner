const monthSelect = document.querySelector('#month');
const weekInput = document.querySelector('#weekOf');
const printButton = document.querySelector('#printButton');
const loginButton = document.querySelector('#loginButton');
const customizeButton = document.querySelector('#customizeButton');
const themePanel = document.querySelector('#themePanel');
const closeThemePanel = document.querySelector('#closeThemePanel');
const panelBackdrop = document.querySelector('#panelBackdrop');
const accountWrap = document.querySelector('#accountWrap');
const accountButton = document.querySelector('#accountButton');
const accountName = document.querySelector('#accountName');
const accountMenu = document.querySelector('#accountMenu');
const menuCustomize = document.querySelector('#menuCustomize');
const logoutButton = document.querySelector('#logoutButton');

const backgroundStyle = document.querySelector('#backgroundStyle');
const pageColor = document.querySelector('#pageColor');
const stripeColor = document.querySelector('#stripeColor');
const paperColor = document.querySelector('#paperColor');
const accentColor = document.querySelector('#accentColor');
const backgroundImageUrl = document.querySelector('#backgroundImageUrl');
const backgroundImageFile = document.querySelector('#backgroundImageFile');
const backgroundSize = document.querySelector('#backgroundSize');
const backgroundPosition = document.querySelector('#backgroundPosition');
const patternScale = document.querySelector('#patternScale');
const patternScaleWrap = document.querySelector('#patternScaleWrap');
const patternScaleValue = document.querySelector('#patternScaleValue');
const backgroundDropZone = document.querySelector('#backgroundDropZone');
const backgroundPreview = document.querySelector('#backgroundPreview');
const backgroundPreviewImage = document.querySelector('#backgroundPreviewImage');
const removeBackgroundImage = document.querySelector('#removeBackgroundImage');
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
  backgroundSize: 'cover',
  backgroundPosition: 'center center',
  patternScale: 180
};

const presets = {
  pink: {
    backgroundStyle: 'stripes',
    pageColor: '#f7d9df',
    stripeColor: '#efc3cc',
    paperColor: '#fffaf8',
    accentColor: '#8f565d',
    backgroundImage: '',
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    patternScale: 180
  },
  cream: {
    backgroundStyle: 'stripes',
    pageColor: '#f7f0df',
    stripeColor: '#eadfbe',
    paperColor: '#fffdf6',
    accentColor: '#7a6654',
    backgroundImage: '',
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    patternScale: 180
  },
  lavender: {
    backgroundStyle: 'stripes',
    pageColor: '#eee7f7',
    stripeColor: '#ddd0ee',
    paperColor: '#fffaff',
    accentColor: '#6f587f',
    backgroundImage: '',
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    patternScale: 180
  },
  dark: {
    backgroundStyle: 'solid',
    pageColor: '#2f2930',
    stripeColor: '#2f2930',
    paperColor: '#f4edf3',
    accentColor: '#6a4459',
    backgroundImage: '',
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    patternScale: 180
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
    loginButton.classList.remove('is-hidden');
    accountWrap?.classList.add('is-hidden');
    customizeButton.classList.add('is-hidden');
    return;
  }

  const users = getUsers();
  const name = users[currentUser]?.name || 'ACCOUNT';

  loginButton.classList.add('is-hidden');
  accountWrap?.classList.remove('is-hidden');
  if (accountName) accountName.textContent = name.toUpperCase();
  customizeButton.classList.add('is-hidden');
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

function getImageLayout(theme) {
  const layout = theme.backgroundSize || 'cover';
  const patternPixels = Math.max(40, Math.min(500, Number(theme.patternScale) || 180));

  if (layout === 'pattern') return { size: `${patternPixels}px auto`, repeat: 'repeat' };
  if (layout === 'repeat-x') return { size: `${patternPixels}px auto`, repeat: 'repeat-x' };
  if (layout === 'repeat-y') return { size: `auto ${patternPixels}px`, repeat: 'repeat-y' };
  if (layout === 'stretch') return { size: '100% 100%', repeat: 'no-repeat' };
  if (layout === 'contain') return { size: 'contain', repeat: 'no-repeat' };
  if (layout === 'auto') return { size: 'auto', repeat: 'no-repeat' };
  return { size: 'cover', repeat: 'no-repeat' };
}

function applyTheme(theme, save = false) {
  const root = document.documentElement;
  document.body.classList.remove('theme-solid', 'theme-image');

  root.style.setProperty('--stripe-a', theme.pageColor);
  root.style.setProperty('--stripe-b', theme.stripeColor);
  root.style.setProperty('--paper', theme.paperColor);
  root.style.setProperty('--deep-rose', theme.accentColor);

  const imageLayout = getImageLayout(theme);

  if (theme.backgroundStyle === 'solid') {
    document.body.classList.add('theme-solid');
  } else if (theme.backgroundStyle === 'image') {
    document.body.classList.add('theme-image');
    const image = theme.backgroundImage ? `url("${theme.backgroundImage.replace(/"/g, '\\"')}")` : 'none';
    root.style.setProperty('--custom-bg-image', image);
    root.style.setProperty('--custom-bg-size', imageLayout.size);
    root.style.setProperty('--custom-bg-repeat', imageLayout.repeat);
    root.style.setProperty('--custom-bg-position', theme.backgroundPosition || 'center center');
  }

  backgroundStyle.value = theme.backgroundStyle;
  pageColor.value = theme.pageColor;
  stripeColor.value = theme.stripeColor;
  paperColor.value = theme.paperColor;
  accentColor.value = theme.accentColor;
  backgroundImageUrl.value = theme.backgroundImage?.startsWith('data:') ? '' : (theme.backgroundImage || '');
  backgroundSize.value = theme.backgroundSize || 'cover';
  backgroundPosition.value = theme.backgroundPosition || 'center center';
  patternScale.value = String(theme.patternScale || 180);
  patternScaleValue.textContent = `${patternScale.value}px`;

  const imageMode = theme.backgroundStyle === 'image';
  const repeatMode = ['pattern', 'repeat-x', 'repeat-y'].includes(theme.backgroundSize);
  imageOptions.classList.toggle('visible', imageMode);
  patternScaleWrap.classList.toggle('visible', imageMode && repeatMode);
  stripeColor.closest('.theme-control').style.opacity = theme.backgroundStyle === 'stripes' ? '1' : '.45';

  if (theme.backgroundImage) {
    backgroundPreviewImage.src = theme.backgroundImage;
    backgroundPreview.hidden = false;
  } else {
    backgroundPreviewImage.removeAttribute('src');
    backgroundPreview.hidden = true;
  }

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
    backgroundSize: backgroundSize.value,
    backgroundPosition: backgroundPosition.value,
    patternScale: Number(patternScale.value) || 180
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
menuCustomize?.addEventListener('click', () => {
  accountMenu.hidden = true;
  accountButton.setAttribute('aria-expanded', 'false');
  openThemePanel();
});
accountButton?.addEventListener('click', () => {
  const open = accountMenu.hidden;
  accountMenu.hidden = !open;
  accountButton.setAttribute('aria-expanded', String(open));
});
logoutButton?.addEventListener('click', () => {
  localStorage.removeItem('weeklyPlanner.currentUser');
  accountMenu.hidden = true;
  accountButton.setAttribute('aria-expanded', 'false');
  updateLoginButton();
});
document.addEventListener('click', (event) => {
  if (accountWrap && !accountWrap.contains(event.target)) {
    accountMenu.hidden = true;
    accountButton?.setAttribute('aria-expanded', 'false');
  }
});
closeThemePanel.addEventListener('click', closePanel);
panelBackdrop.addEventListener('click', closePanel);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && themePanel.classList.contains('open')) closePanel();
});

[backgroundStyle, pageColor, stripeColor, paperColor, accentColor, backgroundSize, backgroundPosition, patternScale].forEach((control) => {
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

function useBackgroundFile(file) {
  if (!file || !file.type.startsWith('image/')) return;

  const reader = new FileReader();
  reader.onload = () => {
    const theme = readThemeControls();
    theme.backgroundImage = reader.result;
    theme.backgroundStyle = 'image';
    applyTheme(theme, true);
    backgroundImageFile.value = '';
  };
  reader.readAsDataURL(file);
}

backgroundImageFile.addEventListener('change', () => {
  useBackgroundFile(backgroundImageFile.files?.[0]);
});

['dragenter', 'dragover'].forEach((eventName) => {
  backgroundDropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    backgroundDropZone.classList.add('drag-over');
  });
});

['dragleave', 'drop'].forEach((eventName) => {
  backgroundDropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    backgroundDropZone.classList.remove('drag-over');
  });
});

backgroundDropZone.addEventListener('drop', (event) => {
  useBackgroundFile(event.dataTransfer?.files?.[0]);
});

backgroundDropZone.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    backgroundImageFile.click();
  }
});

removeBackgroundImage.addEventListener('click', () => {
  const theme = readThemeControls();
  theme.backgroundImage = '';
  theme.backgroundStyle = 'stripes';
  backgroundImageUrl.value = '';
  backgroundImageFile.value = '';
  applyTheme(theme, true);
});

patternScale.addEventListener('input', () => {
  patternScaleValue.textContent = `${patternScale.value}px`;
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

const params = new URLSearchParams(window.location.search);
if (params.get('customize') === '1' && isLoggedIn()) openThemePanel();