/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import academicService from '../services/academicService.js'
import assessmentService from '../services/assessmentService.js'

const AcademicContext = createContext(null)

export function AcademicProvider({ children }) {
  const [activeAcademicYear, setActiveAcademicYear] = useState(null)
  const [activeSemester, setActiveSemester] = useState(null)

  const [availableYears, setAvailableYears] = useState([])
  const [allSemesters, setAllSemesters] = useState([])

  const [selectedYearId, setSelectedYearIdState] = useState('')
  const [selectedSemesterId, setSelectedSemesterIdState] = useState('')

  const [isLoading, setIsLoading] = useState(true)

  const loadAcademicContext = useCallback(async () => {
    setIsLoading(true)
    try {
      const [ctxRes, yrsRes, semsRes] = await Promise.all([
        assessmentService.getContext(),
        academicService.getAcademicYears({ per_page: 100 }),
        academicService.getSemesters({ per_page: 100 }),
      ])

      const yrsList = yrsRes.success && Array.isArray(yrsRes.data) ? yrsRes.data : []
      const semsList = semsRes.success && Array.isArray(semsRes.data) ? semsRes.data : []

      setAvailableYears(yrsList)
      setAllSemesters(semsList)

      let activeYr = null
      let activeSem = null

      if (ctxRes.success && ctxRes.data) {
        if (ctxRes.data.active_academic_year) {
          activeYr = ctxRes.data.active_academic_year
        }
        if (ctxRes.data.active_semester) {
          activeSem = ctxRes.data.active_semester
        }
      }

      // Fallback if context not returned
      if (!activeYr && yrsList.length > 0) {
        const found = yrsList.find((y) => y.status === 'Aktif') || yrsList[0]
        activeYr = { id: found.id, name: found.name }
      }
      if (!activeSem && semsList.length > 0 && activeYr) {
        const found = semsList.find((s) => s.academic_year_id === activeYr.id && s.status === 'Aktif')
          || semsList.find((s) => s.academic_year_id === activeYr.id)
          || semsList[0]
        if (found) activeSem = { id: found.id, name: found.name }
      }

      setActiveAcademicYear(activeYr)
      setActiveSemester(activeSem)

      // Set initial selected year and semester to active context
      if (activeYr) {
        const yrIdStr = String(activeYr.id)
        setSelectedYearIdState(yrIdStr)

        if (activeSem) {
          setSelectedSemesterIdState(String(activeSem.id))
        } else {
          const matchingSems = semsList.filter((s) => String(s.academic_year_id) === yrIdStr)
          const firstSem = matchingSems.find((s) => s.status === 'Aktif') || matchingSems[0]
          if (firstSem) setSelectedSemesterIdState(String(firstSem.id))
        }
      }
    } catch (err) {
      console.error('Failed to load global academic context', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAcademicContext(), 0)
    return () => window.clearTimeout(timer)
  }, [loadAcademicContext])

  // Cascading: Semesters available for selectedYearId
  const availableSemesters = useMemo(() => {
    if (!selectedYearId) return allSemesters
    return allSemesters.filter((s) => String(s.academic_year_id) === String(selectedYearId))
  }, [allSemesters, selectedYearId])

  // Selected year and semester objects
  const selectedYear = useMemo(() => {
    return availableYears.find((y) => String(y.id) === String(selectedYearId)) || null
  }, [availableYears, selectedYearId])

  const selectedSemester = useMemo(() => {
    return availableSemesters.find((s) => String(s.id) === String(selectedSemesterId))
      || allSemesters.find((s) => String(s.id) === String(selectedSemesterId))
      || null
  }, [availableSemesters, allSemesters, selectedSemesterId])

  // Changing academic year automatically cascades selected semester to matching year's semester
  const setSelectedYearId = useCallback((newYearId) => {
    const yrIdStr = String(newYearId)
    setSelectedYearIdState(yrIdStr)

    // Find active semester or first semester for this new year
    const matchingSems = allSemesters.filter((s) => String(s.academic_year_id) === yrIdStr)
    const activeOrFirstSem = matchingSems.find((s) => s.status === 'Aktif') || matchingSems[0]
    if (activeOrFirstSem) {
      setSelectedSemesterIdState(String(activeOrFirstSem.id))
    } else {
      setSelectedSemesterIdState('')
    }
  }, [allSemesters])

  const setSelectedSemesterId = useCallback((newSemId) => {
    setSelectedSemesterIdState(String(newSemId))
  }, [])

  const value = useMemo(() => ({
    activeAcademicYear,
    activeSemester,
    availableYears,
    availableSemesters,
    academicYears: availableYears,
    semesters: availableSemesters,
    allSemesters,
    selectedYearId,
    selectedSemesterId,
    selectedAcademicYearId: selectedYearId,
    selectedYear,
    selectedSemester,
    setSelectedYearId,
    setSelectedSemesterId,
    refreshAcademicContext: loadAcademicContext,
    isLoading,
  }), [
    activeAcademicYear,
    activeSemester,
    availableYears,
    availableSemesters,
    allSemesters,
    selectedYearId,
    selectedSemesterId,
    selectedYear,
    selectedSemester,
    setSelectedYearId,
    setSelectedSemesterId,
    loadAcademicContext,
    isLoading,
  ])

  return (
    <AcademicContext.Provider value={value}>
      {children}
    </AcademicContext.Provider>
  )
}

export function useAcademicContext() {
  const context = useContext(AcademicContext)
  if (!context) {
    throw new Error('useAcademicContext must be used within an AcademicProvider')
  }
  return context
}

export default AcademicContext
