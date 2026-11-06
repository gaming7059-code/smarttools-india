/* ==================================================================
   HEX DRIFT — PREMIUM GAME ENGINE
   Neon Void Runner: Procedural canvas rendering, Web Audio synthesis,
   Levels progression, Boss fights, In-game economy, Spaceship hangar,
   Upgrades tree, Daily missions, and Local achievements.
   ================================================================== */

'use strict';

/* ==================================================================
   1. CANVAS SETUP & RESPONSIVE SCALING
   ================================================================== */
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let DPR = Math.min(window.devicePixelRatio || 1, 2);
let W = 0, H = 0;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  W = rect.width || window.innerWidth;
  H = rect.height || window.innerHeight;
  canvas.width = Math.round(W * DPR);
  canvas.height = Math.round(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 200));
resizeCanvas();

/* ==================================================================
   2. PERSISTENT STORAGE MANAGER (SAFE LOCALSTORAGE)
   ================================================================== */
const Storage = {
  get(key, fallback) {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? JSON.parse(val) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {
      // Storage unavailable or quota exceeded
    }
  },
  getInt(key, fallback = 0) {
    try {
      const val = localStorage.getItem(key);
      const parsed = parseInt(val, 10);
      return Number.isFinite(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  },
  setInt(key, val) {
    try {
      localStorage.setItem(key, String(Math.floor(val)));
    } catch {
      // Storage unavailable
    }
  }
};

/* ==================================================================
   3. AUDIO ENGINE (LIVE WEB AUDIO API SYNTHESIZER)
   ================================================================== */
const Sound = (() => {
  let ctxA = null;
  let master = null;
  let musicGain = null;
  let sfxGain = null;
  let muted = false;
  let musicTimer = null;
  let musicStep = 0;

  const SCALE = [110.0, 130.81, 146.83, 164.81, 196.0, 220.0, 261.63];

  function ensureCtx() {
    if (!ctxA) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      ctxA = new AudioCtx();
      master = ctxA.createGain();
      master.gain.value = 1;
      master.connect(ctxA.destination);

      musicGain = ctxA.createGain();
      musicGain.gain.value = 0.16;
      musicGain.connect(master);

      sfxGain = ctxA.createGain();
      sfxGain.gain.value = 0.5;
      sfxGain.connect(master);
    }
    if (ctxA && ctxA.state === 'suspended') {
      ctxA.resume();
    }
  }

  function tone(freq, duration, type = 'sine', startGain = 0.5, glideTo = null) {
    if (!ctxA) return;
    try {
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
    } catch {
      // Audio node failure
    }
  }

  function noiseBurst(duration, filterFreq = 1200, gainStart = 0.6) {
    if (!ctxA) return;
    try {
      const bufferSize = Math.floor(ctxA.sampleRate * duration);
      const buffer = ctxA.createBuffer(1, bufferSize, ctxA.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const src = ctxA.createBufferSource();
      src.buffer = buffer;
      const filter = ctxA.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterFreq, ctxA.currentTime);
      filter.frequency.exponentialRampToValueAtTime(100, ctxA.currentTime + duration);
      const gain = ctxA.createGain();
      gain.gain.setValueAtTime(gainStart, ctxA.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctxA.currentTime + duration);
      src.connect(filter).connect(gain).connect(sfxGain);
      src.start();
    } catch {
      // Noise burst failure
    }
  }

  function scheduleMusicStep() {
    if (!ctxA || muted) {
      musicTimer = setTimeout(scheduleMusicStep, 360);
      return;
    }
    const beatMs = 380;
    const note = SCALE[musicStep % SCALE.length];
    tone(note, 0.45, 'triangle', 0.04);
    if (musicStep % 4 === 0) {
      tone(note / 4, 0.8, 'sine', 0.08);
    }
    musicStep++;
    musicTimer = setTimeout(scheduleMusicStep, beatMs);
  }

  return {
    init() { ensureCtx(); },
    resume() { ensureCtx(); },
    shoot() { ensureCtx(); tone(880, 0.07, 'square', 0.11, 1450); },
    bossShoot() { ensureCtx(); tone(440, 0.12, 'sawtooth', 0.22, 180); },
    hit() { ensureCtx(); tone(160, 0.16, 'sawtooth', 0.28, 60); },
    explosion() { ensureCtx(); noiseBurst(0.35, 1600, 0.5); },
    bossExplosion() {
      ensureCtx();
      noiseBurst(0.85, 900, 0.8);
      setTimeout(() => tone(220, 0.5, 'sine', 0.35, 55), 100);
    },
    powerup() {
      ensureCtx();
      [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.12, 'sine', 0.22), i * 50));
    },
    coin() {
      ensureCtx();
      tone(1320, 0.08, 'sine', 0.2, 1760);
    },
    levelUp() {
      ensureCtx();
      [440, 554, 659, 880].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'triangle', 0.3), i * 70));
    },
    bossWarning() {
      ensureCtx();
      tone(280, 0.28, 'sawtooth', 0.35, 120);
      setTimeout(() => tone(340, 0.28, 'sawtooth', 0.35, 140), 320);
    },
    achievement() {
      ensureCtx();
      [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => tone(f, 0.2, 'sine', 0.25), i * 65));
    },
    click() { ensureCtx(); tone(600, 0.05, 'square', 0.12, 900); },
    gameover() { ensureCtx(); tone(260, 0.8, 'sawtooth', 0.32, 50); },
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
      if (master && ctxA) master.gain.setTargetAtTime(muted ? 0 : 1, ctxA.currentTime, 0.05);
      return muted;
    },
    isMuted() { return muted; }
  };
})();

/* ==================================================================
   4. SPACESHIP CATALOG & UPGRADE SYSTEM DEFINITIONS
   ================================================================== */
const SHIPS = {
  viper: {
    id: 'viper',
    name: 'VIPER ALPHA',
    trait: 'Balanced Interceptor',
    price: 0,
    speedMul: 1.0,
    hullBonus: 0,
    damageMul: 1.0,
    fireRateMul: 1.0,
    color: '#00f0ff',
    desc: 'Standard agile interceptor with reliable plasma cannons.'
  },
  phantom: {
    id: 'phantom',
    name: 'NEON PHANTOM',
    trait: '+20% Speed & Rapid Duration',
    price: 150,
    speedMul: 1.2,
    hullBonus: 0,
    damageMul: 1.05,
    fireRateMul: 1.1,
    color: '#8b5cf6',
    desc: 'Stealth-frame void runner with high velocity and rapid fire endurance.'
  },
  titan: {
    id: 'titan',
    name: 'AEGIS TITAN',
    trait: '+1 Extra Hull & Fortified Shields',
    price: 300,
    speedMul: 0.9,
    hullBonus: 1,
    damageMul: 1.15,
    fireRateMul: 0.95,
    color: '#10b981',
    desc: 'Heavy armored hull featuring reinforced bulkheads and prolonged shields.'
  },
  pulsar: {
    id: 'pulsar',
    name: 'VORTEX PULSAR',
    trait: '+25% Cannon RoF & High Damage',
    price: 500,
    speedMul: 1.05,
    hullBonus: 0,
    damageMul: 1.25,
    fireRateMul: 1.25,
    color: '#ffb020',
    desc: 'High-frequency dual-core striker with accelerated energy discharge.'
  },
  reaver: {
    id: 'reaver',
    name: 'VOID REAVER',
    trait: 'Chromatic Frame & Magnetized Core',
    price: 1000,
    speedMul: 1.15,
    hullBonus: 1,
    damageMul: 1.4,
    fireRateMul: 1.2,
    color: '#ff2fd0',
    desc: 'The ultimate apex dreadnought equipped with magnetic collector fields.'
  }
};

