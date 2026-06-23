// Игрок: объект, сброс позиции, пиксельная отрисовка
const player = {
  x: 50, y: 0, w: 28, h: 40,
  vx: 0, vy: 0,
  onGround: false,
  facing: 1,
  dying: false,
  deathTimer: 0,
};

function resetPlayer() {
  player.x = 50;
  player.y = GROUND_Y - player.h;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.facing = 1;
  player.dying = false;
  player.deathTimer = 0;
}

function drawPlayer() {
  const { x, y, w, h } = player;

  // Анимация смерти: вращение + затухание
  if (player.dying) {
    const t = 1 - player.deathTimer / 60;
    ctx.save();
    ctx.globalAlpha = t > 0.55 ? Math.max(0, 1 - (t - 0.55) / 0.45) : 1;
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(t * Math.PI * 4);
    ctx.translate(-w / 2, -h / 2);
    drawSprite(SPR_PLAYER, 0, 0, 4, PAL_PLAYER);
    ctx.restore();
    return;
  }

  // Спрайт (зеркалим для левого направления)
  if (player.facing === 1) {
    drawSprite(SPR_PLAYER, x, y, 4, PAL_PLAYER);
  } else {
    drawSpriteFlipped(SPR_PLAYER, x, y, 4, PAL_PLAYER);
  }

  // Пиксельный пистолет (2×3 пикселя, px=4)
  ctx.fillStyle = PAL_PLAYER.G;
  if (player.facing === 1) {
    ctx.fillRect(x + 28, y + 20, 12, 4); // ствол
    ctx.fillRect(x + 28, y + 24, 4,  8); // рукоять
  } else {
    ctx.fillRect(x - 12, y + 20, 12, 4);
    ctx.fillRect(x + 8,  y + 24, 4,  8);
  }
}
