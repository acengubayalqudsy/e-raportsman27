export const ROLES = {
  admin: 'admin',
  teacher: 'guru',
  homeroom: 'walikelas',
  student: 'siswa',
  principal: 'kepala_sekolah',
}

export const MODULE_ROLES = {
  dashboard: Object.values(ROLES),
  jelajah: Object.values(ROLES),
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

export function hasRole(roles = [], roleName) {
  return roles.some((role) => (typeof role === 'string' ? role : role.name) === roleName)
}

export function getPrimaryRole(roles = []) {
  if (hasRole(roles, ROLES.admin)) return ROLES.admin
  if (hasRole(roles, ROLES.teacher)) return ROLES.teacher
  if (hasRole(roles, ROLES.homeroom)) return ROLES.homeroom
  if (hasRole(roles, ROLES.principal)) return ROLES.principal
  if (hasRole(roles, ROLES.student)) return ROLES.student
  return ROLES.admin
}

export function moduleFromPath(pathname) {
  if (pathname === '/' || pathname.startsWith('/dashboard')) return 'dashboard'
  return pathname.split('/').filter(Boolean)[0] || 'dashboard'
}
