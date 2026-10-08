// ===== State =====
const load = (k, d) => JSON.parse(localStorage.getItem(k)) || d;
let schedules = load("ss_schedules", [
  {
    id: 1,
    title: "Lập trình Web",
    room: "Phòng A201",
    type: "study",
    start: "07:30",
    end: "11:00",
  },
  {
    id: 2,
    title: "Nghỉ trưa & ăn uống",
    room: "Căn tin",
    type: "rest",
    start: "11:05",
    end: "12:00",
  },
]);
let tasks = load("ss_tasks", [
  {
    id: 1,
    name: "Báo cáo đồ án Web PHP",
    priority: 1,
    deadline: "2026-10-10T23:59",
    alarm: "2026-10-10T20:00",
    completed: false,
  },
  {
    id: 2,
    name: "Ôn tập lý thuyết CSDL",
    priority: 3,
    deadline: "2026-10-15T18:00",
    alarm: "",
    completed: false,
  },
]);
const triggeredAlarms = new Set();
let audioCtx = null;
const $ = (id) => document.getElementById(id);
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
// Icon vẽ sẵn bằng SVG, không cần tải thư viện bên ngoài
const ICONS = {
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  "bell-ring":
    '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/><path d="M4 2C2.8 3.7 2 5.7 2 8"/><path d="M22 8c0-2.3-.8-4.3-2-6"/>',
  sparkles:
    '<path d="M11 3l1.9 5.1L18 10l-5.1 1.9L11 17l-1.9-5.1L4 10l5.1-1.9z"/><path d="M19 15v4"/><path d="M17 17h4"/>',
  loader: '<path d="M21 12a9 9 0 1 1-6.2-8.55"/>',
};
const icons = () => {
  document.querySelectorAll("i[data-icon]").forEach((el) => {
    const svg = `<svg class="icon ${el.className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[el.dataset.icon] || ""}</svg>`;
    el.outerHTML = svg;
  });
};
const saveData = () => {
  localStorage.setItem("ss_schedules", JSON.stringify(schedules));
  localStorage.setItem("ss_tasks", JSON.stringify(tasks));
};

document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  renderSchedules();
  renderTasks();
  initClock();
  icons();
});

// ===== Clock & alarms =====
function initClock() {
  const update = () => {
    const now = new Date();
    $("live-time").textContent = now.toTimeString().split(" ")[0];
    $("live-date").textContent = now.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    updateNowMarker(now);
    checkAlarms(now);
  };
  update();
  setInterval(update, 1000);
}

