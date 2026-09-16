/* ========== clock ========== */
const dateFmt = new Intl.DateTimeFormat('zh-TW', {
  year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
});
const timeFmt = new Intl.DateTimeFormat('zh-TW', {
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
});
const hhmmFmt = new Intl.DateTimeFormat('zh-TW', {
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
});

function startClock() {
  const dateEl = document.getElementById('date');
  const timeEl = document.getElementById('time');
  function tick() {
    const now = new Date();
    dateEl.textContent = dateFmt.format(now);
    timeEl.textContent = timeFmt.format(now);
    dateEl.dateTime = now.toISOString().slice(0, 10);
    timeEl.dateTime = now.toTimeString().slice(0, 8);
  }
  tick();
  setInterval(tick, 1000);
}

/* ========== locations ========== */
const TAIWAN_CITIES = [
  { name: '臺北市', lat: 25.0375, lon: 121.5637 },
  { name: '新北市', lat: 25.0118, lon: 121.4657 },
  { name: '桃園市', lat: 24.9929, lon: 121.3010 },
  { name: '臺中市', lat: 24.1617, lon: 120.6469 },
  { name: '臺南市', lat: 22.9917, lon: 120.1848 },
  { name: '高雄市', lat: 22.6203, lon: 120.3120 },
  { name: '基隆市', lat: 25.1276, lon: 121.7392 },
  { name: '新竹市', lat: 24.8138, lon: 120.9675 },
  { name: '嘉義市', lat: 23.4801, lon: 120.4491 },
  { name: '新竹縣', lat: 24.8387, lon: 121.0177 },
  { name: '苗栗縣', lat: 24.5602, lon: 120.8214 },
  { name: '彰化縣', lat: 24.0518, lon: 120.5161 },
  { name: '南投縣', lat: 23.9609, lon: 120.9719 },
  { name: '雲林縣', lat: 23.7092, lon: 120.4313 },
  { name: '嘉義縣', lat: 23.4518, lon: 120.2555 },
  { name: '屏東縣', lat: 22.6760, lon: 120.4942 },
  { name: '宜蘭縣', lat: 24.7570, lon: 121.7530 },
  { name: '花蓮縣', lat: 23.9910, lon: 121.6011 },
  { name: '臺東縣', lat: 22.7583, lon: 121.1444 },
  { name: '澎湖縣', lat: 23.5654, lon: 119.5863 },
  { name: '金門縣', lat: 24.4365, lon: 118.3186 },
  { name: '連江縣', lat: 26.1600, lon: 119.9500 },
];
const DEFAULT_CITY = TAIWAN_CITIES.find((c) => c.name === '臺中市');
const STORAGE_KEY = 'portal.location';

function loadLocation() {
  try {
    const loc = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (loc && typeof loc.name === 'string' && Number.isFinite(loc.lat) && Number.isFinite(loc.lon)) {
      return loc;
    }
  } catch { /* 損壞或不可用時視為未設定 */ }
  return null;
}

function saveLocation(loc) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  } catch { /* 隱私模式等情況下略過 */ }
}

/* ========== geo ========== */
function locateUser() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('geolocation unsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(err),
      { timeout: 8000, maximumAge: 600000 }
    );
  });
}

async function reverseGeocode(lat, lon) {
  try {
    const url = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
    url.searchParams.set('latitude', lat);
    url.searchParams.set('longitude', lon);
    url.searchParams.set('localityLanguage', 'zh-Hant');
    const res = await fetch(url);
    if (!res.ok) throw new Error(`reverse geocode ${res.status}`);
    const data = await res.json();
    return data.principalSubdivision || data.city || '目前位置';
  } catch {
    return '目前位置';
  }
}

/* ========== weather ========== */
async function fetchWeather(lat, lon) {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lon);
  url.searchParams.set('current', [
    'temperature_2m', 'apparent_temperature', 'relative_humidity_2m',
    'wind_speed_10m', 'precipitation_probability', 'weather_code', 'is_day'
  ].join(','));
  url.searchParams.set('timezone', 'auto');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`weather ${res.status}`);
  const { current: c } = await res.json();
  return {
    temp: c.temperature_2m,
    feels: c.apparent_temperature,
    humidity: c.relative_humidity_2m,
    wind: c.wind_speed_10m,
    rain: c.precipitation_probability,
    code: c.weather_code,
    isDay: c.is_day === 1,
    time: new Date(),
  };
}

const WMO = [
  { codes: [0], label: '晴朗', day: '☀️', night: '🌙' },
  { codes: [1], label: '大致晴朗', day: '🌤️', night: '🌙' },
  { codes: [2], label: '局部多雲', day: '⛅', night: '☁️' },
  { codes: [3], label: '陰天', day: '☁️', night: '☁️' },
  { codes: [45, 48], label: '霧', day: '🌫️', night: '🌫️' },
  { codes: [51, 53, 55], label: '毛毛雨', day: '🌦️', night: '🌦️', wet: true },
  { codes: [56, 57, 66, 67], label: '凍雨', day: '🌧️', night: '🌧️', wet: true },
  { codes: [61], label: '小雨', day: '🌧️', night: '🌧️', wet: true },
  { codes: [63], label: '中雨', day: '🌧️', night: '🌧️', wet: true },
  { codes: [65], label: '大雨', day: '🌧️', night: '🌧️', wet: true },
  { codes: [71, 73, 75, 77], label: '降雪', day: '🌨️', night: '🌨️', wet: true },
  { codes: [80, 81, 82], label: '陣雨', day: '🌦️', night: '🌦️', wet: true },
  { codes: [85, 86], label: '陣雪', day: '🌨️', night: '🌨️', wet: true },
  { codes: [95], label: '雷雨', day: '⛈️', night: '⛈️', wet: true },
  { codes: [96, 99], label: '雷雨伴冰雹', day: '⛈️', night: '⛈️', wet: true },
];

