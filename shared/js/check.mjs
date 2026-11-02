// 校验脚本骨架（node）：读数据文件、导入纯逻辑模块、按区间汇总冲突、结果写成 UTF-8 文件。
// 用法：import { loadData, importPure, report } from "./assets/shared/js/check.mjs";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

// assets/data/*.js 的形式是 `window.NAME = {...};`
export function loadData(path) {
  const src = readFileSync(path, "utf8");
  return JSON.parse(src.slice(src.indexOf("=") + 1, src.lastIndexOf(";")));
}

// 纯逻辑模块（无 DOM、无 import）以 ES 模块写成 .js；项目没有 "type": "module"，经 data URL 导入
export const importPure = (path) => import("data:text/javascript;base64," + Buffer.from(readFileSync(path, "utf8")).toString("base64"));

// 冲突记录：flag(何物, t)；write 把连续帧合并成「何物 @ 起–止」，中文结果写文件（PowerShell 5.1 终端会乱码）
export function report(gap = 0.05) {
  const issues = {}, notes = [];
  return {
    flag: (k, t) => (issues[k] = issues[k] || []).push(t),
    note: (s) => notes.push(s),
    count: () => Object.keys(issues).length,
    write(path) {
      const out = [];
      for (const [k, ts] of Object.entries(issues)) {
        const ranges = []; let a = ts[0], p = ts[0];
        for (const t of ts.slice(1).concat([Infinity])) { if (t - p > gap) { ranges.push(`${a.toFixed(2)}–${p.toFixed(2)}`); a = t; } p = t; }
        out.push(`✗ ${k} @ ${ranges.join(", ")}`);
      }
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, out.concat(notes).join("\n") + "\n", "utf8");
      return out.length;
    },
  };
}
