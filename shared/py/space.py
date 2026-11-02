"""剧情与 3D 示意共用的空间工具：占地判定、折线距离、路径插值（与 JS 同公式）、跑道形环线。坐标为 x、z，y 向上。"""
import math

import numpy as np

clamp = lambda x, a=0.0, b=1.0: min(max(x, a), b)  # noqa: E731
EASE = {"sine": lambda k: -(math.cos(math.pi * k) - 1) / 2, "in2": lambda k: k ** 3, "lin": lambda k: k,
        "io2": lambda k: 4 * k ** 3 if k < 0.5 else 1 - (-2 * k + 2) ** 3 / 2}


def inside(f, x, z, margin):
    if f[0] == "circle":
        return math.hypot(x - f[1], z - f[2]) < f[3] + margin
    dx, dz, c, s = x - f[1], z - f[2], math.cos(f[5]), math.sin(f[5])
    lx, lz = dx * c - dz * s, dx * s + dz * c
    return abs(lx) < f[3] + margin and abs(lz) < f[4] + margin


def seg_dist(p, pts):
    best = 1e9
    for a, b in zip(pts, pts[1:]):
        a, b, q = np.array(a, float), np.array(b, float), np.array(p, float)
        k = np.clip(np.dot(q - a, b - a) / np.dot(b - a, b - a), 0, 1)
        best = min(best, float(np.linalg.norm(q - (a + k * (b - a)))))
    return best


def stadium(m, s):
    """跑道形环线：按路程 s 返回 (x, z, 朝向)；朝向与 JS atan2(dx, dz) 一致"""
    L, r = m["x1"] - m["x0"], m["r"]
    P = 2 * L + 2 * math.pi * r
    s %= P
    if s < L:
        return m["x0"] + s, m["z0"], math.pi / 2
    if s < L + math.pi * r:
        th = (s - L) / r
        return m["x1"] + r * math.sin(th), m["z0"] + r - r * math.cos(th), math.atan2(math.cos(th), math.sin(th))
    if s < 2 * L + math.pi * r:
        return m["x1"] - (s - L - math.pi * r), m["z0"] + 2 * r, -math.pi / 2
    th = (s - 2 * L - math.pi * r) / r
    return m["x0"] - r * math.sin(th), m["z0"] + r + r * math.cos(th), math.atan2(-math.cos(th), -math.sin(th))


def ss(k):
    return k * k * (3 - 2 * k)


def path_at(p, t):
    dist, head = 0.0, None
    for (t0, x0, z0), (t1, x1, z1) in zip(p, p[1:]):
        ln = math.hypot(x1 - x0, z1 - z0)
        if ln > 1e-6 and t >= t0 - 1e-9:
            head = math.atan2(x1 - x0, z1 - z0)
        if t < t1:
            k = 0 if t <= t0 else ss((t - t0) / (t1 - t0))
            return x0 + (x1 - x0) * k, z0 + (z1 - z0) * k, head or 0.0, dist + ln * k
        dist += ln
    return p[-1][1], p[-1][2], head or 0.0, dist
