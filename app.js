const TRIP_START = new Date("2026-06-20T14:00:00");
const TRIP_END = new Date("2026-06-27T10:00:00");
const PB_TARGET = 20;

// Supabase
const SUPABASE_URL = "https://baiepgxqnppwokcmmpqw.supabase.co";
const SUPABASE_KEY = "sb_publishable_ziiHPrhOisVJXnUeOdI4ug_b4y4djws";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Łowisko
const FISHING_SPOT = {
  name: "LodgingCarp – La Plaine des Bois 2",
  latitude: 47.621,
  longitude: 2.49
};

// fallback if db empty
const fallbackCatches = [
  {
    person: "Patryk",
    species: "Karp",
    weight: 14.2,
    bait: "Scopex",
    spot: "Spot 3",
    note: null,
    caught_at: "2026-06-21T05:40:00"
  },
  {
    person: "Maciek",
    species: "Karp",
    weight: 11.8,
    bait: "Halibut",
    spot: "Spot 1",
    note: null,
    caught_at: "2026-06-21T22:10:00"
  },
  {
    person: "Patryk",
    species: "Karp",
    weight: 16.7,
    bait: "Scopex",
    spot: "Spot 3",
    note: null,
    caught_at: "2026-06-22T04:55:00"
  }
];

function updateCountdown() {
  const countdownEl = document.getElementById("countdown");
  if (!countdownEl) return;

  const now = new Date();

  if (now < TRIP_START) {
    const diff = TRIP_START - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    countdownEl.innerHTML = `<strong>Do wyjazdu:</strong> ${days} dni, ${hours} godz., ${minutes} min.`;
    return;
  }

  if (now >= TRIP_START && now <= TRIP_END) {
    countdownEl.innerHTML = `<strong>Status:</strong> wyjazd trwa`;
    return;
  }

  countdownEl.innerHTML = `<strong>Status:</strong> wyjazd zakończony`;
}

function setupMobileMenu() {
  const toggleBtn = document.getElementById("menu-toggle");
  const nav = document.getElementById("main-nav");

  if (!toggleBtn || !nav) return;

  toggleBtn.addEventListener("click", () => {
    nav.classList.toggle("open");
    const expanded = nav.classList.contains("open");
    toggleBtn.setAttribute("aria-expanded", expanded ? "true" : "false");
  });
}

function formatCaughtAt(value) {
  if (!value) return "Brak daty";
  const date = new Date(value);
  return date.toLocaleString("pl-PL");
}

function formatHour(value) {
  const date = new Date(value);
  return date.toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatDay(value) {
  const date = new Date(value);
  return date.toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit"
  });
}

function getStats(data) {
  const totalWeight = data.reduce((sum, item) => sum + Number(item.weight || 0), 0);
  const totalFish = data.length;

  const biggestFishItem = data.reduce((max, item) => {
    if (!max || Number(item.weight) > Number(max.weight)) return item;
    return max;
  }, null);

  const bestSpotMap = {};
  data.forEach(item => {
    const spot = item.spot || "Brak";
    bestSpotMap[spot] = (bestSpotMap[spot] || 0) + 1;
  });

  let bestSpot = "Brak danych";
  let bestSpotCount = 0;

  for (const spot in bestSpotMap) {
    if (bestSpotMap[spot] > bestSpotCount) {
      bestSpot = spot;
      bestSpotCount = bestSpotMap[spot];
    }
  }

  return {
    totalWeight,
    totalFish,
    biggestFish: biggestFishItem ? `${Number(biggestFishItem.weight).toFixed(1)} kg` : "Brak danych",
    bestSpot
  };
}

function getPersonStats(data, personName) {
  const personData = data.filter(item => item.person === personName);

  if (personData.length === 0) {
    return {
      biggest: 0,
      total: 0,
      count: 0,
      bestBait: "Brak",
      bestSpot: "Brak"
    };
  }

  const biggest = Math.max(...personData.map(item => Number(item.weight)));
  const total = personData.reduce((sum, item) => sum + Number(item.weight), 0);
  const count = personData.length;

  const baitMap = {};
  const spotMap = {};

  personData.forEach(item => {
    const bait = item.bait || "Brak";
    const spot = item.spot || "Brak";
    baitMap[bait] = (baitMap[bait] || 0) + 1;
    spotMap[spot] = (spotMap[spot] || 0) + 1;
  });

  let bestBait = "Brak";
  let bestBaitCount = 0;

  for (const bait in baitMap) {
    if (baitMap[bait] > bestBaitCount) {
      bestBait = bait;
      bestBaitCount = baitMap[bait];
    }
  }

  let bestSpot = "Brak";
  let bestSpotCount = 0;

  for (const spot in spotMap) {
    if (spotMap[spot] > bestSpotCount) {
      bestSpot = spot;
      bestSpotCount = spotMap[spot];
    }
  }

  return {
    biggest,
    total,
    count,
    bestBait,
    bestSpot
  };
}

