document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('register-form');
  const btn = document.getElementById('registerBtn');
  const tip = document.getElementById('registerMessage');
  const accEl = document.getElementById('account');
  const pwdEl = document.getElementById('password');
  const cfmEl = document.getElementById('confirm');
  const togglePwd = document.getElementById('togglePwd');
  const toggleConfirm = document.getElementById('toggleConfirm');

  function setMessage(msg, type = 'info') {
    if (!tip) return;
    tip.textContent = msg;
    tip.style.color = (type === 'error') ? '#e5484d' : (type === 'success' ? '#2c7a7b' : 'inherit');
  }

  if (togglePwd && pwdEl) {
    togglePwd.addEventListener('click', () => {
      const t = pwdEl.getAttribute('type') === 'password' ? 'text' : 'password';
      pwdEl.setAttribute('type', t);
      togglePwd.textContent = t === 'password' ? '显示' : '隐藏';
    });
  }

  if (toggleConfirm && cfmEl) {
    toggleConfirm.addEventListener('click', () => {
      const t = cfmEl.getAttribute('type') === 'password' ? 'text' : 'password';
      cfmEl.setAttribute('type', t);
      toggleConfirm.textContent = t === 'password' ? '显示' : '隐藏';
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const account = (accEl?.value || '').trim();
      const password = (pwdEl?.value || '').trim();
      const confirm = (cfmEl?.value || '').trim();
      if (!account || account.length < 2) {
        setMessage('请输入有效的用户名（至少 2 个字符）', 'error');
        accEl?.focus();
        return;
      }
      if (!password || password.length < 6) {
        setMessage('请输入至少 6 位密码', 'error');
        pwdEl?.focus();
        return;
      }
      if (password !== confirm) {
        setMessage('两次输入的密码不一致', 'error');
        cfmEl?.focus();
        return;
      }

      try {
        if (btn) { btn.disabled = true; btn.textContent = '注册中…'; }
        const resp = await fetch('/api/register', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ account, password })
        });
        const data = await resp.json();
        if (!resp.ok || !data?.ok) {
          setMessage(data?.error || '注册失败', 'error');
          if (btn) { btn.disabled = false; btn.textContent = '注册'; }
          return;
        }
        setMessage(`注册成功：欢迎 ${account}，请登录`, 'success');
        setTimeout(() => { window.location.href = '/login.html'; }, 800);
      } catch (err) {
        setMessage('网络异常，请稍后重试', 'error');
        if (btn) { btn.disabled = false; btn.textContent = '注册'; }
      }
    });
  }
});