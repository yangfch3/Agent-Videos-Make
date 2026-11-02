"""交付：把 HyperFrames 渲出的 renders/raw.mp4 换上项目唯一的混音 WAV（AAC 320k），写成 renders/<项目名>.mp4，再按输出规格实测。
用法（框架根目录）：uv run python shared/py/deliver.py projects/<项目>"""
import json
import re
import subprocess
import sys
from pathlib import Path

proj = Path(sys.argv[1]).resolve()
raw, out = proj / "renders/raw.mp4", proj / f"renders/{proj.name}.mp4"
srcs = re.findall(r'<audio\b[^>]*\bsrc="([^"]+)"', (proj / "index.html").read_text(encoding="utf-8"))
assert len(srcs) == 1, f"index.html 应只挂一条最终混音，实有 {len(srcs)} 条"
wav = proj / srcs[0]

subprocess.run(["ffmpeg", "-nostdin", "-y", "-v", "error", "-i", str(raw), "-i", str(wav), "-map", "0:v:0", "-map", "1:a:0",
                "-c:v", "copy", "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-ac", "2", "-shortest",
                "-movflags", "+faststart", str(out)], check=True)

info = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(out)],
                                 capture_output=True, text=True, check=True).stdout)
v = next(s for s in info["streams"] if s["codec_type"] == "video")
a = next(s for s in info["streams"] if s["codec_type"] == "audio")
ebu = subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-i", str(out), "-map", "0:a", "-af", "ebur128=peak=true", "-f", "null", "-"],
                     capture_output=True, text=True, encoding="utf-8", errors="replace").stderr
summ = ebu[ebu.rfind("Summary:"):]
L = float(re.search(r"I:\s+(-?[\d.]+) LUFS", summ).group(1))
tp = float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", summ).group(1))
head = out.read_bytes()[:4096]

checks = {
    "1920x1080": (v["width"], v["height"]) == (1920, 1080),
    "60fps": v["r_frame_rate"] == "60/1",
    "h264 High": v["codec_name"] == "h264" and v["profile"] == "High",
    "yuv420p": v["pix_fmt"] == "yuv420p",
    "bt709 limited": v.get("color_space") == "bt709" and v.get("color_range") == "tv",
    "progressive": v.get("field_order", "progressive") == "progressive",
    "faststart": head.find(b"moov") != -1 and (head.find(b"mdat") == -1 or head.find(b"moov") < head.find(b"mdat")),
    "aac LC 48k stereo": a["codec_name"] == "aac" and a["profile"] == "LC" and a["sample_rate"] == "48000" and a["channels"] == 2,
    "loudness -20+-1": abs(L + 20) <= 1,
    "true peak <= -1": tp <= -1.0,
}
for k, ok in checks.items():
    print(("OK   " if ok else "FAIL ") + k)
print(f"{out.name}: {L} LUFS, {tp} dBTP, audio avg {int(a['bit_rate']) // 1000} kbps (encoded at 320k; sparse audio averages lower)")
sys.exit(0 if all(checks.values()) else 1)
