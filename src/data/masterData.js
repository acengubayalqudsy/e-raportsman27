export const masterTabs = [
  { key: 'siswa', label: 'Data Siswa', icon: 'users', route: '/master-data/siswa' },
  { key: 'guru', label: 'Data Guru', icon: 'user', route: '/master-data/guru' },
  { key: 'kelas', label: 'Data Kelas', icon: 'table', route: '/master-data/kelas' },
  { key: 'ruangan', label: 'Data Ruangan', icon: 'screen', route: '/master-data/ruangan' },
  {
    key: 'mata-pelajaran',
    label: 'Mata Pelajaran',
    icon: 'book',
    route: '/master-data/mata-pelajaran',
  },
  {
    key: 'tahun-ajaran',
    label: 'Tahun Ajaran',
    icon: 'calendar',
    route: '/master-data/tahun-ajaran',
  },
  { key: 'semester', label: 'Semester', icon: 'calendar', route: '/master-data/semester' },
  { key: 'agama', label: 'Agama', icon: 'shield', route: '/master-data/agama' },
  {
    key: 'ekstrakurikuler',
    label: 'Ekstrakurikuler',
    icon: 'award',
    route: '/master-data/ekstrakurikuler',
  },
  {
    key: 'pengguna-role',
    label: 'Pengguna & Role',
    icon: 'users',
    route: '/master-data/pengguna-role',
  },
]

const classNames = [
  'X Merdeka 1',
  'X Merdeka 2',
  'X Merdeka 3',
  'X Merdeka 4',
  'X Merdeka 5',
  'X Merdeka 6',
  'XI Merdeka 1',
  'XI Merdeka 2',
  'XI Merdeka 3',
  'XI Merdeka 4',
  'XI Merdeka 5',
  'XI Merdeka 6',
  'XII Merdeka 1',
  'XII Merdeka 2',
  'XII Merdeka 3',
  'XII Merdeka 4',
  'XII Merdeka 5',
  'XII Merdeka 6',
]

const subjectDefinitions = [
  ['PABP', 'Pendidikan Agama dan Budi Pekerti', 'Umum', 3],
  ['PPKN', 'Pendidikan Pancasila', 'Umum', 2],
  ['BIN', 'Bahasa Indonesia', 'Umum', 4],
  ['MTK', 'Matematika', 'Umum', 4],
  ['FIS', 'Fisika', 'IPA', 3],
  ['KIM', 'Kimia', 'IPA', 3],
  ['BIO', 'Biologi', 'IPA', 3],
  ['SOS', 'Sosiologi', 'IPS', 3],
  ['EKO', 'Ekonomi', 'IPS', 3],
  ['SEJ', 'Sejarah', 'Umum', 2],
  ['GEO', 'Geografi', 'IPS', 3],
  ['BIG', 'Bahasa Inggris', 'Umum', 3],
  ['PJOK', 'Pendidikan Jasmani, Olahraga, dan Kesehatan', 'Umum', 3],
  ['INF', 'Informatika', 'Umum', 3],
  ['PKWU', 'Prakarya dan Kewirausahaan', 'Umum', 2],
  ['BSU', 'Bahasa Sunda', 'Muatan Lokal', 2],
  ['SNB', 'Seni Budaya', 'Umum', 2],
  ['BK', 'Bimbingan dan Konseling', 'Layanan', 1],
]

const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des']

const referenceStudents = [
  {
    name: 'ACEP HASANUL IHWAN',
    gender: 'Laki-laki',
    birthDate: '2010-01-10',
    birth: 'Garut, 10 Jan 2010',
  },
  {
    name: 'ADAM ARDIANSYAH',
    gender: 'Laki-laki',
    birthDate: '2010-02-12',
    birth: 'Garut, 12 Feb 2010',
  },
  {
    name: 'AFIQAH NUR FAUZIAH',
    gender: 'Perempuan',
    birthDate: '2010-03-15',
    birth: 'Garut, 15 Mar 2010',
  },
  {
    name: 'AHMAD FAUZI',
    gender: 'Laki-laki',
    birthDate: '2010-04-20',
    birth: 'Garut, 20 Apr 2010',
  },
  {
    name: 'ALIF RAHMAN HAKIM',
    gender: 'Laki-laki',
    birthDate: '2010-05-22',
    birth: 'Garut, 22 Mei 2010',
  },
  {
    name: 'ANISA MAULIDA',
    gender: 'Perempuan',
    birthDate: '2010-06-17',
    birth: 'Garut, 17 Jun 2010',
  },
  {
    name: 'AZZAHRA PUTRI',
    gender: 'Perempuan',
    birthDate: '2010-07-18',
    birth: 'Garut, 18 Jul 2010',
  },
  {
    name: 'BAGAS MAULANA',
    gender: 'Laki-laki',
    birthDate: '2010-08-25',
    birth: 'Garut, 25 Agt 2010',
  },
]