function updateDashboard(catches) {
  const totalWeightEl = document.getElementById("total-weight");
  if (!totalWeightEl) return;

  const globalStats = getStats(catches);
  const patrykStats = getPersonStats(catches, "Patryk");
  const maciekStats = getPersonStats(catches, "Maciek");

  document.getElementById("total-weight").textContent = `${globalStats.totalWeight.toFixed(1)} kg`;
  document.getElementById("total-fish").textContent = globalStats.totalFish;
  document.getElementById("biggest-fish").textContent = globalStats.biggestFish;
  document.getElementById("best-spot").textContent = globalStats.bestSpot;

  document.getElementById("patryk-biggest").textContent = `${patrykStats.biggest.toFixed(1)} kg`;
  document.getElementById("patryk-total").textContent = `${patrykStats.total.toFixed(1)} kg`;
  document.getElementById("patryk-count").textContent = patrykStats.count;
  document.getElementById("patryk-bait").textContent = patrykStats.bestBait;
  document.getElementById("patryk-spot").textContent = patrykStats.bestSpot;
  document.getElementById("patryk-pb-text").textContent = `${patrykStats.biggest.toFixed(1)} kg`;
  document.getElementById("patryk-pb-bar").style.width = `${Math.min((patrykStats.biggest / PB_TARGET) * 100, 100)}%`;

  document.getElementById("maciek-biggest").textContent = `${maciekStats.biggest.toFixed(1)} kg`;
  document.getElementById("maciek-total").textContent = `${maciekStats.total.toFixed(1)} kg`;
  document.getElementById("maciek-count").textContent = maciekStats.count;
  document.getElementById("maciek-bait").textContent = maciekStats.bestBait;
  document.getElementById("maciek-spot").textContent = maciekStats.bestSpot;
  document.getElementById("maciek-pb-text").textContent = `${maciekStats.biggest.toFixed(1)} kg`;
  document.getElementById("maciek-pb-bar").style.width = `${Math.min((maciekStats.biggest / PB_TARGET) * 100, 100)}%`;

  const lastEntryBox = document.getElementById("last-entry");
  if (!lastEntryBox) return;

  if (!catches.length) {
    lastEntryBox.innerHTML = `Brak zapisanych połowów.`;
    return;
  }

  const sorted = [...catches].sort((a, b) => new Date(b.caught_at) - new Date(a.caught_at));
  const lastEntry = sorted[0];

  lastEntryBox.innerHTML = `
    <strong>${lastEntry.person}</strong> – ${lastEntry.species}<br>
    Waga: <strong>${Number(lastEntry.weight).toFixed(1)} kg</strong><br>
    Przynęta: ${lastEntry.bait}<br>
    Spot: ${lastEntry.spot}<br>
    Data: ${formatCaughtAt(lastEntry.caught_at)}
  `;
}

async function seedSampleDataIfEmpty() {
  const { count, error } = await supabaseClient
    .from("catches")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Błąd sprawdzania catches:", error);
    return;
  }

  if (count === 0) {
    const { error: insertError } = await supabaseClient
      .from("catches")
      .insert(fallbackCatches);

    if (insertError) {
      console.error("Błąd seedowania catches:", insertError);
    }
  }
}

async function loadCatchesFromSupabase() {
  const { data, error } = await supabaseClient
    .from("catches")
    .select("*")
    .order("caught_at", { ascending: false });

  if (error) {
    console.error("Błąd pobierania catches:", error);
    return fallbackCatches;
  }

  if (!data || data.length === 0) {
    return fallbackCatches;
  }

  return data;
}

function setDefaultCaughtAt() {
  const input = document.getElementById("caught_at");
  if (!input) return;

  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000).toISOString().slice(0, 16);
  input.value = local;
}

function setFormMessage(message, type = "") {
  const box = document.getElementById("form-message");
  if (!box) return;

  box.textContent = message;
  box.className = "form-message";
  if (type) box.classList.add(type);
}

function validateCatchForm(values) {
  if (!values.person) return "Wybierz osobę.";
  if (!values.species.trim()) return "Podaj gatunek.";
  if (!values.weight || Number(values.weight) <= 0) return "Podaj poprawną wagę.";
  if (!values.bait.trim()) return "Podaj przynętę.";
  if (!values.spot.trim()) return "Podaj spot.";
  if (!values.caught_at) return "Podaj datę i godzinę.";
  return null;
}

async function handleCatchSubmit(event) {
  event.preventDefault();

  const values = {
    person: document.getElementById("person")?.value || "",
    species: document.getElementById("species")?.value || "",
    weight: document.getElementById("weight")?.value || "",
    bait: document.getElementById("bait")?.value || "",
    spot: document.getElementById("spot")?.value || "",
    caught_at: document.getElementById("caught_at")?.value || "",
    note: document.getElementById("note")?.value || ""
  };

  const validationError = validateCatchForm(values);
  if (validationError) {
    setFormMessage(validationError, "error");
    return;
  }

  setFormMessage("Zapisywanie połowu...");

  const payload = {
    person: values.person.trim(),
    species: values.species.trim(),
    weight: Number(values.weight),
    bait: values.bait.trim(),
    spot: values.spot.trim(),
    note: values.note.trim() || null,
    caught_at: new Date(values.caught_at).toISOString()
  };

  const { error } = await supabaseClient
    .from("catches")
    .insert([payload]);

  if (error) {
    console.error("Błąd dodawania połowu:", error);
    setFormMessage("Nie udało się dodać połowu.", "error");
    return;
  }

  setFormMessage("Połów został dodany.", "success");
  document.getElementById("catch-form")?.reset();
  setDefaultCaughtAt();
  await renderCatchesPage();
}

