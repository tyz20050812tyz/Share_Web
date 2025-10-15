document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('forgot-form');
  const email = document.getElementById('reset-email');
  const msg = document.getElementById('resetMessage');
  const btn = document.getElementById('resetBtn');

  function setMessage(text, type = 'info') {
    msg.textContent = text;
    msg.classList.remove('success', 'error', 'show');
    if (type === 'success') msg.classList.add('success');
    if (type === 'error') msg.classList.add('error');
    msg.classList.add('show');
  }

  function isEmail(v = '') { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim()); }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      email.classList.remove('error');
      setMessage('', 'info');
      const v = (email.value || '').trim();
      if (!isEmail(v)) { email.classList.add('error'); setMessage('请输入有效的邮箱地址', 'error'); email.focus(); return; }
      btn.disabled = true; setMessage('正在发送重置链接…');
      setTimeout(() => { btn.disabled = false; setMessage('如果该邮箱已注册，重置链接已发送（演示）', 'success'); }, 800);
    });
  }
});