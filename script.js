const monthSelect = document.querySelector('#month');
const weekInput = document.querySelector('#weekOf');
const printButton = document.querySelector('#printButton');

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

months.forEach((name, index) => {
  const option = document.createElement('option');
  option.value = String(index);
  option.textContent = name;
  monthSelect.appendChild(option);
});

const savedWeek = localStorage.getItem('weeklyPlanner.weekOf');
const savedMonth = localStorage.getItem('weeklyPlanner.month');
const today = new Date();

weekInput.value = savedWeek || getLocalDateString(today);
monthSelect.value = savedMonth ?? String(today.getMonth());

weekInput.addEventListener('change', () => {
  localStorage.setItem('weeklyPlanner.weekOf', weekInput.value);

  if (weekInput.value) {
    const selectedDate = new Date(`${weekInput.value}T12:00:00`);
    monthSelect.value = String(selectedDate.getMonth());
    localStorage.setItem('weeklyPlanner.month', monthSelect.value);
  }
});

monthSelect.addEventListener('change', () => {
  localStorage.setItem('weeklyPlanner.month', monthSelect.value);
});

editableFields.forEach((field) => {
  const storageKey = `weeklyPlanner.${field.dataset.key}`;
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