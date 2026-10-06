import type { ComponentProps, MouseEvent } from 'react'
import { pagePath, type Page } from '../types/navigation'

export type Navigate = (page: Page, sectionId?: string) => void

export default function PageLink({ page, sectionId, navigate, onClick, ...props }: Omit<ComponentProps<'a'>, 'href'> & {
  page: Page
  sectionId?: string
  navigate: Navigate
}) {
  const follow = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.target === '_blank') return
    event.preventDefault()
    navigate(page, sectionId)
  }
  return <a {...props} href={`${pagePath(page)}${sectionId ? `#${encodeURIComponent(sectionId)}` : ''}`} onClick={follow} />
}
