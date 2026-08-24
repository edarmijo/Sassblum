import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ExportButton } from './index'

describe('ExportButton', () => {
  function renderButton(overrides?: {
    onExport?: ReturnType<typeof vi.fn>
    onCopy?: ReturnType<typeof vi.fn>
    onPrint?: ReturnType<typeof vi.fn>
  }) {
    const props = {
      onExport: overrides?.onExport ?? vi.fn().mockResolvedValue(undefined),
      onCopy: overrides?.onCopy ?? vi.fn().mockResolvedValue(undefined),
      onPrint: overrides?.onPrint ?? vi.fn().mockResolvedValue(undefined),
    }
    render(<ExportButton {...props} />)
    return props
  }

  it('offers the five actions from the legacy report page', () => {
    renderButton()

    for (const label of ['Copiar', 'CSV', 'Excel', 'PDF', 'Imprimir']) {
      expect(screen.getByRole('button', { name: label })).toHaveClass('min-h-11')
    }
  })

  it.each([
    ['CSV', 'csv'],
    ['Excel', 'excel'],
    ['PDF', 'pdf'],
  ] as const)('exports %s with the expected format', async (label, format) => {
    const onExport = vi.fn().mockResolvedValue(undefined)
    renderButton({ onExport })

    fireEvent.click(screen.getByRole('button', { name: new RegExp(label, 'i') }))

    expect(onExport).toHaveBeenCalledWith(format)
  })

  it('runs copy and print as distinct actions', async () => {
    const onCopy = vi.fn().mockResolvedValue(undefined)
    const onPrint = vi.fn().mockResolvedValue(undefined)
    renderButton({ onCopy, onPrint })

    fireEvent.click(screen.getByRole('button', { name: /copiar/i }))
    expect(onCopy).toHaveBeenCalledOnce()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /imprimir/i })).toBeEnabled()
    })

    fireEvent.click(screen.getByRole('button', { name: /imprimir/i }))
    expect(onPrint).toHaveBeenCalledOnce()
  })

  it('shows an accessible error when an action fails', async () => {
    renderButton({ onCopy: vi.fn().mockRejectedValue(new Error('No se pudo copiar.')) })

    fireEvent.click(screen.getByRole('button', { name: /copiar/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('No se pudo copiar.')
    })
  })
})
