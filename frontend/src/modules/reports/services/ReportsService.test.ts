import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../../../infrastructure/http/ApiClient'
import { ReportsService } from './ReportsService'

describe('ReportsService legacy actions', () => {
  const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
  const originalCreateObjectURL = Object.getOwnPropertyDescriptor(URL, 'createObjectURL')
  const originalRevokeObjectURL = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL')

  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:report'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard)
    else Reflect.deleteProperty(navigator, 'clipboard')
    if (originalCreateObjectURL) Object.defineProperty(URL, 'createObjectURL', originalCreateObjectURL)
    else Reflect.deleteProperty(URL, 'createObjectURL')
    if (originalRevokeObjectURL) Object.defineProperty(URL, 'revokeObjectURL', originalRevokeObjectURL)
    else Reflect.deleteProperty(URL, 'revokeObjectURL')
  })

  it('downloads CSV with the legacy filename', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue(new Blob(['numero,usuario\r\n1,Vicky\r\n']))
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)

    await new ReportsService().exportReport('csv')

    expect(apiClient.post).toHaveBeenCalledWith(
      '/reportes/exportar',
      { formato: 'csv' },
      { responseType: 'blob' },
    )
    expect(click).toHaveBeenCalledOnce()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:report')
  })

  it('copies the CSV response without its UTF-8 marker', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    vi.spyOn(apiClient, 'post').mockResolvedValue(
      new Blob(['\uFEFFnumero,usuario\r\n1,Vicky\r\n'], { type: 'text/csv' }),
    )

    await new ReportsService().copyReport({ clienteRuc: '099' })

    expect(apiClient.post).toHaveBeenCalledWith(
      '/reportes/exportar',
      { formato: 'csv', cliente_ruc: '099' },
      { responseType: 'blob' },
    )
    expect(writeText).toHaveBeenCalledWith('numero,usuario\r\n1,Vicky\r\n')
  })

  it('requests PDF and opens its print dialog', async () => {
    const listeners: Record<string, () => void> = {}
    const popup = {
      opener: window,
      document: { title: '' },
      location: { replace: vi.fn() },
      addEventListener: vi.fn((event: string, callback: () => void) => {
        listeners[event] = callback
      }),
      focus: vi.fn(),
      print: vi.fn(),
      close: vi.fn(),
    }
    vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window)
    vi.spyOn(apiClient, 'post').mockResolvedValue(
      new Blob(['%PDF-'], { type: 'application/pdf' }),
    )

    await new ReportsService().printReport()
    listeners.load()

    expect(apiClient.post).toHaveBeenCalledWith(
      '/reportes/exportar',
      { formato: 'pdf' },
      { responseType: 'blob' },
    )
    expect(popup.location.replace).toHaveBeenCalledWith('blob:report')
    expect(popup.focus).toHaveBeenCalledOnce()
    expect(popup.print).toHaveBeenCalledOnce()

    listeners.afterprint()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:report')
  })
})