async function deleteCatch(id) {
  const confirmed = window.confirm("Usunąć ten połów?");
  if (!confirmed) return;

  const { error } = await supabaseClient
    .from("catches")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Błąd usuwania połowu:", error);
    alert("Nie udało się usunąć połowu.");
    return;
  }

  await renderCatchesPage();
}

function renderCatchSummary(catches) {
  const countEl = document.getElementById("catch-count");
  if (!countEl) return;

  const stats = getStats(catches);
  countEl.textContent = catches.length;
  document.getElementById("catch-total-weight").textContent = `${stats.totalWeight.toFixed(1)} kg`;
  document.getElementById("catch-biggest").textContent = stats.biggestFish;
  document.getElementById("catch-best-spot").textContent = stats.bestSpot;
}

function renderCatchesList(catches) {
  const list = document.getElementById("catches-list");
  if (!list) return;

  if (!catches.length) {
    list.innerHTML = `<div class="empty-box">Brak zapisanych połowów.</div>`;
    return;
  }

  list.innerHTML = catches.map(item => `
    <article class="catch-item">
      <div class="catch-item-top">
        <div>
          <h4>${item.person} — ${item.species}</h4>
          <div class="catch-meta">${formatCaughtAt(item.caught_at)}</div>
        </div>
        <div>
          <button class="danger-btn" onclick="deleteCatch(${item.id})">Usuń</button>
        </div>
      </div>

      <div class="catch-badges">
        <span class="badge">Waga: ${Number(item.weight).toFixed(1)} kg</span>
        <span class="badge">Przynęta: ${item.bait}</span>
        <span class="badge">Spot: ${item.spot}</span>
      </div>

      ${item.note ? `<div class="catch-note">${item.note}</div>` : ""}
    </article>
  `).join("");
}

async function renderCatchesPage() {
  const list = document.getElementById("catches-list");
  if (!list) return;

  list.innerHTML = `<div class="empty-box">Ładowanie połowów...</div>`;
  const catches = await loadCatchesFromSupabase();
  renderCatchSummary(catches);
  renderCatchesList(catches);
}

function bindCatchesPageEvents() {
  const form = document.getElementById("catch-form");
  if (form) {
    form.addEventListener("submit", handleCatchSubmit);
  }

  const refreshBtn = document.getElementById("refresh-catches-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", renderCatchesPage);
  }
}

// CHECKLISTY

function setChecklistMessage(message, type = "") {
  const box = document.getElementById("checklist-message");
  if (!box) return;

  box.textContent = message;
  box.className = "form-message";
  if (type) box.classList.add(type);
}

function validateChecklistForm(values) {
  if (!values.category) return "Wybierz kategorię.";
  if (!values.item_name.trim()) return "Podaj nazwę pozycji.";
  return null;
}

async function handleChecklistSubmit(event) {
  event.preventDefault();

  const values = {
    category: document.getElementById("check-category")?.value || "",
    item_name: document.getElementById("check-name")?.value || "",
    quantity: document.getElementById("check-quantity")?.value || "",
    unit: document.getElementById("check-unit")?.value || "szt."
  };

  const validationError = validateChecklistForm(values);
  if (validationError) {
    setChecklistMessage(validationError, "error");
    return;
  }

  setChecklistMessage("Zapisywanie pozycji...");

  const payload = {
    category: values.category.trim(),
    item_name: values.item_name.trim(),
    quantity: values.quantity ? Number(values.quantity) : null,
    unit: values.unit
  };

  const { error } = await supabaseClient
    .from("checklist_items")
    .insert([payload]);

  if (error) {
    console.error("Błąd dodawania checklisty:", error);
    setChecklistMessage("Nie udało się dodać pozycji.", "error");
    return;
  }

  setChecklistMessage("Pozycja została dodana.", "success");
  document.getElementById("checklist-form")?.reset();
  await renderChecklistPage();
}

async function toggleChecklistItem(id, currentState) {
  const { error } = await supabaseClient
    .from("checklist_items")
    .update({ done: !currentState })
    .eq("id", id);

  if (error) {
    console.error("Błąd zmiany statusu checklisty:", error);
    alert("Nie udało się zmienić statusu.");
    return;
  }

  await renderChecklistPage();
}

async function deleteChecklistItem(id) {
  const confirmed = window.confirm("Usunąć tę pozycję?");
  if (!confirmed) return;

  const { error } = await supabaseClient
    .from("checklist_items")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Błąd usuwania checklisty:", error);
    alert("Nie udało się usunąć pozycji.");
    return;
  }

  await renderChecklistPage();
}

async function loadChecklistFromSupabase() {
  const { data, error } = await supabaseClient
    .from("checklist_items")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Błąd pobierania checklist:", error);
    return [];
  }

  return data || [];
}

function renderChecklistSummary(items) {
  const allCount = items.length;
  const doneCount = items.filter(item => item.done).length;
  const openCount = allCount - doneCount;

  const allEl = document.getElementById("check-all-count");
  if (!allEl) return;

  document.getElementById("check-all-count").textContent = allCount;
  document.getElementById("check-done-count").textContent = doneCount;
  document.getElementById("check-open-count").textContent = openCount;
}

