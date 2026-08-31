import { fireEvent, render, screen } from '@testing-library/react'

import { CreateUserModal } from './create-user-modal'
import { InviteUserModal } from './invite-user-modal'

/**
 * Covers the Figma modal frames 2341:1347 (Create User) and 2341:1420
 * (Invite User): the fields each one shows, and the gating on their primary
 * action.
 */

describe('InviteUserModal', () => {
  it('renders the Figma title, description and email field', () => {
    render(<InviteUserModal open onClose={jest.fn()} onSubmit={jest.fn()} />)

    expect(screen.getByRole('heading', { name: 'Invite User' })).toBeInTheDocument()
    expect(screen.getByText('Send an invitation to join your organization.')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('john@2company.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send Invitation' })).toBeDisabled()
  })

  it('enables Send Invitation once the email is valid and reports it', () => {
    const onSubmit = jest.fn()
    render(<InviteUserModal open onClose={jest.fn()} onSubmit={onSubmit} />)

    fireEvent.change(screen.getByPlaceholderText('john@2company.com'), {
      target: { value: 'jon.haley@example.com' },
    })

    const submit = screen.getByRole('button', { name: 'Send Invitation' })
    expect(submit).toBeEnabled()
    fireEvent.click(submit)

    expect(onSubmit).toHaveBeenCalledWith('jon.haley@example.com')
  })

  it('flags an invalid email on blur', () => {
    render(<InviteUserModal open onClose={jest.fn()} onSubmit={jest.fn()} />)

    const input = screen.getByPlaceholderText('john@2company.com')
    fireEvent.change(input, { target: { value: 'not-an-email' } })
    fireEvent.blur(input)

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address')
  })

  it("shows a non-blocking domain-mismatch hint when the email domain differs from the owner's", () => {
    const onSubmit = jest.fn()
    render(
      <InviteUserModal open onClose={jest.fn()} onSubmit={onSubmit} ownerDomain="acmecorp.com" />,
    )

    fireEvent.change(screen.getByPlaceholderText('john@2company.com'), {
      target: { value: 'someone@othercorp.com' },
    })

    expect(
      screen.getByText('This must match your own company email domain to send an invite.'),
    ).toBeInTheDocument()
    // Non-blocking — the server enforces the real rule, submit stays enabled.
    const submit = screen.getByRole('button', { name: 'Send Invitation' })
    expect(submit).toBeEnabled()
    fireEvent.click(submit)
    expect(onSubmit).toHaveBeenCalledWith('someone@othercorp.com')
  })

  it("shows no hint once the email domain matches the owner's", () => {
    render(
      <InviteUserModal open onClose={jest.fn()} onSubmit={jest.fn()} ownerDomain="acmecorp.com" />,
    )

    fireEvent.change(screen.getByPlaceholderText('john@2company.com'), {
      target: { value: 'jane@acmecorp.com' },
    })

    expect(
      screen.queryByText('This must match your own company email domain to send an invite.'),
    ).not.toBeInTheDocument()
  })
})

describe('CreateUserModal', () => {
  function fillValidForm() {
    fireEvent.change(screen.getByPlaceholderText('Enter First Name'), {
      target: { value: 'Jon' },
    })
    fireEvent.change(screen.getByPlaceholderText('Enter Last Name'), {
      target: { value: 'Haley' },
    })
    fireEvent.change(screen.getByPlaceholderText('john@2company.com'), {
      target: { value: 'jon.haley@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Enter Password'), {
      target: { value: 'Str0ng!Pass' },
    })
    fireEvent.change(screen.getByPlaceholderText('Confirm Password'), {
      target: { value: 'Str0ng!Pass' },
    })
  }

  it('renders both Figma sections with their fields', () => {
    render(<CreateUserModal open onClose={jest.fn()} onSubmit={jest.fn()} />)

    expect(screen.getByRole('heading', { name: 'Create User' })).toBeInTheDocument()
    expect(
      screen.getByText('Create new user directly through administrative authority.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Create Password' })).toBeInTheDocument()
    expect(
      screen.getByText('Choose a secure password to protect your account.'),
    ).toBeInTheDocument()

    expect(screen.getByPlaceholderText('Enter First Name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter Last Name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter Phone Number')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Confirm Password')).toBeInTheDocument()
  })

  it('shows the five password rule pills', () => {
    render(<CreateUserModal open onClose={jest.fn()} onSubmit={jest.fn()} />)

    for (const rule of [
      'Length ≥ 8',
      '1 small letter',
      '1 capital letter',
      '1 special character',
      '1 digit',
    ]) {
      expect(screen.getByText(rule)).toBeInTheDocument()
    }
  })

  it('keeps Create & Notify disabled until every requirement is met', () => {
    render(<CreateUserModal open onClose={jest.fn()} onSubmit={jest.fn()} />)

    expect(screen.getByRole('button', { name: 'Create & Notify' })).toBeDisabled()

    fillValidForm()

    expect(screen.getByRole('button', { name: 'Create & Notify' })).toBeEnabled()
  })

  it('blocks submission while the passwords differ', () => {
    render(<CreateUserModal open onClose={jest.fn()} onSubmit={jest.fn()} />)

    fillValidForm()
    const confirm = screen.getByPlaceholderText('Confirm Password')
    fireEvent.change(confirm, { target: { value: 'Different1!' } })
    fireEvent.blur(confirm)

    expect(screen.getByRole('alert')).toHaveTextContent('Passwords do not match')
    expect(screen.getByRole('button', { name: 'Create & Notify' })).toBeDisabled()
  })

  it('submits the collected values', () => {
    const onSubmit = jest.fn()
    render(<CreateUserModal open onClose={jest.fn()} onSubmit={onSubmit} />)

    fillValidForm()
    fireEvent.change(screen.getByPlaceholderText('Enter Phone Number'), {
      target: { value: '7700900123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create & Notify' }))

    expect(onSubmit).toHaveBeenCalledWith({
      firstName: 'Jon',
      lastName: 'Haley',
      email: 'jon.haley@example.com',
      phoneCode: '',
      phone: '7700900123',
      password: 'Str0ng!Pass',
    })
  })
})
