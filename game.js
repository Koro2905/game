// ===== Супер Марио — платформер на Canvas =====

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;

// --- HUD ---
const coinsEl = document.getElementById("coins");
const livesEl = document.getElementById("lives");
const levelEl = document.getElementById("level");
const ammoEl = document.getElementById("ammo");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayText = document.getElementById("overlay-text");
const startBtn = document.getElementById("start-btn");

// --- Константы физики ---
const GRAVITY = 0.35;
const MOVE_SPEED = 3.2;
const JUMP_FORCE = 10;
const GROUND_Y = H - 50; // верх земли

// --- Состояние игры ---
let state = "menu"; // menu | playing | dead | win
let coins = 0;
let lives = 3;
let levelIndex = 0;
let cameraX = 0;

// --- Уровни: список платформ, монет, врагов, позиция флага ---
const LEVELS = [
  {
    width: 2400,
    platforms: [
      { x: 300, y: 320, w: 120, h: 20 },
      { x: 520, y: 250, w: 120, h: 20 },
      { x: 760, y: 320, w: 160, h: 20 },
      { x: 1050, y: 270, w: 120, h: 20 },
      { x: 1300, y: 200, w: 120, h: 20 },
      { x: 1550, y: 300, w: 200, h: 20 },
      { x: 1900, y: 250, w: 140, h: 20 },
    ],
    coins: [
      { x: 340, y: 280 }, { x: 380, y: 280 },
      { x: 560, y: 210 }, { x: 800, y: 280 },
      { x: 1090, y: 230 }, { x: 1340, y: 160 },
      { x: 1600, y: 260 }, { x: 1650, y: 260 },
      { x: 1950, y: 210 }, { x: 2150, y: 360 },
    ],
    enemies: [
      { x: 780, y: GROUND_Y - 28, dir: -1, range: [700, 900] },
      { x: 1580, y: 280 - 28, dir: 1, range: [1550, 1740] },
      { x: 2000, y: GROUND_Y - 28, dir: -1, range: [1850, 2200] },
    ],
    ammoPickups: [
      { x: 450, y: GROUND_Y - 20 },
      { x: 1130, y: 250 },
      { x: 1700, y: GROUND_Y - 20 },
      { x: 2100, y: GROUND_Y - 20 },
    ],
    flag: { x: 2300, y: GROUND_Y - 120 },
  },
  {
    width: 2800,
    platforms: [
      { x: 250, y: 300, w: 100, h: 20 },
      { x: 420, y: 230, w: 100, h: 20 },
      { x: 600, y: 160, w: 100, h: 20 },
      { x: 850, y: 300, w: 140, h: 20 },
      { x: 1100, y: 240, w: 100, h: 20 },
      { x: 1300, y: 180, w: 100, h: 20 },
      { x: 1500, y: 300, w: 120, h: 20 },
      { x: 1750, y: 230, w: 100, h: 20 },
      { x: 2000, y: 170, w: 100, h: 20 },
      { x: 2250, y: 280, w: 180, h: 20 },
    ],
    coins: [
      { x: 280, y: 260 }, { x: 450, y: 190 }, { x: 630, y: 120 },
      { x: 890, y: 260 }, { x: 1130, y: 200 }, { x: 1330, y: 140 },
      { x: 1540, y: 260 }, { x: 1780, y: 190 }, { x: 2030, y: 130 },
      { x: 2300, y: 240 }, { x: 2350, y: 240 }, { x: 2600, y: 360 },
    ],
    enemies: [
      { x: 880, y: 300 - 28, dir: 1, range: [850, 980] },
      { x: 1520, y: 300 - 28, dir: -1, range: [1500, 1610] },
      { x: 1400, y: GROUND_Y - 28, dir: -1, range: [1000, 1700] },
      { x: 2300, y: 280 - 28, dir: 1, range: [2250, 2420] },
    ],
    ammoPickups: [
      { x: 700, y: GROUND_Y - 20 },
      { x: 1200, y: 220 },
      { x: 1900, y: GROUND_Y - 20 },
      { x: 2500, y: GROUND_Y - 20 },
    ],
    flag: { x: 2700, y: GROUND_Y - 120 },
  },
];

