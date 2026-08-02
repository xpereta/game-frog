import { Sound } from "./audio";
import { AURA_MIN_FATNESS, AURA_SPAWN_INTERVAL, FATNESS_CAP, FROG_R, FROG_X, FROG_Y, H, W, WATER_Y } from "./consts";
import { BUG_SPECIES, bugRenderTransform, bugY, isOffScreen, spawnBug, updateBug } from "./bugs";
import type { Bug } from "./bugs";
import { drawFrog, drawTongue, easeFatness, frogFatness, happyJumpOffset } from "./frog";
import { bestStreakAfter, drawHud } from "./hud";
import { altitudeFor, createTongue, fireTongue, mouthY, tongueHitsBug, tongueTipY, updateTongue } from "./tongue";

type FrogState = "idle" | "happy" | "sad";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  ring?: boolean;
  star?: boolean;
}

const HAPPY_MS = 2000;
const SAD_MS = 1100;
const MAX_BUGS = 6;

const rnd = (min: number, max: number) => min + Math.random() * (max - min);

export class Game {
  private tongue = createTongue();
  private bugs: Bug[] = [];
  private grabbed: Bug[] = [];
  private particles: Particle[] = [];
  private frogState: FrogState = "idle";
  private stateTimer = 0;
  private spawnTimer = rnd(0.6, 1.4);
  private elapsed = 0;
  private hasCaught = false;
  private cloudOffset = 0;
  private caughtThisLunge = 0;
  private lastCatchCount = 0;
  private happyVariant = 0;
  private sunFlareTimer = 0;
  private frogAirborneMs = 0;
  private audio = new Sound();
  private streak = 0;
  private bestStreak = 0;
  private eatPopAt = -1;
  private fatness = 0;
  private maxCelebrated = false;
  private celebrateMoment = false;
  private auraTimer = 0;

  fire() {
    this.audio.unlock();
    if (this.tongue.state !== "idle") return;
    fireTongue(this.tongue);
    this.audio.playLunge();
    this.caughtThisLunge = 0;
  }

  /** Unlock audio from any user gesture (even one that doesn't fire). */
  unlockAudio() {
    this.audio.unlock();
  }

  /** Debug helper: simulate catching `count` bugs in one throw. */
  debugCatch(count: number) {
    this.audio.unlock();
    for (let i = 0; i < count; i++) {
      this.burst(FROG_X + (i - (count - 1) / 2) * 50, mouthY() - 30);
      this.audio.playCatchFor("fly");
    }
    this.frogState = "happy";
    this.stateTimer = HAPPY_MS;
    this.frogAirborneMs = 0;
    this.splash(FROG_X, WATER_Y + 50, 8, 24);
    this.lastCatchCount = count;
    this.happyVariant = Math.random();
    this.hasCaught = true;
    this.eatPopAt = this.elapsed;
    this.streak += count;
    this.bestStreak = bestStreakAfter(this.streak, this.bestStreak);
  }