// Giờ địa phương dạng YYYY-MM-DDTHH:MM (khớp với ô datetime-local)
function localISO(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function checkAlarms(now) {
  const current = localISO(now);
  tasks.forEach((t) => {
    const key = `task_${t.id}_${current}`;
    if (
      t.alarm &&
      !t.completed &&
      t.alarm.substring(0, 16) === current &&
      !triggeredAlarms.has(key)
    ) {
      triggeredAlarms.add(key);
      triggerAlarm(
        `Báo thức: ${t.name}`,
        `Hạn nộp: ${t.deadline.replace("T", " ")}`,
      );
    }
  });

  // Nhắc trước giờ học 5 phút
  const nowMin = now.getHours() * 60 + now.getMinutes();
  schedules.forEach((s) => {
    if (s.type !== "study") return;
    const left = toMin(s.start) - nowMin;
    const key = `class_${s.id}_${current.substring(0, 10)}`;
    if (left > 0 && left <= 5 && !triggeredAlarms.has(key)) {
      triggeredAlarms.add(key);
      const when = left === 5 ? "5 phút nữa" : `${left} phút nữa`;
      const room = s.room && s.room !== "N/A" ? ` tại ${s.room}` : "";
      triggerAlarm(
        "Sắp đến giờ học",
        `Lớp "${s.title}" sẽ bắt đầu trong ${when} (${s.start})${room}. Chuẩn bị đồ và di chuyển thôi!`,
      );
    }
  });
}

// Thông báo của trình duyệt (hiện cả khi bạn đang ở tab khác)
function askNotify() {
  if ("Notification" in window && Notification.permission === "default")
    Notification.requestPermission();
}
function notifyBrowser(title, body) {
  if ("Notification" in window && Notification.permission === "granted")
    new Notification(title, { body });
}

// ===== Chuông: lặp liên tục đến khi bấm tắt =====
let ringTimer = null;

function beep() {
  audioCtx =
    audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(880, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.9);
}

function loopBeep() {
  try {
    beep();
  } catch (e) {
    /* bị chặn âm thanh thì bỏ qua */
  }
  ringTimer = setInterval(() => {
    try {
      beep();
    } catch (e) {}
  }, 1600);
}

function startRinging() {
  stopRinging();
  loopBeep();
}

function stopRinging() {
  clearInterval(ringTimer);
  ringTimer = null;
}

function triggerAlarm(title, desc) {
  const alreadyRinging = !$("alarm-modal").hidden;
  $("alarm-title").textContent = title;
  $("alarm-desc").textContent = desc;
  $("alarm-modal").hidden = false;
  if (!alreadyRinging) startRinging();
  notifyBrowser(title, desc);
  $("btn-stop-alarm").focus();
}

// ===== Events =====
function setupEventListeners() {
  $("btn-sound-test").addEventListener("click", () => {
    askNotify();
    triggerAlarm("Kiểm tra chuông", "Hệ thống báo thức hoạt động bình thường.");
  });
  $("btn-stop-alarm").addEventListener("click", () => {
    stopRinging();
    $("alarm-modal").hidden = true;
  });

  $("form-schedule").addEventListener("submit", (e) => {
    e.preventDefault();
    askNotify();
    schedules.push({
      id: Date.now(),
      title: $("sch-title").value,
      type: $("sch-type").value,
      room: $("sch-room").value || "N/A",
      start: $("sch-start").value,
      end: $("sch-end").value,
    });
    saveData();
    renderSchedules();
    e.target.reset();
  });

  $("form-task").addEventListener("submit", (e) => {
    e.preventDefault();
    tasks.push({
      id: Date.now(),
      name: $("task-name").value,
      priority: parseInt($("task-priority").value),
      deadline: $("task-deadline").value,
      alarm: $("task-alarm").value,
      completed: false,
    });
    saveData();
    renderTasks();
    e.target.reset();
  });

  $("btn-ai-generate").addEventListener("click", generateAISuggestion);
  // Xóa / tick bằng event delegation (không cần onclick trong HTML)
  $("schedule-container").addEventListener("click", (e) => {
    const b = e.target.closest("[data-del]");
    if (b) {
      schedules = schedules.filter((s) => s.id !== +b.dataset.del);
      saveData();
      renderSchedules();
    }
  });
  $("task-container").addEventListener("click", (e) => {
    const del = e.target.closest("[data-del]");
    if (del) {
      tasks = tasks.filter((t) => t.id !== +del.dataset.del);
      saveData();
      renderTasks();
    }
  });
  $("task-container").addEventListener("change", (e) => {
    const t = tasks.find((x) => x.id === +e.target.dataset.toggle);
    if (t) {
      t.completed = !t.completed;
      saveData();
      renderTasks();
    }
  });
}

// ===== Timeline 6:00 - 22:00 =====
const T0 = 6 * 60,
  T1 = 22 * 60;
const toMin = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const pct = (min) => Math.max(0, Math.min(100, ((min - T0) / (T1 - T0)) * 100));

function renderTimeline() {
  let html = "";
  for (let h = 6; h <= 22; h += 2)
    html += `<span class="tl-hour" style="left:${pct(h * 60)}%">${h}h</span>`;
  schedules.forEach((s) => {
    const l = pct(toMin(s.start)),
      w = pct(toMin(s.end)) - l;
    if (w > 0)
      html += `<div class="tl-block ${s.type}" style="left:${l}%;width:${w}%" title="${esc(s.title)} (${s.start}-${s.end})">${esc(s.title)}</div>`;
  });
  html += `<div class="tl-now" id="tl-now" hidden></div>`;
  $("timeline").innerHTML = html;
  updateNowMarker(new Date());
}

function updateNowMarker(now) {
  const el = $("tl-now");
  if (!el) return;
  const m = now.getHours() * 60 + now.getMinutes();
  el.hidden = m < T0 || m > T1;
  el.style.left = pct(m) + "%";
}

// ===== Render lists =====
function renderSchedules() {
  $("schedule-count").textContent = `${schedules.length} mục`;
  schedules.sort((a, b) => a.start.localeCompare(b.start));
  $("schedule-container").innerHTML = schedules.length
    ? schedules
        .map(
          (s) => `
      <div class="item ${s.type}">
        <div class="item-body">
          <h4>${esc(s.title)}</h4>
          <div class="meta"><span>${s.start} – ${s.end}</span><span>${esc(s.room)}</span><span>${s.type === "rest" ? "Giờ nghỉ" : "Ca học"}</span></div>
        </div>
        <button class="del" data-del="${s.id}" aria-label="Xóa ${esc(s.title)}">Xóa</button>
      </div>`,
        )
        .join("")
    : `<p class="empty">Chưa có lịch trình nào. Hãy thêm môn học đầu tiên ở khung bên trái.</p>`;
  renderTimeline();
  icons();
}

function renderTasks() {
  $("task-count").textContent = `${tasks.length} task`;
  tasks.sort(
    (a, b) =>
      a.priority - b.priority || new Date(a.deadline) - new Date(b.deadline),
  );
  const label = {
    1: "Mức 1 · Đột xuất",
    2: "Mức 2 · Quan trọng",
    3: "Mức 3 · Trung bình",
    4: "Mức 4 · Nhẹ",
  };
  const now = new Date();
  $("task-container").innerHTML = tasks.length
    ? tasks
        .map((t) => {
          const late = !t.completed && new Date(t.deadline) < now;
          return `
      <div class="item p${t.priority} ${t.completed ? "done" : ""}">
        <input type="checkbox" class="check" data-toggle="${t.id}" ${t.completed ? "checked" : ""} aria-label="Hoàn thành ${esc(t.name)}" />
        <div class="item-body">
          <h4>${esc(t.name)}</h4>
          <div class="meta">
            <span>${label[t.priority]}</span>
            <span class="${late ? "late" : ""}">${late ? "Quá hạn: " : "Hạn: "}${t.deadline.replace("T", " ")}</span>
            ${t.alarm ? `<span>Báo thức ${t.alarm.replace("T", " ")}</span>` : ""}
          </div>
        </div>
        <button class="del" data-del="${t.id}" aria-label="Xóa ${esc(t.name)}">Xóa</button>
      </div>`;
        })
        .join("")
    : `<p class="empty">Chưa có task nào. Thêm một deadline để bắt đầu theo dõi.</p>`;
  icons();
}

// ===== Gợi ý thông minh: thời tiết + lịch học + task (không cần API key) =====
const RAIN_CODES = [
  51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99,
];
const fmtMin = (m) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

// Lấy thời tiết hôm nay theo vị trí người dùng (Open-Meteo, miễn phí). Lỗi thì trả null.
async function getWeather() {
  try {
    const pos = await new Promise((ok, no) =>
      navigator.geolocation.getCurrentPosition(ok, no, { timeout: 6000 }),
    );
    const { latitude, longitude } = pos.coords;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&hourly=precipitation_probability&timezone=auto&forecast_days=1`;
    const d = await (await fetch(url)).json();
    return {
      temp: d.current.temperature_2m,
      code: d.current.weather_code,
      rain: d.hourly.precipitation_probability,
    };
  } catch (err) {
    return null;
  }
}

function buildAdvice(w) {
  const tips = [];
  const now = new Date();
  const study = schedules
    .filter((s) => s.type === "study")
    .sort((a, b) => a.start.localeCompare(b.start));
  const raining = w && RAIN_CODES.includes(w.code);

  // 1. Thời tiết
  if (w) {
    const from = study.length
      ? Math.max(0, Math.floor(toMin(study[0].start) / 60) - 1)
      : 6;
    const to = study.length
      ? Math.min(23, Math.ceil(toMin(study[study.length - 1].end) / 60))
      : 22;
    const chance = Math.max(...w.rain.slice(from, to + 1));
    tips.push([
      "Thời tiết",
      `Hiện ${Math.round(w.temp)}°C, khả năng mưa trong khung giờ của bạn khoảng ${chance}%.`,
    ]);
    if (study.length && (raining || chance >= 60)) {
      tips.push([
        "Trời mưa",
        `Hãy xuất phát sớm hơn 15–20 phút trước ca "${esc(study[0].title)}" (${study[0].start}), đi chậm và mang áo mưa. Nếu bị trễ một chút, báo giảng viên thay vì chạy vội.`,
      ]);
    }
    if (w.temp >= 34)
      tips.push([
        "Trời nóng",
        "Mang theo nước, tránh di chuyển ngoài trời từ 11h đến 15h.",
      ]);
  } else {
    tips.push([
      "Thời tiết",
      "Chưa lấy được thời tiết (hãy cho phép truy cập vị trí và kiểm tra kết nối). Các gợi ý bên dưới vẫn dựa trên lịch của bạn.",
    ]);
  }

  // 2. Ngày trống: gợi ý đi chơi hoặc nghỉ ngơi
  if (!study.length) {
    if (raining)
      tips.push([
        "Hôm nay không có ca học",
        "Trời mưa nên hợp để nghỉ ngơi: ngủ bù, đọc sách, hoặc ghé quán cà phê / thư viện, rạp phim.",
      ]);
    else if (w && w.temp >= 34)
      tips.push([
        "Hôm nay không có ca học",
        "Trời nóng, nên chọn nơi có điều hòa như quán cà phê, trung tâm thương mại. Đi dạo công viên để buổi chiều tối cho mát.",
      ]);
    else
      tips.push([
        "Hôm nay không có ca học",
        "Trời khá đẹp, bạn có thể đi dạo công viên, đạp xe hoặc gặp bạn bè. Dành một khoảng ngắn cho task quan trọng nhất trước khi đi.",
      ]);
  }

  // 3. Khoảng trống giữa các ca
  for (let i = 0; i < study.length - 1; i++) {
    const gap = toMin(study[i + 1].start) - toMin(study[i].end);
    if (gap >= 60)
      tips.push([
        "Khoảng trống giữa ca",
        `Từ ${study[i].end} đến ${study[i + 1].start} bạn rảnh ${gap} phút: ăn nhẹ và chợp mắt 20 phút.`,
      ]);
    else if (gap >= 10)
      tips.push([
        "Nghỉ giữa ca",
        `Sau "${esc(study[i].title)}" có ${gap} phút: uống nước và vươn vai.`,
      ]);
  }

  // 4. Học liên tục quá lâu
  let start = null,
    end = null;
  const flush = () => {
    if (start !== null && end - start > 180)
      tips.push([
        "Học liên tục lâu",
        `Bạn học liền từ ${fmtMin(start)} đến ${fmtMin(end)} (${Math.round(((end - start) / 60) * 10) / 10} giờ). Hãy giãn cổ, vai, lưng 3–5 phút giữa chừng.`,
      ]);
  };
  study.forEach((s) => {
    const a = toMin(s.start),
      b = toMin(s.end);
    if (start !== null && a - end < 15) end = Math.max(end, b);
    else {
      flush();
      start = a;
      end = b;
    }
  });
  flush();

  // 5. Task
  const open = tasks.filter((t) => !t.completed);
  const late = open.filter((t) => new Date(t.deadline) < now);
  const urgent = open.filter((t) => {
    const h = (new Date(t.deadline) - now) / 36e5;
    return h >= 0 && h <= 24;
  });
  if (late.length)
    tips.push([
      "Task quá hạn",
      `${late.length} task đã quá hạn (${late.map((t) => esc(t.name)).join(", ")}). Xử lý hoặc xin dời hạn trước.`,
    ]);
  if (urgent.length)
    tips.push([
      "Sắp đến hạn",
      `${urgent.length} task hết hạn trong 24 giờ tới: ${urgent.map((t) => esc(t.name)).join(", ")}. Chia thành các phiên 25 phút học, 5 phút nghỉ.`,
    ]);
  else if (open.some((t) => t.priority === 1))
    tips.push([
      "Task ưu tiên",
      "Bạn có task mức 1 chưa xong. Làm nó vào lúc đầu óc tỉnh táo nhất trong ngày.",
    ]);

  if (
    !study.some((s) => s.type === "rest") &&
    !schedules.some((s) => s.type === "rest") &&
    study.length
  )
    tips.push([
      "Chưa có giờ nghỉ",
      "Lịch hôm nay chưa có giờ nghỉ nào. Hãy thêm ít nhất một khoảng nghỉ để tránh kiệt sức.",
    ]);

  return tips;
}

async function generateAISuggestion() {
  const box = $("ai-suggestion-box");
  box.innerHTML = `<div class="loading"><i data-icon="loader" class="spin"></i><span>Đang xem thời tiết và phân tích lịch của bạn...</span></div>`;
  icons();
  const tips = buildAdvice(await getWeather());
  box.innerHTML = tips
    .map(([title, text]) => `<p><strong>${title}:</strong> ${text}</p>`)
    .join("");
}