// --- Игрок ---
const player = {
  x: 50, y: 0, w: 28, h: 40,
  vx: 0, vy: 0,
  onGround: false,
  facing: 1,
};

// --- Текущие объекты уровня (копии, чтобы можно было перезапускать) ---
let platforms = [];
let coinObjs = [];
let enemies = [];
let bullets = [];
let ammoObjs = [];
let flag = null;
let levelWidth = 0;
let ammo = 10;

const BULLET_SPEED = 9;
const DEATH_FRAMES = 12;
const START_AMMO = 10;

// Убить врага с запуском анимации смерти
function killEnemy(e) {
  if (!e.alive) return;
  e.alive = false;
  e.dying = true;
  e.deathTimer = DEATH_FRAMES;
  coins++; // бонус за убийство
  coinsEl.textContent = coins;
}

// --- Управление ---
const keys = {};
const justPressed = {};
document.addEventListener("keydown", (e) => {
  if (!keys[e.code]) justPressed[e.code] = true;
  keys[e.code] = true;
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
    e.preventDefault();
  }
  if (e.code === "KeyR" && state === "playing") resetLevel();
});
document.addEventListener("keyup", (e) => { keys[e.code] = false; });

// --- Загрузка уровня ---
function loadLevel(idx) {
  const lvl = LEVELS[idx];
  levelWidth = lvl.width;
  platforms = lvl.platforms.map((p) => ({ ...p }));
  coinObjs = lvl.coins.map((c) => ({ ...c, collected: false }));
  enemies = lvl.enemies.map((e) => ({ ...e, alive: true, x0: e.x }));
  ammoObjs = (lvl.ammoPickups || []).map((a) => ({ ...a, collected: false }));
  bullets = [];
  ammo = START_AMMO;
  flag = { ...lvl.flag, reached: false };
  resetPlayer();
  cameraX = 0;
}

function resetPlayer() {
  player.x = 50;
  player.y = GROUND_Y - player.h;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.facing = 1;
}

// Перезапуск текущего уровня (после смерти, если остались жизни)
function resetLevel() {
  loadLevel(levelIndex);
  state = "playing";
  hideOverlay();
}

