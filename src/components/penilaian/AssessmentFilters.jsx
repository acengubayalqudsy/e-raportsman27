import Button from '../common/Button.jsx'
import Icon from '../common/Icon.jsx'
import SearchInput from '../common/SearchInput.jsx'

function AssessmentFilters({
  filters,
  onFilterChange,
  searchQuery,
  onSearchChange,
  onSaveAll,
  classOptions,
  subjectOptions,
  semesterOptions = [],
  assessmentTypes = [],
  isLocked = false,
  isSaving = false,
  canSave = false,
}) {
  const dynamicFilterFields = [
    { key: 'className', label: 'Kelas', options: classOptions || [] },
    { key: 'subject', label: 'Mata Pelajaran', options: subjectOptions || [] },
    { key: 'assessmentType', label: 'Penilaian', options: assessmentTypes },
    { key: 'semester', label: 'Semester', options: semesterOptions },
  ]

  return (
    <div className="assessment-toolbar">
      <div className="assessment-filter-grid">
        {dynamicFilterFields.map((field) => (
          <label className="assessment-field" key={field.key}>
            <span>{field.label}</span>
            <select value={filters[field.key]} onChange={(event) => onFilterChange(field.key, event.target.value)}>
              {!field.options.length && <option value="">Belum tersedia</option>}
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
          <Button
            className="assessment-button primary"
            disabled={isLocked || isSaving || !canSave}
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
