/* ==================================================================
   HEX DRIFT — GAME ENGINE
   A neon top-down dodger/shooter. All visuals are drawn procedurally
   on <canvas>; all audio is synthesized live via the Web Audio API.
   No external image or sound files are required or referenced.
   ================================================================== */

'use strict';

/* ==================================================================
   1. CANVAS SETUP
   ================================================================== */
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let DPR = Math.min(window.devicePixelRatio || 1, 2); // cap DPR for perf on high-density phones
let W = 0, H = 0; // logical (CSS pixel) size of the canvas

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  W = rect.width;
  H = rect.height;
  canvas.width = Math.round(W * DPR);
  canvas.height = Math.round(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); // draw in logical pixels regardless of DPR
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 200));
resizeCanvas();

/* ==================================================================
   2. AUDIO ENGINE — synthesized SFX + procedural background music
   ================================================================== */
const Sound = (() => {
  let ctxA = null;
  let master = null;
  let musicGain = null;
  let sfxGain = null;
  let muted = false;
  let musicTimer = null;
  let musicStep = 0;

  // A minor pentatonic-ish scale (Hz) used for the ambient arpeggio
  const SCALE = [110.0, 130.81, 146.83, 164.81, 196.0, 220.0, 261.63];

  function ensureCtx() {
    if (!ctxA) {
      ctxA = new (window.AudioContext || window.webkitAudioContext)();
      master = ctxA.createGain();
      master.gain.value = 1;
      master.connect(ctxA.destination);

      musicGain = ctxA.createGain();
      musicGain.gain.value = 0.18;
      musicGain.connect(master);

      sfxGain = ctxA.createGain();
      sfxGain.gain.value = 0.55;
      sfxGain.connect(master);
    }
    if (ctxA.state === 'suspended') ctxA.resume();
  }

  // Generic short tone / blip generator, used for most one-shot SFX
  function tone(freq, duration, type = 'sine', startGain = 0.5, glideTo = null) {
    if (!ctxA) return;
    const osc = ctxA.createOscillator();
    const gain = ctxA.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctxA.currentTime);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, ctxA.currentTime + duration);
    gain.gain.setValueAtTime(startGain, ctxA.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctxA.currentTime + duration);
    osc.connect(gain).connect(sfxGain);
    osc.start();
    osc.stop(ctxA.currentTime + duration + 0.02);
  }

  // White-noise burst, used for explosions / impacts
  function noiseBurst(duration, filterFreq = 1200, gainStart = 0.6) {
    if (!ctxA) return;
    const bufferSize = Math.floor(ctxA.sampleRate * duration);
    const buffer = ctxA.createBuffer(1, bufferSize, ctxA.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize); // decaying noise
    }
    const src = ctxA.createBufferSource();
    src.buffer = buffer;
    const filter = ctxA.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, ctxA.currentTime);
    filter.frequency.exponentialRampToValueAtTime(120, ctxA.currentTime + duration);
    const gain = ctxA.createGain();
    gain.gain.setValueAtTime(gainStart, ctxA.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctxA.currentTime + duration);
    src.connect(filter).connect(gain).connect(sfxGain);
    src.start();
  }

  // ---- Background music: a gentle procedural arpeggio + soft bass pulse ----
  function scheduleMusicStep() {
    if (!ctxA || muted) { musicTimer = setTimeout(scheduleMusicStep, 350); return; }
    const beatMs = 380;
    // Arpeggio note
    const note = SCALE[musicStep % SCALE.length];
    tone(note, 0.5, 'triangle', 0.05);
    // Soft bass pulse every 4th beat
    if (musicStep % 4 === 0) {
      tone(note / 4, 0.9, 'sine', 0.09);
    }
    musicStep++;
    musicTimer = setTimeout(scheduleMusicStep, beatMs);
  }

  return {
    init() { ensureCtx(); },
    resume() { ensureCtx(); },
    shoot() { ensureCtx(); tone(880, 0.08, 'square', 0.12, 1400); },
    hit() { ensureCtx(); tone(160, 0.18, 'sawtooth', 0.3, 60); },
    explosion() { ensureCtx(); noiseBurst(0.35, 1600, 0.5); },
    powerup() { ensureCtx(); [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.14, 'sine', 0.25), i * 55)); },
    click() { ensureCtx(); tone(600, 0.06, 'square', 0.15, 900); },
    gameover() { ensureCtx(); tone(300, 0.7, 'sawtooth', 0.3, 60); },
    startMusic() {
      ensureCtx();
      if (musicTimer) return;
      musicStep = 0;
      scheduleMusicStep();
    },
    stopMusic() {
      clearTimeout(musicTimer);
      musicTimer = null;
    },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.setTargetAtTime(muted ? 0 : 1, ctxA.currentTime, 0.05);
      return muted;
    },
    isMuted() { return muted; }
  };
})();

