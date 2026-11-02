@echo off
rem Usage: tools\link-shared.cmd <project-dir>
rem Creates <project>\assets\shared -> <framework>\shared; if <project>\..\common exists (series), also <project>\assets\series -> it
if "%~1"=="" (echo usage: link-shared.cmd ^<project-dir^> & exit /b 1)
if not exist "%~1\assets" mkdir "%~1\assets"
if exist "%~1\assets\shared" (echo exists: %~1\assets\shared) else mklink /J "%~1\assets\shared" "%~dp0..\shared"
if exist "%~f1\..\common" if not exist "%~1\assets\series" mklink /J "%~1\assets\series" "%~f1\..\common"
