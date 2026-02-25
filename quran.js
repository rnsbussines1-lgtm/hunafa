/**
 * quran.js — Читалка Корана
 * Структура JSON: { id, name, transliteration, translation, type, total_verses, verses: [{id, text, translation}] }
 */

"use strict";

/* Русские названия 114 сур (без эмодзи) */
const SURAH_NAMES_RU = [
  "Аль-Фатиха — Открывающая",
  "Аль-Бакара — Корова",
  "Аль Имран — Семейство Имрана",
  "Ан-Ниса — Женщины",
  "Аль-Маида — Трапеза",
  "Аль-Ан'ам — Скот",
  "Аль-А'раф — Преграды",
  "Аль-Анфаль — Добыча",
  "Ат-Тауба — Покаяние",
  "Юнус — Иона",
  "Худ — Худ",
  "Юсуф — Иосиф",
  "Ар-Ра'д — Гром",
  "Ибрахим — Авраам",
  "Аль-Хиджр — Хиджр",
  "Ан-Нахль — Пчёлы",
  "Аль-Исра — Ночной перенос",
  "Аль-Кахф — Пещера",
  "Марьям — Мария",
  "Та Ха — Та Ха",
  "Аль-Анбия — Пророки",
  "Аль-Хадж — Паломничество",
  "Аль-Му'минун — Верующие",
  "Ан-Нур — Свет",
  "Аль-Фуркан — Различение",
  "Аш-Шу'ара — Поэты",
  "Ан-Намль — Муравьи",
  "Аль-Касас — Рассказ",
  "Аль-'Анкабут — Паук",
  "Ар-Рум — Римляне",
  "Лукман — Лукман",
  "Ас-Саджда — Поклон",
  "Аль-Ахзаб — Союзники",
  "Саба — Сава",
  "Фатыр — Творец",
  "Йа Син — Йа Син",
  "Ас-Саффат — Выстроившиеся в ряд",
  "Сад — Сад",
  "Аз-Зумар — Толпы",
  "Гафир — Прощающий",
  "Фуссилят — Разъяснённые",
  "Аш-Шура — Совет",
  "Аз-Зухруф — Украшения",
  "Ад-Духан — Дым",
  "Аль-Джасия — Коленопреклонённые",
  "Аль-Ахкаф — Песчаные холмы",
  "Мухаммад — Мухаммад",
  "Аль-Фатх — Победа",
  "Аль-Худжурат — Комнаты",
  "Каф — Каф",
  "Аз-Зарият — Развевающие",
  "Ат-Тур — Гора",
  "Ан-Наджм — Звезда",
  "Аль-Камар — Луна",
  "Ар-Рахман — Милостивый",
  "Аль-Ваки'а — Событие",
  "Аль-Хадид — Железо",
  "Аль-Муджадила — Препирающаяся",
  "Аль-Хашр — Собрание",
  "Аль-Мумтахина — Испытуемая",
  "Ас-Сафф — Ряды",
  "Аль-Джуму'а — Пятница",
  "Аль-Мунафикун — Лицемеры",
  "Ат-Тагабун — Взаимный убыток",
  "Ат-Талак — Развод",
  "Ат-Тахрим — Запрещение",
  "Аль-Мульк — Власть",
  "Аль-Калам — Перо",
  "Аль-Хакка — Неминуемое",
  "Аль-Ма'аридж — Ступени",
  "Нух — Ной",
  "Аль-Джинн — Джинны",
  "Аль-Муззаммиль — Закутавшийся",
  "Аль-Муддассир — Завернувшийся",
  "Аль-Кияма — Воскресение",
  "Аль-Инсан — Человек",
  "Аль-Мурсалят — Посылаемые",
  "Ан-Наба — Весть",
  "Ан-Нази'ат — Вырывающие",
  "'Абаса — Нахмурился",
  "Ат-Таквир — Скручивание",
  "Аль-Инфитар — Раскалывание",
  "Аль-Мутаффифин — Обвешивающие",
  "Аль-Иншикак — Разверзание",
  "Аль-Бурудж — Созвездия",
  "Ат-Тарик — Ночной путник",
  "Аль-А'ля — Всевышний",
  "Аль-Гашия — Покрывающее",
  "Аль-Фаджр — Заря",
  "Аль-Балад — Город",
  "Аш-Шамс — Солнце",
  "Аль-Лейль — Ночь",
  "Ад-Духа — Утро",
  "Аш-Шарх — Раскрытие",
  "Ат-Тин — Смоковница",
  "Аль-'Аляк — Сгусток",
  "Аль-Кадр — Предопределение",
  "Аль-Баййина — Ясное знамение",
  "Аз-Зальзаля — Сотрясение",
  "Аль-'Адият — Мчащиеся",
  "Аль-Кари'а — Поражающее",
  "Ат-Такасур — Страсть к умножению",
  "Аль-'Аср — Время",
  "Аль-Хумаза — Хулитель",
  "Аль-Филь — Слон",
  "Курайш — Курайшиты",
  "Аль-Ма'ун — Мелочь",
  "Аль-Каусар — Изобилие",
  "Аль-Кафирун — Неверующие",
  "Ан-Наср — Помощь",
  "Аль-Масад — Пальмовое волокно",
  "Аль-Ихляс — Искренность",
  "Аль-Фаляк — Рассвет",
  "Ан-Нас — Люди",
];

