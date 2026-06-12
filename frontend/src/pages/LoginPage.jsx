import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { authApi } from '../api/client'
import styles from './LoginPage.module.css'

const TABS = ['login', 'register']

export default function LoginPage() {
  const { saveAuth } = useAuth()
  const [tab, setTab] = useState('login')

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  // Register state
  const [step, setStep] = useState(1) // 1 = send code, 2 = fill form
  const [regEmail, setRegEmail] = useState('')
  const [regCode, setRegCode] = useState('')
  const [regPass, setRegPass] = useState('')
  const [regFirst, setRegFirst] = useState('')
  const [regLast, setRegLast] = useState('')
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState('')
  const [codeSent, setCodeSent] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    try {
      const { data } = await authApi.login(loginEmail, loginPass)
      saveAuth(data)
    } catch (err) {
      setLoginError(err.response?.data?.detail || 'Неверный email или пароль')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleSendCode = async (e) => {
    e.preventDefault()
    setRegError('')
    setRegLoading(true)
    try {
      await authApi.sendEmailCode(regEmail)
      setCodeSent(true)
      setStep(2)
    } catch (err) {
      setRegError(err.response?.data?.email?.[0] || 'Ошибка при отправке кода')
    } finally {
      setRegLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setRegError('')
    setRegLoading(true)
    try {
      const { data } = await authApi.register({
        email: regEmail,
        code: regCode,
        password: regPass,
        first_name: regFirst,
        last_name: regLast,
      })
      saveAuth(data)
    } catch (err) {
      const d = err.response?.data
      setRegError(d?.error || d?.code?.[0] || d?.detail || 'Ошибка регистрации')
    } finally {
      setRegLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const { data } = await authApi.getGoogleUrl()
      window.location.href = data.uri
    } catch {
      setLoginError('Не удалось получить ссылку Google')
    }
  }

  return (
    <div className={styles.page}>
      {/* Left brand panel */}
      <div className={styles.brand}>
        <div className={styles.brandContent}>
          <div className={styles.logo}>
            <span className={styles.logoMark}>T</span>
            <span className={styles.logoText}>TaskFlow</span>
          </div>
          <h1 className={styles.tagline}>
            Управляй задачами.<br />
            <em>Не теряй фокус.</em>
          </h1>
          <p className={styles.sub}>
            Проекты, задачи, Kanban — в одном месте.
          </p>
          <div className={styles.features}>
            {['Kanban-доска', 'Проекты', 'Командная работа', 'JWT + Google'].map(f => (
              <div key={f} className={styles.feature}>
                <span className={styles.featureDot} />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className={styles.formPanel}>
        <div className={styles.card}>
          {/* Tabs */}
          <div className={styles.tabs}>
            {TABS.map(t => (
              <button
                key={t}
                className={`${styles.tab} ${tab === t ? styles.active : ''}`}
                onClick={() => { setTab(t); setRegError(''); setLoginError(''); setStep(1); }}
              >
                {t === 'login' ? 'Вход' : 'Регистрация'}
              </button>
            ))}
          </div>

          {/* Login */}
          {tab === 'login' && (
            <form className={styles.form} onSubmit={handleLogin} noValidate>
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <input
                  className={styles.input}
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Пароль</label>
                <input
                  className={styles.input}
                  type="password"
                  placeholder="••••••••"
                  value={loginPass}
                  onChange={e => setLoginPass(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              {loginError && <p className={styles.error}>{loginError}</p>}
              <button className={styles.btn} type="submit" disabled={loginLoading}>
                {loginLoading ? <Spinner /> : 'Войти'}
              </button>
              <div className={styles.divider}><span>или</span></div>
              <button type="button" className={styles.googleBtn} onClick={handleGoogleLogin}>
                <GoogleIcon />
                Войти через Google
              </button>
            </form>
          )}

          {/* Register */}
          {tab === 'register' && (
            <form className={styles.form} onSubmit={step === 1 ? handleSendCode : handleRegister} noValidate>
              {step === 1 && (
                <>
                  <div className={styles.field}>
                    <label className={styles.label}>Email</label>
                    <input
                      className={styles.input}
                      type="email"
                      placeholder="you@example.com"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      required
                    />
                  </div>
                  {regError && <p className={styles.error}>{regError}</p>}
                  <button className={styles.btn} type="submit" disabled={regLoading}>
                    {regLoading ? <Spinner /> : 'Получить код'}
                  </button>
                </>
              )}
              {step === 2 && (
                <>
                  <p className={styles.hint}>Код отправлен на <strong>{regEmail}</strong></p>
                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.label}>Имя</label>
                      <input className={styles.input} placeholder="Иван" value={regFirst} onChange={e => setRegFirst(e.target.value)} />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Фамилия</label>
                      <input className={styles.input} placeholder="Иванов" value={regLast} onChange={e => setRegLast(e.target.value)} />
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Код из письма</label>
                    <input
                      className={styles.input}
                      placeholder="123456"
                      value={regCode}
                      onChange={e => setRegCode(e.target.value)}
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Пароль</label>
                    <input
                      className={styles.input}
                      type="password"
                      placeholder="••••••••"
                      value={regPass}
                      onChange={e => setRegPass(e.target.value)}
                      required
                    />
                  </div>
                  {regError && <p className={styles.error}>{regError}</p>}
                  <button className={styles.btn} type="submit" disabled={regLoading}>
                    {regLoading ? <Spinner /> : 'Создать аккаунт'}
                  </button>
                  <button type="button" className={styles.linkBtn} onClick={() => setStep(1)}>← Назад</button>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

function Spinner() {
  return <span className="spinner" style={{
    display: 'inline-block', width: 16, height: 16,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  }} />
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: 8 }}>
      <path fill="#EA4335" d="M24 9.5c3.1 0 5.9 1.1 8.1 2.9l6-6C34.4 3.1 29.5 1 24 1 14.8 1 7 6.7 3.7 14.7l7 5.4C12.5 13.6 17.8 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.9 7.2l7.6 5.9c4.4-4.1 7.1-10.1 7.1-17.1z"/>
      <path fill="#FBBC05" d="M10.7 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.7-4.6l-7-5.4A23 23 0 0 0 1 24c0 3.7.9 7.2 2.7 10.3l7-5.7z"/>
      <path fill="#34A853" d="M24 47c5.4 0 9.9-1.8 13.2-4.8l-7.6-5.9c-1.8 1.2-4.1 2-5.6 2-6.1 0-11.4-4.1-13.3-9.7l-7 5.7C7 42.3 14.8 47 24 47z"/>
    </svg>
  )
}
