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

  // Shooting stars only make sense on a fairly clear night.
  function starryNight() {
    const sky = window.skyInfo;
    if (!sky) return true;
    return sky.time === 'night' && ['clear', 'partly', 'cloudy'].includes(sky.kind);
  }

  function shootingStar() {
    if (!skyFx || reduceMotion || !starryNight()) return;
    const star = document.createElement('i');
    star.className = 'shooting-star';
    star.style.left = `${rand(8, 45)}%`;
    star.style.top = `${rand(5, 35)}%`;
    star.addEventListener('animationend', () => star.remove());
    skyFx.appendChild(star);
  }

  /* ---------- twinkling string lights ---------- */

  const lightsEl = document.getElementById('roomLights');
  const starLights = lightsEl
    ? [...lightsEl.querySelectorAll('.light.big')].map((el) => ({
      el,
      x: parseFloat(el.style.getPropertyValue('--x')),
      y: parseFloat(el.style.getPropertyValue('--y'))
    }))
    : [];

  function glint(x, y, size = 1.5) {
    if (!lightsEl || reduceMotion) return;
    const g = document.createElement('i');
    g.className = 'glint';
    g.style.left = `${x}%`;
    g.style.top = `${y}%`;
    g.style.setProperty('--g', size.toFixed(2));
    g.addEventListener('animationend', () => g.remove());
    lightsEl.appendChild(g);
  }

  // Briefly turn a light up to full brightness.
  function flareLight(x, y) {
    const nearest = starLights.reduce((best, light) => {
      const d = Math.hypot(light.x - x, light.y - y);
      return !best || d < best.d ? { light, d } : best;
    }, null);
    if (!nearest || nearest.d > 4) return;
    const { el } = nearest.light;
    el.classList.remove('flare');
    void el.offsetWidth;
    el.classList.add('flare');
    setTimeout(() => el.classList.remove('flare'), 1300);
  }

  /* ---------- clock radio ---------- */

  const clock = document.getElementById('radioClock');
  const clockTime = clock?.querySelector('.rc-time');
  const clockAmPm = clock?.querySelector('.rc-ampm');
  const clockIcon = clock?.querySelector('.rc-icon');
  const uses12h = new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions().hour12 !== false;

  function tickClock() {
    if (!clockTime) return;
    const now = new Date();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    let hours = now.getHours();
    if (uses12h) {
      clockAmPm.textContent = hours < 12 ? 'AM' : 'PM';
      hours = hours % 12 || 12;
    } else {
      clockAmPm.textContent = '';
      hours = String(hours).padStart(2, '0');
    }
    const html = `${hours}<span class="colon">:</span>${minutes}`;
    if (clockTime.innerHTML !== html) clockTime.innerHTML = html; // only when the minute changes
  }

  function setClockIcon(icon) {
    if (clockIcon) clockIcon.textContent = icon || '';
  }

  tickClock();
  setInterval(tickClock, 1000);

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

  /* ---------- rain sounds (generated, no audio files) ---------- */

  const isRaining = () => ['drizzle', 'rain', 'storm'].includes(window.skyInfo?.kind);

  function noiseBuffer(ctx, seconds, brown = false) {
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i += 1) {
      const white = Math.random() * 2 - 1;
      if (brown) {
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      } else {
        data[i] = white;
      }
    }
    return buffer;
  }

  const rain = {
    on: false,
    nodes: [],
    timers: [],
    start() {
      const a = getAudio();
      if (!a) return false;
      const { ctx } = a;
      const kind = window.skyInfo?.kind || 'rain';
      const level = kind === 'drizzle' ? 0.55 : kind === 'storm' ? 1 : 0.8;

      const out = ctx.createGain();
      out.gain.value = 0;
      out.connect(ctx.destination);
      out.gain.setTargetAtTime(0.16 * level, ctx.currentTime, 0.6);

      // steady rainfall: filtered white noise
      const hiss = ctx.createBufferSource();
      hiss.buffer = noiseBuffer(ctx, 3);
      hiss.loop = true;
      const high = ctx.createBiquadFilter();
      high.type = 'highpass';
      high.frequency.value = 450;
      const low = ctx.createBiquadFilter();
      low.type = 'lowpass';
      low.frequency.value = 2400;
      const hissGain = ctx.createGain();
      hissGain.gain.value = 0.55;
      hiss.connect(high).connect(low).connect(hissGain).connect(out);
      hiss.start();

      // soft low rumble of rain on the roof
      const rumble = ctx.createBufferSource();
      rumble.buffer = noiseBuffer(ctx, 4, true);
      rumble.loop = true;
      const rumbleFilter = ctx.createBiquadFilter();
      rumbleFilter.type = 'lowpass';
      rumbleFilter.frequency.value = 420;
      const rumbleGain = ctx.createGain();
      rumbleGain.gain.value = 0.7;
      rumble.connect(rumbleFilter).connect(rumbleGain).connect(out);
      rumble.start();

      // the odd droplet tapping the window
      const tapBuffer = noiseBuffer(ctx, 0.05);
      const tap = () => {
        if (!this.on) return;
        const src = ctx.createBufferSource();
        src.buffer = tapBuffer;
        const band = ctx.createBiquadFilter();
        band.type = 'bandpass';
        band.frequency.value = rand(1800, 5200);
        band.Q.value = 6;
        const g = ctx.createGain();
        const t = ctx.currentTime;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(rand(0.25, 0.6), t + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
        src.connect(band).connect(g).connect(out);
        src.start(t);
        this.timers.push(setTimeout(tap, rand(60, 260) / level));
      };
      tap();

      // distant thunder during storms
      if (kind === 'storm') {
        const thunder = () => {
          if (!this.on) return;
          const src = ctx.createBufferSource();
          src.buffer = noiseBuffer(ctx, 4, true);
          const f = ctx.createBiquadFilter();
          f.type = 'lowpass';
          f.frequency.value = 160;
          const g = ctx.createGain();
          const t = ctx.currentTime;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(2.2, t + 0.35);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 3.8);
          src.connect(f).connect(g).connect(out);
          src.start(t);
          this.timers.push(setTimeout(thunder, rand(9000, 20000)));
        };
        this.timers.push(setTimeout(thunder, rand(3000, 7000)));
      }

      this.nodes = [out, hiss, rumble];
      this.on = true;
      return true;
    },
    stop() {
      this.on = false;
      this.timers.forEach(clearTimeout);
      this.timers = [];
      const [out, ...sources] = this.nodes;
      if (out && audio) {
        out.gain.setTargetAtTime(0, audio.ctx.currentTime, 0.25);
        setTimeout(() => {
          sources.forEach((src) => { try { src.stop(); } catch { /* already stopped */ } });
          out.disconnect();
        }, 1200);
      }
      this.nodes = [];
    }
  };

  /* ---------- the things in the room ---------- */

  const musicButtons = document.querySelectorAll('[data-thing="radio"], [data-thing="headphones"]');
  const lampButton = document.querySelector('[data-thing="lamp"]');

  function setMusicLabels() {
    musicButtons.forEach((button) => {
      let label;
      if (button.dataset.thing === 'radio') {
        if (rain.on) label = 'Switch the radio to music';
        else if (music.on) label = 'Turn off the radio';
        else label = isRaining() ? 'Play rain sounds on the radio' : 'Turn on the radio';
      } else {
        label = music.on ? 'Turn off the music' : 'Turn on the music';
      }
      button.setAttribute('aria-label', label);
      button.setAttribute('aria-pressed', String(button.dataset.thing === 'radio' ? (music.on || rain.on) : music.on));
      button.dataset.tip = label.toLowerCase();
    });
    setClockIcon(rain.on ? '☂' : music.on ? '♪' : '');
  }

  function startMusic(x, y) {
    if (rain.on) rain.stop();
    if (music.start()) {
      bubble(x, y, pick(['♪ lo-fi for planning', '♪ now playing: cozy', '♫ a little music box tune']));
      burst(x, y + 3, ['♪', '♫', '♩'], 5);
    }
  }

  function startRain(x, y) {
    if (music.on) music.stop();
    if (rain.start()) {
      bubble(x, y, pick(['☂ rain sounds on', '☂ cozy rain for planning', '☂ listening to the rain']));
      burst(x, y + 3, ['☂', '💧'], 4, ['#9fb8ff', '#c8d6ff', '#ffffff'], 6);
    }
  }

  function stopSound(x, y) {
    music.stop();
    rain.stop();
    bubble(x, y, pick(['radio off', 'shh… quiet time', 'paused ♡']));
  }

  // Radio: off → (rain sounds, if it's raining where you are) → music → off.
  function cycleRadio(x, y) {
    if (rain.on) startMusic(x, y);
    else if (music.on) stopSound(x, y);
    else if (isRaining()) startRain(x, y);
    else startMusic(x, y);
    setMusicLabels();
  }

  // Headphones: music on/off.
  function toggleMusic(x, y) {
    if (music.on) stopSound(x, y);
    else startMusic(x, y);
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
    radio() { cycleRadio(9, 59); },
    headphones() { toggleMusic(91, 67); },
    lamp() {
      const off = document.body.classList.toggle('lights-off');
      bubble(96, 48, off ? 'cozy mode ☾' : 'lights on ✦');
      if (off) burst(97, 54, ['✦', '✧'], 4, GOLDS, 3);
      setLampLabel();
    },
    window() {
      const sky = window.skyInfo || { time: 'night', kind: 'clear' };
      const where = sky.city ? ` in ${sky.city}` : '';
      const temp = sky.temp ? ` · ${sky.temp}` : '';
      if (starryNight()) {
        shootingStar();
        setTimeout(shootingStar, 260);
        bubble(42, 12, pick(['make a wish ✦', 'a shooting star!', 'the moon says hi ☾']) + temp);
        return;
      }
      const lines = {
        storm: ['stormy out there ⚡ stay cozy', 'did you hear that thunder?'],
        rain: [`it's raining${where} ☂`, 'listen to the rain… (try the radio ☂)', 'perfect planning weather ☂'],
        drizzle: [`a little drizzle${where}`, 'soft rain today ☂ (try the radio)'],
        snow: [`it's snowing${where}! ❄`, 'snow day ❄'],
        fog: ['so foggy out', `misty${where} today`],
        overcast: ['grey skies today', `cloudy${where}`],
        cloudy: ['clouds rolling by ☁', `cloudy${where}`],
        partly: [sky.time === 'day' ? 'sunny with a few clouds ☀' : 'a few clouds tonight', `nice out${where}`],
        clear: [sky.time === 'day' ? `what a pretty day${where} ☀` : `clear skies${where} ✦`, 'not a cloud in the sky']
      };
      bubble(42, 12, pick(lines[sky.kind] || lines.clear) + temp);
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
    star(button) {
      const x = Number(button.style.getPropertyValue('--x')) + Number(button.style.getPropertyValue('--w')) / 2;
      const y = Number(button.style.getPropertyValue('--y')) + Number(button.style.getPropertyValue('--h')) / 2;
      flareLight(x, y);
      for (let i = 0; i < 5; i += 1) setTimeout(() => glint(x + rand(-2.4, 2.4), y + rand(-3.5, 3), rand(1.3, 2.2)), i * 110);
      bubble(x, y - 3, pick(['✦ twinkle twinkle', 'so sparkly!', '*glows happily*', 'make a wish ✦']));
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
  document.addEventListener('sky:update', setMusicLabels);

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
  const today = new Date();
  const md = `${today.getMonth() + 1}-${today.getDate()}`;
  const holiday = { '10-31': 'happy halloween 🎃', '12-24': 'merry christmas eve ✦', '12-25': 'merry christmas ✦', '12-31': "happy new year's eve ✦", '1-1': 'happy new year ✦', '2-14': "happy valentine's day ♡" }[md];
  // Wait until the room picture has loaded before saying hello.
  function whenRoomReady(callback) {
    const root = document.documentElement;
    if (root.classList.contains('room-ready')) { callback(); return; }
    const watcher = new MutationObserver(() => {
      if (root.classList.contains('room-ready')) { watcher.disconnect(); callback(); }
    });
    watcher.observe(root, { attributes: true, attributeFilter: ['class'] });
  }

  whenRoomReady(() => setTimeout(() => {
    const greeting = holiday || hello;
    bubble(76.5, 29, `${greeting}${name ? `, ${name.toLowerCase()}` : ''} ✦ ${verb} the computer to plan your week, or ${verb} around the room`, 6500, true);
  }, 700));

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

    setInterval(() => {
      if (document.hidden || !starLights.length) return;
      const star = pick(starLights);
      glint(star.x + rand(-1.4, 1.4), star.y + rand(-2.4, 1.6), rand(1.1, 1.9));
    }, 700);

    const queueStar = () => setTimeout(() => {
      if (!document.hidden) shootingStar();
      queueStar();
    }, rand(14000, 32000));
    queueStar();
  }
})();
