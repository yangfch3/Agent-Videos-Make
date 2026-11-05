@echo off
rem Usage: tools\new-project.cmd <name> or <series>/<ep>
setlocal
pushd "%~dp0.."
uv run python tools/new_project.py %*
set rc=%errorlevel%
popd
exit /b %rc%
