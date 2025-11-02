document.addEventListener('DOMContentLoaded', () => {
    let currentStep = 1;
    let verifiedAccount = '';

    // DOM 元素
    const step1Btn = document.getElementById('step1Btn');
    const step2Btn = document.getElementById('step2Btn');
    const resetBtn = document.getElementById('resetBtn');
    const backToStep1 = document.getElementById('backToStep1');
    const backToStep2 = document.getElementById('backToStep2');

    const accountInput = document.getElementById('reset-account');
    const oldPasswordInput = document.getElementById('verify-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');

    // 工具函数：显示消息
    function showMessage(step, text, type = 'info') {
        const msg = document.getElementById(`message${step}`);
        if (!msg) return;

        msg.textContent = text;
        msg.classList.remove('success', 'error', 'info', 'show');
        if (type) msg.classList.add(type);
        msg.classList.add('show');
    }

    // 工具函数：切换步骤
    function goToStep(step) {
        // 隐藏所有步骤
        document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));

        // 显示目标步骤
        const targetStep = document.getElementById(`form-step-${step === 4 ? 'success' : step}`);
        if (targetStep) targetStep.classList.add('active');

        // 更新步骤指示器
        for (let i = 1; i <= 3; i++) {
            const stepEl = document.getElementById(`step${i}`);
            if (!stepEl) continue;

            stepEl.classList.remove('active', 'completed');
            if (i < step) {
                stepEl.classList.add('completed');
            } else if (i === step) {
                stepEl.classList.add('active');
            }
        }

        currentStep = step;
    }

    // 步骤1：验证账号
    if (step1Btn) {
        step1Btn.addEventListener('click', async() => {
            const account = (accountInput.value || '').trim();

            // 清除错误状态
            accountInput.classList.remove('error');

            // 验证输入
            if (!account) {
                accountInput.classList.add('error');
                showMessage(1, '请输入注册账号', 'error');
                accountInput.focus();
                return;
            }

            if (account.length < 2) {
                accountInput.classList.add('error');
                showMessage(1, '账号长度至少2个字符', 'error');
                accountInput.focus();
                return;
            }

            // 检查账号是否存在
            step1Btn.disabled = true;
            showMessage(1, '正在验证账号...', 'info');

            try {
                const response = await fetch('/api/check-account', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ account })
                });

                const data = await response.json();

                if (data.ok && data.exists) {
                    verifiedAccount = account;
                    showMessage(1, '账号验证成功！', 'success');
                    setTimeout(() => goToStep(2), 500);
                } else {
                    accountInput.classList.add('error');
                    showMessage(1, '该账号不存在，请检查后重试', 'error');
                }
            } catch (error) {
                showMessage(1, '网络错误，请稍后重试', 'error');
            } finally {
                step1Btn.disabled = false;
            }
        });
    }

    // 步骤2：验证旧密码
    if (step2Btn) {
        step2Btn.addEventListener('click', async() => {
            const oldPassword = (oldPasswordInput.value || '').trim();

            // 清除错误状态
            oldPasswordInput.classList.remove('error');

            // 验证输入
            if (!oldPassword) {
                oldPasswordInput.classList.add('error');
                showMessage(2, '请输入旧密码进行验证', 'error');
                oldPasswordInput.focus();
                return;
            }

            // 验证旧密码
            step2Btn.disabled = true;
            showMessage(2, '正在验证身份...', 'info');

            try {
                const response = await fetch('/api/verify-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        account: verifiedAccount,
                        password: oldPassword
                    })
                });

                const data = await response.json();

                if (data.ok && data.valid) {
                    showMessage(2, '身份验证成功！', 'success');
                    setTimeout(() => goToStep(3), 500);
                } else {
                    oldPasswordInput.classList.add('error');
                    showMessage(2, '旧密码不正确，请重试', 'error');
                }
            } catch (error) {
                showMessage(2, '网络错误，请稍后重试', 'error');
            } finally {
                step2Btn.disabled = false;
            }
        });
    }

    // 步骤3：设置新密码
    if (resetBtn) {
        resetBtn.addEventListener('click', async() => {
            const newPassword = (newPasswordInput.value || '').trim();
            const confirmPassword = (confirmPasswordInput.value || '').trim();

            // 清除错误状态
            newPasswordInput.classList.remove('error');
            confirmPasswordInput.classList.remove('error');

            // 验证输入
            if (!newPassword) {
                newPasswordInput.classList.add('error');
                showMessage(3, '请输入新密码', 'error');
                newPasswordInput.focus();
                return;
            }

            if (newPassword.length < 6) {
                newPasswordInput.classList.add('error');
                showMessage(3, '密码长度至少6位', 'error');
                newPasswordInput.focus();
                return;
            }

            if (newPassword !== confirmPassword) {
                confirmPasswordInput.classList.add('error');
                showMessage(3, '两次输入的密码不一致', 'error');
                confirmPasswordInput.focus();
                return;
            }

            // 重置密码
            resetBtn.disabled = true;
            showMessage(3, '正在重置密码...', 'info');

            try {
                const response = await fetch('/api/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        account: verifiedAccount,
                        newPassword
                    })
                });

                const data = await response.json();

                if (data.ok) {
                    showMessage(3, '密码重置成功！', 'success');
                    setTimeout(() => goToStep(4), 800);
                } else {
                    showMessage(3, data.error || '重置失败，请稍后重试', 'error');
                }
            } catch (error) {
                showMessage(3, '网络错误，请稍后重试', 'error');
            } finally {
                resetBtn.disabled = false;
            }
        });
    }

    // 返回按钮
    if (backToStep1) {
        backToStep1.addEventListener('click', () => goToStep(1));
    }

    if (backToStep2) {
        backToStep2.addEventListener('click', () => goToStep(2));
    }

    // 回车键支持 (旧版实现：移除可选链，使用显式判断)

    // 1. 账号输入框的回车支持
    if (typeof accountInput !== 'undefined' && accountInput !== null) {
        accountInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (typeof step1Btn !== 'undefined' && step1Btn !== null) {
                    step1Btn.click();
                }
            }
        });
    }

    // 2. 旧密码输入框的回车支持
    if (typeof oldPasswordInput !== 'undefined' && oldPasswordInput !== null) {
        oldPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (typeof step2Btn !== 'undefined' && step2Btn !== null) {
                    step2Btn.click();
                }
            }
        });
    }

    // 3. 确认密码输入框的回车支持
    if (typeof confirmPasswordInput !== 'undefined' && confirmPasswordInput !== null) {
        confirmPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (typeof resetBtn !== 'undefined' && resetBtn !== null) {
                    resetBtn.click();
                }
            }
        });
    }
});