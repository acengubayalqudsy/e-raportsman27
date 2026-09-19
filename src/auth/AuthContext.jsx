/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

const LOCAL_AUTH_KEY = 'eraport_mock_authenticated'
const SESSION_AUTH_KEY = 'eraport_mock_session_authenticated'
const MOCK_DELAY = 450

const mockAdministrator = {
  id: 'mock-administrator',
  name: 'Administrator',
  email: 'admin@sman27garut.sch.id',
  nip: '196805121993031006',
  password: 'mock-password',
  role: 'Super Admin',
}

const AuthContext = createContext(null)

function readAuthenticationFlag() {
  try {
    return localStorage.getItem(LOCAL_AUTH_KEY) === 'true' || sessionStorage.getItem(SESSION_AUTH_KEY) === 'true'
  } catch {
    return false
  }
}

function storeAuthenticationFlag(rememberMe) {
  try {
    if (rememberMe) {
      localStorage.setItem(LOCAL_AUTH_KEY, 'true')
      sessionStorage.removeItem(SESSION_AUTH_KEY)
      return
    }

    sessionStorage.setItem(SESSION_AUTH_KEY, 'true')
    localStorage.removeItem(LOCAL_AUTH_KEY)
  } catch {
    // State React tetap menjadi sumber kebenaran saat Web Storage tidak tersedia.
  }
}

function clearAuthenticationFlags() {
  try {
    localStorage.removeItem(LOCAL_AUTH_KEY)
    sessionStorage.removeItem(SESSION_AUTH_KEY)
  } catch {
    // Tidak ada tindakan tambahan yang diperlukan untuk mock frontend.
  }
}

function waitForMockResponse() {
  return new Promise((resolve) => window.setTimeout(resolve, MOCK_DELAY))
}

function toPublicUser(account) {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    nip: account.nip || '',
    role: account.role,
  }
}

function normalizeIdentifier(value) {
  return String(value || '').trim().toLowerCase()
}

function AuthProvider({ children }) {
  const initiallyAuthenticated = useMemo(() => readAuthenticationFlag(), [])
  const [isAuthenticated, setIsAuthenticated] = useState(initiallyAuthenticated)
  const [currentUser, setCurrentUser] = useState(
    initiallyAuthenticated ? toPublicUser(mockAdministrator) : null,
  )
  const registeredAccountsRef = useRef([])

  const login = useCallback(async ({ identifier, email, nip, password, rememberMe = false } = {}) => {
    await waitForMockResponse()

    const loginIdentifier = normalizeIdentifier(identifier || email || nip)
    const accountPool = [mockAdministrator, ...registeredAccountsRef.current]
    const matchingAccount = accountPool.find((account) => {
      const matchesEmail = normalizeIdentifier(account.email) === loginIdentifier
      const matchesNip = account.nip && normalizeIdentifier(account.nip) === loginIdentifier
      return matchesEmail || matchesNip
    })

    if (!matchingAccount || matchingAccount.password !== password) {
      return {
        success: false,
        message: 'Email atau kata sandi tidak sesuai. Silakan periksa kembali data Anda.',
      }
    }

    const authenticatedUser = toPublicUser(matchingAccount)
    storeAuthenticationFlag(rememberMe)
    setCurrentUser(authenticatedUser)
    setIsAuthenticated(true)

    return { success: true, user: authenticatedUser }
  }, [])

  const register = useCallback(async ({ name, fullName, email, nip = '', password } = {}) => {
    await waitForMockResponse()

    const normalizedEmail = normalizeIdentifier(email)
    const normalizedNip = String(nip || '').trim()
    const accountPool = [mockAdministrator, ...registeredAccountsRef.current]
    const isDuplicate = accountPool.some((account) => {
      const emailExists = normalizeIdentifier(account.email) === normalizedEmail
      const nipExists = normalizedNip && String(account.nip || '').trim() === normalizedNip
      return emailExists || nipExists
    })

    if (!normalizedEmail || !password) {
      return { success: false, message: 'Email dan kata sandi wajib diisi.' }
    }

    if (isDuplicate) {
      return { success: false, message: 'Akun dengan email atau NIP tersebut sudah tersedia.' }
    }

    const account = {
      id: `mock-user-${Date.now()}`,
      name: String(fullName || name || 'Pengguna e-Raport').trim(),
      email: normalizedEmail,
      nip: normalizedNip,
      password,
      role: 'Pengguna',
    }

    registeredAccountsRef.current.push(account)

    return {
      success: true,
      message: 'Akun mock berhasil dibuat. Silakan masuk menggunakan akun tersebut.',
      user: toPublicUser(account),
    }
  }, [])

  const forgotPassword = useCallback(async (email) => {
    await waitForMockResponse()

    if (!normalizeIdentifier(email)) {
      return { success: false, message: 'Email wajib diisi.' }
    }

    return {
      success: true,
      message: 'Instruksi pemulihan mock telah disiapkan. Integrasi email akan tersedia bersama backend.',
    }
  }, [])

  const logout = useCallback(() => {
    clearAuthenticationFlags()
    setCurrentUser(null)
    setIsAuthenticated(false)
  }, [])

  const value = useMemo(
    () => ({
      isAuthenticated,
      user: currentUser,
      login,
      register,
      forgotPassword,
      logout,
    }),
    [currentUser, forgotPassword, isAuthenticated, login, logout, register],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider.')
  }

  return context
}

export { AuthProvider, useAuth }
