@echo off
title 网站管理工具

REM ===== 防闪退: 显示启动信息 =====
echo.
echo ============================================
echo      网站服务管理工具
echo ============================================
echo.
echo 脚本已启动，正在初始化...
echo.

REM ===== 等待2秒，让你看清楚 =====
timeout /t 2 >nul

:MENU
cls
echo.
echo ============================================
echo      网站服务管理工具
echo ============================================
echo.
echo  请选择操作：
echo.
echo  [1] 启动服务
echo  [2] 停止服务
echo  [3] 查看状态
echo  [0] 退出
echo.
echo ============================================
echo.

REM ===== 读取用户输入 =====
set choice=
set /p choice=请输入选项 (0-3): 

REM ===== 如果没输入任何内容，重新显示菜单 =====
if "%choice%"=="" (
    echo.
    echo [提示] 请输入一个选项
    timeout /t 1 >nul
    goto MENU
)

REM ===== 判断用户选择 =====
if "%choice%"=="1" goto START
if "%choice%"=="2" goto STOP
if "%choice%"=="3" goto STATUS
if "%choice%"=="0" goto END

REM ===== 无效输入 =====
echo.
echo [错误] 无效的选项: %choice%
echo 请输入 0、1、2 或 3
timeout /t 2 >nul
goto MENU

REM ========================================
REM  启动服务
REM ========================================
:START
cls
echo.
echo ----------------------------------------
echo 正在启动服务...
echo ----------------------------------------
echo.

REM 保存当前目录
set ORIGINAL_DIR=%CD%

REM 检查server目录
if not exist "server\" (
    echo [错误] 找不到 server 目录
    echo 当前位置: %CD%
    echo.
    goto PAUSE_MENU
)

REM 进入server目录
cd server
if errorlevel 1 (
    echo [错误] 无法进入server目录
    goto PAUSE_MENU
)

REM 检查Node.js
echo 正在检查Node.js环境...
where node >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到Node.js
    echo.
    echo 请先安装Node.js:
    echo 访问 https://nodejs.org/
    echo.
    cd "%ORIGINAL_DIR%"
    goto PAUSE_MENU
)

node --version
echo Node.js 检查通过！
echo.

REM 检查package.json
if not exist "package.json" (
    echo [错误] 找不到 package.json
    cd "%ORIGINAL_DIR%"
    goto PAUSE_MENU
)

REM 启动服务
echo 启动服务器...
echo.
start "网站服务器-端口3000" cmd /k "npm start"

echo [成功] 服务已在新窗口启动
echo.
echo 服务地址: http://localhost:3000
timeout /t 2 >nul

REM 打开浏览器
start http://localhost:3000

REM 返回原目录
cd "%ORIGINAL_DIR%"

goto PAUSE_MENU

REM ========================================
REM  停止服务
REM ========================================
:STOP
cls
echo.
echo ----------------------------------------
echo 正在停止服务...
echo ----------------------------------------
echo.

REM 检查是否有Node.js进程
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I "node.exe" >NUL
if %ERRORLEVEL% EQU 0 (
    echo 找到Node.js进程
    echo 正在终止...
    taskkill /F /IM node.exe /T >nul 2>&1
    echo.
    echo [成功] 已停止所有Node.js进程
) else (
    echo [提示] 没有运行中的Node.js进程
)

echo.
goto PAUSE_MENU

REM ========================================
REM  查看状态
REM ========================================
:STATUS
cls
echo.
echo ----------------------------------------
echo 系统状态检查
echo ----------------------------------------
echo.

echo [1] Node.js 环境检查:
where node >nul 2>&1
if errorlevel 1 (
    echo     状态: 未安装
    echo     请访问: https://nodejs.org/
) else (
    echo     状态: 已安装
    node --version 2>nul
)

echo.
echo [2] 服务进程状态:
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I "node.exe" >NUL
if %ERRORLEVEL% EQU 0 (
    echo     状态: 运行中
) else (
    echo     状态: 未运行
)

echo.
echo [3] 端口占用检查:
netstat -ano | findstr ":3000" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo     端口3000: 已占用 (服务可能在运行)
) else (
    echo     端口3000: 空闲
)

echo.
echo [4] 项目目录检查:
if exist "server\" (
    echo     server目录: 存在
) else (
    echo     server目录: 不存在 [错误]
)

if exist "server\package.json" (
    echo     package.json: 存在
) else (
    echo     package.json: 不存在 [错误]
)

echo.
goto PAUSE_MENU

REM ========================================
REM  暂停并返回菜单
REM ========================================
:PAUSE_MENU
echo.
echo ----------------------------------------
echo 按任意键返回主菜单...
echo ----------------------------------------
pause >nul
goto MENU

REM ========================================
REM  退出程序
REM ========================================
:END
cls
echo.
echo ============================================
echo.
echo      感谢使用网站服务管理工具！
echo.
echo               再见！
echo.
echo ============================================
echo.
echo 窗口将在 3 秒后关闭...
timeout /t 3 >nul
exit
