import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'
import { canAccessModule, moduleFromPath } from '../constants/roles.js'

function ProtectedRoute() {
  const { isAuthenticated, isAuthLoading, roles } = useAuth()
  const location = useLocation()

  if (isAuthLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#0284c7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>Memuat sesi aplikasi...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!canAccessModule(roles, moduleFromPath(location.pathname))) {
    return (
      <main className="route-status" role="alert">
        <h1>Akses ditolak</h1>
        <p>Anda tidak memiliki kewenangan untuk membuka halaman ini.</p>
        <Link to="/dashboard">Kembali ke Dashboard</Link>
      </main>
    )
  }

  return <Outlet />
}

export default ProtectedRoute