function groupChecklistItems(items) {
  return {
    "sprzęt": items.filter(item => item.category === "sprzęt"),
    "zakupy": items.filter(item => item.category === "zakupy"),
    "jedzenie / picie": items.filter(item => item.category === "jedzenie / picie")
  };
}

function renderChecklistGroups(items) {
  const container = document.getElementById("checklist-groups");
  if (!container) return;

  if (!items.length) {
    container.innerHTML = `<div class="empty-box">Brak pozycji na liście.</div>`;
    return;
  }

  const groups = groupChecklistItems(items);

  container.innerHTML = Object.entries(groups).map(([groupName, groupItems]) => {
    if (!groupItems.length) return "";

    return `
      <section class="checklist-group">
        <h4>${groupName}</h4>
        <div class="checklist-items">
          ${groupItems.map(item => `
            <div class="check-item-row">
              <div class="check-item-left">
                <input
                  type="checkbox"
                  ${item.done ? "checked" : ""}
                  onchange="toggleChecklistItem(${item.id}, ${item.done})"
                />
                <div class="check-item-content">
                  <div class="check-item-title ${item.done ? "done" : ""}">
                    ${item.item_name}
                  </div>
                  <div class="check-item-meta">
                    ${item.quantity !== null && item.quantity !== undefined ? `${item.quantity} ${item.unit}` : `bez ilości`}
                  </div>
                </div>
              </div>

              <div class="check-item-actions">
                <button class="danger-btn" onclick="deleteChecklistItem(${item.id})">Usuń</button>
              </div>
            </div>
          `).join("")}
        </div>
      </section>
    `;
  }).join("");
}

async function renderChecklistPage() {
  const container = document.getElementById("checklist-groups");
  if (!container) return;

  container.innerHTML = `<div class="empty-box">Ładowanie checklist...</div>`;
  const items = await loadChecklistFromSupabase();
  renderChecklistSummary(items);
  renderChecklistGroups(items);
}

function bindChecklistPageEvents() {
  const form = document.getElementById("checklist-form");
  if (form) {
    form.addEventListener("submit", handleChecklistSubmit);
  }

  const refreshBtn = document.getElementById("refresh-checklist-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", renderChecklistPage);
  }
}

// POGODA PRO

function weatherCodeToText(code) {
  const map = {
    0: "Bezchmurnie",
    1: "Przeważnie pogodnie",
    2: "Częściowe zachmurzenie",
    3: "Pochmurno",
    45: "Mgła",
    48: "Mgła osadzająca",
    51: "Lekka mżawka",
    53: "Mżawka",
    55: "Silna mżawka",
    61: "Słaby deszcz",
    63: "Deszcz",
    65: "Silny deszcz",
    66: "Marznący deszcz",
    67: "Silny marznący deszcz",
    71: "Słaby śnieg",
    73: "Śnieg",
    75: "Silny śnieg",
    77: "Ziarnisty śnieg",
    80: "Przelotne opady",
    81: "Przelotny deszcz",
    82: "Silne przelotne opady",
    95: "Burza",
    96: "Burza z gradem",
    99: "Silna burza z gradem"
  };
  return map[code] || `Kod ${code}`;
}

function windDirectionToText(deg) {
  if (deg === null || deg === undefined) return "Brak";
  const dirs = [
    "Północ", "Północny-wschód", "Wschód", "Południowy-wschód",
    "Południe", "Południowy-zachód", "Zachód", "Północny-zachód"
  ];
  const index = Math.round(deg / 45) % 8;
  return `${dirs[index]} (${Math.round(deg)}°)`;
}

function getPressureTrend(hourlyPressure) {
  if (!hourlyPressure || hourlyPressure.length < 4) return "Brak danych";
  const start = hourlyPressure[0];
  const later = hourlyPressure[3];
  const diff = later - start;

  if (diff >= 2) return "Rośnie";
  if (diff <= -2) return "Spada";
  return "Stabilne";
}

function getWeatherRating(current, hourly) {
  const wind = current.wind_speed_10m ?? 0;
  const gusts = current.wind_gusts_10m ?? 0;
  const pressure = current.pressure_msl ?? 0;
  const precipitation = current.precipitation ?? 0;
  const trend = getPressureTrend(hourly.pressure_msl);

  let score = 0;

  if (wind >= 8 && wind <= 22) score += 2;
  else if (wind > 22) score += 1;

  if (gusts <= 35) score += 1;
  else if (gusts > 55) score -= 1;

  if (pressure >= 1005 && pressure <= 1020) score += 2;
  else if (pressure >= 995 && pressure <= 1025) score += 1;

  if (trend === "Spada") score += 2;
  if (trend === "Stabilne") score += 1;

  if (precipitation > 0 && precipitation <= 2) score += 1;
  if (precipitation > 5) score -= 1;

  if (score >= 6) return "Dobre";
  if (score >= 3) return "Średnie";
  return "Słabe";
}

