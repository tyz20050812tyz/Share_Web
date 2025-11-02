@echo off
chcp 65001 >nul
echo ========================================
echo    停止网站服务
echo ========================================
echo.

echo [1/2] 正在查找运行中的Node.js进程...
echo.

REM 检查是否有Node进程在运行
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo 找到运行中的Node.js进程，正在停止...
    echo.
    
    REM 显示即将停止的进程
    echo 当前运行的Node.js进程：
    tasklist /FI "IMAGENAME eq node.exe"
    echo.
    
    REM 停止所有Node进程
    taskkill /F /IM node.exe /T >nul 2>&1
    
    if %ERRORLEVEL% EQU 0 (
        echo ✓ 成功停止所有Node.js进程
    ) else (
        echo ✗ 停止进程时出现错误
        echo.
        echo 如果进程无法停止，请尝试以管理员身份运行此脚本
    )
) else (
    echo ✓ 未发现运行中的Node.js进程
)

echo.
echo [2/2] 检查端口占用情况...
echo.

REM 检查常用端口是否还被占用
echo 检查端口 3000, 3001, 3002...
netstat -ano | findstr ":3000 :3001 :3002" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo.
    echo 警告：以下端口仍被占用：
    netstat -ano | findstr ":3000 :3001 :3002"
    echo.
    echo 如需释放这些端口，请手动结束对应的进程
) else (
    echo ✓ 端口 3000, 3001, 3002 已全部释放
)

echo.
echo ========================================
echo    网站服务已停止
echo ========================================
echo.
echo 按任意键退出...
pause >nul
