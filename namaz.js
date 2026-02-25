/**
 * namaz.js — Азан: точное расписание 5 намазов по геолокации
 * Метод: Muslim World League (Фаджр 18°, Иша 17°, Аср по Шафии)
 * Только 5 намазов: Фаджр, Зухр, Аср, Магриб, Иша
 */

"use strict";

const RAD = Math.PI / 180;

/* Только 5 намазов — без восхода */
const PRAYER_META = [
  { key: 'fajr',    ru: 'Фаджр',  ar: 'الفجر',  icon: 'fa-moon'       },
  { key: 'dhuhr',   ru: 'Зухр',   ar: 'الظهر',  icon: 'fa-sun'        },
  { key: 'asr',     ru: 'Аср',    ar: 'العصر',  icon: 'fa-cloud-sun'  },
  { key: 'maghrib', ru: 'Магриб', ar: 'المغرب', icon: 'fa-cloud-moon' },
  { key: 'isha',    ru: 'Иша',    ar: 'العشاء', icon: 'fa-star'       },
];

const SALAH_KEYS = PRAYER_META.map(p => p.key);

let countdownInterval = null;

/* =============================================
   АСТРОНОМИЧЕСКИЙ РАСЧЁТ
   ============================================= */

function julianDay(date) {
  /* Полуночный UTC Julian day */
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  return d.getTime() / 86400000 + 2440587.5;
}

function sunParams(jd) {
  const D  = jd - 2451545.0;
  const g  = (357.529 + 0.98560028 * D) % 360;
  const q  = (280.459 + 0.98564736 * D) % 360;
  const L  = (q + 1.915 * Math.sin(g * RAD) + 0.020 * Math.sin(2 * g * RAD)) % 360;
  const e  = 23.439 - 0.00000036 * D;
  const sinL = Math.sin(L * RAD);
  const cosL = Math.cos(L * RAD);
  const cosE = Math.cos(e * RAD);
  const sinE = Math.sin(e * RAD);
  const RA  = Math.atan2(cosE * sinL, cosL) / RAD / 15;   // hours
  const dec = Math.asin(sinE * sinL) / RAD;                // degrees
  const eqT = q / 15 - ((RA % 24) + 24) % 24;             // equation of time (hours)
  return { dec, eqT };
}

/** Солнечный полдень в UTC (часах) для данного jd и долготы */
function solarNoonUTC(jd, lng) {
  const { eqT } = sunParams(jd);
  return 12 - lng / 15 - eqT;
}

/** Часовой угол (часы) для заданного угла высоты над горизонтом */
function hourAngle(lat, dec, elevDeg) {
  const cosH = (Math.sin(elevDeg * RAD) - Math.sin(lat * RAD) * Math.sin(dec * RAD))
               / (Math.cos(lat * RAD) * Math.cos(dec * RAD));
  if (cosH < -1 || cosH > 1) return null; // полярный день/ночь
  return Math.acos(cosH) / RAD / 15;
}

/** Угол высоты солнца для Аср (тень = 1 × высота предмета) — метод Шафии */
function asrElevAngle(lat, dec) {
  return Math.atan(1 / (1 + Math.tan(Math.abs(lat - dec) * RAD))) / RAD;
}

/** Конвертируем UTC-часы → JS Date */
function utcHoursToDate(utcH, localDate) {
  if (utcH === null || !isFinite(utcH)) return null;
  const h = ((utcH % 24) + 24) % 24;
  const d = new Date(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate()));
  d.setTime(d.getTime() + Math.round(h * 3600000));
  return d;
}