function getNightCampRating(night) {
  let score = 0;

  if (night.temp >= 10 && night.temp <= 18) score += 2;
  else if (night.temp >= 6 && night.temp < 10) score += 1;

  if (night.wind <= 18) score += 2;
  else if (night.wind <= 28) score += 1;

  if (night.gusts <= 30) score += 1;
  else if (night.gusts > 45) score -= 1;

  if (night.humidity <= 88) score += 1;
  else score -= 1;

  if (night.visibility >= 3000) score += 1;
  else score -= 1;

  if (score >= 5) return "Komfortowa";
  if (score >= 2) return "Średnia";
  return "Ciężka";
}

// Proste przybliżenie fazy księżyca
function getMoonPhaseInfo(dateInput) {
  const date = new Date(dateInput);
  const knownNewMoon = new Date("2000-01-06T18:14:00Z");
  const synodicMonth = 29.53058867;
  const daysSince = (date - knownNewMoon) / 86400000;
  const phase = ((daysSince % synodicMonth) + synodicMonth) % synodicMonth;
  const illumination = (1 - Math.cos((2 * Math.PI * phase) / synodicMonth)) / 2;

  let name = "Nów";
  if (phase < 1.84566) name = "Nów";
  else if (phase < 5.53699) name = "Przybywający sierp";
  else if (phase < 9.22831) name = "Pierwsza kwadra";
  else if (phase < 12.91963) name = "Przybywający garb";
  else if (phase < 16.61096) name = "Pełnia";
  else if (phase < 20.30228) name = "Ubywający garb";
  else if (phase < 23.99361) name = "Ostatnia kwadra";
  else if (phase < 27.68493) name = "Ubywający sierp";
  else name = "Nów";

  return {
    name,
    illumination: `${Math.round(illumination * 100)}%`
  };
}

function pickNightWindow(hourly) {
  const hours = hourly.time.map((time, index) => ({
    time,
    temp: hourly.temperature_2m[index],
    wind: hourly.wind_speed_10m[index],
    gusts: hourly.wind_gusts_10m[index],
    humidity: hourly.relative_humidity_2m[index],
    visibility: hourly.visibility[index]
  }));

  const nightHours = hours.filter(h => {
    const hour = new Date(h.time).getHours();
    return hour >= 22 || hour <= 5;
  });

  if (!nightHours.length) {
    return { temp: 0, wind: 0, gusts: 0, humidity: 0, visibility: 0 };
  }

  const avg = (arr, key) => arr.reduce((sum, item) => sum + Number(item[key] || 0), 0) / arr.length;

  return {
    temp: avg(nightHours, "temp"),
    wind: avg(nightHours, "wind"),
    gusts: avg(nightHours, "gusts"),
    humidity: avg(nightHours, "humidity"),
    visibility: avg(nightHours, "visibility")
  };
}

function buildWeatherInterpretation(current, hourly) {
  const notes = [];
  const wind = current.wind_speed_10m ?? 0;
  const gusts = current.wind_gusts_10m ?? 0;
  const pressure = current.pressure_msl ?? 0;
  const direction = windDirectionToText(current.wind_direction_10m);
  const trend = getPressureTrend(hourly.pressure_msl);
  const dewPoint = current.dew_point_2m ?? 0;
  const humidity = current.relative_humidity_2m ?? 0;
  const cloud = current.cloud_cover ?? 0;

  if (trend === "Spada") {
    notes.push("Ciśnienie spada — to często daje okno aktywności przed zmianą pogody i warto pilnować zestawów.");
  } else if (trend === "Rośnie") {
    notes.push("Ciśnienie rośnie — ryby mogą żerować ostrożniej, więc lepiej łowić precyzyjnie i nie przesadzać z kombinowaniem.");
  } else {
    notes.push("Ciśnienie jest stabilne — warunki są spokojniejsze i bardziej przewidywalne.");
  }

  if (wind >= 8 && wind <= 22) {
    notes.push(`Wiatr jest sensowny (${wind.toFixed(1)} km/h). Często to pomaga, zwłaszcza gdy dmucha w Wasz brzeg. Kierunek: ${direction}.`);
  } else if (wind > 22) {
    notes.push(`Wiatr jest mocny (${wind.toFixed(1)} km/h, porywy ${gusts.toFixed(1)} km/h). Może pomagać w aktywności ryb, ale zestaw i obozowisko muszą być dobrze ustawione.`);
  } else {
    notes.push(`Wiatr jest słaby (${wind.toFixed(1)} km/h). Ryby mogą być bardziej rozproszone i trudniejsze do znalezienia.`);
  }

  if (pressure >= 1022) {
    notes.push(`Ciśnienie jest dość wysokie (${pressure.toFixed(0)} hPa). To nie przekreśla brań, ale często trzeba łowić dokładniej.`);
  } else if (pressure <= 1000) {
    notes.push(`Ciśnienie jest niskie (${pressure.toFixed(0)} hPa). To bywa dobry moment na żerowanie, szczególnie przed frontem.`);
  } else {
    notes.push(`Ciśnienie jest w rozsądnym zakresie (${pressure.toFixed(0)} hPa).`);
  }

  if (humidity >= 85 && dewPoint >= 10) {
    notes.push("Wilgotność i punkt rosy są wysokie — nocą może być ciężej na obozie, bardziej mokro i duszno.");
  }

  if (cloud >= 70) {
    notes.push("Duże zachmurzenie może pomóc utrzymać stabilniejsze warunki termiczne i ograniczyć ostre słońce w dzień.");
  }

  return notes;
}