const UPGRADE_TIERS = {
  fireRate: {
    id: 'fireRate',
    title: 'Laser Capacitor',
    desc: 'Increases cannon rate of fire',
    prices: [0, 40, 80, 150, 300],
    bonuses: [0, 0.08, 0.16, 0.24, 0.35] // fire interval reduction %
  },
  plasmaDmg: {
    id: 'plasmaDmg',
    title: 'Plasma Overcharge',
    desc: 'Boosts plasma bolt damage & velocity',
    prices: [0, 40, 80, 150, 300],
    bonuses: [1.0, 1.15, 1.3, 1.5, 1.75] // damage multiplier
  },
  shieldMax: {
    id: 'shieldMax',
    title: 'Kinetic Barrier Matrix',
    desc: 'Extends shield pickup duration',
    prices: [0, 40, 80, 150, 300],
    bonuses: [6.0, 7.5, 9.0, 11.0, 14.0] // seconds of shield
  },
  magnet: {
    id: 'magnet',
    title: 'Flux Grav-Magnet',
    desc: 'Attracts energy coins from afar',
    prices: [0, 35, 70, 140, 280],
    bonuses: [45, 80, 125, 175, 240] // pixel radius
  }
};

/* ==================================================================
   5. ACHIEVEMENTS & DAILY MISSIONS DEFINITIONS
   ================================================================== */
const ACHIEVEMENTS_LIST = [
  { id: 'FIRST_KILL', name: 'First Blood', desc: 'Destroy your first geometric enemy', icon: '🎯', reward: 20 },
  { id: 'KILLS_50', name: 'Void Hunter', desc: 'Destroy 50 enemies in total', icon: '⚔️', reward: 50, req: 50 },
  { id: 'KILLS_150', name: 'Hex Assassin', desc: 'Destroy 150 enemies in total', icon: '⚡', reward: 100, req: 150 },
  { id: 'BOSS_KILL', name: 'Dreadnought Slayer', desc: 'Defeat a Level 5 Dreadnought Boss', icon: '☠️', reward: 150 },
  { id: 'SURVIVE_3M', name: 'Endurance Pilot', desc: 'Survive 3 minutes in a single run', icon: '⏱️', reward: 75, req: 180 },
  { id: 'SURVIVE_5M', name: 'Void Legend', desc: 'Survive 5 minutes in a single run', icon: '👑', reward: 150, req: 300 },
  { id: 'COIN_COLLECTOR', name: 'Crypto Harvester', desc: 'Collect 100 energy coins total', icon: '◈', reward: 60, req: 100 },
  { id: 'COIN_TYCOON', name: 'Neon Tycoon', desc: 'Collect 500 energy coins total', icon: '💎', reward: 150, req: 500 },
  { id: 'UPGRADE_MAX', name: 'Overclocked', desc: 'Max out any system upgrade to Tier 5', icon: '🔧', reward: 100 },
  { id: 'FLEET_OWNER', name: 'Fleet Commander', desc: 'Unlock any 3 spaceships in the Hangar', icon: '🚀', reward: 200 }
];

/* ==================================================================
   6. GLOBAL GAME STATE
   ================================================================== */
const state = {
  mode: 'menu',      // 'menu' | 'playing' | 'paused' | 'gameover'
  score: 0,
  highScore: Storage.getInt('hexdrift_highscore', 0),
  coins: Storage.getInt('hexdrift_coins', 0),
  runCoins: 0,
  lives: 3,
  maxLives: 3,

  // Level Progression
  level: 1,
  wave: 1,
  levelKills: 0,
  levelTargetKills: 12,
  totalRunKills: 0,
  bossesDefeated: 0,

  survivalTime: 0,
  spawnTimer: 0,
  powerupTimer: 0,
  shakeTime: 0,
  lastTime: 0,

  // Active Profile & Upgrades
  unlockedShips: Storage.get('hexdrift_ships', ['viper']),
  equippedShip: Storage.get('hexdrift_equipped_ship', 'viper'),
  upgrades: Storage.get('hexdrift_upgrades', { fireRate: 1, plasmaDmg: 1, shieldMax: 1, magnet: 1 }),
  stats: Storage.get('hexdrift_stats', { totalKills: 0, bossesDefeated: 0, totalCoins: 0, timeSurvived: 0, gamesPlayed: 0 }),
  achievements: Storage.get('hexdrift_achievements', {}),
  missions: null, // Initialized in initMissions()
};

let player = null;
let enemies = [];
let bullets = [];
let bossBullets = [];
let particles = [];
let powerups = [];
let coins = [];
let stars = [];
let currentBoss = null;

/* ==================================================================
   7. INPUT HANDLING (KEYBOARD + TOUCH + MOUSE)
   ================================================================== */
const Input = {
  keyX: 0, keyY: 0,
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
  if (e.code === 'KeyM') toggleMute();
});
window.addEventListener('keyup', (e) => {
  const mapped = KEY_MAP[e.code];
  if (mapped) { Input._keys.delete(mapped); updateKeyVector(); }
});

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
  const hint = document.getElementById('touch-hint');
  if (hint) hint.classList.add('hidden');
}

/* ==================================================================
   8. UTILITIES
   ================================================================== */
const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const dist2 = (ax, ay, bx, by) => (ax - bx) ** 2 + (ay - by) ** 2;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ==================================================================
   9. ENTITIES CREATION & UPDATES
   ================================================================== */
function createPlayer() {
  const shipDef = SHIPS[state.equippedShip] || SHIPS.viper;
  const fireTier = state.upgrades.fireRate || 1;
  const fireBonus = UPGRADE_TIERS.fireRate.bonuses[fireTier - 1] || 0;
  const baseInterval = 0.28 * (1 - fireBonus) / shipDef.fireRateMul;

  const initialLives = 3 + shipDef.hullBonus;
  state.maxLives = initialLives;
  state.lives = initialLives;

  return {
    x: W / 2, y: H * 0.72,
    vx: 0, vy: 0,
    radius: 16,
    maxSpeed: 480 * shipDef.speedMul,
    accel: 2400,
    friction: 0.90,
    angle: -Math.PI / 2,
    invuln: 0,
    fireTimer: 0,
    fireInterval: Math.max(0.12, baseInterval),
    shieldTime: 0,
    rapidTime: 0,
    multiTime: 0,
    trail: [],
    shipDef
  };
}

function updatePlayer(dt) {
  if (!player) return;

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

  const spd2 = player.vx * player.vx + player.vy * player.vy;
  if (spd2 > 400) player.angle = Math.atan2(player.vy, player.vx);

  // Engine trail
  player.trail.push({ x: player.x, y: player.y, life: 0.32, maxLife: 0.32 });
  if (player.trail.length > 20) player.trail.shift();
  player.trail.forEach(t => t.life -= dt);
  player.trail = player.trail.filter(t => t.life > 0);

  // Timers
  if (player.invuln > 0) player.invuln -= dt;
  if (player.shieldTime > 0) player.shieldTime -= dt;
  if (player.rapidTime > 0) player.rapidTime -= dt;
  if (player.multiTime > 0) player.multiTime -= dt;

  // Auto-fire
  player.fireTimer -= dt;
  const interval = player.rapidTime > 0 ? player.fireInterval * 0.42 : player.fireInterval;
  if (player.fireTimer <= 0) {
    player.fireTimer = interval;
    fireBullets();
  }
}

function fireBullets() {
  if (!player) return;

  // Prioritize Boss, then nearest enemy, fallback straight forward
  let target = null, best = Infinity;
  if (currentBoss && currentBoss.hp > 0) {
    target = currentBoss;
  } else {
    for (const en of enemies) {
      const d = dist2(player.x, player.y, en.x, en.y);
      if (d < best) { best = d; target = en; }
    }
  }

  let ang = -Math.PI / 2;
  if (target) ang = Math.atan2(target.y - player.y, target.x - player.x);

  const dmgTier = state.upgrades.plasmaDmg || 1;
  const dmgMul = UPGRADE_TIERS.plasmaDmg.bonuses[dmgTier - 1] * player.shipDef.damageMul;
  const bulletSpeed = 740 * (1 + (dmgTier - 1) * 0.05);

  const spreadCount = player.multiTime > 0 ? 3 : (player.shipDef.id === 'reaver' ? 2 : 1);
  const spread = 0.22;

  for (let i = 0; i < spreadCount; i++) {
    const offset = spreadCount === 1 ? 0 : (i - (spreadCount - 1) / 2) * spread;
    const a = ang + offset;
    bullets.push({
      x: player.x + Math.cos(a) * player.radius,
      y: player.y + Math.sin(a) * player.radius,
      vx: Math.cos(a) * bulletSpeed,
      vy: Math.sin(a) * bulletSpeed,
      damage: 1 * dmgMul,
      radius: 4.5,
      life: 1.4,
      color: player.shipDef.color
    });
  }
  Sound.shoot();
}

