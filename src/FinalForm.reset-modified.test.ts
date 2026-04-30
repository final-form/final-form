import createForm from './FinalForm'

describe('FinalForm.reset-modified', () => {
  it('should clear meta.modified after form.reset()', () => {
    const onSubmit = jest.fn()
    const form = createForm({ onSubmit })

    // Register field and subscribe to modified state
    const fieldSpy = jest.fn()
    form.registerField(
      'testField',
      fieldSpy,
      { value: true, modified: true }
    )

    // Initial state: field not modified
    expect(fieldSpy).toHaveBeenCalledTimes(1)
    expect(fieldSpy.mock.calls[0][0].modified).toBe(false)

    // Change field value
    form.change('testField', 'new value')
    expect(fieldSpy.mock.calls[fieldSpy.mock.calls.length - 1][0].modified).toBe(true)

    // Reset form
    form.reset()

    // BUG: meta.modified should be false after reset
    expect(fieldSpy.mock.calls[fieldSpy.mock.calls.length - 1][0].modified).toBe(false)
  })

  it('should clear meta.modified after form.initialize()', () => {
    const onSubmit = jest.fn()
    const form = createForm({ onSubmit, initialValues: { testField: 'initial' } })

    const fieldSpy = jest.fn()
    form.registerField(
      'testField',
      fieldSpy,
      { value: true, modified: true }
    )

    // Change field value
    form.change('testField', 'new value')
    expect(fieldSpy.mock.calls[fieldSpy.mock.calls.length - 1][0].modified).toBe(true)

    // Initialize with new values
    form.initialize({ testField: 'new initial' })

    // BUG: meta.modified should be false after initialize
    expect(fieldSpy.mock.calls[fieldSpy.mock.calls.length - 1][0].modified).toBe(false)
  })
})

describe('FinalForm.reset - Issue #317', () => {
  it('should clear field modified flag after reset', () => {
    const form = createForm({
      onSubmit: () => {},
      initialValues: { name: 'initial' },
    })

    let fieldState: any
    form.registerField('name', (state) => {
      fieldState = state
    }, { value: true, modified: true })

    // Field should start with modified = false
    expect(fieldState.modified).toBe(false)

    // Change the value
    form.change('name', 'changed')

    // Now modified should be true
    expect(fieldState.modified).toBe(true)

    // Reset the form
    form.reset()

    // BUG: modified should be false after reset, but it stays true
    expect(fieldState.modified).toBe(false)
  })

  it('should clear field modified flag after initialize with same value', () => {
    const form = createForm({
      onSubmit: () => {},
      initialValues: { name: 'initial' },
    })

    let fieldState: any
    form.registerField('name', (state) => {
      fieldState = state
    }, { value: true, modified: true })

    // Change the value
    form.change('name', 'changed')
    expect(fieldState.modified).toBe(true)

    // Initialize with a value that matches current value
    form.initialize({ name: 'changed' })

    // modified should be false because current value matches new initial value
    expect(fieldState.modified).toBe(false)
  })
})
