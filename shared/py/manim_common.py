"""Manim 共用：px 坐标换算、GSAP 缓动对应、按绝对时刻对齐、中文文字。配色与底色由各片设置（config.background_color）。"""
from pathlib import Path

import manimpango
from manim import (DOWN, LEFT, ORIGIN, RIGHT, UP, Scene, Text, config, rate_functions)

ROOT = Path(__file__).resolve().parents[2]
manimpango.register_font(str(ROOT / "shared/fonts/NotoSansSC-VF.ttf"))
manimpango.register_font(str(ROOT / "shared/fonts/JetBrainsMono-VF.ttf"))

U = 8 / 1080                      # 1px 对应的 Manim 单位
SW = 1 / (0.01 / U)               # 1px 对应的 stroke_width（Cairo 线宽 = 0.01 单位 × stroke_width）

# GSAP 缓动对应
EASE = {  # GSAP powerN = N+1 次多项式
    "power3.out": rate_functions.ease_out_quart,
    "power2.in": rate_functions.ease_in_cubic,
    "power2.out": rate_functions.ease_out_cubic,
    "power2.inOut": rate_functions.ease_in_out_cubic,
    "power1.in": rate_functions.ease_in_quad,
    "none": rate_functions.linear,
}


def P(x, y):
    """1920×1080 像素坐标（左上原点）→ Manim 坐标"""
    return [(x - 960) * U, (540 - y) * U, 0]


def px(v):
    return v * U


_K = {}


def txt(s, size, color, weight="NORMAL"):
    """size 为 CSS 字号 px：按「一个汉字宽 = 字号」标定 font_size"""
    key = weight
    if key not in _K:
        ref = Text("国" * 10, font="Noto Sans SC", font_size=100, weight=weight)
        _K[key] = 100 * 10 * size / (ref.width / U) / size
    return Text(s, font="Noto Sans SC", font_size=size * _K[key], color=color, weight=weight)


class TimedScene(Scene):
    def at(self, t):
        """等到镜内绝对时刻 t（秒）"""
        dt = t - self.renderer.time
        if dt > 1e-6:
            self.wait(dt)


# ---- GSAP 缓动的等价实现，供「时钟 + updater」写法用 ----
import math  # noqa: E402


def back_out(s):
    return lambda t: 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2


def elastic_out(a, p):
    s = p / (2 * math.pi) * math.asin(1 / a)
    return lambda t: 1.0 if t >= 1 else a * 2 ** (-10 * t) * math.sin((t - s) * 2 * math.pi / p) + 1


G = {
    "none": lambda t: t,
    "power1.in": lambda t: t * t,
    "power2.in": lambda t: t ** 3,
    "power2.out": lambda t: 1 - (1 - t) ** 3,
    "power3.out": lambda t: 1 - (1 - t) ** 4,
    "power2.inOut": lambda t: 4 * t ** 3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2,
    "sine.inOut": lambda t: -(math.cos(math.pi * t) - 1) / 2,
}


def track(t, segs, v0=None):
    """segs: [(t0, dur, a, b, ease)] 按 t0 升序；返回 t 时刻的值（GSAP fromTo 语义，首段之前取首段 a）"""
    if not segs or t < segs[0][0]:
        return v0 if v0 is not None else segs[0][2]
    for t0, dur, a, b, e in reversed(segs):
        if t >= t0:
            k = 1.0 if dur <= 0 else min(max((t - t0) / dur, 0.0), 1.0)
            return a + (b - a) * e(k)


def cjk_static(wght):
    """XeTeX 不支持可变字体：从 Noto Sans SC VF 切出静态字重实例，生成到 Temp/fonts/（不入库），返回目录与文件名"""
    out = ROOT / "Temp/fonts"
    name = f"NotoSansSC-w{wght}.ttf"
    if not (out / name).exists():
        from fontTools.ttLib import TTFont
        from fontTools.varLib.instancer import instantiateVariableFont
        out.mkdir(parents=True, exist_ok=True)
        instantiateVariableFont(TTFont(ROOT / "shared/fonts/NotoSansSC-VF.ttf"), {"wght": wght}).save(out / name)
    return out.as_posix() + "/", name
