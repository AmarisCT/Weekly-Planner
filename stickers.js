// Sticker sheet: drag cute stickers onto any planner box (or tap to add one).
// Stickers are saved per week, pinned to the box they were dropped on.
(() => {
  const S = window.PlannerStore;
  const planner = document.getElementById('planner');
  const sheet = document.getElementById('stickerSheet');
  const grid = document.getElementById('stickerGrid');
  const openButton = document.getElementById('stickersButton');
  const closeButton = document.getElementById('closeStickers');
  if (!S || !planner || !sheet || !grid) return;

  const TYPES = {"star": {"label": "star", "w": 52, "svg": "<svg viewBox=\"0 0 64 62\"><polygon points=\"32.0,6.0 39.9,23.1 58.6,25.3 44.8,38.2 48.5,56.7 32.0,47.5 15.5,56.7 19.2,38.2 5.4,25.3 24.1,23.1\" fill=\"#ffe07a\" stroke=\"#5a2a2a\" stroke-width=\"3.5\" stroke-linejoin=\"round\"/><circle cx=\"26.5\" cy=\"34\" r=\"2.2\" fill=\"#5a2a2a\"/><circle cx=\"37.5\" cy=\"34\" r=\"2.2\" fill=\"#5a2a2a\"/><ellipse cx=\"22.5\" cy=\"39\" rx=\"2.8\" ry=\"1.7\" fill=\"#ff9ab8\"/><ellipse cx=\"41.5\" cy=\"39\" rx=\"2.8\" ry=\"1.7\" fill=\"#ff9ab8\"/><path d=\"M29.5 38.5q2.5 2.6 5 0\" fill=\"none\" stroke=\"#5a2a2a\" stroke-width=\"1.8\" stroke-linecap=\"round\"/><ellipse cx=\"25\" cy=\"22\" rx=\"2.2\" ry=\"3.5\" fill=\"#fff\" opacity=\".7\" transform=\"rotate(25 25 22)\"/></svg>"}, "heart": {"label": "heart", "w": 44, "svg": "<svg viewBox=\"0 0 34 31\"><path d=\"M17 29C7 21 2 15.5 2 9.6 2 5 5.4 2 9.5 2c3.3 0 5.9 1.9 7.5 4.8C18.6 3.9 21.2 2 24.5 2 28.6 2 32 5 32 9.6 32 15.5 27 21 17 29z\" fill=\"#ff8fb3\" stroke=\"#5a2a2a\" stroke-width=\"2.6\" stroke-linejoin=\"round\"/><ellipse cx=\"9.5\" cy=\"8.6\" rx=\"2.4\" ry=\"3.6\" fill=\"#fff\" opacity=\".65\" transform=\"rotate(-30 9.5 8.6)\"/></svg>"}, "bunny": {"label": "bunny", "w": 56, "svg": "<svg viewBox=\"0 0 120 120\"><g stroke=\"#5a2a2a\" stroke-width=\"5\" stroke-linejoin=\"round\"><ellipse cx=\"42\" cy=\"34\" rx=\"12\" ry=\"27\" fill=\"#fff\" transform=\"rotate(-10 42 34)\"/><ellipse cx=\"78\" cy=\"34\" rx=\"12\" ry=\"27\" fill=\"#fff\" transform=\"rotate(10 78 34)\"/></g><ellipse cx=\"42.5\" cy=\"37\" rx=\"5\" ry=\"18\" fill=\"#ffb3c9\" transform=\"rotate(-10 42.5 37)\"/><ellipse cx=\"77.5\" cy=\"37\" rx=\"5\" ry=\"18\" fill=\"#ffb3c9\" transform=\"rotate(10 77.5 37)\"/><ellipse cx=\"60\" cy=\"78\" rx=\"44\" ry=\"35\" fill=\"#fff\" stroke=\"#5a2a2a\" stroke-width=\"5\"/><ellipse cx=\"45\" cy=\"76\" rx=\"4.5\" ry=\"5.5\" fill=\"#5a2a2a\"/><ellipse cx=\"75\" cy=\"76\" rx=\"4.5\" ry=\"5.5\" fill=\"#5a2a2a\"/><ellipse cx=\"34\" cy=\"88\" rx=\"8\" ry=\"4.6\" fill=\"#ff9ab8\"/><ellipse cx=\"86\" cy=\"88\" rx=\"8\" ry=\"4.6\" fill=\"#ff9ab8\"/><path d=\"M53 86q3.5 4.5 7 0q3.5 4.5 7 0\" fill=\"none\" stroke=\"#5a2a2a\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>"}, "flower": {"label": "flower", "w": 46, "svg": "<svg viewBox=\"0 0 64 64\"><circle cx=\"32.0\" cy=\"18.0\" r=\"11\" fill=\"#ffc2d6\" stroke=\"#5a2a2a\" stroke-width=\"3\"/><circle cx=\"45.3\" cy=\"27.7\" r=\"11\" fill=\"#ffc2d6\" stroke=\"#5a2a2a\" stroke-width=\"3\"/><circle cx=\"40.2\" cy=\"43.3\" r=\"11\" fill=\"#ffc2d6\" stroke=\"#5a2a2a\" stroke-width=\"3\"/><circle cx=\"23.8\" cy=\"43.3\" r=\"11\" fill=\"#ffc2d6\" stroke=\"#5a2a2a\" stroke-width=\"3\"/><circle cx=\"18.7\" cy=\"27.7\" r=\"11\" fill=\"#ffc2d6\" stroke=\"#5a2a2a\" stroke-width=\"3\"/><circle cx=\"32\" cy=\"32\" r=\"9\" fill=\"#ffd36b\" stroke=\"#5a2a2a\" stroke-width=\"3\"/><circle cx=\"29\" cy=\"29\" r=\"2.2\" fill=\"#fff\" opacity=\".7\"/></svg>"}, "bow": {"label": "bow", "w": 54, "svg": "<svg viewBox=\"0 0 80 50\"><path d=\"M38 22C30 8 10 2 5 10s4 26 33 18z\" fill=\"#ff8fb3\" stroke=\"#5a2a2a\" stroke-width=\"3.2\" stroke-linejoin=\"round\"/><path d=\"M42 22C50 8 70 2 75 10s-4 26-33 18z\" fill=\"#ff8fb3\" stroke=\"#5a2a2a\" stroke-width=\"3.2\" stroke-linejoin=\"round\"/><path d=\"M36 28l-9 18 8-2 3 5 2-19zM44 28l9 18-8-2-3 5-2-19z\" fill=\"#ff6f9c\" stroke=\"#5a2a2a\" stroke-width=\"3\" stroke-linejoin=\"round\"/><rect x=\"33\" y=\"17\" width=\"14\" height=\"14\" rx=\"5\" fill=\"#ff6f9c\" stroke=\"#5a2a2a\" stroke-width=\"3.2\"/><ellipse cx=\"16\" cy=\"12\" rx=\"3\" ry=\"2\" fill=\"#fff\" opacity=\".6\"/><ellipse cx=\"64\" cy=\"12\" rx=\"3\" ry=\"2\" fill=\"#fff\" opacity=\".6\"/></svg>"}, "cloud": {"label": "cloud", "w": 64, "svg": "<svg viewBox=\"0 0 90 56\"><path d=\"M20 50c-9 0-16-6-16-14s6-13 13-13c1-10 9-17 19-17 8 0 14 4 17 10 2-1 5-2 8-2 9 0 15 7 15 15 0 1 0 2-1 3 6 1 10 6 10 11 0 4-4 7-9 7z\" fill=\"#fff\" stroke=\"#5a2a2a\" stroke-width=\"3.2\" stroke-linejoin=\"round\"/><circle cx=\"37\" cy=\"33\" r=\"2.5\" fill=\"#5a2a2a\"/><circle cx=\"53\" cy=\"33\" r=\"2.5\" fill=\"#5a2a2a\"/><ellipse cx=\"31\" cy=\"39\" rx=\"3.5\" ry=\"2\" fill=\"#ff9ab8\"/><ellipse cx=\"59\" cy=\"39\" rx=\"3.5\" ry=\"2\" fill=\"#ff9ab8\"/><path d=\"M42 38q3 3 6 0\" fill=\"none\" stroke=\"#5a2a2a\" stroke-width=\"2\" stroke-linecap=\"round\"/></svg>"}, "sparkle": {"label": "sparkle", "w": 36, "svg": "<svg viewBox=\"0 0 40 40\"><path d=\"M20 2C21.5 14 26 18.5 38 20 26 21.5 21.5 26 20 38 18.5 26 14 21.5 2 20 14 18.5 18.5 14 20 2z\" fill=\"#ffe07a\" stroke=\"#5a2a2a\" stroke-width=\"2.6\" stroke-linejoin=\"round\"/><circle cx=\"20\" cy=\"20\" r=\"3\" fill=\"#fff\"/></svg>"}, "strawberry": {"label": "strawberry", "w": 42, "svg": "<svg viewBox=\"0 0 64 64\"><path d=\"M32 60C18 52 8 40 8 27c0-8 7-12 13-12 4 0 8 1 11 3 3-2 7-3 11-3 6 0 13 4 13 12 0 13-10 25-24 33z\" fill=\"#ff6f8f\" stroke=\"#5a2a2a\" stroke-width=\"3.2\" stroke-linejoin=\"round\"/><ellipse cx=\"24\" cy=\"30\" rx=\"1.4\" ry=\"2\" fill=\"#ffe7a0\"/><ellipse cx=\"32\" cy=\"28\" rx=\"1.4\" ry=\"2\" fill=\"#ffe7a0\"/><ellipse cx=\"40\" cy=\"30\" rx=\"1.4\" ry=\"2\" fill=\"#ffe7a0\"/><ellipse cx=\"28\" cy=\"38\" rx=\"1.4\" ry=\"2\" fill=\"#ffe7a0\"/><ellipse cx=\"36\" cy=\"38\" rx=\"1.4\" ry=\"2\" fill=\"#ffe7a0\"/><ellipse cx=\"32\" cy=\"46\" rx=\"1.4\" ry=\"2\" fill=\"#ffe7a0\"/><ellipse cx=\"22\" cy=\"22\" rx=\"1.4\" ry=\"2\" fill=\"#ffe7a0\"/><ellipse cx=\"42\" cy=\"22\" rx=\"1.4\" ry=\"2\" fill=\"#ffe7a0\"/><path d=\"M32 18l-9-8 7 1-1-7 3 6 3-6-1 7 7-1z\" fill=\"#8bc66a\" stroke=\"#5a2a2a\" stroke-width=\"2.6\" stroke-linejoin=\"round\"/><ellipse cx=\"18\" cy=\"27\" rx=\"2.4\" ry=\"4\" fill=\"#fff\" opacity=\".55\" transform=\"rotate(-20 18 27)\"/></svg>"}, "washi-pink": {"label": "pink washi tape", "w": 124, "svg": "<svg viewBox=\"0 0 120 34\"><defs><clipPath id=\"CLIP\"><path d=\"M4 2 L116 2 L118 6 L114 10 L118 14 L114 18 L118 22 L114 26 L118 30 L116 32 L4 32 L2 28 L6 24 L2 20 L6 16 L2 12 L6 8 L2 4 Z\"/></clipPath></defs><g clip-path=\"url(#CLIP)\" opacity=\".85\"><rect width=\"120\" height=\"34\" fill=\"#ffd6e4\"/><rect x=\"-20\" y=\"-10\" width=\"7\" height=\"60\" fill=\"#ff9ab8\" transform=\"rotate(30 -20 17)\"/><rect x=\"-4\" y=\"-10\" width=\"7\" height=\"60\" fill=\"#ff9ab8\" transform=\"rotate(30 -4 17)\"/><rect x=\"12\" y=\"-10\" width=\"7\" height=\"60\" fill=\"#ff9ab8\" transform=\"rotate(30 12 17)\"/><rect x=\"28\" y=\"-10\" width=\"7\" height=\"60\" fill=\"#ff9ab8\" transform=\"rotate(30 28 17)\"/><rect x=\"44\" y=\"-10\" width=\"7\" height=\"60\" fill=\"#ff9ab8\" transform=\"rotate(30 44 17)\"/><rect x=\"60\" y=\"-10\" width=\"7\" height=\"60\" fill=\"#ff9ab8\" transform=\"rotate(30 60 17)\"/><rect x=\"76\" y=\"-10\" width=\"7\" height=\"60\" fill=\"#ff9ab8\" transform=\"rotate(30 76 17)\"/><rect x=\"92\" y=\"-10\" width=\"7\" height=\"60\" fill=\"#ff9ab8\" transform=\"rotate(30 92 17)\"/><rect x=\"108\" y=\"-10\" width=\"7\" height=\"60\" fill=\"#ff9ab8\" transform=\"rotate(30 108 17)\"/><rect x=\"124\" y=\"-10\" width=\"7\" height=\"60\" fill=\"#ff9ab8\" transform=\"rotate(30 124 17)\"/></g></svg>"}, "washi-mint": {"label": "mint washi tape", "w": 124, "svg": "<svg viewBox=\"0 0 120 34\"><defs><clipPath id=\"CLIP\"><path d=\"M4 2 L116 2 L118 6 L114 10 L118 14 L114 18 L118 22 L114 26 L118 30 L116 32 L4 32 L2 28 L6 24 L2 20 L6 16 L2 12 L6 8 L2 4 Z\"/></clipPath></defs><g clip-path=\"url(#CLIP)\" opacity=\".85\"><rect width=\"120\" height=\"34\" fill=\"#a8e3cc\"/><circle cx=\"8\" cy=\"9\" r=\"2.6\" fill=\"#fff\"/><circle cx=\"8\" cy=\"25\" r=\"2.6\" fill=\"#fff\"/><circle cx=\"22\" cy=\"9\" r=\"2.6\" fill=\"#fff\"/><circle cx=\"22\" cy=\"25\" r=\"2.6\" fill=\"#fff\"/><circle cx=\"36\" cy=\"9\" r=\"2.6\" fill=\"#fff\"/><circle cx=\"36\" cy=\"25\" r=\"2.6\" fill=\"#fff\"/><circle cx=\"50\" cy=\"9\" r=\"2.6\" fill=\"#fff\"/><circle cx=\"50\" cy=\"25\" r=\"2.6\" fill=\"#fff\"/><circle cx=\"64\" cy=\"9\" r=\"2.6\" fill=\"#fff\"/><circle cx=\"64\" cy=\"25\" r=\"2.6\" fill=\"#fff\"/><circle cx=\"78\" cy=\"9\" r=\"2.6\" fill=\"#fff\"/><circle cx=\"78\" cy=\"25\" r=\"2.6\" fill=\"#fff\"/><circle cx=\"92\" cy=\"9\" r=\"2.6\" fill=\"#fff\"/><circle cx=\"92\" cy=\"25\" r=\"2.6\" fill=\"#fff\"/><circle cx=\"106\" cy=\"9\" r=\"2.6\" fill=\"#fff\"/><circle cx=\"106\" cy=\"25\" r=\"2.6\" fill=\"#fff\"/><circle cx=\"15\" cy=\"17\" r=\"2.6\" fill=\"#fff\"/><circle cx=\"29\" cy=\"17\" r=\"2.6\" fill=\"#fff\"/><circle cx=\"43\" cy=\"17\" r=\"2.6\" fill=\"#fff\"/><circle cx=\"57\" cy=\"17\" r=\"2.6\" fill=\"#fff\"/><circle cx=\"71\" cy=\"17\" r=\"2.6\" fill=\"#fff\"/><circle cx=\"85\" cy=\"17\" r=\"2.6\" fill=\"#fff\"/><circle cx=\"99\" cy=\"17\" r=\"2.6\" fill=\"#fff\"/><circle cx=\"113\" cy=\"17\" r=\"2.6\" fill=\"#fff\"/></g></svg>"}, "washi-lavender": {"label": "lavender washi tape", "w": 124, "svg": "<svg viewBox=\"0 0 120 34\"><defs><clipPath id=\"CLIP\"><path d=\"M4 2 L116 2 L118 6 L114 10 L118 14 L114 18 L118 22 L114 26 L118 30 L116 32 L4 32 L2 28 L6 24 L2 20 L6 16 L2 12 L6 8 L2 4 Z\"/></clipPath></defs><g clip-path=\"url(#CLIP)\" opacity=\".85\"><rect width=\"120\" height=\"34\" fill=\"#ebe1fb\"/><rect x=\"4\" y=\"0\" width=\"6\" height=\"34\" fill=\"#c9b2f0\" opacity=\".7\"/><rect x=\"18\" y=\"0\" width=\"6\" height=\"34\" fill=\"#c9b2f0\" opacity=\".7\"/><rect x=\"32\" y=\"0\" width=\"6\" height=\"34\" fill=\"#c9b2f0\" opacity=\".7\"/><rect x=\"46\" y=\"0\" width=\"6\" height=\"34\" fill=\"#c9b2f0\" opacity=\".7\"/><rect x=\"60\" y=\"0\" width=\"6\" height=\"34\" fill=\"#c9b2f0\" opacity=\".7\"/><rect x=\"74\" y=\"0\" width=\"6\" height=\"34\" fill=\"#c9b2f0\" opacity=\".7\"/><rect x=\"88\" y=\"0\" width=\"6\" height=\"34\" fill=\"#c9b2f0\" opacity=\".7\"/><rect x=\"102\" y=\"0\" width=\"6\" height=\"34\" fill=\"#c9b2f0\" opacity=\".7\"/><rect x=\"116\" y=\"0\" width=\"6\" height=\"34\" fill=\"#c9b2f0\" opacity=\".7\"/><rect x=\"0\" y=\"4\" width=\"120\" height=\"6\" fill=\"#c9b2f0\" opacity=\".7\"/><rect x=\"0\" y=\"18\" width=\"120\" height=\"6\" fill=\"#c9b2f0\" opacity=\".7\"/></g></svg>"}, "yay": {"label": "yay! label", "w": 72, "svg": "<svg viewBox=\"0 0 90 46\"><rect x=\"3\" y=\"3\" width=\"84\" height=\"40\" rx=\"14\" fill=\"#ff8fb3\" stroke=\"#5a2a2a\" stroke-width=\"3\"/><text x=\"45\" y=\"31\" text-anchor=\"middle\" font-family=\"Fredoka, Nunito, sans-serif\" font-weight=\"700\" font-size=\"22\" fill=\"#fff\">yay! ♡</text></svg>"}, "done": {"label": "done! stamp", "w": 66, "svg": "<svg viewBox=\"0 0 70 70\"><circle cx=\"35\" cy=\"35\" r=\"31\" fill=\"#fff4f8\" stroke=\"#e0457a\" stroke-width=\"3.5\"/><circle cx=\"35\" cy=\"35\" r=\"25\" fill=\"none\" stroke=\"#e0457a\" stroke-width=\"1.6\" stroke-dasharray=\"3 3\"/><text x=\"35\" y=\"41\" text-anchor=\"middle\" font-family=\"Fredoka, Nunito, sans-serif\" font-weight=\"700\" font-size=\"17\" fill=\"#e0457a\" transform=\"rotate(-12 35 35)\">done!</text></svg>"}, "metime": {"label": "me time label", "w": 92, "svg": "<svg viewBox=\"0 0 110 40\"><path d=\"M4 6h92l10 14-10 14H4z\" fill=\"#d9c8f7\" stroke=\"#5a2a2a\" stroke-width=\"3\" stroke-linejoin=\"round\"/><circle cx=\"96\" cy=\"20\" r=\"3\" fill=\"#fff\" stroke=\"#5a2a2a\" stroke-width=\"2\"/><text x=\"47\" y=\"27\" text-anchor=\"middle\" font-family=\"Fredoka, Nunito, sans-serif\" font-weight=\"700\" font-size=\"17\" fill=\"#5a2a6a\">♡ me time</text></svg>"}};
  let uid = 0;

  const week = () => (window.Planner ? window.Planner.week : S.weekId());
  const key = () => S.weekKey(week(), 'stickers');
  const read = () => (S.readJSON(key(), []) || []).filter((s) => TYPES[s.type]);
  function write(list) {
    if (list.length) S.writeJSON(key(), list);
    else localStorage.removeItem(key());
  }
  // each sticker's svg gets its own clip-path id
  const svgFor = (type) => TYPES[type].svg.replace(/CLIP/g, `clip${(uid += 1)}`);

  /* ---------- the sheet ---------- */

  Object.entries(TYPES).forEach(([type, t]) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'sheet-item';
    item.dataset.type = type;
    item.setAttribute('aria-label', `Add a ${t.label} sticker`);
    item.innerHTML = svgFor(type);
    grid.appendChild(item);
  });

  function setSheet(open) {
    sheet.hidden = !open;
    openButton?.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('sheet-open', open);
  }
  openButton?.addEventListener('click', () => setSheet(sheet.hidden));
  closeButton?.addEventListener('click', () => setSheet(false));

  /* ---------- placed stickers ---------- */

  function render() {
    planner.querySelectorAll('.sticker').forEach((el) => el.remove());
    read().forEach((s) => {
      const card = planner.querySelector(`[data-card="${s.card}"]`);
      if (!card) return;
      const el = document.createElement('div');
      el.className = 'sticker';
      el.dataset.id = s.id;
      el.tabIndex = 0;
      el.setAttribute('role', 'img');
      el.setAttribute('aria-label', `${TYPES[s.type].label} sticker (press Delete to remove)`);
      el.style.left = `${s.x}%`;
      el.style.top = `${s.y}%`;
      el.style.setProperty('--w', `${TYPES[s.type].w}px`);
      el.style.setProperty('--r', `${s.r}deg`);
      el.innerHTML = `${svgFor(s.type)}<button type="button" class="del" aria-label="Remove sticker">×</button>`;
      card.appendChild(el);
    });
  }

  function cardAt(x, y) {
    const el = document.elementFromPoint(x, y);
    const card = el && el.closest('[data-card]');
    return card && planner.contains(card) ? card : null;
  }

  function place(list, sticker, card, x, y) {
    const rect = card.getBoundingClientRect();
    sticker.card = card.dataset.card;
    sticker.x = Math.max(-8, Math.min(108, ((x - rect.left) / rect.width) * 100));
    sticker.y = Math.max(-25, Math.min(125, ((y - rect.top) / rect.height) * 100));
    if (!list.includes(sticker)) list.push(sticker);
    write(list);
    render();
  }

  // Tap a sheet sticker: put it on whichever box is nearest the middle of the screen.
  function addToVisibleCard(type) {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    let best = null;
    planner.querySelectorAll('[data-card]').forEach((card) => {
      const r = card.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      const d = Math.hypot(r.left + r.width / 2 - cx, r.top + r.height / 2 - cy);
      if (!best || d < best.d) best = { card, d, r };
    });
    if (!best) return;
    const { r } = best;
    const list = read();
    // tuck it near one of the box's corners so it doesn't cover the writing
    const corners = [[0.06, 0.12], [0.94, 0.12], [0.06, 0.88], [0.94, 0.88]];
    const [fx, fy] = corners[Math.floor(Math.random() * corners.length)];
    place(list, { id: `s${Date.now()}`, type, r: Math.round(Math.random() * 24 - 12) }, best.card,
      r.left + r.width * fx, r.top + r.height * fy);
    window.Planner?.toast('sticker added ✿ drag it anywhere');
  }

  function deselect() {
    planner.querySelectorAll('.sticker.selected').forEach((el) => el.classList.remove('selected'));
  }

  /* ---------- dragging (mouse + touch) ---------- */

  let drag = null;

  function startDrag(event, type, existing) {
    drag = { type, existing, startX: event.clientX, startY: event.clientY, moved: false, ghost: null, target: null };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
    window.addEventListener('pointercancel', onCancel, { once: true });
  }

  function onMove(event) {
    if (!drag) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 6) return;
    if (!drag.moved) {
      drag.moved = true;
      deselect();
      const ghost = document.createElement('div');
      ghost.className = 'sticker-ghost';
      ghost.style.setProperty('--w', `${TYPES[drag.type].w}px`);
      ghost.style.setProperty('--r', `${drag.existing ? drag.existing.data.r : -6}deg`);
      ghost.innerHTML = svgFor(drag.type);
      document.body.appendChild(ghost);
      drag.ghost = ghost;
      if (drag.existing) drag.existing.el.style.visibility = 'hidden';
    }
    event.preventDefault();
    drag.ghost.style.left = `${event.clientX}px`;
    drag.ghost.style.top = `${event.clientY}px`;
    const card = cardAt(event.clientX, event.clientY);
    if (card !== drag.target) {
      drag.target?.classList.remove('drop-target');
      card?.classList.add('drop-target');
      drag.target = card;
    }
  }

  function cleanup() {
    window.removeEventListener('pointermove', onMove);
    drag?.ghost?.remove();
    drag?.target?.classList.remove('drop-target');
    if (drag?.existing) drag.existing.el.style.visibility = '';
    drag = null;
  }

  function onCancel() { cleanup(); }

  function onUp(event) {
    if (!drag) return;
    const d = drag;
    if (!d.moved) {
      cleanup();
      if (d.existing) {
        const was = d.existing.el.classList.contains('selected');
        deselect();
        if (!was) d.existing.el.classList.add('selected');
      } else {
        addToVisibleCard(d.type);
      }
      return;
    }
    const overSheet = !sheet.hidden && sheet.contains(document.elementFromPoint(event.clientX, event.clientY));
    const card = overSheet ? null : cardAt(event.clientX, event.clientY);
    cleanup();
    const list = read();
    if (d.existing) {
      const sticker = list.find((s) => s.id === d.existing.data.id);
      if (!sticker) return;
      if (overSheet) { write(list.filter((s) => s !== sticker)); render(); return; }
      if (card) place(list, sticker, card, event.clientX, event.clientY);
      else render();
    } else if (card) {
      place(list, { id: `s${Date.now()}`, type: d.type, r: Math.round(Math.random() * 24 - 12) }, card, event.clientX, event.clientY);
    }
  }

  grid.addEventListener('pointerdown', (event) => {
    const item = event.target.closest('.sheet-item');
    if (!item || event.button > 0) return;
    startDrag(event, item.dataset.type, null);
  });
  // keyboard: Enter/Space on a sheet sticker adds it
  grid.addEventListener('click', (event) => {
    const item = event.target.closest('.sheet-item');
    if (item && event.detail === 0) addToVisibleCard(item.dataset.type);
  });

  planner.addEventListener('pointerdown', (event) => {
    if (event.target.closest('.del')) return;
    const el = event.target.closest('.sticker');
    if (!el || event.button > 0) return;
    event.preventDefault();
    const data = read().find((s) => s.id === el.dataset.id);
    if (data) startDrag(event, data.type, { el, data });
  });

  planner.addEventListener('click', (event) => {
    const del = event.target.closest('.sticker .del');
    if (!del) return;
    const id = del.closest('.sticker').dataset.id;
    write(read().filter((s) => s.id !== id));
    render();
  });

  planner.addEventListener('keydown', (event) => {
    const el = event.target.closest('.sticker');
    if (!el || !['Delete', 'Backspace'].includes(event.key)) return;
    event.preventDefault();
    write(read().filter((s) => s.id !== el.dataset.id));
    render();
  });

  document.addEventListener('pointerdown', (event) => {
    if (!event.target.closest('.sticker')) deselect();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !sheet.hidden) setSheet(false);
  });

  document.addEventListener('planner:week', render);
  render();
})();
