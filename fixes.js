(function () {
  const $ = id => document.getElementById(id);

  function getSupabaseClientSafe() {
    try {
      if (typeof supabaseClient !== "undefined" && supabaseClient) return supabaseClient;
    } catch (_) {}
    return null;
  }

  function getFishingSpotSafe() {
    try {
      if (typeof FISHING_SPOT !== "undefined" && FISHING_SPOT) return FISHING_SPOT;
    } catch (_) {}

    return {
      latitude: 50.0,
      longitude: 5.0,
      name: "Miejsce zasiadki"
    };
  }

  function clearNode(node) {
    if (!node) return;
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function normalizeText(value, max = 200) {
    return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function formatVisibility(value) {
    const num = Number(value || 0);
    if (num >= 1000) return `${(num / 1000).toFixed(1)} km`;
    return `${Math.round(num)} m`;
  }

  function formatHour(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
  }

  function formatDay(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("pl-PL", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit"
    });
  }

  function weatherCodeToText(code) {
    const map = {
      0: "Bezchmurnie",
      1: "Prawie bezchmurnie",
      2: "Małe zachmurzenie",
      3: "Pochmurno",
      45: "Mgła",
      48: "Szadź / mgła",
      51: "Lekka mżawka",
      53: "Mżawka",
      55: "Gęsta mżawka",
      56: "Marznąca mżawka",
      57: "Silna marznąca mżawka",
      61: "Lekki deszcz",
      63: "Deszcz",
      65: "Mocny deszcz",
      66: "Marznący deszcz",
      67: "Silny marznący deszcz",
      71: "Lekki śnieg",
      73: "Śnieg",
      75: "Mocny śnieg",
      77: "Ziarnisty śnieg",
      80: "Przelotny lekki deszcz",
      81: "Przelotny deszcz",
      82: "Mocne przelotne opady",
      85: "Przelotny śnieg",
      86: "Mocny przelotny śnieg",
      95: "Burza",
      96: "Burza z gradem",
      99: "Silna burza z gradem"
    };
    return map[Number(code)] || "Warunki zmienne";
  }

  function weatherCodeToIcon(code) {
    const num = Number(code);
    if (num === 0) return "☀️";
    if ([1, 2].includes(num)) return "⛅";
    if (num === 3) return "☁️";
    if ([45, 48].includes(num)) return "🌫️";
    if ([51, 53, 55, 56, 57].includes(num)) return "🌦️";
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(num)) return "🌧️";
    if ([71, 73, 75, 77, 85, 86].includes(num)) return "❄️";
    if ([95, 96, 99].includes(num)) return "⛈️";
    return "🌤️";
  }

  function windDirectionToText(deg) {
    const value = Number(deg || 0);
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(value / 45) % 8;
    return `${dirs[index]} (${Math.round(value)}°)`;
  }

  function moonPhaseInfo(date = new Date()) {
    const lp = 2551443;
    const newMoon = new Date("2001-01-24T13:00:00Z").getTime();
    const phase = (((date.getTime() - newMoon) / 1000) % lp) / lp;
    const normalized = phase < 0 ? phase + 1 : phase;
    const illumination = Math.round((1 - Math.cos(normalized * 2 * Math.PI)) * 50);

    if (normalized < 0.03 || normalized > 0.97) return { name: "Nów", illumination: `${illumination}%` };
    if (normalized < 0.22) return { name: "Przybywający sierp", illumination: `${illumination}%` };
    if (normalized < 0.28) return { name: "Pierwsza kwadra", illumination: `${illumination}%` };
    if (normalized < 0.47) return { name: "Przybywający garb", illumination: `${illumination}%` };
    if (normalized < 0.53) return { name: "Pełnia", illumination: `${illumination}%` };
    if (normalized < 0.72) return { name: "Ubywający garb", illumination: `${illumination}%` };
    if (normalized < 0.78) return { name: "Ostatnia kwadra", illumination: `${illumination}%` };
    return { name: "Ubywający sierp", illumination: `${illumination}%` };
  }

  function getPressureTrend(pressures, currentIndex) {
    const prev = Number(pressures?.[Math.max(0, currentIndex - 3)] ?? 0);
    const current = Number(pressures?.[currentIndex] ?? 0);
    const diff = current - prev;
    if (diff > 2) return "rośnie";
    if (diff < -2) return "spada";
    return "stabilne";
  }

  function getHourlyIndexForNow(data) {
    const currentTime = data?.current?.time;
    const hourly = data?.hourly?.time || [];
    const index = hourly.indexOf(currentTime);
    if (index >= 0) return index;

    const now = Date.now();
    let closestIndex = 0;
    let closestDiff = Infinity;

    hourly.forEach((value, idx) => {
      const diff = Math.abs(new Date(value).getTime() - now);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIndex = idx;
      }
    });

    return closestIndex;
  }

  function pickNearestNightWindow(hourly, startIndex) {
    const times = hourly.time || [];
    const start = Math.max(0, startIndex);
    for (let i = start; i < times.length; i += 1) {
      const hour = new Date(times[i]).getHours();
      if (hour >= 22 || hour <= 5) {
        return {
          temp: Number(hourly.temperature_2m?.[i] || 0),
          wind: Number(hourly.wind_speed_10m?.[i] || 0),
          gusts: Number(hourly.wind_gusts_10m?.[i] || 0),
          humidity: Number(hourly.relative_humidity_2m?.[i] || 0),
          visibility: Number(hourly.visibility?.[i] || 0),
          cloud: Number(hourly.cloud_cover?.[i] || 0)
        };
      }
    }

    return {
      temp: Number(hourly.temperature_2m?.[start] || 0),
      wind: Number(hourly.wind_speed_10m?.[start] || 0),
      gusts: Number(hourly.wind_gusts_10m?.[start] || 0),
      humidity: Number(hourly.relative_humidity_2m?.[start] || 0),
      visibility: Number(hourly.visibility?.[start] || 0),
      cloud: Number(hourly.cloud_cover?.[start] || 0)
    };
  }

  function getNightCampRating(night) {
    if (night.gusts >= 45 || night.visibility < 300) return "Trudna noc";
    if (night.temp < 6 || night.wind > 25 || night.humidity > 92) return "Średnio komfortowo";
    return "Dobra noc";
  }

  function getWeatherRating(current, hourly, currentIndex) {
    let score = 0;
    const pressureTrend = getPressureTrend(hourly.pressure_msl, currentIndex);
    const wind = Number(current.wind_speed_10m || 0);
    const gusts = Number(current.wind_gusts_10m || 0);
    const cloud = Number(current.cloud_cover || 0);
    const rain = Number(current.precipitation || 0);
    const pressure = Number(current.pressure_msl || 0);

    if (wind >= 8 && wind <= 24) score += 2;
    if (gusts <= 35) score += 1;
    if (cloud >= 20 && cloud <= 85) score += 2;
    if (rain <= 1.5) score += 1;
    if (pressure >= 1000 && pressure <= 1024) score += 1;
    if (pressureTrend === "stabilne") score += 2;
    if (pressureTrend === "rośnie") score += 1;

    if (score >= 8) return "Bardzo dobre";
    if (score >= 6) return "Dobre";
    if (score >= 4) return "Średnie";
    return "Słabe";
  }

  function buildWeatherInterpretation(current, hourly, currentIndex) {
    const notes = [];
    const wind = Number(current.wind_speed_10m || 0);
    const gusts = Number(current.wind_gusts_10m || 0);
    const pressure = Number(current.pressure_msl || 0);
    const trend = getPressureTrend(hourly.pressure_msl, currentIndex);
    const cloud = Number(current.cloud_cover || 0);
    const rain = Number(current.precipitation || 0);

    if (trend === "stabilne") notes.push("Stabilne ciśnienie wygląda dobrze pod spokojniejsze żerowanie ryb.");
    else if (trend === "rośnie") notes.push("Ciśnienie rośnie — warunki mogą się porządkować, warto obserwować aktywność.");
    else notes.push("Ciśnienie spada — możliwa zmiana pogody, pilnuj frontu i reakcji ryb.");

    if (wind >= 8 && wind <= 24) notes.push("Wiatr jest w sensownym zakresie i może pracować na wodzie na plus.");
    else if (wind < 8) notes.push("Słaby wiatr — woda może być zbyt spokojna i mniej 'żywa'.");
    else notes.push("Wiatr jest już dość mocny — ustawienie zestawów i komfort łowienia mogą być gorsze.");

    if (gusts > 35) notes.push("Mocniejsze porywy mogą pogarszać kontrolę nad zestawem i sygnalizacją.");
    if (cloud >= 20 && cloud <= 85) notes.push("Umiarkowane zachmurzenie zwykle daje przyjemniejsze światło i lepszy komfort.");
    if (rain > 1.5) notes.push("Wyższy opad — przygotuj osłonę stanowiska i pilnuj elektroniki.");

    if (!notes.length) notes.push("Warunki są dość neutralne — obserwuj wodę i reaguj na zmiany.");
    return notes;
  }

  function buildCampInterpretation(night, moon) {
    const notes = [];

    if (night.temp < 6) notes.push("Noc zapowiada się chłodna — przyda się cieplejszy śpiwór i dodatkowa warstwa.");
    else if (night.temp < 11) notes.push("Temperatura nocna umiarkowana — komfortowo, ale warto mieć bluzę pod ręką.");
    else notes.push("Temperatura nocą wygląda całkiem przyjaźnie dla dłuższego siedzenia na stanowisku.");

    if (night.gusts > 40) notes.push("Porywy będą wyraźnie odczuwalne — dobrze poprawić namiot, pokrowce i lekkie rzeczy.");
    if (night.humidity > 90) notes.push("Bardzo wysoka wilgotność — rano może być mokro, cięższe powietrze i więcej rosy.");
    if (night.visibility < 500) notes.push("Niższa widzialność może oznaczać mgłę przy brzegu i bardziej surową noc.");

    notes.push(`Faza księżyca: ${moon.name}, oświetlenie około ${moon.illumination}.`);

    return notes;
  }

  function setNotes(containerId, notes) {
    const container = $(containerId);
    if (!container) return;
    clearNode(container);

    notes.forEach(note => {
      const item = el("div", "weather-note");
      item.appendChild(document.createTextNode(note));
      container.appendChild(item);
    });
  }

  async function fetchWeatherDataEnhanced() {
    const spot = getFishingSpotSafe();
    const params = new URLSearchParams({
      latitude: String(spot.latitude),
      longitude: String(spot.longitude),
      current: [
        "temperature_2m",
        "apparent_temperature",
        "relative_humidity_2m",
        "dew_point_2m",
        "precipitation",
        "weather_code",
        "pressure_msl",
        "wind_speed_10m",
        "wind_direction_10m",
        "wind_gusts_10m",
        "cloud_cover",
        "visibility",
        "uv_index"
      ].join(","),
      hourly: [
        "temperature_2m",
        "apparent_temperature",
        "relative_humidity_2m",
        "dew_point_2m",
        "precipitation",
        "weather_code",
        "pressure_msl",
        "wind_speed_10m",
        "wind_direction_10m",
        "wind_gusts_10m",
        "cloud_cover",
        "visibility",
        "uv_index",
        "soil_temperature_0cm",
        "soil_moisture_0_to_1cm"
      ].join(","),
      daily: [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_sum",
        "wind_speed_10m_max",
        "wind_direction_10m_dominant",
        "wind_gusts_10m_max",
        "sunshine_duration",
        "uv_index_max"
      ].join(","),
      timezone: "auto",
      forecast_days: "7"
    });

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    if (!response.ok) throw new Error(`Błąd pobierania pogody: ${response.status}`);
    return response.json();
  }

  function renderCurrentWeatherEnhanced(data) {
    const current = data.current;
    const hourly = data.hourly;
    const daily = data.daily;
    const currentIndex = getHourlyIndexForNow(data);
    const trend = getPressureTrend(hourly.pressure_msl, currentIndex);
    const rating = getWeatherRating(current, hourly, currentIndex);
    const description = weatherCodeToText(current.weather_code);
    const icon = weatherCodeToIcon(current.weather_code);
    const windDirection = windDirectionToText(current.wind_direction_10m);
    const spot = getFishingSpotSafe();
    const moon = moonPhaseInfo(new Date());
    const night = pickNearestNightWindow(hourly, currentIndex);

    if ($("weather-current-condition-icon")) $("weather-current-condition-icon").textContent = icon;
    if ($("weather-summary-location")) $("weather-summary-location").textContent = spot.name || "Miejsce zasiadki";
    if ($("weather-summary-updated")) {
      $("weather-summary-updated").textContent = `Aktualizacja: ${new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}`;
    }
    if ($("weather-rating-hero")) $("weather-rating-hero").textContent = `Ocena: ${rating}`;

    if ($("weather-current-temp")) $("weather-current-temp").textContent = `${Number(current.temperature_2m).toFixed(1)}°C`;
    if ($("weather-current-wind")) $("weather-current-wind").textContent = `${Number(current.wind_speed_10m).toFixed(1)} / ${Number(current.wind_gusts_10m).toFixed(1)} km/h`;
    if ($("weather-current-pressure")) $("weather-current-pressure").textContent = `${Number(current.pressure_msl).toFixed(0)} hPa / ${trend}`;
    if ($("weather-rating")) $("weather-rating").textContent = rating;
    if ($("weather-description")) $("weather-description").textContent = `${icon} ${description}`;
    if ($("weather-description-copy")) $("weather-description-copy").textContent = description;
    if ($("weather-pressure-note")) $("weather-pressure-note").textContent = `Trend: ${trend}`;
    if ($("weather-rating-note")) $("weather-rating-note").textContent = `Warunki: ${rating}`;

    if ($("weather-apparent-temp")) $("weather-apparent-temp").textContent = `${Number(current.apparent_temperature).toFixed(1)}°C`;
    if ($("weather-wind-direction")) $("weather-wind-direction").textContent = windDirection;
    if ($("weather-wind-direction-copy")) $("weather-wind-direction-copy").textContent = windDirection;
    if ($("weather-cloud-cover")) $("weather-cloud-cover").textContent = `${Math.round(Number(current.cloud_cover || 0))}%`;
    if ($("weather-precipitation")) $("weather-precipitation").textContent = `${Number(current.precipitation || 0).toFixed(1)} mm`;
    if ($("weather-humidity")) $("weather-humidity").textContent = `${Math.round(Number(current.relative_humidity_2m || 0))}%`;
    if ($("weather-dew-point")) $("weather-dew-point").textContent = `${Number(current.dew_point_2m || 0).toFixed(1)}°C`;
    if ($("weather-visibility")) $("weather-visibility").textContent = formatVisibility(current.visibility);
    if ($("weather-uv")) $("weather-uv").textContent = current.uv_index !== null && current.uv_index !== undefined ? Number(current.uv_index).toFixed(1) : "--";
    if ($("weather-sunshine")) $("weather-sunshine").textContent = `${Math.round((daily.sunshine_duration?.[0] || 0) / 3600)} h`;

    if ($("camp-night-temp")) $("camp-night-temp").textContent = `${night.temp.toFixed(1)}°C`;
    if ($("camp-night-wind")) $("camp-night-wind").textContent = `${night.wind.toFixed(1)} km/h`;
    if ($("camp-night-gusts")) $("camp-night-gusts").textContent = `${night.gusts.toFixed(1)} km/h`;
    if ($("camp-night-humidity")) $("camp-night-humidity").textContent = `${Math.round(night.humidity)}%`;
    if ($("camp-night-visibility")) $("camp-night-visibility").textContent = formatVisibility(night.visibility);
    if ($("camp-night-rating")) $("camp-night-rating").textContent = getNightCampRating(night);
    if ($("moon-phase")) $("moon-phase").textContent = moon.name;
    if ($("moon-illumination")) $("moon-illumination").textContent = moon.illumination;

    if ($("soil-temp")) $("soil-temp").textContent = `${Number(hourly.soil_temperature_0cm?.[currentIndex] || 0).toFixed(1)}°C`;
    if ($("soil-moisture")) $("soil-moisture").textContent = `${Math.round(Number(hourly.soil_moisture_0_to_1cm?.[currentIndex] || 0) * 100)}%`;

    if ($("wind-arrow")) {
      $("wind-arrow").style.transform = `translate(-50%, -86%) rotate(${Number(current.wind_direction_10m || 0)}deg)`;
    }
    if ($("wind-compass-text")) $("wind-compass-text").textContent = windDirection;
    if ($("wind-direction-long")) $("wind-direction-long").textContent = windDirection;
    if ($("wind-gusts-inline")) $("wind-gusts-inline").textContent = `${Number(current.wind_gusts_10m || 0).toFixed(1)} km/h`;
    if ($("wind-score-inline")) $("wind-score-inline").textContent = rating;

    setNotes("weather-interpretation", buildWeatherInterpretation(current, hourly, currentIndex));
    setNotes("camp-interpretation", buildCampInterpretation(night, moon));
  }

  function createWeatherChip(label, value, highlight = false) {
    const chip = el("div", `weather-chip-2${highlight ? " highlight" : ""}`);
    chip.appendChild(el("span", "", label));
    chip.appendChild(el("strong", "", value));
    return chip;
  }

  function renderHourlyWeatherEnhanced(data) {
    const container = $("weather-hourly-list");
    if (!container) return;
    clearNode(container);

    const startIndex = getHourlyIndexForNow(data);
    const endIndex = Math.min(data.hourly.time.length, startIndex + 24);

    for (let i = startIndex; i < endIndex; i += 1) {
      const card = el("article", "weather-hour-card");
      const top = el("div", "weather-row-top");
      const title = el("div", "weather-row-title");
      const icon = el("div", "weather-row-icon", weatherCodeToIcon(data.hourly.weather_code[i]));

      const textWrap = el("div");
      textWrap.appendChild(el("div", "weather-row-time", formatHour(data.hourly.time[i])));
      textWrap.appendChild(el("div", "weather-row-desc", weatherCodeToText(data.hourly.weather_code[i])));
      title.appendChild(icon);
      title.appendChild(textWrap);

      const rating = el("div", "section-chip", `${Number(data.hourly.temperature_2m[i]).toFixed(1)}°C`);
      top.appendChild(title);
      top.appendChild(rating);
      card.appendChild(top);

      const grid = el("div", "weather-chip-grid");
      grid.appendChild(createWeatherChip("🌡️ Temp.", `${Number(data.hourly.temperature_2m[i]).toFixed(1)}°C`, true));
      grid.appendChild(createWeatherChip("🌬️ Wiatr", `${Number(data.hourly.wind_speed_10m[i]).toFixed(1)} km/h`));
      grid.appendChild(createWeatherChip("💨 Porywy", `${Number(data.hourly.wind_gusts_10m[i]).toFixed(1)} km/h`));
      grid.appendChild(createWeatherChip("🧭 Kierunek", windDirectionToText(data.hourly.wind_direction_10m[i])));
      grid.appendChild(createWeatherChip("🧭 Ciśnienie", `${Number(data.hourly.pressure_msl[i]).toFixed(0)} hPa`));
      grid.appendChild(createWeatherChip("🌧️ Opad", `${Number(data.hourly.precipitation[i] || 0).toFixed(1)} mm`));
      grid.appendChild(createWeatherChip("☁️ Chmury", `${Math.round(Number(data.hourly.cloud_cover[i] || 0))}%`));
      grid.appendChild(createWeatherChip("💧 Wilgotność", `${Math.round(Number(data.hourly.relative_humidity_2m[i] || 0))}%`));
      grid.appendChild(createWeatherChip("🌫️ Rosa", `${Number(data.hourly.dew_point_2m[i] || 0).toFixed(1)}°C`));
      grid.appendChild(createWeatherChip("👀 Widzialność", formatVisibility(data.hourly.visibility[i])));
      grid.appendChild(createWeatherChip("☀️ UV", `${Number(data.hourly.uv_index?.[i] || 0).toFixed(1)}`));
      grid.appendChild(createWeatherChip("🌱 Gleba", `${Number(data.hourly.soil_temperature_0cm?.[i] || 0).toFixed(1)}°C`));

      card.appendChild(grid);
      container.appendChild(card);
    }
  }

  function renderDailyWeatherEnhanced(data) {
    const container = $("weather-daily-list");
    if (!container) return;
    clearNode(container);

    data.daily.time.forEach((time, index) => {
      const card = el("article", "weather-day-card");
      const top = el("div", "weather-row-top");
      const title = el("div", "weather-row-title");
      const icon = el("div", "weather-row-icon", weatherCodeToIcon(data.daily.weather_code[index]));

      const textWrap = el("div");
      textWrap.appendChild(el("div", "weather-row-time", formatDay(time)));
      textWrap.appendChild(el("div", "weather-row-desc", weatherCodeToText(data.daily.weather_code[index])));
      title.appendChild(icon);
      title.appendChild(textWrap);

      const tag = el("div", "section-chip", `UV max ${Number(data.daily.uv_index_max?.[index] || 0).toFixed(1)}`);
      top.appendChild(title);
      top.appendChild(tag);
      card.appendChild(top);

      const grid = el("div", "weather-chip-grid");
      grid.appendChild(createWeatherChip("🌡️ Min / Max", `${Number(data.daily.temperature_2m_min[index]).toFixed(1)}°C / ${Number(data.daily.temperature_2m_max[index]).toFixed(1)}°C`, true));
      grid.appendChild(createWeatherChip("🌧️ Opad", `${Number(data.daily.precipitation_sum[index] || 0).toFixed(1)} mm`));
      grid.appendChild(createWeatherChip("🌬️ Wiatr max", `${Number(data.daily.wind_speed_10m_max[index] || 0).toFixed(1)} km/h`));
      grid.appendChild(createWeatherChip("💨 Porywy", `${Number(data.daily.wind_gusts_10m_max[index] || 0).toFixed(1)} km/h`));
      grid.appendChild(createWeatherChip("🧭 Kierunek", windDirectionToText(data.daily.wind_direction_10m_dominant[index] || 0)));
      grid.appendChild(createWeatherChip("🌞 Słońce", `${Math.round((data.daily.sunshine_duration[index] || 0) / 3600)} h`));

      card.appendChild(grid);
      container.appendChild(card);
    });
  }

  async function renderEnhancedWeatherPage() {
    if (!$("weather-current-temp")) return;

    try {
      if ($("weather-current-temp")) $("weather-current-temp").textContent = "Ładowanie...";
      const data = await fetchWeatherDataEnhanced();
      renderCurrentWeatherEnhanced(data);
      renderHourlyWeatherEnhanced(data);
      renderDailyWeatherEnhanced(data);
    } catch (error) {
      console.error(error);
      const ids = [
        "weather-current-temp",
        "weather-current-wind",
        "weather-current-pressure",
        "weather-rating",
        "weather-description",
        "weather-description-copy"
      ];
      ids.forEach(id => {
        if ($(id)) $(id).textContent = "Błąd";
      });
      setNotes("weather-interpretation", ["Nie udało się pobrać danych pogodowych."]);
      setNotes("camp-interpretation", ["Brak danych do oceny obozowania."]);
    }
  }

  async function overrideChecklistSubmit(event) {
    const form = $("checklist-form");
    if (!form) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const client = getSupabaseClientSafe();
    if (!client) return;

    const editId = $("edit-check-id")?.value || "";
    const category = normalizeText($("check-category")?.value, 40);
    const itemName = normalizeText($("check-name")?.value, 80);
    const unit = normalizeText($("check-unit")?.value, 20) || "szt.";
    const quantityRaw = $("check-quantity")?.value;
    const quantity = quantityRaw === "" ? null : Number(quantityRaw);

    const allowedCategories = ["sprzęt", "zakupy", "jedzenie / picie"];
    const allowedUnits = ["szt.", "kg", "litry"];

    const message = $("checklist-message");
    const setMessage = (text, type = "") => {
      if (!message) return;
      message.textContent = text;
      message.className = `form-message ${type}`.trim();
    };

    if (!allowedCategories.includes(category)) {
      setMessage("Wybierz poprawną kategorię.", "error");
      return;
    }

    if (!itemName) {
      setMessage("Podaj nazwę pozycji.", "error");
      return;
    }

    if (quantity !== null && (!Number.isFinite(quantity) || quantity < 0)) {
      setMessage("Ilość musi być liczbą 0 lub większą.", "error");
      return;
    }

    if (!allowedUnits.includes(unit)) {
      setMessage("Wybierz poprawną jednostkę.", "error");
      return;
    }

    setMessage(editId ? "Zapisywanie zmian..." : "Dodawanie pozycji...");

    try {
      if (editId) {
        const { data: existing, error: existingError } = await client
          .from("checklist_items")
          .select("done")
          .eq("id", Number(editId))
          .single();

        if (existingError) throw existingError;

        const { error } = await client
          .from("checklist_items")
          .update({
            category,
            item_name: itemName,
            quantity,
            unit,
            done: Boolean(existing?.done)
          })
          .eq("id", Number(editId));

        if (error) throw error;
        setMessage("Zmiany zapisane.", "success");
      } else {
        const { error } = await client
          .from("checklist_items")
          .insert([{
            category,
            item_name: itemName,
            quantity,
            unit,
            done: false
          }]);

        if (error) throw error;
        setMessage("Pozycja została dodana.", "success");
      }

      form.reset();
      if ($("edit-check-id")) $("edit-check-id").value = "";
      if ($("checklist-form-title")) $("checklist-form-title").textContent = "Dodaj pozycję";
      if ($("save-check-btn")) $("save-check-btn").textContent = "Dodaj pozycję";
      if ($("cancel-edit-check-btn")) $("cancel-edit-check-btn").classList.add("hidden");

      if (typeof renderChecklistPage === "function") {
        await renderChecklistPage();
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error(error);
      setMessage(editId ? "Nie udało się zapisać zmian." : "Nie udało się dodać pozycji.", "error");
    }
  }

  function enhanceNavigationIcons() {
    const nav = document.querySelector(".main-nav");
    if (nav) nav.classList.add("nav-iconized");
  }

  function bindRefreshButton() {
    $("refresh-weather-btn")?.addEventListener("click", function () {
      renderEnhancedWeatherPage();
    });
  }

  function bindChecklistFix() {
    const form = $("checklist-form");
    if (!form) return;
    form.addEventListener("submit", overrideChecklistSubmit, true);
  }

  function init() {
    enhanceNavigationIcons();
    bindChecklistFix();
    bindRefreshButton();

    if ($("weather-current-temp")) {
      renderEnhancedWeatherPage();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
