const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;

let score = 0;
let speedMultiplier = 1;
let enemies = [];
let bullets = [];
let explosions = [];
let lives = 3;
let paused = false;
let gameStarted = false;

const bgMusic = document.getElementById("bgMusic");
const enemy1ExplosionSound = new Audio("audio/enemy2.mp3");
const enemy2ExplosionSound = new Audio("audio/enemy1.mp3");

const bgImg = new Image();
bgImg.src = "img/background.jpg";
const playerImg = new Image();
playerImg.src = "img/player.png";
const extraLifeImg = new Image();
extraLifeImg.src = "img/extra_life.png";
const explosionImg = new Image();
explosionImg.src = "img/explosion.png";

const enemyImages = [
  "img/enemy1.png",
  "img/enemy2.png",
  //"img/enemy3.png"
].map(src => {
  const img = new Image();
  img.src = src;
  return img;
});

const messages = [
  "¡Te voy a robar!",
  "¡Te voy a hacer RUG!",
  "¡Ríndete!",
  "¡Tu wallet es mía!",
  "¡Es solo una Meme Coin!"
];

const player = {
  x: 100,
  y: 300,
  width: 64,
  height: 64,
  speed: 30,
  shootCooldown: 0
};

class Enemy {
  constructor(x, y, speed, health, image, message, explosionSound) {
    this.x = x;
    this.y = y;
    this.width = 64;
    this.height = 64;
    this.speed = speed;
    this.health = health;
    this.image = image;
    this.message = message;
    this.explosionSound = explosionSound;
    this.messageTimer = 120;
  }
  update() {
    this.x -= this.speed;
    if (this.messageTimer > 0) this.messageTimer--;
  }
  draw() {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    if (this.messageTimer > 0) {
      ctx.fillStyle = "white";
      ctx.font = "14px Arial";
      ctx.fillText(this.message, this.x - 10, this.y - 10);
    }
    ctx.fillStyle = "red";
    ctx.fillRect(this.x, this.y - 6, this.width, 4);
    ctx.fillStyle = "lime";
    ctx.fillRect(this.x, this.y - 6, this.width * (this.health / 3), 4);
  }
}

class Bullet {
  constructor(x, y, speed, damage) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.damage = damage;
    this.width = 10;
    this.height = 4;
  }
  update() {
    this.x += this.speed;
  }
  draw() {
    ctx.fillStyle = "yellow";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

class Explosion {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.frame = 0;
    this.frameWidth = 64;
    this.frameHeight = 64;
    this.totalFrames = 6;
    this.frameDelay = 5;
    this.delayCounter = 0;
    this.finished = false;
  }
  update() {
    this.delayCounter++;
    if (this.delayCounter >= this.frameDelay) {
      this.frame++;
      this.delayCounter = 0;
      if (this.frame >= this.totalFrames) {
        this.finished = true;
      }
    }
  }
  draw() {
    if (!this.finished) {
      ctx.drawImage(
        explosionImg,
        this.frame * this.frameWidth, 0,
        this.frameWidth, this.frameHeight,
        this.x, this.y,
        this.frameWidth, this.frameHeight
      );
    }
  }
}

class ExtraLife {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 32;
    this.height = 32;
    this.speed = 2;
  }
  update() {
    this.x -= this.speed;
  }
  draw() {
    ctx.drawImage(extraLifeImg, this.x, this.y, this.width, this.height);
  }
}

let extraLives = [];

function shootBullet() {
  bullets.push(new Bullet(player.x + player.width, player.y + player.height / 2 - 2, 6 + speedMultiplier * 0.2, 1 + speedMultiplier * 0.1));
  const shootSound = document.getElementById("shootSound");
  if (shootSound) shootSound.play();
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);
resizeCanvas(); // Ejecutar al inicio

function spawnEnemy() {
  const y = Math.random() * (canvas.height - 64);
  const speed = 2 + speedMultiplier * 0.3;
  const health = score >= 100 ? 3 : 1;
  const index = Math.floor(Math.random() * enemyImages.length);
  const image = enemyImages[index];
  const message = messages[Math.floor(Math.random() * messages.length)];

  let explosionSound;
  if (index === 0) explosionSound = enemy1ExplosionSound;
  else if (index === 1) explosionSound = enemy2ExplosionSound;

  if (gameStarted) {
    enemies.push(new Enemy(canvas.width, y, speed, health, image, message, explosionSound));
    if (score % 15 === 0 && score > 0) {
      extraLives.push(new ExtraLife(canvas.width, Math.random() * (canvas.height - 32)));
    }
  }
}

