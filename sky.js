// Live view out of the window.
// Shows the visitor's own sky: their local time (sunrise/sunset, sun or moon
// position, the real moon phase) and their current weather (clouds, rain,
// drizzle, snow, fog, storms). The window glass in the artwork is see-through,
// so everything here sits *behind* the string lights, curtains and plants.
//
// Location: the visitor's approximate city from their connection (no pop-up).
// If they have already allowed location for this site, the precise position is
// used instead. Weather + sunrise/sunset: Open-Meteo (free, no key).
//
// Preview any condition with URL options, e.g. index.html?weather=rain&time=night
//   weather: clear | partly | cloudy | overcast | fog | drizzle | rain | snow | storm
//   time:    dawn | day | dusk | night
(() => {
  const outside = document.getElementById('outside');
  if (!outside) return;

  const params = new URLSearchParams(window.location.search);
  const forcedWeather = params.get('weather');
  const forcedTime = params.get('time');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cloudsEl = document.getElementById('skyClouds');
  const glass = document.getElementById('skyGlass');
  const flash = outside.querySelector('.flash');
  const moonLit = outside.querySelector('.moon-lit');
  const windowButton = document.querySelector('[data-thing="window"]');

  const LOC_KEY = 'weeklyPlanner.sky.location';
  const WX_KEY = 'weeklyPlanner.sky.weather';
  const LOC_MAX_AGE = 6 * 60 * 60 * 1000;
  const WX_MAX_AGE = 15 * 60 * 1000;

  const state = { loc: null, wx: null };

  /* ---------- small helpers ---------- */

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const rand = (min, max) => min + Math.random() * (max - min);

  function readCache(key, maxAge) {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      if (data && Date.now() - data.savedAt < maxAge) return data;
    } catch { /* ignore */ }
    return null;
  }

  function writeCache(key, data) {
    try { localStorage.setItem(key, JSON.stringify({ ...data, savedAt: Date.now() })); } catch { /* ignore */ }
  }

  async function getJSON(url, ms = 7000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  }

  const usesFahrenheit = /-(US|LR|MM)\b/i.test(navigator.language || '');

  /* ---------- where is the visitor? ---------- */

  function devicePosition() {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, city: '', source: 'device' }),
        () => resolve(null),
        { timeout: 8000, maximumAge: 30 * 60 * 1000 }
      );
    });
  }

  async function locate() {
    // Precise location only if the visitor has already allowed it (never prompts).
    try {
      if (navigator.permissions && navigator.geolocation) {
        const status = await navigator.permissions.query({ name: 'geolocation' });
        if (status.state === 'granted') {
          const precise = await devicePosition();
          if (precise) {
            const cached = readCache(LOC_KEY, LOC_MAX_AGE);
            precise.city = cached?.city || '';
            return precise;
          }
        }
      }
    } catch { /* ignore */ }

    const cached = readCache(LOC_KEY, LOC_MAX_AGE);
    if (cached) return cached;

    const lookups = [
      async () => {
        const d = await getJSON('https://get.geojs.io/v1/ip/geo.json');
        return { lat: Number(d.latitude), lon: Number(d.longitude), city: d.city || '' };
      },
      async () => {
        const d = await getJSON('https://ipwho.is/');
        if (d.success === false) throw new Error('lookup failed');
        return { lat: Number(d.latitude), lon: Number(d.longitude), city: d.city || '' };
      }
    ];

    for (const lookup of lookups) {
      try {
        const loc = await lookup();
        if (Number.isFinite(loc.lat) && Number.isFinite(loc.lon)) {
          writeCache(LOC_KEY, { ...loc, source: 'network' });
          return loc;
        }
      } catch { /* try the next one */ }
    }
    return null;
  }

  /* ---------- what's the weather there? ---------- */

  async function loadWeather(loc) {
    const cached = readCache(WX_KEY, WX_MAX_AGE);
    if (cached && Math.abs(cached.lat - loc.lat) < 0.2 && Math.abs(cached.lon - loc.lon) < 0.2) return cached;

    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', loc.lat.toFixed(3));
    url.searchParams.set('longitude', loc.lon.toFixed(3));
    url.searchParams.set('current', 'temperature_2m,weather_code,cloud_cover,precipitation,wind_speed_10m');
    url.searchParams.set('daily', 'sunrise,sunset');
    url.searchParams.set('forecast_days', '1');
    url.searchParams.set('timezone', 'auto');
    if (usesFahrenheit) url.searchParams.set('temperature_unit', 'fahrenheit');

    const d = await getJSON(url);
    const wx = {
      lat: loc.lat,
      lon: loc.lon,
      code: Number(d.current?.weather_code ?? 0),
      cover: clamp(Number(d.current?.cloud_cover ?? 0), 0, 100),
      precip: Math.max(0, Number(d.current?.precipitation ?? 0)),
      wind: Math.max(0, Number(d.current?.wind_speed_10m ?? 0)),
      temp: Number(d.current?.temperature_2m),
      unit: usesFahrenheit ? 'F' : 'C',
      sunrise: d.daily?.sunrise?.[0] || null,
      sunset: d.daily?.sunset?.[0] || null,
      offset: Number(d.utc_offset_seconds)
    };
    writeCache(WX_KEY, wx);
    return wx;
  }

  /* ---------- turning data into a scene ---------- */

  function kindOf(code, cover) {
    if (code >= 95) return 'storm';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow';
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'rain';
    if ([51, 53, 55, 56, 57].includes(code)) return 'drizzle';
    if (code === 45 || code === 48) return 'fog';
    if (code === 3 || cover >= 88) return 'overcast';
    if (code === 2 || cover >= 55) return 'cloudy';
    if (code === 1 || cover >= 20) return 'partly';
    return 'clear';
  }

  const LABELS = {
    clear: 'clear skies', partly: 'a few clouds', cloudy: 'cloudy', overcast: 'overcast',
    fog: 'foggy', drizzle: 'drizzly', rain: 'rainy', snow: 'snowy', storm: 'stormy'
  };
  const DEFAULT_COVER = { clear: 5, partly: 35, cloudy: 70, overcast: 100, fog: 95, drizzle: 95, rain: 100, snow: 95, storm: 100 };

  // Minutes since midnight at the visitor's location.
  function minutesNow(offsetSeconds) {
    if (Number.isFinite(offsetSeconds)) {
      const d = new Date(Date.now() + offsetSeconds * 1000);
      return d.getUTCHours() * 60 + d.getUTCMinutes();
    }
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }

  function clockMinutes(iso) {
    const m = String(iso || '').match(/T(\d{2}):(\d{2})/);
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  }

  function periodOf(now, rise, set) {
    if (now >= rise - 40 && now < rise + 50) return 'dawn';
    if (now >= rise + 50 && now < set - 50) return 'day';
    if (now >= set - 50 && now < set + 40) return 'dusk';
    return 'night';
  }

  // 0 = new moon, 0.5 = full moon.
  function moonPhase(date = new Date()) {
    const synodic = 29.530588853;
    const knownNew = Date.UTC(2000, 0, 6, 18, 14);
    const days = (date.getTime() - knownNew) / 86400000;
    return ((days % synodic) + synodic) % synodic / synodic;
  }

  function moonPath(phase) {
    const r = 46;
    const k = Math.cos(phase * 2 * Math.PI);
    const rx = Math.abs(k) * r;
    if (phase < 0.5) {
      const sweep = k > 0 ? 0 : 1;
      return `M50 ${50 - r} A${r} ${r} 0 0 1 50 ${50 + r} A${rx.toFixed(2)} ${r} 0 0 ${sweep} 50 ${50 - r}Z`;
    }
    const sweep = k > 0 ? 1 : 0;
    return `M50 ${50 - r} A${r} ${r} 0 0 0 50 ${50 + r} A${rx.toFixed(2)} ${r} 0 0 ${sweep} 50 ${50 - r}Z`;
  }

  // Position along an arc across the window: progress 0..1 left to right.
  function arcPosition(progress) {
    const p = clamp(progress, 0, 1);
    return { x: 10 + p * 80, y: 60 - Math.sin(Math.PI * p) * 46 };
  }

  let cloudSignature = '';
  function buildClouds(count, wind) {
    const signature = `${count}|${Math.round(wind / 5)}`;
    if (!cloudsEl || signature === cloudSignature) return;
    cloudSignature = signature;
    cloudsEl.textContent = '';
    const speed = clamp(95 - wind * 2.2, 28, 95); // seconds to cross the window
    for (let i = 0; i < count; i += 1) {
      const track = document.createElement('div');
      track.className = 'cloud-track';
      track.style.top = `${rand(2, 46)}%`;
      const duration = speed * rand(0.8, 1.25);
      track.style.animationDuration = `${duration.toFixed(1)}s`;
      track.style.animationDelay = `${(-rand(0, duration)).toFixed(1)}s`;
      const puff = document.createElement('i');
      puff.className = 'puff';
      puff.style.setProperty('--s', rand(0.65, 1.35).toFixed(2));
      puff.style.opacity = rand(0.82, 1).toFixed(2);
      track.appendChild(puff);
      cloudsEl.appendChild(track);
    }
  }

  let dropsOn = false;
  function setDrops(on, heavy) {
    if (!glass || on === dropsOn) return;
    dropsOn = on;
    glass.textContent = '';
    if (!on) return;
    const count = heavy ? 22 : 13;
    for (let i = 0; i < count; i += 1) {
      const drop = document.createElement('i');
      drop.className = 'drop';
      drop.style.left = `${rand(2, 97)}%`;
      drop.style.top = `${rand(0, 80)}%`;
      drop.style.setProperty('--size', rand(0.7, 1.8).toFixed(2));
      if (!reduceMotion && Math.random() < 0.55) {
        drop.classList.add('slide');
        drop.style.animationDuration = `${rand(5, 12).toFixed(1)}s`;
        drop.style.animationDelay = `${(-rand(0, 12)).toFixed(1)}s`;
      }
      glass.appendChild(drop);
    }
  }

  let lightningTimer = 0;
  function setLightning(on) {
    clearTimeout(lightningTimer);
    if (!on || !flash || reduceMotion) return;
    const strike = () => {
      flash.classList.remove('on');
      void flash.offsetWidth;
      flash.classList.add('on');
      lightningTimer = setTimeout(strike, rand(5000, 14000));
    };
    lightningTimer = setTimeout(strike, rand(1500, 5000));
  }

  /* ---------- render ---------- */

  function render() {
    const wx = state.wx;
    let cover = wx ? wx.cover : 15;
    let kind = wx ? kindOf(wx.code, cover) : 'clear';
    let precip = wx ? wx.precip : 0;
    if (forcedWeather && LABELS[forcedWeather]) {
      kind = forcedWeather;
      cover = DEFAULT_COVER[kind];
      precip = { drizzle: 0.3, rain: 2.5, storm: 6 }[kind] || 0;
    }

    const rise = clockMinutes(wx?.sunrise) ?? 6 * 60 + 45;
    const set = clockMinutes(wx?.sunset) ?? 18 * 60 + 15;
    let now = minutesNow(wx?.offset);
    if (forcedTime) {
      now = { dawn: rise + 5, day: Math.round((rise + set) / 2), dusk: set - 5, night: (set + 24 * 60 + rise) / 2 % (24 * 60) }[forcedTime] ?? now;
    }
    const time = periodOf(now, rise, set);

    outside.dataset.time = time;
    outside.dataset.weather = kind;
    document.body.dataset.sky = time;
    document.body.dataset.weather = kind;

    const c = cover / 100;
    outside.style.setProperty('--cover', c.toFixed(2));

    // sun by day, moon by night (both ride an arc across the glass)
    const sunUp = now >= rise - 20 && now <= set + 20;
    if (sunUp) {
      const pos = arcPosition((now - rise) / Math.max(1, set - rise));
      outside.style.setProperty('--sun-x', `${pos.x.toFixed(1)}%`);
      outside.style.setProperty('--sun-y', `${pos.y.toFixed(1)}%`);
    }
    const nightLength = 24 * 60 - (set - rise);
    const sinceSet = (now - set + 24 * 60) % (24 * 60);
    const moonPos = arcPosition(sinceSet / Math.max(1, nightLength));
    outside.style.setProperty('--moon-x', `${moonPos.x.toFixed(1)}%`);
    outside.style.setProperty('--moon-y', `${moonPos.y.toFixed(1)}%`);
    outside.style.setProperty('--sun-up', sunUp ? '1' : '0');
    outside.style.setProperty('--moon-up', time === 'night' ? '1' : time === 'day' ? '0' : '0.45');
    if (moonLit) moonLit.setAttribute('d', moonPath(moonPhase()));

    // clouds: more of them as cloud cover rises
    const wet = ['drizzle', 'rain', 'storm', 'snow'].includes(kind);
    const count = kind === 'clear' ? 1 : Math.round(2 + c * 6) + (wet ? 2 : 0);
    buildClouds(count, wx ? wx.wind : 8);

    // precipitation strength
    const rainStrength = kind === 'storm' ? 0.95
      : kind === 'rain' ? clamp(0.55 + precip * 0.08, 0.55, 0.92)
      : kind === 'drizzle' ? 0.38 : 0;
    outside.style.setProperty('--rain-o', rainStrength.toFixed(2));
    outside.style.setProperty('--snow-o', kind === 'snow' ? '0.95' : '0');
    outside.style.setProperty('--fog-o', kind === 'fog' ? '0.85' : kind === 'drizzle' || kind === 'rain' ? '0.3' : '0');

    setDrops(['drizzle', 'rain', 'storm'].includes(kind), kind !== 'drizzle');
    setLightning(kind === 'storm');

    // a little daylight spills into the room during the day
    const daylight = time === 'day' ? 1 : time === 'night' ? 0 : 0.5;
    document.documentElement.style.setProperty('--daylight', (daylight * (1 - c * 0.55)).toFixed(2));

    // describe the view for the window hotspot + room.js
    const temp = wx && Number.isFinite(wx.temp) && !forcedWeather ? `${Math.round(wx.temp)}°${wx.unit}` : '';
    const city = !forcedWeather && state.loc?.city ? state.loc.city.toLowerCase() : '';
    const summary = [LABELS[kind], temp].filter(Boolean).join(', ') + (city ? ` in ${city}` : '');
    window.skyInfo = { time, kind, cover, temp, city, summary, live: Boolean(wx) || Boolean(forcedWeather) };
    if (windowButton) {
      windowButton.dataset.tip = summary;
      windowButton.setAttribute('aria-label', `Look out the window: ${summary}`);
    }
    document.dispatchEvent(new CustomEvent('sky:update', { detail: window.skyInfo }));
  }

  async function refresh() {
    try {
      state.loc = state.loc || await locate();
      if (state.loc) state.wx = await loadWeather(state.loc);
    } catch (error) {
      console.warn('Live window weather is unavailable right now.', error);
    }
    render();
  }

  // Draw straight away from cache (or a clear sky), then go live.
  state.loc = readCache(LOC_KEY, LOC_MAX_AGE);
  state.wx = readCache(WX_KEY, WX_MAX_AGE);
  render();
  if (!forcedWeather || !forcedTime) refresh();
  setInterval(render, 60 * 1000);
  setInterval(refresh, WX_MAX_AGE);
})();
