const MIN_MINUTE = 30;
const MIN_XG = 1.5;

// لمنع تكرار التنبيه لنفس المباراة
const alerted = new Set();

if (Notification.permission !== "granted") {
  Notification.requestPermission();
}

async function checkMatches() {
  console.log("جاري فحص المباريات...");
  // سنربط xG الحقيقي هنا في الخطوة القادمة
}

setInterval(checkMatches, 60000);