  update(dt: number) {
    this.elapsed += dt;
    this.cloudOffset += dt * 8;
    if (this.sunFlareTimer > 0) this.sunFlareTimer -= dt;
    this.fatness = easeFatness(this.fatness, frogFatness(this.streak), dt);

    if (!this.maxCelebrated && this.streak >= FATNESS_CAP) {
      this.maxCelebrated = true;
      this.celebrateMoment = true;
      this.audio.playMaxFat();
      this.burst(FROG_X, mouthY() - 12, 1);
      this.sparkleBurst(FROG_X, mouthY() - 12);
      this.sunFlareTimer = 1;
      if (this.frogState !== "happy") {
        this.frogState = "happy";
        this.stateTimer = HAPPY_MS;
        this.frogAirborneMs = 0;
      }
    }

    if (this.fatness > AURA_MIN_FATNESS) {
      this.auraTimer -= dt;
      if (this.auraTimer <= 0) {
        this.auraTimer = AURA_SPAWN_INTERVAL;
        const a = Math.random() * Math.PI * 2;
        const r = rnd(FROG_R, FROG_R * 1.8);
        this.particles.push({
          x: FROG_X + Math.cos(a) * r,
          y: FROG_Y - 6 + Math.sin(a) * r * 0.5,
          vx: rnd(-8, 8),
          vy: rnd(-30, -12),
          life: rnd(0.7, 1.1),
          maxLife: 1.1,
          color: "#ffd700",
          size: rnd(3, 5),
          star: true,
        });
      }
    }

    const missed = updateTongue(this.tongue, dt, this.grabbed.length > 0);

    if (this.tongue.state === "extend") {
      for (const b of this.bugs) {
        if (tongueHitsBug(this.tongue, b.x, bugY(b))) {
          this.audio.playGrab(b.species);
          const alt = altitudeFor(bugY(b));
          if (alt >= 0.5) this.audio.playReach(alt);
          if (alt >= 0.85) {
            this.sparkleBurst(b.x, bugY(b));
            this.sunFlareTimer = 1;
          }
          this.grabbed.push(b);
        }
      }
      if (this.grabbed.length > 0) {
        const grabbedSet = new Set(this.grabbed);
        this.bugs = this.bugs.filter((b) => !grabbedSet.has(b));
      }
    }

    for (let i = 0; i < this.grabbed.length; i++) {
      const b = this.grabbed[i];
      b.x = FROG_X + (i - (this.grabbed.length - 1) / 2) * 16;
      b.grabbedY = tongueTipY(this.tongue);
    }

    if (
      this.tongue.state === "retract" &&
      this.grabbed.length > 0 &&
      tongueTipY(this.tongue) >= mouthY() - 14
    ) {
      const landed = this.grabbed;
      this.grabbed = [];
      this.caughtThisLunge += landed.length;
      if (this.frogState !== "happy") {
        this.frogState = "happy";
        this.stateTimer = HAPPY_MS;
        this.happyVariant = Math.random();
        this.frogAirborneMs = 0;
        this.splash(FROG_X, WATER_Y + 50, 8, 24);
      } else {
        this.stateTimer = HAPPY_MS;
        this.frogAirborneMs = 0;
      }
      this.lastCatchCount = this.caughtThisLunge;
      this.hasCaught = true;
      this.eatPopAt = this.elapsed;
      this.streak += landed.length;
      this.bestStreak = bestStreakAfter(this.streak, this.bestStreak);
      for (const b of landed) {
        this.burst(b.x, mouthY() - 12, 0);
        this.audio.playCatchFor(b.species);
      }
    }

    if (missed && this.caughtThisLunge === 0 && this.grabbed.length === 0) {
      this.frogState = "sad";
      this.stateTimer = SAD_MS;
      this.audio.playMiss();
      this.streak = 0;
    }

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.bugs.length < MAX_BUGS) {
      this.bugs.push(spawnBug());
      this.spawnTimer = rnd(0.9, 2.2);
    }

    for (const b of this.bugs) updateBug(b, dt);
    this.bugs = this.bugs.filter((b) => !isOffScreen(b));

    if (this.frogState !== "idle") {
      this.stateTimer -= dt * 1000;
      if (this.stateTimer <= 0) {
        this.frogState = "idle";
        this.celebrateMoment = false;
      }
    }

