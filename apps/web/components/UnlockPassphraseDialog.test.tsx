import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UnlockPassphraseDialog } from './UnlockPassphraseDialog'

const push = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))

describe('UnlockPassphraseDialog', () => {
  beforeEach(() => {
    push.mockReset()
  })

  test('does not render when closed', () => {
    const { container } = render(
      <UnlockPassphraseDialog open={false} onSubmit={() => {}} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  test('disables unlock for blank password', () => {
    render(<UnlockPassphraseDialog open onSubmit={() => {}} />)
    expect(screen.getByRole('button', { name: 'Sblocca' })).toBeDisabled()
  })

  test('submits trimmed passphrase', async () => {
    const user = userEvent.setup()
    const onSubmit = jest.fn()
    render(<UnlockPassphraseDialog open onSubmit={onSubmit} />)
    await user.type(screen.getByLabelText('Password'), '  segreto  ')
    await user.click(screen.getByRole('button', { name: 'Sblocca' }))
    expect(onSubmit).toHaveBeenCalledWith('segreto')
  })

  test('shows error and busy state', () => {
    render(
      <UnlockPassphraseDialog
        open
        busy
        error="Password non corretta."
        onSubmit={() => {}}
      />
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Password non corretta.'
    )
    expect(screen.getByRole('button', { name: 'Caricamento…' })).toBeDisabled()
    expect(screen.getByLabelText('Password')).toBeDisabled()
  })

  test('home button navigates away', async () => {
    const user = userEvent.setup()
    render(<UnlockPassphraseDialog open onSubmit={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'Torna alla home' }))
    expect(push).toHaveBeenCalledWith('/')
  })

  test('does not submit while busy', async () => {
    const user = userEvent.setup()
    const onSubmit = jest.fn()
    render(<UnlockPassphraseDialog open busy onSubmit={onSubmit} />)
    await user.type(screen.getByLabelText('Password'), 'x')
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
