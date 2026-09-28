import { initialSchoolIdentity } from '../data/pengaturan.js'

let identitySessionState = null
const storageKey = 'e-raport:school-identity'
const previousDefaultPrincipal = 'Drs. H. Ridwan Kamil, M.Pd.'
const previousDefaultNip = '19680512 199303 1 006'

function normalizeIdentity(value) {
  if (!value) return value
  if (value.principal !== previousDefaultPrincipal) return value
  return {
    ...value,
    principal: initialSchoolIdentity.principal,
    principalNip: value.principalNip === previousDefaultNip ? '' : value.principalNip,
  }
}

function readStoredIdentity() {
  if (typeof window === 'undefined') return null
  try {
    const stored = window.localStorage.getItem(storageKey)
    return stored ? normalizeIdentity(JSON.parse(stored)) : null
  } catch {
    return null
  }
}

export function getSchoolIdentitySession() {
  if (identitySessionState) return identitySessionState
  const stored = readStoredIdentity()
  return stored ? { value: stored, logo: null } : null
}

export function getCurrentSchoolIdentity() {
  return normalizeIdentity(getSchoolIdentitySession()?.value) ?? initialSchoolIdentity
}

export function saveSchoolIdentitySession(value, logo) {
  identitySessionState = { value, logo }
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value))
  } catch {
    // The current browser session still retains the saved identity.
  }
}
