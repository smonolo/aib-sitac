import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MarkInfoDialog } from './MarkInfoDialog'

describe('MarkInfoDialog', () => {
  test('does not render when closed', () => {
    const { container } = render(
      <MarkInfoDialog
        open={false}
        title="Testo"
        purpose="p"
        howTo="h"
        onClose={() => {}}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })

  test('shows title purpose and how-to', () => {
    render(
      <MarkInfoDialog
        open
        title="Punto raccolta"
        kindLabel="testo"
        symbolId="note"
        purpose="Serve a etichettare."
        howTo="Tocca Modifica."
        onClose={() => {}}
      />
    )
    expect(screen.getByRole('dialog')).toHaveTextContent('Punto raccolta')
    expect(screen.getByRole('dialog')).toHaveTextContent('testo')
    expect(screen.getByRole('dialog')).toHaveTextContent('Serve a etichettare.')
    expect(screen.getByRole('dialog')).toHaveTextContent('Tocca Modifica.')
  })

  test('close button and backdrop call onClose', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    const { container } = render(
      <MarkInfoDialog open title="X" purpose="p" howTo="h" onClose={onClose} />
    )
    await user.click(screen.getByRole('button', { name: 'Chiudi' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    await user.click(container.firstChild as Element)
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
