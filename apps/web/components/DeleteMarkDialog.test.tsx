import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DeleteMarkDialog } from './DeleteMarkDialog'

describe('DeleteMarkDialog', () => {
  test('does not render when closed', () => {
    const { container } = render(
      <DeleteMarkDialog open={false} onConfirm={() => {}} onCancel={() => {}} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  test('shows generic body without mark label', () => {
    render(<DeleteMarkDialog open onConfirm={() => {}} onCancel={() => {}} />)
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Rimuovere questo segno dalla mappa?'
    )
  })

  test('shows named body when markLabel is set', () => {
    render(
      <DeleteMarkDialog
        open
        markLabel="Punto raccolta"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    )
    expect(screen.getByRole('dialog')).toHaveTextContent('Punto raccolta')
  })

  test('confirm and cancel callbacks', async () => {
    const user = userEvent.setup()
    const onConfirm = jest.fn()
    const onCancel = jest.fn()
    render(<DeleteMarkDialog open onConfirm={onConfirm} onCancel={onCancel} />)
    await user.click(screen.getByRole('button', { name: 'Elimina' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    await user.click(screen.getByText('Annulla'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  test('busy disables actions and backdrop cancel', async () => {
    const user = userEvent.setup()
    const onConfirm = jest.fn()
    const onCancel = jest.fn()
    const { container } = render(
      <DeleteMarkDialog open busy onConfirm={onConfirm} onCancel={onCancel} />
    )
    expect(screen.getByRole('button', { name: 'Elimina' })).toBeDisabled()
    expect(screen.getByText('Annulla')).toBeDisabled()
    await user.click(container.firstChild as Element)
    expect(onCancel).not.toHaveBeenCalled()
  })
})
