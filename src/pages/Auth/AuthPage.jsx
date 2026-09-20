import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.jsx'
import Icon from '../../components/common/Icon.jsx'
import schoolLogo from '../../assets/logo/sman-27-garut-logo.png'
import heroIllustration from '../../assets/hero.png'
import './Auth.css'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const nipPattern = /^\d{8,20}$/

const featureItems = [
  {
    icon: 'clipboardCheck',
    title: 'Kelola Penilaian',
    description: 'Kelola penilaian siswa secara mudah dan akurat.',
  },
  {
    icon: 'academic',
    title: 'Data Akademik',
    description: 'Kelola data akademik terintegrasi dan terstruktur.',
  },
  {
    icon: 'cloud',
    title: 'Akses Mudah',
    description: 'Akses kapan saja, di mana saja dengan aman.',
  },
]

const statisticItems = [
  { icon: 'users', value: '87', label: 'Guru' },
  { icon: 'users', value: '1.248', label: 'Siswa' },
  { icon: 'building', value: '36', label: 'Kelas' },
]

function BrandPanel() {
  return (
    <section className="auth-brand-panel" aria-label="Informasi e-Raport SMAN 27 Garut">
      <div className="auth-dot-pattern" aria-hidden="true" />

      <div className="auth-brand-content">
        <header className="auth-school-brand">
          <img src={schoolLogo} alt="Logo SMAN 27 Garut" />
          <div>
            <p><span>e-Raport</span> SMAN 27 Garut</p>
            <small>Sistem Informasi Akademik Terpadu</small>
          </div>
        </header>

        <div className="auth-welcome-copy">
          <h1>
            Selamat Datang di
            <span>e-Raport</span>
          </h1>
          <p>
            Sistem pelaporan akademik modern untuk mendukung kinerja guru dan tenaga
            kependidikan.
          </p>
        </div>

        <div className="auth-illustration" aria-hidden="true">
          <span className="auth-floating-icon auth-floating-calendar">
            <Icon name="calendar" />
          </span>
          <span className="auth-floating-icon auth-floating-checklist">
            <Icon name="clipboardCheck" />
          </span>
          <span className="auth-floating-icon auth-floating-users">
            <Icon name="users" />
          </span>
          <span className="auth-floating-icon auth-floating-trend">
            <Icon name="trend" />
          </span>
          <div className="auth-school-silhouette" />
          <img src={heroIllustration} alt="" />
        </div>

        <div className="auth-feature-grid">
          {featureItems.map((item) => (
            <article className="auth-feature-card" key={item.title}>
              <span className="auth-feature-icon"><Icon name={item.icon} /></span>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </article>
          ))}
        </div>

        <div className="auth-statistics" aria-label="Statistik sekolah">
          {statisticItems.map((item) => (
            <div className="auth-statistic" key={item.label}>
              <span><Icon name={item.icon} /></span>
              <div>
                <strong>{item.value}</strong>
                <small>{item.label}</small>
              </div>
            </div>
          ))}
        </div>

        <footer className="auth-brand-footer">
          <span>{'\u00a9'} 2025 SMAN 27 Garut</span>
          <i aria-hidden="true" />
          <span>e-Raport v1.0.0</span>
        </footer>
      </div>
    </section>
  )
}

function AuthTabs({ mode }) {
  return (
    <nav className="auth-tabs" aria-label="Navigasi autentikasi">
      <Link
        className={`auth-tab ${mode === 'login' || mode === 'forgot' ? 'active' : ''}`}
        to="/login"
        aria-current={mode === 'login' || mode === 'forgot' ? 'page' : undefined}
      >
        <Icon name="login" />
        <span>Masuk</span>
      </Link>
      <Link
        className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
        to="/register"
        aria-current={mode === 'register' ? 'page' : undefined}
      >
        <Icon name="userPlus" />
        <span>Daftar Akun</span>
      </Link>
    </nav>
  )
}

function FieldError({ id, children }) {
  if (!children) return null

  return (
    <span className="auth-field-error" id={id} role="alert">
      {children}
    </span>
  )
}