function buildCampInterpretation(night, moonInfo) {
  const notes = [];
  const campRating = getNightCampRating(night);

  notes.push(`Ocena nocy na obozowanie: ${campRating}.`);

  if (night.wind > 25) {
    notes.push("Noc zapowiada się wietrznie — dobrze dociążyć rzeczy, sprawdzić namiot i nie zostawiać luzem sprzętu.");
  } else {
    notes.push("Wiatr nocą nie wygląda groźnie — obozowisko powinno być do opanowania.");
  }

  if (night.humidity > 88) {
    notes.push("Wilgotność nocą będzie wysoka — spodziewaj się większej ilości rosy i bardziej mokrego obozowiska rano.");
  }

  if (night.visibility < 2000) {
    notes.push("Widzialność nocą może być słaba — możliwa mgła lub wilgotne powietrze, warto mieć wszystko dobrze przygotowane.");
  }

  notes.push(`Faza księżyca: ${moonInfo.name} (${moonInfo.illumination} oświetlenia). Traktuj to jako dodatek, a nie główny wskaźnik brań.`);

  return notes;
}

async function fetchWeatherData() {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${FISHING_SPOT.latitude}&longitude=${FISHING_SPOT.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,dew_point_2m,precipitation,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,cloud_cover,visibility,uv_index&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,dew_point_2m,precipitation,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,cloud_cover,visibility,uv_index,soil_temperature_0cm,soil_moisture_0_to_1cm&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,wind_direction_10m_dominant,wind_gusts_10m_max,sunshine_duration,uv_index_max&timezone=auto&forecast_days=7`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Błąd pogody: ${response.status}`);
  }

  return response.json();
}

function renderWeatherCurrent(data) {
  const current = data.current;
  const hourly = data.hourly;
  const daily = data.daily;
  const trend = getPressureTrend(hourly.pressure_msl);
  const rating = getWeatherRating(current, hourly);

  document.getElementById("weather-current-temp").textContent = `${current.temperature_2m.toFixed(1)}°C`;
  document.getElementById("weather-current-wind").textContent = `${current.wind_speed_10m.toFixed(1)} / ${current.wind_gusts_10m.toFixed(1)} km/h`;
  document.getElementById("weather-current-pressure").textContent = `${current.pressure_msl.toFixed(0)} hPa / ${trend}`;
  document.getElementById("weather-rating").textContent = rating;

  document.getElementById("weather-description").textContent = weatherCodeToText(current.weather_code);
  document.getElementById("weather-apparent-temp").textContent = `${current.apparent_temperature.toFixed(1)}°C`;
  document.getElementById("weather-wind-direction").textContent = windDirectionToText(current.wind_direction_10m);
  document.getElementById("weather-cloud-cover").textContent = `${current.cloud_cover}%`;
  document.getElementById("weather-precipitation").textContent = `${current.precipitation.toFixed(1)} mm`;
  document.getElementById("weather-humidity").textContent = `${current.relative_humidity_2m}%`;
  document.getElementById("weather-dew-point").textContent = `${current.dew_point_2m.toFixed(1)}°C`;
  document.getElementById("weather-visibility").textContent = `${Math.round(current.visibility / 1000)} km`;
  document.getElementById("weather-uv").textContent = `${current.uv_index?.toFixed(1) ?? "--"}`;
  document.getElementById("weather-sunshine").textContent = `${Math.round((daily.sunshine_duration?.[0] || 0) / 3600)} h`;

  const notes = buildWeatherInterpretation(current, hourly);
  document.getElementById("weather-interpretation").innerHTML = notes
    .map(note => `<div class="weather-note">${note}</div>`)
    .join("");

  const night = pickNightWindow(hourly);
  const campRating = getNightCampRating(night);
  const moonInfo = getMoonPhaseInfo(new Date());

  document.getElementById("camp-night-temp").textContent = `${night.temp.toFixed(1)}°C`;
  document.getElementById("camp-night-wind").textContent = `${night.wind.toFixed(1)} km/h`;
  document.getElementById("camp-night-gusts").textContent = `${night.gusts.toFixed(1)} km/h`;
  document.getElementById("camp-night-humidity").textContent = `${Math.round(night.humidity)}%`;
  document.getElementById("camp-night-visibility").textContent = `${Math.round(night.visibility / 1000)} km`;
  document.getElementById("camp-night-rating").textContent = campRating;
  document.getElementById("moon-phase").textContent = moonInfo.name;
  document.getElementById("moon-illumination").textContent = moonInfo.illumination;

  const campNotes = buildCampInterpretation(night, moonInfo);
  document.getElementById("camp-interpretation").innerHTML = campNotes
    .map(note => `<div class="weather-note">${note}</div>`)
    .join("");

  document.getElementById("soil-temp").textContent = `${hourly.soil_temperature_0cm?.[0]?.toFixed(1) ?? "--"}°C`;
  document.getElementById("soil-moisture").textContent = `${Math.round((hourly.soil_moisture_0_to_1cm?.[0] || 0) * 100)}%`;
}

