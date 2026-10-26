@echo off
setlocal DisableDelayedExpansion
set "ELECTRON_RUN_AS_NODE=1"
"%~dp0..\..\..\..\xpeach-harness.exe" --expose-internals "%~dp0..\..\..\app.asar\dsh\node_modules\@xpeach\xph-desktop-host\lib\cli.js" %*
exit /b %errorlevel%
