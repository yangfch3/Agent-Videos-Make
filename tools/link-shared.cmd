@echo off
rem Usage: tools\link-shared.cmd <project-dir>  -- creates <project-dir>\assets\shared junction to <framework-root>\shared
if "%~1"=="" (echo usage: link-shared.cmd ^<project-dir^> & exit /b 1)
if not exist "%~1\assets" mkdir "%~1\assets"
if exist "%~1\assets\shared" (echo exists: %~1\assets\shared & exit /b 0)
mklink /J "%~1\assets\shared" "%~dp0..\shared"
