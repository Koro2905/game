// HUD-элементы и управление оверлеем
const coinsEl = document.getElementById("coins");
const livesEl = document.getElementById("lives");
const levelEl = document.getElementById("level");
const ammoEl = document.getElementById("ammo");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayText = document.getElementById("overlay-text");
const startBtn = document.getElementById("start-btn");

function showOverlay(title, text, btn) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  startBtn.textContent = "▶ " + btn;
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}
