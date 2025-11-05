@echo off
title 网站服务管理工具

REM ===== 防闪退: 不使用编码切换 =====
REM 不使用 chcp 65001，避免某些系统上的兼容性问题

REM 设置基本变量
set ROOT_DIR=%~dp0
set SERVER_DIR=%ROOT_DIR%server
set PORT=3000

REM 显示启动信息
echo.
echo ============================================
echo      网站服务管理工具 v2.0
echo ============================================
echo.
echo 正在初始化...
timeout /t 1 >nul

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
echo  [3] 重启服务
echo  [4] 查看状态
echo  [5] 修改端口
echo  [0] 退出
echo.
echo ============================================
echo.

set choice=
set /p choice=请输入选项 (0-5): 

if "%choice%"=="" goto MENU
if "%choice%"=="1" goto START_SERVICE
if "%choice%"=="2" goto STOP_SERVICE
if "%choice%"=="3" goto RESTART_SERVICE
if "%choice%"=="4" goto CHECK_STATUS
if "%choice%"=="5" goto CHANGE_PORT
if "%choice%"=="0" goto EXIT

echo.
echo [错误] 无效的选项
timeout /t 1 >nul
goto MENU

REM ========================================
REM 启动服务
REM ========================================
:START_SERVICE
cls
echo.
echo ----------------------------------------
echo  启动网站服务
echo ----------------------------------------
echo.

REM 检查是否已有服务在运行
echo [1/5] 检查服务状态...
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I "node.exe" >NUL
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [警告] 检测到Node.js进程已在运行
    echo.
    set /p confirm=是否先停止现有服务？(Y/N): 
    if /i "!confirm!"=="Y" (
        call :STOP_SERVICE_INTERNAL
        echo.
        echo 等待3秒后启动新服务...
        timeout /t 3 >nul
    ) else (
        echo.
        echo [取消] 启动操作已取消
        goto MENU_PAUSE
    )
)

REM 检查Node.js环境
echo [2/5] 检查Node.js环境...
where node >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到Node.js环境
    echo.
    echo 请先安装Node.js
    echo 下载地址：https://nodejs.org/
    echo.
    set /p open_url=是否打开下载页面？(Y/N): 
    if /i "!open_url!"=="Y" (
        start "" "https://nodejs.org/"
    )
    goto MENU_PAUSE
)
node --version
echo Node.js环境检测通过

REM 进入服务器目录
echo [3/5] 进入服务器目录...
cd /d "%SERVER_DIR%"
if errorlevel 1 (
    echo [错误] 无法进入目录: %SERVER_DIR%
    goto MENU_PAUSE
)
echo 当前目录: %SERVER_DIR%

REM 安装依赖
echo [4/5] 检查并安装依赖...
if not exist "node_modules" (
    echo 首次运行，正在安装依赖包...
    call npm install
    if errorlevel 1 (
        echo [错误] 依赖安装失败
        echo.
        echo 可能的原因：
        echo  - 网络连接问题
        echo  - npm镜像源访问慢
        echo.
        echo 建议：切换到淘宝镜像
        echo  npm config set registry https://registry.npmmirror.com
        goto MENU_PAUSE
    )
) else (
    echo 依赖包已存在
)

REM 启动服务
echo [5/5] 启动服务 (端口: %PORT%)...
echo.
start "Website Dev Server - Port %PORT%" cmd /c "set PORT=%PORT% && npm start"
if errorlevel 1 (
    echo [错误] 服务启动失败
    goto MENU_PAUSE
)

echo 服务已在新窗口中启动
echo.
timeout /t 3 /nobreak >nul

REM 打开浏览器
set URL=http://localhost:%PORT%
echo 正在打开浏览器...
start "" "%URL%"
echo.
echo ========================================
echo  服务启动成功！
echo  访问地址: %URL%
echo  服务端口: %PORT%
echo ========================================
echo.

goto MENU_PAUSE

REM ========================================
REM 停止服务
REM ========================================
:STOP_SERVICE
cls
echo.
echo ╔════════════════════════════════════════╗
echo ║           停止网站服务                 ║
echo ╚════════════════════════════════════════╝
echo.

call :STOP_SERVICE_INTERNAL

goto MENU_PAUSE

:STOP_SERVICE_INTERNAL
echo [1/2] 正在查找Node.js进程...
echo.

tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo 找到运行中的Node.js进程：
    tasklist /FI "IMAGENAME eq node.exe"
    echo.
    
    echo 正在停止进程...
    taskkill /F /IM node.exe /T >nul 2>&1
    
    if %ERRORLEVEL% EQU 0 (
        echo ✓ 成功停止所有Node.js进程
    ) else (
        echo ✗ 停止进程时出现错误
        echo.
        echo [建议] 请尝试以管理员身份运行此脚本
        exit /b 1
    )
) else (
    echo ✓ 未发现运行中的Node.js进程
)

