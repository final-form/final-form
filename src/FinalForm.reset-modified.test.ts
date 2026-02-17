import createForm from './FinalForm'

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