/* ==================================================================
   3. INPUT HANDLING — keyboard + mouse + touch (drag-to-steer)
   ================================================================== */
const Input = {
  keyX: 0, keyY: 0,            // -1..1 direction from keyboard
  pointerActive: false,
  pointerX: 0, pointerY: 0,
  _keys: new Set(),
};

const KEY_MAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
};

function updateKeyVector() {
  let x = 0, y = 0;
  if (Input._keys.has('left')) x -= 1;
  if (Input._keys.has('right')) x += 1;
  if (Input._keys.has('up')) y -= 1;
  if (Input._keys.has('down')) y += 1;
  Input.keyX = x; Input.keyY = y;
}

window.addEventListener('keydown', (e) => {
  const mapped = KEY_MAP[e.code];
  if (mapped) { Input._keys.add(mapped); updateKeyVector(); }
  if (e.code === 'Escape' || e.code === 'KeyP') togglePause();
});
window.addEventListener('keyup', (e) => {
  const mapped = KEY_MAP[e.code];
  if (mapped) { Input._keys.delete(mapped); updateKeyVector(); }
});

// Pointer (mouse) drag-to-steer
function pointerPos(e) {
  const rect = canvas.getBoundingClientRect();
  const cx = e.touches ? e.touches[0].clientX : e.clientX;
  const cy = e.touches ? e.touches[0].clientY : e.clientY;
  return { x: cx - rect.left, y: cy - rect.top };
}

function onPointerDown(e) {
  if (state.mode !== 'playing') return;
  Input.pointerActive = true;
  const p = pointerPos(e);
  Input.pointerX = p.x; Input.pointerY = p.y;
  hideTouchHint();
  e.preventDefault();
}
function onPointerMove(e) {
  if (!Input.pointerActive) return;
  const p = pointerPos(e);
  Input.pointerX = p.x; Input.pointerY = p.y;
  e.preventDefault();
}
function onPointerUp() {
  Input.pointerActive = false;
}

canvas.addEventListener('mousedown', onPointerDown);
canvas.addEventListener('mousemove', onPointerMove);
window.addEventListener('mouseup', onPointerUp);
canvas.addEventListener('touchstart', onPointerDown, { passive: false });
canvas.addEventListener('touchmove', onPointerMove, { passive: false });
canvas.addEventListener('touchend', onPointerUp);
canvas.addEventListener('touchcancel', onPointerUp);

function hideTouchHint() {
  document.getElementById('touch-hint').classList.add('hidden');
}

/* ==================================================================
   4. UTILITIES
   ================================================================== */
const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const dist2 = (ax, ay, bx, by) => (ax - bx) ** 2 + (ay - by) ** 2;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const _lerp = (a, b, t) => a + (b - a) * t;

/* ==================================================================
   5. GAME STATE
   ================================================================== */
