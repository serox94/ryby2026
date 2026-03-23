const TRIP_START = new Date("2026-06-20T14:00:00");
const TRIP_END = new Date("2026-06-27T10:00:00");
const PB_TARGET = 20;

// Supabase
const SUPABASE_URL = "https://baiepgxqnppwokcmmpqw.supabase.co";
const SUPABASE_KEY = "sb_publishable_ziiHPrhOisVJXnUeOdI4ug_b4y4djws";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Fallback sample data if DB empty
const fallbackCatches = [
  {
    person: "Patryk",
    species: "Karp",
    weight: 14.2,
    bait: "Scopex",
    spot: "Spot 3",
    caught_at: "2026-06-21T05:40:00"
  },
  {
    person: "Maciek",
    species: "Karp",
    weight: 11.8,
    bait: "Halibut",
    spot: "Spot 1",
    caught_at: "2026-06-21T22:10:00"
  },
  {
    person: "Patryk",
    species: "Karp",
    weight: 16.7,
    bait: "Scopex",
    spot: "Spot 3",
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

function formatCaughtAt(value) {
  if (!value) return "Brak daty";
  const date = new Date(value);
  return date.toLocaleString("pl-PL");
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

async function loadCatchesFromSupabase() {
  const { data, error } = await supabaseClient
    .from("catches")
    .select("*")
    .order("caught_at", { ascending: false });

  if (error) {
    console.error("Błąd pobierania catches:", error);
    updateDashboard(fallbackCatches);
    return;
  }

  if (!data || data.length === 0) {
    updateDashboard(fallbackCatches);
    return;
  }

  updateDashboard(data);
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

async function init() {
  updateCountdown();
  setupMobileMenu();
  await seedSampleDataIfEmpty();
  await loadCatchesFromSupabase();
  setInterval(updateCountdown, 30000);
}

init();
