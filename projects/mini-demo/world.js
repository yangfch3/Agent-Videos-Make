// 纯逻辑（无 DOM、无 import）：旋转角、弹跳缩放、物体屏幕投影圆。浏览器与 check.mjs 共用
export const clamp01 = (x) => Math.max(0, Math.min(1, x));
const out2 = (k) => 1 - (1 - k) ** 3;

export const angleAt = (D, t) => D.obj.omega * t;

// 0 → 峰值 → 0：前半 power2.out 升，后半回落
export function popAt(D, t) {
  const k = clamp01((t - D.beats.pop) / D.obj.popDur);
  const u = k < 0.5 ? out2(k * 2) : 1 - out2((k - 0.5) * 2);
  return 1 + (D.obj.popPeak - 1) * u;
}

// 物体包围球在屏幕上的投影圆（px，左上原点）
export function screenCircle(D, t) {
  const c = D.cam, o = D.obj, H = 1080, W = 1920;
  const f = H / 2 / Math.tan((c.fov * Math.PI) / 360);
  const d = c.dist, R = o.radius * o.scale * popAt(D, t);
  return { x: W / 2 + (o.pos[0] / d) * f, y: H / 2 - (o.pos[1] / d) * f, r: (R / Math.sqrt(d * d - R * R)) * f };
}
