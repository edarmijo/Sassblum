import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { useTabParam } from './useTabParam'

const TABS = ['list', 'create'] as const

function Harness() {
  const tab = useTabParam('list', TABS)
  const { search } = useLocation()
  return (
    <>
      <p data-testid="activa">{tab.value}</p>
      <p data-testid="query">{search}</p>
      <button type="button" onClick={() => tab.onValueChange('create')}>Crear</button>
      <button type="button" onClick={() => tab.onValueChange('list')}>Listado</button>
    </>
  )
}

function renderAt(entry: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Harness />
    </MemoryRouter>,
  )
}

describe('useTabParam', () => {
  it('usa la pestaña por defecto cuando la URL no la especifica', () => {
    renderAt('/mis-tickets')

    expect(screen.getByTestId('activa')).toHaveTextContent('list')
    expect(screen.getByTestId('query')).toHaveTextContent('')
  })

  it('abre la pestaña indicada en la URL (vista enlazable)', () => {
    renderAt('/mis-tickets?tab=create')

    expect(screen.getByTestId('activa')).toHaveTextContent('create')
  })

  it('degrada al valor por defecto ante una pestaña desconocida', () => {
    renderAt('/mis-tickets?tab=inventada')

    expect(screen.getByTestId('activa')).toHaveTextContent('list')
  })

  it('escribe la pestaña en la URL al cambiarla', async () => {
    const user = userEvent.setup()
    renderAt('/mis-tickets')

    await user.click(screen.getByRole('button', { name: 'Crear' }))

    expect(screen.getByTestId('query')).toHaveTextContent('?tab=create')
  })

  it('deja la URL limpia al volver a la pestaña por defecto', async () => {
    const user = userEvent.setup()
    renderAt('/mis-tickets?tab=create')

    await user.click(screen.getByRole('button', { name: 'Listado' }))

    expect(screen.getByTestId('query')).toHaveTextContent('')
    expect(screen.getByTestId('activa')).toHaveTextContent('list')
  })

  it('conserva el resto de la query al cambiar de pestaña', async () => {
    const user = userEvent.setup()
    renderAt('/mis-tickets?estado=Nuevo')

    await user.click(screen.getByRole('button', { name: 'Crear' }))

    expect(screen.getByTestId('query')).toHaveTextContent('estado=Nuevo')
    expect(screen.getByTestId('query')).toHaveTextContent('tab=create')
  })
})
