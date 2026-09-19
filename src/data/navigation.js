import { academicTabs } from "./akademik.js";
import { activityTabs } from "./kegiatanSiswa.js";
import { attendanceTabs } from "./absensi.js";
import { assessmentTabs } from "./penilaian.js";
import { journalTabs } from "./jurnalMengajar.js";
import { masterTabs } from "./masterData.js";
import { raporTabs } from "./rapor.js";
import { settingsTabs } from "./pengaturan.js";
import dashboardIcon from "../assets/icons/dashboard.png";
import masterDataIcon from "../assets/icons/master_data.png";
import akademikIcon from "../assets/icons/akademik.png";
import penilaianIcon from "../assets/icons/penilaian.png";
import raporIcon from "../assets/icons/rapor.png";
import kegiatanSiswaIcon from "../assets/icons/kegiatan_siswa.png";
import jurnalMengajarIcon from "../assets/icons/jurnal_mengajar.png";
import laporanIcon from "../assets/icons/laporan.png";
import pengaturanIcon from "../assets/icons/pengaturan.png";
import absensiIcon from "../assets/icons/absensi.png";

export const user = {
  name: "Administrator",
  role: "Super Admin",
  greetingName: "Admin",
};

export const masterDataItems = masterTabs.map(({ label, route }) => ({ label, route }));
export const academicItems = academicTabs.map(({ label, route }) => ({ label, route }));
export const studentActivityItems = activityTabs.map(({ label, route }) => ({ label, route }));
export const attendanceItems = attendanceTabs.map(({ label, route }) => ({ label, route }));
export const journalItems = journalTabs.map(({ label, route }) => ({ label, route }));
export const penilaianItems = assessmentTabs.map(({ label, route }) => ({ label, route }));
export const raporItems = raporTabs.map(({ label, route }) => ({ label, route }));
export const reportingItems = [
  { label: "Daftar Laporan", route: "/laporan" },
  { label: "Laporan Saya", route: "/laporan/per-siswa" },
];
export const settingsItems = settingsTabs.map(({ label, route }) => ({ label, route }));

export const navItems = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: "home",
    iconAsset: dashboardIcon,
    route: "/dashboard",
  },
  {
    key: "master-data",
    label: "Master Data",
    icon: "layers",
    iconAsset: masterDataIcon,
    route: "/master-data/siswa",
    basePath: "/master-data",
    expandable: true,
    submenuClass: "master-submenu",
    submenuItemClass: "master-submenu-item",
    children: masterDataItems,
  },
  {
    key: "akademik",
    label: "Akademik",
    icon: "academic",
    iconAsset: akademikIcon,
    route: "/akademik",
    basePath: "/akademik",
    expandable: true,
    submenuClass: "academic-submenu",
    submenuItemClass: "academic-submenu-item",
    children: academicItems,
  },
  {
    key: "penilaian",
    label: "Penilaian",
    icon: "grade",
    iconAsset: penilaianIcon,
    route: "/penilaian",
    basePath: "/penilaian",
    expandable: true,
    submenuClass: "assessment-submenu",
    submenuItemClass: "assessment-submenu-item",
    children: penilaianItems,
  },
  {
    key: "rapor-leger",
    label: "Rapor & Leger",
    icon: "report",
    iconAsset: raporIcon,
    route: "/rapor-leger",
    basePath: "/rapor-leger",
    expandable: true,
    submenuClass: "report-submenu",
    submenuItemClass: "report-submenu-item",
    children: raporItems,
  },
  {
    key: "kegiatan-siswa",
    label: "Kegiatan Siswa",
    icon: "cap",
    iconAsset: kegiatanSiswaIcon,
    route: "/kegiatan-siswa/keikutsertaan-ekstrakurikuler",
    basePath: "/kegiatan-siswa",
    expandable: true,
    submenuClass: "activity-submenu",
    submenuItemClass: "activity-submenu-item",
    children: studentActivityItems,
  },
  {
    key: "absensi",
    label: "Absensi",
    icon: "clipboardCheck",
    iconAsset: absensiIcon,
    route: "/absensi/rekap",
    basePath: "/absensi",
    expandable: true,
    submenuClass: "attendance-submenu",
    submenuItemClass: "attendance-submenu-item",
    children: attendanceItems,
  },
  {
    key: "jurnal-mengajar",
    label: "Jurnal Mengajar",
    icon: "journal",
    iconAsset: jurnalMengajarIcon,
    route: "/jurnal-mengajar/jurnal",
    basePath: "/jurnal-mengajar",
    expandable: true,
    submenuClass: "teaching-journal-submenu",
    submenuItemClass: "teaching-journal-submenu-item",
    children: journalItems,
  },
  {
    key: "laporan",
    label: "Laporan",
    icon: "document",
    iconAsset: laporanIcon,
    route: "/laporan",
    basePath: "/laporan",
    expandable: true,
    submenuClass: "reporting-submenu",
    submenuItemClass: "reporting-submenu-item",
    children: reportingItems,
  },
  {
    key: "pengaturan",
    label: "Pengaturan",
    icon: "settings",
    iconAsset: pengaturanIcon,
    route: "/pengaturan/identitas-sekolah",
    basePath: "/pengaturan",
    expandable: true,
    submenuClass: "settings-submenu",
    submenuItemClass: "settings-submenu-item",
    children: settingsItems,
  },
];

export const moduleRows = [
  {
    kode: "X IPA 1",
    nama: "Matematika",
    penanggungJawab: "Pak Budi Santoso",
    status: "Aktif",
    update: "9 Mei 2025",
  },
  {
    kode: "X IPS 2",
    nama: "Bahasa Indonesia",
    penanggungJawab: "Ibu Rina Marlina",
    status: "Aktif",
    update: "9 Mei 2025",
  },
  {
    kode: "X IPA 1",
    nama: "Fisika",
    penanggungJawab: "Pak Deden Kurnia",
    status: "Review",
    update: "8 Mei 2025",
  },
  {
    kode: "X IPA 2",
    nama: "Kimia",
    penanggungJawab: "Ibu Siti Nurhaliza",
    status: "Aktif",
    update: "8 Mei 2025",
  },
  {
    kode: "X IPS 1",
    nama: "Sejarah Indonesia",
    penanggungJawab: "Pak Asep Hidayat",
    status: "Draft",
    update: "7 Mei 2025",
  },
  {
    kode: "XI IPA 3",
    nama: "Biologi",
    penanggungJawab: "Ibu Dewi Kartika",
    status: "Aktif",
    update: "7 Mei 2025",
  },
  {
    kode: "XI IPS 1",
    nama: "Ekonomi",
    penanggungJawab: "Pak Ahmad Faisal",
    status: "Review",
    update: "6 Mei 2025",
  },
  {
    kode: "XII IPA 2",
    nama: "Bahasa Inggris",
    penanggungJawab: "Ibu Maya Lestari",
    status: "Aktif",
    update: "6 Mei 2025",
  },
];
