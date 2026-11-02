"""首尾无缝的循环音乐：越过循环终点的余音（含混响尾）折回开头叠加。"""
import numpy as np
from scipy.signal import fftconvolve


def reverb(buf, rng, sr, decay=0.75, dur=3.2, dry=0.75, wet=0.45):
    """buf: (声道, 采样)；衰减噪声脉冲卷积，左右独立"""
    n = int(dur * sr)
    t = np.arange(n) / sr
    out = np.zeros_like(buf)
    for ch in range(buf.shape[0]):
        ir = np.convolve(rng.standard_normal(n) * np.exp(-t / decay), np.ones(24) / 24, mode="same")
        out[ch] = fftconvolve(buf[ch], ir / np.sqrt((ir ** 2).sum()))[:buf.shape[1]]
    return dry * buf + wet * out


def fold(mix, length):
    """把 length 之后的部分逐段叠回开头，返回长度为 length 的无缝循环段"""
    loop = mix[:, :length].copy()
    k = 1
    while k * length < mix.shape[1]:
        seg = mix[:, k * length:(k + 1) * length]
        loop[:, :seg.shape[1]] += seg
        k += 1
    return loop
