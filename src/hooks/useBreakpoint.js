import { useEffect, useState } from 'react'
import { BREAKPOINTS } from '../config/layoutConfig.js'

function getViewportWidth() {
  if (typeof window === 'undefined') {
    return BREAKPOINTS.desktop
  }

  return window.innerWidth
}

function getBreakpointState(width) {
  const device =
    width < BREAKPOINTS.mobile
      ? 'mobile'
      : width < BREAKPOINTS.tablet
        ? 'tablet'
        : width < BREAKPOINTS.desktop
          ? 'desktop'
          : 'large-desktop'

  return {
    width,
    device,
    isMobile: device === 'mobile',
    isTablet: device === 'tablet',
    isDesktop: device === 'desktop',
    isLargeDesktop: device === 'large-desktop',
    isDesktopLike: device === 'desktop' || device === 'large-desktop',
  }
}

export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState(() => getBreakpointState(getViewportWidth()))

  useEffect(() => {
    let frameId = 0

    const updateBreakpoint = () => {
      window.cancelAnimationFrame(frameId)
      frameId = window.requestAnimationFrame(() => {
        setBreakpoint(getBreakpointState(getViewportWidth()))
      })
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', updateBreakpoint)
    }
  }, [])

  return breakpoint
}