function renderWeatherHourly(data) {
  const container = document.getElementById("weather-hourly-list");
  if (!container) return;

  const times = data.hourly.time.slice(0, 24);
  container.innerHTML = times.map((time, index) => `
    <div class="weather-row">
      <strong>${formatHour(time)}</strong>
      <div class="weather-chip">${data.hourly.temperature_2m[index].toFixed(1)}°C</div>
      <div class="weather-chip">${data.hourly.wind_speed_10m[index].toFixed(1)} / ${data.hourly.wind_gusts_10m[index].toFixed(1)} km/h</div>
      <div class="weather-chip">${windDirectionToText(data.hourly.wind_direction_10m[index])}</div>
      <div class="weather-chip">${data.hourly.pressure_msl[index].toFixed(0)} hPa</div>
      <div class="weather-chip">${data.hourly.precipitation[index].toFixed(1)} mm</div>
      <div class="weather-chip">${weatherCodeToText(data.hourly.weather_code[index])}</div>
    </div>
  `).join("");
}

function renderWeatherDaily(data) {
  const container = document.getElementById("weather-daily-list");
  if (!container) return;

  const times = data.daily.time;
  container.innerHTML = times.map((time, index) => `
    <div class="weather-row">
      <strong>${formatDay(time)}</strong>
      <div class="weather-chip">${weatherCodeToText(data.daily.weather_code[index])}</div>
      <div class="weather-chip">Min ${data.daily.temperature_2m_min[index].toFixed(1)}°C / Max ${data.daily.temperature_2m_max[index].toFixed(1)}°C</div>
      <div class="weather-chip">Opad ${data.daily.precipitation_sum[index].toFixed(1)} mm</div>
      <div class="weather-chip">Wiatr ${data.daily.wind_speed_10m_max[index].toFixed(1)} km/h</div>
      <div class="weather-chip">Porywy ${data.daily.wind_gusts_10m_max[index].toFixed(1)} km/h</div>
      <div class="weather-chip">Słońce ${Math.round((data.daily.sunshine_duration[index] || 0) / 3600)} h</div>
    </div>
  `).join("");
}

async function renderWeatherPage() {
  const tempEl = document.getElementById("weather-current-temp");
  if (!tempEl) return;

  try {
    document.getElementById("weather-current-temp").textContent = "Ładowanie...";
    const data = await fetchWeatherData();
    renderWeatherCurrent(data);
    renderWeatherHourly(data);
    renderWeatherDaily(data);
  } catch (error) {
    console.error(error);
    document.getElementById("weather-current-temp").textContent = "Błąd";
    document.getElementById("weather-current-wind").textContent = "Błąd";
    document.getElementById("weather-current-pressure").textContent = "Błąd";
    document.getElementById("weather-rating").textContent = "Błąd";
    document.getElementById("weather-description").textContent = "Nie udało się pobrać pogody";
    document.getElementById("weather-interpretation").innerHTML = `<div class="weather-note">Nie udało się pobrać danych pogodowych. Spróbuj odświeżyć.</div>`;
    document.getElementById("camp-interpretation").innerHTML = `<div class="weather-note">Brak danych do oceny obozowania.</div>`;
  }
}

function bindWeatherPageEvents() {
  const refreshBtn = document.getElementById("refresh-weather-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", renderWeatherPage);
  }
}

async function initDashboardPage() {
  updateCountdown();
  setupMobileMenu();
  await seedSampleDataIfEmpty();
  const catches = await loadCatchesFromSupabase();
  updateDashboard(catches);
  setInterval(updateCountdown, 30000);
}

async function initCatchesPage() {
  updateCountdown();
  setupMobileMenu();
  setDefaultCaughtAt();
  bindCatchesPageEvents();
  await renderCatchesPage();
  setInterval(updateCountdown, 30000);
}

async function initChecklistPage() {
  updateCountdown();
  setupMobileMenu();
  bindChecklistPageEvents();
  await renderChecklistPage();
  setInterval(updateCountdown, 30000);
}

async function initWeatherPage() {
  updateCountdown();
  setupMobileMenu();
  bindWeatherPageEvents();
  await renderWeatherPage();
  setInterval(updateCountdown, 30000);
}

const isDashboardPage = document.getElementById("total-weight");
const isCatchesPage = document.getElementById("catch-form");
const isChecklistPage = document.getElementById("checklist-form");
const isWeatherPage = document.getElementById("weather-current-temp");

if (isDashboardPage) {
  initDashboardPage();
}

if (isCatchesPage) {
  initCatchesPage();
}

if (isChecklistPage) {
  initChecklistPage();
}

if (isWeatherPage) {
  initWeatherPage();
}

window.deleteCatch = deleteCatch;
window.toggleChecklistItem = toggleChecklistItem;
window.deleteChecklistItem = deleteChecklistItem;

// SPOTY

function setSpotMessage(message, type = "") {
  const box = document.getElementById("spot-message");
  if (!box) return;

  box.textContent = message;
  box.className = "form-message";
  if (type) box.classList.add(type);
}

function validateSpotForm(values) {
  if (!values.name.trim()) return "Podaj nazwę spotu.";
  return null;
}

