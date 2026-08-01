import { H, W } from "./consts";
import { Game } from "./game";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const game = new Game();

const dpr = window.devicePixelRatio || 1;

function fit() {
  const scale = Math.min(window.innerWidth / W, window.innerHeight / H);
  canvas.style.width = `${W * scale}px`;
  canvas.style.height = `${H * scale}px`;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", fit);
fit();

const fire = () => game.fire();

const unlockOnce = () => {
  game.unlockAudio();
  window.removeEventListener("pointerdown", unlockOnce);
  window.removeEventListener("keydown", unlockOnce);
};
window.addEventListener("pointerdown", unlockOnce);
window.addEventListener("keydown", unlockOnce);

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    fire();
  } else if (e.key === "z" || e.key === "Z") {
    game.debugCatch(1);
  } else if (e.key === "x" || e.key === "X") {
    game.debugCatch(2);
  }
});

canvas.addEventListener("pointerdown", fire);

let last = performance.now();
function frame(now: number) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  game.update(dt);
  game.render(ctx);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