const maleFirstNames = [
  'ABDAN',
  'ADITYA',
  'AGUNG',
  'AKBAR',
  'ALDI',
  'ANDIKA',
  'ARIF',
  'BAYU',
  'BIMA',
  'DANANG',
  'DEDI',
  'DIMAS',
  'FAJAR',
  'FARHAN',
  'GALIH',
  'GILANG',
  'ILHAM',
  'LUTHFI',
  'MUHAMMAD',
  'NAUFAL',
  'RAFI',
  'RANGGA',
  'RIZAL',
  'SYAHRUL',
]

const femaleFirstNames = [
  'ADELIA',
  'AINUN',
  'ALYA',
  'AMELIA',
  'AULIA',
  'CITRA',
  'DARA',
  'DEWI',
  'DINA',
  'FATHIA',
  'HANA',
  'INTAN',
  'KAMILA',
  'LAILA',
  'MELATI',
  'NABILA',
  'NADIA',
  'RANIA',
  'SALMA',
  'SITI',
  'TIARA',
  'WULAN',
  'YASMIN',
  'ZAHRA',
]

const maleMiddleNames = [
  'ABDULLAH',
  'ARDIANSYAH',
  'FADHILLAH',
  'FIRDAUS',
  'GUNAWAN',
  'HAKIM',
  'HERMAWAN',
  'KURNIAWAN',
  'MAULANA',
  'PERMANA',
  'PRATAMA',
  'RAMADHAN',
  'SAPUTRA',
]

const femaleMiddleNames = [
  'AMALIA',
  'AZZAHRA',
  'KHAIRUNNISA',
  'LESTARI',
  'MAHARANI',
  'NUR AINI',
  'NURJANAH',
  'PERMATA',
  'PUTRI',
  'RAHAYU',
  'SAFITRI',
  'SALSABILA',
  'NURHALIZA',
]

const familyNames = [
  'ADININGRAT',
  'FIRMANSYAH',
  'HIDAYAT',
  'KUSNANDAR',
  'MULYADI',
  'NUGRAHA',
  'PAMUNGKAS',
  'RAMDANI',
  'SETIAWAN',
  'SURYANA',
  'WIJAYA',
  'YULIANTO',
]

function createGeneratedName(gender, ordinal) {
  const firstNames = gender === 'Perempuan' ? femaleFirstNames : maleFirstNames
  const middleNames = gender === 'Perempuan' ? femaleMiddleNames : maleMiddleNames
  const firstName = firstNames[ordinal % firstNames.length]
  const middleName = middleNames[Math.floor(ordinal / firstNames.length) % middleNames.length]
  const familyName = familyNames[Math.floor(ordinal / (firstNames.length * middleNames.length)) % familyNames.length]

  return `${firstName} ${middleName} ${familyName}`
}

function getGeneratedGender(generatedIndex) {
  const femaleBefore = Math.floor((generatedIndex * 633) / 1240)
  const femaleAfter = Math.floor(((generatedIndex + 1) * 633) / 1240)
  return femaleAfter > femaleBefore ? 'Perempuan' : 'Laki-laki'
}

