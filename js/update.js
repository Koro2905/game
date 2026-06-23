// Логика обновления: физика, управление, столкновения

function update() {
  if (state !== "playing") return;

  // Анимация смерти игрока (1 секунда)
  if (player.dying) {
    player.deathTimer--;
    player.vy += GRAVITY;
    player.y += player.vy;
    cameraX = player.x - W / 3;
    if (cameraX < 0) cameraX = 0;
    if (cameraX > levelWidth - W) cameraX = levelWidth - W;
    if (player.deathTimer <= 0) finishDeath();
    return;
  }

  // Горизонтальное движение
  let moving = false;
  if (keys["ArrowLeft"] || keys["KeyA"]) { player.vx = -MOVE_SPEED; player.facing = -1; moving = true; }
  if (keys["ArrowRight"] || keys["KeyD"]) { player.vx = MOVE_SPEED;  player.facing = 1;  moving = true; }
  if (!moving) player.vx *= 0.7;

  // Прыжок
  if ((keys["Space"] || keys["ArrowUp"] || keys["KeyW"]) && player.onGround) {
    player.vy = -JUMP_FORCE;
    player.onGround = false;
  }

  // Стрельба (F или X)
  if ((justPressed["KeyF"] || justPressed["KeyX"]) && ammo > 0) {
    const muzzleX = player.facing === 1 ? player.x + player.w : player.x;
    bullets.push({ x: muzzleX, y: player.y + 22, vx: BULLET_SPEED * player.facing });
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
  bullets = bullets.filter(b => !b.dead && b.x > cameraX - 50 && b.x < cameraX + W + 50);

  // Гравитация
  player.vy += GRAVITY;
  if (player.vy > 18) player.vy = 18;

  // Перемещение по X
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
    if (e.dying) {
      e.deathTimer--;
      e.vy = (e.vy || 0) + GRAVITY; // гравитация — моб летит вверх, потом падает
      e.x += (e.vx || 0);
      e.y += e.vy;
      if (e.deathTimer <= 0) e.dying = false;
      continue;
    }
    if (!e.alive) continue;

    e.x += e.dir * 1.2;
    if (e.x < e.range[0] || e.x > e.range[1]) e.dir *= -1;

    if (rectsOverlap(player.x, player.y, player.w, player.h, e.x, e.y, 28, 28)) {
      if (player.vy > 0 && player.y + player.h - player.vy <= e.y + 10) {
        killEnemy(e);
        player.vy = -JUMP_FORCE * 0.6;
      } else {
        die();
        return;
      }
    }
  }

  // Падение в пропасть
  if (player.y > H + 100) { die(); return; }

  // Флаг — переход на следующий уровень
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
  if (player.dying) return;
  player.dying = true;
  player.deathTimer = 60; // 1 секунда при 60 fps
  player.vy = -9;
  player.vx = 0;
}

function finishDeath() {
  lives--;
  livesEl.textContent = lives;
  if (lives <= 0) {
    state = "dead";
    showOverlay("GAME OVER", `МОНЕТ: ${coins}   ЖИЗНИ: 0`, "ЗАНОВО");
  } else {
    resetPlayer();
  }
}

function nextLevel() {
  levelIndex++;
  if (levelIndex >= LEVELS.length) {
    state = "win";
    showOverlay("YOU WIN!", `МОНЕТ СОБРАНО: ${coins}`, "СНАЧАЛА");
  } else {
    levelEl.textContent = levelIndex + 1;
    state = "levelclear";
    showOverlay("УРОВЕНЬ ПРОЙДЕН", `МОНЕТ: ${coins}`, "ДАЛЬШЕ");
  }
}

// Утилита: проверка пересечения прямоугольников
function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}
