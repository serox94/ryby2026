const TRIP_START = new Date("2026-06-20T14:00:00");
const TRIP_END = new Date("2026-06-27T10:00:00");
const PB_TARGET = 20;

const sampleCatches = [
  {
    person: "Patryk",
    species: "Karp",
    weight: 14.2,
    bait: "Scopex",
    spot: "Spot 3",
    datetime: "2026-06-21 05:40"
  },
  {
    person: "Maciek",
    species: "Karp",
    weight: 11.8,
    bait: "Halibut",
    spot: "Spot 1",
    datetime: "2026-06-21 22:10"
  },
  {
    person: "Patryk",
    species: "Karp",
    weight: 16.7,
    bait: "Scopex",
    spot: "Spot 3",
    datetime: "2026-06-22 04:55"
  }
];

function updateCountdown() {
  const countdownEl = document.getElementById("countdown");
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

function getStats(data) {
  const totalWeight = data.reduce((sum, item) => sum + item.weight, 0);
  const totalFish = data.length;

  const biggestFishItem = data.reduce((max, item) => {
    if (!max || item.weight > max.weight) return item;
    return max;
  }, null);

  const bestSpotMap = {};
  data.forEach(item => {
    bestSpotMap[item.spot] = (bestSpotMap[item.spot] || 0) + 1;
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
    biggestFish: biggestFishItem ? `${biggestFishItem.weight.toFixed(1)} kg` : "Brak danych",
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

  const biggest = Math.max(...personData.map(item => item.weight));
  const total = personData.reduce((sum, item) => sum + item.weight, 0);
  const count = personData.length;

  const baitMap = {};
  const spotMap = {};

  personData.forEach(item => {
    baitMap[item.bait] = (baitMap[item.bait] || 0) + 1;
    spotMap[item.spot] = (spotMap[item.spot] || 0) + 1;
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

function updateDashboard() {
  const globalStats = getStats(sampleCatches);
  const patrykStats = getPersonStats(sampleCatches, "Patryk");
  const maciekStats = getPersonStats(sampleCatches, "Maciek");

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

  const lastEntry = sampleCatches[sampleCatches.length - 1];
  document.getElementById("last-entry").innerHTML = `
    <strong>${lastEntry.person}</strong> – ${lastEntry.species}<br>
    Waga: <strong>${lastEntry.weight.toFixed(1)} kg</strong><br>
    Przynęta: ${lastEntry.bait}<br>
    Spot: ${lastEntry.spot}<br>
    Data: ${lastEntry.datetime}
  `;
}

updateCountdown();
updateDashboard();
setInterval(updateCountdown, 30000);
