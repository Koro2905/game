// Загрузка уровней, управление, главная кнопка и игровой цикл

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
  platforms = lvl.platforms.map(p => ({ ...p }));
  coinObjs  = lvl.coins.map(c => ({ ...c, collected: false }));
  enemies   = lvl.enemies.map(e => ({ ...e, alive: true, x0: e.x }));
  ammoObjs  = (lvl.ammoPickups || []).map(a => ({ ...a, collected: false }));
  bullets   = [];
  ammo      = START_AMMO;
  flag      = { ...lvl.flag, reached: false };
  resetPlayer();
  cameraX = 0;
}

function resetLevel() {
  loadLevel(levelIndex);
  state = "playing";
  hideOverlay();
}

// --- Кнопка старта / перезапуска ---
startBtn.addEventListener("click", () => {
  if (state === "menu" || state === "dead" || state === "win") {
    coins = 0;
    lives = 3;
    levelIndex = 0;
    coinsEl.textContent = coins;
    livesEl.textContent = lives;
    levelEl.textContent = 1;
    ammoEl.textContent  = START_AMMO;
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
