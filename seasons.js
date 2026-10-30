// Seasonal decorations that appear on their own by the visitor's date.
//   Halloween (Oct 15–31): pumpkins on the windowsill + bats outside
//   Winter (Dec 1 – Jan 6): paper snowflakes on the glass + a light flurry
//   Valentine's (February): heart stickers on the glass + floating hearts
// Preview with index.html?season=halloween | winter | valentine | none
(() => {
  const scene = document.getElementById('scene');
  const outside = document.getElementById('outside');
  if (!scene || !outside) return;

  const params = new URLSearchParams(window.location.search);
  const forced = params.get('season');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rand = (min, max) => min + Math.random() * (max - min);

  function seasonFor(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    if (month === 10 && day >= 15) return 'halloween';
    if (month === 12 || (month === 1 && day <= 6)) return 'winter';
    if (month === 2) return 'valentine';
    return '';
  }

  const season = forced !== null ? (['halloween', 'winter', 'valentine'].includes(forced) ? forced : '') : seasonFor(new Date());
  if (!season) return;
  document.body.dataset.season = season;

  const OUTLINE = '#5a2a1c';

  const pumpkinSVG = `
    <svg viewBox="0 0 64 58" aria-hidden="true">
      <path d="M29 9c-1-4 1-7 5-7 2 0 3 2 2 4l-2 5z" fill="#86b35f" stroke="${OUTLINE}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M35 8c4-5 11-4 13 0-5 3-9 3-13 0z" fill="#a6d07a" stroke="${OUTLINE}" stroke-width="2.2" stroke-linejoin="round"/>
      <ellipse cx="19" cy="35" rx="15.5" ry="19" fill="#ff9a5a" stroke="${OUTLINE}" stroke-width="3"/>
      <ellipse cx="45" cy="35" rx="15.5" ry="19" fill="#ff9a5a" stroke="${OUTLINE}" stroke-width="3"/>
      <ellipse cx="32" cy="34" rx="15" ry="21" fill="#ffae6c" stroke="${OUTLINE}" stroke-width="3"/>
      <ellipse cx="25" cy="23" rx="3.4" ry="5.5" fill="#fff" opacity=".5"/>
      <ellipse class="pk-face" cx="26" cy="33" rx="2.6" ry="3.3"/>
      <ellipse class="pk-face" cx="38" cy="33" rx="2.6" ry="3.3"/>
      <path class="pk-face" d="M28 40q4 4.5 8 0q-4 1.6-8 0z"/>
      <ellipse cx="20.5" cy="39" rx="3.2" ry="2" fill="#ff6f9c" opacity=".55"/>
      <ellipse cx="43.5" cy="39" rx="3.2" ry="2" fill="#ff6f9c" opacity=".55"/>
    </svg>`;

  const batSVG = `
    <svg viewBox="0 0 72 36" aria-hidden="true">
      <g class="wing wing-l"><path d="M33 17C26 6 13 4 3 9c5 1 7 5 6 9 4-2 7 0 8 4 3-3 7-3 10 0 2-3 4-5 6-5z" fill="#6a4677" stroke="#3d2347" stroke-width="2" stroke-linejoin="round"/></g>
      <g class="wing wing-r"><path d="M39 17c7-11 20-13 30-8-5 1-7 5-6 9-4-2-7 0-8 4-3-3-7-3-10 0-2-3-4-5-6-5z" fill="#6a4677" stroke="#3d2347" stroke-width="2" stroke-linejoin="round"/></g>
      <path d="M29 12l2-7 4 5 4-5 2 7" fill="#7d5590" stroke="#3d2347" stroke-width="2" stroke-linejoin="round"/>
      <ellipse cx="36" cy="19" rx="8.5" ry="8" fill="#7d5590" stroke="#3d2347" stroke-width="2"/>
      <circle cx="32.8" cy="18" r="1.6" fill="#fff"/><circle cx="39.2" cy="18" r="1.6" fill="#fff"/>
      <ellipse cx="31" cy="22" rx="2" ry="1.2" fill="#ff8fb3" opacity=".8"/><ellipse cx="41" cy="22" rx="2" ry="1.2" fill="#ff8fb3" opacity=".8"/>
    </svg>`;

  const snowflakeSVG = `
    <svg viewBox="-20 -20 40 40" aria-hidden="true">
      <g fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round">
        ${[0, 60, 120, 180, 240, 300].map((r) => `<path transform="rotate(${r})" d="M0 0V-17M0-11l-4.5-4.5M0-11l4.5-4.5M0-5l-3.2-3.2M0-5l3.2-3.2"/>`).join('')}
      </g>
      <circle r="2.4" fill="#fff"/>
    </svg>`;

  const heartSVG = (fill, stroke) => `
    <svg viewBox="0 0 32 29" aria-hidden="true">
      <path d="M16 27.5C6.5 20 1.5 14.5 1.5 8.8 1.5 4.4 4.8 1.5 8.7 1.5c3.2 0 5.7 1.8 7.3 4.6 1.6-2.8 4.1-4.6 7.3-4.6 3.9 0 7.2 2.9 7.2 7.3 0 5.7-5 11.2-14.5 18.7z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <ellipse cx="9" cy="8" rx="2.4" ry="3.2" fill="#fff" opacity=".55" transform="rotate(-25 9 8)"/>
    </svg>`;

  // Layers: one in the room (sill decorations), one on/behind the glass.
  const room = document.createElement('div');
  room.className = `season-room season-${season}`;
  room.setAttribute('aria-hidden', 'true');
  const sky = document.createElement('div');
  sky.className = `season-sky season-${season}`;
  const glass = document.createElement('div');
  glass.className = 'season-glass';
  const glowLayer = document.createElement('div');
  glowLayer.className = 'season-glow';
  glowLayer.setAttribute('aria-hidden', 'true');
  outside.appendChild(sky);
  outside.appendChild(glass);
  scene.appendChild(room);
  scene.appendChild(glowLayer);

  const place = (el, styles) => { Object.assign(el.style, styles); return el; };

  if (season === 'halloween') {
    // pumpkins sitting on the windowsill (between the mug and the books)
    [
      { x: 38.2, w: 3.9, flip: false },
      { x: 41.8, w: 3.0, flip: true },
      { x: 44.4, w: 2.2, flip: false }
    ].forEach((p) => {
      const pumpkin = document.createElement('div');
      pumpkin.className = 'pumpkin';
      pumpkin.innerHTML = pumpkinSVG;
      place(pumpkin, { left: `${p.x}%`, width: `${p.w}%`, transform: `translateX(-50%)${p.flip ? ' scaleX(-1)' : ''}` });
      room.appendChild(pumpkin);
      const glow = document.createElement('i');
      glow.className = 'pumpkin-glow';
      place(glow, { left: `${p.x}%`, width: `${p.w * 1.5}%` });
      glowLayer.appendChild(glow);
    });
    // bats fluttering past outside
    [{ top: 14, dur: 15, delay: -3, size: 17 }, { top: 32, dur: 21, delay: -13, size: 12 }].forEach((b) => {
      const track = document.createElement('div');
      track.className = 'bat-track';
      place(track, { top: `${b.top}%`, animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s` });
      const bat = document.createElement('div');
      bat.className = 'bat';
      bat.style.width = `${b.size}%`;
      bat.innerHTML = batSVG;
      track.appendChild(bat);
      sky.appendChild(track);
    });
  }

  if (season === 'winter') {
    [
      { x: 9, y: 32, s: 12, r: 10 }, { x: 19, y: 45, s: 7, r: -15 }, { x: 87, y: 30, s: 11, r: -8 },
      { x: 79, y: 20, s: 6.5, r: 20 }, { x: 9, y: 62, s: 8, r: 25 }, { x: 91, y: 56, s: 8.5, r: -20 }
    ].forEach((f) => {
      const flake = document.createElement('div');
      flake.className = 'cling flake';
      flake.innerHTML = snowflakeSVG;
      place(flake, { left: `${f.x}%`, top: `${f.y}%`, width: `${f.s}%`, transform: `translate(-50%,-50%) rotate(${f.r}deg)` });
      glass.appendChild(flake);
    });
    if (!reduceMotion) {
      for (let i = 0; i < 9; i += 1) {
        const flake = document.createElement('div');
        flake.className = 'flurry';
        flake.innerHTML = snowflakeSVG;
        place(flake, {
          left: `${rand(4, 96)}%`, width: `${rand(2.6, 4.6)}%`,
          animationDuration: `${rand(9, 16).toFixed(1)}s`, animationDelay: `${(-rand(0, 16)).toFixed(1)}s`
        });
        sky.appendChild(flake);
      }
    }
  }

  if (season === 'valentine') {
    [
      { x: 8, y: 30, s: 11, r: -12, c: ['#ff8fb3', '#c93d66'] }, { x: 17, y: 42, s: 7, r: 10, c: ['#ffc2d6', '#e0507f'] },
      { x: 88, y: 32, s: 10, r: 14, c: ['#ff6f9c', '#b8325e'] }, { x: 80, y: 22, s: 6, r: -8, c: ['#ffc2d6', '#e0507f'] },
      { x: 10, y: 60, s: 7.5, r: 18, c: ['#ff6f9c', '#b8325e'] }, { x: 90, y: 55, s: 8, r: -16, c: ['#ff8fb3', '#c93d66'] }
    ].forEach((h) => {
      const heart = document.createElement('div');
      heart.className = 'cling';
      heart.innerHTML = heartSVG(h.c[0], h.c[1]);
      place(heart, { left: `${h.x}%`, top: `${h.y}%`, width: `${h.s}%`, transform: `translate(-50%,-50%) rotate(${h.r}deg)` });
      glass.appendChild(heart);
    });
    if (!reduceMotion) {
      setInterval(() => {
        if (document.hidden) return;
        const heart = document.createElement('div');
        heart.className = 'float-heart';
        heart.innerHTML = heartSVG(Math.random() < 0.5 ? '#ff8fb3' : '#ffb3cb', '#c93d66');
        place(heart, { left: `${rand(36, 52)}%`, width: `${rand(1.6, 2.4)}%`, '--dx': `${rand(-30, 30)}px` });
        heart.addEventListener('animationend', () => heart.remove());
        room.appendChild(heart);
      }, 2600);
    }
  }
})();