let quranData = [];
let currentIdx = 0;

async function loadQuran() {
  if (Array.isArray(window.__QURAN_DATA__) && window.__QURAN_DATA__.length > 0) {
    quranData = window.__QURAN_DATA__;
    renderSurahList(quranData);
    openSurah(0);
    return;
  }
  const sources = ['./quran_ru.json', 'quran_ru.json', '../quran_ru.json'];
  let lastError = null;

  const parseAndApply = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Пустой или некорректный JSON');
    }
    quranData = data;
    renderSurahList(quranData);
    openSurah(0);
  };

  const loadByXhr = (path) => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', path, true);
    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 4) return;
      if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 0) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch (e) {
          reject(e);
        }
      } else {
        reject(new Error(`HTTP ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('XHR failed'));
    xhr.send();
  });

  try {
    for (const path of sources) {
      try {
        const res = await fetch(path, { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        parseAndApply(data);
        return;
      } catch (e) {
        lastError = e;
      }
    }

    for (const path of sources) {
      try {
        const data = await loadByXhr(path);
        parseAndApply(data);
        return;
      } catch (e) {
        lastError = e;
      }
    }

    throw lastError ?? new Error('Не удалось загрузить quran_ru.json');
  } catch (e) {
    console.error('Ошибка загрузки Корана:', e);
    const reader = document.getElementById('quran-reader');
    if (reader) reader.innerHTML = `
      <div class="quran-placeholder">
        <i class="fa-solid fa-circle-exclamation"></i>
        <p>Не удалось загрузить данные Корана.<br>Проверьте, что <code>quran_ru.json</code> доступен рядом с <code>index.html</code>.</p>
      </div>
    `;
  }
}

function getSurahDisplayName(surah) {
  /* Берём красивое русское название из нашего массива по индексу (id - 1) */
  return SURAH_NAMES_RU[surah.id - 1] || surah.translation;
}

function renderSurahList(data) {
  const list = document.getElementById('surah-list');
  if (!list) return;

  if (data.length === 0) {
    list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:0.84rem;">Ничего не найдено</div>';
    return;
  }

  list.innerHTML = data.map(surah => {
    const origIdx = quranData.indexOf(surah);
    const displayName = getSurahDisplayName(surah);
    /* Разбиваем «Название — Перевод» */
    const parts = displayName.split(' — ');
    const shortName  = parts[0] || displayName;
    const meaning    = parts[1] || '';
    const typeRu     = surah.type === 'meccan' ? 'Мекк.' : 'Мед.';

    return `
      <div class="surah-item" data-idx="${origIdx}" onclick="openSurah(${origIdx})">
        <div class="surah-num">${surah.id}</div>
        <div class="surah-info">
          <div class="surah-info-name">${shortName}</div>
          <div class="surah-info-sub">${meaning ? meaning + ' · ' : ''}${surah.total_verses} аятов</div>
        </div>
        <div class="surah-ar-name">${surah.name}</div>
      </div>
    `;
  }).join('');

  const sel = list.querySelector(`[data-idx="${currentIdx}"]`);
  if (sel) sel.classList.add('is-selected');
}

function openSurah(idx) {
  if (!quranData[idx]) return;
  currentIdx = idx;
  const surah = quranData[idx];

  document.querySelectorAll('.surah-item').forEach(el => el.classList.remove('is-selected'));
  const active = document.querySelector(`.surah-item[data-idx="${idx}"]`);
  if (active) {
    active.classList.add('is-selected');
    active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  const reader = document.getElementById('quran-reader');
  if (!reader) return;

  const typeClass   = surah.type === 'meccan' ? 'type-meccan' : 'type-medinan';
  const typeRu      = surah.type === 'meccan' ? 'Мекканская' : 'Мединская';
  const displayName = getSurahDisplayName(surah);
  const parts       = displayName.split(' — ');
  const shortName   = parts[0] || displayName;
  const meaning     = parts[1] || surah.translation;

  /* Басмала: кроме 1-й и 9-й сур */
  const showBismillah = surah.id !== 1 && surah.id !== 9;

  reader.innerHTML = `
    <div class="reader-header">
      <div>
        <div class="reader-surah-name">${shortName}</div>
        <div style="font-size:0.88rem;color:var(--text-muted);margin-top:2px;margin-bottom:8px;">${meaning}</div>
        <div class="reader-surah-meta">
          <span class="reader-meta-tag ${typeClass}">${typeRu}</span>
          <span class="reader-meta-tag">${surah.total_verses} аятов</span>
          <span class="reader-meta-tag">${surah.transliteration}</span>
        </div>
      </div>
      <div class="reader-surah-ar">${surah.name}</div>
      <div class="reader-nav">
        <button class="reader-nav-btn" onclick="openSurah(${idx - 1})"
          ${idx === 0 ? 'disabled' : ''} title="Предыдущая сура">
          <i class="fa-solid fa-chevron-up"></i>
        </button>
        <button class="reader-nav-btn" onclick="openSurah(${idx + 1})"
          ${idx === quranData.length - 1 ? 'disabled' : ''} title="Следующая сура">
          <i class="fa-solid fa-chevron-down"></i>
        </button>
      </div>
    </div>
    ${showBismillah ? `
      <div class="bismillah-banner">
        <div class="bismillah-text">بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</div>
      </div>
    ` : ''}
    <div class="verses-container">
      ${surah.verses.map(v => `
        <div class="verse-item">
          <div class="verse-num">${v.id}</div>
          <div class="verse-arabic">${v.text}</div>
          <div class="verse-translation">${v.translation}</div>
        </div>
      `).join('')}
    </div>
  `;

  reader.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initQuranSearch() {
  const input = document.getElementById('quran-search');
  if (!input) return;

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      renderSurahList(quranData);
      return;
    }
    const filtered = quranData.filter((s, i) => {
      const ruName = (SURAH_NAMES_RU[i] || '').toLowerCase();
      return (
        ruName.includes(q) ||
        s.translation.toLowerCase().includes(q) ||
        s.transliteration.toLowerCase().includes(q) ||
        String(s.id).includes(q) ||
        s.name.includes(q)
      );
    });
    renderSurahList(filtered);
  });
}

function initQuran() {
  loadQuran();
  initQuranSearch();
}

document.addEventListener('DOMContentLoaded', initQuran);
