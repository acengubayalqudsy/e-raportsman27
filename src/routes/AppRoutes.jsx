import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../auth/ProtectedRoute.jsx'
import PublicOnlyRoute from '../auth/PublicOnlyRoute.jsx'
import { useAuth } from '../auth/AuthContext.jsx'
import AppLayout from '../components/layout/AppLayout.jsx'
import Absensi from '../pages/Absensi/Absensi.jsx'
import Akademik from '../pages/Akademik/Akademik.jsx'
import Dashboard from '../pages/Dashboard/Dashboard.jsx'
import JurnalMengajar from '../pages/JurnalMengajar/JurnalMengajar.jsx'
import KegiatanSiswa from '../pages/KegiatanSiswa/KegiatanSiswa.jsx'
import Laporan from '../pages/Laporan/Laporan.jsx'
import MasterData from '../pages/MasterData/MasterData.jsx'
import Pengaturan from '../pages/Pengaturan/Pengaturan.jsx'
import Penilaian from '../pages/Penilaian/Penilaian.jsx'
import RaporLeger from '../pages/RaporLeger/RaporLeger.jsx'
import AuthPage from '../pages/Auth/AuthPage.jsx'

function AppEntry() {
  const { isAuthenticated, isAuthLoading } = useAuth()

  if (isAuthLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#0284c7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>Memuat aplikasi...</p>
        </div>
      </div>
    )
  }

  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AppEntry />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/master-data" element={<Navigate to="/master-data/siswa" replace />} />
        <Route path="/master-data/siswa" element={<MasterData />} />
        <Route path="/master-data/guru" element={<MasterData />} />
        <Route path="/master-data/kelas" element={<MasterData />} />
        <Route path="/master-data/ruangan" element={<MasterData />} />
        <Route path="/master-data/mata-pelajaran" element={<MasterData />} />
        <Route path="/master-data/tahun-ajaran" element={<MasterData />} />
        <Route path="/master-data/semester" element={<MasterData />} />
        <Route path="/master-data/agama" element={<MasterData />} />
        <Route path="/master-data/ekstrakurikuler" element={<MasterData />} />
        <Route path="/master-data/pengguna-role" element={<MasterData />} />
        <Route path="/master-data/wali-kelas" element={<Navigate to="/master-data/guru" replace />} />
        <Route path="/akademik" element={<Navigate to="/akademik/jadwal-pelajaran" replace />} />
        <Route path="/akademik/rombongan-belajar" element={<Akademik />} />
        <Route path="/akademik/penugasan-guru" element={<Akademik />} />
        <Route path="/akademik/penugasan-wali-kelas" element={<Akademik />} />
        <Route path="/akademik/jadwal-pelajaran" element={<Akademik />} />
        <Route path="/akademik/pembagian-ruangan" element={<Akademik />} />
        <Route path="/akademik/jadwal" element={<Navigate to="/akademik/jadwal-pelajaran" replace />} />
        <Route path="/penilaian" element={<Navigate to="/penilaian/input-nilai" replace />} />
        <Route path="/penilaian/input-nilai" element={<Penilaian />} />
        <Route path="/penilaian/nilai-per-mapel" element={<Penilaian />} />
        <Route path="/penilaian/nilai-sikap" element={<Penilaian />} />
        <Route path="/penilaian/capaian-kompetensi" element={<Penilaian />} />
        <Route path="/penilaian/rekap-nilai-per-kelas" element={<Penilaian />} />
        <Route path="/penilaian/validasi-nilai" element={<Penilaian />} />
        <Route path="/rapor-leger" element={<Navigate to="/rapor-leger/daftar-rapor" replace />} />
        <Route path="/rapor-leger/daftar-rapor" element={<RaporLeger />} />
        <Route path="/rapor-leger/generate-rapor" element={<RaporLeger />} />
        <Route path="/rapor-leger/rapor-per-siswa" element={<RaporLeger />} />
        <Route path="/rapor-leger/leger-nilai" element={<RaporLeger />} />
        <Route path="/rapor-leger/leger-deskripsi" element={<RaporLeger />} />
        <Route path="/rapor-leger/peringkat-kelas" element={<RaporLeger />} />
        <Route path="/rapor-leger/cover-rapor" element={<RaporLeger />} />
        <Route path="/rapor-leger/cetak-export" element={<RaporLeger />} />
        <Route path="/kegiatan-siswa" element={<Navigate to="/kegiatan-siswa/keikutsertaan-ekstrakurikuler" replace />} />
        <Route path="/kegiatan-siswa/keikutsertaan-ekstrakurikuler" element={<KegiatanSiswa />} />
        <Route path="/kegiatan-siswa/nilai-ekstrakurikuler" element={<KegiatanSiswa />} />
        <Route path="/kegiatan-siswa/catatan-kokurikuler" element={<KegiatanSiswa />} />
        <Route path="/kegiatan-siswa/catatan-wali-kelas" element={<KegiatanSiswa />} />
        <Route path="/kegiatan-siswa/ekstrakurikuler" element={<Navigate to="/kegiatan-siswa/keikutsertaan-ekstrakurikuler" replace />} />
        <Route path="/absensi" element={<Navigate to="/absensi/rekap" replace />} />
        <Route path="/absensi/rekap" element={<Absensi />} />
        <Route path="/absensi/per-siswa" element={<Absensi />} />
        <Route path="/absensi/per-kelas" element={<Absensi />} />
        <Route path="/absensi/per-mapel" element={<Absensi />} />
        <Route path="/jurnal-mengajar" element={<Navigate to="/jurnal-mengajar/jurnal" replace />} />
        <Route path="/jurnal-mengajar/jurnal" element={<JurnalMengajar />} />
        <Route path="/jurnal-mengajar/materi" element={<JurnalMengajar />} />
        <Route path="/jurnal-mengajar/aktivitas-kelas" element={<JurnalMengajar />} />
        <Route path="/jurnal-mengajar/catatan" element={<JurnalMengajar />} />
        <Route path="/laporan" element={<Laporan />} />
        <Route path="/laporan/nilai" element={<Laporan />} />
        <Route path="/laporan/absensi" element={<Laporan />} />
        <Route path="/laporan/ekstrakurikuler" element={<Laporan />} />
        <Route path="/laporan/kokurikuler" element={<Laporan />} />
        <Route path="/laporan/per-kelas" element={<Laporan />} />
        <Route path="/laporan/per-siswa" element={<Laporan />} />
        <Route path="/laporan/rekapitulasi-rapor" element={<Laporan />} />
        <Route path="/pengaturan" element={<Navigate to="/pengaturan/identitas-sekolah" replace />} />
        <Route path="/pengaturan/identitas-sekolah" element={<Pengaturan />} />
        <Route path="/pengaturan/akademik" element={<Pengaturan />} />
        <Route path="/pengaturan/rapor" element={<Pengaturan />} />
        <Route path="/pengaturan/sistem" element={<Pengaturan />} />
        <Route path="/pengaturan/backup-restore" element={<Pengaturan />} />
        <Route path="/pengaturan/log-aktivitas" element={<Pengaturan />} />
        </Route>
      </Route>

      <Route path="*" element={<AppEntry />} />
    </Routes>
  )
}

export default AppRoutes
