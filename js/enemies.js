// Враги: убийство, пиксельная отрисовка

function killEnemy(e) {
  if (!e.alive) return;
  e.alive = false;
  e.dying = true;
  e.deathTimer = DEATH_FRAMES;
  e.vy = -8;
  e.vx = (Math.random() * 2 - 1) * 2;
  coins++;
  coinsEl.textContent = coins;
}

// t = 0 — живой, t → 1 — анимация смерти (вращение + затухание)
function drawEnemy(x, y, t = 0) {
  ctx.save();

  if (t > 0) {
    ctx.globalAlpha = t > 0.5 ? Math.max(0, 1 - (t - 0.5) * 2) : 1;
    ctx.translate(x + 14, y + 14);
    ctx.rotate(t * Math.PI * 3);
    ctx.translate(-(x + 14), -(y + 14));
  }

  drawSprite(SPR_ENEMY, x, y, 4, PAL_ENEMY);

  // Глаза-крестики X при смерти
  if (t > 0) {
    ctx.fillStyle = "#ffffff";
    drawPixelX(x + 7, y + 8);
    drawPixelX(x + 15, y + 8);
  }

  ctx.restore();
}

// Пиксельный крестик X (3×3 пикселя по 4px)
function drawPixelX(cx, cy) {
  ctx.fillRect(cx,     cy,     4, 4); // верх-лево
  ctx.fillRect(cx + 8, cy,     4, 4); // верх-право
  ctx.fillRect(cx + 4, cy + 4, 4, 4); // центр
  ctx.fillRect(cx,     cy + 8, 4, 4); // низ-лево
  ctx.fillRect(cx + 8, cy + 8, 4, 4); // низ-право
}