function drawPlayer() {
  if (!player) return;
  ctx.save();
  ctx.translate(player.x, player.y);

  // Engine trail
  player.trail.forEach(t => {
    const a = (t.life / t.maxLife) * 0.55;
    ctx.beginPath();
    ctx.fillStyle = player.shipDef.color;
    ctx.globalAlpha = a;
    ctx.arc(t.x - player.x, t.y - player.y, 3.5 * (t.life / t.maxLife), 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  ctx.rotate(player.angle + Math.PI / 2);

  // Invulnerability blink
  const blink = player.invuln > 0 && Math.floor(player.invuln * 14) % 2 === 0;
  ctx.globalAlpha = blink ? 0.35 : 1;

  // Active Shield Bubble
  if (player.shieldTime > 0) {
    ctx.save();
    ctx.rotate(-(player.angle + Math.PI / 2));
    ctx.beginPath();
    ctx.arc(0, 0, player.radius + 12, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0, 240, 255, ${0.5 + 0.35 * Math.sin(performance.now() / 110)})`;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.restore();
  }

  // Draw Specific Ship Geometry
  ctx.strokeStyle = player.shipDef.color;
  ctx.fillStyle = '#0a1424';
  ctx.lineWidth = 2.2;
  ctx.shadowColor = player.shipDef.color;
  ctx.shadowBlur = 16;
  ctx.beginPath();

  if (player.shipDef.id === 'phantom') {
    // Twin-wing agile stealth jet
    ctx.moveTo(0, -19);
    ctx.lineTo(16, 12);
    ctx.lineTo(8, 8);
    ctx.lineTo(0, 16);
    ctx.lineTo(-8, 8);
    ctx.lineTo(-16, 12);
  } else if (player.shipDef.id === 'titan') {
    // Heavy armored hexagon dreadnought
    ctx.moveTo(0, -18);
    ctx.lineTo(16, -6);
    ctx.lineTo(16, 12);
    ctx.lineTo(0, 8);
    ctx.lineTo(-16, 12);
    ctx.lineTo(-16, -6);
  } else if (player.shipDef.id === 'pulsar') {
    // Twin cannon golden striker
    ctx.moveTo(0, -18);
    ctx.lineTo(12, 0);
    ctx.lineTo(14, 16);
    ctx.lineTo(0, 6);
    ctx.lineTo(-14, 16);
    ctx.lineTo(-12, 0);
  } else if (player.shipDef.id === 'reaver') {
    // Chromatic apex void reaver
    ctx.moveTo(0, -22);
    ctx.lineTo(18, 14);
    ctx.lineTo(4, 10);
    ctx.lineTo(0, 18);
    ctx.lineTo(-4, 10);
    ctx.lineTo(-18, 14);
  } else {
    // Default Viper Interceptor
    ctx.moveTo(0, -18);
    ctx.lineTo(13, 14);
    ctx.lineTo(0, 8);
    ctx.lineTo(-13, 14);
  }

  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Core energy dot
  ctx.beginPath();
  ctx.arc(0, -2, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.shadowBlur = 10;
  ctx.fill();

  ctx.restore();
}

/* ==================================================================
   10. ENEMY TYPES & SPAWNING
   ================================================================== */
const ENEMY_TYPES = {
  drifter: { hp: 1, points: 10, speed: 90, radius: 16, color: '#ff2fd0' },
  splitter: { hp: 1, points: 15, speed: 110, radius: 18, color: '#ffb020' },
  chaser: { hp: 2, points: 25, speed: 75, radius: 15, color: '#ff3860' },
  shard: { hp: 1, points: 5, speed: 145, radius: 8, color: '#ff2fd0' },
  orbital: { hp: 3, points: 35, speed: 65, radius: 20, color: '#8b5cf6' }
};

function spawnEnemy(forceType) {
  // Select enemy types available based on current level
  const pool = ['drifter'];
  if (state.level >= 2) pool.push('drifter', 'splitter');
  if (state.level >= 3) pool.push('chaser');
  if (state.level >= 4) pool.push('orbital');

  const type = forceType || pool[randInt(0, pool.length - 1)];
  const def = ENEMY_TYPES[type] || ENEMY_TYPES.drifter;

  const edge = randInt(0, 3);
  let x, y;
  if (edge === 0) { x = rand(0, W); y = -30; }
  else if (edge === 1) { x = W + 30; y = rand(0, H); }
  else if (edge === 2) { x = rand(0, W); y = H + 30; }
  else { x = -30; y = rand(0, H); }

  const levelSpeedMul = 1 + (state.level - 1) * 0.08;
  enemies.push({
    type, x, y,
    hp: def.hp,
    maxHp: def.hp,
    points: def.points,
    speed: def.speed * levelSpeedMul,
    radius: def.radius,
    color: def.color,
    angle: rand(0, Math.PI * 2),
    wobble: rand(0, 100),
    spin: rand(-2.5, 2.5),
  });
}

function updateEnemies(dt) {
  if (!player) return;

  for (const en of enemies) {
    if (en.type === 'chaser') {
      const dx = player.x - en.x, dy = player.y - en.y;
      const d = Math.hypot(dx, dy) || 1;
      en.x += (dx / d) * en.speed * dt;
      en.y += (dy / d) * en.speed * dt;
    } else {
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
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 2;
    ctx.shadowColor = en.color;
    ctx.shadowBlur = 14;
    ctx.beginPath();

    if (en.type === 'drifter') {
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        const px = Math.cos(a) * en.radius, py = Math.sin(a) * en.radius;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
    } else if (en.type === 'splitter') {
      for (let i = 0; i < 3; i++) {
        const a = (Math.PI * 2 / 3) * i - Math.PI / 2;
        const px = Math.cos(a) * en.radius, py = Math.sin(a) * en.radius;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
    } else if (en.type === 'chaser') {
      ctx.moveTo(0, -en.radius);
      ctx.lineTo(en.radius, 0);
      ctx.lineTo(0, en.radius);
      ctx.lineTo(-en.radius, 0);
    } else if (en.type === 'orbital') {
      // 8-point heavy spiked crystal
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI / 4) * i;
        const r = i % 2 === 0 ? en.radius : en.radius * 0.6;
        const px = Math.cos(a) * r, py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
    } else {
      // Shard
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

/* ==================================================================
   11. BOSS FIGHT ENGINE (DREADNOUGHT SOVEREIGN)
   ================================================================== */
function spawnBoss() {
  const bossTier = Math.floor(state.level / 5) || 1;
  const maxHp = 80 + (bossTier - 1) * 60;

  currentBoss = {
    name: bossTier === 1 ? 'DREADNOUGHT VEX-9' : `VOID EMPEROR TIER-${bossTier}`,
    hp: maxHp,
    maxHp,
    radius: 46,
    x: W / 2,
    y: -80,
    targetY: clamp(H * 0.22, 100, 180),
    vx: 90,
    vy: 0,
    angle: 0,
    attackTimer: 2.2,
    phase: 0,
    flashTime: 0,
    burstCount: 0,
  };

  // Show Alert Banner & Audio
  const banner = document.getElementById('banner-boss-warning');
  if (banner) {
    banner.classList.remove('hidden');
    setTimeout(() => banner.classList.add('hidden'), 2800);
  }
  Sound.bossWarning();

  // Show Boss HUD Bar
  const bossBar = document.getElementById('hud-boss-bar');
  if (bossBar) {
    bossBar.classList.remove('hidden');
    document.getElementById('boss-name').textContent = currentBoss.name;
    updateBossHUD();
  }
}

function updateBossHUD() {
  if (!currentBoss) return;
  const pct = Math.max(0, Math.min(100, (currentBoss.hp / currentBoss.maxHp) * 100));
  const hpFill = document.getElementById('boss-hp-fill');
  const hpPct = document.getElementById('boss-hp-pct');
  if (hpFill) hpFill.style.width = `${pct}%`;
  if (hpPct) hpPct.textContent = `${Math.ceil(pct)}%`;
}

function updateBoss(dt) {
  if (!currentBoss) return;
  const b = currentBoss;

  // Entry slide down
  if (b.y < b.targetY) {
    b.y += 120 * dt;
  } else {
    // Horizontal sweep movement across top screen corridor
    b.x += b.vx * dt;
    if (b.x > W - b.radius - 20) { b.vx = -Math.abs(b.vx); }
    if (b.x < b.radius + 20) { b.vx = Math.abs(b.vx); }
  }

  b.angle += dt * 0.8;
  if (b.flashTime > 0) b.flashTime -= dt;

  // Attacks Cycle
  b.attackTimer -= dt;
  if (b.attackTimer <= 0) {
    b.phase = (b.phase + 1) % 3;
    executeBossAttack(b);
    b.attackTimer = rand(2.0, 3.2);
  }
}

function executeBossAttack(b) {
  Sound.bossShoot();

  if (b.phase === 0) {
    // Attack 1: Targeted Plasma volley at player (3 to 5 bolts)
    const ang = Math.atan2(player.y - b.y, player.x - b.x);
    for (let i = -2; i <= 2; i++) {
      const a = ang + i * 0.16;
      bossBullets.push({
        x: b.x, y: b.y + 20,
        vx: Math.cos(a) * 280,
        vy: Math.sin(a) * 280,
        radius: 6,
        life: 4.0,
        color: '#ff2fd0'
      });
    }
  } else if (b.phase === 1) {
    // Attack 2: 12-point circular geometric ring explosion
    for (let i = 0; i < 12; i++) {
      const a = (Math.PI * 2 / 12) * i + b.angle;
      bossBullets.push({
        x: b.x, y: b.y,
        vx: Math.cos(a) * 210,
        vy: Math.sin(a) * 210,
        radius: 5,
        life: 3.5,
        color: '#ffb020'
      });
    }
  } else {
    // Attack 3: Launch 2 escort shard chasers
    spawnEnemy('chaser');
    spawnEnemy('drifter');
  }
}

function drawBoss() {
  if (!currentBoss) return;
  const b = currentBoss;
  ctx.save();
  ctx.translate(b.x, b.y);

  // Thruster energy fields
  ctx.beginPath();
  ctx.fillStyle = 'rgba(255, 47, 208, 0.4)';
  ctx.arc(-24, -20, 10 + Math.sin(performance.now() / 80) * 3, 0, Math.PI * 2);
  ctx.arc(24, -20, 10 + Math.sin(performance.now() / 80) * 3, 0, Math.PI * 2);
  ctx.fill();

  // Outer armored Hexagon hull
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + b.angle;
    const px = Math.cos(a) * b.radius;
    const py = Math.sin(a) * b.radius;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();

  ctx.fillStyle = b.flashTime > 0 ? '#ffffff' : '#140520';
  ctx.strokeStyle = '#ff2fd0';
  ctx.lineWidth = 3.5;
  ctx.shadowColor = '#ff2fd0';
  ctx.shadowBlur = 24;
  ctx.fill();
  ctx.stroke();

  // Inner rotating power core
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - b.angle * 1.5;
    const px = Math.cos(a) * (b.radius * 0.5);
    const py = Math.sin(a) * (b.radius * 0.5);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#00f0ff';
  ctx.stroke();

  // Central radiant eye
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.fillStyle = '#ff0055';
  ctx.shadowColor = '#ff0055';
  ctx.shadowBlur = 16;
  ctx.fill();

  ctx.restore();
}

/* ==================================================================
   12. BULLETS & BOSS PROJECTILES
   ================================================================== */
function updateBullets(dt) {
  for (const b of bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
  }
  bullets = bullets.filter(b => b.life > 0 && b.x > -20 && b.x < W + 20 && b.y > -20 && b.y < H + 20);

  // Boss bullets
  for (const bb of bossBullets) {
    bb.x += bb.vx * dt;
    bb.y += bb.vy * dt;
    bb.life -= dt;
  }
  bossBullets = bossBullets.filter(bb => bb.life > 0 && bb.x > -30 && bb.x < W + 30 && bb.y > -30 && bb.y < H + 30);
}

function drawBullets() {
  ctx.save();
  for (const b of bullets) {
    ctx.beginPath();
    ctx.fillStyle = '#eaffff';
    ctx.shadowColor = b.color || '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw boss bullets
  for (const bb of bossBullets) {
    ctx.beginPath();
    ctx.fillStyle = bb.color;
    ctx.shadowColor = bb.color;
    ctx.shadowBlur = 12;
    ctx.arc(bb.x, bb.y, bb.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/* ==================================================================
   13. COINS SYSTEM & MAGNETIC ATTRACTION
   ================================================================== */
function spawnCoin(x, y, count = 1) {
  for (let i = 0; i < count; i++) {
    const a = rand(0, Math.PI * 2);
    const spd = rand(40, 140);
    coins.push({
      x, y,
      vx: Math.cos(a) * spd,
      vy: Math.sin(a) * spd,
      radius: 7,
      life: 14.0,
      bob: rand(0, 10)
    });
  }
}

function updateCoins(dt) {
  if (!player) return;

  const magnetTier = state.upgrades.magnet || 1;
  const shipMagnetBonus = player.shipDef.id === 'reaver' ? 60 : 0;
  const magnetRadius = UPGRADE_TIERS.magnet.bonuses[magnetTier - 1] + shipMagnetBonus;
  const magnetRadius2 = magnetRadius * magnetRadius;

  for (const c of coins) {
    c.life -= dt;
    c.bob += dt * 4;

    // Check player magnetic attraction
    const d2 = dist2(player.x, player.y, c.x, c.y);
    if (d2 < magnetRadius2) {
      const d = Math.sqrt(d2) || 1;
      const pull = Math.min(550, 40000 / (d + 20));
      c.vx += ((player.x - c.x) / d) * pull * dt;
      c.vy += ((player.y - c.y) / d) * pull * dt;
    }

    c.x += c.vx * dt;
    c.y += c.vy * dt;
    c.vx *= 0.94;
    c.vy *= 0.94;
  }

  coins = coins.filter(c => c.life > 0);
}

function drawCoins() {
  ctx.save();
  for (const c of coins) {
    const yOff = Math.sin(c.bob) * 3;
    ctx.save();
    ctx.translate(c.x, c.y + yOff);

    // Glowing diamond crystal
    ctx.beginPath();
    ctx.moveTo(0, -c.radius);
    ctx.lineTo(c.radius, 0);
    ctx.lineTo(0, c.radius);
    ctx.lineTo(-c.radius, 0);
    ctx.closePath();

    ctx.fillStyle = '#ffb020';
    ctx.shadowColor = '#ffb020';
    ctx.shadowBlur = 10;
    ctx.fill();

    ctx.restore();
  }
  ctx.restore();
}

function collectCoin(c) {
  c.life = 0;
  state.coins += 1;
  state.runCoins += 1;
  state.stats.totalCoins += 1;
  Storage.setInt('hexdrift_coins', state.coins);
  Storage.set('hexdrift_stats', state.stats);

  updateCoinsHUD();
  spawnScoreToast(c.x, c.y, '+1 ◈', '#ffb020');
  Sound.coin();

  // Progress missions & achievements
  updateMissionProgress('COINS', 1);
  checkAchievements();
}

/* ==================================================================
   14. PARTICLES & POWER-UPS
   ================================================================== */
function spawnExplosion(x, y, color, count = 18) {
  for (let i = 0; i < count; i++) {
    const a = rand(0, Math.PI * 2);
    const spd = rand(60, 280);
    particles.push({
      x, y,
      vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
      life: rand(0.3, 0.7),
      maxLife: 0.7,
      size: rand(1.5, 4.5),
      color
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

const POWERUP_DEFS = {
  shield: { color: '#00f0ff', symbol: '◈', label: 'SHIELD' },
  rapid: { color: '#ffb020', symbol: '▲', label: 'RAPID' },
  multi: { color: '#ff2fd0', symbol: '✦', label: 'MULTI' }
};

function spawnPowerup() {
  const types = Object.keys(POWERUP_DEFS);
  const type = types[randInt(0, types.length - 1)];
  powerups.push({
    type,
    x: rand(W * 0.15, W * 0.85),
    y: rand(H * 0.15, H * 0.7),
    radius: 14,
    life: 9,
    bob: rand(0, 10)
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

// Background Starfield
function createStars() {
  const arr = [];
  for (let i = 0; i < 95; i++) {
    arr.push({ x: rand(0, W), y: rand(0, H), size: rand(0.5, 2), speed: rand(10, 45), tw: rand(0, 10) });
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
   15. COLLISIONS & DAMAGE HANDLING
   ================================================================== */
function handleCollisions() {
  if (!player) return;

  // 1. Player Bullets vs Regular Enemies
  for (const b of bullets) {
    for (const en of enemies) {
      if (en._dead) continue;
      const rr = (b.radius + en.radius) ** 2;
      if (dist2(b.x, b.y, en.x, en.y) < rr) {
        b.life = 0;
        en.hp -= b.damage;
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

  // 2. Player Bullets vs Boss
  if (currentBoss && currentBoss.hp > 0) {
    for (const b of bullets) {
      const rr = (b.radius + currentBoss.radius) ** 2;
      if (dist2(b.x, b.y, currentBoss.x, currentBoss.y) < rr) {
        b.life = 0;
        currentBoss.hp -= b.damage;
        currentBoss.flashTime = 0.08;
        spawnExplosion(b.x, b.y, '#ff2fd0', 4);
        Sound.hit();
        updateBossHUD();

        if (currentBoss.hp <= 0) {
          onBossDefeated(currentBoss);
        }
        break;
      }
    }
  }

  enemies = enemies.filter(en => !en._dead);
  bullets = bullets.filter(b => b.life > 0);

  // 3. Player vs Regular Enemies
  if (player.invuln <= 0) {
    for (const en of enemies) {
      const rr = (player.radius + en.radius - 4) ** 2;
      if (dist2(player.x, player.y, en.x, en.y) < rr) {
        if (player.shieldTime > 0) {
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

  // 4. Player vs Boss Bullets
  if (player.invuln <= 0) {
    for (const bb of bossBullets) {
      const rr = (player.radius + bb.radius - 3) ** 2;
      if (dist2(player.x, player.y, bb.x, bb.y) < rr) {
        bb.life = 0;
        if (player.shieldTime > 0) {
          spawnExplosion(bb.x, bb.y, '#00f0ff', 8);
          Sound.hit();
        } else {
          damagePlayer();
        }
        break;
      }
    }
    bossBullets = bossBullets.filter(bb => bb.life > 0);
  }

  // 5. Player vs Coins
  for (const c of coins) {
    const rr = (player.radius + c.radius + 4) ** 2;
    if (dist2(player.x, player.y, c.x, c.y) < rr) {
      collectCoin(c);
    }
  }

  // 6. Player vs Power-ups
  for (const p of powerups) {
    const rr = (player.radius + p.radius) ** 2;
    if (dist2(player.x, player.y, p.x, p.y) < rr) {
      applyPowerup(p.type);
      p.life = 0;
      spawnScoreToast(p.x, p.y, POWERUP_DEFS[p.type].label, POWERUP_DEFS[p.type].color);
      Sound.powerup();
    }
  }
  powerups = powerups.filter(p => p.life > 0);
}

function onEnemyKilled(en) {
  state.score += en.points;
  state.levelKills += 1;
  state.totalRunKills += 1;
  state.stats.totalKills += 1;
  Storage.set('hexdrift_stats', state.stats);

  spawnExplosion(en.x, en.y, en.color, en.type === 'shard' ? 8 : 18);
  spawnScoreToast(en.x, en.y, `+${en.points}`, '#ffb020');
  Sound.explosion();

  // Drop 1 to 2 coins randomly
  if (Math.random() < 0.65) spawnCoin(en.x, en.y, 1);
  if (en.type === 'orbital') spawnCoin(en.x, en.y, 2);

  // Splitters break into 2 shards
  if (en.type === 'splitter') {
    for (let i = 0; i < 2; i++) {
      enemies.push({
        type: 'shard',
        x: en.x, y: en.y,
        hp: 1, points: ENEMY_TYPES.shard.points,
        speed: ENEMY_TYPES.shard.speed * (1 + (state.level - 1) * 0.08),
        radius: ENEMY_TYPES.shard.radius,
        color: ENEMY_TYPES.shard.color,
        angle: rand(0, Math.PI * 2),
        wobble: rand(0, 100),
        spin: rand(-3, 3)
      });
    }
  }

  updateLevelHUD();
  updateMissionProgress('ENEMIES', 1);
  checkAchievements();
  checkLevelProgression();
}

function onBossDefeated(b) {
  state.score += 500;
  state.bossesDefeated += 1;
  state.stats.bossesDefeated += 1;
  Storage.set('hexdrift_stats', state.stats);

  spawnExplosion(b.x, b.y, '#ff2fd0', 45);
  spawnExplosion(b.x, b.y, '#00f0ff', 30);
  spawnCoin(b.x, b.y, 18); // Generous 18 coin drop cluster!

  Sound.bossExplosion();
  state.shakeTime = 0.55;

  // Hide boss HUD
  const bossBar = document.getElementById('hud-boss-bar');
  if (bossBar) bossBar.classList.add('hidden');
  currentBoss = null;

  // Complete Boss Level & Award
  state.coins += 100;
  Storage.setInt('hexdrift_coins', state.coins);
  updateCoinsHUD();

  showLevelUpBanner('BOSS DESTROYED', '+100 COIN BOUNTY REWARDED!');
  advanceLevel();

  updateMissionProgress('BOSS', 1);
  checkAchievements();
}

function applyPowerup(type) {
  const shieldTier = state.upgrades.shieldMax || 1;
  const duration = UPGRADE_TIERS.shieldMax.bonuses[shieldTier - 1];

  if (type === 'shield') player.shieldTime = duration;
  if (type === 'rapid') player.rapidTime = 8.5;
  if (type === 'multi') player.multiTime = 8.5;
}

function damagePlayer() {
  state.lives -= 1;
  player.invuln = 1.6;
  state.shakeTime = 0.28;
  spawnExplosion(player.x, player.y, '#00f0ff', 24);
  Sound.hit();
  updateLivesHUD();

  if (state.lives <= 0) {
    triggerGameOver();
  }
}

/* ==================================================================
   16. LEVEL PROGRESSION & SPAWNING
   ================================================================== */
function checkLevelProgression() {
  if (currentBoss) return; // Wait until boss is slain

  if (state.levelKills >= state.levelTargetKills) {
    if (state.level % 5 === 4) {
      // Level 4 complete -> advance to Boss Level 5!
      advanceLevel();
      spawnBoss();
    } else {
      // Regular level advance
      const bonusCoins = 25 + state.level * 10;
      state.coins += bonusCoins;
      Storage.setInt('hexdrift_coins', state.coins);
      updateCoinsHUD();

      showLevelUpBanner(`LEVEL ${state.level + 1} REACHED`, `+${bonusCoins} BONUS COINS!`);
      advanceLevel();
    }
  }
}

function advanceLevel() {
  state.level += 1;
  state.levelKills = 0;
  state.levelTargetKills = 12 + state.level * 6;
  Sound.levelUp();
  updateLevelHUD();
  updateMissionProgress('LEVEL', state.level);
  checkAchievements();
}

function showLevelUpBanner(title, subtitle) {
  const banner = document.getElementById('banner-level-up');
  const tEl = document.getElementById('banner-level-title');
  const sEl = document.getElementById('banner-level-sub');
  if (banner && tEl && sEl) {
    tEl.textContent = title;
    sEl.textContent = subtitle;
    banner.classList.remove('hidden');
    setTimeout(() => banner.classList.add('hidden'), 2600);
  }
}

function updateSpawning(dt) {
  state.survivalTime += dt;
  state.stats.timeSurvived += dt;

  const newWave = 1 + Math.floor(state.survivalTime / 18);
  if (newWave !== state.wave) {
    state.wave = newWave;
    updateWaveHUD();
  }

  // Regular enemy spawns (reduced slightly when boss is active)
  const spawnInterval = currentBoss ? 2.5 : Math.max(0.4, 1.4 - state.level * 0.08);
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    state.spawnTimer = spawnInterval;
    spawnEnemy();
    if (state.level >= 3 && Math.random() < 0.35) spawnEnemy();
  }

  // Powerup drops
  state.powerupTimer -= dt;
  if (state.powerupTimer <= 0) {
    state.powerupTimer = rand(9, 14);
    spawnPowerup();
  }

  // Passive score
  state.score += dt * 4;
}

/* ==================================================================
   17. HUD & SCORE TOASTS
   ================================================================== */
function spawnScoreToast(x, y, text, color) {
  const layer = document.getElementById('toast-layer');
  if (!layer) return;
  const el = document.createElement('div');
  el.className = 'score-toast';
  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.color = color;
  layer.appendChild(el);
  setTimeout(() => el.remove(), 950);
}

function updateLivesHUD() {
  const container = document.getElementById('hud-lives');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < state.maxLives; i++) {
    const life = document.createElement('div');
    life.className = 'life-icon' + (i >= state.lives ? ' lost' : '');
    container.appendChild(life);
  }
}

function updateScoreHUD() {
  const el = document.getElementById('hud-score');
  if (el) el.textContent = Math.floor(state.score);
}

function updateCoinsHUD() {
  const el = document.getElementById('hud-coins');
  if (el) el.textContent = state.coins;
  const startCoins = document.getElementById('start-coins');
  if (startCoins) startCoins.textContent = state.coins;
  const shopCoins = document.getElementById('shop-coins');
  if (shopCoins) shopCoins.textContent = state.coins;
  const missionsCoins = document.getElementById('missions-coins');
  if (missionsCoins) missionsCoins.textContent = state.coins;
}

function updateWaveHUD() {
  const el = document.getElementById('hud-wave');
  if (el) el.textContent = state.wave;
}

function updateLevelHUD() {
  const lvlEl = document.getElementById('hud-level');
  if (lvlEl) lvlEl.textContent = state.level;

  const progressFill = document.getElementById('hud-level-progress');
  const targetLabel = document.getElementById('hud-level-target');
  const targetLabelName = document.getElementById('hud-level-target-label');

  if (currentBoss) {
    if (progressFill) progressFill.style.width = '100%';
    if (targetLabelName) targetLabelName.textContent = 'BOSS:';
    if (targetLabel) targetLabel.textContent = 'ACTIVE';
  } else {
    const pct = Math.min(100, Math.floor((state.levelKills / state.levelTargetKills) * 100));
    if (progressFill) progressFill.style.width = `${pct}%`;
    if (targetLabelName) targetLabelName.textContent = 'NEXT:';
    if (targetLabel) targetLabel.textContent = `${state.levelKills}/${state.levelTargetKills}`;
  }
}

/* ==================================================================
   18. MISSIONS & ACHIEVEMENTS TRACKER
   ================================================================== */
function getTodayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function initMissions() {
  const today = getTodayDateString();
  const saved = Storage.get('hexdrift_missions', null);

  if (saved && saved.date === today && Array.isArray(saved.items)) {
    state.missions = saved;
  } else {
    // Generate fresh daily missions for today
    state.missions = {
      date: today,
      items: [
        { id: 'DAILY_KILLS', title: 'Destroy 30 Enemies in the Void', type: 'ENEMIES', target: 30, progress: 0, reward: 40, claimed: false },
        { id: 'DAILY_COINS', title: 'Collect 25 Energy Crystals', type: 'COINS', target: 25, progress: 0, reward: 35, claimed: false },
        { id: 'DAILY_SURVIVE', title: 'Survive 120 Seconds in Flight', type: 'TIME', target: 120, progress: 0, reward: 50, claimed: false },
        { id: 'DAILY_BOSS', title: 'Defeat 1 Level 5 Dreadnought Boss', type: 'BOSS', target: 1, progress: 0, reward: 75, claimed: false },
      ]
    };
    Storage.set('hexdrift_missions', state.missions);
  }

  const dateBadge = document.getElementById('missions-date-badge');
  if (dateBadge) dateBadge.textContent = today;
}

function updateMissionProgress(type, amount) {
  if (!state.missions || !Array.isArray(state.missions.items)) return;
  let changed = false;

  for (const m of state.missions.items) {
    if (m.type === type && !m.claimed && m.progress < m.target) {
      if (type === 'TIME' || type === 'LEVEL') {
        m.progress = Math.max(m.progress, Math.floor(amount));
      } else {
        m.progress = Math.min(m.target, m.progress + amount);
      }
      changed = true;
    }
  }

  if (changed) {
    Storage.set('hexdrift_missions', state.missions);
  }
}

function renderMissionsUI() {
  const list = document.getElementById('daily-missions-list');
  if (!list || !state.missions) return;
  list.innerHTML = '';

  for (const m of state.missions.items) {
    const isReady = m.progress >= m.target && !m.claimed;
    const card = document.createElement('div');
    card.className = `mission-card ${isReady ? 'completed' : ''} ${m.claimed ? 'claimed' : ''}`;

    const pct = Math.min(100, Math.floor((m.progress / m.target) * 100));

    card.innerHTML = `
      <div class="mission-left">
        <div class="mission-title">${m.title}</div>
        <div class="mission-progress-track">
          <div class="mission-progress-fill" style="width: ${pct}%"></div>
        </div>
        <div class="mission-meta-text">${m.progress}/${m.target} · +${m.reward} ◈ Reward</div>
      </div>
      <div class="mission-right">
        ${
          m.claimed
            ? '<span class="stat-pill">CLAIMED</span>'
            : isReady
            ? `<button class="btn-card-action btn-buy" data-mission-id="${m.id}">CLAIM</button>`
            : '<span class="stat-pill">IN PROGRESS</span>'
        }
      </div>
    `;

    list.appendChild(card);
  }

  // Wire claim buttons
  list.querySelectorAll('button[data-mission-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-mission-id');
      claimMissionReward(id);
    });
  });
}

function claimMissionReward(missionId) {
  const m = state.missions.items.find(item => item.id === missionId);
  if (!m || m.claimed || m.progress < m.target) return;

  m.claimed = true;
  state.coins += m.reward;
  Storage.setInt('hexdrift_coins', state.coins);
  Storage.set('hexdrift_missions', state.missions);

  updateCoinsHUD();
  Sound.coin();
  renderMissionsUI();
}

function checkAchievements() {
  for (const ach of ACHIEVEMENTS_LIST) {
    if (state.achievements[ach.id]) continue; // already unlocked

    let unlock = false;
    if (ach.id === 'FIRST_KILL' && state.stats.totalKills >= 1) unlock = true;
    if (ach.id === 'KILLS_50' && state.stats.totalKills >= 50) unlock = true;
    if (ach.id === 'KILLS_150' && state.stats.totalKills >= 150) unlock = true;
    if (ach.id === 'BOSS_KILL' && state.stats.bossesDefeated >= 1) unlock = true;
    if (ach.id === 'SURVIVE_3M' && state.survivalTime >= 180) unlock = true;
    if (ach.id === 'SURVIVE_5M' && state.survivalTime >= 300) unlock = true;
    if (ach.id === 'COIN_COLLECTOR' && state.stats.totalCoins >= 100) unlock = true;
    if (ach.id === 'COIN_TYCOON' && state.stats.totalCoins >= 500) unlock = true;
    if (ach.id === 'UPGRADE_MAX') {
      const anyMax = Object.values(state.upgrades).some(lvl => lvl >= 5);
      if (anyMax) unlock = true;
    }
    if (ach.id === 'FLEET_OWNER' && state.unlockedShips.length >= 3) unlock = true;

    if (unlock) {
      state.achievements[ach.id] = Date.now();
      state.coins += ach.reward;
      Storage.set('hexdrift_achievements', state.achievements);
      Storage.setInt('hexdrift_coins', state.coins);

      updateCoinsHUD();
      showAchievementToast(ach);
      Sound.achievement();
    }
  }
}

function showAchievementToast(ach) {
  const container = document.getElementById('achievement-toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'achievement-toast';
  toast.innerHTML = `
    <div class="toast-trophy">${ach.icon}</div>
    <div class="toast-body">
      <span class="toast-tag">ACHIEVEMENT UNLOCKED</span>
      <span class="toast-title">${ach.name}</span>
    </div>
    <div class="toast-reward">+${ach.reward} ◈</div>
  `;

  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3600);
}

function renderAchievementsUI() {
  const container = document.getElementById('achievements-list');
  const countEl = document.getElementById('achievements-progress-text');
  if (!container) return;
  container.innerHTML = '';

  const unlockedCount = Object.keys(state.achievements).length;
  if (countEl) countEl.textContent = `${unlockedCount}/${ACHIEVEMENTS_LIST.length} ACHIEVEMENTS UNLOCKED`;

  for (const ach of ACHIEVEMENTS_LIST) {
    const isUnlocked = Boolean(state.achievements[ach.id]);
    const card = document.createElement('div');
    card.className = `achievement-card ${isUnlocked ? 'unlocked' : ''}`;

    card.innerHTML = `
      <div class="achievement-icon-box">${ach.icon}</div>
      <div class="achievement-details">
        <span class="achievement-name">${ach.name}</span>
        <span class="achievement-desc">${ach.desc}</span>
      </div>
      <div class="achievement-reward-tag">${isUnlocked ? '✓ UNLOCKED' : `+${ach.reward} ◈`}</div>
    `;

    container.appendChild(card);
  }
}

/* ==================================================================
   19. HANGAR & UPGRADES UI
   ================================================================== */
function renderHangarUI() {
  const container = document.getElementById('ships-grid');
  if (!container) return;
  container.innerHTML = '';

  const equippedShip = state.equippedShip;

  for (const shipKey of Object.keys(SHIPS)) {
    const s = SHIPS[shipKey];
    const isUnlocked = state.unlockedShips.includes(s.id);
    const isEquipped = s.id === equippedShip;

    const card = document.createElement('div');
    card.className = `ship-card ${isEquipped ? 'equipped' : ''}`;

    card.innerHTML = `
      <div class="ship-card-left">
        <div class="ship-preview-box" style="border-color: ${s.color}">
          <svg viewBox="0 0 32 32" style="width: 26px; height: 26px; stroke: ${s.color}; fill: none; stroke-width: 2;">
            <polygon points="16,3 27,24 16,18 5,24" />
          </svg>
        </div>
        <div class="ship-details">
          <span class="ship-name">${s.name}</span>
          <span class="ship-trait">${s.trait}</span>
          <div class="ship-stats-pills">
            <span class="stat-pill">SPEED ×${s.speedMul}</span>
            <span class="stat-pill">DMG ×${s.damageMul}</span>
            ${s.hullBonus ? `<span class="stat-pill">+${s.hullBonus} HULL</span>` : ''}
          </div>
        </div>
      </div>
      <div class="ship-action">
        ${
          isEquipped
            ? '<button class="btn-card-action btn-equipped">EQUIPPED</button>'
            : isUnlocked
            ? `<button class="btn-card-action btn-equip" data-equip-ship="${s.id}">EQUIP</button>`
            : `<button class="btn-card-action btn-buy" data-buy-ship="${s.id}">BUY ${s.price} ◈</button>`
        }
      </div>
    `;

    container.appendChild(card);
  }

  // Wire Equip buttons
  container.querySelectorAll('button[data-equip-ship]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-equip-ship');
      equipShip(id);
    });
  });

  // Wire Buy buttons
  container.querySelectorAll('button[data-buy-ship]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-buy-ship');
      buyShip(id);
    });
  });
}

function equipShip(shipId) {
  if (!state.unlockedShips.includes(shipId)) return;
  state.equippedShip = shipId;
  Storage.set('hexdrift_equipped_ship', shipId);

  Sound.click();
  updateEquippedShipBadge();
  renderHangarUI();
}

function buyShip(shipId) {
  const s = SHIPS[shipId];
  if (!s || state.unlockedShips.includes(shipId)) return;

  if (state.coins >= s.price) {
    state.coins -= s.price;
    state.unlockedShips.push(shipId);
    state.equippedShip = shipId;

    Storage.setInt('hexdrift_coins', state.coins);
    Storage.set('hexdrift_ships', state.unlockedShips);
    Storage.set('hexdrift_equipped_ship', shipId);

    Sound.coin();
    updateCoinsHUD();
    updateEquippedShipBadge();
    renderHangarUI();
    checkAchievements();
  } else {
    Sound.hit();
  }
}

function updateEquippedShipBadge() {
  const nameEl = document.getElementById('start-ship-name');
  if (nameEl) {
    const s = SHIPS[state.equippedShip] || SHIPS.viper;
    nameEl.textContent = s.name;
    nameEl.style.color = s.color;
  }
}

function renderUpgradesUI() {
  const container = document.getElementById('upgrades-grid');
  if (!container) return;
  container.innerHTML = '';

  for (const upKey of Object.keys(UPGRADE_TIERS)) {
    const up = UPGRADE_TIERS[upKey];
    const curLevel = state.upgrades[upKey] || 1;
    const isMax = curLevel >= 5;
    const nextPrice = !isMax ? up.prices[curLevel] : 0;

    const card = document.createElement('div');
    card.className = 'upgrade-card';

    let pipsHtml = '';
    for (let i = 1; i <= 5; i++) {
      pipsHtml += `<div class="tier-pip ${i <= curLevel ? 'filled' : ''}"></div>`;
    }

    card.innerHTML = `
      <div class="upgrade-info">
        <span class="upgrade-title">${up.title} (Tier ${curLevel}/5)</span>
        <span class="upgrade-desc">${up.desc}</span>
        <div class="upgrade-tiers">${pipsHtml}</div>
      </div>
      <div class="upgrade-action">
        ${
          isMax
            ? '<button class="btn-card-action btn-equipped">MAX TIER</button>'
            : `<button class="btn-card-action btn-buy" data-upgrade-key="${upKey}">UPGRADE ${nextPrice} ◈</button>`
        }
      </div>
    `;

    container.appendChild(card);
  }

  container.querySelectorAll('button[data-upgrade-key]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-upgrade-key');
      buyUpgrade(key);
    });
  });
}

function buyUpgrade(key) {
  const up = UPGRADE_TIERS[key];
  if (!up) return;
  const curLevel = state.upgrades[key] || 1;
  if (curLevel >= 5) return;

  const cost = up.prices[curLevel];
  if (state.coins >= cost) {
    state.coins -= cost;
    state.upgrades[key] = curLevel + 1;

    Storage.setInt('hexdrift_coins', state.coins);
    Storage.set('hexdrift_upgrades', state.upgrades);

    Sound.coin();
    updateCoinsHUD();
    renderUpgradesUI();
    checkAchievements();
  } else {
    Sound.hit();
  }
}

/* ==================================================================
   20. MAIN GAME LOOP
   ================================================================== */
function update(dt) {
  updatePlayer(dt);
  updateEnemies(dt);
  if (currentBoss) updateBoss(dt);
  updateBullets(dt);
  updateParticles(dt);
  updatePowerups(dt);
  updateCoins(dt);
  updateStars(dt);
  handleCollisions();
  updateSpawning(dt);
  updateScoreHUD();

  // Update survival time mission
  updateMissionProgress('TIME', state.survivalTime);

  if (state.shakeTime > 0) state.shakeTime -= dt;
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  let shakeX = 0, shakeY = 0;
  if (state.shakeTime > 0) {
    shakeX = rand(-7, 7) * (state.shakeTime / 0.3);
    shakeY = rand(-7, 7) * (state.shakeTime / 0.3);
  }
  ctx.save();
  ctx.translate(shakeX, shakeY);

  drawStars();
  drawPowerups();
  drawCoins();
  drawParticles();
  drawEnemies();
  if (currentBoss) drawBoss();
  drawBullets();
  drawPlayer();

  ctx.restore();
}

function loop(ts) {
  if (state.mode === 'playing') {
    const dt = Math.min((ts - state.lastTime) / 1000, 0.05);
    state.lastTime = ts;
    update(dt);
  } else {
    state.lastTime = ts;
  }
  draw();
  requestAnimationFrame(loop);
}

/* ==================================================================
   21. SCREEN / STATE MANAGEMENT
   ================================================================== */
const screens = {
  start: document.getElementById('screen-start'),
  howto: document.getElementById('screen-howto'),
  shop: document.getElementById('screen-shop'),
  missions: document.getElementById('screen-missions'),
  pause: document.getElementById('screen-pause'),
  gameover: document.getElementById('screen-gameover')
};
const hud = document.getElementById('hud');
const touchHint = document.getElementById('touch-hint');

function showScreen(name) {
  Object.values(screens).forEach(s => {
    if (s) s.classList.add('hidden');
  });
  if (name && screens[name]) screens[name].classList.remove('hidden');
}

function startGame() {
  Sound.init();
  Sound.startMusic();
  Sound.click();

  player = createPlayer();
  enemies = [];
  bullets = [];
  bossBullets = [];
  particles = [];
  powerups = [];
  coins = [];
  currentBoss = null;
  stars = createStars();

  state.mode = 'playing';
  state.score = 0;
  state.runCoins = 0;
  state.level = 1;
  state.wave = 1;
  state.levelKills = 0;
  state.levelTargetKills = 12;
  state.totalRunKills = 0;
  state.bossesDefeated = 0;
  state.survivalTime = 0;
  state.spawnTimer = 0.6;
  state.powerupTimer = 8;
  state.shakeTime = 0;
  state.lastTime = performance.now();
  state.stats.gamesPlayed += 1;
  Storage.set('hexdrift_stats', state.stats);

  const bossBar = document.getElementById('hud-boss-bar');
  if (bossBar) bossBar.classList.add('hidden');

  updateLivesHUD();
  updateScoreHUD();
  updateCoinsHUD();
  updateWaveHUD();
  updateLevelHUD();
  showScreen(null);
  hud.classList.remove('hidden');

  if ('ontouchstart' in window && touchHint) {
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

function toggleMute() {
  Sound.init();
  const isMuted = Sound.toggleMute();
  const iconOn = document.getElementById('icon-sound-on');
  const iconOff = document.getElementById('icon-sound-off');
  if (iconOn) iconOn.classList.toggle('hidden', isMuted);
  if (iconOff) iconOff.classList.toggle('hidden', !isMuted);
}

function triggerGameOver() {
  state.mode = 'gameover';
  Sound.stopMusic();
  Sound.gameover();
  hud.classList.add('hidden');

  const isRecord = state.score > state.highScore;
  if (isRecord) {
    state.highScore = Math.floor(state.score);
    Storage.setInt('hexdrift_highscore', state.highScore);
  }

  // Populate Run Summary Stats
  const finalScoreEl = document.getElementById('final-score');
  const finalHighEl = document.getElementById('final-highscore');
  const finalLvlEl = document.getElementById('final-level');
  const finalKillsEl = document.getElementById('final-kills');
  const finalCoinsEl = document.getElementById('final-run-coins');
  const finalBossesEl = document.getElementById('final-bosses');
  const newRecBadge = document.getElementById('newrecord-badge');

  if (finalScoreEl) finalScoreEl.textContent = Math.floor(state.score);
  if (finalHighEl) finalHighEl.textContent = Math.floor(state.highScore);
  if (finalLvlEl) finalLvlEl.textContent = `LVL ${state.level}`;
  if (finalKillsEl) finalKillsEl.textContent = state.totalRunKills;
  if (finalCoinsEl) finalCoinsEl.textContent = `+${state.runCoins} ◈`;
  if (finalBossesEl) finalBossesEl.textContent = state.bossesDefeated;
  if (newRecBadge) newRecBadge.classList.toggle('hidden', !isRecord);

  showScreen('gameover');
}

function returnToMenu() {
  state.mode = 'menu';
  Sound.stopMusic();
  hud.classList.add('hidden');

  const startHighEl = document.getElementById('start-highscore');
  if (startHighEl) startHighEl.textContent = Math.floor(state.highScore);
  updateCoinsHUD();
  updateEquippedShipBadge();
  showScreen('start');
}

/* ==================================================================
   22. UI WIRING & MODAL TABS
   ================================================================== */
function setupUI() {
  // Start menu
  const startHighEl = document.getElementById('start-highscore');
  if (startHighEl) startHighEl.textContent = Math.floor(state.highScore);
  updateCoinsHUD();
  updateEquippedShipBadge();

  document.getElementById('btn-start')?.addEventListener('click', startGame);

  // Shop / Hangar
  const openShop = () => {
    Sound.init();
    Sound.click();
    renderHangarUI();
    renderUpgradesUI();
    showScreen('shop');
  };
  document.getElementById('btn-shop')?.addEventListener('click', openShop);
  document.getElementById('btn-quick-hangar')?.addEventListener('click', openShop);
  document.getElementById('btn-shop-gameover')?.addEventListener('click', openShop);
  document.getElementById('btn-shop-close')?.addEventListener('click', () => {
    Sound.click();
    returnToMenu();
  });

  // Shop Tabs
  const tabShips = document.getElementById('tab-ships');
  const tabUpgrades = document.getElementById('tab-upgrades');
  const contentShips = document.getElementById('shop-tab-ships-content');
  const contentUpgrades = document.getElementById('shop-tab-upgrades-content');

  tabShips?.addEventListener('click', () => {
    Sound.click();
    tabShips.classList.add('active');
    tabUpgrades.classList.remove('active');
    contentShips.classList.remove('hidden');
    contentUpgrades.classList.add('hidden');
  });
  tabUpgrades?.addEventListener('click', () => {
    Sound.click();
    tabUpgrades.classList.add('active');
    tabShips.classList.remove('active');
    contentUpgrades.classList.remove('hidden');
    contentShips.classList.add('hidden');
  });

  // Missions & Trophies
  document.getElementById('btn-missions')?.addEventListener('click', () => {
    Sound.init();
    Sound.click();
    renderMissionsUI();
    renderAchievementsUI();
    showScreen('missions');
  });
  document.getElementById('btn-missions-close')?.addEventListener('click', () => {
    Sound.click();
    returnToMenu();
  });

  // Missions Tabs
  const tabDaily = document.getElementById('tab-daily');
  const tabTrophies = document.getElementById('tab-trophies');
  const contentDaily = document.getElementById('missions-tab-daily-content');
  const contentTrophies = document.getElementById('missions-tab-trophies-content');

  tabDaily?.addEventListener('click', () => {
    Sound.click();
    tabDaily.classList.add('active');
    tabTrophies.classList.remove('active');
    contentDaily.classList.remove('hidden');
    contentTrophies.classList.add('hidden');
  });
  tabTrophies?.addEventListener('click', () => {
    Sound.click();
    tabTrophies.classList.add('active');
    tabDaily.classList.remove('active');
    contentTrophies.classList.remove('hidden');
    contentDaily.classList.add('hidden');
  });

  // How to Play
  document.getElementById('btn-howto')?.addEventListener('click', () => {
    Sound.init();
    Sound.click();
    showScreen('howto');
  });
  document.getElementById('btn-howto-close')?.addEventListener('click', () => {
    Sound.click();
    showScreen('start');
  });

  // Pause Controls
  document.getElementById('btn-pause')?.addEventListener('click', togglePause);
  document.getElementById('btn-resume')?.addEventListener('click', togglePause);
  document.getElementById('btn-restart-pause')?.addEventListener('click', startGame);
  document.getElementById('btn-menu-pause')?.addEventListener('click', returnToMenu);

  // Game Over
  document.getElementById('btn-restart')?.addEventListener('click', startGame);
  document.getElementById('btn-menu-gameover')?.addEventListener('click', returnToMenu);

  // Mute
  document.getElementById('btn-mute')?.addEventListener('click', toggleMute);

  // Visibility Change
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.mode === 'playing') togglePause();
  });
}

/* ==================================================================
   23. BOOT & INITIALIZATION
   ================================================================== */
initMissions();
setupUI();
stars = createStars();
requestAnimationFrame(loop);
