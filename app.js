// ====== CONFIG ======
const API_KEY = "ab4717d800b5dd2a669908cc1aa52334"; // ← الصق مفتاحك هنا
const CHECK_INTERVAL = 60 * 1000; // كل دقيقة

// ====== ELEMENTS ======
const statusEl = document.getElementById("status");
const btn = document.getElementById("notifyBtn");

// ====== NOTIFICATION ======
async function sendNotification(title, body) {
  if (Notification.permission !== "granted") return;

  new Notification(title, {
    body,
    icon: "https://cdn-icons-png.flaticon.com/512/190/190411.png",
    vibrate: [200, 100, 200]
  });
}

// ====== FETCH LIVE MATCHES ======
async function fetchLiveMatches() {
  const url = "https://v3.football.api-sports.io/fixtures?live=all";

  const res = await fetch(url, {
    headers: {
      "x-apisports-key": API_KEY
    }
  });

  const data = await res.json();
  return data.response || [];
}

// ====== CHECK CONDITIONS ======
async function checkMatches() {
  try {
    const matches = await fetchLiveMatches();
    statusEl.textContent = `جاري الفحص: ${matches.length} مباراة حيّة`;

    matches.forEach(match => {
      const home = match.teams.home.name;
      const away = match.teams.away.name;

      const stats = match.statistics || [];
      if (stats.length < 2) return;

      const homeStats = stats[0].statistics;
      const awayStats = stats[1].statistics;

      const getStat = (arr, name) =>
        Number(arr.find(s => s.type === name)?.value || 0);

      const homeXG = getStat(homeStats, "Expected Goals");
      const awayXG = getStat(awayStats, "Expected Goals");
      const homeSOT = getStat(homeStats, "Shots on Goal");
      const awaySOT = getStat(awayStats, "Shots on Goal");

      if (
        homeXG >= 1 ||
        awayXG >= 1 ||
        homeXG + awayXG >= 1.5 ||
        homeSOT >= 5 ||
        awaySOT >= 5
      ) {
        sendNotification(
          "🚨 فرصة هدف قوية",
          `${home} vs ${away}\n` +
          `xG: ${homeXG} - ${awayXG}\n` +
          `SOT: ${homeSOT} - ${awaySOT}`
        );
      }
    });

  } catch (e) {
    statusEl.textContent = "❌ خطأ في جلب البيانات";
    console.error(e);
  }
}

// ====== START ======
btn.onclick = async () => {
  if (Notification.permission !== "granted") {
    await Notification.requestPermission();
  }

  statusEl.textContent = "✅ النظام يعمل – يتم الفحص كل دقيقة";
  setInterval(checkMatches, CHECK_INTERVAL);
};