echo.
echo [2/2] 检查端口占用情况...
echo.

netstat -ano | findstr ":3000 :3001 :3002" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo 警告：以下端口仍被占用：
    netstat -ano | findstr ":3000 :3001 :3002"
    echo.
    echo [提示] 可能存在其他程序占用端口
) else (
    echo ✓ 端口 3000, 3001, 3002 已全部释放
)

echo.
echo ════════════════════════════════════════
echo  服务已停止
echo ════════════════════════════════════════
echo.

exit /b 0

REM ========================================
REM 重启服务
REM ========================================
:RESTART_SERVICE
cls
echo.
echo ╔════════════════════════════════════════╗
echo ║           重启网站服务                 ║
echo ╚════════════════════════════════════════╝
echo.

echo [步骤1] 停止现有服务...
call :STOP_SERVICE_INTERNAL

echo.
echo [步骤2] 等待3秒...
timeout /t 3 >nul

echo.
echo [步骤3] 启动新服务...
goto START_SERVICE

REM ========================================
REM 查看状态
REM ========================================
:CHECK_STATUS
cls
echo.
echo ╔════════════════════════════════════════╗
echo ║           服务状态检查                 ║
echo ╚════════════════════════════════════════╝
echo.

echo [1/4] Node.js环境检查
echo ────────────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
    echo ✗ Node.js: 未安装
) else (
    node --version >nul 2>&1
    if errorlevel 1 (
        echo ✗ Node.js: 已安装但无法运行
    ) else (
        for /f "delims=" %%i in ('node --version') do set NODE_VER=%%i
        echo ✓ Node.js: !NODE_VER!
    )
)
echo.

echo [2/4] npm环境检查
echo ────────────────────────────────────────
where npm >nul 2>&1
if errorlevel 1 (
    echo ✗ npm: 未安装
) else (
    for /f "delims=" %%i in ('npm --version') do set NPM_VER=%%i
    echo ✓ npm: v!NPM_VER!
)
echo.

echo [3/4] Node.js进程状态
echo ────────────────────────────────────────
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✓ 服务状态: 运行中
    echo.
    echo 进程列表:
    tasklist /FI "IMAGENAME eq node.exe"
) else (
    echo ✗ 服务状态: 未运行
)
echo.

echo [4/4] 端口占用检查
echo ────────────────────────────────────────
netstat -ano | findstr ":3000 :3001 :3002" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo 端口占用情况:
    netstat -ano | findstr ":3000 :3001 :3002"
) else (
    echo ✓ 端口 3000-3002: 未被占用
)
echo.

echo ════════════════════════════════════════
echo  状态检查完成
echo ════════════════════════════════════════
echo.

goto MENU_PAUSE

REM ========================================
REM 修改端口
REM ========================================
:CHANGE_PORT
cls
echo.
echo ╔════════════════════════════════════════╗
echo ║           修改服务端口                 ║
echo ╚════════════════════════════════════════╝
echo.

echo 当前端口: %PORT%
echo.
echo 建议端口范围: 3000-9999
echo 常用端口: 3000, 3001, 8080, 8888
echo.

set /p NEW_PORT=请输入新端口号 (留空取消): 

if "%NEW_PORT%"=="" (
    echo.
    echo [取消] 端口未修改
    goto MENU_PAUSE
)

REM 简单的端口号验证
echo %NEW_PORT%| findstr /r "^[0-9][0-9]*$" >nul
if errorlevel 1 (
    echo.
    echo [错误] 端口号必须是数字
    goto MENU_PAUSE
)

if %NEW_PORT% LSS 1000 (
    echo.
    echo [警告] 端口号小于1000可能需要管理员权限
)

if %NEW_PORT% GTR 65535 (
    echo.
    echo [错误] 端口号不能大于65535
    goto MENU_PAUSE
)

set PORT=%NEW_PORT%
echo.
echo ✓ 端口已修改为: %PORT%
echo.
echo [提示] 如果服务正在运行，请重启服务使端口生效
echo.

goto MENU_PAUSE

REM ========================================
REM 通用暂停并返回菜单
REM ========================================
:MENU_PAUSE
echo.
echo 按任意键返回主菜单...
pause >nul
goto MENU

REM ========================================
REM 退出程序
REM ========================================
:EXIT
cls
echo.
echo ════════════════════════════════════════
echo  感谢使用网站服务管理工具
echo  Goodbye!
echo ════════════════════════════════════════
echo.
echo 窗口将2秒后关闭...
timeout /t 2 >nul
exit