function drawPlayerLives() {
  for (let i = 0; i < lives; i++) {
    ctx.fillStyle = "lime";
    ctx.fillRect(10 + i * 20, 70, 16, 8);
  }
}

function updateGame() {
  if (paused || !gameStarted) return;
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
  ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

  extraLives.forEach((life, i) => {
    life.update();
    life.draw();
    if (life.x < player.x + player.width && life.x + life.width > player.x && life.y < player.y + player.height && life.y + life.height > player.y) {
      lives++;
      extraLives.splice(i, 1);
    } else if (life.x + life.width < 0) {
      extraLives.splice(i, 1);
    }
  });

  explosions.forEach((expl, i) => {
    expl.update();
    expl.draw();
    if (expl.finished) explosions.splice(i, 1);
  });

  enemies.forEach((e, i) => {
    e.update();
    e.draw();
    if (e.x < player.x + player.width && e.x + e.width > player.x && e.y < player.y + player.height && e.y + e.height > player.y) {
      explosions.push(new Explosion(player.x, player.y));
	if (e.explosionSound) e.explosionSound.play();
      lives--;
      enemies.splice(i, 1);
      checkGameOver();
    } else if (e.x + e.width < 0) {
      lives--;
      enemies.splice(i, 1);
      checkGameOver();
    }
  });

  bullets.forEach((b, j) => {
    b.update();
    b.draw();
    if (b.x > canvas.width) bullets.splice(j, 1);
  });

  enemies.forEach((e, i) => {
    bullets.forEach((b, j) => {
      if (b.x < e.x + e.width && b.x + b.width > e.x && b.y < e.y + e.height && b.y + b.height > e.y) {
        bullets.splice(j, 1);
        e.health -= b.damage;
        if (e.health <= 0) {
			score++;
			if (score % 10 === 0) speedMultiplier++;
			if (e.explosionSound) e.explosionSound.play();
			explosions.push(new Explosion(e.x, e.y));
			enemies.splice(i, 1);
		}
      }
    });
  });

  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 30);
  ctx.fillText("Lives: " + lives, 10, 60);

  drawPlayerLives();

  if (player.shootCooldown > 0) player.shootCooldown--;
  requestAnimationFrame(updateGame);
}

function checkGameOver() {
  if (lives <= 0) {
    gameStarted = false;
    canvas.style.display = 'none';
    document.getElementById("gameOverScreen").style.display = 'block';
    document.getElementById("finalScore").textContent = `Puntaje final: ${score}`;
    const highScore = localStorage.getItem("highScore") || 0;
    if (score > highScore) localStorage.setItem("highScore", score);
  }
}

function keyDownHandler(e) {
  if (e.key === " " && player.shootCooldown === 0) {
    shootBullet();
    player.shootCooldown = 15;
  }
  if (e.key.toLowerCase() === "p") {
    paused = !paused;
    if (!paused) updateGame();
  }
}

function mouseMoveHandler(e) {
  const rect = canvas.getBoundingClientRect();
  const mouseY = e.clientY - rect.top;
  player.y = Math.max(0, Math.min(canvas.height - player.height, mouseY - player.height / 2));
}

canvas.addEventListener("mousemove", mouseMoveHandler);

canvas.addEventListener("touchmove", function (e) {
  e.preventDefault();
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const touchY = touch.clientY - rect.top;
  player.y = Math.max(0, Math.min(canvas.height - player.height, touchY - player.height / 2));
}, { passive: false });

canvas.addEventListener("touchstart", function (e) {
  if (player.shootCooldown === 0) {
    shootBullet();
    player.shootCooldown = 15;
  }
});

function startGame() {
  document.getElementById("menu").style.display = 'none';
  canvas.style.display = 'block';
  gameStarted = true;

  const bgMusic = document.getElementById("bgMusic");
  if (bgMusic && bgMusic.paused) {
    bgMusic.volume = 0.5;
    bgMusic.play().catch(err => console.warn("Autoplay bloqueado:", err));
  }

  updateGame();

  const highScore = localStorage.getItem("highScore") || 0;
  document.getElementById("highScoreDisplay").textContent = `Record: ${highScore}`;
}

document.addEventListener("keydown", keyDownHandler);
setInterval(spawnEnemy, 1000);