/** Форматируем Date → "ЧЧ:ММ" по локальному времени пользователя */
function fmtTime(dt) {
  if (!dt) return '--:--';
  return dt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Рассчитываем 5 намазов для заданной даты и координат.
 * Возвращает { fajr, dhuhr, asr, maghrib, isha }
 * Каждый: { date: Date, str: "ЧЧ:ММ" }
 */
function calcPrayerTimes(lat, lng, date) {
  const jd   = julianDay(date);
  const { dec } = sunParams(jd);
  const noon = solarNoonUTC(jd, lng); // UTC часы солнечного полдня

  const haFajr    = hourAngle(lat, dec, -18);      // MWL: 18° ниже горизонта
  const haSunrise = hourAngle(lat, dec, -0.8333);  // восход (для Магриба = закат)
  const haAsr     = hourAngle(lat, dec, asrElevAngle(lat, dec));
  const haIsha    = hourAngle(lat, dec, -17);      // MWL: 17° ниже горизонта

  const utc = {
    fajr:    haFajr    != null ? noon - haFajr    : null,
    dhuhr:   noon + 1/60, // +1 мин после истинного полдня (согласно фикху)
    asr:     haAsr     != null ? noon + haAsr     : null,
    maghrib: haSunrise != null ? noon + haSunrise + 2/60 : null, // +2 мин после заката
    isha:    haIsha    != null ? noon + haIsha    : null,
  };

  const result = {};
  for (const [key, utcH] of Object.entries(utc)) {
    const dt = utcHoursToDate(utcH, date);
    result[key] = { date: dt, str: fmtTime(dt) };
  }
  return result;
}

/* =============================================
   ХИДЖРИЙСКАЯ ДАТА
   ============================================= */
const HIJRI_MONTHS = [
  'Мухаррам','Сафар','Раби аль-авваль','Раби ас-сани',
  'Джумада аль-авваль','Джумада ас-сани','Раджаб','Шаабан',
  'Рамадан','Шавваль','Зуль-каада','Зуль-хиджа'
];

function toHijri(date) {
  const jd = Math.floor(date.getTime() / 86400000 + 2440587.5);
  const l  = jd - 1948440 + 10632;
  const n  = Math.floor((l - 1) / 10631);
  const a  = l - 10631 * n + 354;
  const j  = Math.floor((10985 - a) / 5316) * Math.floor(50 * a / 17719)
            + Math.floor(a / 5670) * Math.floor(43 * a / 15238);
  const b  = a - Math.floor((30 - j) / 15) * Math.floor(17719 * j / 50)
            - Math.floor(j / 16) * Math.floor(15238 * j / 43) + 29;
  const hM = Math.floor(24 * b / 709);
  const hD = b - Math.floor(709 * hM / 24);
  const hY = 30 * n + j - 30;
  return `${hD} ${HIJRI_MONTHS[(hM - 1 + 12) % 12]} ${hY} г.х.`;
}

/* =============================================
   ГЕОКОДИРОВАНИЕ (название города)
   ============================================= */
async function getCityName(lat, lng) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ru`,
      { headers: { 'User-Agent': 'HunafaPortal/1.0' } }
    );
    if (!r.ok) throw new Error();
    const d = await r.json();
    const city    = d.address?.city || d.address?.town || d.address?.village || d.address?.county || '';
    const country = d.address?.country || '';
    return { city: city || 'Ваше местоположение', country };
  } catch {
    return { city: 'Ваше местоположение', country: '' };
  }
}

/* =============================================
   ОТРИСОВКА UI
   ============================================= */
function renderAzan(times, city, country) {
  const now = new Date();

  /* Локация */
  const locName = document.getElementById('location-name');
  const locSub  = document.getElementById('location-sub');
  if (locName) locName.textContent = city;
  if (locSub)  locSub.textContent  = country || 'Геолокация активна';

  /* Дата */
  const strip = document.getElementById('azan-date-strip');
  if (strip) {
    const greg = now.toLocaleDateString('ru-RU', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    strip.innerHTML = `
      <div class="azan-hijri">${toHijri(now)}</div>
      <div class="azan-gregorian">${greg}</div>
    `;
  }

  /* Текущий и следующий намаз */
  let activePrayer = null;
  let nextPrayer   = null;

  for (let i = 0; i < SALAH_KEYS.length; i++) {
    const key  = SALAH_KEYS[i];
    const t    = times[key]?.date;
    if (!t) continue;
    const nextT = times[SALAH_KEYS[i + 1]]?.date;

    if (now >= t && (!nextT || now < nextT)) {
      activePrayer = key;
      nextPrayer   = SALAH_KEYS[i + 1] ?? SALAH_KEYS[0];
      break;
    }
    if (now < t && !nextPrayer) {
      nextPrayer = key;
    }
  }

  /* Карточки */
  const grid = document.getElementById('prayer-grid');
  if (!grid) return;

  grid.innerHTML = PRAYER_META.map(({ key, ru, ar, icon }) => {
    const isActive = key === activePrayer;
    const isNext   = key === nextPrayer && !isActive;
    const tDate    = times[key]?.date;
    const isPassed = tDate && now > tDate && !isActive && !isNext;

    let cls = 'prayer-card';
    if (isActive) cls += ' is-active';
    if (isNext)   cls += ' is-next';
    if (isPassed) cls += ' is-passed';

    const badge = isActive
      ? '<span class="prayer-badge badge-now">Сейчас</span>'
      : isNext
      ? '<span class="prayer-badge badge-next">Далее</span>'
      : '';

    return `
      <div class="${cls}">
        ${badge}
        <div class="prayer-icon-wrap"><i class="fa-solid ${icon}"></i></div>
        <div class="prayer-ru">${ru}</div>
        <div class="prayer-ar">${ar}</div>
        <div class="prayer-time-display">${times[key]?.str ?? '--:--'}</div>
      </div>
    `;
  }).join('');

  /* Обратный отсчёт */
  const countdown = document.getElementById('azan-countdown');
  if (countdown) countdown.style.opacity = '1';
  if (nextPrayer) startCountdown(times, nextPrayer);
}

/* =============================================
   ОБРАТНЫЙ ОТСЧЁТ
   ============================================= */
function startCountdown(times, nextKey) {
  if (countdownInterval) clearInterval(countdownInterval);

  const wrap    = document.getElementById('azan-countdown');
  const nameEl  = wrap?.querySelector('.countdown-name');
  const timerEl = wrap?.querySelector('.countdown-timer');
  const fillEl  = wrap?.querySelector('.countdown-progress-fill');
  if (!wrap) return;

  const meta = PRAYER_META.find(m => m.key === nextKey);
  if (nameEl && meta) nameEl.textContent = meta.ru;

  const idx     = SALAH_KEYS.indexOf(nextKey);
  const prevKey = idx > 0 ? SALAH_KEYS[idx - 1] : null;

  function tick() {
    const now = new Date();
    const baseTarget = times[nextKey]?.date;
    if (!baseTarget) return;

    const target = baseTarget > now
      ? baseTarget
      : new Date(baseTarget.getTime() + 24 * 60 * 60 * 1000);

    const diff = Math.max(0, Math.floor((target - now) / 1000));
    if (diff === 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      requestLocation();
      return;
    }
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    const p = n => String(n).padStart(2, '0');

    if (timerEl) {
      timerEl.textContent = h > 0
        ? `${p(h)}:${p(m)}:${p(s)}`
        : `${p(m)}:${p(s)}`;
    }

    if (fillEl) {
      if (prevKey) {
        const prev = times[prevKey]?.date;
        if (prev) {
          const span = Math.max(1, (target - prev) / 1000);
          const elapsed = Math.max(0, (now - prev) / 1000);
          fillEl.style.width = `${Math.min(100, elapsed / span * 100).toFixed(1)}%`;
        }
      } else {
        fillEl.style.width = '0%';
      }
    }
  }

  tick();
  countdownInterval = setInterval(tick, 1000);
}

/* =============================================
   ГЕОЛОКАЦИЯ
   ============================================= */
async function requestLocation() {
  showLoading();

  if (!navigator.geolocation) {
    showError('Геолокация не поддерживается браузером.');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async ({ coords: { latitude: lat, longitude: lng } }) => {
      try {
        const times = calcPrayerTimes(lat, lng, new Date());
        const { city, country } = await getCityName(lat, lng);
        renderAzan(times, city, country);
      } catch (e) {
        console.error(e);
        showError('Ошибка расчёта времён намаза.');
      }
    },
    (err) => {
      const msg = {
        1: 'Доступ к геолокации запрещён. Разрешите в настройках браузера.',
        2: 'Позиционирование недоступно.',
        3: 'Время ожидания истекло.',
      }[err.code] || 'Не удалось получить местоположение.';
      showError(msg);
    },
    { timeout: 12000, enableHighAccuracy: false, maximumAge: 300000 }
  );
}

function showLoading() {
  const grid = document.getElementById('prayer-grid');
  if (grid) grid.innerHTML = `
    <div class="azan-loading">
      <i class="fa-solid fa-circle-notch fa-spin"></i>
      <p>Определяем ваше местоположение…</p>
    </div>
  `;
  const cd = document.getElementById('azan-countdown');
  if (cd) cd.style.opacity = '0.4';
  const locName = document.getElementById('location-name');
  const locSub  = document.getElementById('location-sub');
  if (locName) locName.textContent = 'Определение…';
  if (locSub)  locSub.textContent  = 'Пожалуйста, разрешите доступ к геолокации';
}

function showError(msg) {
  const grid = document.getElementById('prayer-grid');
  if (grid) grid.innerHTML = `
    <div class="azan-error">
      <i class="fa-solid fa-location-crosshairs"></i>
      <p style="margin-bottom:18px;max-width:340px;margin-left:auto;margin-right:auto;">${msg}</p>
      <button id="azan-retry-btn" style="
        background:transparent;border:1px solid var(--border2);color:var(--text-dim);
        font-family:var(--font-body);font-size:0.82rem;padding:9px 20px;
        border-radius:100px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;">
        <i class="fa-solid fa-rotate-right"></i> Попробовать снова
      </button>
    </div>
  `;
  document.getElementById('azan-retry-btn')?.addEventListener('click', requestLocation);
  const cd = document.getElementById('azan-countdown');
  if (cd) cd.style.opacity = '0.4';
}

function initAzan() {
  document.getElementById('azan-loc-btn')?.addEventListener('click', requestLocation);
  requestLocation();
}

document.addEventListener('DOMContentLoaded', initAzan);
