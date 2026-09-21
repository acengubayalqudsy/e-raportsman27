export const ROLES = {
  admin: 'admin',
  teacher: 'guru',
  homeroom: 'walikelas',
  student: 'siswa',
  principal: 'kepala_sekolah',
}

export const MODULE_ROLES = {
  dashboard: Object.values(ROLES),
  'master-data': [ROLES.admin],
  akademik: [ROLES.admin],
  penilaian: [ROLES.admin, ROLES.teacher],
  'rapor-leger': [ROLES.admin, ROLES.homeroom, ROLES.principal],
  'kegiatan-siswa': [ROLES.admin, ROLES.homeroom],
  absensi: [ROLES.admin, ROLES.teacher, ROLES.homeroom],
  'jurnal-mengajar': [ROLES.admin, ROLES.teacher],
  laporan: [ROLES.admin, ROLES.homeroom, ROLES.principal],
  pengaturan: [ROLES.admin],
}

export function canAccessModule(roles = [], moduleKey) {
  const allowed = MODULE_ROLES[moduleKey] || []
  return roles.some((role) => allowed.includes(typeof role === 'string' ? role : role.name))
}

export function moduleFromPath(pathname) {
  if (pathname === '/' || pathname.startsWith('/dashboard')) return 'dashboard'
  return pathname.split('/').filter(Boolean)[0] || 'dashboard'
}
