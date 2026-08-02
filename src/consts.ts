export const W = 800;
export const H = 600;
export const TONGUE_SPEED = 600;
export const TONGUE_REACH = 430;
export const TONGUE_TIP_R = 14;
export const FROG_X = W / 2;
export const FROG_Y = H - 70;
export const FROG_R = 44;
export const WATER_Y = 500;

// Fat frog (visual only): width/height scale up with streak.
export const FATNESS_CAP = 15; // streak at which the frog is fully fat
export const FATNESS_WIDTH_MAX = 2.2; // max horizontal scale
export const FATNESS_HEIGHT_MAX = 1.3; // max vertical scale
export const FATNESS_EASE = 4; // how fast the frog inflates/deflates toward its streak fatness (1/s)
export const EAT_POP_DURATION = 0.35; // seconds of squash-stretch per swallow
export const EAT_POP_WIDTH = 0.22; // extra width during the eat-pop peak
export const EAT_POP_HEIGHT = 0.12; // height lost during the eat-pop peak

// Frog emoji sprite (perf): the 🐸 glyph is rasterized once into an offscreen
// canvas at this resolution, then composited with drawImage each frame. Per-
// frame fillText of color emoji under non-uniform/rotating transforms makes
// Chrome re-rasterize the glyph every frame (100% CPU + cache growth).
export const FROG_SPRITE = 1024; // sprite canvas box, px
export const FROG_SPRITE_FONT = 704; // glyph font size within the sprite (8× the 88px base)
