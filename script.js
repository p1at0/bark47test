// -----------------------------
// Константы и настройки
// -----------------------------
const LS = {
  tgUser: "bark_tg_user",
  keys: "bark_keys",
  timer: "bark_timer",
};
const TG_BOT_USERNAME = "BARK47_Bot";
const VERIFY_URL = "/api/telegram-auth";

// -----------------------------
// Пасхалки: ключи
// -----------------------------
let foundKeys = JSON.parse(localStorage.getItem(LS.keys) || "[]");

// Долгий клик по подписи
(function setupLongPressKey() {
  const el = document.getElementById("unlockText");
  if (!el) return;
  let pressTimer;
  el.addEventListener("mousedown", () => {
    pressTimer = setTimeout(() => {
      unlockKey("longpress");
    }, 4700);
  });
  el.addEventListener("mouseup", () => clearTimeout(pressTimer));
  el.addEventListener("mouseleave", () => clearTimeout(pressTimer));
})();

// Ввод кода BARK47
(function setupCodeKey() {
  let buffer = "";
  document.addEventListener("keydown", (e) => {
    buffer += e.key.toUpperCase();
    if (buffer.includes("BARK47")) {
      unlockKey("code");
      buffer = "";
    }
    if (buffer.length > 6) buffer = buffer.slice(-6);
  });
})();

// Разблокировка ключа
function unlockKey(id) {
  if (foundKeys.includes(id)) return;
  foundKeys.push(id);
  localStorage.setItem(LS.keys, JSON.stringify(foundKeys));
  showToast(`Ключ найден! (${foundKeys.length}/2)`);

  if (foundKeys.length >= 2) {
    startTimer(11 * 3600 + 11 * 60 + 11); // 11:11:11
  }
}

// -----------------------------
// Таймер
// -----------------------------
let timerInterval = null;

function startTimer(seconds) {
  clearInterval(timerInterval);
  const end = Date.now() + seconds * 1000;
  localStorage.setItem(LS.timer, end);

  function update() {
    const left = Math.max(0, Math.floor((end - Date.now()) / 1000));
    const h = String(Math.floor(left / 3600)).padStart(2, "0");
    const m = String(Math.floor((left % 3600) / 60)).padStart(2, "0");
    const s = String(left % 60).padStart(2, "0");
    document.getElementById("timer").textContent = `${h}:${m}:${s}`;
    if (left <= 0) clearInterval(timerInterval);
  }
  update();
  timerInterval = setInterval(update, 1000);
}

// Восстановление таймера при загрузке
(function restoreTimer() {
  const end = parseInt(localStorage.getItem(LS.timer) || "0", 10);
  if (end && end > Date.now()) {
    const left = Math.floor((end - Date.now()) / 1000);
    startTimer(left);
  } else {
    document.getElementById("timer").textContent = "00:00:00";
  }
})();

// -----------------------------
// Telegram Login
// -----------------------------
function injectLoginWidget() {
  const host = document.getElementById("tgLogin");
  if (!host) return;
  host.innerHTML = "";
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://telegram.org/js/telegram-widget.js?22";
  s.setAttribute("data-telegram-login", TG_BOT_USERNAME);
  s.setAttribute("data-size", "medium");
  s.setAttribute("data-userpic", "true");
  s.setAttribute("data-onauth", "onTelegramAuth(user)");
  s.setAttribute("data-request-access", "write");
  host.appendChild(s);
}

function removeLoginWidget() {
  const host = document.getElementById("tgLogin");
  if (host) {
    host.innerHTML = "";
    host.classList.add("hidden");
  }
}

function renderUser(u) {
  removeLoginWidget();
  const box = document.getElementById("tgUser");
  const avatar = document.getElementById("avatar");
  const uname = document.getElementById("uname");
  const logout = document.getElementById("logout");

  const nick = u.username ? "@" + u.username : (u.first_name || "user");
  avatar.src = u.photo_url || "";
  avatar.alt = nick;
  uname.textContent = nick;
  uname.href = u.username ? `https://t.me/${u.username}` : "#";
  box.classList.remove("hidden");

  logout.onclick = () => {
    localStorage.removeItem(LS.tgUser);
    location.reload();
  };
}

async function verifyWithServer(data) {
  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw 0;
    const json = await res.json();
    return json && json.user;
  } catch (e) {
    return null;
  }
}

window.onTelegramAuth = async function (user) {
  const verified = await verifyWithServer(user);
  if (!verified) {
    showToast("Ошибка авторизации");
    return;
  }
  localStorage.setItem(LS.tgUser, JSON.stringify(verified));
  renderUser(verified);
};

(function initLogin() {
  const saved = localStorage.getItem(LS.tgUser);
  const u = saved ? JSON.parse(saved) : null;
  if (u) renderUser(u);
  else injectLoginWidget();
})();

// -----------------------------
// Вспомогательные функции
// -----------------------------
function showToast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add("show"), 10);
  setTimeout(() => {
    t.classList.remove("show");
    t.remove();
  }, 3000);
}
