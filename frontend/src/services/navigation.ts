import { NavigateFunction } from 'react-router-dom'

let navigateFn: NavigateFunction | null = null

export function setNavigate(fn: NavigateFunction) {
  navigateFn = fn
}

export function navigateTo(path: string) {
  if (navigateFn) navigateFn(path)
}
