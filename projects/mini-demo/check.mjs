// 逐帧（30Hz）校验：数据完整有限；物体投影圆在动作安全框内、不压文字；文字框在标题安全框内；转动每帧位移 ≤ 15px
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadData, importPure, report } from "./assets/shared/js/check.mjs";
const here = dirname(fileURLToPath(import.meta.url));
const D = loadData(join(here, "assets/data/demo.js"));
const T = loadData(join(here, "assets/text/zh-CN.js"));
const { angleAt, screenCircle } = await importPure(join(here, "world.js"));
const R = report(), B = D.beats, L = D.lay;

for (const k of ["title", "formula", "read", "pop", "cap", "capOut"]) if (!Number.isFinite(B[k])) R.flag(`节拍 ${k} 缺失`, 0);

// 文字框（按字号估宽：汉字 = 字号，等宽字符 = 0.6 字号；公式按 5 个字号）
const cjk = (s) => [...s].length;
const box = (o, w, lines = 1) => ({ x0: o.x, y0: o.y, x1: o.x + w, y1: o.y + o.size * 1.4 * lines });
const capW = cjk(T["demo.cap"]) * L.cap.size;
const boxes = {
  标题: { b: box(L.title, cjk(T["demo.title"]) * L.title.size), t0: B.title, t1: D.duration },
  公式: { b: box(L.formula, 5 * L.formula.size), t0: B.formula, t1: D.duration },
  公式说明: { b: box(L.note, cjk(T["demo.note"]) * L.note.size), t0: B.formula, t1: D.duration },
  读数: { b: box(L.read, 11 * 0.6 * L.read.size, L.read.lines), t0: B.read, t1: D.duration },
  字幕: { b: { x0: 960 - capW / 2, y0: L.cap.y, x1: 960 + capW / 2, y1: L.cap.y + L.cap.size * 1.4 }, t0: B.cap, t1: B.capOut + D.out },
};
for (const [k, { b }] of Object.entries(boxes)) if (b.x0 < 192 || b.x1 > 1728 || b.y0 < 108 || b.y1 > 972) R.flag(`${k} 出标题安全框`, 0);

const hit = (c, b) => {
  const dx = Math.max(b.x0 - c.x, 0, c.x - b.x1), dy = Math.max(b.y0 - c.y, 0, c.y - b.y1);
  return dx * dx + dy * dy < c.r * c.r;
};
let vmax = 0;
for (let f = 0; f <= D.duration * 30; f++) {
  const t = f / 30, c = screenCircle(D, t);
  if (![c.x, c.y, c.r, angleAt(D, t)].every(Number.isFinite)) { R.flag("物体数据非有限值", t); continue; }
  if (c.x - c.r < 96 || c.x + c.r > 1824 || c.y - c.r < 54 || c.y + c.r > 1026) R.flag("物体出动作安全框", t);
  for (const [k, { b, t0, t1 }] of Object.entries(boxes)) if (t >= t0 && t < t1 && hit(c, b)) R.flag(`物体压到${k}`, t);
  const v = (c.r * D.obj.omega * Math.PI) / 180 / 60;
  vmax = Math.max(vmax, v);
  if (v > 15) R.flag("物体边缘每帧位移 > 15px", t);
}
R.note(`物体边缘最快 ${vmax.toFixed(2)} px/帧（60fps）`);
const n = R.write(join(here, "../../Temp/mini-demo/check.txt"));
console.log(n ? `FAIL ${n}` : "OK");
process.exit(n ? 1 : 0);
