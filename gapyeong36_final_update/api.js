function formatDateYYYYMMDD(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function getCurrentYear() {
  return String(new Date().getFullYear());
}

function cleanMealText(text) {
  return text
    .split("<br/>")
    .map(item => item.replace(/\([^)]*\)/g, "").trim())
    .filter(Boolean);
}

async function fetchMealData(date = new Date()) {
  const mlsvYmd = formatDateYYYYMMDD(date);
  const url =
    `https://open.neis.go.kr/hub/mealServiceDietInfo` +
    `?KEY=${CONFIG.neis.key}` +
    `&Type=json` +
    `&pIndex=1&pSize=10` +
    `&ATPT_OFCDC_SC_CODE=${CONFIG.neis.officeCode}` +
    `&SD_SCHUL_CODE=${CONFIG.neis.schoolCode}` +
    `&MLSV_YMD=${mlsvYmd}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("급식 API 요청 실패");
  const data = await res.json();

  if (!data.mealServiceDietInfo || data.mealServiceDietInfo.length < 2) return [];
  const rows = data.mealServiceDietInfo[1].row || [];
  if (!rows.length) return [];

  const lunch = rows.find(item => item.MMEAL_SC_CODE === "2") || rows[0];
  return cleanMealText(lunch.DDISH_NM || "");
}

async function fetchTimetableData(date = new Date()) {
  const year = getCurrentYear();
  const dateStr = formatDateYYYYMMDD(date);
  const url =
    `https://open.neis.go.kr/hub/hisTimetable` +
    `?KEY=${CONFIG.neis.key}` +
    `&Type=json` +
    `&pIndex=1&pSize=100` +
    `&ATPT_OFCDC_SC_CODE=${CONFIG.neis.officeCode}` +
    `&SD_SCHUL_CODE=${CONFIG.neis.schoolCode}` +
    `&AY=${year}` +
    `&GRADE=${CONFIG.school.grade}` +
    `&CLASS_NM=${CONFIG.school.classNo}` +
    `&ALL_TI_YMD=${dateStr}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("시간표 API 요청 실패");
  const data = await res.json();

  if (!data.hisTimetable || data.hisTimetable.length < 2) return [];
  const rows = data.hisTimetable[1].row || [];

  return rows
    .sort((a, b) => Number(a.PERIO) - Number(b.PERIO))
    .map(row => ({
      period: row.PERIO,
      subject: row.ITRT_CNTNT,
      room: row.CLRM_NM || "교실 정보 없음"
    }));
}

function getWeatherBaseDateTime(now = new Date()) {
  const base = new Date(now);
  if (base.getMinutes() < 40) base.setHours(base.getHours() - 1);

  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, "0");
  const d = String(base.getDate()).padStart(2, "0");
  const hh = String(base.getHours()).padStart(2, "0");

  return {
    base_date: `${y}${m}${d}`,
    base_time: `${hh}00`
  };
}

function weatherTextFromPTY(pty, rain1h) {
  const p = String(pty ?? "");
  if (p === "1") return "비";
  if (p === "2") return "비/눈";
  if (p === "3") return "눈";
  if (p === "4") return "소나기";
  if (rain1h && rain1h !== "0" && rain1h !== "강수없음") return "비";
  return "맑음";
}

function weatherEmojiFromText(text) {
  if (text.includes("눈")) return "❄️";
  if (text.includes("비")) return "🌧️";
  if (text.includes("소나기")) return "🌦️";
  return "☀️";
}

async function fetchWeatherNow() {
  const { base_date, base_time } = getWeatherBaseDateTime();
  const url =
    `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst` +
    `?serviceKey=${encodeURIComponent(CONFIG.weather.key)}` +
    `&pageNo=1&numOfRows=1000&dataType=JSON` +
    `&base_date=${base_date}` +
    `&base_time=${base_time}` +
    `&nx=${CONFIG.weather.nx}` +
    `&ny=${CONFIG.weather.ny}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("날씨 API 요청 실패");

  const data = await res.json();
  const items = data?.response?.body?.items?.item || [];
  if (!items.length) {
    const code = data?.response?.header?.resultCode;
    const msg = data?.response?.header?.resultMsg;
    throw new Error(`날씨 데이터 없음: ${code || ""} ${msg || ""}`.trim());
  }

  const valueOf = (category) => items.find(item => item.category === category)?.obsrValue ?? null;
  const temp = valueOf("T1H");
  const humidity = valueOf("REH");
  const windSpeed = valueOf("WSD");
  const rain1h = valueOf("RN1");
  const pty = valueOf("PTY");
  const status = weatherTextFromPTY(pty, rain1h);

  return {
    temp,
    humidity,
    windSpeed,
    rain1h,
    status,
    emoji: weatherEmojiFromText(status),
    locationName: CONFIG.weather.locationName
  };
}
