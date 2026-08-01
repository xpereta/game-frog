import { Sound } from "./audio";
import { FLY_R, FROG_X, FROG_Y, H, W, WATER_Y } from "./consts";
import { Fly, flyY, isOffScreen, spawnFly, updateFly } from "./fly";
import {
  createTongue,
  fireTongue,
  mouthY,
  tongueHitsFly,
  tongueTipY,
  updateTongue,
} from "./tongue";

type FrogState = "idle" | "happy" | "sad";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const HAPPY_MS = 2000;
const SAD_MS = 1100;
const MAX_FLIES = 6;

const rnd = (min: number, max: number) => min + Math.random() * (max - min);

export class Game {
  private tongue = createTongue();
  private flies: Fly[] = [];
  private particles: Particle[] = [];
  private frogState: FrogState = "idle";
  private stateTimer = 0;
  private spawnTimer = rnd(0.6, 1.4);
  private elapsed = 0;
  private hasCaught = false;
  private cloudOffset = 0;
  private caughtThisLunge = false;
  private audio = new Sound();

  fire() {
    this.audio.unlock();
    if (this.tongue.state !== "idle") return;
    fireTongue(this.tongue);
    this.caughtThisLunge = false;
  }

  update(dt: number) {
    this.elapsed += dt;
    this.cloudOffset += dt * 8;

    const missed = updateTongue(this.tongue, dt);
    if (missed && !this.caughtThisLunge) {
      this.frogState = "sad";
      this.stateTimer = SAD_MS;
      this.audio.playMiss();
    }

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.flies.length < MAX_FLIES) {
      this.flies.push(spawnFly());
      this.spawnTimer = rnd(0.9, 2.2);
    }

    for (const f of this.flies) updateFly(f, dt);
    this.flies = this.flies.filter((f) => !isOffScreen(f));

    if (this.tongue.state === "extend") {
      const eaten = this.flies.filter((f) => tongueHitsFly(this.tongue, f.x, flyY(f)));
      for (const f of eaten) {
        this.burst(f.x, flyY(f));
        this.audio.playCatch();
        this.frogState = "happy";
        this.stateTimer = HAPPY_MS;
        this.hasCaught = true;
        this.caughtThisLunge = true;
      }
      if (eaten.length > 0) {
        const eatenSet = new Set(eaten);
        this.flies = this.flies.filter((f) => !eatenSet.has(f));
      }
    }

    if (this.frogState !== "idle") {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) this.frogState = "idle";
    }

    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 60 * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  private burst(x: number, y: number) {
    const colors = ["#ff5b94", "#ffb347", "#7ee081", "#8fd8ff"];
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = rnd(40, 160);
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: rnd(0.4, 0.8),
        color: colors[i % colors.length],
      });
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    this.drawSky(ctx);
    this.drawPond(ctx);
    for (const f of this.flies) this.drawFly(ctx, f);
    this.drawTongue(ctx);
    this.drawFrog(ctx);
    this.drawParticles(ctx);
    if (!this.hasCaught && this.elapsed < 6000) this.drawHint(ctx);
  }

  private drawSky(ctx: CanvasRenderingContext2D) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#8ed7f5");
    sky.addColorStop(1, "#e8fbff");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#ffe9a8";
    ctx.beginPath();
    ctx.arc(W - 90, 90, 46, 0, Math.PI * 2);
    ctx.fill();

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

    const padX = [110, 640, 700, 180];
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

  private drawFly(ctx: CanvasRenderingContext2D, f: Fly) {
    ctx.font = `${FLY_R * 2.4}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🪰", f.x, flyY(f));
  }

  private drawTongue(ctx: CanvasRenderingContext2D) {
    if (this.tongue.state === "idle") return;
    const from = mouthY();
    const to = tongueTipY(this.tongue);
    ctx.strokeStyle = "#ff8fb0";
    ctx.lineCap = "round";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(FROG_X, from);
    ctx.lineTo(FROG_X, to);
    ctx.stroke();
    ctx.strokeStyle = "#ff5b94";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(FROG_X, from);
    ctx.lineTo(FROG_X, to);
    ctx.stroke();
  }

  private drawFrog(ctx: CanvasRenderingContext2D) {
    const bob = Math.sin(this.elapsed * 2.4) * 3;
    const y = FROG_Y + bob;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (this.frogState === "sad") {
      ctx.translate(FROG_X, y);
      ctx.rotate(0.08);
      ctx.font = "88px serif";
      ctx.fillText("🐸", 0, 0);
      ctx.font = "26px serif";
      ctx.fillText("💧", 34, -18);
      ctx.restore();
      return;
    }

    ctx.font = "88px serif";
    ctx.fillText("🐸", FROG_X, y);

    if (this.frogState === "happy") {
      const t = this.stateTimer / HAPPY_MS;
      ctx.font = "24px serif";
      const spread = 46 + (1 - t) * 40;
      ctx.fillText("✨", FROG_X - spread, y - 52);
      ctx.fillText("✨", FROG_X + spread, y - 30);
      ctx.fillText("💖", FROG_X - 30, y - 58);
      ctx.fillText("😄", FROG_X + 22, y - 60);
    }
    ctx.restore();
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / 0.8);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private drawHint(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha = Math.min(1, this.elapsed / 800);
    ctx.font = "22px system-ui";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(20, 80, 120, 0.75)";
    ctx.fillText("press space — or tap — to catch a fly", W / 2, H - 20);
    ctx.globalAlpha = 1;
  }
}