function TextField({
  autoComplete,
  error,
  icon,
  id,
  label,
  name,
  onChange,
  placeholder,
  type = 'text',
  value,
}) {
  const errorId = `${id}-error`

  return (
    <div className={`auth-field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="auth-input-wrap">
        <Icon name={icon} />
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
      </div>
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  )
}

function PasswordField({
  autoComplete,
  error,
  id,
  label,
  name,
  onChange,
  placeholder,
  value,
}) {
  const [visible, setVisible] = useState(false)
  const errorId = `${id}-error`

  return (
    <div className={`auth-field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="auth-input-wrap auth-password-wrap">
        <Icon name="lock" />
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
        <button
          className={`auth-password-toggle ${visible ? 'visible' : ''}`}
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          aria-pressed={visible}
        >
          <Icon name="eye" />
        </button>
      </div>
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  )
}

function LoginForm({ login, navigate, routeNotice }) {
  const [form, setForm] = useState({ identifier: '', password: '', rememberMe: true })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [feedback, setFeedback] = useState(routeNotice || '')
  const [isLoading, setIsLoading] = useState(false)

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setFormError('')
  }

  const validate = () => {
    const nextErrors = {}
    const identifier = form.identifier.trim()

    if (!identifier) {
      nextErrors.identifier = 'Email, Username, atau NIP wajib diisi.'
    } else if (!emailPattern.test(identifier) && !nipPattern.test(identifier) && identifier.length < 3) {
      nextErrors.identifier = 'Masukkan minimal 3 karakter.'
    }

    if (!form.password) nextErrors.password = 'Kata sandi wajib diisi.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFeedback('')
    setFormError('')

    if (!validate()) return

    setIsLoading(true)
    try {
      const result = await login({
        identifier: form.identifier.trim(),
        password: form.password,
        rememberMe: form.rememberMe,
      })

      if (result === false || result?.success === false) {
        setFormError(result?.message || 'Email atau kata sandi tidak sesuai. Silakan periksa kembali data Anda.')
        return
      }

      navigate('/dashboard', { replace: true })
    } catch {
      setFormError('Tidak dapat terhubung ke server backend. Pastikan server aktif.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {feedback ? (
        <div className="auth-inline-message success" role="status">
          <Icon name="checkCircle" />
          <span>{feedback}</span>
        </div>
      ) : null}

      {formError ? (
        <div className="auth-inline-message error" role="alert">
          <Icon name="info" />
          <span>{formError}</span>
        </div>
      ) : null}

      <TextField
        id="auth-identifier"
        name="identifier"
        label="EMAIL / USERNAME / NIP"
        icon="mail"
        value={form.identifier}
        onChange={updateField}
        error={errors.identifier}
        placeholder="Masukkan email, username, atau NIP"
        autoComplete="username"
      />

      <PasswordField
        id="auth-password"
        name="password"
        label="KATA SANDI"
        value={form.password}
        onChange={updateField}
        error={errors.password}
        placeholder="Masukkan kata sandi"
        autoComplete="current-password"
      />

      <div className="auth-form-options">
        <label className="auth-remember-option">
          <input
            type="checkbox"
            checked={form.rememberMe}
            onChange={(event) => setForm((current) => ({
              ...current,
              rememberMe: event.target.checked,
            }))}
          />
          <span className="auth-checkbox-mark"><Icon name="check" /></span>
          <span>Ingat saya</span>
        </label>
        <Link to="/forgot-password">Lupa kata sandi?</Link>
      </div>

      <button className="auth-primary-button" type="submit" disabled={isLoading}>
        {isLoading ? 'Memproses...' : 'Masuk'}
      </button>

      <div className="auth-divider"><span>atau</span></div>

      <button
        className="auth-google-button"
        type="button"
        onClick={() => {
          setFormError('')
          setFeedback('Integrasi Google akan tersedia pada tahap autentikasi backend.')
        }}
      >
        <span className="auth-google-mark" aria-hidden="true">G</span>
        <span>Masuk dengan Google</span>
      </button>

      <p className="auth-switch-prompt">
        Belum memiliki akun? <Link to="/register">Daftar sekarang</Link>
      </p>
    </form>
  )
}

function RegisterForm({ register, navigate }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setFormError('')
  }

  const validate = () => {
    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'Nama lengkap wajib diisi.'
    if (!form.email.trim()) nextErrors.email = 'Email wajib diisi.'
    else if (!emailPattern.test(form.email.trim())) nextErrors.email = 'Masukkan alamat email yang valid.'
    if (!form.password) nextErrors.password = 'Kata sandi wajib diisi.'
    else if (form.password.length < 8) nextErrors.password = 'Gunakan minimal 8 karakter.'
    if (!form.confirmPassword) nextErrors.confirmPassword = 'Konfirmasi kata sandi wajib diisi.'
    else if (form.confirmPassword !== form.password) nextErrors.confirmPassword = 'Konfirmasi kata sandi belum sama.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')
    if (!validate()) return

    setIsLoading(true)
    try {
      const result = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      })

      if (result === false || result?.success === false) {
        setFormError(result?.message || 'Pendaftaran belum berhasil. Silakan periksa kembali data Anda.')
        return
      }

      navigate('/login', {
        replace: true,
        state: { authNotice: 'Akun berhasil dibuat. Silakan masuk menggunakan akun Anda.' },
      })
    } catch {
      setFormError('Pendaftaran belum berhasil. Silakan periksa kembali data Anda.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className="auth-form auth-register-form" onSubmit={handleSubmit} noValidate>
      {formError ? (
        <div className="auth-inline-message error" role="alert">
          <Icon name="info" />
          <span>{formError}</span>
        </div>
      ) : null}

      <TextField
        id="auth-register-name"
        name="name"
        label="NAMA LENGKAP"
        icon="user"
        value={form.name}
        onChange={updateField}
        error={errors.name}
        placeholder="Masukkan nama lengkap"
        autoComplete="name"
      />
      <TextField
        id="auth-register-email"
        name="email"
        type="email"
        label="EMAIL"
        icon="mail"
        value={form.email}
        onChange={updateField}
        error={errors.email}
        placeholder="Masukkan alamat email"
        autoComplete="email"
      />
      <PasswordField
        id="auth-register-password"
        name="password"
        label="KATA SANDI"
        value={form.password}
        onChange={updateField}
        error={errors.password}
        placeholder="Minimal 8 karakter"
        autoComplete="new-password"
      />
      <PasswordField
        id="auth-register-confirm-password"
        name="confirmPassword"
        label="KONFIRMASI KATA SANDI"
        value={form.confirmPassword}
        onChange={updateField}
        error={errors.confirmPassword}
        placeholder="Ulangi kata sandi"
        autoComplete="new-password"
      />

      <button className="auth-primary-button" type="submit" disabled={isLoading}>
        {isLoading ? 'Memproses...' : 'Daftar Akun'}
      </button>

      <p className="auth-switch-prompt">
        Sudah memiliki akun? <Link to="/login">Masuk sekarang</Link>
      </p>
    </form>
  )
}