const state = {
  mode: 'menu',      // 'menu' | 'playing' | 'paused' | 'gameover'
  score: 0,
  highScore: Number(localStorage.getItem('hexdrift_highscore')) || 0,
  lives: 3,
  wave: 1,
  survivalTime: 0,
  spawnTimer: 0,
  powerupTimer: 0,
  shakeTime: 0,
  lastTime: 0,
};

// Initialized to safe empty defaults so the idle starfield can render behind
// the start menu before the player ever presses "Launch".
let player = null;
let enemies = [], bullets = [], particles = [], powerups = [], stars = [];

/* ==================================================================
   6. ENTITIES
   ================================================================== */

// ---- Player ship ----
function createPlayer() {
  return {
    x: W / 2, y: H * 0.7,
    vx: 0, vy: 0,
    radius: 15,
    maxSpeed: 480,
    accel: 2200,
    friction: 0.90,
    angle: -Math.PI / 2,
    invuln: 0,           // seconds of invulnerability remaining (after being hit)
    fireTimer: 0,
    fireInterval: 0.28,
    shieldTime: 0,
    rapidTime: 0,
    multiTime: 0,
    trail: [],
  };
}

function updatePlayer(dt) {
  // -- Movement: pointer/touch drag takes priority (direct steering), else keyboard (accelerated) --
  if (Input.pointerActive) {
    const dx = Input.pointerX - player.x;
    const dy = Input.pointerY - player.y;
    const d = Math.hypot(dx, dy);
    if (d > 2) {
      const pull = Math.min(d * 8, player.maxSpeed);
      player.vx = (dx / d) * pull;
      player.vy = (dy / d) * pull;
    } else {
      player.vx *= 0.8; player.vy *= 0.8;
    }
  } else {
    player.vx += Input.keyX * player.accel * dt;
    player.vy += Input.keyY * player.accel * dt;
    player.vx *= player.friction;
    player.vy *= player.friction;
    const spd = Math.hypot(player.vx, player.vy);
    if (spd > player.maxSpeed) {
      player.vx = (player.vx / spd) * player.maxSpeed;
      player.vy = (player.vy / spd) * player.maxSpeed;
    }
  }

  player.x = clamp(player.x + player.vx * dt, player.radius, W - player.radius);
  player.y = clamp(player.y + player.vy * dt, player.radius, H - player.radius);

  // Face direction of travel when moving fast enough
  const spd2 = player.vx * player.vx + player.vy * player.vy;
  if (spd2 > 400) player.angle = Math.atan2(player.vy, player.vx);

  // Engine trail particles
  player.trail.push({ x: player.x, y: player.y, life: 0.3, maxLife: 0.3 });
  if (player.trail.length > 18) player.trail.shift();
  player.trail.forEach(t => t.life -= dt);
  player.trail = player.trail.filter(t => t.life > 0);

  // Timers
  if (player.invuln > 0) player.invuln -= dt;
  if (player.shieldTime > 0) player.shieldTime -= dt;
  if (player.rapidTime > 0) player.rapidTime -= dt;
  if (player.multiTime > 0) player.multiTime -= dt;

  // Auto-fire: target nearest enemy, fallback straight up
  player.fireTimer -= dt;
  const interval = player.rapidTime > 0 ? player.fireInterval * 0.4 : player.fireInterval;
  if (player.fireTimer <= 0 && enemies.length + 0 >= 0) {
    player.fireTimer = interval;
    fireBullets();
  }
}

function fireBullets() {
  let target = null, best = Infinity;
  for (const en of enemies) {
    const d = dist2(player.x, player.y, en.x, en.y);
    if (d < best) { best = d; target = en; }
  }
  let ang = -Math.PI / 2;
  if (target) ang = Math.atan2(target.y - player.y, target.x - player.x);

  const spreadCount = player.multiTime > 0 ? 3 : 1;
  const spread = 0.22;
  for (let i = 0; i < spreadCount; i++) {
    const offset = spreadCount === 1 ? 0 : (i - (spreadCount - 1) / 2) * spread;
    const a = ang + offset;
    bullets.push({
      x: player.x + Math.cos(a) * player.radius,
      y: player.y + Math.sin(a) * player.radius,
      vx: Math.cos(a) * 720,
      vy: Math.sin(a) * 720,
      radius: 4,
      life: 1.4,
    });
  }
  Sound.shoot();
}

