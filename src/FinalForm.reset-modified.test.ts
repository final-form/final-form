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
