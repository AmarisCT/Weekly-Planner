// Shows the visitor's real week on the little planner drawn on the computer
// screen in the artwork: each day's plans are written into that day's column,
// and today's column is highlighted. Reads the same saved notes as planner.html.
(() => {
  const el = document.getElementById('monitorWeek');
  if (!el) return;

  const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  // Column edges in the artwork (image pixels), measured from the drawing.
  const COLS = [[1040, 1112], [1114, 1185], [1186, 1257], [1259, 1330], [1331, 1402], [1403, 1475], [1477, 1556]];
  const LEFT = 1040;
  const WIDTH = 516;

  const S = window.PlannerStore;
  if (!S) return;
  S.migrate();

  // This week's plans for a day: [{ t: text, d: done }]
  const notesFor = (day) => S.readItems(S.dayKey(S.weekId(), day));

  function render() {
    const today = (new Date().getDay() + 6) % 7;
    el.textContent = '';

    DAYS.forEach((day, i) => {
      const [a, b] = COLS[i];
      const col = document.createElement('div');
      col.className = 'mw-col';
      col.style.left = `${((a - LEFT) / WIDTH) * 100}%`;
      col.style.width = `${((b - a) / WIDTH) * 100}%`;

      if (i === today) {
        const mark = document.createElement('div');
        mark.className = 'mw-today';
        col.appendChild(mark);
      }

      const notes = notesFor(day);
      if (notes.length) {
        const list = document.createElement('ul');
        list.className = 'mw-notes';
        // unfinished plans first, ticked-off ones after (crossed out)
        [...notes.filter((n) => !n.d), ...notes.filter((n) => n.d)].forEach((note) => {
          const item = document.createElement('li');
          item.textContent = note.t;
          if (note.d) item.className = 'done';
          list.appendChild(item);
        });
        col.appendChild(list);
      }
      el.appendChild(col);
    });

    // Mark columns with more plans than fit, so they end in a little "…".
    requestAnimationFrame(() => {
      el.querySelectorAll('.mw-notes').forEach((list) => {
        const hidden = [...list.children].filter((item) => item.offsetTop + 2 >= list.clientHeight).length;
        list.classList.toggle('more', hidden > 0);
        if (hidden) list.dataset.more = `+${hidden}`;
        else delete list.dataset.more;
      });
    });

    const todays = notesFor(DAYS[today]);
    const link = document.querySelector('.monitor-hit');
    if (link) {
      const open = todays.filter((n) => !n.d).map((n) => n.t);
      link.setAttribute('aria-label', open.length
        ? `Open the Weekly Planner. ${NAMES[today]}: ${open.join(', ')}`
        : 'Open the Weekly Planner');
    }
  }

  render();
  document.fonts?.ready?.then(render);
  window.addEventListener('storage', render);
  window.addEventListener('pageshow', render);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
  document.getElementById('homeLogout')?.addEventListener('click', () => setTimeout(render, 0));
  setInterval(render, 5 * 60 * 1000); // keeps "today" right after midnight
})();
