/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from '../services/apiClient.js'

const AuthContext = createContext(null)

/**
 * Format user object from backend response for uniform frontend consumption
 */
function normalizeUser(userData) {
  if (!userData) return null

  const roles = userData.roles || []
  const primaryRoleObj = roles.find((r) => r.is_primary) || roles[0]
  const displayRole = primaryRoleObj?.display_name || userData.primary_role || 'Pengguna'

  return {
    id: userData.id,
    username: userData.username,
    name: userData.name,
    email: userData.email,
    phone: userData.phone || '',
    nip: userData.nip || '',
    isActive: Boolean(userData.is_active),
    roles,
    role: displayRole,
    primaryRole: userData.primary_role || primaryRoleObj?.name || 'pengguna',
  }
}

function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [authError, setAuthError] = useState(null)
  const [authorizationError, setAuthorizationError] = useState(null)

  useEffect(() => {
    const handleSessionExpired = () => {
      setCurrentUser(null)
      setIsAuthenticated(false)
      setAuthError('Sesi Anda telah berakhir. Silakan masuk kembali.')
    }
    const handleForbidden = (event) => {
      setAuthorizationError(event.detail?.message || 'Anda tidak memiliki izin untuk tindakan ini.')
    }

    window.addEventListener('auth:session-expired', handleSessionExpired)
    window.addEventListener('auth:forbidden', handleForbidden)
    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired)
      window.removeEventListener('auth:forbidden', handleForbidden)
    }
  }, [])

  /**
   * Verify session validity with backend /api/v1/auth/me
   */
  const checkAuth = useCallback(async () => {
    setIsAuthLoading(true)
    setAuthError(null)
    setAuthorizationError(null)

    try {
      const response = await authApi.me()

      if (response.success && response.data?.user) {
        const user = normalizeUser(response.data.user)
        setCurrentUser(user)
        setIsAuthenticated(true)
        return { success: true, user }
      }

      setCurrentUser(null)
      setIsAuthenticated(false)

      if (response.status === 0) {
        setAuthError(response.message)
      }

      return { success: false, status: response.status }
    } catch {
      setCurrentUser(null)
      setIsAuthenticated(false)
      setAuthError('Gagal memeriksa status autentikasi.')
      return { success: false, status: 0 }
    } finally {
      setIsAuthLoading(false)
    }
  }, [])

  // Check auth session on initial app load / refresh
  useEffect(() => {
    let isMounted = true

    authApi.me().then((response) => {
      if (!isMounted) return

      if (response.success && response.data?.user) {
        const user = normalizeUser(response.data.user)
        setCurrentUser(user)
        setIsAuthenticated(true)
      } else {
        setCurrentUser(null)
        setIsAuthenticated(false)
        if (response.status === 0) {
          setAuthError(response.message)
        }
      }
      setIsAuthLoading(false)
    }).catch(() => {
      if (!isMounted) return
      setCurrentUser(null)
      setIsAuthenticated(false)
      setAuthError('Gagal memeriksa status autentikasi.')
      setIsAuthLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [])

  /**
   * Real user login via Laravel Sanctum
   */
  const login = useCallback(async ({ identifier, password } = {}) => {
    setAuthError(null)

    if (!identifier || !password) {
      return {
        success: false,
        message: 'Identifier (Email/Username/NIP) dan kata sandi wajib diisi.',
      }
    }

    const response = await authApi.login(identifier, password)

    if (response.success && response.data?.user) {
      const user = normalizeUser(response.data.user)
      setCurrentUser(user)
      setIsAuthenticated(true)
      return {
        success: true,
        message: response.message || 'Login berhasil.',
        user,
      }
    }

    return {
      success: false,
      status: response.status,
      message: response.message || 'Kredensial yang diberikan tidak valid.',
    }
  }, [])

  /**
   * Real user logout via Laravel Sanctum
   */
  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Continue clearing local state even if network fails
    } finally {
      setCurrentUser(null)
      setIsAuthenticated(false)
      setAuthError(null)
      setAuthorizationError(null)
    }
    return { success: true }
  }, [])

  /**
   * Register placeholder (informative: self-registration disabled by school policy)
   */
  const register = useCallback(async () => {
    return {
      success: false,
      message: 'Pendaftaran akun mandiri belum diaktifkan oleh pihak sekolah. Silakan hubungi Administrator Sistem untuk pembuatan akun.',
    }
  }, [])

  /**
   * Forgot password placeholder (informative: self-recovery disabled by school policy)
   */
  const forgotPassword = useCallback(async () => {
    return {
      success: false,
      message: 'Layanan pemulihan kata sandi mandiri belum diaktifkan. Silakan hubungi Administrator atau Staf Kurikulum SMAN 27 Garut.',
    }
  }, [])

  /**
   * Helper to check if current user has a specific role by name
   */
  const hasRole = useCallback((roleName) => {
    if (!currentUser?.roles) return false
    return currentUser.roles.some((r) => r.name === roleName)
  }, [currentUser])

  const value = useMemo(
    () => ({
      isAuthenticated,
      isAuthLoading,
      user: currentUser,
      roles: currentUser?.roles || [],
      hasRole,
      login,
      logout,
      register,
      forgotPassword,
      checkAuth,
      authError,
      authorizationError,
    }),
    [
      authError,
      authorizationError,
      checkAuth,
      currentUser,
      forgotPassword,
      hasRole,
      isAuthenticated,
      isAuthLoading,
      login,
      logout,
      register,
    ],
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
