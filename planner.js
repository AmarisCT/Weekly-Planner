// Planner: weeks, tick-off plan lists, carry-over and the habit tracker.
(() => {
  const S = window.PlannerStore;
  if (!S) return;
  S.migrate();

  const DAYS = S.DAYS;
  const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const SHORT = MONTHS.map((m) => m.slice(0, 3));

  const weekInput = document.getElementById('weekOf');
  const monthSelect = document.getElementById('month');
  const prevWeek = document.getElementById('prevWeek');
  const nextWeek = document.getElementById('nextWeek');
  const thisWeek = document.getElementById('thisWeek');
  const weekRange = document.getElementById('weekRange');
  const goalsLabel = document.getElementById('goalsMonthLabel');
  const toastEl = document.getElementById('toast');
  const lists = [...document.querySelectorAll('.todo-list[data-list]')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const params = new URLSearchParams(window.location.search);
  let week = S.weekId(S.parseISO(params.get('week')) || new Date());
  let month = S.monthId(S.parseISO(week));

  MONTHS.forEach((name, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = name;
    monthSelect.appendChild(option);
  });

  /* ---------- little helpers ---------- */

  const todayISO = () => S.iso(new Date());
  const listKey = (list) => (list.dataset.goal ? S.goalKey(month, list.dataset.list) : S.dayKey(week, list.dataset.list));

  let toastTimer = 0;
  function toast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.hidden = false;
    toastEl.classList.remove('show');
    void toastEl.offsetWidth;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.classList.remove('show'); toastEl.hidden = true; }, 2800);
  }

  function caretOffset(el) {
    const sel = window.getSelection();
    if (!sel.rangeCount || !el.contains(sel.anchorNode)) return el.textContent.length;
    const range = sel.getRangeAt(0).cloneRange();
    range.selectNodeContents(el);
    range.setEnd(sel.getRangeAt(0).startContainer, sel.getRangeAt(0).startOffset);
    return range.toString().length;
  }

  function setCaret(el, offset) {
    el.focus();
    const sel = window.getSelection();
    const range = document.createRange();
    let remaining = offset;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      if (remaining <= node.length) {
        range.setStart(node, remaining);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        return;
      }
      remaining -= node.length;
      node = walker.nextNode();
    }
    range.selectNodeContents(el);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  const textOf = (li) => li.querySelector('.todo-text').textContent.replace(/\s+/g, ' ').trim();

  /* ---------- plan lists ---------- */

  function makeItem(list, item, isNew = false) {
    const li = document.createElement('li');
    li.className = `todo${isNew ? ' is-new' : ''}`;
    li.dataset.done = String(Boolean(item.d));

    const tick = document.createElement('button');
    tick.type = 'button';
    tick.className = 'tick';
    tick.tabIndex = isNew ? -1 : 0;
    tick.setAttribute('aria-pressed', String(Boolean(item.d)));
    tick.setAttribute('aria-label', item.d ? 'Mark as not done' : 'Mark as done');

    const text = document.createElement('span');
    text.className = 'todo-text';
    text.contentEditable = 'true';
    text.spellcheck = true;
    text.setAttribute('role', 'textbox');
    text.setAttribute('aria-label', `${list.getAttribute('aria-label') || 'plan'}${isNew ? ': add new' : ''}`);
    text.dataset.placeholder = isNew ? (list.dataset.goal ? 'add a goal…' : 'add a plan…') : '';
    text.textContent = item.t;

    li.append(tick, text);
    return li;
  }

  function ensureNewRow(list) {
    const last = list.lastElementChild;
    if (!last || !last.classList.contains('is-new')) list.appendChild(makeItem(list, { t: '', d: false }, true));
  }

  function renderList(list) {
    list.textContent = '';
    S.readItems(listKey(list)).forEach((item) => list.appendChild(makeItem(list, item)));
    ensureNewRow(list);
    updateCarry(list);
  }

  function saveList(list) {
    const items = [...list.querySelectorAll('.todo:not(.is-new)')].map((li) => ({ t: textOf(li), d: li.dataset.done === 'true' }));
    S.writeItems(listKey(list), items);
    updateCarry(list);
  }

  const saveTimers = new WeakMap();
  function queueSave(list) {
    clearTimeout(saveTimers.get(list));
    saveTimers.set(list, setTimeout(() => saveList(list), 250));
  }

  function promoteIfNew(list, li) {
    if (li.classList.contains('is-new') && textOf(li)) {
      li.classList.remove('is-new');
      li.querySelector('.tick').tabIndex = 0;
      const text = li.querySelector('.todo-text');
      text.dataset.placeholder = '';
      text.setAttribute('aria-label', list.getAttribute('aria-label') || 'plan');
      ensureNewRow(list);
    }
  }

  function insertAfter(list, li, item) {
    const next = makeItem(list, item);
    li.after(next);
    return next;
  }

  lists.forEach((list) => {
    list.addEventListener('input', (event) => {
      const li = event.target.closest('.todo');
      if (!li) return;
      promoteIfNew(list, li);
      queueSave(list);
    });

    list.addEventListener('focusout', (event) => {
      const li = event.target.closest('.todo');
      if (!li || li.classList.contains('is-new') || !event.target.classList.contains('todo-text')) return;
      if (!textOf(li) && !li.contains(event.relatedTarget)) {
        li.remove();
        saveList(list);
      }
    });

    list.addEventListener('click', (event) => {
      const tick = event.target.closest('.tick');
      if (tick) {
        const li = tick.closest('.todo');
        if (li.classList.contains('is-new')) { li.querySelector('.todo-text').focus(); return; }
        const done = li.dataset.done !== 'true';
        li.dataset.done = String(done);
        tick.setAttribute('aria-pressed', String(done));
        tick.setAttribute('aria-label', done ? 'Mark as not done' : 'Mark as done');
        if (done && !reduceMotion) {
          tick.classList.remove('pop');
          void tick.offsetWidth;
          tick.classList.add('pop');
        }
        saveList(list);
        return;
      }
      // clicking the empty lined space below the plans starts a new one
      if (event.target === list) list.querySelector('.todo.is-new .todo-text')?.focus();
    });

    list.addEventListener('keydown', (event) => {
      const text = event.target.closest('.todo-text');
      if (!text || event.isComposing) return;
      const li = text.closest('.todo');
      const prev = li.previousElementSibling;
      const next = li.nextElementSibling;

      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        const full = text.textContent;
        const at = caretOffset(text);
        const before = full.slice(0, at).trimEnd();
        const after = full.slice(at).trimStart();
        if (li.classList.contains('is-new')) {
          if (!before) return;
          promoteIfNew(list, li);
          text.textContent = before;
          const fresh = list.querySelector('.todo.is-new .todo-text');
          if (after) { const created = insertAfter(list, li, { t: after, d: false }); setCaret(created.querySelector('.todo-text'), 0); }
          else setCaret(fresh, 0);
        } else {
          text.textContent = before;
          const created = after
            ? insertAfter(list, li, { t: after, d: false })
            : null;
          if (created) setCaret(created.querySelector('.todo-text'), 0);
          else if (next && next.classList.contains('is-new')) setCaret(next.querySelector('.todo-text'), 0);
          else setCaret(insertAfter(list, li, { t: '', d: false }).querySelector('.todo-text'), 0);
        }
        saveList(list);
        return;
      }

      if (event.key === 'Backspace' && caretOffset(text) === 0 && window.getSelection().isCollapsed && prev) {
        event.preventDefault();
        const prevText = prev.querySelector('.todo-text');
        const join = prevText.textContent.length;
        if (li.classList.contains('is-new')) { setCaret(prevText, join); return; }
        prevText.textContent += text.textContent;
        li.remove();
        setCaret(prevText, join);
        saveList(list);
        return;
      }

      if (event.key === 'ArrowUp' && prev && caretOffset(text) === 0) {
        event.preventDefault();
        setCaret(prev.querySelector('.todo-text'), prev.querySelector('.todo-text').textContent.length);
      } else if (event.key === 'ArrowDown' && next && caretOffset(text) === text.textContent.length) {
        event.preventDefault();
        setCaret(next.querySelector('.todo-text'), 0);
      }
    });

    list.addEventListener('paste', (event) => {
      const text = event.target.closest('.todo-text');
      if (!text) return;
      event.preventDefault();
      const pasted = (event.clipboardData || window.clipboardData).getData('text').replace(/\r/g, '');
      const lines = pasted.split('\n').map((line) => line.trim()).filter(Boolean);
      if (!lines.length) return;
      const li = text.closest('.todo');
      const at = caretOffset(text);
      const before = text.textContent.slice(0, at);
      const after = text.textContent.slice(at);
      text.textContent = before + lines[0] + (lines.length === 1 ? after : '');
      promoteIfNew(list, li);
      let anchor = li;
      lines.slice(1).forEach((line, i) => {
        const last = i === lines.length - 2;
        anchor = insertAfter(list, anchor, { t: line + (last ? after : ''), d: false });
      });
      const target = anchor.querySelector('.todo-text');
      setCaret(target, lines.length === 1 ? before.length + lines[0].length : lines[lines.length - 1].length);
      saveList(list);
    });
  });

  /* ---------- carry unfinished plans to the next day ---------- */

  function updateCarry(list) {
    if (list.dataset.goal) return;
    const day = list.dataset.list;
    const index = DAYS.indexOf(day);
    const button = document.querySelector(`[data-carry="${day}"]`);
    if (!button) return;
    const undone = S.readItems(S.dayKey(week, day)).filter((item) => !item.d).length;
    const dayISO = S.iso(S.addDays(week, index));
    const show = undone > 0 && dayISO <= todayISO();
    button.hidden = !show;
    if (!show) return;
    const target = index === 6 ? 'next week' : DAY_NAMES[index + 1];
    button.textContent = `move ${undone} → ${index === 6 ? 'next wk' : DAY_NAMES[index + 1].slice(0, 3).toLowerCase()}`;
    button.setAttribute('aria-label', `Move ${undone} unfinished plan${undone > 1 ? 's' : ''} to ${target}`);
    button.title = `Move unfinished plans to ${target}`;
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-carry]');
    if (!button) return;
    const day = button.dataset.carry;
    const index = DAYS.indexOf(day);
    const fromKey = S.dayKey(week, day);
    const items = S.readItems(fromKey);
    const undone = items.filter((item) => !item.d);
    if (!undone.length) return;
    const toWeek = index === 6 ? S.iso(S.addDays(week, 7)) : week;
    const toDay = DAYS[(index + 1) % 7];
    const toKey = S.dayKey(toWeek, toDay);
    S.writeItems(toKey, S.readItems(toKey).concat(undone));
    S.writeItems(fromKey, items.filter((item) => item.d));
    lists.filter((list) => list.dataset.list === day || (toWeek === week && list.dataset.list === toDay)).forEach(renderList);
    toast(`moved ${undone.length} plan${undone.length > 1 ? 's' : ''} to ${index === 6 ? 'next monday' : DAY_NAMES[index + 1].toLowerCase()} ♡`);
  });

  /* ---------- habit + mood tracker ---------- */

  const ICON = {
    drop: '<svg viewBox="0 0 16 19" aria-hidden="true"><path d="M8 1.5C6.2 4.4 2.2 8.6 2.2 12a5.8 5.8 0 0 0 11.6 0C13.8 8.6 9.8 4.4 8 1.5Z"/><ellipse class="shine" cx="5.6" cy="12.2" rx="1.1" ry="1.8"/></svg>',
    moon: '<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M11.8 2.2A6.8 6.8 0 1 0 15.8 13 5.6 5.6 0 0 1 11.8 2.2Z"/></svg>'
  };
  const MOODS = [
    { label: 'sad', color: '#a9c8f5', mouth: '<path d="M6.6 14.6q3.4-2.8 6.8 0"/>' },
    { label: 'meh', color: '#cdb8f0', mouth: '<path d="M7 13.4h6"/>' },
    { label: 'okay', color: '#ffe08a', mouth: '<path d="M6.8 12.6q3.2 2 6.4 0"/>' },
    { label: 'happy', color: '#ffb3c9', mouth: '<path d="M6.2 11.8q3.8 4.4 7.6 0"/>' },
    { label: 'in love', color: '#ff8fb3', mouth: '<path d="M6 11.6q4 4.8 8 0"/>', hearts: true }
  ];
  const face = (mood) => `<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8.6" fill="${mood.color}"/>${mood.hearts
    ? '<path class="eye-heart" d="M6.2 7.2c-.9-.9-2.4 0-1.6 1.2l1.6 1.4 1.6-1.4c.8-1.2-.7-2.1-1.6-1.2zM13.8 7.2c-.9-.9-2.4 0-1.6 1.2l1.6 1.4 1.6-1.4c.8-1.2-.7-2.1-1.6-1.2z"/>'
    : '<circle class="eye" cx="7" cy="8.4" r="1.1"/><circle class="eye" cx="13" cy="8.4" r="1.1"/>'}<g class="mouth">${mood.mouth}</g></svg>`;

  const habitsKey = () => S.weekKey(week, 'habits');
  const readHabits = () => S.readJSON(habitsKey(), {}) || {};
  function writeHabits(all) {
    const clean = Object.fromEntries(Object.entries(all).filter(([, v]) => v && (v.water || v.sleep || v.mood)));
    if (Object.keys(clean).length) S.writeJSON(habitsKey(), clean);
    else localStorage.removeItem(habitsKey());
  }

  function renderHabits() {
    const all = readHabits();
    document.querySelectorAll('[data-habits]').forEach((row) => {
      const day = row.dataset.habits;
      const h = all[day] || {};
      const name = DAY_NAMES[DAYS.indexOf(day)];
      row.innerHTML = `
        <div class="habit habit-water" role="group" aria-label="${name} water">
          <span class="habit-label">water</span>
          <span class="drops">${Array.from({ length: 8 }, (_, i) => `<button type="button" class="drop${i < (h.water || 0) ? ' on' : ''}" data-water="${i + 1}" aria-label="${i + 1} glass${i ? 'es' : ''} of water" aria-pressed="${i < (h.water || 0)}">${ICON.drop}</button>`).join('')}</span>
        </div>
        <div class="habit habit-sleep" role="group" aria-label="${name} sleep">
          <span class="habit-label">sleep</span>
          <button type="button" class="step" data-sleep="-1" aria-label="Less sleep">−</button>
          <span class="sleep-value">${ICON.moon}<b>${h.sleep ? `${h.sleep}h` : '–'}</b></span>
          <button type="button" class="step" data-sleep="1" aria-label="More sleep">+</button>
        </div>
        <div class="habit habit-mood" role="group" aria-label="${name} mood">
          <span class="habit-label">mood</span>
          <span class="moods">${MOODS.map((m, i) => `<button type="button" class="mood${h.mood === i + 1 ? ' on' : ''}" data-mood="${i + 1}" aria-label="Mood: ${m.label}" aria-pressed="${h.mood === i + 1}">${face(m)}</button>`).join('')}</span>
        </div>`;
    });
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-water], [data-sleep], [data-mood]');
    const row = button?.closest('[data-habits]');
    if (!row) return;
    const day = row.dataset.habits;
    const all = readHabits();
    const h = { ...(all[day] || {}) };
    if (button.dataset.water) {
      const n = Number(button.dataset.water);
      h.water = h.water === n ? n - 1 : n;
    } else if (button.dataset.sleep) {
      h.sleep = Math.max(0, Math.min(14, (h.sleep || 0) + Number(button.dataset.sleep)));
    } else {
      const n = Number(button.dataset.mood);
      h.mood = h.mood === n ? 0 : n;
    }
    all[day] = h;
    writeHabits(all);
    renderHabits();
    document.querySelector(`[data-habits="${day}"] [data-${button.dataset.water ? 'water' : button.dataset.sleep ? 'sleep' : 'mood'}="${button.dataset.water || button.dataset.sleep || button.dataset.mood}"]`)?.focus();
  });

  /* ---------- weeks ---------- */

  function renderDates() {
    const today = todayISO();
    document.querySelectorAll('.day-box[data-day]').forEach((card) => {
      const date = S.addDays(week, Number(card.dataset.day));
      card.querySelector('.day-num').textContent = String(date.getDate());
      card.querySelector('.day-date').textContent = SHORT[date.getMonth()];
      card.classList.toggle('is-today', S.iso(date) === today);
      card.classList.toggle('is-past', S.iso(date) < today);
    });
    const start = S.parseISO(week);
    const end = S.addDays(week, 6);
    const current = S.weekId();
    const lastWeek = S.iso(S.addDays(current, -7));
    const nextWk = S.iso(S.addDays(current, 7));
    const label = week === current ? 'this week' : week === lastWeek ? 'last week' : week === nextWk ? 'next week' : '';
    const range = `${SHORT[start.getMonth()]} ${start.getDate()} – ${start.getMonth() === end.getMonth() ? '' : `${SHORT[end.getMonth()]} `}${end.getDate()}, ${end.getFullYear()}`;
    weekRange.textContent = label ? `${label} · ${range}` : range;
    thisWeek.hidden = week === current;
  }

  function renderGoals() {
    const [y, m] = month.split('-').map(Number);
    goalsLabel.textContent = `Weekly goals · ${MONTHS[m - 1]}${y !== new Date().getFullYear() ? ` ${y}` : ''}`;
    lists.filter((list) => list.dataset.goal).forEach(renderList);
  }

  function setWeek(next) {
    week = next;
    const monday = S.parseISO(week);
    weekInput.value = week;
    month = S.monthId(monday);
    monthSelect.value = String(monday.getMonth());
    renderDates();
    lists.filter((list) => !list.dataset.goal).forEach(renderList);
    renderGoals();
    renderHabits();
    const url = new URLSearchParams(window.location.search);
    url.delete('customize');
    if (week === S.weekId()) url.delete('week'); else url.set('week', week);
    const query = url.toString();
    history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
    document.dispatchEvent(new CustomEvent('planner:week', { detail: { week } }));
  }

  weekInput.addEventListener('change', () => {
    const picked = S.parseISO(weekInput.value);
    if (picked) setWeek(S.weekId(picked));
  });
  prevWeek.addEventListener('click', () => setWeek(S.iso(S.addDays(week, -7))));
  nextWeek.addEventListener('click', () => setWeek(S.iso(S.addDays(week, 7))));
  thisWeek.addEventListener('click', () => setWeek(S.weekId()));
  monthSelect.addEventListener('change', () => {
    const year = S.parseISO(week).getFullYear();
    month = `${year}-${String(Number(monthSelect.value) + 1).padStart(2, '0')}`;
    renderGoals();
  });

  // Let other parts of the page (stickers) know which week is showing.
  window.Planner = { get week() { return week; }, toast };

  setWeek(week);
})();