// --- Логика обновления ---
function update() {
  if (state !== "playing") return;

  // Горизонтальное движение
  let moving = false;
  if (keys["ArrowLeft"] || keys["KeyA"]) {
    player.vx = -MOVE_SPEED;
    player.facing = -1;
    moving = true;
  }
  if (keys["ArrowRight"] || keys["KeyD"]) {
    player.vx = MOVE_SPEED;
    player.facing = 1;
    moving = true;
  }
  if (!moving) player.vx *= 0.7; // трение

  // Прыжок
  if ((keys["Space"] || keys["ArrowUp"] || keys["KeyW"]) && player.onGround) {
    player.vy = -JUMP_FORCE;
    player.onGround = false;
  }

  // Стрельба из пистолета (F или X) — один клик, одна пуля
  if ((justPressed["KeyF"] || justPressed["KeyX"]) && ammo > 0) {
    const muzzleX = player.facing === 1 ? player.x + player.w : player.x;
    bullets.push({
      x: muzzleX,
      y: player.y + 22,
      vx: BULLET_SPEED * player.facing,
    });
    ammo--;
    ammoEl.textContent = ammo;
  }
  justPressed["KeyF"] = false;
  justPressed["KeyX"] = false;

  // Подбор патронов
  for (const a of ammoObjs) {
    if (a.collected) continue;
    if (rectsOverlap(player.x, player.y, player.w, player.h, a.x - 10, a.y - 10, 20, 20)) {
      a.collected = true;
      ammo += 5;
      ammoEl.textContent = ammo;
    }
  }

  // Движение пуль и попадание по врагам
  for (const b of bullets) {
    b.x += b.vx;
    for (const e of enemies) {
      if (!e.alive) continue;
      if (rectsOverlap(b.x, b.y, 8, 4, e.x, e.y, 28, 28)) {
        killEnemy(e);
        b.dead = true;
      }
    }
  }
  // Убираем пули, вылетевшие за экран или попавшие во врага
  bullets = bullets.filter(
    (b) => !b.dead && b.x > cameraX - 50 && b.x < cameraX + W + 50
  );

  // Гравитация
  player.vy += GRAVITY;
  if (player.vy > 18) player.vy = 18;

  // Перемещение по X с проверкой границ
  player.x += player.vx;
  if (player.x < 0) player.x = 0;
  if (player.x + player.w > levelWidth) player.x = levelWidth - player.w;

  // Перемещение по Y
  player.y += player.vy;
  player.onGround = false;

  // Столкновение с землёй
  if (player.y + player.h >= GROUND_Y) {
    player.y = GROUND_Y - player.h;
    player.vy = 0;
    player.onGround = true;
  }

  // Столкновение с платформами (приземление сверху)
  for (const p of platforms) {
    const overlapX = player.x + player.w > p.x && player.x < p.x + p.w;
    const wasAbove = player.y + player.h - player.vy <= p.y + 1;
    if (overlapX && wasAbove && player.y + player.h >= p.y && player.y + player.h <= p.y + p.h + 10) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.onGround = true;
    }
  }

  // Сбор монет
  for (const c of coinObjs) {
    if (c.collected) continue;
    if (rectsOverlap(player.x, player.y, player.w, player.h, c.x - 10, c.y - 10, 20, 20)) {
      c.collected = true;
      coins++;
      coinsEl.textContent = coins;
    }
  }

  // Враги
  for (const e of enemies) {
    // Проигрывание анимации смерти
    if (e.dying) {
      e.deathTimer--;
      if (e.deathTimer <= 0) e.dying = false;
      continue;
    }
    if (!e.alive) continue;

    e.x += e.dir * 1.2;
    if (e.x < e.range[0] || e.x > e.range[1]) e.dir *= -1;

    if (rectsOverlap(player.x, player.y, player.w, player.h, e.x, e.y, 28, 28)) {
      // Прыжок сверху убивает врага
      if (player.vy > 0 && player.y + player.h - player.vy <= e.y + 10) {
        killEnemy(e);
        player.vy = -JUMP_FORCE * 0.6;
      } else {
        die();
        return;
      }
    }
  }

  // Падение в пропасть (тут пропастей нет, но на всякий случай)
  if (player.y > H + 100) {
    die();
    return;
  }

  // Флаг — победа на уровне
  if (rectsOverlap(player.x, player.y, player.w, player.h, flag.x, flag.y, 12, 120)) {
    nextLevel();
    return;
  }

  // Камера следует за игроком
  cameraX = player.x - W / 3;
  if (cameraX < 0) cameraX = 0;
  if (cameraX > levelWidth - W) cameraX = levelWidth - W;
}

function die() {
  lives--;
  livesEl.textContent = lives;
  if (lives <= 0) {
    state = "dead";
    showOverlay("ИГРА ОКОНЧЕНА", `Ты собрал ${coins} монет. Попробуй ещё раз!`, "Заново");
  } else {
    resetPlayer();
  }
}

function nextLevel() {
  levelIndex++;
  if (levelIndex >= LEVELS.length) {
    state = "win";
    showOverlay("ПОБЕДА! 🎉", `Ты прошёл все уровни и собрал ${coins} монет!`, "Играть снова");
  } else {
    levelEl.textContent = levelIndex + 1;
    state = "levelclear";
    showOverlay("УРОВЕНЬ ПРОЙДЕН!", `Монет собрано: ${coins}`, "Дальше");
  }
}

