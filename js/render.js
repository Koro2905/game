// Отрисовка всего игрового мира (пиксель-арт стиль)

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawClouds();

  if (!flag) return;

  ctx.save();
  ctx.translate(-cameraX, 0);

  // ── Земля ──────────────────────────────────────────────
  ctx.fillStyle = "#7a3d0c";
  ctx.fillRect(0, GROUND_Y, levelWidth, H - GROUND_Y);
  // Горизонтальные полосы (текстура земли)
  ctx.fillStyle = "#5a2d06";
  for (let dy = GROUND_Y + 8; dy < H; dy += 16) {
    ctx.fillRect(0, dy, levelWidth, 4);
  }
  // Трава (чередующиеся пиксели)
  for (let gx = 0; gx < levelWidth; gx += 8) {
    ctx.fillStyle = "#2ecc71";
    ctx.fillRect(gx, GROUND_Y, 4, 12);
    ctx.fillStyle = "#27ae60";
    ctx.fillRect(gx + 4, GROUND_Y, 4, 12);
  }

  // ── Платформы (пиксельные кирпичи) ────────────────────
  for (const p of platforms) {
    // Основа
    ctx.fillStyle = "#d97706";
    ctx.fillRect(p.x, p.y, p.w, p.h);
    // Светлый верх
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(p.x, p.y, p.w, 4);
    // Тёмный низ
    ctx.fillStyle = "#7c3000";
    ctx.fillRect(p.x, p.y + p.h - 4, p.w, 4);
    // Вертикальные стыки кирпичей (px=4)
    ctx.fillStyle = "#92400e";
    for (let bx = p.x + 16; bx < p.x + p.w; bx += 16) {
      ctx.fillRect(bx, p.y + 4, 4, p.h - 8);
    }
    // Горизонтальный шов посередине
    ctx.fillRect(p.x, p.y + Math.floor(p.h / 2) - 2, p.w, 4);
  }

  // ── Монеты ────────────────────────────────────────────
  for (const c of coinObjs) {
    if (c.collected) continue;
    drawSprite(SPR_COIN, c.x - 10, c.y - 10, 4, PAL_COIN);
  }

  // ── Ящики патронов ────────────────────────────────────
  for (const a of ammoObjs) {
    if (a.collected) continue;
    drawSprite(SPR_AMMO, a.x - 10, a.y - 10, 4, PAL_AMMO);
  }

  // ── Враги ─────────────────────────────────────────────
  for (const e of enemies) {
    if (e.dying) {
      const t = 1 - e.deathTimer / DEATH_FRAMES;
      drawEnemy(e.x, e.y, t);
    } else if (e.alive) {
      drawEnemy(e.x, e.y, 0);
    }
  }

  // ── Флаг ──────────────────────────────────────────────
  drawFlag(flag.x, flag.y);

  // ── Пули (2×1 пикселя при px=4) ──────────────────────
  for (const b of bullets) {
    ctx.fillStyle = "#ffff44";
    ctx.fillRect(b.x, b.y, 8, 4);
    ctx.fillStyle = "#ff8800";
    ctx.fillRect(b.x - 4, b.y + 1, 4, 2); // след
  }

  // ── Игрок ────────────────────────────────────────────
  drawPlayer();

  ctx.restore();
}

function drawClouds() {
  const offset = cameraX * 0.3;
  const lw = levelWidth || 800;
  for (let i = 0; i < 8; i++) {
    const cx = ((i * 350 - offset) % (lw + 400) + (lw + 400)) % (lw + 400) - 50;
    const cy = 40 + (i % 3) * 28;
    drawSprite(SPR_CLOUD, cx, cy, 4, PAL_CLOUD);
  }
}

function drawFlag(x, y) {
  // Шест (серый, 4px)
  ctx.fillStyle = "#aaaaaa";
  ctx.fillRect(x, y, 4, 120);
  ctx.fillStyle = "#dddddd";
  ctx.fillRect(x, y, 2, 120); // блик

  // Золотой шар (пиксельный ромб 12×12)
  ctx.fillStyle = "#ffd700";
  ctx.fillRect(x - 2, y - 8, 8,  4);
  ctx.fillRect(x - 4, y - 4, 12, 4);
  ctx.fillRect(x - 2, y,     8,  4);

  // Флаг (пиксельный треугольник, 7 рядов × px=4)
  const colors = ["#2ecc71","#27ae60"];
  for (let row = 0; row < 7; row++) {
    const rowW = (7 - row) * 4;
    ctx.fillStyle = colors[row % 2];
    ctx.fillRect(x + 4, y + 8 + row * 4, rowW, 4);
  }
}