function describe(code, isDay) {
  const entry = WMO.find((e) => e.codes.includes(code));
  if (!entry) return { label: '未知', icon: '❔', theme: isDay ? 'day-cloudy' : 'night' };
  let theme;
  if (entry.wet) theme = 'rain';
  else if (!isDay) theme = 'night';
  else theme = code <= 1 ? 'day-clear' : 'day-cloudy';
  return { label: entry.label, icon: isDay ? entry.day : entry.night, theme };
}

function themeByClock() {
  const h = new Date().getHours();
  return h >= 6 && h < 18 ? 'day-clear' : 'night';
}

/* ========== ui ========== */
const $ = (id) => document.getElementById(id);
const els = {
  card: $('weather'),
  locationBtn: $('locationBtn'),
  locationName: $('locationName'),
  icon: $('wIcon'),
  temp: $('wTemp'),
  label: $('wLabel'),
  feels: $('wFeels'),
  humidity: $('wHumidity'),
  wind: $('wWind'),
  rain: $('wRain'),
  updated: $('wUpdated'),
  refreshBtn: $('refreshBtn'),
  retryBtn: $('retryBtn'),
  hint: $('hint'),
  backdrop: $('backdrop'),
  dialog: $('locationDialog'),
  closeDialogBtn: $('closeDialogBtn'),
  useGeoBtn: $('useGeoBtn'),
  geoError: $('geoError'),
  cityGrid: $('cityGrid'),
};

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

function renderLocation(name) {
  els.locationName.textContent = name;
  for (const btn of els.cityGrid.children) {
    btn.classList.toggle('active', btn.textContent === name);
  }
}

function renderWeather(w) {
  const d = describe(w.code, w.isDay);
  els.icon.textContent = d.icon;
  els.temp.textContent = `${Math.round(w.temp)}°`;
  els.label.textContent = d.label;
  els.feels.textContent = `體感 ${Math.round(w.feels)}°`;
  els.humidity.textContent = `${w.humidity}%`;
  els.wind.textContent = `${Math.round(w.wind)} km/h`;
  els.rain.textContent = `${w.rain}%`;
  els.updated.textContent = `更新於 ${hhmmFmt.format(w.time)}`;
  els.card.querySelectorAll('.skeleton').forEach((el) => el.classList.remove('skeleton'));
  setTheme(d.theme);
}

function setCardState(state) {
  els.card.dataset.state = state;
  els.refreshBtn.classList.toggle('spinning', state === 'loading');
}

function setFooterNote(text) {
  els.updated.textContent = text;
}

function showHint(text) {
  els.hint.textContent = text || '';
  els.hint.hidden = !text;
}

function openDialog() {
  els.geoError.hidden = true;
  els.backdrop.hidden = false;
  els.dialog.hidden = false;
  els.locationBtn.setAttribute('aria-expanded', 'true');
  els.dialog.focus();
}

function closeDialog() {
  if (els.dialog.hidden) return;
  els.backdrop.hidden = true;
  els.dialog.hidden = true;
  els.locationBtn.setAttribute('aria-expanded', 'false');
  els.locationBtn.focus();
}

function renderCityGrid(onPick) {
  for (const city of TAIWAN_CITIES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'city';
    btn.textContent = city.name;
    btn.addEventListener('click', () => onPick(city));
    els.cityGrid.appendChild(btn);
  }
}

/* ========== main ========== */
const state = { location: null, weather: null };

async function refresh() {
  if (!state.location) return;
  setCardState('loading');
  try {
    state.weather = await fetchWeather(state.location.lat, state.location.lon);
    renderWeather(state.weather);
    setCardState('ready');
  } catch (err) {
    console.error(err);
    if (state.weather) {
      setCardState('ready');
      setFooterNote('更新失敗，顯示上次資料');
    } else {
      setCardState('error');
    }
  }
}

function useLocation(loc, { save }) {
  state.location = loc;
  renderLocation(loc.name);
  if (save) saveLocation(loc);
  refresh();
}

async function locateAndUse() {
  const { lat, lon } = await locateUser();
  const name = await reverseGeocode(lat, lon);
  useLocation({ name, lat, lon }, { save: true });
}

async function init() {
  setTheme(themeByClock());
  startClock();
  renderCityGrid((city) => {
    closeDialog();
    showHint(null);
    useLocation(city, { save: true });
  });

  els.locationBtn.addEventListener('click', openDialog);
  els.closeDialogBtn.addEventListener('click', closeDialog);
  els.backdrop.addEventListener('click', closeDialog);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDialog(); });
  els.refreshBtn.addEventListener('click', refresh);
  els.retryBtn.addEventListener('click', refresh);
  els.useGeoBtn.addEventListener('click', async () => {
    els.geoError.hidden = true;
    els.useGeoBtn.disabled = true;
    try {
      await locateAndUse();
      showHint(null);
      closeDialog();
    } catch (err) {
      console.error(err);
      els.geoError.textContent = '無法取得位置，請確認已允許定位權限';
      els.geoError.hidden = false;
    } finally {
      els.useGeoBtn.disabled = false;
    }
  });

  setInterval(refresh, 600000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refresh();
  });

  const saved = loadLocation();
  if (saved) {
    useLocation(saved, { save: false });
    return;
  }
  try {
    await locateAndUse();
  } catch (err) {
    console.error(err);
    useLocation(DEFAULT_CITY, { save: false });
    showHint('已使用預設地區，可允許定位或手動選擇縣市');
  }
}

init();
