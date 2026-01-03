/**********************
 * CONFIG
 **********************/
const API_KEY = "ab4717d800b5dd2a669908cc1aa52334"; // ← ضع API KEY هنا
const CHECK_INTERVAL = 10 * 60 * 1000; // 10 دقائق
const API_URL = "https://v3.football.api-sports.io/fixtures?live=all";

/**********************
 * STATE
 **********************/
const alertedMatches = new Set();

/**********************
 * NOTIFICATIONS
 **********************/
function enableNotifications() {
  if (Notification.permission === "granted") return;
  Notification.requestPermission();
}

function sendNotification(title, body) {
  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "https://cdn-icons-png.flaticon.com/512/861/861512.png",
      requireInteraction: true
    });
  }
}

/**********************
 * MAIN LOGIC
 **********************/
async function checkLiveMatches() {
  try {
    const res = await fetch(API_URL, {
      headers: {
        "x-apisports-key": API_KEY
      }
    });

    if (!res.ok) return;

    const data = await res.json();
    const matches = data.response || [];

    if (matches.length === 0) {
      updateStatus("لا توجد مباريات حية");
      return;
    }

    updateStatus(`مباريات حية: ${matches.length}`);

    matches.forEach(match => {
      const id = match.fixture.id;
      if (alertedMatches.has(id)) return;

      const home = match.teams.home.name;
      const away = match.teams.away.name;

      const xgHome = match.statistics
        ?.find(s => s.team.id === match.teams.home.id)
        ?.statistics.find(x => x.type === "Expected Goals")?.value || 0;

      const xgAway = match.statistics
        ?.find(s => s.team.id === match.teams.away.id)
        ?.statistics.find(x => x.type === "Expected Goals")?.value || 0;

      const shotsHome = match.statistics
        ?.find(s => s.team.id === match.teams.home.id)
        ?.statistics.find(x => x.type === "Shots on Goal")?.value || 0;

      const shotsAway = match.statistics
        ?.find(s => s.team.id === match.teams.away.id)
        ?.statistics.find(x => x.type === "Shots on Goal")?.value || 0;

      const totalXG = xgHome + xgAway;

      if (
        xgHome >= 1 ||
        xgAway >= 1 ||
        totalXG >= 1.5 ||
        shotsHome >= 5 ||
        shotsAway >= 5
      ) {
        alertedMatches.add(id);

        sendNotification(
          "⚽ تنبيه ضغط هجومي",
          `${home} vs ${away}
xG: ${xgHome} - ${xgAway}
Shots on target: ${shotsHome} - ${shotsAway}`
        );
      }
    });

  } catch (err) {
    updateStatus("خطأ في الاتصال بالـ API");
  }
}

/**********************
 * UI
 **********************/
function updateStatus(text) {
  const el = document.getElementById("status");
  if (el) el.textContent = `الحالة: ${text}`;
}

/**********************
 * START
 **********************/
document.getElementById("enableBtn").addEventListener("click", () => {
  enableNotifications();
  checkLiveMatches();
  setInterval(checkLiveMatches, CHECK_INTERVAL);
  updateStatus("قيد التشغيل (فحص كل 10 دقائق)");
});
