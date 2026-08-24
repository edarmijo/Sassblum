import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { RouteMetadata } from './RouteMetadata'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <RouteMetadata />
    </MemoryRouter>,
  )
}

afterEach(() => {
  cleanup()
  document.head.querySelectorAll('link[rel="canonical"], meta[name="robots"], meta[property="og:url"]').forEach((element) => element.remove())
})

describe('RouteMetadata', () => {
  it('publishes a self-referencing canonical URL for public routes', async () => {
    renderAt('/servicios/?campana=prueba')

    await waitFor(() => {
      expect(document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href)
        .toBe('https://www.sassblum.com/servicios')
    })
    expect(document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content).toBe('index, follow')
    expect(document.head.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.content)
      .toBe('https://www.sassblum.com/servicios')
  })

  it('prevents authenticated and utility routes from being indexed', async () => {
    renderAt('/admin?tab=users')

    await waitFor(() => {
      expect(document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content)
        .toBe('noindex, nofollow')
    })
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull()
    expect(document.head.querySelector('meta[property="og:url"]')).toBeNull()
  })
})
