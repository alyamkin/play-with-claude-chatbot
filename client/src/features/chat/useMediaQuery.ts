import { useSyncExternalStore } from 'react'

// Matches Tailwind's `lg` breakpoint: from here up the drawers sit beside the chat
export const DESKTOP_QUERY = '(min-width: 64rem)'

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
  )
}