function ForgotPasswordForm({ forgotPassword }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFeedback('')
    if (!email.trim()) {
      setError('Email wajib diisi.')
      return
    }
    if (!emailPattern.test(email.trim())) {
      setError('Masukkan alamat email yang valid.')
      return
    }

    setError('')
    setIsLoading(true)
    try {
      const result = await forgotPassword(email.trim())
      if (result === false || result?.success === false) {
        setError(result?.message || 'Permintaan pemulihan belum dapat diproses.')
        return
      }
      setFeedback(result?.message || 'Simulasi berhasil. Tautan pemulihan akan tersedia setelah integrasi backend.')
    } catch {
      setError('Permintaan pemulihan belum dapat diproses.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className="auth-form auth-forgot-form" onSubmit={handleSubmit} noValidate>
      {feedback ? (
        <div className="auth-inline-message success" role="status">
          <Icon name="checkCircle" />
          <span>{feedback}</span>
        </div>
      ) : null}

      <TextField
        id="auth-forgot-email"
        name="email"
        type="email"
        label="EMAIL"
        icon="mail"
        value={email}
        onChange={(event) => {
          setEmail(event.target.value)
          setError('')
        }}
        error={error}
        placeholder="Masukkan alamat email"
        autoComplete="email"
      />

      <button className="auth-primary-button" type="submit" disabled={isLoading}>
        {isLoading ? 'Memproses...' : 'Kirim Tautan Pemulihan'}
      </button>

      <p className="auth-switch-prompt">
        Sudah ingat kata sandi? <Link to="/login">Kembali ke halaman masuk</Link>
      </p>
    </form>
  )
}

const modeContent = {
  login: {
    icon: 'academic',
    title: 'Masuk ke Akun',
    description: 'Gunakan akun email yang terdaftar untuk mengakses aplikasi e-Raport SMAN 27 Garut.',
  },
  register: {
    icon: 'userPlus',
    title: 'Daftar Akun',
    description: 'Buat akun menggunakan email untuk mulai mengakses layanan e-Raport sekolah.',
  },
  forgot: {
    icon: 'lock',
    title: 'Lupa Kata Sandi',
    description: 'Masukkan email akun Anda untuk menyimulasikan proses pemulihan kata sandi.',
  },
}

function AuthPage({ mode = 'login' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { forgotPassword, isAuthenticated, isAuthLoading, login, register } = useAuth()
  const currentMode = modeContent[mode] ? mode : 'login'
  const content = modeContent[currentMode]
  const routeNotice = currentMode === 'login' ? location.state?.authNotice : ''

  if (isAuthLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#0284c7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>Memuat halaman...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <main className={`auth-page auth-mode-${currentMode}`}>
      <BrandPanel />

      <section className="auth-content-panel" aria-label="Autentikasi akun">
        <div className="auth-content-inner">
          <AuthTabs mode={currentMode} />

          <div className="auth-card">
            <header className="auth-card-header">
              <span className="auth-card-icon"><Icon name={content.icon} /></span>
              <h2>{content.title}</h2>
              <p>{content.description}</p>
            </header>

            {currentMode === 'login' ? (
              <LoginForm login={login} navigate={navigate} routeNotice={routeNotice} />
            ) : null}
            {currentMode === 'register' ? (
              <RegisterForm register={register} navigate={navigate} />
            ) : null}
            {currentMode === 'forgot' ? <ForgotPasswordForm forgotPassword={forgotPassword} /> : null}
          </div>

          <div className="auth-security-note">
            <Icon name="shield" />
            <p>
              Gunakan akun Anda secara pribadi dan jangan membagikan kata sandi kepada pihak lain.
            </p>
          </div>

          <footer className="auth-mobile-footer">
            {'\u00a9'} 2025 SMAN 27 Garut <span>{'\u2022'}</span> e-Raport v1.0.0
          </footer>
        </div>
      </section>
    </main>
  )
}

export default AuthPage
