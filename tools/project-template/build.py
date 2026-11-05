"""__NAME__ 唯一时间源：生成 assets/data/data.js，回写 index.html 时长。"""
import sys
from pathlib import Path

ROOT = Path(__file__).parent
sys.path.insert(0, str(ROOT / "assets/shared/py"))
from common import load_text, set_duration, write_js  # noqa: E402

T = load_text(ROOT / "assets/text/zh-CN.js")

duration = 1.0
data = {"duration": duration, "beats": {}}
write_js(ROOT / "assets/data/data.js", "DATA", data)
set_duration(ROOT / "index.html", duration)
print("duration", duration)
