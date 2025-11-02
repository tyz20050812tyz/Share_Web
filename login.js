document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const accountInput = document.getElementById('account');
  const passwordInput = document.getElementById('password');
  const msgBox = document.getElementById('loginMessage');
  const btn = document.getElementById('loginBtn');
  const togglePwdBtn = document.getElementById('togglePwd');
  const forgotLink = document.querySelector('.forgot-link');

  function setMessage(text, type = 'info') {
    if (!msgBox) return;
    msgBox.textContent = text || '';
    msgBox.classList.remove('success', 'error', 'show');
    if (type === 'success') msgBox.classList.add('success');
    if (type === 'error') msgBox.classList.add('error');
    msgBox.classList.add('show');
  }

  function isEmail(str = '') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(str).trim());
  }

  function validate() {
    const account = (accountInput?.value || '').trim();
    const password = (passwordInput?.value || '').trim();

    if (!account) { setMessage('请输入用户名或邮箱', 'error'); return false; }
    if (!password) { setMessage('请输入密码', 'error'); return false; }

    if (account.includes('@')) {
      if (!isEmail(account)) { setMessage('邮箱格式不正确', 'error'); return false; }
    } else {
      if (account.length < 2) { setMessage('用户名至少 2 个字符', 'error'); return false; }
    }

    if (password.length < 4) { setMessage('密码长度至少 4 位', 'error'); return false; }
    setMessage('');
    return true;
  }

  if (togglePwdBtn && passwordInput) {
    togglePwdBtn.addEventListener('click', () => {
      const isPwd = passwordInput.type === 'password';
      passwordInput.type = isPwd ? 'text' : 'password';
      togglePwdBtn.textContent = isPwd ? '隐藏' : '显示';
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validate()) return;

      const account = accountInput.value.trim();
      const password = passwordInput.value.trim();

      try { localStorage.setItem('login_user', account); } catch {}

      if (btn) { btn.disabled = true; btn.textContent = '正在登录…'; }
      setMessage('正在登录…');

      try {
        const resp = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ account, password }),
        });
        const data = await resp.json();
        if (!resp.ok || !data?.ok) {
          const err = data?.error || '登录失败，请检查账号或密码';
          setMessage(err, 'error');
          if (btn) { btn.disabled = false; btn.textContent = '登录'; }
          return;
        }

        const role = data.role === 'admin' ? '管理员' : '用户';
        // 持久化角色与用户名，供其他页面使用（如讨论区权限）
        try {
          localStorage.setItem('login_role', data.role === 'admin' ? 'admin' : 'user');
          localStorage.setItem('login_user', (data?.user?.name || account));
        } catch {}
        setMessage(`登录成功（${role}）：欢迎 ${data?.user?.name || account}`, 'success');
        setTimeout(() => { window.location.href = '/index.html'; }, 600);
      } catch (e) {
        setMessage('网络异常，请稍后重试', 'error');
        if (btn) { btn.disabled = false; btn.textContent = '登录'; }
      }
    });
  }

  if (forgotLink) {
    forgotLink.addEventListener('click', (e) => {
      // 跳转至忘记密码页面；如需拦截可在此处理
    });
  }
});