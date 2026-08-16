import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ExportButton } from './index'

describe('ExportButton', () => {
  it('offers Excel and PDF without duplicating the tabular export as CSV', () => {
    render(<ExportButton onExport={vi.fn().mockResolvedValue(undefined)} />)

    expect(screen.getByRole('button', { name: /excel/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /pdf/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /csv/i })).not.toBeInTheDocument()
  })

  it.each([
    ['Excel', 'excel'],
    ['PDF', 'pdf'],
  ] as const)('exports %s with the expected format', async (label, format) => {
    const onExport = vi.fn().mockResolvedValue(undefined)
    render(<ExportButton onExport={onExport} />)

    fireEvent.click(screen.getByRole('button', { name: new RegExp(label, 'i') }))

    expect(onExport).toHaveBeenCalledWith(format)
  })
})
