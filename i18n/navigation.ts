import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

// Locale-aware navigation helpers. Use these `Link`, `redirect`, `usePathname`,
// `useRouter` in the public site instead of the ones from `next/link` /
// `next/navigation` so the active locale prefix (`/en/...`) is applied
// automatically. The default locale (de) stays prefix-free.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
