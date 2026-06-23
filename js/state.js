// Глобальное состояние игры и объекты текущего уровня
let state = "menu"; // menu | playing | dead | win | levelclear
let coins = 0;
let lives = 3;
let levelIndex = 0;
let cameraX = 0;

let platforms = [];
let coinObjs = [];
let enemies = [];
let bullets = [];
let ammoObjs = [];
let flag = null;
let levelWidth = 0;
let ammo = START_AMMO;
