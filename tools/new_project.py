"""新建视频项目：tools/new-project.cmd <名字> 或 <系列>/<集号>-<英文名>（sh 同）。

复制模板（系列有 common/template/ 时用它，否则用 tools/project-template/），生成 meta.json、GATES.md，建 assets/shared（系列另建 assets/series）联接，跑一次 build.py。
"""
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TPL = ROOT / "tools/project-template"
GATES_TPL = ROOT / "spec/视频制作GateFlow与SignOff记录模板.md"


def die(msg):
    sys.exit(f"new-project: {msg}")


def link(dst, src):
    if os.name == "nt":
        subprocess.run(["cmd", "/c", "mklink", "/J", str(dst), str(src)], check=True, stdout=subprocess.DEVNULL)
    else:
        os.symlink(os.path.relpath(src, dst.parent), dst)


def main():
    if len(sys.argv) != 2:
        die("用法：new-project <名字> | <系列>/<集号>-<英文名>")
    parts = sys.argv[1].replace("\\", "/").strip("/").split("/")
    if len(parts) > 2 or not all(re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]*", p) for p in parts):
        die("名字只用 ASCII 字母、数字、. _ -，最多两级")
    name = "/".join(parts)
    dst = ROOT / "projects" / name
    if dst.exists():
        die(f"已存在：projects/{name}")

    series = dst.parent if len(parts) == 2 else None
    if series:
        if (series / "hyperframes.json").exists():
            die(f"projects/{parts[0]} 是单片项目，不能当系列")
        (series / "common").mkdir(parents=True, exist_ok=True)

    tpl = series / "common/template" if series and (series / "common/template").is_dir() else TPL
    shutil.copytree(tpl, dst)
    tmp = "-".join(parts)
    for p in dst.rglob("*"):
        if p.is_file() and p.suffix in {".html", ".py", ".mjs", ".js"}:
            p.write_text(p.read_text(encoding="utf-8").replace("__NAME__", name).replace("__TMP__", tmp), encoding="utf-8")
    (dst / "meta.json").write_text(f'{{"id":"{tmp}","name":"{tmp}"}}\n', encoding="utf-8")

    gates = GATES_TPL.read_text(encoding="utf-8").split("<!-- 以下复制使用 -->", 1)[1].lstrip()
    gates = gates.replace("<片名>", name).replace("`projects/…`", f"`projects/{name}`")
    (dst / "GATES.md").write_text(gates, encoding="utf-8")

    link(dst / "assets/shared", ROOT / "shared")
    if series:
        link(dst / "assets/series", series / "common")

    subprocess.run([sys.executable, str(dst / "build.py")], check=True, stdout=subprocess.DEVNULL)
    print(f"OK projects/{name}（模板：{tpl.relative_to(ROOT).as_posix()}）")


main()