async function handleSpotSubmit(event) {
  event.preventDefault();

  const values = {
    name: document.getElementById("spot-name")?.value || "",
    distance_m: document.getElementById("spot-distance")?.value || "",
    depth_m: document.getElementById("spot-depth")?.value || "",
    bottom_type: document.getElementById("spot-bottom")?.value || "",
    note: document.getElementById("spot-note")?.value || ""
  };

  const validationError = validateSpotForm(values);
  if (validationError) {
    setSpotMessage(validationError, "error");
    return;
  }

  setSpotMessage("Zapisywanie spotu...");

  const payload = {
    name: values.name.trim(),
    distance_m: values.distance_m ? Number(values.distance_m) : null,
    depth_m: values.depth_m ? Number(values.depth_m) : null,
    bottom_type: values.bottom_type.trim() || null,
    note: values.note.trim() || null
  };

  const { error } = await supabaseClient
    .from("spots")
    .insert([payload]);

  if (error) {
    console.error("Błąd dodawania spotu:", error);
    setSpotMessage("Nie udało się dodać spotu.", "error");
    return;
  }

  setSpotMessage("Spot został dodany.", "success");
  document.getElementById("spot-form")?.reset();
  await renderSpotsPage();
}

async function deleteSpot(id) {
  const confirmed = window.confirm("Usunąć ten spot?");
  if (!confirmed) return;

  const { error } = await supabaseClient
    .from("spots")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Błąd usuwania spotu:", error);
    alert("Nie udało się usunąć spotu.");
    return;
  }

  await renderSpotsPage();
}

async function loadSpotsFromSupabase() {
  const { data, error } = await supabaseClient
    .from("spots")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Błąd pobierania spotów:", error);
    return [];
  }

  return data || [];
}

function renderSpotsSummary(spots) {
  const countEl = document.getElementById("spots-count");
  if (!countEl) return;

  const distanceValues = spots.filter(s => s.distance_m !== null).map(s => Number(s.distance_m));
  const depthValues = spots.filter(s => s.depth_m !== null).map(s => Number(s.depth_m));

  const avgDistance = distanceValues.length
    ? (distanceValues.reduce((a, b) => a + b, 0) / distanceValues.length).toFixed(1)
    : "--";

  const avgDepth = depthValues.length
    ? (depthValues.reduce((a, b) => a + b, 0) / depthValues.length).toFixed(1)
    : "--";

  document.getElementById("spots-count").textContent = spots.length;
  document.getElementById("spots-avg-distance").textContent = avgDistance === "--" ? "--" : `${avgDistance} m`;
  document.getElementById("spots-avg-depth").textContent = avgDepth === "--" ? "--" : `${avgDepth} m`;
}

function renderSpotsList(spots) {
  const list = document.getElementById("spots-list");
  if (!list) return;

  if (!spots.length) {
    list.innerHTML = `<div class="empty-box">Brak zapisanych spotów.</div>`;
    return;
  }

  list.innerHTML = spots.map(item => `
    <article class="spot-card">
      <div class="spot-card-top">
        <div>
          <h4>${item.name}</h4>
          <div class="catch-meta">Dodano: ${formatCaughtAt(item.created_at)}</div>
        </div>
        <div>
          <button class="danger-btn" onclick="deleteSpot(${item.id})">Usuń</button>
        </div>
      </div>

      <div class="catch-badges">
        <span class="badge">Odległość: ${item.distance_m !== null ? `${Number(item.distance_m).toFixed(1)} m` : "brak"}</span>
        <span class="badge">Głębokość: ${item.depth_m !== null ? `${Number(item.depth_m).toFixed(1)} m` : "brak"}</span>
        <span class="badge">Dno: ${item.bottom_type || "brak"}</span>
      </div>

      ${item.note ? `<div class="catch-note">${item.note}</div>` : ""}
    </article>
  `).join("");
}

async function renderSpotsPage() {
  const list = document.getElementById("spots-list");
  if (!list) return;

  list.innerHTML = `<div class="empty-box">Ładowanie spotów...</div>`;
  const spots = await loadSpotsFromSupabase();
  renderSpotsSummary(spots);
  renderSpotsList(spots);
}

function bindSpotsPageEvents() {
  const form = document.getElementById("spot-form");
  if (form) {
    form.addEventListener("submit", handleSpotSubmit);
  }

  const refreshBtn = document.getElementById("refresh-spots-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", renderSpotsPage);
  }
}

async function initSpotsPage() {
  updateCountdown();
  setupMobileMenu();
  bindSpotsPageEvents();
  await renderSpotsPage();
  setInterval(updateCountdown, 30000);
}

// PROSTE STRONY WIEDZY

function initKnowledgePage() {
  updateCountdown();
  setupMobileMenu();
  setInterval(updateCountdown, 30000);
}

const isSpotsPage = document.getElementById("spot-form");
const isKnotsPage = document.querySelector(".knowledge-grid") && window.location.pathname.includes("wezly");
const isRigsPage = document.querySelector(".knowledge-grid") && window.location.pathname.includes("rigi");
const isTipsPage = document.querySelector(".knowledge-grid") && window.location.pathname.includes("porady");

if (isSpotsPage) {
  initSpotsPage();
}

if (isKnotsPage || isRigsPage || isTipsPage) {
  initKnowledgePage();
}

window.deleteSpot = deleteSpot;