    const happyP = this.frogState === "happy" ? Math.min(1, 1 - this.stateTimer / HAPPY_MS) : 0;
    const frogOffset = this.frogState === "happy"
      ? happyJumpOffset(happyP, this.lastCatchCount > 1 || this.celebrateMoment)
      : 0;
    if (frogOffset < -8) {
      this.frogAirborneMs += dt * 1000;
    } else {
      if (this.frogAirborneMs > 150) this.splash(FROG_X, WATER_Y + 50);
      this.frogAirborneMs = 0;
    }

    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 60 * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  private burst(x: number, y: number, alt = 0) {
    const colors = ["#ff5b94", "#ffb347", "#7ee081", "#8fd8ff", "#fff3b0", "#c792ea"];
    const count = 44 + Math.round(36 * alt);
    const maxSp = 320 + 100 * alt;
    const maxSize = 8 + 3 * alt;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = rnd(70, maxSp);
      const life = rnd(0.5, 1);
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life,
        maxLife: life,
        color: colors[i % colors.length],
        size: rnd(5, maxSize),
      });
    }
    const ringLife = 0.4;
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      life: ringLife,
      maxLife: ringLife,
      color: "#ffffff",
      size: 70 + 50 * alt,
      ring: true,
    });
  }

  private splash(x: number, y: number, count = 14, ringSize = 34) {
    const colors = ["#e8fbff", "#bfe8f5", "#9fd8c9"];
    for (let i = 0; i < count; i++) {
      const a = rnd(-Math.PI * 0.9, -Math.PI * 0.1);
      const sp = rnd(50, 180);
      const life = rnd(0.35, 0.6);
      this.particles.push({
        x: x + rnd(-30, 30),
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life,
        maxLife: life,
        color: colors[i % colors.length],
        size: rnd(3, 5.5),
      });
    }
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.5,
      maxLife: 0.5,
      color: "#e8fbff",
      size: ringSize,
      ring: true,
    });
  }

  private sparkleBurst(x: number, y: number) {    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + rnd(-0.2, 0.2);
      const sp = rnd(30, 90);
      const life = rnd(0.6, 0.9);
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 20,
        life,
        maxLife: life,
        color: "#ffe9a8",
        size: rnd(6, 11),
        star: true,
      });
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    this.drawSky(ctx, this.frogState, this.stateTimer, this.sunFlareTimer);
    this.drawPond(ctx);
    for (const b of this.bugs) this.drawBug(ctx, b);
    for (const b of this.grabbed) {
      const dist = mouthY() - bugY(b);
      this.drawBug(ctx, b, Math.min(1, Math.max(0, dist / 70)));
    }
    this.drawTongue(ctx);
    this.drawFrog(ctx);
    this.drawParticles(ctx);
    drawHud(ctx, this.streak, this.bestStreak);
    if (!this.hasCaught && this.elapsed < 6000) this.drawHint(ctx);
  }

  private drawSky(ctx: CanvasRenderingContext2D, frogState: FrogState, stateTimer: number, sunFlare = 0) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#8ed7f5");
    sky.addColorStop(1, "#e8fbff");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    const happy = frogState === "happy";
    const happyP = happy ? Math.min(1, 1 - stateTimer / HAPPY_MS) : 1;

    const sunX = W - 90;
    const sunY = 90;
    const sunR = 46;
    const glowBoost = (happy ? 1.35 - 0.25 * happyP : 1) * (1 + 0.2 * Math.min(1, sunFlare));
    const glowR = sunR * 1.7 * (1 + 0.12 * Math.sin(this.elapsed * 1.4)) * glowBoost;
    const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.6, sunX, sunY, glowR);
    glow.addColorStop(0, "rgba(255, 233, 168, 0.9)");
    glow.addColorStop(1, "rgba(255, 233, 168, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, glowR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 221, 120, 0.85)";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    const rayRot = this.elapsed * (happy ? 0.5 : 0.3);
    const rayLen = (happy ? 1.55 - 0.35 * happyP : 1) * 24;
    for (let i = 0; i < 8; i++) {
      const a = rayRot + (i / 8) * Math.PI * 2;
      const inner = sunR + 10;
      const outer = sunR + 10 + rayLen;
      ctx.beginPath();
      ctx.moveTo(sunX + Math.cos(a) * inner, sunY + Math.sin(a) * inner);
      ctx.lineTo(sunX + Math.cos(a) * outer, sunY + Math.sin(a) * outer);
      ctx.stroke();
    }

    ctx.fillStyle = "#ffe9a8";
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fill();

    const face = "#7a4a1f";
    const eyeDX = sunR * 0.32;
    const eyeY = sunY - sunR * 0.05;
    const blinkCycle = this.elapsed % 3.5;
    const blinking = blinkCycle < 0.12;
    const winking = happy && happyP < 0.25;

    const eyeLine = (cx: number) => {
      ctx.strokeStyle = face;
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx - 5, eyeY + 2);
      ctx.quadraticCurveTo(cx, eyeY + 6, cx + 5, eyeY + 2);
      ctx.stroke();
    };

    [-1, 1].forEach((side, idx) => {
      const cx = sunX + side * eyeDX;
      if (blinking || (winking && idx === 0)) {
        eyeLine(cx);
      } else {
        ctx.fillStyle = face;
        ctx.beginPath();
        ctx.arc(cx, eyeY, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.strokeStyle = face;
    ctx.lineWidth = happy ? 3.5 : 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(sunX, sunY + 6, happy ? 22 : 15, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 3; i++) {
      const cx = ((this.cloudOffset + i * 260) % (W + 200)) - 100;
      const cy = 60 + i * 40;
      ctx.beginPath();
      ctx.arc(cx, cy, 30, 0, Math.PI * 2);
      ctx.arc(cx + 30, cy - 12, 24, 0, Math.PI * 2);
      ctx.arc(cx + 55, cy, 26, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawPond(ctx: CanvasRenderingContext2D) {
    const water = ctx.createLinearGradient(0, WATER_Y, 0, H);
    water.addColorStop(0, "#9fd8c9");
    water.addColorStop(1, "#4e9f8e");
    ctx.fillStyle = water;
    ctx.fillRect(0, WATER_Y, W, H - WATER_Y);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    for (let x = 0; x <= W; x += 8) {
      const y = WATER_Y + Math.sin(x * 0.02 + this.elapsed * 1.6) * 3 + Math.sin(x * 0.05 - this.elapsed * 0.9) * 1.5;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
    for (let i = 0; i < 6; i++) {
      const x = 60 + i * 130 + ((i * 37) % 40);
      const y = WATER_Y + 24 + ((i * 53) % 46);
      ctx.fillRect(x, y, 26, 2);
    }

    const padX = [70, 240, 560, 730];
    padX.forEach((x, i) => {
      const bob = Math.sin(this.elapsed * 1.4 + i * 1.9) * 2;
      this.drawLilyPad(ctx, x, WATER_Y + 14 + bob, 40, 13);
    });

    this.drawLilyPad(ctx, FROG_X, WATER_Y + 66, 62, 18, true);
    this.drawCattail(ctx, 26);
    this.drawCattail(ctx, W - 34, true);
  }

  private drawLilyPad(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    rx: number,
    ry: number,
    wide = false,
  ) {
    ctx.fillStyle = wide ? "#4e9c4e" : "#5fb25f";
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = wide ? "#3c7f3c" : "#4a914a";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, rx, Math.PI * 0.85, Math.PI * 1.15);
    ctx.lineTo(x, y);
    ctx.fill();
    ctx.strokeStyle = "rgba(46, 122, 46, 0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  private drawCattail(ctx: CanvasRenderingContext2D, x: number, flip = false) {
    ctx.strokeStyle = "#4a914a";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, H);
    ctx.quadraticCurveTo(x + (flip ? -14 : 14), WATER_Y + 60, x + (flip ? -8 : 8), WATER_Y - 20);
    ctx.stroke();
    ctx.fillStyle = "#8a5a2b";
    ctx.beginPath();
    ctx.ellipse(x + (flip ? -8 : 8), WATER_Y - 44, 7, 20, flip ? -0.15 : 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawBug(ctx: CanvasRenderingContext2D, b: Bug, alpha = 1) {
    ctx.save();
    if (alpha < 1) ctx.globalAlpha = alpha;
    ctx.translate(b.x, bugY(b));
    const t = bugRenderTransform(b);
    if (t.flip) ctx.scale(-1, 1);
    if (t.angle) ctx.rotate(t.angle);
    ctx.font = `${BUG_SPECIES[b.species].fontSize}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(BUG_SPECIES[b.species].emoji, 0, 0);
    ctx.restore();
  }

  private drawTongue(ctx: CanvasRenderingContext2D) {
    drawTongue(ctx, this.tongue, this.elapsed);
  }

  private drawFrog(ctx: CanvasRenderingContext2D) {
    drawFrog(ctx, {
      frogState: this.frogState,
      stateTimer: this.stateTimer,
      elapsed: this.elapsed,
      catchCount: this.lastCatchCount,
      variant: this.happyVariant,
      fatness: this.fatness,
      eatPopAt: this.eatPopAt,
      celebrate: this.celebrateMoment,
    });
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const t = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = t;
      if (p.star) {
        const r = Math.max(0.5, p.size * t);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - r);
        ctx.lineTo(p.x + r * 0.25, p.y - r * 0.25);
        ctx.lineTo(p.x + r, p.y);
        ctx.lineTo(p.x + r * 0.25, p.y + r * 0.25);
        ctx.lineTo(p.x, p.y + r);
        ctx.lineTo(p.x - r * 0.25, p.y + r * 0.25);
        ctx.lineTo(p.x - r, p.y);
        ctx.lineTo(p.x - r * 0.25, p.y - r * 0.25);
        ctx.closePath();
        ctx.stroke();
      } else if (p.ring) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3 * t + 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - t), 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.size * t), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawHint(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha = Math.min(1, this.elapsed / 800);
    ctx.font = "22px system-ui";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(20, 80, 120, 0.75)";
    ctx.fillText("press space — or tap — to catch a bug", W / 2, H - 20);
    ctx.globalAlpha = 1;
  }
}
