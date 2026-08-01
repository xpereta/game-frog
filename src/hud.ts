const MAX_DOTS = 10;
const PAD_X = 12;
const PAD_Y = 12;
const PAD = 14;
const ROW_H = 22;
const ROW_GAP = 2;
const DOT_R = 4;
const DOT_GAP = 10;

export function rankForStreak(streak: number): string {
  if (streak >= 10) return "🐉";
  if (streak >= 6) return "🐸";
  if (streak >= 3) return "🐤";
  return "🐣";
}

export function bestStreakAfter(streak: number, bestStreak: number): number {
  return Math.max(streak, bestStreak);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawHud(
  ctx: CanvasRenderingContext2D,
  streak: number,
  bestStreak: number,
) {
  const width = 168;
  const height = ROW_H * 2 + ROW_GAP + PAD * 2;

  ctx.save();
  ctx.font = "20px system-ui";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "rgba(15, 45, 60, 0.4)";
  roundRect(ctx, PAD_X, PAD_Y, width, height, 16);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.fillText(rankForStreak(streak), PAD_X + PAD, PAD_Y + PAD);

  const dots = Math.min(streak, MAX_DOTS);
  const dotY = PAD_Y + PAD + ROW_H / 2;
  for (let i = 0; i < dots; i++) {
    ctx.beginPath();
    ctx.arc(PAD_X + PAD + 34 + i * DOT_GAP, dotY, DOT_R, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillText(
    `🏆 ${rankForStreak(bestStreak)}`,
    PAD_X + PAD,
    PAD_Y + PAD + ROW_H + ROW_GAP,
  );
  ctx.restore();
}