function drawPlayer() {
  if (!player) return; // not spawned yet (still on a menu screen)
  ctx.save();
  ctx.translate(player.x, player.y);

  // Engine trail
  player.trail.forEach(t => {
    const a = (t.life / t.maxLife) * 0.5;
    ctx.beginPath();
    ctx.fillStyle = `rgba(0, 240, 255, ${a})`;
    ctx.arc(t.x - player.x, t.y - player.y, 3 * (t.life / t.maxLife), 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.rotate(player.angle + Math.PI / 2);

  // Blink while invulnerable
  const blink = player.invuln > 0 && Math.floor(player.invuln * 12) % 2 === 0;
  ctx.globalAlpha = blink ? 0.35 : 1;

  // Shield ring
  if (player.shieldTime > 0) {
    ctx.save();
    ctx.rotate(-(player.angle + Math.PI / 2)); // undo rotation, keep ring stable
    ctx.beginPath();
    ctx.arc(0, 0, player.radius + 10, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0, 240, 255, ${0.5 + 0.3 * Math.sin(performance.now() / 120)})`;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.restore();
  }

  // Ship body — glowing hex-core triangle
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(13, 14);
  ctx.lineTo(0, 8);
  ctx.lineTo(-13, 14);
  ctx.closePath();
  ctx.fillStyle = '#0a1f26';
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 16;
  ctx.fill();
  ctx.stroke();

  // Core dot
  ctx.beginPath();
  ctx.arc(0, -2, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = '#eaffff';
  ctx.shadowBlur = 10;
  ctx.fill();

  ctx.restore();
}

// ---- Enemies ----
const ENEMY_TYPES = {
  drifter: { hp: 1, points: 10, speed: 90, radius: 16, color: '#ff2fd0' },
  splitter: { hp: 1, points: 15, speed: 110, radius: 18, color: '#ffb020' },
  chaser: { hp: 2, points: 25, speed: 70, radius: 15, color: '#ff3860' },
  shard: { hp: 1, points: 5, speed: 140, radius: 8, color: '#ff2fd0' }, // splitter fragment
};

function spawnEnemy(forceType) {
  const types = ['drifter', 'drifter', 'splitter', 'chaser'];
  const type = forceType || types[randInt(0, types.length - 1)];
  const def = ENEMY_TYPES[type];

  // Spawn just outside a random edge
  const edge = randInt(0, 3);
  let x, y;
  if (edge === 0) { x = rand(0, W); y = -30; }
  else if (edge === 1) { x = W + 30; y = rand(0, H); }
  else if (edge === 2) { x = rand(0, W); y = H + 30; }
  else { x = -30; y = rand(0, H); }

  const speedMul = 1 + (state.wave - 1) * 0.08;
  enemies.push({
    type, x, y,
    hp: def.hp,
    points: def.points,
    speed: def.speed * speedMul,
    radius: def.radius,
    color: def.color,
    angle: rand(0, Math.PI * 2),
    wobble: rand(0, 100),
    spin: rand(-2, 2),
  });
}

function updateEnemies(dt) {
  for (const en of enemies) {
    if (en.type === 'chaser') {
      const dx = player.x - en.x, dy = player.y - en.y;
      const d = Math.hypot(dx, dy) || 1;
      en.x += (dx / d) * en.speed * dt;
      en.y += (dy / d) * en.speed * dt;
    } else {
      // Drift toward player's general area with a gentle sine wobble
      const dx = player.x - en.x, dy = player.y - en.y;
      const d = Math.hypot(dx, dy) || 1;
      en.wobble += dt * 3;
      const perpX = -dy / d, perpY = dx / d;
      en.x += ((dx / d) * en.speed + perpX * Math.sin(en.wobble) * 40) * dt;
      en.y += ((dy / d) * en.speed + perpY * Math.sin(en.wobble) * 40) * dt;
    }
    en.angle += en.spin * dt;
  }
}

function drawEnemies() {
  for (const en of enemies) {
    ctx.save();
    ctx.translate(en.x, en.y);
    ctx.rotate(en.angle);
    ctx.strokeStyle = en.color;
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 2;
    ctx.shadowColor = en.color;
    ctx.shadowBlur = 14;
    ctx.beginPath();

    if (en.type === 'drifter') {
      // hexagon
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        const px = Math.cos(a) * en.radius, py = Math.sin(a) * en.radius;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
    } else if (en.type === 'splitter') {
      // triangle
      for (let i = 0; i < 3; i++) {
        const a = (Math.PI * 2 / 3) * i - Math.PI / 2;
        const px = Math.cos(a) * en.radius, py = Math.sin(a) * en.radius;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
    } else if (en.type === 'chaser') {
      // diamond
      ctx.moveTo(0, -en.radius); ctx.lineTo(en.radius, 0); ctx.lineTo(0, en.radius); ctx.lineTo(-en.radius, 0);
    } else {
      // shard: small triangle
      for (let i = 0; i < 3; i++) {
        const a = (Math.PI * 2 / 3) * i - Math.PI / 2;
        const px = Math.cos(a) * en.radius, py = Math.sin(a) * en.radius;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

// ---- Bullets ----
function updateBullets(dt) {
  for (const b of bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
  }
  bullets = bullets.filter(b => b.life > 0 && b.x > -20 && b.x < W + 20 && b.y > -20 && b.y < H + 20);
}

function drawBullets() {
  ctx.save();
  ctx.fillStyle = '#eaffff';
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 10;
  for (const b of bullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ---- Particles (explosions) ----
function spawnExplosion(x, y, color, count = 16) {
  for (let i = 0; i < count; i++) {
    const a = rand(0, Math.PI * 2);
    const spd = rand(60, 260);
    particles.push({
      x, y,
      vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
      life: rand(0.3, 0.7),
      maxLife: 0.7,
      size: rand(1.5, 4),
      color,
    });
  }
}

function updateParticles(dt) {
  for (const p of particles) {
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vx *= 0.94; p.vy *= 0.94;
    p.life -= dt;
  }
  particles = particles.filter(p => p.life > 0);
}

function drawParticles() {
  for (const p of particles) {
    const a = clamp(p.life / p.maxLife, 0, 1);
    ctx.beginPath();
    ctx.fillStyle = p.color;
    ctx.globalAlpha = a;
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// ---- Powerups ----
const POWERUP_DEFS = {
  shield: { color: '#00f0ff', symbol: '◈' },
  rapid: { color: '#ffb020', symbol: '▲' },
  multi: { color: '#ff2fd0', symbol: '✦' },
};

function spawnPowerup() {
  const types = Object.keys(POWERUP_DEFS);
  const type = types[randInt(0, types.length - 1)];
  powerups.push({
    type,
    x: rand(W * 0.15, W * 0.85),
    y: rand(H * 0.15, H * 0.7),
    radius: 14,
    life: 8,
    bob: rand(0, 10),
  });
}

function updatePowerups(dt) {
  for (const p of powerups) {
    p.life -= dt;
    p.bob += dt * 4;
  }
  powerups = powerups.filter(p => p.life > 0);
}

function drawPowerups() {
  for (const p of powerups) {
    const def = POWERUP_DEFS[p.type];
    const yOff = Math.sin(p.bob) * 4;
    ctx.save();
    ctx.translate(p.x, p.y + yOff);
    const fade = p.life < 2 ? (Math.sin(performance.now() / 80) * 0.5 + 0.5) : 1;
    ctx.globalAlpha = fade;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.strokeStyle = def.color;
    ctx.fillStyle = 'rgba(10,5,20,0.6)';
    ctx.lineWidth = 2;
    ctx.shadowColor = def.color;
    ctx.shadowBlur = 16;
    ctx.fill();
    ctx.stroke();
    ctx.font = '14px sans-serif';
    ctx.fillStyle = def.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.symbol, 0, 1);
    ctx.restore();
  }
}

// ---- Starfield background (drawn on canvas, parallax) ----
function createStars() {
  const arr = [];
  for (let i = 0; i < 90; i++) {
    arr.push({ x: rand(0, W), y: rand(0, H), size: rand(0.5, 2), speed: rand(10, 40), tw: rand(0, 10) });
  }
  return arr;
}
function updateStars(dt) {
  for (const s of stars) {
    s.y += s.speed * dt;
    s.tw += dt * 2;
    if (s.y > H) { s.y = -2; s.x = rand(0, W); }
  }
}
function drawStars() {
  for (const s of stars) {
    const a = 0.4 + 0.4 * Math.sin(s.tw);
    ctx.beginPath();
    ctx.fillStyle = `rgba(180, 220, 255, ${a})`;
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ==================================================================
   7. COLLISIONS
   ================================================================== */
function handleCollisions() {
  // Bullets vs enemies
  for (const b of bullets) {
    for (const en of enemies) {
      if (en._dead) continue;
      const rr = (b.radius + en.radius) ** 2;
      if (dist2(b.x, b.y, en.x, en.y) < rr) {
        b.life = 0;
        en.hp -= 1;
        if (en.hp <= 0) {
          en._dead = true;
          onEnemyKilled(en);
        } else {
          Sound.hit();
        }
        break;
      }
    }
  }
  enemies = enemies.filter(en => !en._dead);
  bullets = bullets.filter(b => b.life > 0);

  // Player vs enemies
  if (player.invuln <= 0) {
    for (const en of enemies) {
      const rr = (player.radius + en.radius - 4) ** 2;
      if (dist2(player.x, player.y, en.x, en.y) < rr) {
        if (player.shieldTime > 0) {
          // Shield absorbs the hit — destroy the enemy instead
          en._dead = true;
          spawnExplosion(en.x, en.y, en.color, 14);
          Sound.hit();
        } else {
          damagePlayer();
        }
        break;
      }
    }
    enemies = enemies.filter(en => !en._dead);
  }

  // Player vs powerups
  for (const p of powerups) {
    const rr = (player.radius + p.radius) ** 2;
    if (dist2(player.x, player.y, p.x, p.y) < rr) {
      applyPowerup(p.type);
      p.life = 0;
      spawnScoreToast(p.x, p.y, POWERUP_DEFS[p.type].symbol, POWERUP_DEFS[p.type].color);
      Sound.powerup();
    }
  }
  powerups = powerups.filter(p => p.life > 0);
}

function onEnemyKilled(en) {
  state.score += en.points;
  spawnExplosion(en.x, en.y, en.color, en.type === 'shard' ? 8 : 18);
  spawnScoreToast(en.x, en.y, `+${en.points}`, '#ffb020');
  Sound.explosion();

  // Splitters break into two fast shards on death
  if (en.type === 'splitter') {
    for (let i = 0; i < 2; i++) {
      enemies.push({
        type: 'shard',
        x: en.x, y: en.y,
        hp: 1, points: ENEMY_TYPES.shard.points,
        speed: ENEMY_TYPES.shard.speed * (1 + (state.wave - 1) * 0.08),
        radius: ENEMY_TYPES.shard.radius,
        color: ENEMY_TYPES.shard.color,
        angle: rand(0, Math.PI * 2),
        wobble: rand(0, 100),
        spin: rand(-3, 3),
      });
    }
  }
}

function applyPowerup(type) {
  if (type === 'shield') player.shieldTime = 6;
  if (type === 'rapid') player.rapidTime = 8;
  if (type === 'multi') player.multiTime = 8;
}

function damagePlayer() {
  state.lives -= 1;
  player.invuln = 1.6;
  state.shakeTime = 0.25;
  spawnExplosion(player.x, player.y, '#00f0ff', 22);
  Sound.hit();
  updateLivesHUD();
  if (state.lives <= 0) {
    triggerGameOver();
  }
}

/* ==================================================================
   8. SCORE TOASTS (DOM, cheap and simple for infrequent events)
   ================================================================== */
function spawnScoreToast(x, y, text, color) {
  const layer = document.getElementById('toast-layer');
  const el = document.createElement('div');
  el.className = 'score-toast';
  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.color = color;
  layer.appendChild(el);
  setTimeout(() => el.remove(), 950);
}

/* ==================================================================
   9. HUD
   ================================================================== */
function updateLivesHUD() {
  const container = document.getElementById('hud-lives');
  container.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const life = document.createElement('div');
    life.className = 'life-icon' + (i >= state.lives ? ' lost' : '');
    container.appendChild(life);
  }
}

function updateScoreHUD() {
  document.getElementById('hud-score').textContent = Math.floor(state.score);
}

function updateWaveHUD() {
  document.getElementById('hud-wave').textContent = state.wave;
}

/* ==================================================================
   10. SPAWNING / DIFFICULTY
   ================================================================== */
function updateSpawning(dt) {
  state.survivalTime += dt;

  const newWave = 1 + Math.floor(state.survivalTime / 18);
  if (newWave !== state.wave) {
    state.wave = newWave;
    updateWaveHUD();
  }

  const spawnInterval = Math.max(0.45, 1.4 - state.wave * 0.09);
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    state.spawnTimer = spawnInterval;
    spawnEnemy();
    if (state.wave >= 3 && Math.random() < 0.3) spawnEnemy(); // occasional double spawn at higher waves
  }

  state.powerupTimer -= dt;
  if (state.powerupTimer <= 0) {
    state.powerupTimer = rand(9, 14);
    spawnPowerup();
  }

  // Passive score for survival
  state.score += dt * 4;
}

/* ==================================================================
   11. MAIN LOOP
   ================================================================== */
function update(dt) {
  updatePlayer(dt);
  updateEnemies(dt);
  updateBullets(dt);
  updateParticles(dt);
  updatePowerups(dt);
  updateStars(dt);
  handleCollisions();
  updateSpawning(dt);
  updateScoreHUD();
  if (state.shakeTime > 0) state.shakeTime -= dt;
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  // Screen shake offset
  let shakeX = 0, shakeY = 0;
  if (state.shakeTime > 0) {
    shakeX = rand(-6, 6) * (state.shakeTime / 0.25);
    shakeY = rand(-6, 6) * (state.shakeTime / 0.25);
  }
  ctx.save();
  ctx.translate(shakeX, shakeY);

  drawStars();
  drawPowerups();
  drawParticles();
  drawEnemies();
  drawBullets();
  drawPlayer();

  ctx.restore();
}

function loop(ts) {
  if (state.mode === 'playing') {
    const dt = Math.min((ts - state.lastTime) / 1000, 0.05); // clamp to avoid huge steps on tab refocus
    state.lastTime = ts;
    update(dt);
  } else {
    state.lastTime = ts;
  }
  draw();
  requestAnimationFrame(loop);
}

/* ==================================================================
   12. SCREEN / STATE MANAGEMENT
   ================================================================== */
const screens = {
  start: document.getElementById('screen-start'),
  howto: document.getElementById('screen-howto'),
  pause: document.getElementById('screen-pause'),
  gameover: document.getElementById('screen-gameover'),
};
const hud = document.getElementById('hud');
const touchHint = document.getElementById('touch-hint');

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.add('hidden'));
  if (name) screens[name].classList.remove('hidden');
}

function startGame() {
  Sound.init();
  Sound.startMusic();
  Sound.click();

  player = createPlayer();
  enemies = [];
  bullets = [];
  particles = [];
  powerups = [];
  stars = createStars();

  state.mode = 'playing';
  state.score = 0;
  state.lives = 3;
  state.wave = 1;
  state.survivalTime = 0;
  state.spawnTimer = 0.6;
  state.powerupTimer = 8;
  state.shakeTime = 0;
  state.lastTime = performance.now();

  updateLivesHUD();
  updateScoreHUD();
  updateWaveHUD();
  showScreen(null);
  hud.classList.remove('hidden');

  // Show the drag hint briefly on touch devices only
  if ('ontouchstart' in window) {
    touchHint.classList.remove('hidden');
    setTimeout(() => touchHint.classList.add('hidden'), 3500);
  }
}

function togglePause() {
  if (state.mode === 'playing') {
    state.mode = 'paused';
    Sound.click();
    showScreen('pause');
  } else if (state.mode === 'paused') {
    state.mode = 'playing';
    state.lastTime = performance.now();
    Sound.click();
    showScreen(null);
  }
}

function triggerGameOver() {
  state.mode = 'gameover';
  Sound.stopMusic();
  Sound.gameover();
  hud.classList.add('hidden');

  const isRecord = state.score > state.highScore;
  if (isRecord) {
    state.highScore = Math.floor(state.score);
    localStorage.setItem('hexdrift_highscore', String(state.highScore));
  }

  document.getElementById('final-score').textContent = Math.floor(state.score);
  document.getElementById('final-highscore').textContent = Math.floor(state.highScore);
  document.getElementById('newrecord-badge').classList.toggle('hidden', !isRecord);

  showScreen('gameover');
}

function returnToMenu() {
  state.mode = 'menu';
  Sound.stopMusic();
  hud.classList.add('hidden');
  document.getElementById('start-highscore').textContent = Math.floor(state.highScore);
  showScreen('start');
}

/* ==================================================================
   13. UI WIRING
   ================================================================== */
document.getElementById('start-highscore').textContent = Math.floor(state.highScore);

document.getElementById('btn-start').addEventListener('click', () => startGame());

document.getElementById('btn-howto').addEventListener('click', () => { Sound.init(); Sound.click(); showScreen('howto'); });
document.getElementById('btn-howto-close').addEventListener('click', () => { Sound.click(); showScreen('start'); });

document.getElementById('btn-pause').addEventListener('click', () => togglePause());
document.getElementById('btn-resume').addEventListener('click', () => togglePause());
document.getElementById('btn-restart-pause').addEventListener('click', () => startGame());
document.getElementById('btn-menu-pause').addEventListener('click', () => returnToMenu());

document.getElementById('btn-restart').addEventListener('click', () => startGame());
document.getElementById('btn-menu-gameover').addEventListener('click', () => returnToMenu());

const btnMute = document.getElementById('btn-mute');
const iconOn = document.getElementById('icon-sound-on');
const iconOff = document.getElementById('icon-sound-off');
btnMute.addEventListener('click', () => {
  Sound.init();
  const muted = Sound.toggleMute();
  iconOn.classList.toggle('hidden', muted);
  iconOff.classList.toggle('hidden', !muted);
});

// Pause automatically when the tab loses visibility, so play never continues off-screen
document.addEventListener('visibilitychange', () => {
  if (document.hidden && state.mode === 'playing') togglePause();
});

/* ==================================================================
   14. BOOT
   ================================================================== */
stars = createStars(); // populate idle starfield visible behind the start menu
requestAnimationFrame(loop); // begin the render loop; update() only runs
                              // once state.mode === 'playing' (see loop())
