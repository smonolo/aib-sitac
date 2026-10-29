import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActorDialog } from './ActorDialog'
import { clearActor, readActor, writeActor } from '@/lib/storage'

describe('ActorDialog', () => {
  beforeEach(() => {
    window.localStorage.clear()
    clearActor()
  })

  test('does not render when closed', () => {
    const { container } = render(
      <ActorDialog open={false} onClose={() => {}} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  test('loads existing actor and saves trimmed name', async () => {
    const user = userEvent.setup()
    writeActor('Sala')
    const onChange = jest.fn()
    const onClose = jest.fn()
    render(<ActorDialog open onClose={onClose} onChange={onChange} />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('Sala')
    await user.clear(input)
    await user.type(input, '  Capo  ')
    await user.click(screen.getByRole('button', { name: 'Salva' }))
    expect(readActor()).toBe('Capo')
    expect(onChange).toHaveBeenCalledWith('Capo')
    expect(onClose).toHaveBeenCalled()
  })

  test('Esci clears actor profile', async () => {
    const user = userEvent.setup()
    writeActor('Sala')
    const onChange = jest.fn()
    render(<ActorDialog open onClose={() => {}} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: 'Esci' }))
    expect(readActor()).toBe('')
    expect(onChange).toHaveBeenCalledWith('')
  })
})
