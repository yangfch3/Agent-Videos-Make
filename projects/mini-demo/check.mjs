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
const capBox = (s) => { const w = cjk(s) * L.cap.size; return { x0: 960 - w / 2, y0: L.cap.y, x1: 960 + w / 2, y1: L.cap.y + L.cap.size * 1.4 }; };
const end1 = B.fadeAll + D.out;
const boxes = {
  标题: { b: box(L.title, cjk(T["demo.title"]) * L.title.size), t0: B.title, t1: end1 },
  公式: { b: box(L.formula, 5 * L.formula.size), t0: B.formula, t1: end1 },
  公式说明: { b: box(L.note, cjk(T["demo.note"]) * L.note.size), t0: B.formula, t1: end1 },
  读数: { b: box(L.read, 11 * 0.6 * L.read.size, L.read.lines), t0: B.read, t1: end1 },
  字幕: { b: capBox(T["demo.cap"]), t0: B.cap, t1: B.capOut + D.out },
  字幕2: { b: capBox(T["demo.cap2"]), t0: B.cap2, t1: B.cap2Out + D.out },
};
for (const [k, { b }] of Object.entries(boxes)) if (b.x0 < 192 || b.x1 > 1728 || b.y0 < 108 || b.y1 > 972) R.flag(`${k} 出标题安全框`, 0);

// WebGPU 网格：在动作安全框内，不压字幕 2；波前每帧位移 ≤ 15px；两段画面不同屏
const G = D.grid, gb = { x0: G.x0, y0: G.y0, x1: G.x0 + G.cols * G.pitch, y1: G.y0 + G.rows * G.pitch };
if (gb.x0 < 96 || gb.x1 > 1824 || gb.y0 < 54 || gb.y1 > 1026) R.flag("网格出动作安全框", B.gpu);
if (gb.y1 > boxes.字幕2.b.y0) R.flag("网格压到字幕 2", B.cap2);
if (G.speed / 60 > 15) R.flag("波前每帧位移 > 15px", B.gpu);
if (B.gpu < end1 - 1e-3) R.flag("网格与第一段画面同屏", B.gpu);
for (const k of ["fadeAll", "gpu", "cap2", "cap2Out"]) if (!Number.isFinite(B[k])) R.flag(`节拍 ${k} 缺失`, 0);

const hit = (c, b) => {
  const dx = Math.max(b.x0 - c.x, 0, c.x - b.x1), dy = Math.max(b.y0 - c.y, 0, c.y - b.y1);
  return dx * dx + dy * dy < c.r * c.r;
};
let vmax = 0;
for (let f = 0; f <= D.duration * 30; f++) {
  const t = f / 30, c = screenCircle(D, t);
  if (t >= end1) break;
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
