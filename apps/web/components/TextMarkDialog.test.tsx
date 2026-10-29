import type { ComponentProps } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TextMarkDialog } from './TextMarkDialog'

function renderDialog(
  overrides: Partial<ComponentProps<typeof TextMarkDialog>> = {}
) {
  const props = {
    open: true,
    value: '',
    confirmLabel: 'Aggiungi',
    onChange: jest.fn(),
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
    ...overrides,
  }
  const view = render(<TextMarkDialog {...props} />)
  return { ...view, props }
}

describe('TextMarkDialog', () => {
  test('does not render when closed', () => {
    const { container } = renderDialog({ open: false })
    expect(container).toBeEmptyDOMElement()
  })

  test('shows custom confirm label and disables empty submit', () => {
    renderDialog({ confirmLabel: 'Salva', value: '' })
    expect(screen.getByRole('button', { name: 'Salva' })).toBeDisabled()
  })

  test('disables submit for whitespace-only value', () => {
    renderDialog({ value: '   ', confirmLabel: 'Salva' })
    expect(screen.getByRole('button', { name: 'Salva' })).toBeDisabled()
  })

  test('enables submit for non-empty value', () => {
    renderDialog({ value: 'ok', confirmLabel: 'Salva' })
    expect(screen.getByRole('button', { name: 'Salva' })).toBeEnabled()
  })

  test('calls onChange while typing', async () => {
    const user = userEvent.setup()
    const { props } = renderDialog({ confirmLabel: 'Salva' })
    await user.type(screen.getByRole('textbox'), 'Ciao')
    expect(props.onChange).toHaveBeenCalled()
  })

  test('confirms via submit button', async () => {
    const user = userEvent.setup()
    const { props } = renderDialog({
      value: '  etichetta  ',
      confirmLabel: 'Salva',
    })
    await user.click(screen.getByRole('button', { name: 'Salva' }))
    expect(props.onConfirm).toHaveBeenCalledTimes(1)
  })

  test('confirms via Enter in the input', async () => {
    const user = userEvent.setup()
    const { props } = renderDialog({
      value: 'via tastiera',
      confirmLabel: 'Aggiungi',
    })
    await user.type(screen.getByRole('textbox'), '{Enter}')
    expect(props.onConfirm).toHaveBeenCalledTimes(1)
  })

  test('Enter with blank value does not confirm', async () => {
    const user = userEvent.setup()
    const { props } = renderDialog({ value: '   ', confirmLabel: 'Aggiungi' })
    await user.type(screen.getByRole('textbox'), '{Enter}')
    expect(props.onConfirm).not.toHaveBeenCalled()
  })

  test('footer cancel closes without confirm', async () => {
    const user = userEvent.setup()
    const { props } = renderDialog({ value: 'x' })
    await user.click(screen.getByText('Annulla'))
    expect(props.onCancel).toHaveBeenCalledTimes(1)
    expect(props.onConfirm).not.toHaveBeenCalled()
  })

  test('header close button cancels', async () => {
    const user = userEvent.setup()
    const { props } = renderDialog({ value: 'x' })
    const [headerClose] = screen.getAllByRole('button', { name: 'Annulla' })
    await user.click(headerClose!)
    expect(props.onCancel).toHaveBeenCalledTimes(1)
    expect(props.onConfirm).not.toHaveBeenCalled()
  })

  test('backdrop click cancels', async () => {
    const user = userEvent.setup()
    const { props, container } = renderDialog({ value: 'x' })
    await user.click(container.firstChild as Element)
    expect(props.onCancel).toHaveBeenCalledTimes(1)
    expect(props.onConfirm).not.toHaveBeenCalled()
  })

  test('clicking the panel does not cancel', async () => {
    const user = userEvent.setup()
    const { props } = renderDialog({ value: 'x' })
    await user.click(screen.getByRole('dialog'))
    expect(props.onCancel).not.toHaveBeenCalled()
  })
})
