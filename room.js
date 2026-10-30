// Interactive room: clickable objects in the homepage artwork.
// Hotspots are positioned in % of the artwork, so they stay on their
// objects at every screen size. Nothing here paints over the art itself.
(() => {
  const scene = document.getElementById('scene');
  const fx = document.getElementById('roomFx');
  const skyFx = document.getElementById('skyFx');
  const tip = document.getElementById('roomTip');
  const live = document.getElementById('roomLive');
  if (!scene || !fx) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const PINKS = ['#ff6f9c', '#ff8fb3', '#f7578a', '#ffb3c9'];
  const GOLDS = ['#ffd75e', '#ffe58f', '#fff3b8'];

  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const rand = (min, max) => min + Math.random() * (max - min);

  function firstName() {
    try {
      const users = JSON.parse(localStorage.getItem('weeklyPlanner.users')) || {};
      const email = localStorage.getItem('weeklyPlanner.currentUser');
      return email ? (users[email]?.name || '').trim().split(/\s+/)[0] : '';
    } catch {
      return '';
    }
  }

  const isLoggedIn = () => Boolean(localStorage.getItem('weeklyPlanner.currentUser'));

  /* ---------- speech bubbles + floating bits ---------- */

  let bubbleTimer = 0;
  function bubble(x, y, text, ms = 2600, wide = false) {
    fx.querySelectorAll('.bubble').forEach((old) => old.remove());
    clearTimeout(bubbleTimer);

    const el = document.createElement('div');
    el.className = 'bubble';
    if (wide) el.classList.add('bubble-wide');
    if (x < 14) el.classList.add('align-left');
    if (x > 86) el.classList.add('align-right');
    el.style.left = `${x}%`;
    el.style.top = `${y}%`;
    el.textContent = text;
    fx.appendChild(el);
    if (live) live.textContent = text;

    bubbleTimer = setTimeout(() => {
      el.classList.add('leaving');
      setTimeout(() => el.remove(), 260);
    }, ms);
  }

  function burst(x, y, glyphs, count = 6, colors = PINKS, spread = 4) {
    if (reduceMotion) return;
    for (let i = 0; i < count; i += 1) {
      const p = document.createElement('span');
      p.className = 'fx-bit';
      p.textContent = pick(glyphs);
      p.style.left = `${x + rand(-spread / 2, spread / 2)}%`;
      p.style.top = `${y + rand(-1.5, 1.5)}%`;
      p.style.setProperty('--c', pick(colors));
      p.style.setProperty('--dx', `${rand(-40, 40)}px`);
      p.style.setProperty('--dy', `${rand(50, 110)}px`);
      p.style.setProperty('--rot', `${rand(-40, 40)}deg`);
      p.style.setProperty('--dur', `${rand(1.1, 1.9)}s`);
      p.style.animationDelay = `${i * 70}ms`;
      p.addEventListener('animationend', () => p.remove());
      fx.appendChild(p);
    }
  }

  function shootingStar() {
    if (!skyFx || reduceMotion) return;
    const star = document.createElement('i');
    star.className = 'shooting-star';
    star.style.left = `${rand(8, 45)}%`;
    star.style.top = `${rand(5, 35)}%`;
    star.addEventListener('animationend', () => star.remove());
    skyFx.appendChild(star);
  }

  /* ---------- a tiny music box (original melody, Web Audio) ---------- */

  let audio = null;
  function getAudio() {
    if (!audio) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      const ctx = new Ctx();
      const master = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 3600;
      master.gain.value = 0;
      master.connect(filter).connect(ctx.destination);
      audio = { ctx, master };
    }
    if (audio.ctx.state === 'suspended') audio.ctx.resume();
    return audio;
  }

  const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

  function chime(midi, when, length = 1.3, volume = 0.5, type = 'sine') {
    const { ctx, master } = audio;
    [1, 2].forEach((harmonic, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = hz(midi) * harmonic;
      const peak = volume * (index ? 0.22 : 1);
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(peak, when + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + length);
      osc.connect(gain).connect(master);
      osc.start(when);
      osc.stop(when + length + 0.05);
    });
  }

  // 4 bars of eighth notes; null = rest. Bass plays on beats 1 and 3.
  const MELODY = [
    76, 79, 81, 79, 76, 74, 72, 74,
    76, 79, 84, 81, 79, 76, 74, null,
    72, 74, 76, 79, 81, 79, 76, 74,
    72, 76, 74, 72, 69, 72, null, null
  ];
  const BASS = [[48, 55], [45, 52], [41, 48], [43, 50]];
  const EIGHTH = 60 / 84 / 2;

  const music = {
    on: false,
    step: 0,
    next: 0,
    timer: 0,
    noteTimer: 0,
    start() {
      const a = getAudio();
      if (!a) return false;
      this.on = true;
      this.step = 0;
      this.next = a.ctx.currentTime + 0.08;
      a.master.gain.cancelScheduledValues(a.ctx.currentTime);
      a.master.gain.setTargetAtTime(0.13, a.ctx.currentTime, 0.05);
      this.timer = setInterval(() => this.schedule(), 50);
      this.schedule();
      this.noteTimer = setInterval(() => {
        if (!document.hidden) burst(9, 62, ['♪', '♫', '♩'], 1, PINKS, 6);
      }, 850);
      return true;
    },
    schedule() {
      const { ctx } = audio;
      while (this.next < ctx.currentTime + 0.25) {
        const i = this.step % MELODY.length;
        if (MELODY[i] !== null) chime(MELODY[i], this.next, 1.25, 0.5);
        if (i % 4 === 0) {
          const bar = Math.floor(i / 8);
          chime(BASS[bar][(i % 8) / 4], this.next, 1.6, 0.32, 'triangle');
        }
        this.next += EIGHTH;
        this.step += 1;
      }
    },
    stop() {
      this.on = false;
      clearInterval(this.timer);
      clearInterval(this.noteTimer);
      if (audio) audio.master.gain.setTargetAtTime(0, audio.ctx.currentTime, 0.08);
    }
  };

  function blip() {
    const a = getAudio();
    if (!a) return;
    const { ctx } = a;
    const out = ctx.createGain();
    out.gain.value = 0.05;
    out.connect(ctx.destination);
    [988, 1319].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = freq;
      osc.connect(out);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.08);
    });
  }

  /* ---------- the things in the room ---------- */

  const musicButtons = document.querySelectorAll('[data-thing="radio"], [data-thing="headphones"]');
  const lampButton = document.querySelector('[data-thing="lamp"]');

  function setMusicLabels() {
    musicButtons.forEach((button) => {
      const what = button.dataset.thing === 'radio' ? 'radio' : 'music';
      const label = music.on ? `Turn off the ${what}` : `Turn on the ${what}`;
      button.setAttribute('aria-label', label);
      button.setAttribute('aria-pressed', String(music.on));
      button.dataset.tip = label.toLowerCase();
    });
  }

  function toggleMusic(x, y) {
    if (music.on) {
      music.stop();
      bubble(x, y, pick(['music off', 'shh… quiet time', 'paused ♡']));
    } else if (music.start()) {
      bubble(x, y, pick(['♪ lo-fi for planning', '♪ now playing: cozy', '♫ a little music box tune']));
      burst(x, y + 3, ['♪', '♫', '♩'], 5);
    }
    setMusicLabels();
  }

  function setLampLabel() {
    if (!lampButton) return;
    const off = document.body.classList.contains('lights-off');
    const label = off ? 'Turn the lights back on' : 'Turn off the lights';
    lampButton.setAttribute('aria-label', label);
    lampButton.setAttribute('aria-pressed', String(off));
    lampButton.dataset.tip = label.toLowerCase();
  }

  const actions = {
    cat() {
      bubble(10.5, 49, pick(['purrrr… ♡', 'mrrp?', '*happy cat noises*', 'five more minutes…']));
      burst(10.5, 52, ['♡', '♥'], 6);
    },
    radio() { toggleMusic(9, 59); },
    headphones() { toggleMusic(91, 67); },
    lamp() {
      const off = document.body.classList.toggle('lights-off');
      bubble(96, 48, off ? 'cozy mode ☾' : 'lights on ✦');
      if (off) burst(97, 54, ['✦', '✧'], 4, GOLDS, 3);
      setLampLabel();
    },
    window() {
      shootingStar();
      setTimeout(shootingStar, 260);
      bubble(42, 12, pick(['make a wish ✦', 'a shooting star!', 'the moon says hi ☾']));
    },
    mug() {
      bubble(35, 60, pick(['sip… ♡', 'still warm', 'refill?', 'latte break ☕']));
      burst(34, 62, ['♡', '∿'], 5, ['#ffffff', '#ffe0ea', '#ffc2d4'], 3);
    },
    tulips() {
      bubble(25, 43, pick(['for you ✿', 'fresh tulips!', 'smells like spring']));
      burst(25, 50, ['✿', '❀', '✾'], 7, PINKS, 8);
    },
    console() {
      const name = firstName();
      bubble(49, 71, pick([name ? `ready, player ${name.toLowerCase()}?` : 'ready, player one?', 'new high score!', '1-up ✦']));
      burst(49, 78, ['✦', '★', '✧'], 6, GOLDS, 8);
      blip();
    },
    bunny(button) {
      const x = Number(button.style.getPropertyValue('--x')) + Number(button.style.getPropertyValue('--w')) / 2;
      const y = Number(button.style.getPropertyValue('--y'));
      bubble(x, y, pick(['boing!', 'hi hi!', '*wiggles ears*', '♡']));
      burst(x, y + 3, ['♡'], 4, PINKS, 3);
    }
  };

  document.querySelectorAll('[data-thing]').forEach((button) => {
    const action = actions[button.dataset.thing];
    if (!action) return;
    button.addEventListener('click', () => action(button));
  });

  // The journal opens Customize for members, or Sign up for new visitors.
  const journal = document.querySelector('[data-link="journal"]');
  if (journal) {
    const member = isLoggedIn();
    journal.href = member ? 'planner.html?customize=1' : 'login.html?mode=signup';
    journal.dataset.tip = member ? 'decorate your planner' : 'make your own planner';
    journal.setAttribute('aria-label', member ? 'Decorate your planner' : 'Sign up for your own planner');
  }

  setMusicLabels();
  setLampLabel();

  /* ---------- hover labels (mouse only) ---------- */

  if (canHover && tip) {
    scene.addEventListener('pointermove', (event) => {
      const target = event.target.closest('[data-tip]');
      if (!target) {
        tip.classList.remove('show');
        return;
      }
      tip.textContent = target.dataset.tip;
      tip.style.left = `${event.clientX}px`;
      tip.style.top = `${event.clientY}px`;
      tip.classList.add('show');
    });
    scene.addEventListener('pointerleave', () => tip.classList.remove('show'));
    scene.addEventListener('click', () => tip.classList.remove('show'));
  }

  /* ---------- greeting + gentle ambient life ---------- */

  const hour = new Date().getHours();
  const hello = hour >= 5 && hour < 12 ? 'good morning'
    : hour >= 12 && hour < 17 ? 'good afternoon'
    : hour >= 17 && hour < 22 ? 'good evening'
    : 'hi, night owl';
  const name = firstName();
  const verb = canHover ? 'click' : 'tap';
  setTimeout(() => {
    bubble(76.5, 29, `${hello}${name ? `, ${name.toLowerCase()}` : ''} ✦ ${verb} the computer to plan your week, or ${verb} around the room`, 6500, true);
  }, 900);

  if (!reduceMotion) {
    setInterval(() => {
      if (document.hidden) return;
      const z = document.createElement('span');
      z.className = 'fx-z';
      z.textContent = pick(['z', 'Z', 'z']);
      z.style.left = `${rand(12.5, 13.5)}%`;
      z.style.top = '51%';
      z.addEventListener('animationend', () => z.remove());
      fx.appendChild(z);
    }, 2400);

    const queueStar = () => setTimeout(() => {
      if (!document.hidden) shootingStar();
      queueStar();
    }, rand(14000, 32000));
    queueStar();
  }
})();
