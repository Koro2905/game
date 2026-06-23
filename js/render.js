// Отрисовка всего игрового мира (пиксель-арт стиль)

function draw() {
  // ── Небо (градиент) ───────────────────────────────────
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  skyGrad.addColorStop(0,   "#080c3a");
  skyGrad.addColorStop(0.4, "#1a3890");
  skyGrad.addColorStop(1,   "#4878e8");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // ── Мигающие звёзды ──────────────────────────────────
  const t = performance.now() / 1000;
  for (const s of BG_STARS) {
    const alpha = 0.5 + 0.5 * Math.sin(t * 1.5 + s.x * 0.07);
    ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    const sz = s.big ? 4 : 2;
    ctx.fillRect(s.x, s.y, sz, sz);
  }

  // ── Параллакс-горы (дальний план) ────────────────────
  drawBgHills();

  // ── Облака ────────────────────────────────────────────
  drawClouds();

  if (!flag) return;

  ctx.save();
  ctx.translate(-cameraX, 0);

  // ── Земля ──────────────────────────────────────────────
  ctx.fillStyle = "#6a2d00";
  ctx.fillRect(0, GROUND_Y, levelWidth, H - GROUND_Y);
  // Горизонтальные полосы (текстура)
  ctx.fillStyle = "#4e1e00";
  for (let dy = GROUND_Y + 8; dy < H; dy += 16) {
    ctx.fillRect(0, dy, levelWidth, 4);
  }
  // Трава (чередующиеся пиксели)
  for (let gx = 0; gx < levelWidth; gx += 8) {
    ctx.fillStyle = "#2ecc71";
    ctx.fillRect(gx,     GROUND_Y, 4, 12);
    ctx.fillStyle = "#27ae60";
    ctx.fillRect(gx + 4, GROUND_Y, 4, 12);
  }
  // Тёмная линия под травой
  ctx.fillStyle = "#1a6030";
  ctx.fillRect(0, GROUND_Y + 12, levelWidth, 4);

  // ── Платформы (пиксельные кирпичи) ─────────────────────
  for (const p of platforms) {
    ctx.fillStyle = "#c47010";
    ctx.fillRect(p.x, p.y, p.w, p.h);
    // Светлый верх
    ctx.fillStyle = "#f0a020";
    ctx.fillRect(p.x, p.y, p.w, 4);
    // Тёмный низ
    ctx.fillStyle = "#602800";
    ctx.fillRect(p.x, p.y + p.h - 4, p.w, 4);
    // Вертикальные стыки (px=4)
    ctx.fillStyle = "#8c3c00";
    for (let bx = p.x + 16; bx < p.x + p.w; bx += 16) {
      ctx.fillRect(bx, p.y + 4, 4, p.h - 8);
    }
    // Горизонтальный шов
    ctx.fillRect(p.x, p.y + Math.floor(p.h / 2) - 2, p.w, 4);
  }

  // ── Монеты ─────────────────────────────────────────────
  for (const c of coinObjs) {
    if (c.collected) continue;
    drawSprite(SPR_COIN, c.x - 10, c.y - 10, 4, PAL_COIN);
  }

  // ── Ящики патронов ──────────────────────────────────────
  for (const a of ammoObjs) {
    if (a.collected) continue;
    drawSprite(SPR_AMMO, a.x - 10, a.y - 10, 4, PAL_AMMO);
  }

  // ── Враги ───────────────────────────────────────────────
  for (const e of enemies) {
    if (e.dying) {
      const et = 1 - e.deathTimer / DEATH_FRAMES;
      drawEnemy(e.x, e.y, et);
    } else if (e.alive) {
      drawEnemy(e.x, e.y, 0);
    }
  }

  // ── Флаг ────────────────────────────────────────────────
  drawFlag(flag.x, flag.y);

  // ── Пули (2×1 пикселя при px=4) ─────────────────────────
  for (const b of bullets) {
    ctx.fillStyle = "#ffff44";
    ctx.fillRect(b.x, b.y, 8, 4);
    ctx.fillStyle = "#ff8800";
    ctx.fillRect(b.x - 4, b.y + 1, 4, 2);
  }

  // ── Игрок ────────────────────────────────────────────────
  drawPlayer();

  ctx.restore();
}

// ── Параллакс-горы на фоне ─────────────────────────────
function drawBgHills() {
  const lw = levelWidth || 800;
  const off = (cameraX || 0) * 0.35;

  // Дальний ряд (темнее, меньше)
  ctx.fillStyle = "#0d1545";
  drawHillRow(off * 0.7, lw, 8, GROUND_Y - 20);

  // Ближний ряд (ярче, крупнее)
  ctx.fillStyle = "#161e60";
  drawHillRow(off, lw, 11, GROUND_Y - 10);
}

function drawHillRow(off, lw, steps, baseY) {
  const period = 400;
  for (let i = -1; i < Math.ceil((lw + 400) / period) + 1; i++) {
    const bx = i * period - (off % period);
    drawPixelHill(bx + 60,  baseY, steps);
    drawPixelHill(bx + 200, baseY, Math.floor(steps * 0.7));
    drawPixelHill(bx + 320, baseY, Math.floor(steps * 0.55));
  }
}

function drawPixelHill(cx, baseY, steps) {
  const px = 4;
  for (let s = 0; s < steps; s++) {
    const w = (steps - s) * 2 * px;
    ctx.fillRect(Math.round(cx - w / 2), baseY - (s + 1) * px, w, px);
  }
  ctx.fillRect(Math.round(cx - steps * 2 * px / 2), baseY, steps * 2 * px, px);
}

// ── Облака (пиксельный спрайт) ─────────────────────────
function drawClouds() {
  const lw = levelWidth || 800;
  const offset = (cameraX || 0) * 0.25;
  for (let i = 0; i < 7; i++) {
    const cx = ((i * 380 - offset) % (lw + 450) + (lw + 450)) % (lw + 450) - 60;
    const cy = 45 + (i % 3) * 30;
    drawSprite(SPR_CLOUD, cx, cy, 4, PAL_CLOUD);
  }
}

// ── Флаг (пиксельный) ──────────────────────────────────
function drawFlag(x, y) {
  // Шест
  ctx.fillStyle = "#cccccc";
  ctx.fillRect(x, y, 4, 120);
  ctx.fillStyle = "#eeeeee";
  ctx.fillRect(x, y, 2, 120);

  // Золотой шар (ромб 12×12)
  ctx.fillStyle = "#ffd700";
  ctx.fillRect(x - 2, y - 8, 8,  4);
  ctx.fillRect(x - 4, y - 4, 12, 4);
  ctx.fillRect(x - 2, y,     8,  4);

  // Флаг: пиксельный треугольник
  const cols = ["#2ecc71", "#27ae60"];
  for (let row = 0; row < 7; row++) {
    ctx.fillStyle = cols[row % 2];
    ctx.fillRect(x + 4, y + 8 + row * 4, (7 - row) * 4, 4);
  }
}