// --- Отрисовка ---
function draw() {
  ctx.clearRect(0, 0, W, H);

  // Небо градиентом уже задано фоном canvas; нарисуем облака
  drawClouds();

  // Уровень ещё не загружен (меню / экран окончания) — рисуем только небо
  if (!flag) return;

  ctx.save();
  ctx.translate(-cameraX, 0);

  // Земля
  ctx.fillStyle = "#c84c0c";
  ctx.fillRect(0, GROUND_Y, levelWidth, H - GROUND_Y);
  ctx.fillStyle = "#00a800";
  ctx.fillRect(0, GROUND_Y, levelWidth, 12);

  // Платформы
  for (const p of platforms) {
    ctx.fillStyle = "#d97706";
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = "#92400e";
    ctx.fillRect(p.x, p.y + p.h - 4, p.w, 4);
    // кирпичики
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    for (let bx = p.x; bx < p.x + p.w; bx += 20) {
      ctx.strokeRect(bx, p.y, 20, p.h);
    }
  }

  // Монеты
  for (const c of coinObjs) {
    if (c.collected) continue;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 9, 0, Math.PI * 2);
    ctx.fillStyle = "#ffd700";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#b8860b";
    ctx.stroke();
    ctx.fillStyle = "#b8860b";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("$", c.x - 3, c.y + 4);
  }

  // Ящики с патронами
  for (const a of ammoObjs) {
    if (a.collected) continue;
    ctx.fillStyle = "#5a2d0c";
    ctx.fillRect(a.x - 10, a.y - 10, 20, 20);
    ctx.fillStyle = "#ffcf33";
    ctx.fillRect(a.x - 7, a.y - 7, 14, 14);
    ctx.fillStyle = "#333";
    ctx.font = "bold 10px sans-serif";
    ctx.fillText("+5", a.x - 7, a.y + 4);
  }

  // Враги (грибы-гумбы)
  for (const e of enemies) {
    if (e.dying) {
      // прогресс анимации: 0 -> 1
      const t = 1 - e.deathTimer / DEATH_FRAMES;
      drawEnemy(e.x, e.y, t);
    } else if (e.alive) {
      drawEnemy(e.x, e.y, 0);
    }
  }

  // Флаг
  drawFlag(flag.x, flag.y);

  // Пули
  for (const b of bullets) {
    ctx.fillStyle = "#ffcf33";
    ctx.fillRect(b.x, b.y, 8, 4);
    ctx.fillStyle = "rgba(255,150,0,0.5)";
    ctx.fillRect(b.x - b.vx, b.y + 1, 6, 2); // след
  }

  // Игрок
  drawPlayer();

  ctx.restore();
}

function drawClouds() {
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  const offset = cameraX * 0.3;
  for (let i = 0; i < 8; i++) {
    const cx = ((i * 350 - offset) % (levelWidth + 400) + (levelWidth + 400)) % (levelWidth + 400) - 100;
    const cy = 50 + (i % 3) * 30;
    cloud(cx, cy);
  }
}

