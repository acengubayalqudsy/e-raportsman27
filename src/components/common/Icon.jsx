function Icon({ name, className = '' }) {
  const paths = {
    home: (
      <>
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5.5 10v10h13V10" />
        <path d="M9.5 20v-6h5v6" />
      </>
    ),
    layers: (
      <>
        <path d="m12 3 9 4.5-9 4.5-9-4.5Z" />
        <path d="m3 12 9 4.5 9-4.5" />
        <path d="m3 16.5 9 4.5 9-4.5" />
      </>
    ),
    academic: (
      <>
        <path d="m3 8.5 9-4 9 4-9 4Z" />
        <path d="M7 11v4.5c3 2 7 2 10 0V11" />
        <path d="M21 8.5v6" />
      </>
    ),
    grade: (
      <>
        <rect x="5" y="4" width="14" height="16" rx="2" />
        <path d="M8.5 8h7" />
        <path d="M8.5 12h7" />
        <path d="M8.5 16h4" />
      </>
    ),
    report: (
      <>
        <path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5a1.5 1.5 0 0 1 1.5-1.5Z" />
        <path d="M14 3.5v5h4" />
        <path d="M9 13h6" />
        <path d="M9 17h5" />
      </>
    ),
    calendar: (
      <>
        <rect x="4" y="5.5" width="16" height="15" rx="2" />
        <path d="M8 3.5v4" />
        <path d="M16 3.5v4" />
        <path d="M4 10h16" />
        <path d="M8 14h3" />
        <path d="M13.5 14H16" />
      </>
    ),
    journal: (
      <>
        <path d="M6 4.5h10a2 2 0 0 1 2 2v13H7.5A2.5 2.5 0 0 1 5 17V5.5a1 1 0 0 1 1-1Z" />
        <path d="M8.5 8h6" />
        <path d="M8.5 11.5h5" />
        <path d="M7.5 19.5A2.5 2.5 0 0 1 10 17h8" />
      </>
    ),
    document: (
      <>
        <path d="M7 4h7l4 4v12H7Z" />
        <path d="M14 4v5h4" />
        <path d="M9.5 13h5" />
        <path d="M9.5 16.5h5" />
      </>
    ),
    settings: (
      <>
        <path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z" />
        <path d="m19.4 13.5.1-3-2.3-.6a7 7 0 0 0-.8-1.4l.9-2.2-2.5-1.6-1.8 1.5a7.5 7.5 0 0 0-1.7 0L9.5 4.7 7 6.3l.9 2.2c-.3.4-.6.9-.8 1.4l-2.3.6.1 3 2.2.6c.2.6.5 1.1.9 1.6l-.9 2.1 2.5 1.6 1.7-1.4c.6.1 1.2.1 1.8 0l1.7 1.4 2.5-1.6-.9-2.1c.4-.5.7-1 .9-1.6Z" />
      </>
    ),
    building: (
      <>
        <path d="M4 9h16" />
        <path d="M5.5 9v10.5h13V9" />
        <path d="M3 21h18" />
        <path d="M8 12v5.5M12 12v5.5M16 12v5.5" />
        <path d="m3.5 8 8.5-5 8.5 5Z" />
      </>
    ),
    cloudUpload: (
      <>
        <path d="M7 18.5H5.8A3.8 3.8 0 0 1 5 11a6.5 6.5 0 0 1 12.5-1.3A4.5 4.5 0 0 1 18 18.5h-1" />
        <path d="M12 19V11" />
        <path d="m8.8 14.2 3.2-3.2 3.2 3.2" />
      </>
    ),
    cloud: (
      <path d="M7 18.5H5.8A3.8 3.8 0 0 1 5 11a6.5 6.5 0 0 1 12.5-1.3A4.5 4.5 0 0 1 18 18.5H7Z" />
    ),
    activityLog: (
      <>
        <rect x="5" y="4" width="14" height="16" rx="2" />
        <path d="M9 4v-1h6v3H9Z" />
        <path d="M9 10h6M9 14h4M9 18h6" />
      </>
    ),
    lightbulb: (
      <>
        <path d="M8.5 15.5a6 6 0 1 1 7 0c-.8.6-1.2 1.3-1.2 2.2H9.7c0-.9-.4-1.6-1.2-2.2Z" />
        <path d="M9.5 21h5M9.7 18h4.6" />
      </>
    ),
    image: (
      <>
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <circle cx="9" cy="10" r="1.5" />
        <path d="m5.5 17 4.2-4 3 2.5 2.3-2 3.5 3.5" />
      </>
    ),
    users: (
      <>
        <path d="M9.5 11.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path d="M15.8 11.2a2.6 2.6 0 1 0 0-5.2" />
        <path d="M4.5 19c.6-3.4 2.3-5 5-5s4.5 1.6 5 5" />
        <path d="M14.5 14.4c2.5.2 4 1.7 4.6 4.6" />
      </>
    ),
    cap: (
      <>
        <path d="m3 9 9-4 9 4-9 4Z" />
        <path d="M7 11.2v4.2c3.1 2.1 6.9 2.1 10 0v-4.2" />
      </>
    ),
    screen: (
      <>
        <rect x="4" y="5" width="16" height="11" rx="1.8" />
        <path d="M9 20h6" />
        <path d="M12 16v4" />
      </>
    ),
    file: (
      <>
        <path d="M7 4h7l4 4v12H7Z" />
        <path d="M14 4v5h4" />
        <path d="M10 13h4" />
        <path d="M10 16h4" />
      </>
    ),
    fileGrade: (
      <>
        <path d="M7 4h7l4 4v12H7Z" />
        <path d="M14 4v5h4" />
        <path d="m9.5 17 2.2-6 2.3 6" />
        <path d="M10.3 15h2.9" />
      </>
    ),
    fileCheck: (
      <>
        <path d="M7 4h7l4 4v12H7Z" />
        <path d="M14 4v5h4" />
        <path d="m9.5 14 1.7 1.7 3.7-4" />
      </>
    ),
    book: (
      <>
        <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21Z" />
        <path d="M5 5.5V21" />
        <path d="M9 7h7" />
      </>
    ),
    bell: (
      <>
        <path d="M18 16H6l1.4-1.6V10a4.6 4.6 0 0 1 9.2 0v4.4Z" />
        <path d="M10 19a2.2 2.2 0 0 0 4 0" />
      </>
    ),
    chevron: <path d="m8 10 4 4 4-4" />,
    menu: (
      <>
        <path d="M5 7h14" />
        <path d="M5 12h14" />
        <path d="M5 17h14" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="5.5" />
        <path d="m15 15 4 4" />
      </>
    ),
    mail: (
      <>
        <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
        <path d="m5 7 7 5.5L19 7" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
        <path d="M12 14v2.5" />
      </>
    ),
    login: (
      <>
        <path d="M14 5h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4" />
        <path d="M10 8l4 4-4 4" />
        <path d="M14 12H4" />
      </>
    ),
    logout: (
      <>
        <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
        <path d="m14 8 4 4-4 4" />
        <path d="M8 12h10" />
      </>
    ),
    userPlus: (
      <>
        <path d="M10 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
        <path d="M4 20c.6-4 2.6-6 6-6 2.1 0 3.7.8 4.7 2.3" />
        <path d="M18 12v6M15 15h6" />
      </>
    ),
    filter: (
      <>
        <path d="M4 5h16l-6 7v5l-4 2v-7Z" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    more: (
      <>
        <circle cx="12" cy="5.5" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="12" cy="18.5" r="1" />
      </>
    ),
    eye: (
      <>
        <path d="M3 12s3.3-5.5 9-5.5S21 12 21 12s-3.3 5.5-9 5.5S3 12 3 12Z" />
        <circle cx="12" cy="12" r="2.4" />
      </>
    ),
    edit: (
      <>
        <path d="M4 20h4.5L19 9.5 14.5 5 4 15.5Z" />
        <path d="m13.5 6 4.5 4.5" />
      </>
    ),
    trash: (
      <>
        <path d="M5 7h14" />
        <path d="M9 7V5h6v2" />
        <path d="M8 10v9h8v-9" />
        <path d="M10.5 12.5v4" />
        <path d="M13.5 12.5v4" />
      </>
    ),
    arrowRight: <path d="m9 6 6 6-6 6" />,
    megaphone: (
      <>
        <path d="M4 13V9h4l9-4v12l-9-4Z" />
        <path d="M8 13l1.5 5H12" />
        <path d="M19 9.5a3 3 0 0 1 0 3" />
      </>
    ),
    clipboard: (
      <>
        <path d="M9 4h6l1 2h2v14H6V6h2Z" />
        <path d="M9 10h6" />
        <path d="M9 14h6" />
      </>
    ),
    clipboardCheck: (
      <>
        <rect x="5" y="4.5" width="14" height="16" rx="2" />
        <path d="M9 4.5v-1h6v3H9Z" />
        <path d="m8.5 13 2.2 2.2 4.8-5" />
      </>
    ),
    table: (
      <>
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <path d="M4 10h16" />
        <path d="M9 10v9" />
        <path d="M14.5 10v9" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3.5 19 6v5.5c0 4.2-2.8 7.4-7 9-4.2-1.6-7-4.8-7-9V6Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    sliders: (
      <>
        <path d="M5 6h14" />
        <path d="M5 12h14" />
        <path d="M5 18h14" />
        <circle cx="9" cy="6" r="1.8" />
        <circle cx="15" cy="12" r="1.8" />
        <circle cx="10" cy="18" r="1.8" />
      </>
    ),
    check: <path d="m5 12.5 4.2 4.2L19 7" />,
    checkCircle: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="m8 12 2.7 2.7L16.5 9" />
      </>
    ),
    trend: (
      <>
        <path d="M4 18 9 13l3 3 7-8" />
        <path d="M14 8h5v5" />
      </>
    ),
    arrowUp: (
      <>
        <path d="M12 19V6" />
        <path d="m7.5 10.5 4.5-4.5 4.5 4.5" />
      </>
    ),
    save: (
      <>
        <path d="M5 4h12l2 2v14H5Z" />
        <path d="M8 4v6h8V4" />
        <rect x="8" y="14" width="8" height="6" rx="1" />
      </>
    ),
    reset: (
      <>
        <path d="M5.5 8.5A7 7 0 1 1 5 15" />
        <path d="M5.5 4v4.5H10" />
        <path d="M12 8v4l2.5 1.5" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 10.5v5" />
        <path d="M12 7.5h.01" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3.5 2" />
      </>
    ),
    award: (
      <>
        <circle cx="12" cy="9" r="5.5" />
        <path d="m8.5 13.5-1 7 4.5-2.5 4.5 2.5-1-7" />
        <path d="m12 6.5.8 1.6 1.7.3-1.2 1.2.3 1.8-1.6-.8-1.6.8.3-1.8-1.2-1.2 1.7-.3Z" />
      </>
    ),
    trophy: (
      <>
        <path d="M8 4h8v4.5a4 4 0 0 1-8 0Z" />
        <path d="M8 6H5v1.5A3.5 3.5 0 0 0 8.5 11" />
        <path d="M16 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5" />
        <path d="M12 12.5V17" />
        <path d="M9 20h6" />
        <path d="M10 17h4" />
      </>
    ),
    printer: (
      <>
        <path d="M7 9V4h10v5" />
        <path d="M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
        <rect x="7" y="14" width="10" height="7" />
        <path d="M17.5 12h.01" />
      </>
    ),
    user: (
      <>
        <path d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
        <path d="M5.5 20c.7-4.1 2.9-6.2 6.5-6.2s5.8 2.1 6.5 6.2" />
      </>
    ),
    download: (
      <>
        <path d="M12 4v10" />
        <path d="m8 10 4 4 4-4" />
        <path d="M5 19h14" />
      </>
    ),
    close: <path d="m18 6-12 12M6 6l12 12" />,
    x: <path d="m18 6-12 12M6 6l12 12" />,
  }

  return (
    <svg className={`ui-icon ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

export default Icon
