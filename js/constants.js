// Canvas и физические константы
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;

const GRAVITY = 0.35;
const MOVE_SPEED = 3.2;
const JUMP_FORCE = 10;
const GROUND_Y = H - 50;

ctx.imageSmoothingEnabled = false; // пиксель-арт без сглаживания

const BULLET_SPEED = 9;
const DEATH_FRAMES = 50; // ~0.8 сек анимации смерти моба
const START_AMMO = 10;