function cloud(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.arc(x + 22, y + 4, 22, 0, Math.PI * 2);
  ctx.arc(x + 48, y, 18, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer() {
  const { x, y, w, h } = player;
  // тело (комбинезон)
  ctx.fillStyle = "#0066cc";
  ctx.fillRect(x, y + 18, w, h - 18);
  // рубашка/руки
  ctx.fillStyle = "#e63946";
  ctx.fillRect(x, y + 14, w, 10);
  // голова/лицо
  ctx.fillStyle = "#ffcc99";
  ctx.fillRect(x + 4, y, w - 8, 16);
  // кепка (чёрная)
  ctx.fillStyle = "#111";
  ctx.fillRect(x + 2, y, w - 4, 6);
  ctx.fillRect(x + (player.facing === 1 ? w - 6 : -2), y + 2, 8, 4);
  // глаз
  ctx.fillStyle = "#000";
  ctx.fillRect(x + (player.facing === 1 ? w - 12 : 8), y + 6, 3, 3);
  // ботинки
  ctx.fillStyle = "#5a2d0c";
  ctx.fillRect(x, y + h - 5, w, 5);

  // пистолет в руке (смотрит в сторону facing)
  ctx.fillStyle = "#333";
  if (player.facing === 1) {
    ctx.fillRect(x + w - 2, y + 20, 12, 5);   // ствол
    ctx.fillRect(x + w - 2, y + 24, 5, 7);     // рукоять
  } else {
    ctx.fillRect(x - 10, y + 20, 12, 5);
    ctx.fillRect(x - 3, y + 24, 5, 7);
  }
}

// t = 0 — живой, t -> 1 — конец анимации смерти (сплющивание + затухание)
function drawEnemy(x, y, t = 0) {
  ctx.save();
  if (t > 0) {
    // сплющиваем по вертикали к земле и делаем прозрачнее
    const squash = 1 - t * 0.85;
    ctx.globalAlpha = 1 - t;
    ctx.translate(x + 14, y + 28);
    ctx.scale(1, squash);
    ctx.translate(-(x + 14), -(y + 28));
  }

  // тело
  ctx.fillStyle = "#8b4513";
  ctx.beginPath();
  ctx.arc(x + 14, y + 12, 14, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(x, y + 12, 28, 12);
  // ноги
  ctx.fillStyle = "#3a2410";
  ctx.fillRect(x + 2, y + 24, 8, 4);
  ctx.fillRect(x + 18, y + 24, 8, 4);
  // глаза: живой — открытые, мёртвый — крестики X
  if (t > 0) {
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    drawX(x + 9, y + 13);
    drawX(x + 19, y + 13);
  } else {
    ctx.fillStyle = "#fff";
    ctx.fillRect(x + 6, y + 10, 6, 6);
    ctx.fillRect(x + 16, y + 10, 6, 6);
    ctx.fillStyle = "#000";
    ctx.fillRect(x + 8, y + 12, 3, 3);
    ctx.fillRect(x + 18, y + 12, 3, 3);
  }
  ctx.restore();
}

// крестик-глаз (X) для мёртвого моба
function drawX(cx, cy) {
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy - 3);
  ctx.lineTo(cx + 3, cy + 3);
  ctx.moveTo(cx + 3, cy - 3);
  ctx.lineTo(cx - 3, cy + 3);
  ctx.stroke();
}

function drawFlag(x, y) {
  // шест
  ctx.fillStyle = "#aaa";
  ctx.fillRect(x, y, 5, 120);
  ctx.beginPath();
  ctx.arc(x + 2.5, y, 6, 0, Math.PI * 2);
  ctx.fillStyle = "#ffd700";
  ctx.fill();
  // флажок
  ctx.fillStyle = "#2ecc71";
  ctx.beginPath();
  ctx.moveTo(x + 5, y + 8);
  ctx.lineTo(x + 45, y + 20);
  ctx.lineTo(x + 5, y + 32);
  ctx.closePath();
  ctx.fill();
}

// --- Утилиты ---
function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// --- Overlay ---
function showOverlay(title, text, btn) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  startBtn.textContent = btn;
  overlay.classList.remove("hidden");
}
function hideOverlay() {
  overlay.classList.add("hidden");
}

startBtn.addEventListener("click", () => {
  if (state === "menu" || state === "dead" || state === "win") {
    // Полный сброс игры
    coins = 0;
    lives = 3;
    levelIndex = 0;
    coinsEl.textContent = coins;
    livesEl.textContent = lives;
    levelEl.textContent = 1;
    ammoEl.textContent = START_AMMO;
    loadLevel(0);
  } else if (state === "levelclear") {
    loadLevel(levelIndex);
  }
  state = "playing";
  hideOverlay();
});

// --- Игровой цикл ---
function loop() {
  try {
    update();
    draw();
  } catch (err) {
    console.error("Ошибка в игровом цикле:", err);
  }
  requestAnimationFrame(loop);
}

loop();
