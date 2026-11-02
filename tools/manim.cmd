@echo off
rem MiKTeX dvisvgm fails with "Windows API error 87" when the per-drive cwd variable (e.g. "=E:") is missing; cmd.exe sets it.
uv run --project "%~dp0.." manim %*
