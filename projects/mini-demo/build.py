"""mini-demo 唯一时间源：生成 assets/data/demo.js（节拍、版式、配色、镜头）、assets/sfx/demo.wav，回写 index.html 时长。"""
import math
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).parent
sys.path.insert(0, str(ROOT / "assets/shared/py"))
from common import Track, load_text, mallet, read_need, set_duration, thump, write_js  # noqa: E402

T = load_text(ROOT / "assets/text/zh-CN.js")
rng = np.random.default_rng(7)
IN, OUT = 0.5, 0.3

COL = {"bg": "#12161C", "ink": "#EEF1F5", "dim": "#9AA6B8", "subject": "#F2B84B"}  # subject：主体自身的颜色，不是强调色


def lum(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    c = [v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4 for v in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def contrast(a, b):
    la, lb = sorted([lum(a), lum(b)], reverse=True)
    return (la + 0.05) / (lb + 0.05)


for k, need in (("ink", 4.5), ("dim", 4.5), ("subject", 3.0)):
    assert contrast(COL[k], COL["bg"]) >= need, (k, contrast(COL[k], COL["bg"]))

# 镜头与物体：物体中心放在屏幕 (620, 520)
cam = {"fov": 35, "dist": 6.0}
f = 540 / math.tan(math.radians(cam["fov"] / 2))
cx, cy = 620, 520
obj = {"pos": [(cx - 960) * cam["dist"] / f, (540 - cy) * cam["dist"] / f, 0], "radius": 1.08, "scale": 0.8,
       "jitter": 0.08, "seed": 7, "omega": 24.0, "popPeak": 1.08, "popDur": 0.5}

# 版式（px）：标题左上，公式与读数右栏，字幕底部居中
lay = {"title": {"x": 200, "y": 120, "size": 72}, "formula": {"x": 1100, "y": 300, "size": 64},
       "note": {"x": 1100, "y": 420, "size": 36}, "read": {"x": 1100, "y": 540, "size": 48, "lines": 3},
       "cap": {"y": 860, "size": 44}}

# WebGPU 波纹网格：compute 算每格强度，render 实例化画方块；波纹从物体中心扩散
grid = {"cols": 30, "rows": 12, "pitch": 54, "cell": 40, "minScale": 0.3, "x0": 150, "y0": 150,
        "origin": [cx, cy], "speed": 360.0, "wave": 300.0}
assert grid["x0"] + grid["cols"] * grid["pitch"] <= 1824 and grid["y0"] + grid["rows"] * grid["pitch"] <= lay["cap"]["y"]
assert grid["cell"] * grid["minScale"] >= 12
assert grid["speed"] / 60 <= 15

# 节拍（秒）
b = {"title": 0.3, "formula": 1.3, "read": 1.8, "pop": 3.6, "cap": 4.0}
b["capOut"] = b["cap"] + IN + read_need(T["demo.cap"])
b["fadeAll"] = b["capOut"] + OUT           # 第一段全部退场
b["gpu"] = b["fadeAll"] + OUT              # WebGPU 网格入场，波纹从此刻起算
b["cap2"] = b["gpu"] + 0.3
b["cap2Out"] = b["cap2"] + IN + read_need(T["demo.cap2"])
duration = math.ceil((b["cap2Out"] + OUT + 0.4) * 10) / 10
assert 14 <= duration <= 17, duration
assert b["fadeAll"] - b["formula"] - IN >= read_need(T["demo.note"])

data = {"duration": duration, "beats": {k: round(v, 4) for k, v in b.items()}, "in": IN, "out": OUT,
        "col": COL, "cam": cam, "obj": obj, "lay": lay, "grid": grid}
write_js(ROOT / "assets/data/demo.js", "DEMO", data)
set_duration(ROOT / "index.html", duration)

# 音效：每个元素出场一声，弹跳一声低音
tr = Track(duration)
tr.place(b["title"], mallet(523.25, 0.4, 0.25, rng))
tr.place(b["formula"], mallet(659.25, 0.35, 0.25, rng))
tr.place(b["read"], mallet(783.99, 0.3, 0.2, rng))
tr.place(b["pop"], thump(0.35, 80))
tr.place(b["pop"], mallet(392.0, 0.35, 0.3, rng))
tr.place(b["cap"], mallet(523.25, 0.25, 0.4, rng))
tr.place(b["gpu"], thump(0.3, 70))
tr.place(b["gpu"], mallet(261.63, 0.35, 0.5, rng))
tr.place(b["cap2"], mallet(523.25, 0.25, 0.4, rng))
tr.write(ROOT / "assets/sfx/demo.wav")
print("duration", duration, {k: round(v, 2) for k, v in b.items()})