function getInitials(name) {
  return name
    .replace(/,.*$/, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
}

let generatedMaleStudents = 0
let generatedFemaleStudents = 0

export const masterStudents = Array.from({ length: 1248 }, (_, index) => {
  const reference = referenceStudents[index]
  const generatedIndex = index - referenceStudents.length
  const gender = reference?.gender ?? getGeneratedGender(generatedIndex)
  const genderOrdinal =
    gender === 'Perempuan' ? generatedFemaleStudents++ : generatedMaleStudents++
  const name = reference?.name ?? createGeneratedName(gender, genderOrdinal)
  const className = reference ? 'X Merdeka 3' : classNames[generatedIndex % classNames.length]
  const grade = className.split(' ')[0]
  const birthYear = grade === 'X' ? 2010 : grade === 'XI' ? 2009 : 2008
  const birthMonth = reference ? Number(reference.birthDate.slice(5, 7)) : (index % 12) + 1
  const birthDay = reference ? Number(reference.birthDate.slice(8, 10)) : ((index * 7) % 27) + 1
  const birthDate =
    reference?.birthDate ??
    `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`
  const birth =
    reference?.birth ?? `Garut, ${String(birthDay).padStart(2, '0')} ${shortMonths[birthMonth - 1]} ${birthYear}`
  const admissionYear = birthYear + 14
  const parentSequence = String((index % 97) + 1).padStart(2, '0')

  return {
    id: index + 1,
    nis: String(252610001 + index),
    nisn: String(93864667 + index).padStart(10, '0'),
    name,
    avatar: getInitials(name),
    className,
    grade,
    studyGroup: className.replace(`${grade} `, ''),
    gender,
    genderCode: gender === 'Perempuan' ? 'P' : 'L',
    birthPlace: 'Garut',
    birthDate,
    birth,
    religion: index % 29 === 0 ? 'Kristen Protestan' : index % 47 === 0 ? 'Katolik' : 'Islam',
    familyStatus: 'Anak Kandung',
    childOrder: (index % 4) + 1,
    address: `Kp. Sukamaju RT ${String((index % 9) + 1).padStart(2, '0')}/RW ${String((index % 5) + 1).padStart(2, '0')}, Garut`,
    phone: `0812${String(30000000 + index)}`,
    previousSchool: `SMP Negeri ${(index % 12) + 1} Garut`,
    acceptedClass: `X Merdeka ${(index % 6) + 1}`,
    admissionDate: `${admissionYear}-07-15`,
    fatherName: `Bapak ${maleFirstNames[index % maleFirstNames.length]} ${familyNames[index % familyNames.length]}`,
    motherName: `Ibu ${femaleFirstNames[index % femaleFirstNames.length]} ${familyNames[(index + 3) % familyNames.length]}`,
    parentAddress: `Kp. Sukamaju RT ${String((index % 9) + 1).padStart(2, '0')}/RW ${String((index % 5) + 1).padStart(2, '0')}, Garut`,
    parentPhone: `0813${String(40000000 + index)}`,
    fatherOccupation: ['Wiraswasta', 'Petani', 'Pegawai Swasta', 'ASN'][index % 4],
    motherOccupation: ['Ibu Rumah Tangga', 'Wiraswasta', 'Guru', 'Pegawai Swasta'][index % 4],
    guardianName: index % 7 === 0 ? `Wali Siswa ${parentSequence}` : '-',
    guardianPhone: index % 7 === 0 ? `0815${String(50000000 + index)}` : '-',
    guardianAddress: index % 7 === 0 ? 'Kabupaten Garut, Jawa Barat' : '-',
    guardianOccupation: index % 7 === 0 ? 'Wiraswasta' : '-',
    status: index >= 1170 ? 'Alumni' : 'Aktif',
  }
})

const referenceTeachers = [
  ['Deden Kurnia, S.Pd.', '19800315 200501 1 002', 'Fisika', 'Laki-laki'],
  ['Rina Marlina, S.Pd.', '19820722 200604 2 001', 'Bahasa Indonesia', 'Perempuan'],
  ['Budi Santoso, M.Pd.', '19790510 200312 1 003', 'Matematika', 'Laki-laki'],
  ['Siti Nurhaliza, S.Pd.', '19870618 201001 2 004', 'Kimia', 'Perempuan'],
  ['Asep Hidayat, S.Pd.', '19810605 200604 1 005', 'Sejarah', 'Laki-laki'],
  ['Neni Herawati, S.Pd.', '19850412 201101 2 006', 'Biologi', 'Perempuan'],
  ['Yusuf Maulana, S.Pd.', '19821230 200701 1 007', 'Bahasa Inggris', 'Laki-laki'],
  ['Lilis Suryani, S.Pd.', '19890815 201402 2 008', 'Pendidikan Pancasila', 'Perempuan'],
  ['Iwan Hermawan, S.Pd.', '19770420 200212 1 009', 'PJOK', 'Laki-laki'],
  ['Tuti Alawiyah, S.Pd.', '19900110 201503 2 010', 'Ekonomi', 'Perempuan'],
]

const teacherMaleNames = [
  'Ade Hidayat',
  'Agus Kurniawan',
  'Andri Setiawan',
  'Cecep Suherman',
  'Dani Ramdani',
  'Eko Firmansyah',
  'Hendra Gunawan',
  'Jajang Nurjaman',
  'Rudi Hartono',
  'Wawan Setiawan',
  'Yana Suryana',
]

const teacherFemaleNames = [
  'Ai Nurhayati',
  'Dewi Kartika',
  'Euis Komariah',
  'Fitri Handayani',
  'Iis Aisyah',
  'Maya Lestari',
  'Nia Kurniasih',
  'Ratna Wulandari',
  'Rika Amelia',
  'Sri Mulyani',
  'Yanti Herawati',
]

function getGeneratedTeacherGender(generatedIndex) {
  const femaleBefore = Math.floor((generatedIndex * 43) / 77)
  const femaleAfter = Math.floor(((generatedIndex + 1) * 43) / 77)
  return femaleAfter > femaleBefore ? 'Perempuan' : 'Laki-laki'
}

function createTeacherName(gender, ordinal) {
  const names = gender === 'Perempuan' ? teacherFemaleNames : teacherMaleNames
  const baseName = names[ordinal % names.length]
  const familyName = familyNames[Math.floor(ordinal / names.length) % familyNames.length]
  const degree = ordinal % 5 === 0 ? 'M.Pd.' : 'S.Pd.'
  return `${baseName} ${familyName}, ${degree}`
}

function createEmailSlug(name) {
  return name
    .replace(/,.*$/, '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .trim()
    .replace(/\s+/g, '.')
}

let generatedMaleTeachers = 0
let generatedFemaleTeachers = 0

export const masterTeachers = Array.from({ length: 87 }, (_, index) => {
  const reference = referenceTeachers[index]
  const generatedIndex = index - referenceTeachers.length
  const gender = reference?.[3] ?? getGeneratedTeacherGender(generatedIndex)
  const genderOrdinal = gender === 'Perempuan' ? generatedFemaleTeachers++ : generatedMaleTeachers++
  const name = reference?.[0] ?? createTeacherName(gender, genderOrdinal)
  const subject = reference?.[2] ?? subjectDefinitions[index % subjectDefinitions.length][1]
  const employmentStatus = index < 52 ? 'ASN' : index < 70 ? 'PPPK' : 'Honorer'
  const birthYear = 1972 + (index % 23)
  const birthMonth = (index % 12) + 1
  const birthDay = ((index * 5) % 27) + 1

  return {
    id: index + 1,
    name,
    avatar: getInitials(name),
    nip:
      reference?.[1] ??
      `${birthYear}${String(birthMonth).padStart(2, '0')}${String(birthDay).padStart(2, '0')} 200${(index % 9) + 1}01 ${gender === 'Perempuan' ? '2' : '1'} ${String(index + 1).padStart(3, '0')}`,
    nuptk: String(7438201000000000 + index),
    gender,
    genderCode: gender === 'Perempuan' ? 'P' : 'L',
    birthPlace: 'Garut',
    birthDate: `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`,
    birth: `Garut, ${String(birthDay).padStart(2, '0')} ${shortMonths[birthMonth - 1]} ${birthYear}`,
    phone: `0812${String(34560000 + index)}`,
    email: `${createEmailSlug(name)}@sman27garut.sch.id`,
    address: `Kabupaten Garut, Jawa Barat`,
    employmentStatus,
    subject,
    status: index < 82 ? 'Aktif' : 'Tidak Aktif',
  }
})

export const classes = classNames.map((name, index) => {
  const [grade, , groupNumber] = name.split(' ')

  return {
    id: index + 1,
    code: `KLS-${String(index + 1).padStart(2, '0')}`,
    name,
    grade,
    studyGroup: `Merdeka ${groupNumber}`,
    capacity: 36,
    capacityLabel: '36 siswa',
    status: 'Aktif',
  }
})

export const rooms = [
  ['R101', 'Ruang 101', 'Ruang Kelas', 36, 'Lantai 1'],
  ['R102', 'Ruang 102', 'Ruang Kelas', 36, 'Lantai 1'],
  ['R103', 'Ruang 103', 'Ruang Kelas', 36, 'Lantai 1'],
  ['R201', 'Ruang 201', 'Ruang Kelas', 36, 'Lantai 2'],
  ['R202', 'Ruang 202', 'Ruang Kelas', 36, 'Lantai 2'],
  ['R203', 'Ruang 203', 'Ruang Kelas', 36, 'Lantai 2'],
  ['LAB-FIS', 'Laboratorium Fisika', 'Laboratorium', 36, 'Gedung Laboratorium'],
  ['LAB-KIM', 'Laboratorium Kimia', 'Laboratorium', 36, 'Gedung Laboratorium'],
  ['LAB-BIO', 'Laboratorium Biologi', 'Laboratorium', 36, 'Gedung Laboratorium'],
  ['LAB-KOM', 'Laboratorium Komputer', 'Laboratorium', 36, 'Lantai 2'],
  ['PERPUS', 'Perpustakaan', 'Perpustakaan', 80, 'Lantai 1'],
  ['AULA', 'Aula Sekolah', 'Aula', 250, 'Gedung Utama'],
].map(([code, name, type, capacity, location], index) => ({
  id: index + 1,
  code,
  name,
  type,
  capacity,
  location,
  status: 'Aktif',
}))

export const subjects = subjectDefinitions.map(([code, name, group, weeklyHours], index) => ({
  id: index + 1,
  code,
  name,
  group,
  grades: 'X, XI, XII',
  weeklyHours,
  hoursLabel: `${weeklyHours} JP`,
  status: 'Aktif',
}))

export const academicYears = [
  {
    id: 1,
    name: '2025/2026',
    startDate: '2025-07-14',
    startLabel: '14 Jul 2025',
    endDate: '2026-06-30',
    endLabel: '30 Jun 2026',
    status: 'Akan Datang',
  },
  {
    id: 2,
    name: '2024/2025',
    startDate: '2024-07-15',
    startLabel: '15 Jul 2024',
    endDate: '2025-06-30',
    endLabel: '30 Jun 2025',
    status: 'Aktif',
  },
  {
    id: 3,
    name: '2023/2024',
    startDate: '2023-07-17',
    startLabel: '17 Jul 2023',
    endDate: '2024-06-28',
    endLabel: '28 Jun 2024',
    status: 'Selesai',
  },
  {
    id: 4,
    name: '2022/2023',
    startDate: '2022-07-18',
    startLabel: '18 Jul 2022',
    endDate: '2023-06-30',
    endLabel: '30 Jun 2023',
    status: 'Selesai',
  },
]

export const semesters = [
  {
    id: 1,
    name: 'Genap',
    academicYear: '2024/2025',
    startDate: '2025-01-06',
    startLabel: '06 Jan 2025',
    endDate: '2025-06-30',
    endLabel: '30 Jun 2025',
    status: 'Aktif',
  },
  {
    id: 2,
    name: 'Ganjil',
    academicYear: '2024/2025',
    startDate: '2024-07-15',
    startLabel: '15 Jul 2024',
    endDate: '2024-12-20',
    endLabel: '20 Des 2024',
    status: 'Selesai',
  },
  {
    id: 3,
    name: 'Genap',
    academicYear: '2023/2024',
    startDate: '2024-01-08',
    startLabel: '08 Jan 2024',
    endDate: '2024-06-28',
    endLabel: '28 Jun 2024',
    status: 'Selesai',
  },
  {
    id: 4,
    name: 'Ganjil',
    academicYear: '2023/2024',
    startDate: '2023-07-17',
    startLabel: '17 Jul 2023',
    endDate: '2023-12-22',
    endLabel: '22 Des 2023',
    status: 'Selesai',
  },
]

export const religions = ['Islam', 'Kristen Protestan', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'].map(
  (name, index) => ({ id: index + 1, name, status: 'Aktif' }),
)

export const extracurriculars = [
  ['EKS-01', 'Pramuka', 'Deden Kurnia, S.Pd.', 120],
  ['EKS-02', 'Paskibra', 'Rina Marlina, S.Pd.', 35],
  ['EKS-03', 'Palang Merah Remaja', 'Siti Nurhaliza, S.Pd.', 42],
  ['EKS-04', 'Futsal', 'Iwan Hermawan, S.Pd.', 40],
  ['EKS-05', 'Basket', 'Budi Santoso, M.Pd.', 32],
  ['EKS-06', 'Voli', 'Neni Herawati, S.Pd.', 38],
  ['EKS-07', 'Karate', 'Yusuf Maulana, S.Pd.', 24],
  ['EKS-08', 'Seni Musik', 'Lilis Suryani, S.Pd.', 28],
  ['EKS-09', 'Seni Tari', 'Tuti Alawiyah, S.Pd.', 30],
].map(([code, name, supervisor, members], index) => ({
  id: index + 1,
  code,
  name,
  supervisor,
  members,
  status: 'Aktif',
}))

export const usersRoles = [
  {
    id: 1,
    name: 'Administrator',
    username: 'admin@sman27garut.sch.id',
    email: 'admin@sman27garut.sch.id',
    role: 'Admin',
    lastLogin: 'Hari ini, 08:15',
    status: 'Aktif',
  },
  {
    id: 2,
    name: 'Budi Santoso, M.Pd.',
    username: 'budi.santoso',
    email: 'budi.santoso@sman27garut.sch.id',
    role: 'Guru / Wali Kelas',
    lastLogin: 'Hari ini, 07:45',
    status: 'Aktif',
  },
  {
    id: 3,
    name: 'ACEP HASANUL IHWAN',
    username: '252610001',
    email: '252610001@siswa.sman27garut.sch.id',
    role: 'Siswa',
    lastLogin: 'Kemarin, 19:20',
    status: 'Aktif',
  },
  {
    id: 4,
    name: 'Kepala SMAN 27 Garut',
    username: 'kepala.sekolah',
    email: 'kepala.sekolah@sman27garut.sch.id',
    role: 'Kepala Sekolah',
    lastLogin: '02 Jun 2025, 10:30',
    status: 'Aktif',
  },
  ...masterTeachers.slice(0, 4).map((teacher, index) => ({
    id: index + 5,
    name: teacher.name,
    username: createEmailSlug(teacher.name),
    email: teacher.email,
    role: 'Guru / Wali Kelas',
    lastLogin: index % 2 === 0 ? 'Kemarin, 15:10' : '01 Jun 2025, 09:05',
    status: teacher.status,
  })),
  ...masterStudents.slice(1, 5).map((student, index) => ({
    id: index + 9,
    name: student.name,
    username: student.nis,
    email: `${student.nis}@siswa.sman27garut.sch.id`,
    role: 'Siswa',
    lastLogin: index % 2 === 0 ? 'Belum pernah' : '30 Mei 2025, 18:25',
    status: student.status,
  })),
]

export const studentSummary = [
  {
    title: 'Total Siswa',
    value: '1.248',
    caption: '12 dari tahun lalu',
    icon: 'users',
    tone: 'green',
    trend: 'up',
  },
  {
    title: 'Laki-laki',
    value: '612',
    caption: '49,04%',
    icon: 'user',
    tone: 'blue',
  },
  {
    title: 'Perempuan',
    value: '636',
    caption: '50,96%',
    icon: 'user',
    tone: 'purple',
  },
  {
    title: 'Kelas Aktif',
    value: '18',
    caption: 'Rombel',
    icon: 'academic',
    tone: 'orange',
  },
  {
    title: 'Alumni',
    value: '78',
    caption: 'Tahun ini',
    icon: 'cap',
    tone: 'teal',
  },
]

export const teacherSummary = [
  {
    title: 'Total Guru',
    value: '87',
    caption: 'Semua tenaga pendidik',
    icon: 'users',
    tone: 'green',
  },
  {
    title: 'Guru Aktif',
    value: '82',
    caption: '94,25%',
    icon: 'checkCircle',
    tone: 'blue',
  },
  {
    title: 'Laki-laki',
    value: '39',
    caption: '44,83%',
    icon: 'user',
    tone: 'teal',
  },
  {
    title: 'Perempuan',
    value: '48',
    caption: '55,17%',
    icon: 'user',
    tone: 'purple',
  },
  {
    title: 'Guru ASN',
    value: '52',
    caption: '59,77%',
    icon: 'academic',
    tone: 'orange',
  },
]

export const masterOptions = {
  classes: classNames,
  classFilters: ['Semua Kelas', ...classNames],
  grades: ['X', 'XI', 'XII'],
  gradeFilters: ['Semua Tingkat', 'X', 'XI', 'XII'],
  studyGroups: ['Merdeka 1', 'Merdeka 2', 'Merdeka 3', 'Merdeka 4', 'Merdeka 5', 'Merdeka 6'],
  studyGroupFilters: [
    'Semua Rombel',
    'Merdeka 1',
    'Merdeka 2',
    'Merdeka 3',
    'Merdeka 4',
    'Merdeka 5',
    'Merdeka 6',
  ],
  genders: ['Laki-laki', 'Perempuan'],
  genderFilters: ['Semua', 'Laki-laki', 'Perempuan'],
  studentStatuses: ['Aktif', 'Alumni', 'Tidak Aktif'],
  studentStatusFilters: ['Semua Status', 'Aktif', 'Alumni', 'Tidak Aktif'],
  teacherStatuses: ['Aktif', 'Tidak Aktif'],
  teacherStatusFilters: ['Semua Status', 'Aktif', 'Tidak Aktif'],
  employmentStatuses: ['ASN', 'PPPK', 'Honorer'],
  employmentStatusFilters: ['Semua Kepegawaian', 'ASN', 'PPPK', 'Honorer'],
  subjects: subjects.map(({ name }) => name),
  subjectFilters: ['Semua Mata Pelajaran', ...subjects.map(({ name }) => name)],
  roomTypes: ['Ruang Kelas', 'Laboratorium', 'Perpustakaan', 'Aula'],
  subjectGroups: ['Umum', 'IPA', 'IPS', 'Muatan Lokal', 'Layanan'],
  academicYears: academicYears.map(({ name }) => name),
  semesters: ['Ganjil', 'Genap'],
  religions: religions.map(({ name }) => name),
  roles: ['Admin', 'Guru / Wali Kelas', 'Siswa', 'Kepala Sekolah'],
  statuses: ['Aktif', 'Tidak Aktif'],
}

export const masterDatasets = {
  siswa: masterStudents,
  guru: masterTeachers,
  kelas: classes,
  ruangan: rooms,
  'mata-pelajaran': subjects,
  'tahun-ajaran': academicYears,
  semester: semesters,
  agama: religions,
  ekstrakurikuler: extracurriculars,
  'pengguna-role': usersRoles,
}

export const masterSchemas = {
  siswa: {
    title: 'Data Siswa',
    singular: 'Siswa',
    searchPlaceholder: 'Cari NIS / NISN / Nama siswa...',
    columns: [
      { key: 'nis', label: 'NIS' },
      { key: 'nisn', label: 'NISN' },
      { key: 'name', label: 'Nama Siswa' },
      { key: 'className', label: 'Kelas' },
      { key: 'genderCode', label: 'Jenis Kelamin' },
      { key: 'birth', label: 'Tempat, Tanggal Lahir' },
      { key: 'status', label: 'Status' },
    ],
    formFields: [
      { key: 'name', label: 'Nama Lengkap', required: true },
      { key: 'nis', label: 'NIS', required: true },
      { key: 'nisn', label: 'NISN', required: true },
      { key: 'birthPlace', label: 'Tempat Lahir', required: true },
      { key: 'birthDate', label: 'Tanggal Lahir', type: 'date', required: true },
      { key: 'gender', label: 'Jenis Kelamin', type: 'select', options: ['Laki-laki', 'Perempuan'] },
      { key: 'religion', label: 'Agama', type: 'select', options: masterOptions.religions },
      { key: 'address', label: 'Alamat', type: 'textarea' },
      { key: 'phone', label: 'Nomor Telepon', type: 'tel' },
      { key: 'previousSchool', label: 'Sekolah Asal' },
      { key: 'acceptedClass', label: 'Diterima di Kelas', type: 'select', options: classNames.slice(0, 6) },
      { key: 'admissionDate', label: 'Tanggal Diterima', type: 'date' },
      { key: 'fatherName', label: 'Nama Ayah' },
      { key: 'motherName', label: 'Nama Ibu' },
      { key: 'fatherOccupation', label: 'Pekerjaan Ayah' },
      { key: 'motherOccupation', label: 'Pekerjaan Ibu' },
      { key: 'parentPhone', label: 'Nomor Telepon Orang Tua', type: 'tel' },
      { key: 'guardianName', label: 'Nama Wali' },
      { key: 'guardianAddress', label: 'Alamat Wali', type: 'textarea' },
      { key: 'guardianPhone', label: 'Nomor Telepon Wali', type: 'tel' },
      { key: 'status', label: 'Status', type: 'select', options: masterOptions.studentStatuses },
    ],
  },
  guru: {
    title: 'Data Guru',
    singular: 'Guru',
    searchPlaceholder: 'Cari nama / NIP guru...',
    columns: [
      { key: 'name', label: 'Nama Guru' },
      { key: 'nip', label: 'NIP / NUPTK' },
      { key: 'genderCode', label: 'JK' },
      { key: 'subject', label: 'Mata Pelajaran' },
      { key: 'employmentStatus', label: 'Kepegawaian' },
      { key: 'status', label: 'Status' },
    ],
    formFields: [
      { key: 'name', label: 'Nama Guru', required: true },
      { key: 'nip', label: 'NIP', required: true },
      { key: 'nuptk', label: 'NUPTK' },
      { key: 'gender', label: 'Jenis Kelamin', type: 'select', options: masterOptions.genders },
      { key: 'birthPlace', label: 'Tempat Lahir' },
      { key: 'birthDate', label: 'Tanggal Lahir', type: 'date' },
      { key: 'phone', label: 'Nomor Telepon', type: 'tel' },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'address', label: 'Alamat', type: 'textarea' },
      {
        key: 'employmentStatus',
        label: 'Status Kepegawaian',
        type: 'select',
        options: masterOptions.employmentStatuses,
      },
      { key: 'subject', label: 'Mata Pelajaran Utama', type: 'select', options: masterOptions.subjects },
      { key: 'status', label: 'Status', type: 'select', options: masterOptions.teacherStatuses },
    ],
  },
  kelas: {
    title: 'Data Kelas',
    singular: 'Kelas',
    searchPlaceholder: 'Cari nama kelas...',
    columns: [
      { key: 'code', label: 'Kode' },
      { key: 'name', label: 'Nama Kelas' },
      { key: 'grade', label: 'Tingkat' },
      { key: 'academicYear', label: 'Tahun Ajaran' },
      { key: 'capacityLabel', label: 'Kapasitas' },
      { key: 'status', label: 'Status' },
    ],
    formFields: [
      { key: 'code', label: 'Kode Kelas', required: true },
      { key: 'name', label: 'Nama Kelas', required: true },
      { key: 'grade', label: 'Tingkat', type: 'select', options: masterOptions.grades },
      { key: 'academicYear', label: 'Tahun Ajaran', type: 'select', options: masterOptions.academicYears },
      { key: 'capacity', label: 'Kapasitas', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: masterOptions.statuses },
    ],
  },
  ruangan: {
    title: 'Data Ruangan',
    singular: 'Ruangan',
    searchPlaceholder: 'Cari ruangan...',
    columns: [
      { key: 'code', label: 'Kode' },
      { key: 'name', label: 'Nama Ruangan' },
      { key: 'type', label: 'Jenis' },
      { key: 'capacity', label: 'Kapasitas' },
      { key: 'location', label: 'Lokasi' },
      { key: 'status', label: 'Status' },
    ],
    formFields: [
      { key: 'code', label: 'Kode Ruangan', required: true },
      { key: 'name', label: 'Nama Ruangan', required: true },
      { key: 'type', label: 'Jenis Ruangan', type: 'select', options: masterOptions.roomTypes },
      { key: 'capacity', label: 'Kapasitas', type: 'number' },
      { key: 'location', label: 'Lokasi' },
      { key: 'status', label: 'Status', type: 'select', options: masterOptions.statuses },
    ],
  },
  'mata-pelajaran': {
    title: 'Mata Pelajaran',
    singular: 'Mata Pelajaran',
    searchPlaceholder: 'Cari mata pelajaran...',
    columns: [
      { key: 'code', label: 'Kode Mapel' },
      { key: 'name', label: 'Mata Pelajaran' },
      { key: 'group', label: 'Kelompok' },
      { key: 'grades', label: 'Tingkat' },
      { key: 'hoursLabel', label: 'Jam/Minggu' },
      { key: 'status', label: 'Status' },
    ],
    formFields: [
      { key: 'code', label: 'Kode Mapel', required: true },
      { key: 'name', label: 'Nama Mata Pelajaran', required: true },
      { key: 'group', label: 'Kelompok', type: 'select', options: masterOptions.subjectGroups },
      { key: 'grades', label: 'Tingkat' },
      { key: 'weeklyHours', label: 'Jam per Minggu', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: masterOptions.statuses },
    ],
  },
  'tahun-ajaran': {
    title: 'Tahun Ajaran',
    singular: 'Tahun Ajaran',
    searchPlaceholder: 'Cari tahun ajaran...',
    columns: [
      { key: 'name', label: 'Tahun Ajaran' },
      { key: 'startLabel', label: 'Tanggal Mulai' },
      { key: 'endLabel', label: 'Tanggal Selesai' },
      { key: 'status', label: 'Status' },
    ],
    formFields: [
      { key: 'name', label: 'Tahun Ajaran', required: true },
      { key: 'startDate', label: 'Tanggal Mulai', type: 'date' },
      { key: 'endDate', label: 'Tanggal Selesai', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['Aktif', 'Selesai', 'Akan Datang'] },
    ],
  },
  semester: {
    title: 'Semester',
    singular: 'Semester',
    searchPlaceholder: 'Cari semester...',
    columns: [
      { key: 'name', label: 'Semester' },
      { key: 'academicYear', label: 'Tahun Ajaran' },
      { key: 'startLabel', label: 'Tanggal Mulai' },
      { key: 'endLabel', label: 'Tanggal Akhir' },
      { key: 'status', label: 'Status' },
    ],
    formFields: [
      { key: 'name', label: 'Semester', type: 'select', options: masterOptions.semesters },
      { key: 'academicYear', label: 'Tahun Ajaran', type: 'select', options: masterOptions.academicYears },
      { key: 'startDate', label: 'Tanggal Mulai', type: 'date' },
      { key: 'endDate', label: 'Tanggal Akhir', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['Aktif', 'Selesai', 'Akan Datang'] },
    ],
  },
  agama: {
    title: 'Agama',
    singular: 'Agama',
    searchPlaceholder: 'Cari agama...',
    columns: [
      { key: 'name', label: 'Agama' },
      { key: 'status', label: 'Status' },
    ],
    formFields: [
      { key: 'name', label: 'Nama Agama', required: true },
      { key: 'status', label: 'Status', type: 'select', options: masterOptions.statuses },
    ],
  },
  ekstrakurikuler: {
    title: 'Ekstrakurikuler',
    singular: 'Ekstrakurikuler',
    searchPlaceholder: 'Cari ekstrakurikuler...',
    columns: [
      { key: 'code', label: 'Kode' },
      { key: 'name', label: 'Nama Ekskul' },
      { key: 'supervisor', label: 'Pembina' },
      { key: 'members', label: 'Anggota' },
      { key: 'status', label: 'Status' },
    ],
    formFields: [
      { key: 'code', label: 'Kode Ekstrakurikuler', required: true },
      { key: 'name', label: 'Nama Ekstrakurikuler', required: true },
      { key: 'supervisor', label: 'Pembina' },
      { key: 'members', label: 'Jumlah Anggota', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: masterOptions.statuses },
    ],
  },
  'pengguna-role': {
    title: 'Pengguna & Role',
    singular: 'Pengguna',
    searchPlaceholder: 'Cari nama / username...',
    columns: [
      { key: 'name', label: 'Nama' },
      { key: 'email', label: 'Email / Username' },
      { key: 'role', label: 'Role' },
      { key: 'lastLogin', label: 'Login Terakhir' },
      { key: 'status', label: 'Status' },
    ],
    formFields: [
      { key: 'name', label: 'Nama Pengguna', required: true },
      { key: 'username', label: 'Email / Username', required: true },
      { key: 'role', label: 'Role', type: 'select', options: masterOptions.roles },
      { key: 'status', label: 'Status', type: 'select', options: masterOptions.statuses },
    ],
  },
}

export const masterClasses = classes
export const masterRooms = rooms
export const masterSubjects = subjects
export const masterAcademicYears = academicYears
export const masterSemesters = semesters
export const masterReligions = religions
export const masterExtracurriculars = extracurriculars
export const masterUsersRoles = usersRoles
export const studentSummaryCards = studentSummary
export const teacherSummaryCards = teacherSummary
