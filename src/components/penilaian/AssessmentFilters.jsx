import Button from '../common/Button.jsx'
import Icon from '../common/Icon.jsx'
import SearchInput from '../common/SearchInput.jsx'
import { assessmentOptions } from '../../data/penilaian.js'

function AssessmentFilters({
  filters,
  onFilterChange,
  searchQuery,
  onSearchChange,
  onDownload,
  onSaveAll,
  classOptions,
  subjectOptions,
  isLocked = false,
  isSaving = false,
}) {
  const dynamicFilterFields = [
    { key: 'className', label: 'Kelas', options: classOptions && classOptions.length > 0 ? classOptions : assessmentOptions.classes },
    { key: 'subject', label: 'Mata Pelajaran', options: subjectOptions && subjectOptions.length > 0 ? subjectOptions : assessmentOptions.subjects },
    { key: 'assessmentType', label: 'Penilaian', options: assessmentOptions.assessmentTypes },
    { key: 'semester', label: 'Semester', options: assessmentOptions.semesters },
  ]

  return (
    <div className="assessment-toolbar">
      <div className="assessment-filter-grid">
        {dynamicFilterFields.map((field) => (
          <label className="assessment-field" key={field.key}>
            <span>{field.label}</span>
            <select value={filters[field.key]} onChange={(event) => onFilterChange(field.key, event.target.value)}>
              {field.options.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <div className="assessment-toolbar-side">
        <label className="assessment-search">
          <SearchInput
            aria-label="Cari siswa berdasarkan NIS atau nama"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Cari siswa (NIS/Nama)..."
            value={searchQuery}
          />
          <Icon name="search" />
        </label>

        <div className="assessment-toolbar-actions">
          <Button className="assessment-button secondary" onClick={onDownload}>
            <Icon name="download" />
            Unduh Template
          </Button>
          <Button
            className="assessment-button primary"
            disabled={isLocked || isSaving}
            onClick={onSaveAll}
          >
            <Icon name={isLocked ? "lock" : "save"} />
            {isLocked ? 'Nilai Terkunci' : isSaving ? 'Menyimpan...' : 'Simpan Semua Nilai'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AssessmentFilters
