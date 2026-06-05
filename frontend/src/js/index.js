// Redirect if already logged in
if (localStorage.getItem('access_token')) window.location.href = '/dashboard.html';

// ── Tab switcher ──────────────────────────────────────────────
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach((b, i) =>
    b.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'register'))
  );
  document.getElementById('panel-login').classList.toggle('active', tab === 'login');
  document.getElementById('panel-register').classList.toggle('active', tab === 'register');
  if (tab === 'register') showRegisterStep(1);
}

// ── Loading state ─────────────────────────────────────────────
function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  btn.disabled = loading;
  btn.innerHTML = loading
    ? '<span class="btn-loader"></span>Loading…'
    : btn.dataset.label;
}
document.querySelectorAll('.btn-primary').forEach(b => (b.dataset.label = b.textContent));

// ── Alerts ────────────────────────────────────────────────────
function showAlert(id, msg, type = 'error') {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.className = `alert ${type} show`;
}
function hideAlert(id) {
  document.getElementById(id).className = 'alert';
}

// ── Register step switcher ────────────────────────────────────
let pendingRegisterEmail = '';
let pendingRegisterPassword = '';
let pendingFirstName = '';
let pendingLastName = '';

function showRegisterStep(step) {
  document.getElementById('register-step-1').classList.toggle('active', step === 1);
  document.getElementById('register-step-2').classList.toggle('active', step === 2);
  hideAlert('register-error');
  hideAlert('register-success');
}

// ── Step 1: request email code ────────────────────────────────
async function doRequestCode() {
  hideAlert('register-error');
  const email      = document.getElementById('reg-email').value.trim();
  const password   = document.getElementById('reg-password').value;
  const first_name = document.getElementById('reg-first').value.trim();
  const last_name  = document.getElementById('reg-last').value.trim();

  if (!email || !password) return showAlert('register-error', 'Email and password are required.');

  setLoading('request-code-btn', true);
  try {
    const res = await fetch('/api/users/get-email-code/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data.email?.[0] || data.error || data.detail || 'Failed to send code.';
      throw new Error(msg);
    }
    pendingRegisterEmail    = email;
    pendingRegisterPassword = password;
    pendingFirstName        = first_name;
    pendingLastName         = last_name;

    document.getElementById('code-email-hint').textContent = email;
    showRegisterStep(2);
  } catch (e) {
    showAlert('register-error', e.message);
  } finally {
    setLoading('request-code-btn', false);
  }
}

// ── Step 2: confirm code & register ──────────────────────────
async function doConfirmCode() {
  hideAlert('register-error');
  const code = document.getElementById('reg-code').value.trim();

  if (!code)           return showAlert('register-error', 'Please enter the confirmation code.');
  if (code.length !== 6) return showAlert('register-error', 'Code must be 6 characters.');

  setLoading('confirm-code-btn', true);
  try {
    const res = await fetch('/api/users/register/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:      pendingRegisterEmail,
        password:   pendingRegisterPassword,
        code:       code,
        first_name: pendingFirstName,
        last_name:  pendingLastName,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data.error || data.detail || data.code?.[0] || 'Registration failed.';
      throw new Error(msg);
    }
    localStorage.setItem('access_token',  data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    showAlert('register-success', 'Account created! Redirecting…', 'success');
    setTimeout(() => (window.location.href = '/dashboard.html'), 900);
  } catch (e) {
    showAlert('register-error', e.message);
  } finally {
    setLoading('confirm-code-btn', false);
  }
}

// ── Resend code ───────────────────────────────────────────────
async function doResendCode() {
  hideAlert('register-error');
  const btn = document.getElementById('resend-btn');
  btn.disabled = true;
  btn.textContent = 'Sending…';
  try {
    const res = await fetch('/api/users/get-email-code/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: pendingRegisterEmail }),
    });
    if (!res.ok) throw new Error('Failed to resend.');
    showAlert('register-success', 'New code sent!', 'success');
    let secs = 30;
    const interval = setInterval(() => {
      secs--;
      btn.textContent = `Resend (${secs}s)`;
      if (secs <= 0) {
        clearInterval(interval);
        btn.disabled = false;
        btn.textContent = 'Resend code';
      }
    }, 1000);
  } catch (e) {
    showAlert('register-error', e.message);
    btn.disabled = false;
    btn.textContent = 'Resend code';
  }
}

// ── Login ─────────────────────────────────────────────────────
async function doLogin() {
  hideAlert('login-error');
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) return showAlert('login-error', 'Please fill in all fields.');
  setLoading('login-btn', true);
  try {
    const res = await fetch('/api/users/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || data.non_field_errors?.[0] || 'Invalid credentials');
    localStorage.setItem('access_token',  data.access);
    localStorage.setItem('refresh_token', data.refresh);
    window.location.href = '/dashboard.html';
  } catch (e) {
    showAlert('login-error', e.message);
  } finally {
    setLoading('login-btn', false);
  }
}

// ── Enter key support ─────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const loginActive = document.getElementById('panel-login').classList.contains('active');
  if (loginActive) { doLogin(); return; }
  const step1Active = document.getElementById('register-step-1').classList.contains('active');
  if (step1Active) doRequestCode();
  else doConfirmCode();
});
