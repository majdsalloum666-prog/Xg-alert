/***********************
 🔐 ضع API KEY هنا فقط
************************/
const API_KEY = "ab4717d800b5dd2a669908cc1aa52334";

/***********************
 ⚙️ الإعدادات
************************/
const CHECK_INTERVAL = 10 * 60 * 1000; // كل 10 دقائق
const XG_TEAM_ALERT = 1.0;
const XG_TOTAL_ALERT = 1.5;
const SHOTS_ON_TARGET_ALERT = 5;

let alertedMatches = new Set();

/***********************
 🔔 تفعيل الإشعارات
************************/
function enableNotifications() {
  Notification.requestPermission().then(permission => {
    if (permission === "granted") {
      document.getElementById("status").innerText = "الحالة: المراقبة بدأت";
      checkLiveMatches();
      setInterval(checkLiveMatches, CHECK_INTERVAL);
    } else {
      alert("يجب السماح بالإشعارات");
    }
  });
}

/***********************
 📡 جلب المباريات الحية
************************/
async function checkLiveMatches() {
  try {
    const res = await fetch(
      "https://v3.football.api-sports.io/fixtures?live=all",
      {
        headers: {
          "x-apisports-key": API_KEY
        }
      }
    );

    const data = await res.json();
    const fixtures = data.response;

    if (!fixtures || fixtures.length === 0) {
      document.getElementById("status").innerText = "لا توجد مباريات حية حالياً";
      return;
    }

    document.getElementById("status").innerText =
      `مباريات حية: ${fixtures.length}`;

    for (const match of fixtures) {
      await checkMatchStats(match);
    }

  } catch (err) {
    console.error(err);
  }
}

/***********************
 📊 فحص الإحصائيات
************************/
async function checkMatchStats(match) {
  const fixtureId = match.fixture.id;
  if (alertedMatches.has(fixtureId)) return;

  const res = await fetch(
    `https://v3.football.api-sports.io/fixtures/statistics?fixture=${fixtureId}`,
    {
      headers: {
        "x-apisports-key": API_KEY
      }
    }
  );

  const data = await res.json();
  const stats = data.response;
  if (!stats || stats.length < 2) return;

  const home = stats[0];
  const away = stats[1];

  const homeXG = getStat(home, "Expected Goals");
  const awayXG = getStat(away, "Expected Goals");

  const homeShots = getStat(home, "Shots on Target");
  const awayShots = getStat(away, "Shots on Target");

  const totalXG = homeXG + awayXG;

  if (
    homeXG >= XG_TEAM_ALERT ||
    awayXG >= XG_TEAM_ALERT ||
    totalXG >= XG_TOTAL_ALERT ||
    homeShots >= SHOTS_ON_TARGET_ALERT ||
    awayShots >= SHOTS_ON_TARGET_ALERT
  ) {
    sendNotification(match, homeXG, awayXG, homeShots, awayShots);
    alertedMatches.add(fixtureId);
  }
}

/***********************
 📈 استخراج القيم
************************/
function getStat(team, name) {
  const stat = team.statistics.find(s => s.type === name);
  return stat && stat.value ? Number(stat.value) : 0;
}

/***********************
 🔊 إرسال التنبيه
************************/
function sendNotification(match, hxg, axg, hs, as) {
  const title = "⚽ فرصة هدف قوية";
  const body =
    `${match.teams.home.name} vs ${match.teams.away.name}\n` +
    `xG: ${hxg} - ${axg}\n` +
    `Shots on target: ${hs} - ${as}`;

  new Notification(title, { body });
}
